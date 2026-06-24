import requests, sys

API = "https://vouchers-api-production-d78f.up.railway.app"

r = requests.post(f"{API}/api/auth/login", json={"email": "admin@thecrc.com", "password": "Admin2026!"})
r.raise_for_status()
H = {"Authorization": f"Bearer " + r.json()["access_token"]}

svcs = requests.get(f"{API}/api/services/?active_only=false", headers=H).json()
for s in svcs:
    requests.put(f"{API}/api/services/{s['service_id']}", json={"is_active": False}, headers=H)

print(f"OK — {len(svcs)} servicios eliminados")
