from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from app import AI_ENV_PATH, dotenv_disabled

# Development-only default so a fresh checkout runs without extra setup.
# The backend ships the same default; both refuse to start with it in production.
DEV_INTERNAL_SERVICE_KEY = "skillbridge-dev-internal-service-key"


class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    ENV: str = "development"

    # Shared credential the backend must present on every non-health request.
    INTERNAL_SERVICE_KEY: str = DEV_INTERNAL_SERVICE_KEY

    # Comma-separated browser origins allowed to call this service directly.
    # The product never calls it from a browser (the backend does), so this is empty by default.
    CORS_ALLOWED_ORIGINS: str = ""

    # Largest resume upload accepted, in bytes (matches the backend's 5 MB limit).
    MAX_UPLOAD_BYTES: int = 5 * 1024 * 1024

    # Provider API Keys
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None
    LOCAL_MODEL_ENDPOINT: Optional[str] = "http://localhost:11434/api/generate"
    PRIMARY_PROVIDER: str = "gemini"
    # Longest a single Gemini request may take. Kept below the backend's own timeout for the
    # AI service so a slow provider is reported as unavailable instead of leaving callers hanging.
    GEMINI_TIMEOUT_SECONDS: float = 20.0
    USE_MOCK_PROVIDER: bool = False

    # Read from the environment and ai/.env only: never a .env found by searching parent
    # directories or the working directory (the repository-root .env is Docker Compose's)
    model_config = SettingsConfigDict(
        env_file=None if dotenv_disabled() else AI_ENV_PATH,
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("INTERNAL_SERVICE_KEY", mode="before")
    @classmethod
    def _blank_key_means_unset(cls, value):
        # A blank `INTERNAL_SERVICE_KEY=` line (as shipped in .env.example) means "not set"
        if value is None or str(value).strip() == "":
            return DEV_INTERNAL_SERVICE_KEY
        return str(value).strip()

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() == "production"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.CORS_ALLOWED_ORIGINS.split(",") if o.strip()]

    def validate_for_startup(self) -> None:
        """Fail closed: production must never run with the published development key."""
        key = (self.INTERNAL_SERVICE_KEY or "").strip()
        if not key:
            raise RuntimeError("INTERNAL_SERVICE_KEY must be set.")
        if self.is_production and key == DEV_INTERNAL_SERVICE_KEY:
            raise RuntimeError(
                "INTERNAL_SERVICE_KEY must be set to a strong non-default value when ENV=production."
            )
        if "*" in self.cors_origins:
            raise RuntimeError("CORS_ALLOWED_ORIGINS must list explicit origins; '*' is not allowed.")


settings = Settings()
settings.validate_for_startup()
