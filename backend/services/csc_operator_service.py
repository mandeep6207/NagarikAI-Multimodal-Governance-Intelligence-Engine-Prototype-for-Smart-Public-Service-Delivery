"""
CSC Operator Service — comprehensive data store for the CSC Operator portal.

Provides mock data and analytics for:
- CSC Dashboard (stats, alerts)
- Complaint Submission & Tracking
- Video Complaint Recording & Speech-to-Text
- Document Upload & AI Verification
- Scheme Application System (eligibility, card display)
- Fraud Detection (duplicate Aadhaar, fake docs, multi-scheme)
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

DOCUMENT_TYPES = [
    "Aadhaar Card", "Ration Card", "Income Certificate",
    "Death Certificate", "BPL Certificate", "Caste Certificate",
    "Bank Passbook", "Land Document", "Mark Sheet", "Age Proof",
]

VIDEO_TRANSCRIPTS = [
    "Sir, my pension has not been credited for the last three months. I have visited the office multiple times but no one is responding. Please help me get my pension released.",
    "The road in our village has been damaged for over six months. During rainy season water logging is very bad. Children cannot go to school. We need immediate repair work.",
    "Our ward has not received water supply for the past two weeks. The hand pump is also broken. We are buying water from private tankers at high cost.",
    "I applied for ration card renewal four months ago but still have not received the new card. The old card has expired and I am not getting rations.",
    "The electricity transformer in our area got damaged during storm. It has been five days with no power. Food is getting spoiled, students cannot study.",
    "I am a farmer and applied for crop insurance six months ago. The claim has not been processed yet. My entire crop was damaged in flood.",
    "The primary health centre in our village has no medicines and only one doctor who comes twice a week. Pregnant women have to travel 40 km for delivery.",
    "My husband died two years ago and I applied for widow pension but it was rejected saying documents incomplete. I have submitted all documents.",
    "The drainage system in our colony is completely blocked. Sewage water is overflowing on the street. It is causing diseases among children.",
    "I am a disabled person and applied for disability pension one year ago. My application is still pending. I cannot work and have no income.",
    "My daughter got 92 percent marks but her scholarship application was rejected. The reason given was wrong caste certificate.",
    "The government borewell installed two years ago has stopped working. The motor is burnt and no one has come to repair it.",
]


class CscOperatorStore:
    """Comprehensive mock data store for the CSC Operator portal."""

    def __init__(self, seed: int = 77):
        self._rnd = random.Random(seed)
        self.citizens: List[Dict[str, Any]] = []
        self.complaints: List[Dict[str, Any]] = []
        self.video_complaints: List[Dict[str, Any]] = []
        self.scheme_applications: List[Dict[str, Any]] = []
        self.uploaded_documents: List[Dict[str, Any]] = []
        self.fraud_alerts: List[Dict[str, Any]] = []
        self._next_complaint_id = 1
        self._next_app_id = 1
        self._next_video_id = 1
        self._next_doc_id = 1
        self._next_fraud_id = 1
        self._bootstrap()

    def _bootstrap(self) -> None:
        self._generate_citizens()
        self._generate_complaints()
        self._generate_video_complaints()
        self._generate_scheme_applications()
        self._generate_documents()
        self._generate_fraud_alerts()

    # ─── Helpers ────────────────────────────────────────────────
    def _hash(self, val: str) -> str:
        return hashlib.sha256(val.encode()).hexdigest()[:8]

    def _random_date(self, days_back: int) -> str:
        dt = datetime.now() - timedelta(days=self._rnd.randint(0, days_back))
        return dt.strftime("%Y-%m-%d %H:%M")

    def _random_aadhaar(self, district: str, idx: int) -> str:
        return f"{self._rnd.randint(2000, 9999)}-{self._rnd.randint(1000, 9999)}-{self._rnd.randint(1000, 9999)}"

    def _random_phone(self) -> str:
        return f"+91-{self._rnd.randint(70000, 99999)}{self._rnd.randint(10000, 99999)}"

    # ─── Data Generation ────────────────────────────────────────

    def _generate_citizens(self) -> None:
        for district in DISTRICTS:
            count = self._rnd.randint(50, 70)
            for i in range(count):
                gender = "male" if self._rnd.random() > 0.48 else "female"
                first = self._rnd.choice(FIRST_NAMES_MALE if gender == "male" else FIRST_NAMES_FEMALE)
                last = self._rnd.choice(LAST_NAMES)
                name = f"{first} {last}"
                aadhaar = self._random_aadhaar(district, i)
                ward = self._rnd.randint(1, 30)
                age = self._rnd.randint(18, 82)
                income = self._rnd.choice([18000, 24000, 36000, 42000, 55000, 68000, 78000, 95000, 120000, 150000])
                self.citizens.append({
                    "id": f"CIT-{district[:3].upper()}-{i+1:04d}",
                    "name": name,
                    "gender": gender,
                    "age": age,
                    "aadhaar": aadhaar,
                    "phone": self._random_phone(),
                    "district": district,
                    "address": f"Ward {ward}, {district}",
                    "income": income,
                    "bpl": income < 80000,
                })

    def _generate_complaints(self) -> None:
        now = datetime.now()
        for district in DISTRICTS:
            d_citizens = [c for c in self.citizens if c["district"] == district]
            count = self._rnd.randint(20, 35)
            for _ in range(count):
                citizen = self._rnd.choice(d_citizens)
                dept = self._rnd.choice(DEPARTMENTS)
                category = self._rnd.choice(COMPLAINT_CATEGORIES)
                priority = self._rnd.choices(["Low", "Medium", "High", "Critical"], weights=[15, 40, 30, 15])[0]
                status = self._rnd.choices(
                    ["Submitted", "Forwarded", "In Progress", "Resolved", "Rejected"],
                    weights=[30, 20, 20, 20, 10],
                )[0]
                submitted_dt = now - timedelta(days=self._rnd.randint(0, 30), hours=self._rnd.randint(0, 23))
                cid = f"CMP-{district[:3].upper()}-{self._next_complaint_id:05d}"
                self._next_complaint_id += 1

                descriptions = [
                    f"Citizen {citizen['name']} from {citizen['address']} has raised a grievance regarding {category.lower()} issue in the {dept} department.",
                    f"Complaint about {category.lower()} — the issue has been pending for several weeks. Citizen visited CSC for formal registration.",
                    f"Service delay complaint for {dept} department related to {category.lower()}. Citizen reports no response from concerned authority.",
                ]

                self.complaints.append({
                    "id": cid,
                    "citizen_id": citizen["id"],
                    "citizen_name": citizen["name"],
                    "citizen_phone": citizen["phone"],
                    "citizen_aadhaar": citizen["aadhaar"],
                    "district": district,
                    "department": dept,
                    "category": category,
                    "priority": priority,
                    "status": status,
                    "description": self._rnd.choice(descriptions),
                    "submitted_at": submitted_dt.strftime("%Y-%m-%d %H:%M"),
                    "forwarded_to_officer": status in ("Forwarded", "In Progress", "Resolved"),
                    "forwarded_to_admin": status in ("In Progress", "Resolved") and self._rnd.random() > 0.5,
                    "ai_category": category,
                    "ai_department": dept,
                    "ai_priority": priority,
                    "ai_confidence": round(self._rnd.uniform(0.72, 0.98), 2),
                })

    def _generate_video_complaints(self) -> None:
        now = datetime.now()
        for district in DISTRICTS:
            d_citizens = [c for c in self.citizens if c["district"] == district]
            count = self._rnd.randint(3, 6)
            for _ in range(count):
                citizen = self._rnd.choice(d_citizens)
                transcript = self._rnd.choice(VIDEO_TRANSCRIPTS)
                dept = self._rnd.choice(DEPARTMENTS)
                category = self._rnd.choice(COMPLAINT_CATEGORIES)
                status = self._rnd.choices(["Recorded", "Transcribed", "Forwarded", "Reviewed"], weights=[20, 30, 30, 20])[0]
                vid = f"VID-{district[:3].upper()}-{self._next_video_id:04d}"
                self._next_video_id += 1
                duration = self._rnd.randint(30, 180)
                recorded_dt = now - timedelta(days=self._rnd.randint(0, 20), hours=self._rnd.randint(0, 12))

                self.video_complaints.append({
                    "id": vid,
                    "citizen_id": citizen["id"],
                    "citizen_name": citizen["name"],
                    "citizen_phone": citizen["phone"],
                    "district": district,
                    "department": dept,
                    "category": category,
                    "priority": self._rnd.choice(["Medium", "High", "Critical"]),
                    "status": status,
                    "duration_seconds": duration,
                    "duration_display": f"{duration // 60}:{duration % 60:02d}",
                    "transcript": transcript,
                    "recorded_at": recorded_dt.strftime("%Y-%m-%d %H:%M"),
                    "speech_to_text_confidence": round(self._rnd.uniform(0.80, 0.97), 2),
                    "ai_classified_department": dept,
                    "ai_classified_category": category,
                    "ai_classified_priority": self._rnd.choice(["Medium", "High", "Critical"]),
                    "ai_confidence": round(self._rnd.uniform(0.75, 0.96), 2),
                    "forwarded_to_officer": status in ("Forwarded", "Reviewed"),
                    "forwarded_to_admin": status == "Reviewed" and self._rnd.random() > 0.4,
                })

    def _generate_scheme_applications(self) -> None:
        now = datetime.now()
        for district in DISTRICTS:
            d_citizens = [c for c in self.citizens if c["district"] == district]
            count = self._rnd.randint(12, 22)
            for _ in range(count):
                citizen = self._rnd.choice(d_citizens)
                scheme = self._rnd.choice(SCHEMES)
                status = self._rnd.choices(
                    ["Draft", "Submitted", "Under Review", "Approved", "Rejected", "Document Required"],
                    weights=[10, 25, 20, 20, 15, 10],
                )[0]
                app_id = f"APP-{district[:3].upper()}-{self._next_app_id:05d}"
                self._next_app_id += 1

                # AI Eligibility Simulation
                income_eligible = citizen["income"] < 100000
                docs_uploaded = self._rnd.randint(len(scheme["required_documents"]) - 2, len(scheme["required_documents"]))
                docs_total = len(scheme["required_documents"])
                doc_mismatch = self._rnd.random() > 0.7
                ai_eligible = income_eligible and docs_uploaded >= docs_total - 1 and not doc_mismatch
                risk_score = round(self._rnd.uniform(0.05, 0.35) if ai_eligible else self._rnd.uniform(0.40, 0.90), 2)

                submitted_dt = now - timedelta(days=self._rnd.randint(0, 45))

                uploaded_docs = []
                for j, doc_name in enumerate(scheme["required_documents"]):
                    if j < docs_uploaded:
                        doc_status = "mismatch" if doc_mismatch and j == 0 else "verified"
                        uploaded_docs.append({
                            "name": doc_name,
                            "status": doc_status,
                            "uploaded_at": (submitted_dt - timedelta(hours=self._rnd.randint(1, 48))).strftime("%Y-%m-%d %H:%M"),
                        })
                    else:
                        uploaded_docs.append({"name": doc_name, "status": "missing"})

                self.scheme_applications.append({
                    "id": app_id,
                    "citizen_id": citizen["id"],
                    "citizen_name": citizen["name"],
                    "citizen_aadhaar": citizen["aadhaar"],
                    "citizen_phone": citizen["phone"],
                    "citizen_income": citizen["income"],
                    "citizen_age": citizen["age"],
                    "district": district,
                    "scheme_id": scheme["id"],
                    "scheme_name": scheme["name"],
                    "scheme_department": scheme["department"],
                    "status": status,
                    "submitted_at": submitted_dt.strftime("%Y-%m-%d %H:%M"),
                    "documents": uploaded_docs,
                    "docs_uploaded": docs_uploaded,
                    "docs_total": docs_total,
                    "ai_eligible": ai_eligible,
                    "ai_confidence": round(self._rnd.uniform(0.70, 0.97), 2),
                    "ai_risk_score": risk_score,
                    "ai_mismatches": ["Name mismatch between Aadhaar and Ration Card"] if doc_mismatch else [],
                    "forwarded_to_officer": status in ("Submitted", "Under Review", "Approved", "Rejected"),
                })

    def _generate_documents(self) -> None:
        """Generate standalone document verification records."""
        now = datetime.now()
        for district in DISTRICTS:
            d_citizens = [c for c in self.citizens if c["district"] == district]
            count = self._rnd.randint(15, 30)
            for _ in range(count):
                citizen = self._rnd.choice(d_citizens)
                doc_type = self._rnd.choice(DOCUMENT_TYPES)
                did = f"DOC-{district[:3].upper()}-{self._next_doc_id:05d}"
                self._next_doc_id += 1

                # AI verification simulation
                verification_status = self._rnd.choices(
                    ["Verified", "Mismatch Detected", "Suspicious", "Pending"],
                    weights=[50, 20, 10, 20],
                )[0]
                ai_issues: List[str] = []
                if verification_status == "Mismatch Detected":
                    ai_issues = [self._rnd.choice([
                        "Name mismatch: Aadhaar vs Ration Card",
                        "Address differs between documents",
                        "Date of birth discrepancy",
                        "Father's name mismatch",
                    ])]
                elif verification_status == "Suspicious":
                    ai_issues = [self._rnd.choice([
                        "Possible duplicate Aadhaar number detected",
                        "Document appears to be digitally altered",
                        "Font inconsistency detected in certificate",
                        "Signature does not match records",
                    ])]

                self.uploaded_documents.append({
                    "id": did,
                    "citizen_id": citizen["id"],
                    "citizen_name": citizen["name"],
                    "citizen_aadhaar": citizen["aadhaar"],
                    "district": district,
                    "document_type": doc_type,
                    "verification_status": verification_status,
                    "ai_confidence": round(self._rnd.uniform(0.70, 0.99), 2),
                    "ai_issues": ai_issues,
                    "uploaded_at": (now - timedelta(days=self._rnd.randint(0, 30))).strftime("%Y-%m-%d %H:%M"),
                })

    def _generate_fraud_alerts(self) -> None:
        """Generate fraud detection alerts."""
        now = datetime.now()
        fraud_types = [
            ("Duplicate Aadhaar", "Same Aadhaar number found in multiple applications across districts. Possible identity fraud."),
            ("Document Forgery", "AI image analysis detected potential digital alteration in uploaded certificate."),
            ("Multiple Scheme Claims", "Citizen has active applications in more than 3 schemes simultaneously. Possible fraud."),
            ("Identity Mismatch", "Photograph and biometric data do not match Aadhaar records."),
            ("Deceased Beneficiary", "Applicant appears in death registry. Pension claim may be fraudulent."),
            ("Duplicate Aadhaar", "Aadhaar number already registered under different name in another district."),
            ("Multiple Scheme Claims", "Same household has claimed benefits under both Widow Pension and Old Age Pension."),
            ("Document Forgery", "Income certificate appears to have been tampered — digit alteration detected."),
            ("Duplicate Aadhaar", "Three applications from same Aadhaar in last 30 days across different CSC centers."),
            ("Identity Mismatch", "Face recognition score below threshold when compared with Aadhaar photo."),
        ]

        for district in DISTRICTS:
            d_citizens = [c for c in self.citizens if c["district"] == district]
            count = self._rnd.randint(3, 7)
            for _ in range(count):
                citizen = self._rnd.choice(d_citizens)
                fraud_type, detail = self._rnd.choice(fraud_types)
                fid = f"FRD-{district[:3].upper()}-{self._next_fraud_id:04d}"
                self._next_fraud_id += 1

                severity = self._rnd.choices(["Low", "Medium", "High", "Critical"], weights=[10, 30, 40, 20])[0]
                status = self._rnd.choices(["Active", "Under Investigation", "Resolved", "Dismissed"], weights=[35, 30, 20, 15])[0]

                self.fraud_alerts.append({
                    "id": fid,
                    "citizen_id": citizen["id"],
                    "citizen_name": citizen["name"],
                    "citizen_aadhaar": citizen["aadhaar"],
                    "district": district,
                    "fraud_type": fraud_type,
                    "detail": detail,
                    "severity": severity,
                    "status": status,
                    "ai_confidence": round(self._rnd.uniform(0.65, 0.98), 2),
                    "detected_at": (now - timedelta(days=self._rnd.randint(0, 30))).strftime("%Y-%m-%d %H:%M"),
                })

    # ─── Query Methods ──────────────────────────────────────────

    def get_dashboard(self, district: Optional[str] = None) -> Dict[str, Any]:
        now = datetime.now()
        today = now.strftime("%Y-%m-%d")

        complaints = [c for c in self.complaints if not district or c["district"] == district]
        apps = [a for a in self.scheme_applications if not district or a["district"] == district]
        docs = [d for d in self.uploaded_documents if not district or d["district"] == district]
        frauds = [f for f in self.fraud_alerts if not district or f["district"] == district]

        today_complaints = [c for c in complaints if c["submitted_at"][:10] == today]
        today_apps = [a for a in apps if a["submitted_at"][:10] == today]

        # Recent activity for last 7 days
        recent_activity = []
        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
            day_label = (now - timedelta(days=i)).strftime("%d %b")
            c_count = len([c for c in complaints if c["submitted_at"][:10] == day])
            a_count = len([a for a in apps if a["submitted_at"][:10] == day])
            recent_activity.append({"date": day_label, "complaints": c_count, "applications": a_count})

        return {
            "kpis": {
                "total_complaints_today": len(today_complaints),
                "total_applications_today": len(today_apps),
                "total_complaints": len(complaints),
                "total_applications": len(apps),
                "pending_applications": len([a for a in apps if a["status"] in ("Draft", "Submitted", "Under Review")]),
                "approved_applications": len([a for a in apps if a["status"] == "Approved"]),
                "rejected_applications": len([a for a in apps if a["status"] == "Rejected"]),
                "doc_mismatch_alerts": len([d for d in docs if d["verification_status"] in ("Mismatch Detected", "Suspicious")]),
                "active_fraud_alerts": len([f for f in frauds if f["status"] in ("Active", "Under Investigation")]),
                "forwarded_to_officer": len([c for c in complaints if c["forwarded_to_officer"]]),
            },
            "recent_activity": recent_activity,
            "scheme_distribution": self._scheme_distribution(apps),
            "status_distribution": self._status_distribution(apps),
            "department_complaints": self._department_complaint_counts(complaints),
            "district": district or "All",
        }

    def _scheme_distribution(self, apps: List[Dict]) -> List[Dict]:
        counts: Dict[str, int] = {}
        for a in apps:
            counts[a["scheme_name"]] = counts.get(a["scheme_name"], 0) + 1
        return [{"scheme": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]

    def _status_distribution(self, apps: List[Dict]) -> List[Dict]:
        counts: Dict[str, int] = {}
        for a in apps:
            counts[a["status"]] = counts.get(a["status"], 0) + 1
        return [{"status": k, "count": v} for k, v in counts.items()]

    def _department_complaint_counts(self, complaints: List[Dict]) -> List[Dict]:
        counts: Dict[str, int] = {}
        for c in complaints:
            counts[c["department"]] = counts.get(c["department"], 0) + 1
        return [{"department": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]

    def get_complaints(self, district: Optional[str] = None, status: Optional[str] = None) -> Dict[str, Any]:
        result = self.complaints[:]
        if district:
            result = [c for c in result if c["district"] == district]
        if status:
            result = [c for c in result if c["status"] == status]
        return {"complaints": result, "total": len(result)}

    def submit_complaint(self, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now()
        district = data.get("district", "Raipur")
        desc = data.get("description", "")
        cid = f"CMP-{district[:3].upper()}-{self._next_complaint_id:05d}"
        self._next_complaint_id += 1

        # Use real AI classification
        from services.grievance_service import analyze_grievance
        ai_result = analyze_grievance(desc if desc else "CSC complaint submission", urgency=3)
        ai_dept = ai_result.get("department", data.get("department", "Revenue"))
        if ai_dept == "Manual Review":
            ai_dept = data.get("department", "Revenue")
        ai_conf = round(ai_result.get("confidence_score", 0.5), 2)
        ai_category = ai_dept

        conf = ai_result.get("confidence_score", 0.5)
        if ai_result.get("escalation_recommended"):
            ai_priority = "Critical"
        elif conf > 0.85:
            ai_priority = "High"
        elif conf > 0.65:
            ai_priority = "Medium"
        else:
            ai_priority = "Low"

        complaint = {
            "id": cid,
            "citizen_id": data.get("citizen_id", ""),
            "citizen_name": data.get("citizen_name", ""),
            "citizen_phone": data.get("mobile", ""),
            "citizen_aadhaar": data.get("aadhaar", ""),
            "district": district,
            "department": ai_dept,
            "category": ai_category,
            "priority": ai_priority,
            "status": "Submitted",
            "description": desc,
            "submitted_at": now.strftime("%Y-%m-%d %H:%M"),
            "forwarded_to_officer": True,
            "forwarded_to_admin": False,
            "ai_category": ai_category,
            "ai_department": ai_dept,
            "ai_priority": ai_priority,
            "ai_confidence": ai_conf,
        }
        self.complaints.append(complaint)

        # Also save to central complaint store
        try:
            from services.complaint_store import complaint_store
            complaint_store.submit_complaint(
                description=desc,
                district=district,
                citizen_name=data.get("citizen_name", ""),
                citizen_phone=data.get("mobile", ""),
                citizen_aadhaar=data.get("aadhaar", ""),
                department=ai_dept,
                complaint_type="text",
                source="csc",
                ai_result=ai_result,
            )
        except Exception as e:
            from utils.logger import logger
            logger.error(f"[CscOperatorStore] Failed to save to central store: {e}")

        return complaint

    def get_video_complaints(self, district: Optional[str] = None) -> Dict[str, Any]:
        result = self.video_complaints[:]
        if district:
            result = [v for v in result if v["district"] == district]
        return {"videos": result, "total": len(result)}

    def record_video_complaint(self, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now()
        district = data.get("district", "Raipur")
        vid = f"VID-{district[:3].upper()}-{self._next_video_id:04d}"
        self._next_video_id += 1

        transcript = data.get("transcript", self._rnd.choice(VIDEO_TRANSCRIPTS))

        # Use real AI classification on the transcript
        from services.grievance_service import analyze_grievance
        ai_result = analyze_grievance(transcript if transcript else "Video complaint", urgency=3)
        dept = ai_result.get("department", "Revenue")
        if dept == "Manual Review":
            dept = "Revenue"
        category = dept
        conf = ai_result.get("confidence_score", 0.5)

        if ai_result.get("escalation_recommended"):
            priority = "Critical"
        elif conf > 0.85:
            priority = "High"
        elif conf > 0.65:
            priority = "Medium"
        else:
            priority = "Medium"

        video = {
            "id": vid,
            "citizen_id": data.get("citizen_id", ""),
            "citizen_name": data.get("citizen_name", ""),
            "citizen_phone": data.get("mobile", ""),
            "district": district,
            "department": dept,
            "category": category,
            "priority": priority,
            "status": "Transcribed",
            "duration_seconds": data.get("duration", self._rnd.randint(30, 180)),
            "duration_display": "",
            "transcript": transcript,
            "transcript_hi": data.get("transcript_hi", ""),
            "translation_en": data.get("translation_en", ""),
            "video_url": data.get("video_url", ""),
            "recorded_at": now.strftime("%Y-%m-%d %H:%M"),
            "speech_to_text_confidence": data.get("stt_confidence", 0.0),
            "stt_method": data.get("stt_method", "unknown"),
            "ai_classified_department": dept,
            "ai_classified_category": category,
            "ai_classified_priority": priority,
            "ai_confidence": round(conf, 2),
            "forwarded_to_officer": True,
            "forwarded_to_admin": True,
        }
        dur = video["duration_seconds"]
        video["duration_display"] = f"{dur // 60}:{dur % 60:02d}"
        self.video_complaints.append(video)

        # Also save to central complaint store
        try:
            from services.complaint_store import complaint_store
            complaint_store.submit_complaint(
                description=transcript,
                district=district,
                citizen_name=data.get("citizen_name", ""),
                citizen_phone=data.get("mobile", ""),
                department=dept,
                complaint_type="video",
                transcript=transcript,
                transcript_hi=data.get("transcript_hi", ""),
                translation_en=data.get("translation_en", ""),
                video_url=data.get("video_url", ""),
                video_duration=data.get("duration", 60),
                stt_confidence=data.get("stt_confidence", 0.0),
                stt_method=data.get("stt_method", ""),
                source="csc",
                ai_result=ai_result,
            )
        except Exception as e:
            from utils.logger import logger
            logger.error(f"[CscOperatorStore] Failed to save video to central store: {e}")

        return video

    def get_documents(self, district: Optional[str] = None, status: Optional[str] = None) -> Dict[str, Any]:
        result = self.uploaded_documents[:]
        if district:
            result = [d for d in result if d["district"] == district]
        if status:
            result = [d for d in result if d["verification_status"] == status]
        return {"documents": result, "total": len(result)}

    def upload_document(self, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now()
        district = data.get("district", "Raipur")
        did = f"DOC-{district[:3].upper()}-{self._next_doc_id:05d}"
        self._next_doc_id += 1

        doc_type = data.get("document_type", "Aadhaar Card")

        # AI verification simulation
        has_mismatch = self._rnd.random() > 0.65
        is_suspicious = self._rnd.random() > 0.85 and not has_mismatch
        if has_mismatch:
            v_status = "Mismatch Detected"
            issues = [self._rnd.choice([
                "Name mismatch: Aadhaar vs uploaded document",
                "Address differs between documents",
                "Date of birth discrepancy",
            ])]
        elif is_suspicious:
            v_status = "Suspicious"
            issues = ["Possible digital alteration detected"]
        else:
            v_status = "Verified"
            issues = []

        doc = {
            "id": did,
            "citizen_id": data.get("citizen_id", ""),
            "citizen_name": data.get("citizen_name", ""),
            "citizen_aadhaar": data.get("citizen_aadhaar", ""),
            "district": district,
            "document_type": doc_type,
            "verification_status": v_status,
            "ai_confidence": round(self._rnd.uniform(0.72, 0.98), 2),
            "ai_issues": issues,
            "uploaded_at": now.strftime("%Y-%m-%d %H:%M"),
        }
        self.uploaded_documents.append(doc)
        return doc

    def get_schemes(self) -> List[Dict[str, Any]]:
        return SCHEMES

    def get_scheme_applications(self, district: Optional[str] = None, scheme: Optional[str] = None, status: Optional[str] = None) -> Dict[str, Any]:
        result = self.scheme_applications[:]
        if district:
            result = [a for a in result if a["district"] == district]
        if scheme:
            result = [a for a in result if a["scheme_id"] == scheme]
        if status:
            result = [a for a in result if a["status"] == status]
        return {"applications": result, "total": len(result)}

    def submit_scheme_application(self, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now()
        district = data.get("district", "Raipur")
        scheme_id = data.get("scheme_id", "SCH-WP")
        scheme = next((s for s in SCHEMES if s["id"] == scheme_id), SCHEMES[0])

        app_id = f"APP-{district[:3].upper()}-{self._next_app_id:05d}"
        self._next_app_id += 1

        income = data.get("income", 50000)
        income_eligible = income < 100000
        docs = data.get("documents", [])
        docs_uploaded = len(docs)
        docs_total = len(scheme["required_documents"])
        doc_mismatch = self._rnd.random() > 0.75
        ai_eligible = income_eligible and docs_uploaded >= docs_total - 1 and not doc_mismatch
        risk_score = round(self._rnd.uniform(0.05, 0.30) if ai_eligible else self._rnd.uniform(0.45, 0.85), 2)

        uploaded_docs = []
        for j, doc_name in enumerate(scheme["required_documents"]):
            if j < docs_uploaded:
                doc_status = "mismatch" if doc_mismatch and j == 0 else "verified"
                uploaded_docs.append({"name": doc_name, "status": doc_status, "uploaded_at": now.strftime("%Y-%m-%d %H:%M")})
            else:
                uploaded_docs.append({"name": doc_name, "status": "missing"})

        application = {
            "id": app_id,
            "citizen_id": data.get("citizen_id", ""),
            "citizen_name": data.get("citizen_name", ""),
            "citizen_aadhaar": data.get("citizen_aadhaar", ""),
            "citizen_phone": data.get("citizen_phone", ""),
            "citizen_income": income,
            "citizen_age": data.get("citizen_age", 0),
            "district": district,
            "scheme_id": scheme["id"],
            "scheme_name": scheme["name"],
            "scheme_department": scheme["department"],
            "status": "Submitted",
            "submitted_at": now.strftime("%Y-%m-%d %H:%M"),
            "documents": uploaded_docs,
            "docs_uploaded": docs_uploaded,
            "docs_total": docs_total,
            "ai_eligible": ai_eligible,
            "ai_confidence": round(self._rnd.uniform(0.75, 0.96), 2),
            "ai_risk_score": risk_score,
            "ai_mismatches": ["Name mismatch between Aadhaar and Ration Card"] if doc_mismatch else [],
            "forwarded_to_officer": True,
        }
        self.scheme_applications.append(application)
        return application

    def get_fraud_alerts(self, district: Optional[str] = None, severity: Optional[str] = None) -> Dict[str, Any]:
        result = self.fraud_alerts[:]
        if district:
            result = [f for f in result if f["district"] == district]
        if severity:
            result = [f for f in result if f["severity"] == severity]
        return {
            "alerts": result,
            "total": len(result),
            "summary": {
                "duplicate_aadhaar": len([f for f in result if f["fraud_type"] == "Duplicate Aadhaar"]),
                "document_forgery": len([f for f in result if f["fraud_type"] == "Document Forgery"]),
                "multiple_claims": len([f for f in result if f["fraud_type"] == "Multiple Scheme Claims"]),
                "identity_mismatch": len([f for f in result if f["fraud_type"] == "Identity Mismatch"]),
                "deceased_beneficiary": len([f for f in result if f["fraud_type"] == "Deceased Beneficiary"]),
            },
        }

    def get_ai_integrations(self) -> Dict[str, Any]:
        return {
            "speech_to_text": {
                "status": "Active",
                "model": "Whisper-CG-v2",
                "avg_confidence": 0.91,
                "languages": ["Hindi", "Chhattisgarhi", "English"],
                "total_processed": len(self.video_complaints),
            },
            "grievance_classification": {
                "status": "Active",
                "model": "GovClassifier-v3",
                "categories": len(COMPLAINT_CATEGORIES),
                "departments": len(DEPARTMENTS),
                "avg_confidence": 0.88,
                "total_classified": len(self.complaints),
            },
            "eligibility_prediction": {
                "status": "Active",
                "model": "EligibilityNet-v2",
                "schemes_supported": len(SCHEMES),
                "avg_confidence": 0.85,
                "total_analyzed": len(self.scheme_applications),
            },
            "document_verification": {
                "status": "Active",
                "model": "DocVerify-AI-v1",
                "document_types": len(DOCUMENT_TYPES),
                "avg_confidence": 0.87,
                "mismatches_detected": len([d for d in self.uploaded_documents if d["verification_status"] == "Mismatch Detected"]),
                "suspicious_detected": len([d for d in self.uploaded_documents if d["verification_status"] == "Suspicious"]),
            },
            "fraud_detection": {
                "status": "Active",
                "model": "FraudGuard-v2",
                "total_alerts": len(self.fraud_alerts),
                "active_alerts": len([f for f in self.fraud_alerts if f["status"] == "Active"]),
            },
        }


# Singleton
csc_operator_store = CscOperatorStore()
