import os
from typing import List, Dict, Any
from pydantic import BaseModel, Field

class ProviderConfig(BaseModel):
    name: str
    enabled: bool = True
    default_model: str
    api_key_env_var: str = ""
    base_url: str = ""
    timeout_seconds: float = 30.0
    max_retries: int = 3
    rate_limit_rpm: int = 60  # requests per minute

class AIConfig(BaseModel):
    primary_provider: str = Field(default_factory=lambda: os.getenv("PRIMARY_PROVIDER", "gemini"))
    fallback_providers: List[str] = Field(default_factory=lambda: ["openai", "huggingface", "local", "mock"])
    
    # Enable mock provider strictly in dev/test, NEVER in production
    enable_mock_provider: bool = Field(
        default_factory=lambda: os.getenv("ENV", "development").lower() != "production" or os.getenv("USE_MOCK_PROVIDER", "false").lower() == "true"
    )
    
    cache_ttl_seconds: int = Field(default=3600)  # 1 hour caching
    cache_max_entries: int = Field(default=1000)
    
    default_temperature: float = Field(default=0.1)
    default_max_tokens: int = Field(default=2048)

    providers: Dict[str, ProviderConfig] = Field(default_factory=lambda: {
        "gemini": ProviderConfig(
            name="gemini",
            enabled=True,
            default_model="gemini-2.5-flash",
            api_key_env_var="GEMINI_API_KEY",
            rate_limit_rpm=120,
        ),
        "openai": ProviderConfig(
            name="openai",
            enabled=bool(os.getenv("OPENAI_API_KEY")),
            default_model="gpt-4o-mini",
            api_key_env_var="OPENAI_API_KEY",
            base_url="https://api.openai.com/v1",
            rate_limit_rpm=60,
        ),
        "huggingface": ProviderConfig(
            name="huggingface",
            enabled=bool(os.getenv("HUGGINGFACE_API_KEY")),
            default_model="mistralai/Mistral-7B-Instruct-v0.2",
            api_key_env_var="HUGGINGFACE_API_KEY",
            base_url="https://api-inference.huggingface.co/models",
            rate_limit_rpm=30,
        ),
        "local": ProviderConfig(
            name="local",
            enabled=os.getenv("ENABLE_LOCAL_MODEL", "false").lower() == "true",
            default_model="llama3",
            base_url=os.getenv("LOCAL_MODEL_ENDPOINT", "http://localhost:11434/api/generate"),
            rate_limit_rpm=120,
        ),
        "mock": ProviderConfig(
            name="mock",
            enabled=os.getenv("ENV", "development").lower() != "production",
            default_model="mock-v1",
            rate_limit_rpm=1000,
        )
    })

ai_config = AIConfig()
