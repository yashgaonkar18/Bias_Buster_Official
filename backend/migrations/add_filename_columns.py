import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import sys
import os

# Add the parent directory to sys.path to import settings if needed
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# We can hardcode the URL from the .env or try to import it
# Given the error, we know the URL
DATABASE_URL = "postgresql+asyncpg://postgres:varsha@localhost:5432/BiasBuster"

async def run_migration():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL)
    try:
        async with engine.begin() as conn:
            print("Checking for upload_records table...")
            
            print("Adding original_dataset_filename column to upload_records...")
            await conn.execute(text("ALTER TABLE upload_records ADD COLUMN IF NOT EXISTS original_dataset_filename VARCHAR"))
            
            print("Adding original_model_filename column to upload_records...")
            await conn.execute(text("ALTER TABLE upload_records ADD COLUMN IF NOT EXISTS original_model_filename VARCHAR"))
            
            print("Migration successful!")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
