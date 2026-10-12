"""
Zero-cost API policy (docs/ZERO_COST_API_POLICY.md): blocked and unverified providers never get a
live call, missing credentials and used-up quotas fail closed without a paid fallback, secrets
never reach logs, and the existing endpoints make no live network call. Nothing here reaches a
real provider: every test that could runs inside the network tripwire.
"""
import io
import logging

import pytest

from app.cost_policy import (
    CostPolicy,
    DenyReason,
    ProviderBlockedError,
    ProviderStatus,
    QuotaExhaustedError,
    QuotaLedger,
    validate_local_model_endpoint,
    validate_ollama_model,
)
from app.cost_policy.audit import audit_environment
from app.cost_policy.network_guard import LiveNetworkCallBlocked, block_external_network
from app.cost_policy.policy import load_registry

GEMINI_CLEARED = {
    "GEMINI_API_KEY": "fake-gemini-key-123",
    "SKILLBRIDGE_ENABLE_GEMINI": "true",
    "SKILLBRIDGE_GEMINI_NO_BILLING_ATTESTED": "true",
}


class _Clock:
    def __init__(self):
        self.now = 1_000_000.0

    def __call__(self):
        return self.now


# --- Registry integrity -------------------------------------------------------------------

def test_every_provider_entry_is_complete():
    registry = load_registry()
    for name, entry in registry["providers"].items():
        ProviderStatus(entry["status"])  # raises on an unknown status
        assert entry["kind"] in {"local", "external", "browser", "dataset"}, name
        assert entry["verified_on"], name
        assert isinstance(entry["allows_personal_data"], bool), name
        if entry["status"] in ("APPROVED", "CONDITIONAL"):
            assert entry["free_access_verified"] is True, f"{name} is usable but free access is not verified"
            assert entry["sources"], f"{name} has no verification source"
        if entry["kind"] == "external" and entry["status"] in ("APPROVED", "CONDITIONAL"):
            assert entry.get("enable_env"), f"external provider {name} must be off by default"


@pytest.mark.parametrize("provider", ["openai", "huggingface_inference", "ollama_cloud", "google_vertex_ai", "adzuna"])
def test_paid_or_restricted_providers_are_blocked(provider):
    assert CostPolicy(env={}).status(provider) is ProviderStatus.BLOCKED


@pytest.mark.parametrize("provider", ["jsearch", "usajobs", "youtube_data_api", "coursera_api", "public_datasets"])
def test_unconfirmed_providers_stay_unverified(provider):
    assert CostPolicy(env={}).status(provider) is ProviderStatus.UNVERIFIED


# --- Blocking -----------------------------------------------------------------------------

@pytest.mark.parametrize("provider,env", [
    ("openai", {"OPENAI_API_KEY": "sk-fake"}),
    ("huggingface", {"HUGGINGFACE_API_KEY": "hf-fake"}),
    ("jsearch", {"RAPIDAPI_KEY": "fake", "SKILLBRIDGE_ENABLE_JSEARCH": "true"}),
    ("youtube_data_api", {"YOUTUBE_API_KEY": "fake"}),
    ("some_new_paid_api", {}),
])
def test_disallowed_providers_cannot_be_called_even_with_a_key(provider, env):
    policy = CostPolicy(env=env)
    decision = policy.check(provider)
    assert not decision.allowed
    assert decision.reason in {DenyReason.BLOCKED, DenyReason.UNVERIFIED, DenyReason.UNKNOWN_PROVIDER}
    with pytest.raises(ProviderBlockedError):
        policy.require(provider)


def test_external_providers_are_off_by_default_even_when_approved():
    decision = CostPolicy(env={}).check("github_rest_public")
    assert decision.reason is DenyReason.NOT_ENABLED
    assert CostPolicy(env={"SKILLBRIDGE_ENABLE_GITHUB_REST_PUBLIC": "true"}).check("github_rest_public").allowed


def test_gemini_needs_flag_attestation_and_key():
    assert CostPolicy(env={"GEMINI_API_KEY": "k-123"}).check("gemini").reason is DenyReason.NOT_ENABLED
    no_attest = {"GEMINI_API_KEY": "k-123", "SKILLBRIDGE_ENABLE_GEMINI": "true"}
    assert CostPolicy(env=no_attest).check("gemini").reason is DenyReason.NOT_ATTESTED
    assert CostPolicy(env=GEMINI_CLEARED).check("gemini").allowed


def test_missing_credentials_fail_closed_without_leaking_names_of_values():
    env = {k: v for k, v in GEMINI_CLEARED.items() if k != "GEMINI_API_KEY"}
    decision = CostPolicy(env=env).check("gemini")
    assert decision.reason is DenyReason.MISSING_CREDENTIALS
    unavailable = decision.as_unavailable("AI chat")
    assert unavailable["available"] is False and unavailable["data"] is None
    assert "GEMINI_API_KEY" in unavailable["message"]


def test_personal_data_never_goes_to_the_gemini_free_tier():
    policy = CostPolicy(env=GEMINI_CLEARED)
    assert policy.check("gemini").allowed
    assert policy.check("gemini", contains_personal_data=True).reason is DenyReason.PERSONAL_DATA
    assert policy.check("ollama", contains_personal_data=True).allowed


def test_local_models_are_restricted_to_this_machine():
    validate_local_model_endpoint("http://localhost:11434/api/generate")
    validate_local_model_endpoint("http://127.0.0.1:11434/api/generate")
    for url in ("https://ollama.com/api/generate", "http://10.0.0.5:11434/api/generate"):
        with pytest.raises(ValueError):
            validate_local_model_endpoint(url)
    validate_ollama_model("llama3")
    for name in ("gemma4:cloud", "gpt-oss:120b-cloud"):
        with pytest.raises(ValueError):
            validate_ollama_model(name)


# --- Quotas -------------------------------------------------------------------------------

def test_used_up_quota_stops_calls_and_nothing_paid_replaces_it():
    clock = _Clock()
    policy = CostPolicy(env={**GEMINI_CLEARED, "OPENAI_API_KEY": "sk-fake"}, ledger=QuotaLedger(clock=clock))
    per_minute = load_registry()["providers"]["gemini"]["rate_limits"]["self_imposed"]["per_minute"]
    for _ in range(per_minute):
        policy.require("gemini")
    with pytest.raises(QuotaExhaustedError):
        policy.require("gemini")
    # Only the free local model may still answer; the paid OpenAI key is never used
    assert policy.filter_chain(["gemini", "openai", "huggingface", "local"]) == ["local"]
    clock.now += 61
    assert policy.check("gemini").allowed, "the minute window recovers"


def test_provider_reported_quota_error_blocks_until_reset():
    clock = _Clock()
    policy = CostPolicy(env=GEMINI_CLEARED, ledger=QuotaLedger(clock=clock))
    policy.ledger.mark_exhausted("gemini", retry_after_seconds=3600)
    assert policy.check("gemini").reason is DenyReason.QUOTA_EXHAUSTED
    clock.now += 3601
    assert policy.check("gemini").allowed


# --- The existing AI gateway --------------------------------------------------------------

def test_gateway_fallback_chain_is_stripped_of_paid_providers(monkeypatch):
    """Today the gateway adds OpenAI and Hugging Face whenever their keys are set; the policy removes them."""
    from app.gateway.ai_gateway import AIGateway

    monkeypatch.setenv("OPENAI_API_KEY", "sk-fake")
    monkeypatch.setenv("HUGGINGFACE_API_KEY", "hf-fake")
    chain = [p.provider_name for p in AIGateway().get_provider_chain()]
    assert "openai" in chain and "huggingface" in chain  # the gap the policy must close
    policy = CostPolicy(env={"OPENAI_API_KEY": "sk-fake", "HUGGINGFACE_API_KEY": "hf-fake"})
    allowed = policy.filter_chain(chain)
    assert "openai" not in allowed and "huggingface" not in allowed
    assert set(allowed) <= set(chain), "filtering never adds a provider"


def test_openai_adapter_with_a_key_makes_no_live_request_inside_the_tripwire(monkeypatch):
    from app.providers.openai_adapter import OpenAIAdapter

    monkeypatch.setenv("OPENAI_API_KEY", "sk-fake")
    with block_external_network() as net:
        response = OpenAIAdapter().generate_content("hello")
    assert response.success is False
    assert net.attempts == ["api.openai.com"], "the attempt was stopped before leaving the machine"


def test_tripwire_blocks_raw_sockets_but_not_loopback():
    import socket

    with block_external_network() as net:
        with pytest.raises(LiveNetworkCallBlocked):
            socket.create_connection(("example.com", 443), timeout=1)
        assert net.attempts == ["example.com"]


def test_existing_endpoints_make_no_live_network_call(client):
    resume = b"Jane Doe\nSKILLS\nPython, Docker, SQL\nEXPERIENCE\nEngineer at Acme 2020-2023\n"
    with block_external_network() as net:
        client.post("/api/v1/chat", json={"message": "What should I learn next?"})
        client.post("/api/v1/extract", files={"file": ("cv.txt", io.BytesIO(resume), "text/plain")})
    assert net.attempts == []


# --- Secrets and audit --------------------------------------------------------------------

def test_secret_values_are_redacted_from_log_text(caplog):
    policy = CostPolicy(env={"GEMINI_API_KEY": "AIzaSecret987", "RAPIDAPI_KEY": "rapid-secret-55"})
    message = policy.redact("call failed: key=AIzaSecret987 header rapid-secret-55")
    assert "AIzaSecret987" not in message and "rapid-secret-55" not in message
    with caplog.at_level(logging.INFO):
        policy.check("jsearch")
        policy.check("gemini")
    assert "AIzaSecret987" not in caplog.text and "rapid-secret-55" not in caplog.text


def test_audit_flags_keys_for_blocked_providers_without_printing_them():
    findings = audit_environment({"OPENAI_API_KEY": "sk-very-secret", "RAPIDAPI_KEY": "rk-secret"})
    violations = {f.provider for f in findings if f.severity == "violation"}
    assert {"openai", "jsearch"} <= violations
    assert all("secret" not in f.message for f in findings)


def test_audit_flags_remote_or_cloud_local_models():
    findings = audit_environment({
        "ENABLE_LOCAL_MODEL": "true",
        "LOCAL_MODEL_ENDPOINT": "https://ollama.com/api/generate",
        "LOCAL_MODEL_NAME": "gemma4:cloud",
    })
    assert len([f for f in findings if f.provider == "ollama" and f.severity == "violation"]) == 2


def test_clean_environment_has_no_violations():
    assert [f for f in audit_environment({}) if f.severity == "violation"] == []
