"""
Shared pytest setup. Environment values are set before the application is imported so tests
never depend on (or leak) a developer's real .env configuration or provider keys.
"""
import os
import sys

TEST_SERVICE_KEY = "test-internal-service-key"

os.environ["ENV"] = "test"
os.environ["INTERNAL_SERVICE_KEY"] = TEST_SERVICE_KEY
os.environ["CORS_ALLOWED_ORIGINS"] = "http://localhost:5000"
os.environ["MAX_UPLOAD_BYTES"] = str(64 * 1024)  # small limit keeps the oversize test fast
# No real provider calls from tests: the deterministic mock provider is used instead
os.environ["GEMINI_API_KEY"] = ""
os.environ["OPENAI_API_KEY"] = ""
os.environ["HUGGINGFACE_API_KEY"] = ""
os.environ["USE_MOCK_PROVIDER"] = "true"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.core.security import INTERNAL_KEY_HEADER  # noqa: E402


@pytest.fixture
def service_headers():
    return {INTERNAL_KEY_HEADER: TEST_SERVICE_KEY}


@pytest.fixture
def anonymous_client():
    """A caller with no service credentials (e.g. a browser or an attacker on the network)."""
    return TestClient(app)


@pytest.fixture
def client(service_headers):
    """A caller holding the internal service key, i.e. the backend."""
    return TestClient(app, headers=service_headers)
