from typing import Dict, Any
from services.state_store import state_store

def get_governance_score() -> Dict[str, Any]:
    overview = state_store.governance_overview()
    return {
        "score": overview["score"],
        "category": overview["category"],
        "metrics": overview["metrics"],
        "explainable_contributions": overview["explainable_contributions"],
    }

def get_district_forecast(district: str | None = None) -> Dict[str, Any]:
    return state_store.get_district_forecast(district=district)

def get_workload_balancer(district: str | None = None) -> Dict[str, Any]:
    return state_store.get_workload(district=district)

def get_knowledge_graph(district: str | None = None) -> Dict[str, Any]:
    return state_store.get_knowledge_graph(district=district)


def get_system_overview() -> Dict[str, Any]:
    return state_store.governance_overview()

def simulate_governance_scenario(grievance_volume_change: float) -> Dict[str, Any]:
    baseline = state_store.governance_overview()
    simulated_volume = int(baseline["metrics"]["grievance_volume"] * (1 + grievance_volume_change / 100))
    unresolved_cases = int(baseline["metrics"]["unresolved_cases"] * (1 + max(0.0, grievance_volume_change) / 80))
    escalation_count = int(baseline["metrics"]["escalation_count"] * (1 + max(0.0, grievance_volume_change) / 45))
    rejection_rate = baseline["metrics"]["rejection_rate"]
    scheme_coverage_gap = baseline["metrics"]["scheme_coverage_gap"]

    score = 100 - ((simulated_volume * 0.02) + (rejection_rate * 0.5) + (unresolved_cases * 0.13) + (escalation_count * 1.35) + (scheme_coverage_gap * 0.2))
    score = max(0.0, min(100.0, round(score, 1)))
    category = "Stable" if score >= 75 else "Moderate Risk" if score >= 50 else "Critical"

    return {
        "scenario_input": f"{grievance_volume_change}% grievance volume change",
        "simulated_score": score,
        "simulated_category": category,
        "metrics_impact": {
            "new_volume": simulated_volume,
            "new_unresolved": unresolved_cases,
            "new_escalations": escalation_count
        },
        "explainable_contributions": [
            f"Volume shifted to {simulated_volume}, shifting unresolved cases to {unresolved_cases}.",
            f"Escalations moved to {escalation_count}, dragging the final score to {score}."
        ]
    }
