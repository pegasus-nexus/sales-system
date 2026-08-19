import asyncio
import aiohttp

async def check_prod():
    async with aiohttp.ClientSession() as session:
        url = "https://sales-system-api-vx2r.onrender.com/api/v1/health"
        try:
            async with session.get(url) as response:
                print(f"Status: {response.status}")
                text = await response.text()
                print(f"Body: {text}")
        except Exception as e:
            pass

if __name__ == '__main__':
    asyncio.run(check_prod())
