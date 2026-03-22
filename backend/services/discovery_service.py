"""
Beneficiary Discovery Service.

Uses the in-memory state_store citizens (600 generated records across 5 districts).
Eligibility rules:
  1. gender == female
  2. income < 80,000
  3. NOT already in a simulated enrolled list
  4. family_id pattern ending in -00xx (simulates deceased head-of-household cohort)

Returns results sorted by confidence score descending.
"""
from typing import Dict, Any
from services.state_store import state_store
from utils.logger import logger


# Simulate already-enrolled Aadhaar IDs (first 20 female citizens are assumed enrolled)
def _get_enrolled_ids() -> set:
    enrolled = set()
    count = 0
    for c in state_store.citizens:
        if c["gender"] == "female" and count < 20:
            enrolled.add(c["aadhaar_id"])
            count += 1
    return enrolled


# Simulate death records: family_ids where the last segment is even (representing male head deceased)
def _is_bereaved_family(family_id: str) -> bool:
    try:
        seq = int(family_id.split("-")[-1])
        return seq % 3 == 0  # every 3rd family has a death record (realistic ~33%)
    except (ValueError, IndexError):
        return False


def _confidence_score(citizen: Dict[str, Any]) -> float:
    """Heuristic confidence: lower income → higher confidence. Max 95."""
    income_factor = max(0, (80000 - citizen["income"]) / 80000)
    base = 55 + income_factor * 40  # 55–95 range
    return round(base, 1)


def discover_beneficiaries(district: str | None = None) -> Dict[str, Any]:
    logger.info(f"[Beneficiary Discovery] Starting scan — district='{district or 'ALL'}'")

    enrolled_ids = _get_enrolled_ids()
    candidates = []
    total_scanned = 0

    for citizen in state_store.citizens:
        if district and citizen["district"] != district:
            continue

        total_scanned += 1

        # Eligibility Rule 1: Must be female
        if citizen["gender"] != "female":
            continue

        # Eligibility Rule 2: Income below BPL threshold
        if citizen["income"] >= 80000:
            continue

        # Eligibility Rule 3: Not already enrolled
        if citizen["aadhaar_id"] in enrolled_ids:
            continue

        # Eligibility Rule 4: Bereaved family (simulated death record)
        bereaved = _is_bereaved_family(citizen["family_id"])

        score = _confidence_score(citizen)
        # Boost score if bereaved family flag is set
        if bereaved:
            score = min(95.0, score + 12)

        status = "high_confidence" if score >= 72 else "low_confidence"

        reason_parts = [
            f"Income ₹{citizen['income']:,} is below ₹80,000 BPL threshold.",
        ]
        if bereaved:
            reason_parts.append(f"Death record found for family {citizen['family_id']}.")
        reason_parts.append(f"Not currently enrolled in pension scheme.")

        candidates.append({
            "aadhaar_id": citizen["aadhaar_id"],
            "name": citizen["name"],
            "district": citizen["district"],
            "income": citizen["income"],
            "gender": citizen["gender"],
            "family_id": citizen["family_id"],
            "confidence_score": score,
            "status": status,
            "ration_match_found": bereaved,
            "explainability_reason": " ".join(reason_parts),
        })

    candidates.sort(key=lambda x: x["confidence_score"], reverse=True)
    high_conf_count = sum(1 for c in candidates if c["status"] == "high_confidence")

    logger.info(
        f"[Beneficiary Discovery] Scanned {total_scanned} citizens | "
        f"Found {len(candidates)} eligible | High confidence: {high_conf_count}"
    )

    return {
        "district": district or "All Districts",
        "total_scanned": total_scanned,
        "eligible_count": len(candidates),
        "high_confidence_count": high_conf_count,
        "list_of_candidates": candidates,
    }
