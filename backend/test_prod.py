import asyncio
import aiohttp
import json

async def test_prod_api():
    async with aiohttp.ClientSession() as session:
        url = "https://sales-system-api-vx2r.onrender.com/api/v1/analytics/hourly-multiyear?fecha_referencia=2026-08-11"
        # We need authorization header, but we don't have a token.
        # Let's just look at the last commit time on render if we can.
        # Or I can just tell the user!
        pass

if __name__ == '__main__':
    print('No auth token available, but I understand the root cause.')
