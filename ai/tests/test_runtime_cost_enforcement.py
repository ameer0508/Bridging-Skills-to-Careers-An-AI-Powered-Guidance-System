"""
Zero-cost enforcement on the real call paths (docs/ZERO_COST_API_POLICY.md): the AI gateway, the
HTTP endpoints, each provider adapter, the career agent and the health report. Every test runs
inside the network tripwire, with keys for paid providers present in the environment.
"""
from types import SimpleNamespace

import pytest

from app.config.ai_config import ai_config
from app.cost_policy import CostPolicy, runtime_policy
from app.cost_policy.network_guard import block_external_network
from app.gateway import ai_gateway as gateway_module
from app.gateway.ai_gateway import AIGateway, ai_gateway
from app.providers.gemini_provider import GeminiProvider
from app.providers.huggingface_adapter import HuggingFaceAdapter
from app.providers.local_adapter import LocalModelAdapter
from app.providers.openai_adapter import OpenAIAdapter
from app.schemas.resume import ParsedResumeResponse

PAID_KEYS = {
    "OPENAI_API_KEY": "sk-test-paid-key-0001",
    "HUGGINGFACE_API_KEY": "hf-test-paid-key-0002",
    "HF_TOKEN": "hf-test-paid-key-0003",
    "RAPIDAPI_KEY": "rapid-test-key-0004",
    "JSEARCH_API_KEY": "jsearch-test-key-0005",
    "ADZUNA_API_KEY": "adzuna-test-key-0006",
    "OLLAMA_API_KEY": "ollama-cloud-key-0007",
    "GEMINI_API_KEY": "gemini-test-key-0008",
}
GEMINI_CLEARED = {"SKILLBRIDGE_ENABLE_GEMINI": "true", "SKILLBRIDGE_GEMINI_NO_BILLING_ATTESTED": "true"}


class _RecordingGeminiModels:
    """Stands in for the Gemini SDK's client.models; nothing leaves the process."""

    def __init__(self, error=None):
        self.error = error
        self.calls = 0

    def generate_content(self, model, contents, config=None):
        self.calls += 1
        if self.error:
            raise RuntimeError(self.error)
        return SimpleNamespace(text='{"normalized_skills": []}', usage_metadata=None)


@pytest.fixture(autouse=True)
def fresh_quota(monkeypatch):
    """Each test starts with an empty quota ledger."""
    monkeypatch.setattr(runtime_policy, "ledger", CostPolicy().ledger)


@pytest.fixture
def paid_keys(monkeypatch):
    for name, value in PAID_KEYS.items():
        monkeypatch.setenv(name, value)


def _gateway_with_gemini(monkeypatch, error=None):
    """A fresh gateway whose Gemini provider records calls instead of reaching Google."""
    gateway = AIGateway()
    models = _RecordingGeminiModels(error)
    gateway.providers["gemini"].client = SimpleNamespace(models=models)
    return gateway, models


# --- Chain construction ---------------------------------------------------------------------

def test_paid_keys_never_put_paid_providers_in_any_chain(paid_keys):
    gateway = AIGateway()
    for personal in (True, False):
        names = [p.provider_name for p in gateway.get_provider_chain(contains_personal_data=personal)]
        assert not {"openai", "huggingface", "gemini", "local"} & set(names), names
    for requested in ("openai", "huggingface", "gemini", "local"):
        assert [p.provider_name for p in gateway.get_provider_chain(requested)] == ["mock"], requested


def test_adapters_report_unavailable_despite_keys(paid_keys):
    assert OpenAIAdapter().is_available() is False
    assert HuggingFaceAdapter().is_available() is False
    assert GeminiProvider().is_available() is False, "a Gemini key without the enable flag and attestation is not enough"


def test_cleared_gemini_serves_only_non_personal_services(paid_keys, monkeypatch):
    for name, value in GEMINI_CLEARED.items():
        monkeypatch.setenv(name, value)
    gateway, models = _gateway_with_gemini(monkeypatch)
    assert "gemini" in [p.provider_name for p in gateway.get_provider_chain(contains_personal_data=False)]
    assert "gemini" not in [p.provider_name for p in gateway.get_provider_chain(contains_personal_data=True)]

    with block_external_network() as net:
        gateway.route_request("resume_parsing", "parse_resume_text", "Jane Doe, jane@example.com, Python",
                              schema_class=ParsedResumeResponse, use_cache=False)
        gateway.route_request("chat_architect", "generate_content", "my private career question", use_cache=False)
        assert models.calls == 0, "personal data must not reach the Gemini free tier"
        gateway.route_request("skill_normalization", "generate_content", "python, py", use_cache=False)
        assert models.calls == 1, "non-personal requests may use the cleared free tier"
    assert net.attempts == []


def test_unknown_services_are_treated_as_personal():
    assert gateway_module.carries_personal_data("some_new_feature") is True
    assert gateway_module.carries_personal_data("skill_normalization") is False


# --- Invocation guard ---------------------------------------------------------------------

def test_injected_paid_provider_is_refused_at_call_time(paid_keys, monkeypatch):
    """Even if something puts OpenAI into the chain, the call is refused before any request."""
    monkeypatch.setattr(ai_gateway, "get_provider_chain", lambda requested_provider=None: [OpenAIAdapter()])
    with block_external_network() as net:
        response = ai_gateway.route_request("chat_architect", "generate_content", "hello", use_cache=False)
    assert response.success is False
    assert "zero-cost policy" in response.errors[0]
    assert net.attempts == []


def test_adapters_refuse_direct_use_before_the_network(paid_keys):
    with block_external_network() as net:
        assert OpenAIAdapter().generate_content("hello").success is False
        assert HuggingFaceAdapter().generate_content("hello").success is False
    assert net.attempts == [], "refused inside the adapter, not by the tripwire"


def test_exhausted_free_quota_stops_gemini_and_never_falls_back_to_paid(paid_keys, monkeypatch):
    for name, value in GEMINI_CLEARED.items():
        monkeypatch.setenv(name, value)
    gateway, models = _gateway_with_gemini(monkeypatch, error="429 RESOURCE_EXHAUSTED: quota exceeded")
    gateway.providers.pop("mock", None)  # production-like: nothing else is allowed to answer
    with block_external_network() as net:
        first = gateway.route_request("skill_normalization", "generate_content", "python", use_cache=False)
        assert first.success is False and models.calls == 1
        assert runtime_policy.check("gemini").reason.value == "quota_exhausted"
        with pytest.raises(RuntimeError, match="No AI providers available"):
            gateway.route_request("skill_normalization", "generate_content", "java", use_cache=False)
    assert models.calls == 1, "a paused provider is not called again"
    assert net.attempts == [], "OpenAI was never tried even though its key is set"


def test_errors_never_carry_secret_values(paid_keys, monkeypatch, caplog):
    for name, value in GEMINI_CLEARED.items():
        monkeypatch.setenv(name, value)
    gateway, _ = _gateway_with_gemini(monkeypatch, error=f"invalid key {PAID_KEYS['GEMINI_API_KEY']}")
    response = gateway.route_request("skill_normalization", "generate_content", "go", use_cache=False)
    assert PAID_KEYS["GEMINI_API_KEY"] not in " ".join(response.errors)
    assert PAID_KEYS["GEMINI_API_KEY"] not in caplog.text


# --- HTTP endpoints -----------------------------------------------------------------------

def test_endpoints_answer_without_any_live_call(client, paid_keys):
    with block_external_network() as net:
        chat = client.post("/api/v1/chat", json={"prompt": "What should I learn next?"})
        health = client.get("/api/v1/health")
    assert chat.status_code == 503, "no paid or unverified provider may answer chat"
    providers = health.json()["providers"]
    assert providers["openai"] == {**providers["openai"], "available": False, "cost_policy": "blocked"}
    assert providers["huggingface"]["cost_policy"] == "blocked"
    assert providers["gemini"]["cost_policy"] == "not_enabled"
    assert net.attempts == []


def test_health_never_returns_key_values(client, paid_keys):
    text = client.get("/api/v1/health").text
    assert not any(value in text for value in PAID_KEYS.values())


# --- Local models -------------------------------------------------------------------------

@pytest.mark.parametrize("env,available", [
    ({"LOCAL_MODEL_ENDPOINT": "http://localhost:11434/api/generate", "LOCAL_MODEL_NAME": "llama3"}, True),
    ({"LOCAL_MODEL_ENDPOINT": "https://ollama.com/api/generate", "LOCAL_MODEL_NAME": "llama3"}, False),
    ({"LOCAL_MODEL_ENDPOINT": "http://192.168.1.20:11434/api/generate", "LOCAL_MODEL_NAME": "llama3"}, False),
    ({"LOCAL_MODEL_ENDPOINT": "http://localhost:11434/api/generate", "LOCAL_MODEL_NAME": "gemma4:cloud"}, False),
    ({"LOCAL_MODEL_ENDPOINT": "http://localhost:11434/api/generate", "LOCAL_MODEL_NAME": "llama3", "OLLAMA_API_KEY": "k"}, False),
])
def test_local_adapter_is_local_only(monkeypatch, env, available):
    monkeypatch.setenv("ENABLE_LOCAL_MODEL", "true")
    monkeypatch.delenv("OLLAMA_API_KEY", raising=False)
    for name, value in env.items():
        monkeypatch.setenv(name, value)
    adapter = LocalModelAdapter()
    assert adapter.is_available() is available
    if not available:
        with block_external_network() as net:
            assert adapter.generate_content("hello").success is False
        assert net.attempts == [], "refused before any connection"


# --- Career agent, credentials and configuration modes -------------------------------------

def test_career_agent_never_sends_the_profile_to_gemini(paid_keys, monkeypatch):
    import asyncio
    from app.career_agent import antigravity_agent as agent_module

    for name, value in GEMINI_CLEARED.items():
        monkeypatch.setenv(name, value)

    def refuse(*args, **kwargs):
        raise AssertionError("the hosted agent must not be constructed")

    monkeypatch.setattr(agent_module, "Agent", refuse)
    agent = agent_module.AutonomousCareerIntelligenceAgent()
    with block_external_network() as net:
        report = asyncio.run(agent.run_analysis("Data Analyst", ["Python", "SQL"], 6))
    assert report is not None
    assert net.attempts == []


def test_auth_manager_has_no_placeholder_credentials(monkeypatch):
    from app.external_gateway.auth_manager import AuthManager

    for name in ("COURSERA_API_KEY", "ADZUNA_API_KEY", "JSEARCH_API_KEY"):
        monkeypatch.delenv(name, raising=False)
    manager = AuthManager()
    assert [manager.get_credential(p) for p in ("coursera", "adzuna", "jsearch")] == [None, None, None]


@pytest.mark.parametrize("mock_enabled", [True, False], ids=["development-or-test", "production"])
def test_every_mode_refuses_paid_providers(paid_keys, monkeypatch, mock_enabled):
    monkeypatch.setattr(ai_config, "enable_mock_provider", mock_enabled)
    gateway = AIGateway()
    if mock_enabled:
        assert [p.provider_name for p in gateway.get_provider_chain()] == ["mock"]
    else:
        assert "mock" not in gateway.providers
        with pytest.raises(RuntimeError, match="No AI providers available"):
            gateway.get_provider_chain()
