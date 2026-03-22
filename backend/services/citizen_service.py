"""
Citizen Self-Service Portal — comprehensive data store.

Provides mock data and analytics for:
- Citizen Dashboard (personal stats)
- Complaint Submission & Tracking
- Voice Complaint (speech-to-text + AI classification)
- Video Complaint Recording
- Scheme Application System
- Document Upload & AI Verification
- Eligibility Analysis
- Application Status Tracking
- Notifications
- Fraud Prevention
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

COMPLAINT_CATEGORIES = [
    "Delay in Service", "Corruption", "Infrastructure",
    "Document Issue", "Payment Pending", "Staff Behavior",
    "Technical Issue", "Policy Grievance",
]

SCHEMES = [
    {
        "id": "SCH-WP",
        "name": "Widow Pension",
        "department": "Pension",
        "benefit": "₹1,000/month",
        "description": "Monthly pension for widows below poverty line.",
        "eligibility_rules": [
            "Applicant must be a widow",
            "Age must be 18 years or above",
            "Annual household income below ₹1,00,000",
            "Must be a resident of Chhattisgarh",
            "Not receiving pension from any other scheme",
        ],
        "required_documents": [
            "Aadhaar Card",
            "Death Certificate of spouse",
            "Income Certificate",
            "BPL Certificate",
            "Bank Passbook",
        ],
    },
    {
        "id": "SCH-OAP",
        "name": "Old Age Pension",
        "department": "Pension",
        "benefit": "₹500–₹700/month",
        "description": "Monthly pension for senior citizens above 60 years.",
        "eligibility_rules": [
            "Age must be 60 years or above",
            "Annual household income below ₹1,00,000",
            "Must be a resident of Chhattisgarh",
            "Not a government pensioner",
        ],
        "required_documents": [
            "Aadhaar Card",
            "Age Proof",
            "Income Certificate",
            "BPL Certificate",
            "Bank Passbook",
        ],
    },
    {
        "id": "SCH-FI",
        "name": "Farmer Insurance",
        "department": "Agriculture",
        "benefit": "Up to ₹2,00,000 crop coverage",
        "description": "Crop insurance coverage for small and marginal farmers.",
        "eligibility_rules": [
            "Must be a registered farmer",
            "Land holding under 5 acres",
            "Must have Khasra/Land document",
            "Crops must be notified under scheme",
        ],
        "required_documents": [
            "Aadhaar Card",
            "Land Document / Khasra",
            "Bank Passbook",
            "Crop sowing certificate",
        ],
    },
    {
        "id": "SCH-SC",
        "name": "Scholarship",
        "department": "Education",
        "benefit": "₹5,000–₹20,000/year",
        "description": "Educational scholarship for SC/ST/OBC students.",
        "eligibility_rules": [
            "Student must belong to SC/ST/OBC category",
            "Annual family income below ₹2,50,000",
            "Must have secured at least 60% in last exam",
            "Must be enrolled in recognized institution",
        ],
        "required_documents": [
            "Aadhaar Card",
            "Mark Sheet",
            "Caste Certificate",
            "Income Certificate",
            "Institution enrollment proof",
        ],
    },
]

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


class CitizenStore:
    """In-memory citizen self-service data store."""

    def __init__(self, seed: int = 88):
        self._rng = random.Random(seed)
        self.citizens: List[Dict] = []
        self.complaints: List[Dict] = []
        self.video_complaints: List[Dict] = []
        self.scheme_applications: List[Dict] = []
        self.documents: List[Dict] = []
        self.notifications: List[Dict] = []
        self.fraud_alerts: List[Dict] = []

        self._generate_citizens()
        self._generate_complaints()
        self._generate_video_complaints()
        self._generate_scheme_applications()
        self._generate_documents()
        self._generate_notifications()
        self._generate_fraud_alerts()

    # ── Data Generation ─────────────────────────────────────

    def _generate_citizens(self):
        for i in range(200):
            district = self._rng.choice(DISTRICTS)
            fn = self._rng.choice(FIRST_NAMES)
            ln = self._rng.choice(LAST_NAMES)
            aadhaar = f"{self._rng.randint(1000, 9999)}-{self._rng.randint(1000, 9999)}-{self._rng.randint(1000, 9999)}"
            mobile = f"9{self._rng.randint(100000000, 999999999)}"
            self.citizens.append({
                "id": f"CIT-{i+1:04d}",
                "name": f"{fn} {ln}",
                "aadhaar": aadhaar,
                "mobile": mobile,
                "district": district,
                "age": self._rng.randint(18, 80),
                "income": self._rng.randint(15000, 250000),
                "gender": self._rng.choice(["Male", "Female"]),
            })

    def _generate_complaints(self):
        now = datetime.now()
        statuses = ["Submitted", "Under Review", "Assigned", "Resolved", "Closed"]
        priorities = ["Low", "Medium", "High", "Critical"]

        for i in range(120):
            citizen = self._rng.choice(self.citizens)
            dept = self._rng.choice(DEPARTMENTS)
            category = self._rng.choice(COMPLAINT_CATEGORIES)
            days_ago = self._rng.randint(0, 60)
            status = self._rng.choice(statuses)

            self.complaints.append({
                "id": f"GRV-CIT-{i+1:04d}",
                "citizen_id": citizen["id"],
                "citizen_name": citizen["name"],
                "citizen_aadhaar": citizen["aadhaar"],
                "citizen_mobile": citizen["mobile"],
                "district": citizen["district"],
                "department": dept,
                "category": category,
                "description": f"{category} reported in {dept} department — {citizen['district']} district",
                "priority": self._rng.choice(priorities),
                "status": status,
                "ai_category": category,
                "ai_department": dept,
                "ai_confidence": round(self._rng.uniform(0.7, 0.98), 2),
                "assigned_officer": f"Officer-{self._rng.randint(1,20)}",
                "submitted_at": (now - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
                "resolved_at": (now - timedelta(days=max(0, days_ago - self._rng.randint(1, 10)))).strftime("%Y-%m-%d") if status in ["Resolved", "Closed"] else None,
                "type": "text",
            })

    def _generate_video_complaints(self):
        now = datetime.now()
        for i in range(30):
            citizen = self._rng.choice(self.citizens)
            dept = self._rng.choice(DEPARTMENTS)
            category = self._rng.choice(COMPLAINT_CATEGORIES)
            days_ago = self._rng.randint(0, 45)
            duration = self._rng.randint(15, 180)

            transcript_snippets = [
                f"I have been facing {category.lower()} issues in {dept} department for over {self._rng.randint(1,12)} months.",
                f"The {dept} office in {citizen['district']} has not responded to my application despite multiple visits.",
                f"My complaint regarding {category.lower()} has been pending since {self._rng.randint(2,8)} weeks ago.",
            ]

            self.video_complaints.append({
                "id": f"VID-CIT-{i+1:04d}",
                "citizen_id": citizen["id"],
                "citizen_name": citizen["name"],
                "citizen_mobile": citizen["mobile"],
                "district": citizen["district"],
                "department": dept,
                "category": category,
                "duration": duration,
                "transcript": self._rng.choice(transcript_snippets),
                "ai_classification": {
                    "department": dept,
                    "category": category,
                    "priority": self._rng.choice(["Medium", "High", "Critical"]),
                    "confidence": round(self._rng.uniform(0.72, 0.96), 2),
                },
                "speech_to_text_confidence": round(self._rng.uniform(0.80, 0.97), 2),
                "status": self._rng.choice(["Submitted", "Forwarded", "Under Review", "Resolved"]),
                "forwarded_to": ["District Officer", "Super Administrator"],
                "submitted_at": (now - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
            })

    def _generate_scheme_applications(self):
        now = datetime.now()
        statuses = ["Submitted", "Under Review", "Approved", "Rejected", "Document Required"]

        for i in range(100):
            citizen = self._rng.choice(self.citizens)
            scheme = self._rng.choice(SCHEMES)
            days_ago = self._rng.randint(0, 90)
            status = self._rng.choice(statuses)
            docs_total = len(scheme["required_documents"])
            docs_uploaded = self._rng.randint(max(1, docs_total - 2), docs_total)
            ai_eligible = self._rng.random() > 0.3
            ai_risk = round(self._rng.uniform(0.02, 0.45 if ai_eligible else 0.85), 2)

            doc_statuses = []
            mismatches = []
            for j, doc in enumerate(scheme["required_documents"]):
                if j < docs_uploaded:
                    ds = self._rng.choice(["verified", "verified", "verified", "mismatch"])
                    doc_statuses.append({"name": doc, "status": ds})
                    if ds == "mismatch":
                        mismatches.append(f"{doc}: data inconsistency detected")
                else:
                    doc_statuses.append({"name": doc, "status": "missing"})

            self.scheme_applications.append({
                "id": f"APP-CIT-{i+1:04d}",
                "citizen_id": citizen["id"],
                "citizen_name": citizen["name"],
                "citizen_aadhaar": citizen["aadhaar"],
                "district": citizen["district"],
                "scheme_id": scheme["id"],
                "scheme_name": scheme["name"],
                "status": status,
                "ai_eligible": ai_eligible,
                "ai_confidence": round(self._rng.uniform(0.65, 0.97), 2),
                "ai_risk_score": ai_risk,
                "ai_mismatches": mismatches,
                "docs_uploaded": docs_uploaded,
                "docs_total": docs_total,
                "documents": doc_statuses,
                "assigned_officer": f"Officer-{self._rng.randint(1,20)}",
                "submitted_at": (now - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
                "forwarded_to_officer": status != "Submitted",
            })

    def _generate_documents(self):
        doc_types = ["Aadhaar Card", "Income Certificate", "Ration Card", "Death Certificate",
                      "BPL Certificate", "Age Proof", "Bank Passbook", "Caste Certificate"]
        now = datetime.now()
        statuses = ["verified", "verified", "verified", "mismatch", "suspicious", "pending"]

        for i in range(150):
            citizen = self._rng.choice(self.citizens)
            doc_type = self._rng.choice(doc_types)
            status = self._rng.choice(statuses)
            days_ago = self._rng.randint(0, 60)

            issues = []
            if status == "mismatch":
                issues = [self._rng.choice([
                    "Name mismatch between Aadhaar and document",
                    "Address does not match Aadhaar records",
                    "Date of birth inconsistency",
                    "Income figures differ from tax records",
                ])]
            elif status == "suspicious":
                issues = [self._rng.choice([
                    "Document appears to be digitally altered",
                    "Certificate number not found in issuing authority database",
                    "Duplicate document detected for another citizen",
                ])]

            self.documents.append({
                "id": f"DOC-CIT-{i+1:04d}",
                "citizen_id": citizen["id"],
                "citizen_name": citizen["name"],
                "citizen_aadhaar": citizen["aadhaar"],
                "district": citizen["district"],
                "document_type": doc_type,
                "status": status,
                "ai_confidence": round(self._rng.uniform(0.65, 0.99), 2),
                "issues": issues,
                "uploaded_at": (now - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
            })

    def _generate_notifications(self):
        now = datetime.now()
        notif_types = [
            ("application_approved", "Your {scheme} application has been approved", "success"),
            ("document_required", "Additional documents required for {scheme} application", "warning"),
            ("complaint_resolved", "Your complaint {complaint_id} has been resolved", "success"),
            ("complaint_assigned", "Your complaint {complaint_id} has been assigned to an officer", "info"),
            ("application_rejected", "Your {scheme} application was rejected — reason: incomplete documents", "error"),
            ("document_verified", "Your {doc_type} has been verified successfully", "success"),
            ("fraud_alert", "Suspicious activity detected on your account — please verify your identity", "error"),
            ("scheme_update", "New scheme benefits announced for {scheme}", "info"),
        ]

        for i in range(80):
            citizen = self._rng.choice(self.citizens)
            ntype, template, severity = self._rng.choice(notif_types)
            scheme = self._rng.choice(SCHEMES)
            days_ago = self._rng.randint(0, 30)

            message = template.format(
                scheme=scheme["name"],
                complaint_id=f"GRV-CIT-{self._rng.randint(1,120):04d}",
                doc_type=self._rng.choice(["Aadhaar Card", "Income Certificate", "Ration Card"]),
            )

            self.notifications.append({
                "id": f"NOTIF-{i+1:04d}",
                "citizen_id": citizen["id"],
                "citizen_name": citizen["name"],
                "type": ntype,
                "message": message,
                "severity": severity,
                "read": self._rng.random() > 0.4,
                "created_at": (now - timedelta(days=days_ago, hours=self._rng.randint(0,23))).strftime("%Y-%m-%d %H:%M"),
            })

    def _generate_fraud_alerts(self):
        fraud_types = ["duplicate_aadhaar", "multiple_claims", "document_inconsistency",
                       "identity_mismatch", "deceased_beneficiary"]
        now = datetime.now()

        for i in range(25):
            citizen = self._rng.choice(self.citizens)
            ftype = self._rng.choice(fraud_types)
            days_ago = self._rng.randint(0, 60)
            descriptions = {
                "duplicate_aadhaar": f"Aadhaar {citizen['aadhaar']} used in multiple applications across districts",
                "multiple_claims": f"{citizen['name']} has applied for the same scheme in multiple districts",
                "document_inconsistency": f"Income certificate for {citizen['name']} shows conflicting data with tax records",
                "identity_mismatch": f"Photo and biometric data mismatch detected for {citizen['name']}",
                "deceased_beneficiary": f"Death records indicate {citizen['name']} may be deceased but applications continue",
            }

            self.fraud_alerts.append({
                "id": f"FRAUD-CIT-{i+1:04d}",
                "citizen_id": citizen["id"],
                "citizen_name": citizen["name"],
                "citizen_aadhaar": citizen["aadhaar"],
                "district": citizen["district"],
                "fraud_type": ftype,
                "description": descriptions[ftype],
                "severity": self._rng.choice(["critical", "high", "medium", "low"]),
                "ai_confidence": round(self._rng.uniform(0.60, 0.97), 2),
                "status": self._rng.choice(["active", "investigating", "resolved"]),
                "detected_at": (now - timedelta(days=days_ago)).strftime("%Y-%m-%d"),
            })

    # ── Citizen Login ───────────────────────────────────────

    def login_by_mobile(self, mobile: str) -> Optional[Dict]:
        """Simulate OTP login — find citizen by mobile or create one."""
        for c in self.citizens:
            if c["mobile"] == mobile:
                return {
                    "token": f"v1-simulated-jwt-citizen-{hashlib.md5(mobile.encode()).hexdigest()[:8]}",
                    "role": "citizen",
                    "citizen_id": c["id"],
                    "name": c["name"],
                    "mobile": c["mobile"],
                    "district": c["district"],
                    "aadhaar": c["aadhaar"],
                }
        # Auto-register new citizen
        new_id = f"CIT-{len(self.citizens)+1:04d}"
        fn = self._rng.choice(FIRST_NAMES)
        ln = self._rng.choice(LAST_NAMES)
        district = self._rng.choice(DISTRICTS)
        aadhaar = f"{self._rng.randint(1000,9999)}-{self._rng.randint(1000,9999)}-{self._rng.randint(1000,9999)}"
        new_citizen = {
            "id": new_id, "name": f"{fn} {ln}", "aadhaar": aadhaar,
            "mobile": mobile, "district": district,
            "age": self._rng.randint(18, 65), "income": self._rng.randint(20000, 200000),
            "gender": self._rng.choice(["Male", "Female"]),
        }
        self.citizens.append(new_citizen)
        return {
            "token": f"v1-simulated-jwt-citizen-{hashlib.md5(mobile.encode()).hexdigest()[:8]}",
            "role": "citizen",
            "citizen_id": new_citizen["id"],
            "name": new_citizen["name"],
            "mobile": new_citizen["mobile"],
            "district": new_citizen["district"],
            "aadhaar": new_citizen["aadhaar"],
        }

    # ── Dashboard ───────────────────────────────────────────

    def get_dashboard(self, citizen_id: str) -> Dict:
        complaints = [c for c in self.complaints if c["citizen_id"] == citizen_id]
        apps = [a for a in self.scheme_applications if a["citizen_id"] == citizen_id]
        docs = [d for d in self.documents if d["citizen_id"] == citizen_id]
        notifs = [n for n in self.notifications if n["citizen_id"] == citizen_id]
        unread = [n for n in notifs if not n["read"]]

        return {
            "citizen_id": citizen_id,
            "stats": {
                "total_complaints": len(complaints),
                "resolved_complaints": len([c for c in complaints if c["status"] in ["Resolved", "Closed"]]),
                "pending_complaints": len([c for c in complaints if c["status"] not in ["Resolved", "Closed"]]),
                "total_applications": len(apps),
                "approved_applications": len([a for a in apps if a["status"] == "Approved"]),
                "pending_applications": len([a for a in apps if a["status"] in ["Submitted", "Under Review", "Document Required"]]),
                "rejected_applications": len([a for a in apps if a["status"] == "Rejected"]),
                "total_documents": len(docs),
                "verified_documents": len([d for d in docs if d["status"] == "verified"]),
                "unread_notifications": len(unread),
            },
            "recent_complaints": sorted(complaints, key=lambda x: x["submitted_at"], reverse=True)[:5],
            "recent_applications": sorted(apps, key=lambda x: x["submitted_at"], reverse=True)[:5],
            "recent_notifications": sorted(notifs, key=lambda x: x["created_at"], reverse=True)[:5],
        }

    # ── Complaints ──────────────────────────────────────────

    def get_complaints(self, citizen_id: str, status: Optional[str] = None) -> Dict:
        results = [c for c in self.complaints if c["citizen_id"] == citizen_id]
        if status:
            results = [c for c in results if c["status"] == status]
        return {"complaints": sorted(results, key=lambda x: x["submitted_at"], reverse=True), "total": len(results)}

    def submit_complaint(self, citizen_id: str, data: Dict) -> Dict:
        citizen = next((c for c in self.citizens if c["id"] == citizen_id), None)
        if not citizen:
            return {"error": "Citizen not found"}

        description = data.get("description", "")
        district = data.get("district", citizen["district"])
        complaint_type = data.get("type", "text")

        # Use real AI classification
        from services.grievance_service import analyze_grievance
        ai_result = analyze_grievance(description, urgency=3)
        dept = ai_result.get("department", data.get("department", "Revenue"))
        if dept == "Manual Review":
            dept = data.get("department", "Revenue")

        conf = ai_result.get("confidence_score", 0.5)
        if ai_result.get("escalation_recommended"):
            priority = "Critical"
        elif conf > 0.85:
            priority = "High"
        elif conf > 0.65:
            priority = "Medium"
        else:
            priority = "Low"

        new_id = f"GRV-CIT-{len(self.complaints)+1:04d}"

        complaint = {
            "id": new_id,
            "citizen_id": citizen_id,
            "citizen_name": data.get("citizen_name", citizen["name"]),
            "citizen_aadhaar": citizen["aadhaar"],
            "citizen_mobile": data.get("mobile", citizen["mobile"]),
            "district": district,
            "department": dept,
            "category": dept,
            "description": description,
            "priority": priority,
            "status": "Submitted",
            "ai_category": dept,
            "ai_department": dept,
            "ai_confidence": round(conf, 2),
            "assigned_officer": f"Officer-{self._rng.randint(1,20)}",
            "submitted_at": datetime.now().strftime("%Y-%m-%d"),
            "resolved_at": None,
            "type": complaint_type,
        }
        self.complaints.append(complaint)

        # Also save to central complaint store
        try:
            from services.complaint_store import complaint_store
            complaint_store.submit_complaint(
                description=description,
                district=district,
                citizen_name=data.get("citizen_name", citizen["name"]),
                citizen_id=citizen_id,
                citizen_phone=data.get("mobile", citizen["mobile"]),
                citizen_aadhaar=citizen["aadhaar"],
                department=dept,
                complaint_type=complaint_type,
                source="citizen",
                ai_result=ai_result,
            )
        except Exception as e:
            from utils.logger import logger
            logger.error(f"[CitizenStore] Failed to save to central store: {e}")

        return complaint

    # ── Voice Complaint ─────────────────────────────────────

    def submit_voice_complaint(self, citizen_id: str, data: Dict) -> Dict:
        citizen = next((c for c in self.citizens if c["id"] == citizen_id), None)
        if not citizen:
            return {"error": "Citizen not found"}

        transcript = data.get("transcript", "")

        # Use real AI classification on the transcript
        from services.grievance_service import analyze_grievance
        ai_result = analyze_grievance(transcript if transcript else "General complaint", urgency=3)
        dept = ai_result.get("department", "Revenue")
        if dept == "Manual Review":
            dept = "Revenue"
        conf = ai_result.get("confidence_score", 0.5)

        result = self.submit_complaint(citizen_id, {
            "citizen_name": citizen["name"],
            "mobile": citizen["mobile"],
            "district": citizen["district"],
            "department": dept,
            "description": transcript,
            "type": "voice",
        })

        result["speech_to_text"] = {
            "transcript": transcript if transcript else "No transcript available.",
            "confidence": 0.85,
            "language": "Hindi",
        }
        result["ai_classification"] = {
            "category": dept,
            "department": dept,
            "priority": result.get("priority", "Medium"),
            "confidence": round(conf, 2),
        }
        return result

    # ── Video Complaint ─────────────────────────────────────

    def submit_video_complaint(self, citizen_id: str, data: Dict) -> Dict:
        citizen = next((c for c in self.citizens if c["id"] == citizen_id), None)
        if not citizen:
            return {"error": "Citizen not found"}

        transcript = data.get("transcript", "")

        # Use real AI classification on the transcript
        from services.grievance_service import analyze_grievance
        ai_result = analyze_grievance(transcript if transcript else "Video complaint", urgency=3)
        dept = ai_result.get("department", "Revenue")
        if dept == "Manual Review":
            dept = "Revenue"
        conf = ai_result.get("confidence_score", 0.5)

        if ai_result.get("escalation_recommended"):
            priority = "Critical"
        elif conf > 0.85:
            priority = "High"
        elif conf > 0.65:
            priority = "Medium"
        else:
            priority = "Medium"

        new_id = f"VID-CIT-{len(self.video_complaints)+1:04d}"
        vc = {
            "id": new_id,
            "citizen_id": citizen_id,
            "citizen_name": citizen["name"],
            "citizen_mobile": citizen["mobile"],
            "district": citizen["district"],
            "department": dept,
            "category": dept,
            "duration": data.get("duration", 60),
            "transcript": transcript,
            "ai_classification": {
                "department": dept,
                "category": dept,
                "priority": priority,
                "confidence": round(conf, 2),
            },
            "video_url": data.get("video_url", ""),
            "transcript_hi": data.get("transcript_hi", ""),
            "translation_en": data.get("translation_en", ""),
            "speech_to_text_confidence": data.get("stt_confidence", 0.0),
            "stt_method": data.get("stt_method", "unknown"),
            "status": "Submitted",
            "forwarded_to": ["District Officer", "Super Administrator"],
            "submitted_at": datetime.now().strftime("%Y-%m-%d"),
        }
        self.video_complaints.append(vc)

        # Also save to central complaint store
        try:
            from services.complaint_store import complaint_store
            complaint_store.submit_complaint(
                description=transcript,
                district=citizen["district"],
                citizen_name=citizen["name"],
                citizen_id=citizen_id,
                citizen_phone=citizen["mobile"],
                citizen_aadhaar=citizen["aadhaar"],
                department=dept,
                complaint_type="video",
                transcript=transcript,
                transcript_hi=data.get("transcript_hi", ""),
                translation_en=data.get("translation_en", ""),
                video_url=data.get("video_url", ""),
                video_duration=data.get("duration", 60),
                stt_confidence=data.get("stt_confidence", 0.0),
                stt_method=data.get("stt_method", ""),
                source="citizen",
                ai_result=ai_result,
            )
        except Exception as e:
            from utils.logger import logger
            logger.error(f"[CitizenStore] Failed to save video complaint to central store: {e}")

        return vc

    def get_video_complaints(self, citizen_id: str) -> Dict:
        results = [v for v in self.video_complaints if v["citizen_id"] == citizen_id]
        return {"video_complaints": sorted(results, key=lambda x: x["submitted_at"], reverse=True), "total": len(results)}

    # ── Schemes ─────────────────────────────────────────────

    def get_schemes(self) -> List[Dict]:
        return SCHEMES

    def get_scheme_applications(self, citizen_id: str, status: Optional[str] = None) -> Dict:
        results = [a for a in self.scheme_applications if a["citizen_id"] == citizen_id]
        if status:
            results = [a for a in results if a["status"] == status]
        return {"applications": sorted(results, key=lambda x: x["submitted_at"], reverse=True), "total": len(results)}

    def submit_scheme_application(self, citizen_id: str, data: Dict) -> Dict:
        citizen = next((c for c in self.citizens if c["id"] == citizen_id), None)
        if not citizen:
            return {"error": "Citizen not found"}

        scheme_id = data.get("scheme_id", "SCH-WP")
        scheme = next((s for s in SCHEMES if s["id"] == scheme_id), SCHEMES[0])
        uploaded_docs = data.get("documents", [])
        docs_total = len(scheme["required_documents"])
        docs_uploaded = len(uploaded_docs)

        ai_eligible = self._rng.random() > 0.25
        ai_risk = round(self._rng.uniform(0.02, 0.40 if ai_eligible else 0.80), 2)

        doc_statuses = []
        mismatches = []
        for doc in scheme["required_documents"]:
            if doc in uploaded_docs:
                ds = self._rng.choice(["verified", "verified", "verified", "mismatch"])
                doc_statuses.append({"name": doc, "status": ds})
                if ds == "mismatch":
                    mismatches.append(f"{doc}: data inconsistency detected")
            else:
                doc_statuses.append({"name": doc, "status": "missing"})

        new_id = f"APP-CIT-{len(self.scheme_applications)+1:04d}"
        app = {
            "id": new_id,
            "citizen_id": citizen_id,
            "citizen_name": citizen["name"],
            "citizen_aadhaar": citizen["aadhaar"],
            "district": citizen["district"],
            "scheme_id": scheme_id,
            "scheme_name": scheme["name"],
            "status": "Submitted",
            "ai_eligible": ai_eligible,
            "ai_confidence": round(self._rng.uniform(0.70, 0.97), 2),
            "ai_risk_score": ai_risk,
            "ai_mismatches": mismatches,
            "docs_uploaded": docs_uploaded,
            "docs_total": docs_total,
            "documents": doc_statuses,
            "assigned_officer": f"Officer-{self._rng.randint(1,20)}",
            "submitted_at": datetime.now().strftime("%Y-%m-%d"),
            "forwarded_to_officer": True,
        }
        self.scheme_applications.append(app)
        return app

    # ── Documents ───────────────────────────────────────────

    def get_documents(self, citizen_id: str, status: Optional[str] = None) -> Dict:
        results = [d for d in self.documents if d["citizen_id"] == citizen_id]
        if status:
            results = [d for d in results if d["status"] == status]
        return {"documents": sorted(results, key=lambda x: x["uploaded_at"], reverse=True), "total": len(results)}

    def upload_document(self, citizen_id: str, data: Dict) -> Dict:
        citizen = next((c for c in self.citizens if c["id"] == citizen_id), None)
        if not citizen:
            return {"error": "Citizen not found"}

        doc_type = data.get("document_type", "Aadhaar Card")
        status = self._rng.choice(["verified", "verified", "verified", "mismatch", "suspicious"])
        issues = []
        if status == "mismatch":
            issues = [self._rng.choice([
                "Name mismatch between Aadhaar and document",
                "Address does not match Aadhaar records",
                "Date of birth inconsistency",
            ])]
        elif status == "suspicious":
            issues = [self._rng.choice([
                "Document appears to be digitally altered",
                "Certificate number not found in issuing authority database",
            ])]

        new_id = f"DOC-CIT-{len(self.documents)+1:04d}"
        doc = {
            "id": new_id,
            "citizen_id": citizen_id,
            "citizen_name": citizen["name"],
            "citizen_aadhaar": citizen["aadhaar"],
            "district": citizen["district"],
            "document_type": doc_type,
            "status": status,
            "ai_confidence": round(self._rng.uniform(0.70, 0.99), 2),
            "issues": issues,
            "uploaded_at": datetime.now().strftime("%Y-%m-%d"),
        }
        self.documents.append(doc)
        return doc

    # ── Notifications ───────────────────────────────────────

    def get_notifications(self, citizen_id: str, unread_only: bool = False) -> Dict:
        results = [n for n in self.notifications if n["citizen_id"] == citizen_id]
        if unread_only:
            results = [n for n in results if not n["read"]]
        return {"notifications": sorted(results, key=lambda x: x["created_at"], reverse=True), "total": len(results)}

    def mark_notification_read(self, notification_id: str) -> Dict:
        for n in self.notifications:
            if n["id"] == notification_id:
                n["read"] = True
                return n
        return {"error": "Notification not found"}

    # ── Fraud Prevention ────────────────────────────────────

    def get_fraud_status(self, citizen_id: str) -> Dict:
        alerts = [f for f in self.fraud_alerts if f["citizen_id"] == citizen_id]
        citizen = next((c for c in self.citizens if c["id"] == citizen_id), None)

        # Check for duplicate aadhaar
        aadhaar = citizen["aadhaar"] if citizen else ""
        dup_count = sum(1 for c in self.citizens if c["aadhaar"] == aadhaar)
        multiple_claims = len(set(a["scheme_id"] for a in self.scheme_applications if a["citizen_id"] == citizen_id))

        return {
            "citizen_id": citizen_id,
            "alerts": alerts,
            "checks": {
                "duplicate_aadhaar": dup_count > 1,
                "multiple_scheme_claims": multiple_claims > 2,
                "document_inconsistencies": any(a for a in alerts if a["fraud_type"] == "document_inconsistency"),
                "account_clean": len(alerts) == 0,
            },
            "risk_level": "high" if len(alerts) > 0 else "low",
        }

    # ── Citizen Profile ─────────────────────────────────────

    def get_citizen(self, citizen_id: str) -> Optional[Dict]:
        return next((c for c in self.citizens if c["id"] == citizen_id), None)


citizen_store = CitizenStore()
