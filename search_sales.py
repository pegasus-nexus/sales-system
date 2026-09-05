import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def main():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    db = client["salessystem_prod"]  # Wait, production DB is in Render, not local localhost? 
    # Ah, I should use the backend's db configuration.
