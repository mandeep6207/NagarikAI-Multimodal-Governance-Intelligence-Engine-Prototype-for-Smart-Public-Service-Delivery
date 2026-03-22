from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
import random
from typing import Any, Dict, List


DISTRICTS = ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"]
DEPARTMENTS = ["Agriculture", "Revenue", "Education", "Panchayat", "Electricity", "Pension"]


def _risk_band(score: float) -> str:
    if score >= 75:
        return "Stable"
    if score >= 50:
        return "Moderate Risk"
    return "Critical"


@dataclass
class GovernanceStateStore:
    seed: int = 42
    citizens: List[Dict[str, Any]] = field(default_factory=list)
    officers: List[Dict[str, Any]] = field(default_factory=list)
    grievances: List[Dict[str, Any]] = field(default_factory=list)
    applications: List[Dict[str, Any]] = field(default_factory=list)
    escalation_logs: List[Dict[str, Any]] = field(default_factory=list)
    district_stats: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    _next_case_id: int = 1

    def __post_init__(self) -> None:
        self._rnd = random.Random(self.seed)
        self._bootstrap()

    def _bootstrap(self) -> None:
        self._generate_citizens()
        self._generate_officers()
        self._generate_history()
        self.recalculate_all()

    def _generate_citizens(self) -> None:
        first_names = ["Sita", "Ravi", "Anita", "Mohan", "Pooja", "Sunil", "Deepa", "Rakesh", "Neha", "Vijay"]
        last_names = ["Verma", "Patel", "Yadav", "Sharma", "Kumar", "Sahu", "Mishra", "Das", "Singh", "Tiwari"]
        for district in DISTRICTS:
            for i in range(120):
                name = f"{self._rnd.choice(first_names)} {self._rnd.choice(last_names)}"
                gender = "female" if self._rnd.random() > 0.47 else "male"
                income = self._rnd.randint(18000, 180000)
                family_id = f"{district[:3].upper()}-F-{i//3:04d}"
                aadhaar_id = f"{district[:3].upper()}A{i:06d}"
                self.citizens.append(
                    {
                        "aadhaar_id": aadhaar_id,
                        "name": name,
                        "gender": gender,
                        "income": income,
                        "district": district,
                        "family_id": family_id,
                        "address": f"Ward {self._rnd.randint(1, 40)}, {district}",
                    }
                )

    def _generate_officers(self) -> None:
        for district in DISTRICTS:
            for idx in range(8):
                self.officers.append(
                    {
                        "id": f"{district[:3].upper()}-O-{idx+1:02d}",
                        "name": f"Officer {district[:2].upper()}-{idx+1}",
                        "district": district,
                        "role": "district_officer",
                    }
                )

    def _generate_history(self) -> None:
        now = datetime.utcnow()
        for district in DISTRICTS:
            for day in range(30):
                base = self._rnd.randint(18, 42)
                for _ in range(base):
                    created = now - timedelta(days=day, hours=self._rnd.randint(0, 23))
                    urgency = self._rnd.randint(1, 5)
                    predicted_days = max(1, int(8 - urgency + self._rnd.random() * 3))
                    resolved = self._rnd.random() > 0.24
                    escalated = self._rnd.random() < 0.18 or (urgency >= 4 and not resolved)
                    department = self._rnd.choice(DEPARTMENTS)
                    officer = self._pick_officer(district)
                    grievance = {
                        "case_id": self._new_case_id(),
                        "district": district,
                        "department": department,
                        "urgency": urgency,
                        "text": f"Historical grievance in {district} for {department}",
                        "predicted_resolution_days": predicted_days,
                        "confidence_score": round(self._rnd.uniform(0.62, 0.96), 2),
                        "duplicate_flag": self._rnd.random() < 0.12,
                        "escalation_recommended": escalated,
                        "status": "Resolved" if resolved else "Open",
                        "assigned_officer": officer["name"],
                        "assigned_officer_id": officer["id"],
                        "created_at": created.isoformat(),
                        "resolved_at": (created + timedelta(days=predicted_days)).isoformat() if resolved else None,
                        "source": "seed",
                    }
                    self.grievances.append(grievance)
                    if escalated:
                        self.escalation_logs.append(
                            {
                                "case_id": grievance["case_id"],
                                "district": district,
                                "timestamp": created.isoformat(),
                                "reason": "Seed escalation",
                            }
                        )

    def _pick_officer(self, district: str) -> Dict[str, Any]:
        officers = [o for o in self.officers if o["district"] == district]
        return self._rnd.choice(officers)

    def _new_case_id(self) -> str:
        case_id = f"CASE-{self._next_case_id:06d}"
        self._next_case_id += 1
        return case_id

    def recalculate_all(self) -> None:
        self.district_stats = {}
        now = datetime.utcnow()
        for district in DISTRICTS:
            dg = [g for g in self.grievances if g["district"] == district]
            apps = [a for a in self.applications if a["district"] == district]
            open_cases = [g for g in dg if g["status"] != "Resolved"]
            escalations = [g for g in dg if g["escalation_recommended"]]
            sla_breach = [g for g in open_cases if (now - datetime.fromisoformat(g["created_at"])).days > g["predicted_resolution_days"]]
            female_low_income = [c for c in self.citizens if c["district"] == district and c["gender"] == "female" and c["income"] < 80000]
            eligible_count = len(female_low_income)
            enrolled = sum(1 for a in apps if a.get("eligible") and a.get("status") in ["Approved", "InReview"]) 
            coverage_gap = 0 if eligible_count == 0 else max(0.0, round(((eligible_count - enrolled) / eligible_count) * 100, 2))
            rejection_rate = 0.0
            if apps:
                rejected = sum(1 for a in apps if a.get("status") == "Rejected")
                rejection_rate = round((rejected / len(apps)) * 100, 2)

            score = 100 - (
                (len(dg) * 0.02)
                + (rejection_rate * 0.5)
                + (len(open_cases) * 0.13)
                + (len(escalations) * 1.35)
                + (coverage_gap * 0.2)
                + (len(sla_breach) * 0.4)
            )
            score = max(0.0, min(100.0, round(score, 1)))
            self.district_stats[district] = {
                "score": score,
                "category": _risk_band(score),
                "metrics": {
                    "grievance_volume": len(dg),
                    "rejection_rate": rejection_rate,
                    "unresolved_cases": len(open_cases),
                    "escalation_count": len(escalations),
                    "scheme_coverage_gap": coverage_gap,
                    "sla_breach_count": len(sla_breach),
                },
            }

    def create_application(self, payload: Dict[str, Any], validation: Dict[str, Any], eligible: bool) -> Dict[str, Any]:
        district = payload.get("district") or self._infer_district_from_address(payload.get("aadhaar_address", ""))
        app = {
            "application_id": f"APP-{len(self.applications)+1:06d}",
            "district": district,
            "status": "Approved" if validation["risk_level"] == "Low Risk" and eligible else "InReview",
            "eligible": eligible,
            "validation": validation,
            "submitted_at": datetime.utcnow().isoformat(),
            "payload": payload,
        }
        self.applications.append(app)
        self.recalculate_all()
        return app

    def create_grievance_case(self, district: str, analysis: Dict[str, Any], text: str, urgency: int, source: str = "workflow") -> Dict[str, Any]:
        officer = self._pick_officer(district)
        case = {
            "case_id": self._new_case_id(),
            "district": district,
            "department": analysis["department"],
            "urgency": urgency,
            "text": text,
            "predicted_resolution_days": analysis["predicted_resolution_days"],
            "confidence_score": analysis["confidence_score"],
            "duplicate_flag": analysis["duplicate_flag"],
            "escalation_recommended": analysis["escalation_recommended"],
            "status": "Open",
            "assigned_officer": officer["name"],
            "assigned_officer_id": officer["id"],
            "created_at": datetime.utcnow().isoformat(),
            "resolved_at": None,
            "source": source,
        }
        self.grievances.append(case)
        if analysis["escalation_recommended"]:
            self.escalation_logs.append(
                {
                    "case_id": case["case_id"],
                    "district": district,
                    "timestamp": datetime.utcnow().isoformat(),
                    "reason": "Auto escalation by AI",
                }
            )
        self.recalculate_all()
        return case

    def update_case_status(self, case_id: str, status: str, escalate: bool = False) -> Dict[str, Any] | None:
        for item in self.grievances:
            if item["case_id"] == case_id:
                item["status"] = status
                if status == "Resolved":
                    item["resolved_at"] = datetime.utcnow().isoformat()
                if escalate:
                    item["escalation_recommended"] = True
                    self.escalation_logs.append(
                        {
                            "case_id": case_id,
                            "district": item["district"],
                            "timestamp": datetime.utcnow().isoformat(),
                            "reason": "Manual escalation",
                        }
                    )
                self.recalculate_all()
                return item
        return None

    def list_officer_cases(self, district: str | None = None, status: str | None = None) -> List[Dict[str, Any]]:
        data = self.grievances
        if district:
            data = [g for g in data if g["district"] == district]
        if status:
            data = [g for g in data if g["status"].lower() == status.lower()]
        return sorted(data, key=lambda x: x["created_at"], reverse=True)[:200]

    def get_district_forecast(self, district: str | None = None) -> Dict[str, Any]:
        now = datetime.utcnow().date()
        district_filter = district
        history = []
        for i in range(7, 0, -1):
            target_day = (now - timedelta(days=i)).isoformat()
            day_count = 0
            for g in self.grievances:
                if district_filter and g["district"] != district_filter:
                    continue
                if g["created_at"][:10] == target_day:
                    day_count += 1
            history.append(day_count)
        moving_avg = sum(history) / max(1, len(history))
        trend = 1.03 if history[-1] >= history[0] else 0.98
        forecast = [max(0, round(moving_avg * (trend ** i))) for i in range(1, 8)]
        upper = [round(v * 1.15) for v in forecast]
        lower = [round(v * 0.85) for v in forecast]
        escalations = len([e for e in self.escalation_logs if not district_filter or e["district"] == district_filter])
        risk = min(95.0, round((escalations / max(1, len(self.grievances))) * 100 * 2.5, 1))
        return {
            "past_7_days_grievances": history,
            "next_7_days_forecast": forecast,
            "upper_bound": upper,
            "lower_bound": lower,
            "risk_surge_probability": risk,
            "explainability": f"Forecast from recent 7-day pattern with escalation sensitivity at {risk}%.",
        }

    def get_workload(self, district: str | None = None) -> Dict[str, Any]:
        officers = [o for o in self.officers if not district or o["district"] == district]
        officer_stats = []
        for officer in officers:
            cases = [g for g in self.grievances if g["assigned_officer_id"] == officer["id"] and g["status"] != "Resolved"]
            resolved = [g for g in self.grievances if g["assigned_officer_id"] == officer["id"] and g["status"] == "Resolved" and g["resolved_at"]]
            avg = 0.0
            if resolved:
                days = []
                for r in resolved:
                    try:
                        d = datetime.fromisoformat(r["resolved_at"]) - datetime.fromisoformat(r["created_at"])
                        days.append(max(1.0, d.total_seconds() / 86400))
                    except Exception:
                        continue
                avg = round(sum(days) / max(1, len(days)), 2)
            officer_stats.append(
                {
                    "id": officer["id"],
                    "name": officer["name"],
                    "district": officer["district"],
                    "open_cases": len(cases),
                    "avg_resolution_time": avg,
                }
            )
        if not officer_stats:
            return {"officer_stats": [], "redistribution_recommendation": {"from_officer": "N/A", "to_officer": "N/A", "suggested_transfer_count": 0, "reason": "No officers found"}}

        overloaded = max(officer_stats, key=lambda x: x["open_cases"])
        available = min(officer_stats, key=lambda x: x["open_cases"])
        transfer = max(0, (overloaded["open_cases"] - available["open_cases"]) // 2)
        return {
            "officer_stats": officer_stats,
            "redistribution_recommendation": {
                "from_officer": overloaded["name"],
                "to_officer": available["name"],
                "suggested_transfer_count": transfer,
                "reason": f"{overloaded['name']} has highest pending load.",
            },
        }

    def get_knowledge_graph(self, district: str | None = None) -> Dict[str, Any]:
        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []
        selected_grievances = [g for g in self.grievances if not district or g["district"] == district][:120]
        node_ids = set()

        def add_node(nid: str, label: str, ntype: str) -> None:
            if nid in node_ids:
                return
            node_ids.add(nid)
            nodes.append({"id": nid, "label": label, "type": ntype})

        for g in selected_grievances:
            d = g["district"]
            dept = g["department"]
            off_id = g["assigned_officer_id"]
            off_name = g["assigned_officer"]
            case_id = g["case_id"]
            add_node(f"district:{d}", d, "district")
            add_node(f"dept:{dept}", dept, "dept")
            add_node(f"officer:{off_id}", off_name, "officer")
            add_node(f"grievance:{case_id}", case_id, "grievance")
            edges.append({"source": f"grievance:{case_id}", "target": f"dept:{dept}", "label": "Assigned"})
            edges.append({"source": f"dept:{dept}", "target": f"district:{d}", "label": "Operates"})
            edges.append({"source": f"officer:{off_id}", "target": f"grievance:{case_id}", "label": "Handles"})
            if g["status"] == "Resolved":
                edges.append({"source": f"grievance:{case_id}", "target": f"district:{d}", "label": "Resolved"})
            elif g["escalation_recommended"]:
                edges.append({"source": f"grievance:{case_id}", "target": f"district:{d}", "label": "Escalated"})

        for c in self.citizens[:80]:
            if district and c["district"] != district:
                continue
            cid = f"citizen:{c['aadhaar_id']}"
            did = f"district:{c['district']}"
            add_node(cid, c["name"], "citizen")
            add_node(did, c["district"], "district")
            edges.append({"source": cid, "target": did, "label": "Resides"})

        return {"nodes": nodes, "edges": edges}

    def governance_overview(self) -> Dict[str, Any]:
        self.recalculate_all()
        avg_score = round(sum(v["score"] for v in self.district_stats.values()) / len(DISTRICTS), 1)
        unresolved = sum(v["metrics"]["unresolved_cases"] for v in self.district_stats.values())
        escalations = sum(v["metrics"]["escalation_count"] for v in self.district_stats.values())
        grievance_volume = sum(v["metrics"]["grievance_volume"] for v in self.district_stats.values())
        rejection_rate = round(sum(v["metrics"]["rejection_rate"] for v in self.district_stats.values()) / len(DISTRICTS), 1)
        coverage_gap = round(sum(v["metrics"]["scheme_coverage_gap"] for v in self.district_stats.values()) / len(DISTRICTS), 1)
        sla_breach = sum(v["metrics"]["sla_breach_count"] for v in self.district_stats.values())

        district_scores = [
            {
                "district": d,
                "score": m["score"],
                "category": m["category"],
                "unresolved": m["metrics"]["unresolved_cases"],
                "escalations": m["metrics"]["escalation_count"],
            }
            for d, m in self.district_stats.items()
        ]
        trend = self.get_district_forecast()
        workload = self.get_workload()
        return {
            "score": avg_score,
            "category": _risk_band(avg_score),
            "metrics": {
                "grievance_volume": grievance_volume,
                "rejection_rate": rejection_rate,
                "unresolved_cases": unresolved,
                "escalation_count": escalations,
                "scheme_coverage_gap": coverage_gap,
                "sla_breach_count": sla_breach,
            },
            "district_scores": district_scores,
            "grievance_trend": trend,
            "officer_workload": workload,
            "sla_breach_distribution": [
                {"name": "Within SLA", "value": max(0, unresolved - sla_breach)},
                {"name": "Breach Risk", "value": sla_breach},
            ],
            "scheme_leakage": [
                {"district": d, "value": v["metrics"]["scheme_coverage_gap"]}
                for d, v in self.district_stats.items()
            ],
            "explainable_contributions": [
                f"Unresolved cases currently at {unresolved} across the state.",
                f"Total escalations at {escalations}, driving risk concentration.",
                f"Average scheme coverage gap is {coverage_gap}% across districts.",
            ],
        }

    def _infer_district_from_address(self, address: str) -> str:
        lower = address.lower()
        for district in DISTRICTS:
            if district.lower() in lower:
                return district
        return DISTRICTS[0]


state_store = GovernanceStateStore()
