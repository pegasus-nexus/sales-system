import re
import asyncio

async def test():
    search = "CAJA PI"
    safe_search = re.escape(search)
    print("re.escape output:", repr(safe_search))
    print("Replacing \\\\ :", repr(safe_search.replace("\\ ", " ")))

asyncio.run(test())
