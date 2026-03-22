"""
Speech-to-Text Service — Whisper-based transcription for voice and video complaints.

Tries to use OpenAI Whisper if available, otherwise falls back to the
transcript provided by the frontend (Web Speech API).
"""

import os
import tempfile
import subprocess
from typing import Dict, Any, Optional
from utils.logger import logger

# Ensure the bundled ffmpeg binary is on PATH so Whisper can find it.
# imageio_ffmpeg ships a binary with a versioned name (e.g. ffmpeg-win-x86_64-v7.1.exe).
# Whisper expects a plain "ffmpeg" / "ffmpeg.exe" on PATH, so we create a hard link.
try:
    import imageio_ffmpeg
    _ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    _ffmpeg_dir = os.path.dirname(_ffmpeg_exe)
    _ffmpeg_link = os.path.join(_ffmpeg_dir, "ffmpeg.exe")
    if not os.path.exists(_ffmpeg_link):
        os.link(_ffmpeg_exe, _ffmpeg_link)
        logger.info(f"[SpeechService] Created hard link: {_ffmpeg_link}")
    if _ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = _ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
        logger.info(f"[SpeechService] Added imageio_ffmpeg to PATH: {_ffmpeg_dir}")
except ImportError:
    pass

# Try to load Whisper
WHISPER_AVAILABLE = False
_whisper_model = None

try:
    import whisper  # type: ignore[import-unresolved]
    WHISPER_AVAILABLE = True
    logger.info("[SpeechService] OpenAI Whisper is available.")
except ImportError:
    whisper = None
    logger.warning("[SpeechService] OpenAI Whisper not installed. Using fallback transcript mode.")


def _load_whisper_model():
    """Lazy-load the Whisper model on first use."""
    global _whisper_model
    if _whisper_model is None and WHISPER_AVAILABLE and whisper is not None:
        logger.info("[SpeechService] Loading Whisper 'small' model...")
        _whisper_model = whisper.load_model("small")
        logger.info("[SpeechService] Whisper model loaded.")
    return _whisper_model


def transcribe_audio(audio_path: str) -> Dict[str, Any]:
    """
    Transcribe an audio file using Whisper.

    Returns:
        {
            "transcript": str,
            "language": str,
            "confidence": float,
            "method": "whisper" | "fallback",
        }
    """
    if not os.path.exists(audio_path):
        logger.error(f"[SpeechService] Audio file not found: {audio_path}")
        return {
            "transcript": "",
            "language": "unknown",
            "confidence": 0.0,
            "method": "error",
            "error": "Audio file not found",
        }

    if WHISPER_AVAILABLE:
        try:
            model = _load_whisper_model()
            if model is None:
                raise RuntimeError("Whisper model failed to load")
            logger.info(f"[SpeechService] Transcribing audio: {audio_path} "
                        f"(size={os.path.getsize(audio_path)} bytes)")
            result = model.transcribe(audio_path)
            transcript = result.get("text", "").strip()
            language = result.get("language", "unknown")

            # Estimate confidence from segment probabilities
            segments = result.get("segments", [])
            if segments:
                import math
                avg_prob = sum(s.get("avg_logprob", -1.0) for s in segments) / len(segments)
                confidence = min(0.99, max(0.1, math.exp(avg_prob)))
            else:
                # No segments → no speech detected → confidence must be 0
                confidence = 0.0

            # Empty transcript means STT failed to detect speech
            if not transcript:
                logger.warning(
                    f"[SpeechService] Whisper returned empty transcript "
                    f"(lang={language}, segments={len(segments)}). "
                    f"Audio may be silent or contain no speech."
                )
                confidence = 0.0
            else:
                logger.info(
                    f"[SpeechService] Transcript: \"{transcript[:120]}\"")

            logger.info(
                f"[SpeechService] Transcription complete: lang={language}, "
                f"confidence={confidence:.2f}, length={len(transcript)}"
            )

            # If non-English, also produce an English translation
            translation_en = ""
            if transcript and language != "en":
                try:
                    logger.info(f"[SpeechService] Translating to English (task=translate)...")
                    translate_result = model.transcribe(audio_path, task="translate")
                    translation_en = translate_result.get("text", "").strip()
                    logger.info(f"[SpeechService] English translation: \"{translation_en[:120]}\"")
                except Exception as te:
                    logger.warning(f"[SpeechService] Translation failed: {te}")

            # Store the original Hindi transcript separately
            transcript_hi = transcript if language != "en" else ""

            return {
                "transcript": transcript,
                "transcript_hi": transcript_hi,
                "language": language,
                "confidence": round(confidence, 2),
                "method": "whisper",
                "translation_en": translation_en,
            }
        except Exception as e:
            logger.error(f"[SpeechService] Whisper transcription failed: {e}")
            return {
                "transcript": "",
                "transcript_hi": "",
                "language": "unknown",
                "confidence": 0.0,
                "method": "error",
                "error": str(e),
                "translation_en": "",
            }
    else:
        return {
            "transcript": "",
            "transcript_hi": "",
            "language": "unknown",
            "confidence": 0.0,
            "method": "unavailable",
            "error": "Whisper not installed. Install with: pip install openai-whisper",
            "translation_en": "",
        }


def _get_ffmpeg_path() -> str:
    """Return path to ffmpeg binary — prefer imageio_ffmpeg bundled binary."""
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return "ffmpeg"  # fallback to system PATH


def extract_audio_from_video(video_path: str) -> Optional[str]:
    """
    Extract audio from a video file using ffmpeg.

    Returns the path to the extracted WAV file, or None on failure.
    """
    try:
        tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        audio_path = tmp.name
        tmp.close()
        ffmpeg_bin = _get_ffmpeg_path()
        cmd = [
            ffmpeg_bin, "-i", video_path,
            "-t", "20",           # first 20 seconds only
            "-vn",                  # no video
            "-acodec", "pcm_s16le", # PCM 16-bit
            "-ar", "16000",         # 16kHz sample rate (Whisper default)
            "-ac", "1",             # mono
            "-y",                   # overwrite
            audio_path,
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            logger.error(f"[SpeechService] ffmpeg failed: {result.stderr[:500]}")
            return None

        logger.info(f"[SpeechService] Audio extracted: {audio_path}")
        return audio_path
    except FileNotFoundError:
        logger.error("[SpeechService] ffmpeg not found. Install ffmpeg or imageio-ffmpeg.")
        return None
    except subprocess.TimeoutExpired:
        logger.error("[SpeechService] ffmpeg timed out.")
        return None
    except Exception as e:
        logger.error(f"[SpeechService] Audio extraction failed: {e}")
        return None


def process_video_complaint(video_path: str, fallback_transcript: str = "") -> Dict[str, Any]:
    """
    Full pipeline: extract audio from video → transcribe → return result.

    If Whisper/ffmpeg are unavailable, uses the fallback transcript.
    """
    logger.info(f"[SpeechService] Video received: {video_path} "
                f"(exists={os.path.exists(video_path)}, "
                f"size={os.path.getsize(video_path) if os.path.exists(video_path) else 0} bytes)")

    # Stage 1: Extract audio from video
    audio_path = extract_audio_from_video(video_path)
    if audio_path:
        logger.info(f"[SpeechService] Audio extracted: {audio_path} "
                    f"(size={os.path.getsize(audio_path)} bytes)")

        # Stage 2: Transcribe the extracted audio
        result = transcribe_audio(audio_path)

        # Clean up temp file
        try:
            os.unlink(audio_path)
        except OSError:
            pass

        if result["transcript"]:
            logger.info(f"[SpeechService] Transcript: \"{result['transcript'][:120]}\"")
            return result
        else:
            logger.warning("[SpeechService] Whisper returned empty transcript from extracted audio.")
    else:
        logger.warning("[SpeechService] Audio extraction failed — no audio file produced.")

    # Fallback: use the provided transcript (from frontend Web Speech API)
    if fallback_transcript:
        logger.info(f"[SpeechService] Using fallback transcript: \"{fallback_transcript[:120]}\"")
        return {
            "transcript": fallback_transcript,
            "transcript_hi": "",
            "language": "auto",
            "confidence": 0.80,
            "method": "fallback",
            "translation_en": "",
        }

    logger.error("[SpeechService] No transcript available \u2014 STT failed and no fallback provided.")
    return {
        "transcript": "",
        "transcript_hi": "",
        "language": "unknown",
        "confidence": 0.0,
        "method": "none",
        "error": "No transcript available. Install Whisper and ffmpeg for automatic transcription.",
        "translation_en": "",
    }


def process_audio_complaint(audio_path: str, fallback_transcript: str = "") -> Dict[str, Any]:
    """
    Process a voice complaint audio file.
    """
    result = transcribe_audio(audio_path)
    if result["transcript"]:
        return result

    if fallback_transcript:
        return {
            "transcript": fallback_transcript,
            "transcript_hi": "",
            "language": "auto",
            "confidence": 0.80,
            "method": "fallback",
            "translation_en": "",
        }

    return result
