"""
Shared pytest setup. Environment values are set before the application is imported so tests
never depend on (or leak) a developer's real .env configuration or provider keys.
"""
import json
import os
import sys
from pathlib import Path

TEST_SERVICE_KEY = "test-internal-service-key"

# No .env file is read while testing: neither ai/.env nor the repository-root .env (Docker
# Compose's), so a developer's real keys and provider flags cannot reach a test.
os.environ["SKILLBRIDGE_SKIP_DOTENV"] = "1"

# Provider configuration inherited from the shell is removed as well: every credential, enable
# flag and attestation in the zero-cost registry, and the local-model and Gemini settings.
_REGISTRY = json.loads((Path(__file__).resolve().parent.parent / "app" / "cost_policy" / "provider_registry.json").read_text(encoding="utf-8"))
PROVIDER_ENV_NAMES = {
    name
    for entry in _REGISTRY["providers"].values()
    for name in [*entry.get("credential_env", []), entry.get("enable_env") or "", *entry.get("attestation_env", [])]
    if name
} | {"ENABLE_LOCAL_MODEL", "PRIMARY_PROVIDER"}
PROVIDER_ENV_PREFIXES = ("SKILLBRIDGE_ENABLE_", "SKILLBRIDGE_GEMINI_", "SKILLBRIDGE_ONJOB_", "GEMINI_", "OLLAMA_", "LOCAL_MODEL_", "GOOGLE_")
for _name in list(os.environ):
    if _name in PROVIDER_ENV_NAMES or _name.startswith(PROVIDER_ENV_PREFIXES):
        del os.environ[_name]

os.environ["ENV"] = "test"
os.environ["INTERNAL_SERVICE_KEY"] = TEST_SERVICE_KEY
os.environ["CORS_ALLOWED_ORIGINS"] = "http://localhost:5000"
os.environ["MAX_UPLOAD_BYTES"] = str(64 * 1024)  # small limit keeps the oversize test fast
# No real provider calls from tests (no provider keys are set): the deterministic mock provider is used instead
os.environ["USE_MOCK_PROVIDER"] = "true"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.core.security import INTERNAL_KEY_HEADER  # noqa: E402
from app.cost_policy import runtime_policy  # noqa: E402
from app.cost_policy.network_guard import block_external_network  # noqa: E402

# Test doubles stand in for a real provider under this name. They run in-process, so the
# zero-cost policy treats them like any other local provider.
TEST_PROVIDER_NAMES = ("fake_llm",)


@pytest.fixture(autouse=True, scope="session")
def no_live_network_calls():
    """Every test runs with outbound connections blocked: any live provider call fails loudly."""
    with block_external_network() as net:
        yield net
    assert net.attempts == [], f"tests attempted live network calls: {net.attempts}"


@pytest.fixture(autouse=True, scope="session")
def register_test_providers():
    for name in TEST_PROVIDER_NAMES:
        runtime_policy.providers[name] = {
            "kind": "local",
            "status": "APPROVED",
            "allows_personal_data": True,
            "credential_env": [],
        }
    yield
    for name in TEST_PROVIDER_NAMES:
        runtime_policy.providers.pop(name, None)


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
