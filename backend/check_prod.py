import asyncio
import aiohttp

async def check_prod():
    async with aiohttp.ClientSession() as session:
        # We need a token... wait, is there any public endpoint that can tell us the commit hash or version?
        url = "https://sales-system-api-vx2r.onrender.com/"
        try:
            async with session.get(url) as response:
                print(f"Status: {response.status}")
                text = await response.text()
                print(f"Body: {text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(check_prod())
