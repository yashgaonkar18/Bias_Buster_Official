from pydantic_settings import BaseSettings
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "BiasBuster"
    DEBUG: bool = True

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
    
    ACCESS_TOKEN_EXPIRE_MINUTES: int  = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None

    GITHUB_CLIENT_ID: str | None = None
    GITHUB_CLIENT_SECRET: str | None = None

    RESEND_API_KEY: str | None = None

    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    EMAIL_FROM: str = "BiasBuster <onboarding@resend.dev>"
    EMAIL_REPLY_TO: str = "support@biasbuster.com"
    EMAIL_SUPPORT: str = "support@biasbuster.com"

    @property
    def DATABASE_URL(self):
        return self.database_url  # allows settings.DATABASE_URL to work


settings = Settings()
