"""
Limpia proveedores/servicios de prueba e inserta los reales de CWL.
Uso: python seed_real_data.py
"""
import requests, json

API = "https://vouchers-api-production-d78f.up.railway.app"

# ── Login ──────────────────────────────────────────────────────────────────────
r = requests.post(f"{API}/api/auth/login", json={"email": "admin@thecrc.com", "password": "Admin2026!"})
r.raise_for_status()
token = r.json()["access_token"]
H = {"Authorization": f"Bearer {token}"}
print("✓ Login OK")

# ── Desactivar todo lo existente ───────────────────────────────────────────────
providers = requests.get(f"{API}/api/providers/?active_only=false", headers=H).json()
for p in providers:
    svcs = requests.get(f"{API}/api/services/?provider_id={p['provider_id']}&active_only=false", headers=H).json()
    for s in svcs:
        requests.put(f"{API}/api/services/{s['service_id']}", json={"is_active": False}, headers=H)
    requests.delete(f"{API}/api/providers/{p['provider_id']}", headers=H)
print(f"✓ {len(providers)} proveedores anteriores desactivados")

# ── Proveedores externos ───────────────────────────────────────────────────────
EXTERNAL = [
    {
        "name": "FRANKLIN ARAYA HERNANDEZ",
        "provider_type": "TRANSPORT",
        "services": [{"service_name": "Transporte Terrestre Privado", "service_type": "TRANSPORT",
                      "description": "Servicios de transporte contrato privado - Wilderness Lodge (Ene-May 2026)"}]
    },
    {
        "name": "DETOXIGEN SRL",
        "provider_type": "TRANSPORT",
        "services": [{"service_name": "Transfer Aeropuerto / Local", "service_type": "TRANSPORT",
                      "description": "Transfer Airport / Transfer Local / External Transfer Airport / External Transfer Local"}]
    },
    {
        "name": "LAGUNAS DEL CORCOVADO SRL",
        "provider_type": "TRANSPORT",
        "services": [{"service_name": "Transporte en Lancha", "service_type": "TRANSPORT",
                      "description": "Transporte en lancha"}]
    },
    {
        "name": "ELIZABETH MONTIEL MORA",
        "provider_type": "TRANSPORT",
        "services": [{"service_name": "Transfer en Bote / Manglares", "service_type": "TRANSPORT",
                      "description": "Transfer bote entrando a Casa Corcovado / transfer manglares y Mar"}]
    },
    {
        "name": "LUIS ALEXIS GARCIA MARTINEZ",
        "provider_type": "TOUR",
        "services": [{"service_name": "Transporte Turístico a Caballo", "service_type": "ACTIVITY",
                      "description": "Transporte de turistas a caballo de día"}]
    },
    {
        "name": "CENTRAL AMERICAN AIR CHARTERS SA",
        "provider_type": "TRANSPORT",
        "services": [{"service_name": "Transporte Aéreo de Pasajeros", "service_type": "TRANSPORT",
                      "description": "Servicios de transporte aéreo nacional no regular de pasajeros - Tobías Bolaños Airport to Drake Bay"}]
    },
    {
        "name": "SERVICIOS AEREOS NACIONALES SA",
        "provider_type": "TRANSPORT",
        "services": [{"service_name": "Transporte Aéreo de Carga", "service_type": "TRANSPORT",
                      "description": "Cargas y encomiendas - Servicios de transporte aéreo de carga"}]
    },
    {
        "name": "MARIO BONILLA MENA",
        "provider_type": "TRANSPORT",
        "services": [{"service_name": "Transporte General", "service_type": "TRANSPORT",
                      "description": "Transporte general"}]
    },
    {
        "name": "3-102-805532 SOCIEDAD DE RESPONSABILIDAD LIMITADA",
        "provider_type": "TRANSPORT",
        "services": [{"service_name": "Servicio de Transporte", "service_type": "TRANSPORT",
                      "description": "Servicio de transporte"}]
    },
    {
        "name": "3-102-904147 SRL",
        "provider_type": "TRANSPORT",
        "services": [{"service_name": "Transporte", "service_type": "TRANSPORT",
                      "description": "[1011] Transporte"}]
    },
    {
        "name": "SAPOA ADVENTURES S.A.",
        "provider_type": "TOUR",
        "services": [
            {"service_name": "Private Senior Guide Hike & Photography", "service_type": "TOUR",
             "description": "Private senior guide hike & photography"},
            {"service_name": "Cacao Ceremony", "service_type": "ACTIVITY",
             "description": "Cacao ceremony"},
            {"service_name": "Roundtable Discussion", "service_type": "ACTIVITY",
             "description": "Roundtable discussion"},
        ]
    },
    {
        "name": "INNOCEANA INTERN",
        "provider_type": "TRANSPORT",
        "services": [{"service_name": "Combustible para Actividades en Bote", "service_type": "TRANSPORT",
                      "description": "Boat fuel for hotel activities"}]
    },
    {
        "name": "ATV LA CUMBRE SOCIEDAD ANONIMA",
        "provider_type": "TOUR",
        "services": [{"service_name": "Tours en ATV", "service_type": "ACTIVITY",
                      "description": "ATV (All Terrain Vehicle) tours"}]
    },
    {
        "name": "GRUAS SH SRL",
        "provider_type": "OTHER",
        "services": [{"service_name": "Servicio de Grúas / Carga Pesada", "service_type": "OTHER",
                      "description": "Traslado de montacargas (Heredia a Corcovado y Ojochal)"}]
    },
    {
        "name": "BLUETECH",
        "provider_type": "OTHER",
        "services": [{"service_name": "Envío / Logística", "service_type": "OTHER",
                      "description": "Envío - transporte de encomiendas"}]
    },
    {
        "name": "BIONESTLY NATURAL SRL (BIOSFERA)",
        "provider_type": "TRANSPORT",
        "services": [{"service_name": "Transporte de Negocios Locales", "service_type": "TRANSPORT",
                      "description": "Transporte de negocios locales"}]
    },
]

# ── Actividades propias del hotel ──────────────────────────────────────────────
CWL_OWN_SERVICES = [
    {"service_name": "Birdwatching Tour",                             "service_type": "TOUR",     "description": "Tour de naturaleza — avistamiento de aves"},
    {"service_name": "Corcovado Hike Tour",                           "service_type": "TOUR",     "description": "Tour de senderismo dentro del Parque Corcovado"},
    {"service_name": "Mangrove Tour",                                 "service_type": "TOUR",     "description": "Tour de naturaleza por los manglares"},
    {"service_name": "Night Walk Tour",                               "service_type": "TOUR",     "description": "Tour de naturaleza nocturno"},
    {"service_name": "Horseback Riding Tour",                         "service_type": "ACTIVITY", "description": "Cabalgata turística"},
    {"service_name": "Snorkeling Caño Island",                        "service_type": "TOUR",     "description": "Tour acuático — snorkeling en Isla del Caño"},
    {"service_name": "Scuba Diving Caño Island",                      "service_type": "TOUR",     "description": "Tour acuático — buceo en Isla del Caño"},
    {"service_name": "Fishing Tour (10 / 30 Miles)",                  "service_type": "TOUR",     "description": "Tour de pesca deportiva (10 o 30 millas)"},
    {"service_name": "Whale Watching",                                "service_type": "TOUR",     "description": "Tour acuático — avistamiento de ballenas"},
    {"service_name": "Kayak Tour",                                    "service_type": "ACTIVITY", "description": "Tour acuático en kayak"},
    {"service_name": "Garden Tour",                                   "service_type": "TOUR",     "description": "Tour cultural por los jardines del hotel"},
    {"service_name": "San Josecito Tour",                             "service_type": "TOUR",     "description": "Tour de naturaleza — San Josecito"},
    {"service_name": "Sirena Tour",                                   "service_type": "TOUR",     "description": "Tour de naturaleza — Estación Sirena"},
    {"service_name": "Boat Transportation Package",                   "service_type": "TRANSPORT","description": "Transfer acuático — paquete de transporte en bote"},
    {"service_name": "Sea Boat Transfer (Drake / Sierpe Package)",    "service_type": "TRANSPORT","description": "Transfer acuático — Drake Bay / Sierpe"},
    {"service_name": "Transfer SJO / Quepos / Uvita / Manuel Antonio","service_type": "TRANSPORT","description": "Transfer terrestre — SJO / Quepos / Uvita / Manuel Antonio / Pérez Zeledón"},
    {"service_name": "Nahuala Waterfalls",                            "service_type": "TOUR",     "description": "Tour de naturaleza — Cataratas Nahuala"},
    {"service_name": "Tour Package",                                  "service_type": "TOUR",     "description": "Paquete combinado de tours"},
]

# ── Insertar proveedores externos ──────────────────────────────────────────────
created = 0
for pdata in EXTERNAL:
    svcs = pdata.pop("services")
    r = requests.post(f"{API}/api/providers/", json=pdata, headers=H)
    if r.status_code not in (200, 201):
        print(f"  ERROR proveedor {pdata['name']}: {r.text}")
        continue
    pid = r.json()["provider_id"]
    for svc in svcs:
        svc.update({"provider_id": pid, "base_price": 0.00, "currency": "USD"})
        rs = requests.post(f"{API}/api/services/", json=svc, headers=H)
        if rs.status_code not in (200, 201):
            print(f"    ERROR servicio {svc['service_name']}: {rs.text}")
    created += 1
    print(f"  ✓ {pdata['name']} ({len(svcs)} servicio(s))")

# ── Insertar proveedor: CWL Actividades Propias ────────────────────────────────
cwl = {"name": "CORCOVADO WILDERNESS LODGE (Actividades Propias)",
       "provider_type": "TOUR"}
r = requests.post(f"{API}/api/providers/", json=cwl, headers=H)
r.raise_for_status()
cwl_id = r.json()["provider_id"]
for svc in CWL_OWN_SERVICES:
    svc.update({"provider_id": cwl_id, "base_price": 0.00, "currency": "USD"})
    rs = requests.post(f"{API}/api/services/", json=svc, headers=H)
    if rs.status_code not in (200, 201):
        print(f"    ERROR {svc['service_name']}: {rs.text}")
print(f"  ✓ CWL Actividades Propias ({len(CWL_OWN_SERVICES)} servicios)")

print(f"\n✅ Listo — {created + 1} proveedores, {sum(len(p.get('services', [])) for p in EXTERNAL) + len(CWL_OWN_SERVICES)} servicios creados")
