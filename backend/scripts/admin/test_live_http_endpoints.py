import asyncio
import httpx
import json

async def test_live_http():
    # Probemos llamar directamente a la API de producción de Vercel/Render
    url_vercel = "https://sales-system-kappa.vercel.app/api/v1/analytics/hourly-multiyear?fecha_referencia=2026-08-11&clear_cache=true"
    
    print("==========================================================================")
    print("PROBANDO ENDPOINT HTTP DE PRODUCCIÓN VERCEL/RENDER:")
    print("==========================================================================")
    print(f"URL: {url_vercel}")

    async with httpx.AsyncClient() as client:
        try:
            # Primero probemos si requiere token o si es libre/health
            resp = await client.get(url_vercel, timeout=10.0)
            print(f"Status Code: {resp.status_code}")
            print(f"Response Body (primeros 500 chars):\n{resp.text[:500]}")
        except Exception as e:
            print(f"Error consultando endpoint HTTP: {e}")

if __name__ == '__main__':
    asyncio.run(test_live_http())
