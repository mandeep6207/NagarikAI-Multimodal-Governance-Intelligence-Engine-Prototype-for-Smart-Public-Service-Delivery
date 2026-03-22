"""
Super Administrator Service — State Governance Authority data layer.

Provides comprehensive mock data and analytics for:
- State Governance Dashboard
- District Intelligence Panel
- Grievance Intelligence System
- Video Complaint Monitoring
- Officer Management Panel
- Scheme Intelligence Panel
- Fraud Detection Center
- AI Integrations
"""

from __future__ import annotations

import hashlib
import random
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

DISTRICTS = ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"]

DEPARTMENTS = [
    "Agriculture", "Revenue", "Education",
    "Panchayat", "Electricity", "Pension",
    "Health", "Water Supply",
]

SCHEMES = [
    {
        "id": "SCH-001",
        "name": "Widow Pension",
        "description": "Monthly pension for widows below poverty line",
        "required_documents": ["Aadhaar Card", "Death Certificate of Spouse", "BPL Certificate", "Bank Passbook"],
        "eligibility_rules": [
            "Applicant must be a widow",
            "Annual family income below ₹80,000",
            "Must be a resident of Chhattisgarh",
            "Age must be 18 years or above",
        ],
    },
    {
        "id": "SCH-002",
        "name": "Old Age Pension",
        "description": "Monthly pension for senior citizens aged 60+",
        "required_documents": ["Aadhaar Card", "Age Proof Certificate", "BPL Certificate", "Bank Passbook"],
        "eligibility_rules": [
            "Applicant must be 60 years or older",
            "Annual family income below ₹80,000",
            "Must be a resident of Chhattisgarh",
            "Not receiving pension from other government scheme",
        ],
    },
    {
        "id": "SCH-003",
        "name": "Farmer Insurance",
        "description": "Crop insurance coverage for small and marginal farmers",
        "required_documents": ["Aadhaar Card", "Land Ownership Document", "Khasra/B1 Copy", "Bank Passbook"],
        "eligibility_rules": [
            "Must own agricultural land (up to 5 acres)",
            "Must be an active farmer",
            "Must be a resident of Chhattisgarh",
            "Land must be used for crop cultivation",
        ],
    },
    {
        "id": "SCH-004",
        "name": "Scholarship",
        "description": "Educational scholarship for meritorious students from BPL families",
        "required_documents": ["Aadhaar Card", "Mark Sheet", "BPL Certificate", "School/College ID", "Bank Passbook"],
        "eligibility_rules": [
            "Student must score above 60% in previous examination",
            "Annual family income below ₹1,00,000",
            "Must be enrolled in recognized institution",
            "Must be a resident of Chhattisgarh",
        ],
    },
]

OFFICER_DESIGNATIONS = [
    "Sub-Divisional Magistrate",
    "Block Development Officer",
    "Tehsildar",
    "District Program Officer",
    "Assistant Director",
]

COMPLAINT_CATEGORIES = [
    "Road Infrastructure",
    "Water Supply Issue",
    "Electricity Disruption",
    "Ration Card Problem",
    "Pension Delay",
    "Land Dispute",
    "Education Facility",
    "Health Service",
    "Sanitation Issue",
    "PDS Complaint",
]

FIRST_NAMES_MALE = [
    "Ravi", "Mohan", "Sunil", "Rakesh", "Vijay",
    "Amit", "Raj", "Suresh", "Manoj", "Arun",
    "Deepak", "Sanjay", "Ramesh", "Ganesh", "Pradeep",
]
FIRST_NAMES_FEMALE = [
    "Sita", "Anita", "Pooja", "Deepa", "Neha",
    "Sunita", "Meena", "Kavita", "Lakshmi", "Priya",
    "Geeta", "Radha", "Savitri", "Uma", "Kamla",
]
LAST_NAMES = [
    "Verma", "Patel", "Yadav", "Sharma", "Kumar",
    "Sahu", "Mishra", "Das", "Singh", "Tiwari",
    "Rajput", "Thakur", "Dewangan", "Markam", "Netam",
]


class SuperAdminDataStore:
    """Comprehensive mock data store for the Super Administrator portal."""

    def __init__(self, seed: int = 42):
        self._rnd = random.Random(seed)
        self.citizens: List[Dict[str, Any]] = []
        self.officers: List[Dict[str, Any]] = []
        self.complaints: List[Dict[str, Any]] = []
        self.video_complaints: List[Dict[str, Any]] = []
        self.scheme_enrollments: List[Dict[str, Any]] = []
        self.fraud_alerts: List[Dict[str, Any]] = []
        self._next_complaint_id = 1
        self._bootstrap()

    def _bootstrap(self) -> None:
        self._generate_citizens()
        self._generate_officers()
        self._generate_complaints()
        self._generate_video_complaints()
        self._generate_scheme_enrollments()
        self._generate_fraud_alerts()

    # ─── Data Generation ────────────────────────────────────────

    def _generate_citizens(self) -> None:
        for district in DISTRICTS:
            for i in range(60):
                gender = "male" if self._rnd.random() > 0.48 else "female"
                if gender == "male":
                    first = self._rnd.choice(FIRST_NAMES_MALE)
                else:
                    first = self._rnd.choice(FIRST_NAMES_FEMALE)
                last = self._rnd.choice(LAST_NAMES)
                name = f"{first} {last}"
                age = self._rnd.randint(18, 78)
                income = self._rnd.randint(15000, 200000)
                aadhaar = f"{self._rnd.randint(1000, 9999)} {self._rnd.randint(1000, 9999)} {self._rnd.randint(1000, 9999)}"
                self.citizens.append({
                    "id": f"CIT-{district[:3].upper()}-{i+1:04d}",
                    "aadhaar": aadhaar,
                    "name": name,
                    "gender": gender,
                    "age": age,
                    "income": income,
                    "district": district,
                    "ward": f"Ward {self._rnd.randint(1, 40)}",
                    "phone": f"+91 {self._rnd.randint(70000, 99999)}{self._rnd.randint(10000, 99999)}",
                })

    def _generate_officers(self) -> None:
        officer_first = [
            "Rajesh", "Anil", "Priya", "Vikram", "Sunita",
            "Ashok", "Meera", "Ramesh", "Kavita", "Deepak",
            "Sunil", "Anita", "Manoj", "Lakshmi", "Sanjay",
            "Pooja", "Arun", "Neha", "Ganesh", "Radha",
            "Vijay", "Geeta", "Rakesh", "Savitri", "Amit",
        ]
        idx = 0
        for district in DISTRICTS:
            dept_pool = list(DEPARTMENTS)
            self._rnd.shuffle(dept_pool)
            for j in range(5):
                idx += 1
                name = f"{officer_first[idx % len(officer_first)]} {self._rnd.choice(LAST_NAMES)}"
                designation = self._rnd.choice(OFFICER_DESIGNATIONS)
                department = dept_pool[j % len(dept_pool)]
                perf = round(self._rnd.uniform(55, 98), 1)
                self.officers.append({
                    "id": f"OFF-{district[:3].upper()}-{j+1:02d}",
                    "name": name,
                    "designation": designation,
                    "district": district,
                    "department": department,
                    "performance_score": perf,
                    "photo_seed": idx,
                    "cases_assigned": 0,
                    "phone": f"+91 {self._rnd.randint(70000, 99999)}{self._rnd.randint(10000, 99999)}",
                    "email": f"{name.split()[0].lower()}.{name.split()[1].lower()}@cg.gov.in",
                })

    def _generate_complaints(self) -> None:
        statuses = ["Open", "In Progress", "Resolved", "Escalated"]
        priorities = ["Low", "Medium", "High", "Critical"]
        now = datetime.utcnow()

        for district in DISTRICTS:
            d_citizens = [c for c in self.citizens if c["district"] == district]
            d_officers = [o for o in self.officers if o["district"] == district]

            for _ in range(self._rnd.randint(25, 40)):
                citizen = self._rnd.choice(d_citizens)
                officer = self._rnd.choice(d_officers)
                category = self._rnd.choice(COMPLAINT_CATEGORIES)
                dept = self._rnd.choice(DEPARTMENTS)
                priority = self._rnd.choice(priorities)
                status = self._rnd.choices(statuses, weights=[30, 25, 35, 10])[0]
                days_ago = self._rnd.randint(0, 45)
                created = now - timedelta(days=days_ago, hours=self._rnd.randint(0, 23))
                sla_days = {"Low": 14, "Medium": 7, "High": 3, "Critical": 1}[priority]
                sla_deadline = created + timedelta(days=sla_days)

                complaint_id = f"GRV-{self._next_complaint_id:05d}"
                self._next_complaint_id += 1

                self.complaints.append({
                    "complaint_id": complaint_id,
                    "citizen_name": citizen["name"],
                    "citizen_id": citizen["id"],
                    "district": district,
                    "department": dept,
                    "category": category,
                    "priority": priority,
                    "ai_classification": category,
                    "assigned_officer": officer["name"],
                    "assigned_officer_id": officer["id"],
                    "status": status,
                    "sla_deadline": sla_deadline.strftime("%Y-%m-%d"),
                    "created_at": created.isoformat(),
                    "resolved_at": (created + timedelta(days=self._rnd.randint(1, sla_days + 3))).isoformat() if status == "Resolved" else None,
                    "description": f"{category} complaint from {citizen['name']} in {district}",
                })
                officer["cases_assigned"] += 1

    def _generate_video_complaints(self) -> None:
        transcripts = [
            ("Our village road has been damaged for months. No repair work has started.", "Road Infrastructure", "Panchayat"),
            ("Water supply has been irregular for weeks. Taps run dry by 8 AM.", "Water Supply Issue", "Water Supply"),
            ("Electricity cuts happen daily for 4-5 hours. Transformer is faulty.", "Electricity Disruption", "Electricity"),
            ("My pension has not been credited for 3 months. Bank says no order received.", "Pension Delay", "Pension"),
            ("Ration shop keeper is not giving full quota. Demands extra money.", "PDS Complaint", "Revenue"),
            ("School building roof is leaking. Children cannot sit in classrooms.", "Education Facility", "Education"),
            ("Primary health center has no doctor. Medicines are not available.", "Health Service", "Health"),
            ("Open drain near our house is causing diseases. No action taken by gram panchayat.", "Sanitation Issue", "Panchayat"),
            ("Our land records have wrong entries. Revenue department not correcting them.", "Land Dispute", "Revenue"),
            ("Ration card application pending for 6 months. No response from office.", "Ration Card Problem", "Revenue"),
            ("Handpump in our ward is broken since last monsoon. Nobody has come to fix it.", "Water Supply Issue", "Water Supply"),
            ("Street lights in our area not working for 2 months. Very unsafe at night.", "Electricity Disruption", "Electricity"),
        ]

        now = datetime.utcnow()
        for i in range(12):
            transcript_text, category, dept = transcripts[i]
            district = self._rnd.choice(DISTRICTS)
            citizen = self._rnd.choice([c for c in self.citizens if c["district"] == district])
            days_ago = self._rnd.randint(0, 10)
            self.video_complaints.append({
                "id": f"VID-{i+1:04d}",
                "citizen_name": citizen["name"],
                "citizen_id": citizen["id"],
                "district": district,
                "video_url": f"/videos/complaint_{i+1}.mp4",
                "duration_seconds": self._rnd.randint(30, 180),
                "transcript": transcript_text,
                "ai_category": category,
                "ai_department": dept,
                "ai_confidence": round(self._rnd.uniform(0.72, 0.97), 2),
                "status": self._rnd.choice(["Pending Review", "Verified", "Escalated"]),
                "submitted_at": (now - timedelta(days=days_ago)).isoformat(),
            })

    def _generate_scheme_enrollments(self) -> None:
        for scheme in SCHEMES:
            for district in DISTRICTS:
                d_citizens = [c for c in self.citizens if c["district"] == district]
                eligible_count = 0
                enrolled_count = 0
                for citizen in d_citizens:
                    is_eligible = False
                    if scheme["name"] == "Widow Pension":
                        is_eligible = citizen["gender"] == "female" and citizen["income"] < 80000
                    elif scheme["name"] == "Old Age Pension":
                        is_eligible = citizen["age"] >= 60 and citizen["income"] < 80000
                    elif scheme["name"] == "Farmer Insurance":
                        is_eligible = citizen["income"] < 120000 and citizen["age"] >= 18
                    elif scheme["name"] == "Scholarship":
                        is_eligible = citizen["age"] < 25 and citizen["income"] < 100000

                    if is_eligible:
                        eligible_count += 1
                        if self._rnd.random() < 0.6:
                            enrolled_count += 1
                            self.scheme_enrollments.append({
                                "scheme_id": scheme["id"],
                                "scheme_name": scheme["name"],
                                "citizen_id": citizen["id"],
                                "citizen_name": citizen["name"],
                                "district": district,
                                "status": self._rnd.choice(["Active", "Active", "Active", "Pending Verification"]),
                                "enrolled_date": (datetime.utcnow() - timedelta(days=self._rnd.randint(30, 365))).strftime("%Y-%m-%d"),
                            })

    def _generate_fraud_alerts(self) -> None:
        alert_types = [
            "Duplicate Aadhaar Across Schemes",
            "Document Mismatch",
            "Multiple Scheme Claims by Same Citizen",
        ]
        severity_levels = ["High", "Medium", "Critical"]
        now = datetime.utcnow()

        for i in range(15):
            alert_type = self._rnd.choice(alert_types)
            district = self._rnd.choice(DISTRICTS)
            citizen = self._rnd.choice([c for c in self.citizens if c["district"] == district])
            schemes_involved = self._rnd.sample([s["name"] for s in SCHEMES], k=self._rnd.randint(1, 3))

            if alert_type == "Duplicate Aadhaar Across Schemes":
                description = f"Aadhaar {citizen['aadhaar']} found enrolled in {', '.join(schemes_involved)} — potential duplicate enrollment detected."
            elif alert_type == "Document Mismatch":
                description = f"Name mismatch between Aadhaar ({citizen['name']}) and submitted BPL certificate for scheme {schemes_involved[0]}."
            else:
                description = f"{citizen['name']} has claimed benefits under {', '.join(schemes_involved)} simultaneously. Cross-verification required."

            self.fraud_alerts.append({
                "id": f"FRAUD-{i+1:04d}",
                "type": alert_type,
                "severity": self._rnd.choice(severity_levels),
                "citizen_name": citizen["name"],
                "citizen_id": citizen["id"],
                "aadhaar": citizen["aadhaar"],
                "district": district,
                "schemes_involved": schemes_involved,
                "description": description,
                "status": self._rnd.choice(["Under Investigation", "Flagged", "Cleared"]),
                "detected_at": (now - timedelta(days=self._rnd.randint(0, 30))).isoformat(),
            })

    # ─── Query Methods ──────────────────────────────────────────

    def _get_all_complaints(self) -> List[Dict[str, Any]]:
        """Return complaints from central MongoDB complaint store + local fallback."""
        try:
            from services.complaint_store import complaint_store
            central = complaint_store.get_all_complaints()
            if central:
                result = []
                for cc in central:
                    result.append({
                        "complaint_id": cc.get("id", cc.get("complaint_id", "")),
                        "citizen_name": cc.get("citizen_name", ""),
                        "citizen_id": cc.get("citizen_id", ""),
                        "district": cc.get("district", ""),
                        "department": cc.get("department", ""),
                        "category": cc.get("category", ""),
                        "priority": cc.get("priority", "Medium"),
                        "ai_classification": cc.get("ai_classification", ""),
                        "assigned_officer": cc.get("assigned_officer", ""),
                        "assigned_officer_id": cc.get("assigned_officer_id", ""),
                        "status": cc.get("status", "Open"),
                        "sla_deadline": cc.get("sla_deadline", ""),
                        "created_at": cc.get("created_at", ""),
                        "resolved_at": cc.get("resolved_at"),
                        "description": cc.get("description", ""),
                        "transcript": cc.get("transcript", ""),
                        "type": cc.get("type", "text"),
                        "video_url": cc.get("video_url"),
                        "video_duration": cc.get("video_duration"),
                        "speech_to_text_confidence": cc.get("speech_to_text_confidence"),
                        "transcript_hi": cc.get("transcript_hi"),
                        "translation_en": cc.get("translation_en"),
                    })
                return result
        except Exception:
            pass

        # Fallback: local data
        return list(self.complaints)

    def get_state_dashboard(self) -> Dict[str, Any]:
        """Main dashboard KPIs and charts."""
        now = datetime.utcnow()
        all_complaints = self._get_all_complaints()

        # District scores
        district_scores = []
        for district in DISTRICTS:
            d_complaints = [c for c in all_complaints if c["district"] == district]
            total = len(d_complaints)
            resolved = sum(1 for c in d_complaints if c["status"] == "Resolved")
            escalated = sum(1 for c in d_complaints if c["status"] == "Escalated")
            open_count = sum(1 for c in d_complaints if c["status"] in ("Open", "In Progress"))
            d_officers = [o for o in self.officers if o["district"] == district]
            avg_perf = round(sum(o["performance_score"] for o in d_officers) / max(1, len(d_officers)), 1)

            # Governance score
            score = max(0, min(100, round(
                100 - (open_count * 0.8) - (escalated * 2.5) - ((total - resolved) * 0.3) + (avg_perf * 0.2)
            , 1)))

            # Scheme coverage
            d_citizens = [c for c in self.citizens if c["district"] == district]
            enrolled = len(set(e["citizen_id"] for e in self.scheme_enrollments if e["district"] == district))
            coverage = round((enrolled / max(1, len(d_citizens))) * 100, 1)

            district_scores.append({
                "district": district,
                "governance_score": score,
                "total_complaints": total,
                "active_officers": len(d_officers),
                "scheme_coverage": coverage,
                "open_complaints": open_count,
                "escalated": escalated,
                "resolved": resolved,
                "avg_officer_performance": avg_perf,
            })

        # Totals
        total_complaints = len(all_complaints)
        active_complaints = sum(1 for c in all_complaints if c["status"] in ("Open", "In Progress"))
        pending_escalations = sum(1 for c in all_complaints if c["status"] == "Escalated")
        total_enrolled = len(set(e["citizen_id"] for e in self.scheme_enrollments))
        total_citizens = len(self.citizens)
        scheme_coverage_pct = round((total_enrolled / max(1, total_citizens)) * 100, 1)
        fraud_count = sum(1 for f in self.fraud_alerts if f["status"] != "Cleared")
        video_pending = sum(1 for v in self.video_complaints if v["status"] == "Pending Review")
        avg_governance = round(sum(d["governance_score"] for d in district_scores) / max(1, len(district_scores)), 1)

        # Grievance trend (last 14 days)
        grievance_trend = []
        for i in range(13, -1, -1):
            day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
            count = sum(1 for c in all_complaints if c["created_at"][:10] == day)
            grievance_trend.append({"date": day, "count": count})

        # Department-wise distribution
        dept_dist = {}
        for c in all_complaints:
            dept_dist[c["department"]] = dept_dist.get(c["department"], 0) + 1
        dept_distribution = [{"department": k, "count": v} for k, v in sorted(dept_dist.items(), key=lambda x: -x[1])]

        return {
            "kpis": {
                "governance_score": avg_governance,
                "total_active_complaints": active_complaints,
                "pending_escalations": pending_escalations,
                "scheme_coverage_pct": scheme_coverage_pct,
                "fraud_alerts": fraud_count,
                "video_pending_review": video_pending,
                "total_officers": len(self.officers),
                "total_citizens": total_citizens,
                "total_complaints": total_complaints,
            },
            "district_scores": district_scores,
            "grievance_trend": grievance_trend,
            "department_distribution": dept_distribution,
        }

    def get_district_detail(self, district: str) -> Optional[Dict[str, Any]]:
        """Detailed view for a single district."""
        if district not in DISTRICTS:
            return None

        all_complaints = self._get_all_complaints()
        d_complaints = [c for c in all_complaints if c["district"] == district]
        d_officers = [o for o in self.officers if o["district"] == district]
        d_citizens = [c for c in self.citizens if c["district"] == district]
        d_escalations = [c for c in d_complaints if c["status"] == "Escalated"]
        d_enrollments = [e for e in self.scheme_enrollments if e["district"] == district]

        # Scheme performance
        scheme_perf = []
        for scheme in SCHEMES:
            eligible = 0
            enrolled = 0
            for citizen in d_citizens:
                is_eligible = False
                if scheme["name"] == "Widow Pension":
                    is_eligible = citizen["gender"] == "female" and citizen["income"] < 80000
                elif scheme["name"] == "Old Age Pension":
                    is_eligible = citizen["age"] >= 60 and citizen["income"] < 80000
                elif scheme["name"] == "Farmer Insurance":
                    is_eligible = citizen["income"] < 120000 and citizen["age"] >= 18
                elif scheme["name"] == "Scholarship":
                    is_eligible = citizen["age"] < 25 and citizen["income"] < 100000
                if is_eligible:
                    eligible += 1
            enrolled = sum(1 for e in d_enrollments if e["scheme_id"] == scheme["id"])
            scheme_perf.append({
                "scheme": scheme["name"],
                "eligible": eligible,
                "enrolled": enrolled,
                "coverage_pct": round((enrolled / max(1, eligible)) * 100, 1),
            })

        open_count = sum(1 for c in d_complaints if c["status"] in ("Open", "In Progress"))
        resolved = sum(1 for c in d_complaints if c["status"] == "Resolved")
        avg_perf = round(sum(o["performance_score"] for o in d_officers) / max(1, len(d_officers)), 1)
        score = max(0, min(100, round(
            100 - (open_count * 0.8) - (len(d_escalations) * 2.5) - ((len(d_complaints) - resolved) * 0.3) + (avg_perf * 0.2)
        , 1)))

        return {
            "district": district,
            "governance_score": score,
            "total_citizens": len(d_citizens),
            "total_complaints": len(d_complaints),
            "open_complaints": open_count,
            "resolved_complaints": resolved,
            "escalated_complaints": len(d_escalations),
            "officers": d_officers,
            "recent_complaints": sorted(d_complaints, key=lambda x: x["created_at"], reverse=True)[:20],
            "escalation_cases": d_escalations,
            "scheme_performance": scheme_perf,
        }

    def get_grievances(
        self,
        district: Optional[str] = None,
        department: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Filterable grievance table."""
        result = self._get_all_complaints()
        if district:
            result = [c for c in result if c["district"] == district]
        if department:
            result = [c for c in result if c["department"] == department]
        if priority:
            result = [c for c in result if c["priority"] == priority]
        if status:
            result = [c for c in result if c["status"] == status]
        return sorted(result, key=lambda x: x["created_at"], reverse=True)

    def get_video_complaints(self) -> List[Dict[str, Any]]:
        return self.video_complaints

    def update_video_complaint_status(self, video_id: str, action: str) -> Optional[Dict[str, Any]]:
        for vc in self.video_complaints:
            if vc["id"] == video_id:
                if action == "verify":
                    vc["status"] = "Verified"
                elif action == "escalate":
                    vc["status"] = "Escalated"
                return vc
        return None

    def get_officers(self, district: Optional[str] = None) -> List[Dict[str, Any]]:
        if district:
            return [o for o in self.officers if o["district"] == district]
        return self.officers

    def reassign_officer(self, officer_id: str, new_district: str) -> Optional[Dict[str, Any]]:
        if new_district not in DISTRICTS:
            return None
        for o in self.officers:
            if o["id"] == officer_id:
                o["district"] = new_district
                return o
        return None

    def get_scheme_analytics(self) -> Dict[str, Any]:
        """Scheme-level analytics across all districts."""
        scheme_data = []
        for scheme in SCHEMES:
            total_eligible = 0
            total_enrolled = 0
            district_coverage = []
            for district in DISTRICTS:
                d_citizens = [c for c in self.citizens if c["district"] == district]
                eligible = 0
                for citizen in d_citizens:
                    is_eligible = False
                    if scheme["name"] == "Widow Pension":
                        is_eligible = citizen["gender"] == "female" and citizen["income"] < 80000
                    elif scheme["name"] == "Old Age Pension":
                        is_eligible = citizen["age"] >= 60 and citizen["income"] < 80000
                    elif scheme["name"] == "Farmer Insurance":
                        is_eligible = citizen["income"] < 120000 and citizen["age"] >= 18
                    elif scheme["name"] == "Scholarship":
                        is_eligible = citizen["age"] < 25 and citizen["income"] < 100000
                    if is_eligible:
                        eligible += 1
                enrolled = sum(1 for e in self.scheme_enrollments if e["scheme_id"] == scheme["id"] and e["district"] == district)
                total_eligible += eligible
                total_enrolled += enrolled
                district_coverage.append({
                    "district": district,
                    "eligible": eligible,
                    "enrolled": enrolled,
                    "coverage_pct": round((enrolled / max(1, eligible)) * 100, 1),
                })
            scheme_data.append({
                "id": scheme["id"],
                "name": scheme["name"],
                "description": scheme["description"],
                "required_documents": scheme["required_documents"],
                "eligibility_rules": scheme["eligibility_rules"],
                "total_eligible": total_eligible,
                "total_enrolled": total_enrolled,
                "uncovered": total_eligible - total_enrolled,
                "coverage_pct": round((total_enrolled / max(1, total_eligible)) * 100, 1),
                "district_coverage": district_coverage,
            })
        return {"schemes": scheme_data}

    def get_fraud_alerts(self) -> List[Dict[str, Any]]:
        return sorted(self.fraud_alerts, key=lambda x: x["detected_at"], reverse=True)

    def get_ai_insights(self) -> Dict[str, Any]:
        """AI-powered governance insights."""
        all_complaints = self._get_all_complaints()
        total = len(all_complaints)
        open_c = sum(1 for c in all_complaints if c["status"] in ("Open", "In Progress"))
        escalated = sum(1 for c in all_complaints if c["status"] == "Escalated")
        critical = sum(1 for c in all_complaints if c["priority"] == "Critical")
        fraud_active = sum(1 for f in self.fraud_alerts if f["status"] != "Cleared")

        risk_score = min(100, round(
            (open_c / max(1, total)) * 30 +
            (escalated / max(1, total)) * 40 +
            (critical / max(1, total)) * 20 +
            (fraud_active * 2)
        , 1))

        # District risk ranking
        district_risks = []
        for district in DISTRICTS:
            d_open = sum(1 for c in all_complaints if c["district"] == district and c["status"] in ("Open", "In Progress"))
            d_esc = sum(1 for c in all_complaints if c["district"] == district and c["status"] == "Escalated")
            d_risk = min(100, round((d_open * 1.5) + (d_esc * 3), 1))
            district_risks.append({"district": district, "risk_score": d_risk})
        district_risks.sort(key=lambda x: -x["risk_score"])

        return {
            "governance_risk_score": risk_score,
            "risk_category": "Critical" if risk_score >= 70 else "Moderate" if risk_score >= 40 else "Stable",
            "total_grievances_analyzed": total,
            "ai_classified_count": total,
            "fraud_detected": fraud_active,
            "video_analyzed": len(self.video_complaints),
            "district_risk_ranking": district_risks,
            "insights": [
                f"Governance risk score is at {risk_score}% — {'immediate attention required' if risk_score >= 70 else 'under monitoring'}.",
                f"{escalated} escalated complaints require senior officer review.",
                f"{fraud_active} active fraud alerts are under investigation.",
                f"{critical} critical-priority complaints need resolution within 24 hours.",
                f"AI has classified all {total} grievances with department routing.",
            ],
        }


# Singleton
superadmin_store = SuperAdminDataStore()
