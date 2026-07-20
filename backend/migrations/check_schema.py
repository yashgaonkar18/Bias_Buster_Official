import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import sys
import os

DATABASE_URL = "postgresql+asyncpg://postgres:varsha@localhost:5432/BiasBuster"

async def check_schema():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        for table in ["upload_records", "correction_records", "optimization_runs", "model_registry"]:
            print(f"\nChecking table: {table}")
            try:
                result = await conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'"))
                columns = [row[0] for row in result.fetchall()]
                if columns:
                    print(f"Columns: {', '.join(columns)}")
                else:
                    print(f"Table '{table}' does not exist!")
            except Exception as e:
                print(f"Error checking table {table}: {e}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_schema())
