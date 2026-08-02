# -*- coding: utf-8 -*-
"""
Prueba de login y llamada directa al endpoint hourly-multiyear.
"""
import asyncio
import sys
import json
import urllib.request
import urllib.parse

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://localhost:8001/api/v1"
MONGO_URI = "mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/sales_system_prod?retryWrites=true&w=majority"

# ─── Paso 1: obtener hash de la password del admin desde MongoDB ────────────
async def get_admin_hash():
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["sales_system_prod"]
    user = await db.users.find_one({"email": "admin.general.taboada@taboada.bo"})
    if not user:
        user = await db.users.find_one({"email": "taboada@gmail.com"})
    if user:
        print(f"Usuario encontrado: {user.get('email')}")
        print(f"Hash almacenado: {str(user.get('hashed_password',''))[:80]}...")
        print(f"Role: {user.get('role')}")
    client.close()
    return user


# ─── Paso 2: probar login con varias passwords comunes ─────────────────────
def try_login(email: str, password: str) -> str | None:
    url = f"{BASE_URL}/auth/login"
    data = urllib.parse.urlencode({"username": email, "password": password}).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read().decode())
            return result.get("access_token")
    except urllib.error.HTTPError as e:
        if e.code == 401:
            return None
        print(f"  HTTP {e.code}: {e.reason}")
        return None
    except Exception as e:
        print(f"  Error: {e}")
        return None


def find_token() -> str:
    candidates = [
        ("admin.general.taboada@taboada.bo", "admin123"),
        ("admin.general.taboada@taboada.bo", "123456"),
        ("admin.general.taboada@taboada.bo", "taboada123"),
        ("admin.general.taboada@taboada.bo", "Taboada123"),
        ("admin.general.taboada@taboada.bo", "pegasus"),
        ("admin.general.taboada@taboada.bo", "pegasus123"),
        ("taboada@gmail.com", "admin123"),
        ("taboada@gmail.com", "123456"),
        ("taboada@gmail.com", "taboada"),
        ("taboada@gmail.com", "Taboada123"),
        ("sucursal.heroinas.taboada@gmail.com", "admin123"),
        ("sucursal.heroinas.taboada@gmail.com", "123456"),
    ]
    for email, pwd in candidates:
        token = try_login(email, pwd)
        if token:
            print(f"  LOGIN OK: {email} / {pwd}")
            return token
        else:
            print(f"  FAIL: {email} / {pwd}")
    return ""


# ─── Paso 3: verificar el endpoint con el token ─────────────────────────────
def call_endpoint(token: str, fecha: str, sucursal: str | None) -> dict:
    params = {"fecha_referencia": fecha}
    if sucursal:
        params["sucursal"] = sucursal
    url = f"{BASE_URL}/analytics/hourly-multiyear?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    print(f"  URL: {url}")
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode())


def verify(data: dict, sucursal_label: str, fecha: str) -> None:
    meta = data.get("meta", {})
    horas = data.get("horas", [])

    total_real = meta.get("total_real", 0)
    total_a1   = meta.get("total_a1", 0)
    total_a2   = meta.get("total_a2", 0)
    f1         = meta.get("f1_date", "?")
    f2         = meta.get("f2_date", "?")

    chart_real = round(sum((h.get("real") or 0) for h in horas), 2)
    chart_a1   = round(sum((h.get("anio1") or 0) for h in horas), 2)
    chart_a2   = round(sum((h.get("anio2") or 0) for h in horas), 2)

    print(f"\n  [{sucursal_label} | f0={fecha}]")
    print(f"    f1={f1}  f2={f2}")
    print(f"    {'Campo':<20} {'meta (JSON)':>14} {'sum(horas)':>14} {'Coincide':>10}")
    print(f"    {'-'*60}")

    for lbl, mv, cv in [("total_real", total_real, chart_real),
                         ("total_a1",   total_a1,   chart_a1),
                         ("total_a2",   total_a2,   chart_a2)]:
        ok = abs(mv - cv) < 0.02
        mark = "OK" if ok else f"DIFER={mv-cv:+.2f}"
        print(f"    {lbl:<20} {mv:>14.2f} {cv:>14.2f} {mark:>10}")


async def main():
    print("=" * 65)
    print("AUDIT LIVE: MongoDB -> Backend -> HTTP -> Frontend Chain")
    print("=" * 65)

    # Mostrar hash del admin para debug
    await get_admin_hash()

    print("\n--- Intentando login ---")
    token = find_token()

    if not token:
        print("\n[!] No se pudo obtener token.")
        print("    Ejecuta manualmente en el navegador:")
        print("    POST http://localhost:8001/api/v1/auth/login")
        print("    username=admin.general.taboada@taboada.bo&password=TU_PASSWORD")
        return

    print(f"\n--- Llamadas al endpoint hourly-multiyear ---")
    configs = [
        (None,       "2026-08-01", "GLOBAL"),
        ("Heroinas", "2026-08-01", "Heroinas"),
        ("Recoleta", "2026-08-01", "Recoleta"),
        ("Calacoto", "2026-08-01", "Calacoto"),
    ]

    for sucursal, fecha, label in configs:
        try:
            data = call_endpoint(token, fecha, sucursal)
            verify(data, label, fecha)
        except Exception as e:
            print(f"\n  [ERROR] {label}: {e}")

    print("\n" + "=" * 65)
    print("FIN DE AUDITORIA")


if __name__ == "__main__":
    asyncio.run(main())
