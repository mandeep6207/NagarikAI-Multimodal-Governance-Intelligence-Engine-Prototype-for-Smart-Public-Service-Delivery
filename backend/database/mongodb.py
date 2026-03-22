"""
MongoDB connection module for NagarikAI.

Collections:
  - citizens        citizen records (250 across 5 districts)
  - officers        district officers (25 across 5 districts)
  - complaints      all grievance complaints
  - applications    scheme applications
  - videos          video complaint metadata
  - schemes         government scheme definitions
"""

from pymongo import MongoClient, DESCENDING  # type: ignore

MONGO_URI = "mongodb://localhost:27017"

client: MongoClient = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

db = client["nagarikai"]

# Core collections
complaints_collection = db["complaints"]
citizens_collection = db["citizens"]
officers_collection = db["officers"]
applications_collection = db["applications"]
videos_collection = db["videos"]
schemes_collection = db["schemes"]

# Indexes (idempotent — safe to call on every startup)
complaints_collection.create_index("complaint_id", unique=True, sparse=True)
complaints_collection.create_index("district")
complaints_collection.create_index("status")
complaints_collection.create_index([("created_at", DESCENDING)])
citizens_collection.create_index("citizen_id", unique=True, sparse=True)
citizens_collection.create_index("district")
officers_collection.create_index("officer_id", unique=True, sparse=True)
officers_collection.create_index("district")
videos_collection.create_index("video_id", unique=True, sparse=True)