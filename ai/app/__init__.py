import os
import warnings
from pathlib import Path
from dotenv import load_dotenv

# The AI service's own development settings file (copied from ai/.env.example). It is the only
# .env this service reads: the repository-root .env belongs to Docker Compose, and the Docker
# image contains no .env (Compose passes the configuration as environment variables).
AI_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def dotenv_disabled() -> bool:
    """
    True when no .env may be read at all. The test suite sets SKILLBRIDGE_SKIP_DOTENV=1 together
    with ENV=test before importing the app. Outside a test run the switch is ignored: a service
    configured through ai/.env must never lose its settings (ENV=production, its service key)
    because the switch was left set.
    """
    if os.getenv("SKILLBRIDGE_SKIP_DOTENV", "").strip().lower() not in {"1", "true", "yes"}:
        return False
    if os.getenv("ENV", "").strip().lower() != "test":
        warnings.warn("SKILLBRIDGE_SKIP_DOTENV is honoured only with ENV=test; ignoring it.", RuntimeWarning, stacklevel=2)
        return False
    return True


if not dotenv_disabled():
    load_dotenv(dotenv_path=AI_ENV_PATH)
