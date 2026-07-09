import asyncio
from app.db import engine, Base

# Import all models so they are registered with Base.metadata
import app.models

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    asyncio.run(create_tables())