"""
MongoDB Seed Script — populates citizens, officers, schemes, and videos collections.

Per district (5 districts):
  - 50 citizens   = 250 total
  -  5 officers   =  25 total
  - 20 complaints = 100 total  (handled by complaint_store bootstrap)
  -  4 schemes    =  4 total (shared across districts)

Run:  python -m scripts.seed_mongodb
"""

import random
import sys
import os
from datetime import datetime, timedelta

# Allow running from backend/ directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database.mongodb import (
    citizens_collection,
    officers_collection,
    schemes_collection,
    videos_collection,
    complaints_collection,
    db,
)

DISTRICTS = ["Raipur", "Bilaspur", "Durg", "Korba", "Jagdalpur"]

DEPARTMENTS = [
    "Agriculture", "Revenue", "Education", "Panchayat",
    "Electricity", "Social Welfare", "Health", "Water Supply",
]

FIRST_NAMES_MALE = [
    "Ramesh", "Mohan", "Sunil", "Rakesh", "Vijay",
    "Amit", "Raj", "Suresh", "Manoj", "Arun",
    "Deepak", "Sanjay", "Ganesh", "Pradeep", "Ravi",
]
FIRST_NAMES_FEMALE = [
    "Sunita", "Priya", "Anita", "Kavita", "Meena",
    "Geeta", "Shalini", "Rekha", "Neha", "Pooja",
    "Seema", "Kamla", "Lakshmi", "Savitri", "Radha",
]
LAST_NAMES = [
    "Sahu", "Verma", "Patel", "Yadav", "Sharma", "Tiwari",
    "Singh", "Kumar", "Gupta", "Das", "Nag", "Thakur",
    "Rajput", "Dewangan", "Markam", "Netam", "Mishra",
]

OFFICER_DESIGNATIONS = [
    "Sub-Divisional Magistrate", "Block Development Officer",
    "Tehsildar", "District Program Officer", "Assistant Director",
]

SCHEMES = [
    {
        "scheme_id": "SCH-001",
        "name": "Widow Pension",
        "department": "Social Welfare",
        "benefit": "₹1,000/month",
        "description": "Monthly pension for widows below poverty line.",
        "eligibility_rules": [
            "Applicant must be a widow",
            "Age ≥ 18 years",
            "Annual household income < ₹1,00,000",
            "Resident of Chhattisgarh",
        ],
        "required_documents": ["Aadhaar Card", "Death Certificate of spouse", "Income Certificate", "BPL Certificate", "Bank Passbook"],
    },
    {
        "scheme_id": "SCH-002",
        "name": "Old Age Pension",
        "department": "Social Welfare",
        "benefit": "₹500–₹700/month",
        "description": "Monthly pension for senior citizens aged 60+.",
        "eligibility_rules": [
            "Age ≥ 60 years",
            "Annual household income < ₹1,00,000",
            "Resident of Chhattisgarh",
            "Not receiving pension from other government scheme",
        ],
        "required_documents": ["Aadhaar Card", "Age Proof", "Income Certificate", "BPL Certificate", "Bank Passbook"],
    },
    {
        "scheme_id": "SCH-003",
        "name": "Farmer Insurance",
        "department": "Agriculture",
        "benefit": "Up to ₹2,00,000 crop coverage",
        "description": "Crop insurance for small and marginal farmers.",
        "eligibility_rules": [
            "Must own agricultural land (up to 5 acres)",
            "Must be an active farmer",
            "Resident of Chhattisgarh",
        ],
        "required_documents": ["Aadhaar Card", "Land Document / Khasra", "Bank Passbook", "Crop sowing certificate"],
    },
    {
        "scheme_id": "SCH-004",
        "name": "Scholarship",
        "department": "Education",
        "benefit": "₹5,000–₹20,000/year",
        "description": "Educational scholarship for SC/ST/OBC students.",
        "eligibility_rules": [
            "Student must belong to SC/ST/OBC category",
            "Annual family income < ₹2,50,000",
            "At least 60% in last exam",
            "Enrolled in recognized institution",
        ],
        "required_documents": ["Aadhaar Card", "Mark Sheet", "Caste Certificate", "Income Certificate", "Enrollment proof"],
    },
]

VIDEO_TRANSCRIPTS = [
    ("Sir, my pension has not been credited for three months. Please help.", "Social Welfare", "Pension Delay"),
    ("The road in our village is damaged for six months. Children cannot go to school.", "Panchayat", "Road Infrastructure"),
    ("Water supply has been irregular for weeks. Hand pump is broken.", "Water Supply", "Water Supply Issue"),
    ("Electricity cuts daily for 4-5 hours. Transformer is faulty.", "Electricity", "Electricity Disruption"),
    ("My crop insurance claim has not been processed for 6 months.", "Agriculture", "Insurance Delay"),
    ("Primary health centre has no medicines. Doctor comes twice a week.", "Health", "Health Service"),
    ("School roof is leaking. Walls have cracks.", "Education", "Education Facility"),
    ("Land records have wrong entries. Revenue dept not correcting.", "Revenue", "Land Dispute"),
    ("Open drain near our house causing diseases.", "Panchayat", "Sanitation Issue"),
    ("Ration card application pending for 4 months.", "Revenue", "Ration Card Problem"),
]


def seed():
    rnd = random.Random(42)
    now = datetime.utcnow()

    # ── Citizens ────────────────────────────────────
    if citizens_collection.count_documents({}) == 0:
        citizen_docs = []
        for district in DISTRICTS:
            for i in range(50):
                gender = "male" if rnd.random() > 0.48 else "female"
                first = rnd.choice(FIRST_NAMES_MALE if gender == "male" else FIRST_NAMES_FEMALE)
                last = rnd.choice(LAST_NAMES)
                citizen_docs.append({
                    "citizen_id": f"CIT-{district[:3].upper()}-{i+1:04d}",
                    "name": f"{first} {last}",
                    "gender": gender,
                    "age": rnd.randint(18, 78),
                    "aadhaar": f"{rnd.randint(1000,9999)}-{rnd.randint(1000,9999)}-{rnd.randint(1000,9999)}",
                    "phone": f"+91-{rnd.randint(70000,99999)}{rnd.randint(10000,99999)}",
                    "district": district,
                    "ward": f"Ward {rnd.randint(1, 40)}",
                    "income": rnd.randint(15000, 250000),
                    "category": rnd.choice(["General", "OBC", "SC", "ST"]),
                })
        citizens_collection.insert_many(citizen_docs)
        print(f"✓ Inserted {len(citizen_docs)} citizens into MongoDB")
    else:
        print(f"  Citizens already populated ({citizens_collection.count_documents({})} docs)")

    # ── Officers ────────────────────────────────────
    if officers_collection.count_documents({}) == 0:
        officer_docs = []
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
            rnd.shuffle(dept_pool)
            for j in range(5):
                idx += 1
                name = f"{officer_first[idx % len(officer_first)]} {rnd.choice(LAST_NAMES)}"
                officer_docs.append({
                    "officer_id": f"OFF-{district[:3].upper()}-{j+1:02d}",
                    "name": name,
                    "designation": rnd.choice(OFFICER_DESIGNATIONS),
                    "district": district,
                    "department": dept_pool[j % len(dept_pool)],
                    "performance_score": round(rnd.uniform(55, 98), 1),
                    "cases_assigned": rnd.randint(5, 30),
                    "phone": f"+91-{rnd.randint(70000,99999)}{rnd.randint(10000,99999)}",
                    "email": f"{name.split()[0].lower()}.{name.split()[1].lower()}@cg.gov.in",
                })
        officers_collection.insert_many(officer_docs)
        print(f"✓ Inserted {len(officer_docs)} officers into MongoDB")
    else:
        print(f"  Officers already populated ({officers_collection.count_documents({})} docs)")

    # ── Schemes ─────────────────────────────────────
    if schemes_collection.count_documents({}) == 0:
        schemes_collection.insert_many(SCHEMES)
        print(f"✓ Inserted {len(SCHEMES)} schemes into MongoDB")
    else:
        print(f"  Schemes already populated ({schemes_collection.count_documents({})} docs)")

    # ── Videos ──────────────────────────────────────
    if videos_collection.count_documents({}) == 0:
        video_docs = []
        for district in DISTRICTS:
            for i in range(4):
                transcript_text, dept, category = rnd.choice(VIDEO_TRANSCRIPTS)
                days_ago = rnd.randint(0, 20)
                video_docs.append({
                    "video_id": f"VID-{district[:3].upper()}-{i+1:03d}",
                    "citizen_id": f"CIT-{district[:3].upper()}-{rnd.randint(1,50):04d}",
                    "citizen_name": f"{rnd.choice(FIRST_NAMES_MALE)} {rnd.choice(LAST_NAMES)}",
                    "district": district,
                    "video_url": f"/uploads/videos/{district.lower()}_complaint_{i+1}.mp4",
                    "duration_seconds": rnd.randint(30, 180),
                    "transcript": transcript_text,
                    "ai_department": dept,
                    "ai_category": category,
                    "ai_confidence": round(rnd.uniform(0.75, 0.97), 2),
                    "status": rnd.choice(["Pending Review", "Verified", "Escalated"]),
                    "submitted_at": (now - timedelta(days=days_ago)).isoformat(),
                })
        videos_collection.insert_many(video_docs)
        print(f"✓ Inserted {len(video_docs)} video records into MongoDB")
    else:
        print(f"  Videos already populated ({videos_collection.count_documents({})} docs)")

    # ── Complaints (handled by complaint_store bootstrap) ─
    count = complaints_collection.count_documents({})
    if count == 0:
        print("  Complaints will be bootstrapped on first server start via complaint_store.")
    else:
        print(f"  Complaints already populated ({count} docs)")

    print("\n✅ MongoDB seed complete!")
    print(f"   Database: {db.name}")
    print(f"   Citizens:   {citizens_collection.count_documents({})}")
    print(f"   Officers:   {officers_collection.count_documents({})}")
    print(f"   Schemes:    {schemes_collection.count_documents({})}")
    print(f"   Videos:     {videos_collection.count_documents({})}")
    print(f"   Complaints: {complaints_collection.count_documents({})}")


if __name__ == "__main__":
    seed()
