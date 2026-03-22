"""
Central Complaint Store — single source of truth for all complaints.

Backed by MongoDB (database: nagarikai, collection: complaints).
All complaint submissions (citizen, CSC, workflow) go through this store.
All complaint queries (officer, admin) read from this store.
"""

from __future__ import annotations

import random
import threading
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from utils.logger import logger

DISTRICTS = ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"]

DEPARTMENTS = [
    "Agriculture", "Revenue", "Education", "Panchayat",
    "Electricity", "Social Welfare", "Health", "Water Supply",
]

# Map legacy "Pension" to "Social Welfare"
DEPT_ALIASES = {"Pension": "Social Welfare"}

PRIORITIES = ["Low", "Medium", "High", "Critical"]

SLA_DAYS = {"Low": 14, "Medium": 7, "High": 3, "Critical": 1}

OFFICERS_BY_DISTRICT = {
    "Raipur":    [{"id": "OFF-RAI-01", "name": "Rajesh Verma"},   {"id": "OFF-RAI-02", "name": "Priya Sharma"},  {"id": "OFF-RAI-03", "name": "Vikram Patel"}],
    "Bilaspur":  [{"id": "OFF-BIL-01", "name": "Anil Mishra"},    {"id": "OFF-BIL-02", "name": "Sunita Kumar"},   {"id": "OFF-BIL-03", "name": "Ashok Tiwari"}],
    "Durg":      [{"id": "OFF-DUR-01", "name": "Meera Sahu"},     {"id": "OFF-DUR-02", "name": "Ramesh Yadav"},   {"id": "OFF-DUR-03", "name": "Kavita Das"}],
    "Korba":     [{"id": "OFF-KOR-01", "name": "Deepak Singh"},   {"id": "OFF-KOR-02", "name": "Sunil Rajput"},   {"id": "OFF-KOR-03", "name": "Anita Thakur"}],
    "Jagdalpur": [{"id": "OFF-JAG-01", "name": "Manoj Dewangan"}, {"id": "OFF-JAG-02", "name": "Lakshmi Netam"},  {"id": "OFF-JAG-03", "name": "Sanjay Markam"}],
}


def _get_collection():
    """Lazy import to avoid circular import at module level."""
    from database.mongodb import complaints_collection
    return complaints_collection


class CentralComplaintStore:
    """Thread-safe, MongoDB-backed complaint registry."""

    def __init__(self):
        self._lock = threading.Lock()
        self._col = _get_collection()
        # Determine next ID from existing data
        self._next_id = 1
        last = self._col.find_one(sort=[("_seq", -1)])
        if last and "_seq" in last:
            self._next_id = last["_seq"] + 1
        elif self._col.count_documents({}) == 0:
            self._bootstrap_mock_data()
        logger.info(f"[ComplaintStore] MongoDB store ready — {self._col.count_documents({})} complaints, next_id={self._next_id}")

    # ── ID Generation ───────────────────────────────────────

    def _new_id(self) -> str:
        cid = f"NGRK-{self._next_id:05d}"
        self._next_id += 1
        return cid

    # ── Complaint Submission ────────────────────────────────

    def submit_complaint(
        self,
        description: str,
        district: str,
        citizen_name: str = "",
        citizen_id: str = "",
        citizen_phone: str = "",
        citizen_aadhaar: str = "",
        department: str = "",
        complaint_type: str = "text",
        transcript: str = "",
        video_url: str = "",
        video_duration: int = 0,
        stt_confidence: float = 0.0,
        stt_method: str = "",
        transcript_hi: str = "",
        translation_en: str = "",
        source: str = "citizen",
        ai_result: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Submit a new complaint with AI classification and store in MongoDB."""

        # AI classification
        if ai_result is None:
            try:
                from services.grievance_service import analyze_grievance
                urgency = 3
                ai_result = analyze_grievance(description or transcript, urgency)
            except Exception as e:
                logger.error(f"[ComplaintStore] AI classification failed: {e}")
                ai_result = {
                    "department": department or "Revenue",
                    "confidence_score": 0.0,
                    "predicted_resolution_days": 7,
                    "duplicate_flag": False,
                    "escalation_recommended": False,
                    "explainability_reason": "AI classification unavailable",
                }

        ai_department = DEPT_ALIASES.get(ai_result.get("department", ""), ai_result.get("department", department))
        if not ai_department or ai_department == "Manual Review":
            ai_department = department or "Revenue"

        # Priority from confidence and urgency
        conf = ai_result.get("confidence_score", 0.5)
        if ai_result.get("escalation_recommended"):
            priority = "Critical"
        elif conf > 0.85:
            priority = "High"
        elif conf > 0.65:
            priority = "Medium"
        else:
            priority = "Low"

        now = datetime.utcnow()
        sla_days = SLA_DAYS.get(priority, 7)
        sla_deadline = (now + timedelta(days=sla_days)).strftime("%Y-%m-%d")

        # Assign officer
        district_officers = OFFICERS_BY_DISTRICT.get(district, OFFICERS_BY_DISTRICT["Raipur"])
        officer = random.choice(district_officers)

        with self._lock:
            complaint_id = self._new_id()
            seq = self._next_id - 1

        complaint = {
            "id": complaint_id,
            "complaint_id": complaint_id,
            "_seq": seq,
            "citizen_id": citizen_id,
            "citizen_name": citizen_name,
            "citizen_phone": citizen_phone,
            "citizen_aadhaar": citizen_aadhaar,
            "district": district,
            "department": ai_department,
            "category": ai_department,
            "description": description,
            "transcript": transcript if transcript else (description if complaint_type in ("voice", "video") else ""),
            "type": complaint_type,
            "priority": priority,
            "status": "Open",
            "ai_category": ai_department,
            "ai_department": ai_department,
            "ai_classification": ai_department,
            "ai_confidence": ai_result.get("confidence_score", 0.0),
            "ai_priority": priority,
            "duplicate_flag": ai_result.get("duplicate_flag", False),
            "escalation_recommended": ai_result.get("escalation_recommended", False),
            "explainability": ai_result.get("explainability_reason", ""),
            "predicted_resolution_days": ai_result.get("predicted_resolution_days", 7),
            "assigned_officer": officer["name"],
            "assigned_officer_id": officer["id"],
            "assigned_officer_name": officer["name"],
            "submitted_at": now.strftime("%Y-%m-%d %H:%M"),
            "created_at": now.isoformat(),
            "sla_deadline": sla_deadline,
            "sla_breached": False,
            "resolved_at": None,
            "video_url": video_url or None,
            "video_duration": video_duration or None,
            "speech_to_text_confidence": round(stt_confidence, 2) if stt_confidence else None,
            "stt_method": stt_method or None,
            "transcript_hi": transcript_hi or None,
            "translation_en": translation_en or None,
            "source": source,
            "forwarded_to_officer": True,
            "forwarded_to_admin": True,
        }

        self._col.insert_one(complaint)

        logger.info(
            f"[ComplaintStore] New complaint {complaint_id}: "
            f"district={district}, dept={ai_department}, "
            f"priority={priority}, source={source}, "
            f"ai_conf={ai_result.get('confidence_score', 0):.2f}"
        )

        # Remove MongoDB _id before returning
        complaint.pop("_id", None)
        return complaint

    # ── Query Methods ───────────────────────────────────────

    def get_all_complaints(self) -> List[Dict[str, Any]]:
        docs = list(self._col.find({}, {"_id": 0}))
        return docs

    def get_complaints(
        self,
        district: Optional[str] = None,
        department: Optional[str] = None,
        priority: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        complaint_type: Optional[str] = None,
        limit: int = 500,
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {}
        if district:
            query["district"] = district
        if department:
            query["department"] = department
        if priority:
            query["priority"] = priority
        if status:
            query["status"] = status
        if source:
            query["source"] = source
        if complaint_type:
            query["type"] = complaint_type

        docs = list(
            self._col.find(query, {"_id": 0})
            .sort("created_at", -1)
            .limit(limit)
        )
        return docs

    def get_complaint(self, complaint_id: str) -> Optional[Dict[str, Any]]:
        doc = self._col.find_one(
            {"$or": [{"id": complaint_id}, {"complaint_id": complaint_id}]},
            {"_id": 0},
        )
        return doc

    def update_status(self, complaint_id: str, action: str, officer_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        update: Dict[str, Any] = {}
        if action == "resolve":
            update["status"] = "Resolved"
            update["resolved_at"] = datetime.utcnow().isoformat()
        elif action == "escalate":
            update["status"] = "Escalated"
            update["escalation_recommended"] = True
        elif action == "in_progress":
            update["status"] = "In Progress"
        if officer_id:
            update["assigned_officer_id"] = officer_id

        if not update:
            return None

        result = self._col.find_one_and_update(
            {"$or": [{"id": complaint_id}, {"complaint_id": complaint_id}]},
            {"$set": update},
            return_document=True,
            projection={"_id": 0},
        )
        return result

    def get_stats(self, district: Optional[str] = None) -> Dict[str, Any]:
        complaints = self.get_complaints(district=district, limit=10000)
        now = datetime.utcnow()
        today = now.strftime("%Y-%m-%d")

        total = len(complaints)
        open_count = len([c for c in complaints if c.get("status") in ("Open", "In Progress")])
        resolved = len([c for c in complaints if c.get("status") == "Resolved"])
        escalated = len([c for c in complaints if c.get("status") == "Escalated"])
        sla_breached = len([c for c in complaints if c.get("sla_breached")])
        today_count = len([c for c in complaints if c.get("submitted_at", "")[:10] == today])
        video_count = len([c for c in complaints if c.get("type") == "video"])

        dept_dist: Dict[str, int] = {}
        for c in complaints:
            d = c.get("department", "Unknown")
            dept_dist[d] = dept_dist.get(d, 0) + 1

        priority_dist: Dict[str, int] = {}
        for c in complaints:
            p = c.get("priority", "Medium")
            priority_dist[p] = priority_dist.get(p, 0) + 1

        return {
            "total": total,
            "open": open_count,
            "resolved": resolved,
            "escalated": escalated,
            "sla_breached": sla_breached,
            "today": today_count,
            "video_complaints": video_count,
            "department_distribution": dept_dist,
            "priority_distribution": priority_dist,
        }

    # ── Mock Data Bootstrap ─────────────────────────────────

    def _bootstrap_mock_data(self) -> None:
        """Generate realistic mock complaints across all districts and insert into MongoDB."""
        logger.info("[ComplaintStore] Bootstrapping mock complaint data into MongoDB...")
        rnd = random.Random(42)
        now = datetime.utcnow()

        FIRST_NAMES = [
            "Ramesh", "Sunita", "Mohan", "Priya", "Rajesh", "Anita",
            "Sunil", "Kavita", "Deepak", "Meena", "Arun", "Geeta",
            "Vikram", "Shalini", "Manoj", "Rekha", "Amit", "Neha",
            "Sanjay", "Pooja", "Ravi", "Seema", "Ashok", "Kamla",
        ]
        LAST_NAMES = [
            "Sahu", "Verma", "Patel", "Yadav", "Sharma", "Tiwari",
            "Singh", "Kumar", "Gupta", "Das", "Nag", "Thakur",
        ]

        COMPLAINT_TEMPLATES = [
            ("My pension has not been credited for the last three months. I visited the office multiple times.", "Social Welfare", "Pension Delay", "text"),
            ("मेरा पेंशन नहीं आ रहा है। तीन महीने से कोई पैसा नहीं मिला।", "Social Welfare", "Pension Delay", "text"),
            ("The road in our village has been damaged for six months. Children cannot go to school.", "Panchayat", "Road Infrastructure", "text"),
            ("हमारे गांव की सड़क छह महीने से टूटी हुई है। बच्चे स्कूल नहीं जा पा रहे।", "Panchayat", "Road Infrastructure", "text"),
            ("Water supply has been irregular for weeks. Taps run dry by 8 AM every day.", "Water Supply", "Water Supply Issue", "text"),
            ("हमारे वार्ड में दो हफ्ते से पानी नहीं आ रहा। हैंडपंप भी खराब है।", "Water Supply", "Water Supply Issue", "text"),
            ("Electricity cuts happen daily for 4-5 hours. Transformer is faulty.", "Electricity", "Electricity Disruption", "text"),
            ("बिजली रोज 4-5 घंटे कटती है। ट्रांसफार्मर खराब है।", "Electricity", "Electricity Disruption", "text"),
            ("My ration card application is pending for 4 months. No response from office.", "Revenue", "Ration Card Problem", "text"),
            ("राशन कार्ड का आवेदन 4 महीने से लंबित है। कार्यालय से कोई जवाब नहीं।", "Revenue", "Ration Card Problem", "text"),
            ("The primary health centre has no medicines. Doctor comes only twice a week.", "Health", "Health Service", "text"),
            ("प्राथमिक स्वास्थ्य केंद्र में दवाइयां नहीं हैं। डॉक्टर हफ्ते में दो बार आता है।", "Health", "Health Service", "text"),
            ("My crop insurance claim has not been processed for 6 months.", "Agriculture", "Insurance Delay", "text"),
            ("मेरा फसल बीमा 6 महीने से पेंडिंग है। बाढ़ में फसल बर्बाद हो गई।", "Agriculture", "Insurance Delay", "text"),
            ("School building roof is leaking. Walls have cracks. Children are at risk.", "Education", "Education Facility", "text"),
            ("स्कूल की छत से पानी टपक रहा है। दीवारों में दरारें हैं।", "Education", "Education Facility", "text"),
            ("Land records have wrong entries. Revenue department not correcting them.", "Revenue", "Land Dispute", "text"),
            ("भूमि रिकॉर्ड में गलत प्रविष्टियां हैं। राजस्व विभाग सुधार नहीं कर रहा।", "Revenue", "Land Dispute", "text"),
            ("Open drain near our house causing diseases. No action by gram panchayat.", "Panchayat", "Sanitation Issue", "text"),
            ("हमारे घर के पास नाला खुला है। बीमारियां फैल रही हैं।", "Panchayat", "Sanitation Issue", "text"),
            ("My widow pension application was rejected despite complete documents.", "Social Welfare", "Pension Delay", "text"),
            ("विधवा पेंशन का आवेदन रद्द कर दिया गया। सभी दस्तावेज जमा किए थे।", "Social Welfare", "Pension Delay", "text"),
            ("Scholarship application rejected due to wrong caste certificate issue.", "Education", "Scholarship Issue", "text"),
            ("छात्रवृत्ति आवेदन अस्वीकृत। जाति प्रमाण पत्र गलत बताया गया।", "Education", "Scholarship Issue", "text"),
            ("Sir my pension has not been credited for the last three months. I have visited the office multiple times but no one is responding. Please help.", "Social Welfare", "Pension Delay", "video"),
            ("The road in our village has been damaged for over six months. During rainy season water logging is very bad.", "Panchayat", "Road Infrastructure", "video"),
            ("Our ward has not received water supply for the past two weeks. The hand pump is also broken.", "Water Supply", "Water Supply Issue", "video"),
            ("Electricity transformer in our area got damaged during storm. It has been five days with no power.", "Electricity", "Electricity Disruption", "video"),
            ("I am a farmer and applied for crop insurance six months ago. The claim has not been processed yet.", "Agriculture", "Insurance Delay", "video"),
            ("Primary health centre in our village has no medicines and only one doctor.", "Health", "Health Service", "video"),
        ]

        STATUSES = ["Open", "In Progress", "Resolved", "Escalated"]
        STATUS_WEIGHTS = [30, 25, 35, 10]

        bulk_docs: List[Dict[str, Any]] = []

        for district in DISTRICTS:
            officers = OFFICERS_BY_DISTRICT[district]
            num_complaints = rnd.randint(25, 40)

            for _ in range(num_complaints):
                template = rnd.choice(COMPLAINT_TEMPLATES)
                desc, dept, category, ctype = template

                fn = rnd.choice(FIRST_NAMES)
                ln = rnd.choice(LAST_NAMES)
                citizen_name = f"{fn} {ln}"
                aadhaar = f"{rnd.randint(1000,9999)}-{rnd.randint(1000,9999)}-{rnd.randint(1000,9999)}"
                phone = f"+91-{rnd.randint(70000,99999)}{rnd.randint(10000,99999)}"

                days_ago = rnd.randint(0, 45)
                created = now - timedelta(days=days_ago, hours=rnd.randint(0, 23))

                status = rnd.choices(STATUSES, weights=STATUS_WEIGHTS)[0]
                priority = rnd.choices(PRIORITIES, weights=[15, 40, 30, 15])[0]
                sla_days = SLA_DAYS[priority]
                sla_deadline = (created + timedelta(days=sla_days)).strftime("%Y-%m-%d")
                sla_breached = status != "Resolved" and (now - created).days > sla_days

                officer = rnd.choice(officers)
                conf = round(rnd.uniform(0.72, 0.97), 2)

                complaint_id = self._new_id()
                seq = self._next_id - 1

                complaint = {
                    "id": complaint_id,
                    "complaint_id": complaint_id,
                    "_seq": seq,
                    "citizen_id": f"CIT-{district[:3].upper()}-{rnd.randint(1,60):04d}",
                    "citizen_name": citizen_name,
                    "citizen_phone": phone,
                    "citizen_aadhaar": aadhaar,
                    "district": district,
                    "department": dept,
                    "category": category,
                    "description": desc,
                    "transcript": desc if ctype in ("voice", "video") else "",
                    "type": ctype,
                    "priority": priority,
                    "status": status,
                    "ai_category": category,
                    "ai_department": dept,
                    "ai_classification": category,
                    "ai_confidence": conf,
                    "ai_priority": priority,
                    "duplicate_flag": rnd.random() < 0.08,
                    "escalation_recommended": status == "Escalated",
                    "explainability": f"AI classified as {dept} with {conf*100:.1f}% confidence.",
                    "predicted_resolution_days": sla_days,
                    "assigned_officer": officer["name"],
                    "assigned_officer_id": officer["id"],
                    "assigned_officer_name": officer["name"],
                    "submitted_at": created.strftime("%Y-%m-%d %H:%M"),
                    "created_at": created.isoformat(),
                    "sla_deadline": sla_deadline,
                    "sla_breached": sla_breached,
                    "resolved_at": (created + timedelta(days=rnd.randint(1, sla_days + 2))).isoformat() if status == "Resolved" else None,
                    "video_url": f"/videos/{district.lower()}_complaint_{rnd.randint(1,20)}.mp4" if ctype == "video" else None,
                    "video_duration": rnd.randint(30, 180) if ctype == "video" else None,
                    "speech_to_text_confidence": round(rnd.uniform(0.82, 0.97), 2) if ctype in ("voice", "video") else None,
                    "source": rnd.choice(["citizen", "csc", "workflow"]),
                    "forwarded_to_officer": True,
                    "forwarded_to_admin": True,
                }
                bulk_docs.append(complaint)

        if bulk_docs:
            self._col.insert_many(bulk_docs)
        logger.info(f"[ComplaintStore] Bootstrapped {len(bulk_docs)} mock complaints into MongoDB.")


# Singleton instance
complaint_store = CentralComplaintStore()
