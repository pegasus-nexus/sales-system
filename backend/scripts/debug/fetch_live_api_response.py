# -*- coding: utf-8 -*-
"""
Fetch directo por HTTP al servidor activo FastAPI (localhost:8001)
"""
import sys
import json
import urllib.request
import urllib.parse

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://127.0.0.1:8001/api/v1"

def get_auth_token():
    url = f"{BASE_URL}/token"
    data = urllib.parse.urlencode({
        "username": "admin@sales.com",
        "password": "password123"
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            return res_json.get("access_token")
    except Exception as e:
        print(f"Error con admin@sales.com: {e}")
        # Probar superadmin
        data2 = urllib.parse.urlencode({
            "username": "superadmin@sales.com",
            "password": "password123"
        }).encode("utf-8")
        req2 = urllib.request.Request(url, data=data2, headers={"Content-Type": "application/x-www-form-urlencoded"})
        try:
            with urllib.request.urlopen(req2) as resp2:
                res_json2 = json.loads(resp2.read().decode("utf-8"))
                return res_json2.get("access_token")
        except Exception as e2:
            print(f"Error con superadmin@sales.com: {e2}")
            return None

def fetch_hourly_multiyear(token, fecha, sucursal=None):
    params = {"fecha_referencia": fecha}
    if sucursal:
        params["sucursal"] = sucursal
    
    url = f"{BASE_URL}/analytics/hourly-multiyear?{urllib.parse.urlencode(params)}"
    headers = {"Authorization": f"Bearer {token}"}
    req = urllib.request.Request(url, headers=headers)
    
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode("utf-8")
        return url, json.loads(body)

def main():
    token = get_auth_token()
    if not token:
        print("No se pudo obtener token HTTP.")
        return

    print("==========================================================================")
    print("EVIDENCIA EN TIEMPO DE EJECUCIÓN (HTTP NETWORK FETCH A LOCALHOST:8001)")
    print("==========================================================================")

    for suc in ["Recoleta", "Calacoto", "Heroinas", None]:
        suc_label = suc or "GLOBAL"
        url, data = fetch_hourly_multiyear(token, "2026-08-01", suc)
        
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
        
        print("\nPrimeras 5 horas del array 'horas':")
        for h in horas[:5]:
            print(f"  Hora {h.get('hora')}: real={h.get('real')}, anio1={h.get('anio1')}, anio2={h.get('anio2')}")

if __name__ == "__main__":
    main()
