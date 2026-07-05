from pydantic_settings import BaseSettings
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "BiasBuster"
    DEBUG: bool = True

    database_url: str
    database_url: str

    TEMP_DIR: str = str(
        Path(__file__).resolve().parent.parent / "artifacts" / "uploads"
    )
    ARTIFACT_DIR: str = str(Path(__file__).resolve().parent.parent / "artifacts")
    MAX_CSV_SIZE_BYTES: int = 50 * 1024 * 1024

    MIN_GROUP_SIZE: int = 30
    MIN_GROUP_PROPORTION: float = 0.05  # 5%
    PREDICTION_SKEW_THRESHOLD: float = 0.95

    ENABLE_BOOTSTRAP_CI: bool = True
    BOOTSTRAP_SAMPLES: int = 100

    model_config = {"env_file": Path.cwd() / ".env"}
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    
    ACCESS_TOKEN_EXPIRE_MINUTES: int  = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    RESEND_API_KEY: str = ""

    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    @property
    def DATABASE_URL(self):
        return self.database_url  # allows settings.DATABASE_URL to work


settings = Settings()
