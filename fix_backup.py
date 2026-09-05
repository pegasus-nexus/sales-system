with open('backend/scripts/ops/backup_mongodb.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('from app.db import get_raw_db', 'from motor.motor_asyncio import AsyncIOMotorClient')
c = c.replace('db = await get_raw_db()', 'client = AsyncIOMotorClient("mongodb+srv://admin_prod:VigKJWIIMV6CXKsH@sales-system.hh277gd.mongodb.net/?retryWrites=true&w=majority")\n    db = client["sales_system_prod"]')

with open('backend/scripts/ops/backup_mongodb.py', 'w', encoding='utf-8') as f:
    f.write(c)
