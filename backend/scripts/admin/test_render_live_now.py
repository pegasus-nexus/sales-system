import asyncio
import httpx

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        h = await client.get("https://sales-system-aptb.onrender.com/docs")
        print("Docs status:", h.status_code)

if __name__ == "__main__":
    asyncio.run(main())
