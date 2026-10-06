import sys
import asyncio
from datetime import datetime, timezone

async def test_naive_aware():
    now = datetime.now(timezone.utc)
    last = datetime.utcnow()
    try:
        diff = (now - last).total_seconds()
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_naive_aware())
