# -*- coding: utf-8 -*-
"""
Genera token con sub = user.username y hace peticiones HTTP reales a localhost:8001
"""
import sys
import json
import urllib.request
import urllib.parse
from datetime import timedelta

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://127.0.0.1:8001/api/v1"

async def get_token():
    from app.db import init_db
    from app.domain.models.user import User
    from app.infrastructure.auth import create_access_token

    await init_db()
    user = await User.find_one({"email": "taboada@gmail.com"})
    if not user:
        user = await User.find_one({"tenant_id": "69cd7f0a8f3f6866d4cfbb62"})
    
    token_data = {
        "sub": user.username or user.email,
        "tenant_id": user.tenant_id,
    }
    return create_access_token(data=token_data, expires_delta=timedelta(minutes=60))

def fetch_http(token, fecha, sucursal=None):
    params = {"fecha_referencia": fecha}
    if sucursal:
        params["sucursal"] = sucursal
    
    url = f"{BASE_URL}/analytics/hourly-multiyear?{urllib.parse.urlencode(params)}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    req = urllib.request.Request(url, headers=headers)
    
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode("utf-8")
        return url, json.loads(body)

def main():
    import asyncio
    token = asyncio.run(get_token())

    print("=" * 85)
    print("EVIDENCIA EN TIEMPO DE EJECUCIÓN: PETICIÓN NETWORK AL SERVIDOR (LOCALHOST:8001)")
    print("=" * 85)

    for suc in ["Recoleta", "Calacoto", "Heroinas", None]:
        suc_label = suc or "GLOBAL"
        url, data = fetch_http(token, "2026-08-01", suc)
        
        meta = data.get("meta", {})
        horas = data.get("horas", [])

        print(f"\n--- PETICIÓN NETWORK PARA: {suc_label} ---")
        print(f"Request URL: {url}")
        print(f"Response JSON meta:")
        print(f"  meta.total_real:       {meta.get('total_real')}")
        print(f"  meta.total_a1:         {meta.get('total_a1')}")
        print(f"  meta.total_a2:         {meta.get('total_a2')}")
        print(f"  meta.is_reference_a1:  {meta.get('is_reference_a1')}")
        print(f"  meta.anio1_label:      '{meta.get('anio1_label')}'")
        print(f"  meta.docs_real:        {meta.get('docs_real')}")
        print(f"  meta.docs_a1:          {meta.get('docs_a1')}")
        print(f"  meta.docs_a2:          {meta.get('docs_a2')}")
        
        print("\n  Primeras 5 horas del array 'horas':")
        for h in horas[:5]:
            print(f"    Hora {h.get('hora')}: real={h.get('real')}, anio1={h.get('anio1')}, anio2={h.get('anio2')}")

if __name__ == "__main__":
    main()
