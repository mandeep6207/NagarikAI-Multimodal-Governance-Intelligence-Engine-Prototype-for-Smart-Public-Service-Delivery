"""Quick API test script — tests all core endpoints."""
import json
import urllib.request
import sys

BASE = "http://localhost:8000/api/v1"
HEADERS = {"Content-Type": "application/json", "x-user-role": "citizen"}


def api(method, path, body=None, role="citizen", extra_headers=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    req.add_header("x-user-role", role)
    if extra_headers:
        for k, v in extra_headers.items():
            req.add_header(k, v)
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        return json.loads(resp.read())
    except Exception as e:
        return {"ERROR": str(e)}


def test(label, result):
    ok = "ERROR" not in result
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {label}")
    if not ok:
        print(f"       {result['ERROR']}")
    return ok


print("=" * 60)
print("NagarikAI Backend — Endpoint Tests")
print("=" * 60)

passed = 0
failed = 0

# 1. Complaint stats (requires officer role)
r = api("GET", "/complaints/stats", role="district_officer")
if test("GET /complaints/stats", r):
    print(f"       Total: {r.get('total')}, Open: {r.get('open')}, Resolved: {r.get('resolved')}")
    passed += 1
else:
    failed += 1

# 2. Submit complaint (English)
r = api("POST", "/complaints/submit", {
    "description": "My pension has not been credited for the last three months",
    "district": "Raipur",
    "citizen_name": "Test User",
    "source": "citizen",
})
if test("POST /complaints/submit (English pension)", r):
    print(f"       ID: {r.get('id')}, Dept: {r.get('ai_department')}, Conf: {r.get('ai_confidence')}")
    passed += 1
else:
    failed += 1

# 3. Submit complaint (Hindi)
r = api("POST", "/complaints/submit", {
    "description": "मेरा पेंशन नहीं आ रहा है। तीन महीने से कोई पैसा नहीं मिला।",
    "district": "Bilaspur",
    "citizen_name": "Hindi Test User",
    "source": "citizen",
})
if test("POST /complaints/submit (Hindi pension → Social Welfare)", r):
    print(f"       ID: {r.get('id')}, Dept: {r.get('ai_department')}, Conf: {r.get('ai_confidence')}")
    passed += 1
else:
    failed += 1

# 4. AI classify only (no save)
r = api("POST", "/complaints/classify", {
    "text": "हमारे गांव की सड़क छह महीने से टूटी हुई है",
    "urgency": 4,
})
if test("POST /complaints/classify (Hindi road → Panchayat)", r):
    print(f"       Dept: {r.get('department')}, Conf: {r.get('confidence_score')}")
    passed += 1
else:
    failed += 1

# 5. Submit voice complaint
r = api("POST", "/complaints/submit-voice", {
    "transcript": "The water supply in our ward has been stopped for two weeks",
    "district": "Durg",
    "citizen_name": "Voice User",
    "source": "citizen",
})
if test("POST /complaints/submit-voice (water → Water Supply)", r):
    print(f"       ID: {r.get('id')}, Dept: {r.get('ai_department')}, Type: {r.get('type')}")
    passed += 1
else:
    failed += 1

# 6. Submit video complaint
r = api("POST", "/complaints/submit-video", {
    "transcript": "Electricity transformer got damaged during storm, five days no power",
    "district": "Korba",
    "citizen_name": "Video User",
    "source": "citizen",
    "duration": 45,
})
if test("POST /complaints/submit-video (electricity → Electricity)", r):
    print(f"       ID: {r.get('id')}, Dept: {r.get('ai_department')}, Type: {r.get('type')}")
    passed += 1
else:
    failed += 1

# 7. Complaint list
r = api("GET", "/complaints/list?district=Raipur&limit=5")
if test("GET /complaints/list?district=Raipur", r):
    print(f"       Total: {r.get('total')}, Returned: {len(r.get('complaints', []))}")
    passed += 1
else:
    failed += 1

# 8. Officer dashboard
r = api("GET", "/officer/dashboard", role="district_officer")
if test("GET /officer/dashboard", r):
    print(f"       Active: {r.get('active_complaints')}, Districts: {len(r.get('district_summary', []))}")
    passed += 1
else:
    failed += 1

# 9. Officer complaints
r = api("GET", "/officer/complaints?district=Raipur", role="district_officer")
if test("GET /officer/complaints?district=Raipur", r):
    print(f"       Total: {r.get('total')}, Returned: {len(r.get('complaints', []))}")
    passed += 1
else:
    failed += 1

# 10. Admin dashboard
r = api("GET", "/superadmin/dashboard", role="super_admin")
if test("GET /superadmin/dashboard", r):
    print(f"       Total: {r.get('total_grievances')}, Districts: {len(r.get('district_wise', []))}")
    passed += 1
else:
    failed += 1

# 11. Admin grievances
r = api("GET", "/superadmin/grievances", role="super_admin")
if test("GET /superadmin/grievances", r):
    print(f"       Total: {r.get('total')}, Returned: {len(r.get('grievances', []))}")
    passed += 1
else:
    failed += 1

# 12. Admin AI insights
r = api("GET", "/superadmin/ai-insights", role="super_admin")
if test("GET /superadmin/ai-insights", r):
    print(f"       Depts: {len(r.get('department_breakdown', []))}")
    passed += 1
else:
    failed += 1

# 13. Citizen dashboard (requires x-citizen-id header)
r = api("GET", "/citizen/dashboard", role="citizen", extra_headers={"x-citizen-id": "CIT-0001"})
if test("GET /citizen/dashboard", r):
    passed += 1
else:
    failed += 1

# 14. Citizen complaints (requires x-citizen-id header)
r = api("POST", "/citizen/complaints", {
    "description": "बिजली रोज 4-5 घंटे कटती है। ट्रांसफार्मर खराब है।",
    "district": "Raipur",
}, role="citizen", extra_headers={"x-citizen-id": "CIT-0001"})
if test("POST /citizen/complaints (Hindi electricity)", r):
    print(f"       ID: {r.get('complaint_id')}, Dept: {r.get('department')}")
    passed += 1
else:
    failed += 1

# 15. CSC submit (uses 'aadhaar' and 'mobile' field names)
r = api("POST", "/csc-portal/complaints", {
    "citizen_name": "CSC Test Citizen",
    "aadhaar": "1234-5678-9012",
    "mobile": "+91-9876543210",
    "district": "Jagdalpur",
    "department": "",
    "description": "My crop insurance claim has not been processed for 6 months. Flood destroyed my crops.",
}, role="csc_operator")
if test("POST /csc-portal/complaints (crop insurance → Agriculture)", r):
    print(f"       ID: {r.get('complaint_id')}, Dept: {r.get('department')}")
    passed += 1
else:
    failed += 1

print()
print("=" * 60)
print(f"RESULTS: {passed} passed, {failed} failed, {passed + failed} total")
print("=" * 60)

sys.exit(0 if failed == 0 else 1)
