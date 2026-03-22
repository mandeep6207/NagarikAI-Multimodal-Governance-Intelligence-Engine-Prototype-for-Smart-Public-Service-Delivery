"""
Grievance Intelligence Service — AI classification, SLA prediction, escalation.

Classification uses a two-stage approach:
  1. Keyword detection (Hindi + English) for deterministic matching.
  2. Sentence-transformer embedding similarity as fallback.
"""
from ml.models import ml_registry
import numpy as np
from typing import Dict, Any, Optional, Tuple
from utils.logger import logger
from datetime import datetime

# In-memory history for duplicate detection (session-scoped)
grievance_history = []

# ── Keyword-based department classification ──────────────────
# Maps (keyword → department).  Both Hindi and English keywords included.
KEYWORD_MAP = [
    # Social Welfare
    ("pension",        "Social Welfare"),
    ("पेंशन",          "Social Welfare"),
    ("widow",          "Social Welfare"),
    ("विधवा",          "Social Welfare"),
    ("disability",     "Social Welfare"),
    ("विकलांग",        "Social Welfare"),
    ("old age",        "Social Welfare"),
    ("वृद्धावस्था",     "Social Welfare"),
    ("samaj kalyan",   "Social Welfare"),
    ("समाज कल्याण",    "Social Welfare"),
    # Education
    ("scholarship",    "Education"),
    ("छात्रवृत्ति",     "Education"),
    ("school",         "Education"),
    ("स्कूल",          "Education"),
    ("college",        "Education"),
    ("कॉलेज",         "Education"),
    ("शिक्षा",         "Education"),
    # Electricity
    ("electricity",    "Electricity"),
    ("bijli",          "Electricity"),
    ("बिजली",          "Electricity"),
    ("transformer",    "Electricity"),
    ("ट्रांसफार्मर",    "Electricity"),
    ("power cut",      "Electricity"),
    ("विद्युत",        "Electricity"),
    # Revenue / Food (ration)
    ("ration",         "Revenue"),
    ("राशन",           "Revenue"),
    ("ration card",    "Revenue"),
    ("राशन कार्ड",     "Revenue"),
    ("land record",    "Revenue"),
    ("भूमि",           "Revenue"),
    ("राजस्व",         "Revenue"),
    # Water / PHE
    ("water",          "Water Supply"),
    ("पानी",           "Water Supply"),
    ("जल",            "Water Supply"),
    ("handpump",       "Water Supply"),
    ("हैंडपंप",        "Water Supply"),
    ("borewell",       "Water Supply"),
    ("pipeline",       "Water Supply"),
    ("नल",            "Water Supply"),
    # Health
    ("hospital",       "Health"),
    ("अस्पताल",        "Health"),
    ("medicine",       "Health"),
    ("दवाई",           "Health"),
    ("doctor",         "Health"),
    ("डॉक्टर",         "Health"),
    ("स्वास्थ्य",      "Health"),
    # Agriculture
    ("crop",           "Agriculture"),
    ("फसल",           "Agriculture"),
    ("farmer",         "Agriculture"),
    ("किसान",          "Agriculture"),
    ("कृषि",           "Agriculture"),
    ("insurance",      "Agriculture"),
    ("बीमा",           "Agriculture"),
    # Panchayat
    ("road",           "Panchayat"),
    ("सड़क",           "Panchayat"),
    ("drain",          "Panchayat"),
    ("नाली",           "Panchayat"),
    ("sanitation",     "Panchayat"),
    ("स्वच्छता",       "Panchayat"),
    ("panchayat",      "Panchayat"),
    ("पंचायत",         "Panchayat"),
    ("गांव",           "Panchayat"),
]


def _keyword_classify(text: str) -> Optional[Tuple[str, str]]:
    """Return (department, matched_keyword) if a keyword matches, else None."""
    lower = text.lower()
    for keyword, dept in KEYWORD_MAP:
        if keyword.lower() in lower or keyword in text:
            return dept, keyword
    return None


def analyze_grievance(text: str, urgency: int) -> Dict[str, Any]:
    global grievance_history

    logger.info(f"[Grievance AI] Analyzing text (urgency={urgency}): '{text[:80]}...'")

    # ── Stage 1: Keyword-based classification ────────────────
    kw_result = _keyword_classify(text)
    if kw_result:
        kw_dept, kw_matched = kw_result
        logger.info(f"[Grievance AI] Keyword match: '{kw_matched}' → {kw_dept}")

    # ── Stage 2: Embedding-based similarity ──────────────────
    # 1. Embed the complaint text
    embedding = ml_registry.sentence_model.encode([text])[0]

    # 2. Cosine similarity against department embeddings
    dept_embs = ml_registry.dept_embeddings
    emb_norm = np.linalg.norm(embedding)
    dept_norms = np.linalg.norm(dept_embs, axis=1)
    similarities = np.dot(dept_embs, embedding) / (dept_norms * emb_norm + 1e-10)

    best_idx = int(np.argmax(similarities))
    best_score = float(similarities[best_idx])
    assigned_dept = ml_registry.departments[best_idx]

    # ── Merge: keyword wins when embedding confidence is low ─
    if kw_result:
        kw_dept = kw_result[0]
        # If keyword dept differs from embedding dept and embedding confidence
        # is not very high, trust the keyword.
        if kw_dept != assigned_dept and best_score < 0.70:
            assigned_dept = kw_dept
            best_score = max(best_score, 0.55)  # boost confidence
            logger.info(f"[Grievance AI] Keyword override → {kw_dept}")
        elif kw_dept == assigned_dept:
            best_score = max(best_score, 0.60)  # boost when both agree

    if best_score < 0.25:
        routing = "Manual Review"
        explainability = f"Max similarity {round(best_score, 2)} below threshold — routed to manual review."
    else:
        routing = assigned_dept
        explainability = f"'{assigned_dept}' matched with {round(best_score * 100, 1)}% confidence."

    # 3. SLA prediction
    X_pred = np.array([[urgency, best_idx]])
    predicted_days = float(ml_registry.sla_model.predict(X_pred)[0])
    predicted_days = max(1, round(predicted_days))

    # 4. Duplicate detection
    duplicate_flag = False
    for prev in grievance_history:
        prev_norm = np.linalg.norm(prev["embedding"])
        sim = np.dot(prev["embedding"], embedding) / (prev_norm * emb_norm + 1e-10)
        if sim > 0.90:
            duplicate_flag = True
            logger.warning(f"[Grievance AI] DUPLICATE detected (similarity={round(float(sim), 3)})")
            break

    grievance_history.append({"embedding": embedding, "text": text, "ts": datetime.utcnow().isoformat()})

    # 5. Escalation logic
    escalate = duplicate_flag and urgency >= 4
    if duplicate_flag:
        explainability += " | DUPLICATE flag raised (>90% semantic match)."
    if escalate:
        explainability += " | AUTO-ESCALATED (duplicate + high urgency)."
        logger.warning(f"[Grievance AI] AUTO-ESCALATION triggered for urgency={urgency}")

    logger.info(
        f"[Grievance AI] Result → Dept: {routing}, SLA: {predicted_days}d, "
        f"Duplicate: {duplicate_flag}, Escalate: {escalate}"
    )

    return {
        "department": routing,
        "assigned_department": routing,   # alias for older UI references
        "confidence_score": round(best_score, 2),
        "predicted_resolution_days": predicted_days,
        "duplicate_flag": duplicate_flag,
        "escalation_recommended": escalate,
        "explainability_reason": explainability,
    }
