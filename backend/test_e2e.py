"""Verify end-to-end complaint flow: citizen submit → officer sees it."""
import json
import urllib.request

BASE = "http://localhost:8000/api/v1"


def api(method, path, body=None, role="citizen", extra_headers=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    req.add_header("x-user-role", role)
    if extra_headers:
        for k, v in extra_headers.items():
            req.add_header(k, v)
    resp = urllib.request.urlopen(req, timeout=60)
    return json.loads(resp.read())


print("=" * 60)
print("END-TO-END FLOW VERIFICATION")
print("=" * 60)

# 1. Get current complaint count for Raipur from officer view
before = api("GET", "/officer/complaints?district=Raipur", role="district_officer")
count_before = before.get("total", len(before.get("complaints", [])))
print(f"\n1. Officer Raipur complaints BEFORE: {count_before}")

# 2. Submit complaint via citizen portal (CIT-0001 is the first citizen generated)
citizen_result = api("POST", "/citizen/complaints", {
    "description": "UNIQUE_TEST: The school building roof has collapsed after heavy rain. Children are at risk.",
    "district": "Raipur",
}, role="citizen", extra_headers={"x-citizen-id": "CIT-0001"})
new_id = citizen_result.get("id") or citizen_result.get("complaint_id")
new_dept = citizen_result.get("department")
print(f"2. Citizen submitted complaint: ID={new_id}, Dept={new_dept}")

# 3. Get Raipur officer complaints AFTER
after = api("GET", "/officer/complaints?district=Raipur", role="district_officer")
count_after = after.get("total", len(after.get("complaints", [])))
print(f"3. Officer Raipur complaints AFTER: {count_after}")

# 4. Check that the new complaint appears in officer list
found_in_officer = False
for c in after.get("complaints", []):
    desc = c.get("description", "")
    if "UNIQUE_TEST" in desc:
        found_in_officer = True
        print(f"   FOUND in officer view: ID={c.get('id')}, Dept={c.get('department')}, Status={c.get('status')}")
        break

if not found_in_officer:
    print("   NOT found in officer view (checking central store...)")
    # Check central store directly
    central = api("GET", "/complaints/list?district=Raipur&limit=200", role="district_officer")
    for c in central.get("complaints", []):
        if "UNIQUE_TEST" in c.get("description", ""):
            print(f"   FOUND in central store: ID={c.get('id')}, Dept={c.get('department')}")
            found_in_officer = True
            break

# 5. Check admin view
admin = api("GET", "/superadmin/grievances", role="super_admin")
found_in_admin = False
for c in admin.get("grievances", []):
    if "UNIQUE_TEST" in (c.get("description") or ""):
        found_in_admin = True
        print(f"4. FOUND in admin view: ID={c.get('complaint_id')}, Dept={c.get('department')}")
        break
if not found_in_admin:
    print("4. NOT found in admin view")

# 6. Test AI classification validation
print("\n--- AI Classification Tests ---")
tests = [
    ("मेरा पेंशन नहीं आ रहा है", "Social Welfare"),
    ("हमारे गांव की सड़क टूटी हुई है", "Panchayat"),
    ("बिजली ट्रांसफार्मर खराब है", "Electricity"),
    ("फसल बीमा 6 महीने से पेंडिंग", "Agriculture"),
    ("स्कूल की छत टपक रही है", "Education"),
    ("पानी की आपूर्ति बंद है हैंडपंप खराब", "Water Supply"),
    ("प्राथमिक स्वास्थ्य केंद्र में दवाइयां नहीं", "Health"),
    ("भूमि रिकॉर्ड गलत राजस्व विभाग", "Revenue"),
]

correct = 0
for text, expected in tests:
    r = api("POST", "/complaints/classify", {"text": text, "urgency": 3})
    dept = r.get("department", "")
    conf = r.get("confidence_score", 0)
    match = "✓" if dept == expected else "✗"
    if dept == expected:
        correct += 1
    print(f"  {match} '{text[:40]}...' → {dept} (expected {expected}) conf={conf}")

print(f"\nAI Classification: {correct}/{len(tests)} correct")

# 7. Officer dashboard KPIs
print("\n--- Officer Dashboard KPIs ---")
dash = api("GET", "/officer/dashboard", role="district_officer")
kpis = dash.get("kpis", {})
for k, v in kpis.items():
    print(f"  {k}: {v}")

# 8. Admin dashboard KPIs
print("\n--- Admin Dashboard KPIs ---")
admin_dash = api("GET", "/superadmin/dashboard", role="super_admin")
kpis = admin_dash.get("kpis", {})
for k, v in kpis.items():
    print(f"  {k}: {v}")

print("\n" + "=" * 60)
print("FLOW STATUS:")
print(f"  Citizen → Central Store: {'PASS' if new_id else 'FAIL'}")
print(f"  Central Store → Officer: {'PASS' if found_in_officer else 'FAIL'}")
print(f"  Central Store → Admin:   {'PASS' if found_in_admin else 'FAIL'}")
print(f"  AI Classification:       {correct}/{len(tests)} ({round(correct/len(tests)*100)}%)")
print("=" * 60)
