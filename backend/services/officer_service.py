"""
District Officer Service — comprehensive data store for District Officer portal.

Provides mock data and analytics for:
- District Operations Dashboard
- Complaint Inbox
- Video Complaint Review
- Field Officer Assignment
- Scheme Application Review
- District Performance Analytics
- AI Features (grievance classification, duplicate detection, SLA prediction)
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
    {"id": "SCH-001", "name": "Widow Pension", "department": "Pension"},
    {"id": "SCH-002", "name": "Old Age Pension", "department": "Pension"},
    {"id": "SCH-003", "name": "Farmer Insurance", "department": "Agriculture"},
    {"id": "SCH-004", "name": "Scholarship", "department": "Education"},
]

COMPLAINT_CATEGORIES = [
    "Road Infrastructure", "Water Supply Issue", "Electricity Disruption",
    "Ration Card Problem", "Pension Delay", "Land Dispute",
    "Education Facility", "Health Service", "Sanitation Issue", "PDS Complaint",
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

DOCUMENT_TYPES = ["Aadhaar Card", "BPL Certificate", "Income Certificate",
                  "Caste Certificate", "Address Proof", "Bank Passbook",
                  "Death Certificate", "Age Proof", "Land Document", "Mark Sheet"]

VIDEO_TRANSCRIPTS = [
    "Sir, my pension has not been credited for the last three months. I have visited the office multiple times but no one is responding. Please help me get my pension released.",
    "The road in our village has been damaged for over six months. During rainy season water logging is very bad. Children cannot go to school. We need immediate repair work.",
    "Our ward has not received water supply for the past two weeks. The hand pump is also broken. We are buying water from private tankers at high cost. Please look into this matter urgently.",
    "I applied for ration card renewal four months ago but still have not received the new card. The old card has expired and I am not getting rations. My family is suffering.",
    "The electricity transformer in our area got damaged during storm. It has been five days with no power. Food is getting spoiled, students cannot study. We need the transformer repaired immediately.",
    "I am a farmer and applied for crop insurance six months ago. The claim has not been processed yet. My entire crop was damaged in flood. I need the insurance amount to survive.",
    "The primary health centre in our village has no medicines and only one doctor who comes twice a week. Pregnant women have to travel 40 km for delivery. We need better health services.",
    "Our children's school building is in dangerous condition. The roof leaks and walls have cracks. We complained to block office but no action was taken. Please send inspection team.",
    "My husband died two years ago and I applied for widow pension but it was rejected saying documents incomplete. I have submitted all documents. Please review my application.",
    "The drainage system in our colony is completely blocked. Sewage water is overflowing on the street. It is causing diseases among children. We complained many times but no action.",
    "I am a disabled person and applied for disability pension one year ago. My application is still pending. I cannot work and have no income. Please expedite my pension approval.",
    "The street lights in our area have not been working for three months. There have been two robbery incidents at night. Women feel unsafe walking after dark. Please fix the lights.",
    "There is illegal sand mining happening in our village near the river. It is damaging the river bank and agricultural land. We complained to tehsildar but mining continues.",
    "My daughter got 92 percent marks but her scholarship application was rejected. The reason given was wrong caste certificate. But the certificate is valid. Please re-examine.",
    "The government borewell installed two years ago has stopped working. The motor is burnt and no one has come to repair it. Entire village depends on this borewell for drinking water.",
]

FIELD_OFFICER_DESIGNATIONS = [
    "Patwari", "Gram Sachiv", "Block Inspector",
    "Revenue Inspector", "Panchayat Secretary",
]


class OfficerDataStore:
    """Comprehensive mock data store for the District Officer portal."""

    def __init__(self, seed: int = 55):
        self._rnd = random.Random(seed)
        self.citizens: List[Dict[str, Any]] = []
        self.field_officers: List[Dict[str, Any]] = []
        self.complaints: List[Dict[str, Any]] = []
        self.video_complaints: List[Dict[str, Any]] = []
        self.scheme_applications: List[Dict[str, Any]] = []
        self._next_complaint_id = 1
        self._next_app_id = 1
        self._bootstrap()

    def _bootstrap(self) -> None:
        self._generate_citizens()
        self._generate_field_officers()
        self._generate_complaints()
        self._generate_video_complaints()
        self._generate_scheme_applications()

    # ─── Data Generation ────────────────────────────────────────

    def _generate_citizens(self) -> None:
        for district in DISTRICTS:
            for i in range(60):
                gender = "male" if self._rnd.random() > 0.48 else "female"
                first = self._rnd.choice(FIRST_NAMES_MALE if gender == "male" else FIRST_NAMES_FEMALE)
                last = self._rnd.choice(LAST_NAMES)
                name = f"{first} {last}"
                aadhaar = f"{district[:3].upper()}-{self._rnd.randint(1000, 9999)}-{self._rnd.randint(1000, 9999)}-{self._rnd.randint(1000, 9999)}"
                self.citizens.append({
                    "id": f"CIT-{district[:3].upper()}-{i+1:04d}",
                    "name": name,
                    "gender": gender,
                    "age": self._rnd.randint(18, 78),
                    "aadhaar": aadhaar,
                    "phone": f"+91 {self._rnd.randint(70000, 99999)} {self._rnd.randint(10000, 99999)}",
                    "district": district,
                    "ward": f"Ward {self._rnd.randint(1, 40)}",
                    "income": self._rnd.randint(18000, 240000),
                    "category": self._rnd.choice(["General", "OBC", "SC", "ST"]),
                })

    def _generate_field_officers(self) -> None:
        officer_id = 1
        for district in DISTRICTS:
            num_officers = self._rnd.randint(5, 7)
            for idx in range(num_officers):
                gender = "male" if self._rnd.random() > 0.3 else "female"
                first = self._rnd.choice(FIRST_NAMES_MALE if gender == "male" else FIRST_NAMES_FEMALE)
                last = self._rnd.choice(LAST_NAMES)
                dept = self._rnd.choice(DEPARTMENTS)
                self.field_officers.append({
                    "id": f"FO-{officer_id:03d}",
                    "name": f"{first} {last}",
                    "designation": self._rnd.choice(FIELD_OFFICER_DESIGNATIONS),
                    "department": dept,
                    "district": district,
                    "phone": f"+91 {self._rnd.randint(70000, 99999)} {self._rnd.randint(10000, 99999)}",
                    "active_cases": 0,
                    "resolved_cases": self._rnd.randint(15, 80),
                    "performance_score": round(self._rnd.uniform(65, 98), 1),
                    "joined_date": (datetime.utcnow() - timedelta(days=self._rnd.randint(180, 2000))).strftime("%Y-%m-%d"),
                })
                officer_id += 1

    def _generate_complaints(self) -> None:
        now = datetime.utcnow()
        statuses = ["Open", "In Progress", "Under Review", "Resolved", "Escalated"]
        priorities = ["Low", "Medium", "High", "Critical"]

        for district in DISTRICTS:
            district_citizens = [c for c in self.citizens if c["district"] == district]
            district_officers = [o for o in self.field_officers if o["district"] == district]
            num_complaints = self._rnd.randint(28, 40)

            for _ in range(num_complaints):
                citizen = self._rnd.choice(district_citizens)
                officer = self._rnd.choice(district_officers) if district_officers else None
                dept = self._rnd.choice(DEPARTMENTS)
                category = self._rnd.choice(COMPLAINT_CATEGORIES)
                priority = self._rnd.choices(priorities, weights=[20, 40, 30, 10])[0]
                status = self._rnd.choices(statuses, weights=[25, 20, 15, 30, 10])[0]
                days_ago = self._rnd.randint(0, 45)
                created_at = now - timedelta(days=days_ago, hours=self._rnd.randint(0, 23))
                sla_days = {"Low": 14, "Medium": 7, "High": 3, "Critical": 1}[priority]
                sla_deadline = created_at + timedelta(days=sla_days)
                sla_breached = now > sla_deadline and status not in ["Resolved"]

                complaint_id = f"CMP-{self._next_complaint_id:05d}"
                self._next_complaint_id += 1

                complaint = {
                    "id": complaint_id,
                    "citizen_id": citizen["id"],
                    "citizen_name": citizen["name"],
                    "citizen_phone": citizen["phone"],
                    "district": district,
                    "department": dept,
                    "category": category,
                    "priority": priority,
                    "status": status,
                    "description": f"Complaint regarding {category.lower()} in {citizen['ward']}, {district}. {self._rnd.choice(['Immediate attention needed.', 'Follow-up pending.', 'Citizen has visited office multiple times.', 'Referred by CSC center.', 'Received through helpline.'])}",
                    "submitted_at": created_at.strftime("%Y-%m-%d %H:%M"),
                    "sla_deadline": sla_deadline.strftime("%Y-%m-%d"),
                    "sla_breached": sla_breached,
                    "assigned_officer_id": officer["id"] if officer and status != "Open" else None,
                    "assigned_officer_name": officer["name"] if officer and status != "Open" else None,
                    "ai_category": category,
                    "ai_confidence": round(self._rnd.uniform(0.72, 0.98), 2),
                    "duplicate_flag": self._rnd.random() < 0.08,
                    "resolved_at": (created_at + timedelta(days=self._rnd.randint(1, sla_days))).strftime("%Y-%m-%d %H:%M") if status == "Resolved" else None,
                }
                self.complaints.append(complaint)

                # Update officer active cases count
                if officer and status not in ["Resolved", "Open"]:
                    officer["active_cases"] += 1

    def _generate_video_complaints(self) -> None:
        now = datetime.utcnow()
        for district in DISTRICTS:
            district_citizens = [c for c in self.citizens if c["district"] == district]
            num_videos = self._rnd.randint(3, 5)
            for i in range(num_videos):
                citizen = self._rnd.choice(district_citizens)
                transcript = self._rnd.choice(VIDEO_TRANSCRIPTS)
                category = self._rnd.choice(COMPLAINT_CATEGORIES)
                dept = self._rnd.choice(DEPARTMENTS)
                days_ago = self._rnd.randint(0, 20)
                status = self._rnd.choices(
                    ["Pending Review", "Verified", "Escalated"],
                    weights=[50, 30, 20]
                )[0]

                self.video_complaints.append({
                    "id": f"VID-{district[:3].upper()}-{i+1:03d}",
                    "citizen_id": citizen["id"],
                    "citizen_name": citizen["name"],
                    "citizen_phone": citizen["phone"],
                    "district": district,
                    "video_url": f"/videos/{district.lower()}_complaint_{i+1}.mp4",
                    "duration_seconds": self._rnd.randint(30, 300),
                    "transcript": transcript,
                    "ai_category": category,
                    "ai_department": dept,
                    "ai_confidence": round(self._rnd.uniform(0.75, 0.97), 2),
                    "ai_urgency": self._rnd.choice(["Low", "Medium", "High", "Critical"]),
                    "status": status,
                    "submitted_at": (now - timedelta(days=days_ago)).strftime("%Y-%m-%d %H:%M"),
                })

    def _generate_scheme_applications(self) -> None:
        now = datetime.utcnow()
        statuses = ["Pending", "Under Review", "Approved", "Rejected", "Documents Requested"]
        for district in DISTRICTS:
            district_citizens = [c for c in self.citizens if c["district"] == district]
            num_apps = self._rnd.randint(10, 18)
            for _ in range(num_apps):
                citizen = self._rnd.choice(district_citizens)
                scheme = self._rnd.choice(SCHEMES)
                status = self._rnd.choices(statuses, weights=[30, 20, 25, 10, 15])[0]
                days_ago = self._rnd.randint(1, 60)

                # Documents submitted (some may be missing)
                required_docs = DOCUMENT_TYPES[:self._rnd.randint(3, 6)]
                submitted_docs = []
                for doc in required_docs:
                    is_valid = self._rnd.random() > 0.15
                    submitted_docs.append({
                        "name": doc,
                        "submitted": True,
                        "verified": is_valid and self._rnd.random() > 0.2,
                        "mismatch_detected": not is_valid,
                    })
                # Maybe missing a doc
                if self._rnd.random() < 0.25:
                    missing_doc = self._rnd.choice([d for d in DOCUMENT_TYPES if d not in required_docs][:3])
                    submitted_docs.append({
                        "name": missing_doc,
                        "submitted": False,
                        "verified": False,
                        "mismatch_detected": False,
                    })

                eligible = citizen["income"] < 100000 and all(d["submitted"] for d in submitted_docs)
                mismatches = [d["name"] for d in submitted_docs if d["mismatch_detected"]]

                app_id = f"APP-{self._next_app_id:05d}"
                self._next_app_id += 1

                self.scheme_applications.append({
                    "id": app_id,
                    "citizen_id": citizen["id"],
                    "citizen_name": citizen["name"],
                    "citizen_age": citizen["age"],
                    "citizen_gender": citizen["gender"],
                    "citizen_income": citizen["income"],
                    "citizen_category": citizen["category"],
                    "citizen_district": district,
                    "citizen_ward": citizen["ward"],
                    "scheme_id": scheme["id"],
                    "scheme_name": scheme["name"],
                    "scheme_department": scheme["department"],
                    "status": status,
                    "submitted_at": (now - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
                    "documents": submitted_docs,
                    "ai_eligible": eligible,
                    "ai_eligibility_confidence": round(self._rnd.uniform(0.70, 0.98), 2),
                    "ai_document_mismatches": mismatches,
                    "ai_risk_score": round(self._rnd.uniform(0.05, 0.60), 2) if mismatches else round(self._rnd.uniform(0.01, 0.15), 2),
                    "officer_remarks": None,
                })

    # ─── Query Methods ──────────────────────────────────────────

    def _get_all_complaints(self) -> List[Dict[str, Any]]:
        """Return complaints from central MongoDB complaint store + local fallback."""
        try:
            from services.complaint_store import complaint_store
            central = complaint_store.get_all_complaints()
            if central:
                # Adapt central store format to officer format
                result = []
                for cc in central:
                    result.append({
                        "id": cc.get("id", cc.get("complaint_id", "")),
                        "citizen_id": cc.get("citizen_id", ""),
                        "citizen_name": cc.get("citizen_name", ""),
                        "citizen_phone": cc.get("citizen_phone", ""),
                        "district": cc.get("district", ""),
                        "department": cc.get("department", ""),
                        "category": cc.get("category", ""),
                        "priority": cc.get("priority", "Medium"),
                        "status": cc.get("status", "Open"),
                        "description": cc.get("description", ""),
                        "transcript": cc.get("transcript", ""),
                        "type": cc.get("type", "text"),
                        "submitted_at": cc.get("submitted_at", ""),
                        "sla_deadline": cc.get("sla_deadline", ""),
                        "sla_breached": cc.get("sla_breached", False),
                        "assigned_officer_id": cc.get("assigned_officer_id"),
                        "assigned_officer_name": cc.get("assigned_officer_name"),
                        "ai_category": cc.get("ai_category", ""),
                        "ai_confidence": cc.get("ai_confidence", 0.0),
                        "duplicate_flag": cc.get("duplicate_flag", False),
                        "resolved_at": cc.get("resolved_at"),
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

    def get_dashboard(self, district: Optional[str] = None) -> Dict[str, Any]:
        """Return operational statistics for the district officer dashboard."""
        complaints = self._get_all_complaints()
        if district:
            complaints = [c for c in complaints if c["district"] == district]

        now = datetime.utcnow()
        today_str = now.strftime("%Y-%m-%d")

        total = len(complaints)
        pending = len([c for c in complaints if c["status"] in ["Open", "In Progress", "Under Review"]])
        resolved_today = len([c for c in complaints if c["status"] == "Resolved" and c.get("resolved_at", "").startswith(today_str)])
        escalated = len([c for c in complaints if c["status"] == "Escalated"])
        high_priority = len([c for c in complaints if c["priority"] in ["High", "Critical"]])
        sla_breached = len([c for c in complaints if c["sla_breached"]])

        # Complaint trends (last 14 days)
        trends = []
        for i in range(13, -1, -1):
            day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
            day_label = (now - timedelta(days=i)).strftime("%d %b")
            count = len([c for c in complaints if c["submitted_at"][:10] == day])
            resolved_count = len([c for c in complaints if (c.get("resolved_at") or "")[:10] == day])
            trends.append({"date": day_label, "submitted": count, "resolved": resolved_count})

        # Department distribution
        dept_dist: Dict[str, int] = {}
        for c in complaints:
            dept_dist[c["department"]] = dept_dist.get(c["department"], 0) + 1
        department_distribution = [{"department": k, "count": v} for k, v in sorted(dept_dist.items(), key=lambda x: -x[1])]

        # SLA compliance
        total_with_sla = len([c for c in complaints if c["status"] != "Open"])
        sla_compliant = total_with_sla - sla_breached
        sla_rate = round((sla_compliant / max(1, total_with_sla)) * 100, 1)

        # Priority distribution
        priority_dist: Dict[str, int] = {}
        for c in complaints:
            priority_dist[c["priority"]] = priority_dist.get(c["priority"], 0) + 1
        priority_distribution = [{"priority": k, "count": v} for k, v in priority_dist.items()]

        return {
            "kpis": {
                "total_complaints": total,
                "pending_complaints": pending,
                "resolved_today": resolved_today,
                "escalated_cases": escalated,
                "high_priority": high_priority,
                "sla_breached": sla_breached,
                "sla_compliance_rate": sla_rate,
            },
            "complaint_trends": trends,
            "department_distribution": department_distribution,
            "priority_distribution": priority_distribution,
            "district": district or "All",
        }

    def get_complaints(
        self,
        district: Optional[str] = None,
        department: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Return filtered complaint list (local + central store)."""
        data = self._get_all_complaints()
        if district:
            data = [c for c in data if c["district"] == district]
        if department:
            data = [c for c in data if c["department"] == department]
        if priority:
            data = [c for c in data if c["priority"] == priority]
        if status:
            data = [c for c in data if c["status"] == status]
        return sorted(data, key=lambda x: x["submitted_at"], reverse=True)

    def get_complaint_detail(self, complaint_id: str) -> Optional[Dict[str, Any]]:
        """Return a single complaint by ID (local + central store)."""
        for c in self.complaints:
            if c["id"] == complaint_id:
                return c
        # Also check central store
        try:
            from services.complaint_store import complaint_store
            return complaint_store.get_complaint(complaint_id)
        except Exception:
            pass
        return None

    def update_complaint_status(self, complaint_id: str, action: str, officer_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Update complaint status (resolve, escalate, assign)."""
        for c in self.complaints:
            if c["id"] == complaint_id:
                if action == "resolve":
                    c["status"] = "Resolved"
                    c["resolved_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
                    c["sla_breached"] = False
                elif action == "escalate":
                    c["status"] = "Escalated"
                elif action == "in_progress":
                    c["status"] = "In Progress"
                if officer_id:
                    for o in self.field_officers:
                        if o["id"] == officer_id:
                            c["assigned_officer_id"] = officer_id
                            c["assigned_officer_name"] = o["name"]
                            o["active_cases"] += 1
                            break
                return c
        # Also try updating in the central store
        try:
            from services.complaint_store import complaint_store
            return complaint_store.update_status(complaint_id, action, officer_id)
        except Exception:
            pass
        return None

    def get_video_complaints(self, district: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return video complaints for the district."""
        data = self.video_complaints
        if district:
            data = [v for v in data if v["district"] == district]
        return sorted(data, key=lambda x: x["submitted_at"], reverse=True)

    def update_video_status(self, video_id: str, action: str) -> Optional[Dict[str, Any]]:
        """Verify or escalate a video complaint."""
        for v in self.video_complaints:
            if v["id"] == video_id:
                if action == "verify":
                    v["status"] = "Verified"
                elif action == "escalate":
                    v["status"] = "Escalated"
                return v
        return None

    def get_field_officers(self, district: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return field officers for the district."""
        data = self.field_officers
        if district:
            data = [o for o in data if o["district"] == district]
        return data

    def assign_complaint_to_officer(self, complaint_id: str, officer_id: str) -> Optional[Dict[str, Any]]:
        """Assign a complaint to a field officer."""
        officer = None
        for o in self.field_officers:
            if o["id"] == officer_id:
                officer = o
                break
        if not officer:
            return None

        for c in self.complaints:
            if c["id"] == complaint_id:
                # Remove from previous officer
                if c["assigned_officer_id"]:
                    for o in self.field_officers:
                        if o["id"] == c["assigned_officer_id"]:
                            o["active_cases"] = max(0, o["active_cases"] - 1)
                            break
                c["assigned_officer_id"] = officer_id
                c["assigned_officer_name"] = officer["name"]
                c["status"] = "In Progress"
                officer["active_cases"] += 1
                return {"complaint": c, "officer": officer}
        return None

    def get_scheme_applications(
        self,
        district: Optional[str] = None,
        status: Optional[str] = None,
        scheme: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Return scheme applications for review."""
        data = self.scheme_applications
        if district:
            data = [a for a in data if a["citizen_district"] == district]
        if status:
            data = [a for a in data if a["status"] == status]
        if scheme:
            data = [a for a in data if a["scheme_name"] == scheme]
        return sorted(data, key=lambda x: x["submitted_at"], reverse=True)

    def update_scheme_application(self, app_id: str, action: str, remarks: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Approve, reject, or request documents for a scheme application."""
        for a in self.scheme_applications:
            if a["id"] == app_id:
                if action == "approve":
                    a["status"] = "Approved"
                elif action == "reject":
                    a["status"] = "Rejected"
                elif action == "request_documents":
                    a["status"] = "Documents Requested"
                if remarks:
                    a["officer_remarks"] = remarks
                return a
        return None

    def get_performance_analytics(self, district: Optional[str] = None) -> Dict[str, Any]:
        """Return district performance analytics."""
        complaints = self._get_all_complaints()
        officers = self.field_officers
        applications = self.scheme_applications

        if district:
            complaints = [c for c in complaints if c["district"] == district]
            officers = [o for o in officers if o["district"] == district]
            applications = [a for a in applications if a["citizen_district"] == district]

        total = len(complaints)
        resolved = len([c for c in complaints if c["status"] == "Resolved"])
        pending = len([c for c in complaints if c["status"] in ["Open", "In Progress", "Under Review"]])
        escalated = len([c for c in complaints if c["status"] == "Escalated"])
        sla_breached = len([c for c in complaints if c["sla_breached"]])

        resolution_rate = round((resolved / max(1, total)) * 100, 1)
        sla_compliance = round(((total - sla_breached) / max(1, total)) * 100, 1)

        # Department workload
        dept_workload: Dict[str, Dict[str, int]] = {}
        for c in complaints:
            dept = c["department"]
            if dept not in dept_workload:
                dept_workload[dept] = {"total": 0, "pending": 0, "resolved": 0}
            dept_workload[dept]["total"] += 1
            if c["status"] == "Resolved":
                dept_workload[dept]["resolved"] += 1
            elif c["status"] in ["Open", "In Progress", "Under Review"]:
                dept_workload[dept]["pending"] += 1
        department_workload = [
            {"department": k, **v} for k, v in sorted(dept_workload.items(), key=lambda x: -x[1]["total"])
        ]

        # Officer performance
        officer_performance = []
        for o in officers:
            officer_complaints = [c for c in complaints if c["assigned_officer_id"] == o["id"]]
            o_resolved = len([c for c in officer_complaints if c["status"] == "Resolved"])
            o_total = len(officer_complaints)
            officer_performance.append({
                "id": o["id"],
                "name": o["name"],
                "department": o["department"],
                "active_cases": o["active_cases"],
                "resolved": o_resolved,
                "total_assigned": o_total,
                "resolution_rate": round((o_resolved / max(1, o_total)) * 100, 1),
                "performance_score": o["performance_score"],
            })

        # Scheme application stats
        app_total = len(applications)
        app_approved = len([a for a in applications if a["status"] == "Approved"])
        app_rejected = len([a for a in applications if a["status"] == "Rejected"])
        app_pending = len([a for a in applications if a["status"] in ["Pending", "Under Review", "Documents Requested"]])

        # Priority breakdown
        priority_breakdown = {}
        for c in complaints:
            p = c["priority"]
            priority_breakdown[p] = priority_breakdown.get(p, 0) + 1

        return {
            "summary": {
                "total_complaints": total,
                "resolved": resolved,
                "pending": pending,
                "escalated": escalated,
                "resolution_rate": resolution_rate,
                "sla_compliance": sla_compliance,
                "sla_breached": sla_breached,
                "backlog": pending + escalated,
            },
            "department_workload": department_workload,
            "officer_performance": officer_performance,
            "scheme_stats": {
                "total_applications": app_total,
                "approved": app_approved,
                "rejected": app_rejected,
                "pending": app_pending,
                "approval_rate": round((app_approved / max(1, app_total)) * 100, 1),
            },
            "priority_breakdown": [{"priority": k, "count": v} for k, v in priority_breakdown.items()],
            "district": district or "All",
        }

    def get_ai_features(self, district: Optional[str] = None) -> Dict[str, Any]:
        """Return AI analysis features for the district."""
        complaints = self.complaints
        if district:
            complaints = [c for c in complaints if c["district"] == district]

        # Duplicate detection
        duplicates = [c for c in complaints if c["duplicate_flag"]]

        # SLA breach prediction (open cases close to deadline)
        now = datetime.utcnow()
        at_risk = []
        for c in complaints:
            if c["status"] in ["Open", "In Progress", "Under Review"]:
                deadline = datetime.strptime(c["sla_deadline"], "%Y-%m-%d")
                days_left = (deadline - now).days
                if days_left <= 2:
                    at_risk.append({
                        "id": c["id"],
                        "citizen": c["citizen_name"],
                        "priority": c["priority"],
                        "department": c["department"],
                        "days_until_breach": max(0, days_left),
                        "risk_level": "Critical" if days_left <= 0 else "High",
                    })

        # Category classification accuracy
        classified = len([c for c in complaints if c["ai_confidence"] > 0.85])
        classification_accuracy = round((classified / max(1, len(complaints))) * 100, 1)

        return {
            "grievance_classification": {
                "total_classified": len(complaints),
                "high_confidence": classified,
                "accuracy_rate": classification_accuracy,
                "categories_detected": len(set(c["ai_category"] for c in complaints)),
            },
            "duplicate_detection": {
                "total_flagged": len(duplicates),
                "duplicates": [{"id": d["id"], "citizen": d["citizen_name"], "category": d["ai_category"], "confidence": d["ai_confidence"]} for d in duplicates[:10]],
            },
            "sla_breach_prediction": {
                "at_risk_count": len(at_risk),
                "cases_at_risk": sorted(at_risk, key=lambda x: x["days_until_breach"])[:15],
            },
            "speech_to_text": {
                "total_processed": len(self.video_complaints if not district else [v for v in self.video_complaints if v["district"] == district]),
                "avg_confidence": round(sum(v["ai_confidence"] for v in self.video_complaints) / max(1, len(self.video_complaints)), 2),
            },
            "capabilities": [
                {"name": "Grievance Classification", "status": "Active", "description": "AI-powered automatic categorization of citizen complaints into departments"},
                {"name": "Speech-to-Text", "status": "Active", "description": "Automatic transcription and analysis of video complaints from citizens"},
                {"name": "Duplicate Detection", "status": "Active", "description": "ML-based detection of duplicate or similar complaints for consolidation"},
                {"name": "SLA Breach Prediction", "status": "Active", "description": "Predictive analysis of complaints at risk of breaching service level agreements"},
                {"name": "Document Verification", "status": "Active", "description": "AI verification of uploaded documents for scheme eligibility assessment"},
                {"name": "Eligibility Analysis", "status": "Active", "description": "Automated eligibility determination for government welfare schemes"},
            ],
            "district": district or "All",
        }


# Singleton instance
officer_store = OfficerDataStore()
