from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    ENV: str = "development"
    
    # Provider API Keys
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None
    LOCAL_MODEL_ENDPOINT: Optional[str] = "http://localhost:11434/api/generate"
    PRIMARY_PROVIDER: str = "gemini"
    USE_MOCK_PROVIDER: bool = False

    # Configuration binding to read from environment and local .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
