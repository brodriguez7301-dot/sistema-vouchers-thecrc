"""
Carga el tarifario aprobado 2026 desde SERVICIOS 2026.xlsx.
Uso: python seed_services_2026.py
"""
import requests, pandas as pd, numpy as np

API  = "https://vouchers-api-production-d78f.up.railway.app"
XLSX = r"C:\Users\finco\Downloads\SERVICIOS 2026.xlsx"

# ── Login ──────────────────────────────────────────────────────────────────────
r = requests.post(f"{API}/api/auth/login", json={"email": "admin@thecrc.com", "password": "Admin2026!"})
r.raise_for_status()
H = {"Authorization": "Bearer " + r.json()["access_token"]}
print("Login OK")

# ── Desactivar servicios anteriores ───────────────────────────────────────────
svcs = requests.get(f"{API}/api/services/?active_only=false", headers=H).json()
for s in svcs:
    requests.put(f"{API}/api/services/{s['service_id']}", json={"is_active": False}, headers=H)
print(f"{len(svcs)} servicios anteriores desactivados")

# ── Parsear Excel ──────────────────────────────────────────────────────────────
df = pd.read_excel(XLSX, header=None)
df[0] = df[0].ffill()                # forward-fill category
data = df.iloc[3:].copy()            # skip header rows
data.columns = ["category", "pricing_code", "service_name",
                "agency_shared", "agency_private",
                "direct_shared", "direct_private", "web"]

# Map category -> service_type
TYPE_MAP = {"TOURS": "TOUR", "SPA": "ACTIVITY", "TRANSFERS": "TRANSPORT", "OTHERS": "OTHER"}

def to_float(v):
    try:
        f = float(v)
        return round(f, 2) if not np.isnan(f) else None
    except Exception:
        return None

# ── Insertar servicios ─────────────────────────────────────────────────────────
ok = 0
for _, row in data.iterrows():
    code = str(row["pricing_code"]).strip() if pd.notna(row["pricing_code"]) else None
    name = str(row["service_name"]).strip().replace('"', '').strip() if pd.notna(row["service_name"]) else None
    if not name or not code:
        continue

    cat  = str(row["category"]).strip().upper() if pd.notna(row["category"]) else "OTHERS"
    stype = TYPE_MAP.get(cat, "OTHER")

    prices = {
        "price_agency_shared":  to_float(row["agency_shared"]),
        "price_agency_private": to_float(row["agency_private"]),
        "price_direct_shared":  to_float(row["direct_shared"]),
        "price_direct_private": to_float(row["direct_private"]),
        "price_web":            to_float(row["web"]),
    }
    # base_price = minimum non-null price
    non_null = [v for v in prices.values() if v is not None]
    base = min(non_null) if non_null else None

    payload = {
        "service_name":  name,
        "service_type":  stype,
        "pricing_code":  code,
        "category":      cat,
        "year":          2026,
        "currency":      "USD",
        "base_price":    base,
        **{k: v for k, v in prices.items() if v is not None},
    }

    rs = requests.post(f"{API}/api/services/", json=payload, headers=H)
    if rs.status_code in (200, 201):
        ok += 1
        print(f"  OK [{code}] {name}")
    else:
        print(f"  ERROR [{code}] {name}: {rs.text}")

print(f"\nListo — {ok} servicios cargados")
