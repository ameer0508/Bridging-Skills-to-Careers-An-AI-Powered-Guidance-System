"""
AI observability (X11): the gateway records what it decided and why (selection, policy refusals,
rate limits, quota pauses, failures by category, fallbacks, cache hits) with latency, and never
records request content, error messages or secrets. Retention is enforced, statistics are computed
from the events, paid providers stay out of every chain, and the endpoints are internal only.
"""
import json
import os
import stat

import pytest

from app.cost_policy import CostPolicy, runtime_policy
from app.config.ai_config import ai_config
from app.gateway.ai_gateway import AIGateway
from app.observability import AuditLog, categorize_failure
from app.observability import audit as audit_module
from app.schemas.ai_response import UnifiedAIResponse

SECRET = "sk-test-paid-key-0001"
RESUME_TEXT = "Rahul Verma, rahul.verma@example.com, +91 91234 56789, worked at Example Pvt Ltd"


class FakeProvider:
    """In-process stand-in for an AI provider; nothing leaves the test."""

    def __init__(self, name, mode="ok", message=""):
        self._name = name
        self.mode = mode
        self.message = message
        self.calls = 0

    @property
    def provider_name(self):
        return self._name

    def is_available(self):
        return True

    def generate_content(self, prompt, **kwargs):
        self.calls += 1
        if self.mode == "raise":
            raise RuntimeError(self.message)
        if self.mode == "fail":
            return UnifiedAIResponse(success=False, provider=self._name, errors=[self.message])
        return UnifiedAIResponse(success=True, provider=self._name, model="fake", response="ok")


@pytest.fixture
def log(monkeypatch):
    fresh = AuditLog(retention_days=14, directory=None)
    monkeypatch.setattr(audit_module, "audit_log", fresh)
    import app.gateway.ai_gateway as gw
    monkeypatch.setattr(gw, "audit_log", fresh)
    return fresh


@pytest.fixture
def fakes(monkeypatch):
    monkeypatch.setattr(runtime_policy, "ledger", CostPolicy().ledger)
    for name in ("fake_a", "fake_b"):
        runtime_policy.providers[name] = {"kind": "local", "status": "APPROVED", "allows_personal_data": True, "credential_env": []}
    monkeypatch.setattr(ai_config, "primary_provider", "fake_a")
    monkeypatch.setattr(ai_config, "fallback_providers", ["fake_b"])
    gateway = AIGateway()
    gateway.providers["fake_a"] = FakeProvider("fake_a")
    gateway.providers["fake_b"] = FakeProvider("fake_b")
    yield gateway
    for name in ("fake_a", "fake_b"):
        runtime_policy.providers.pop(name, None)


def _kinds(log):
    return [e["kind"] for e in reversed(log.events(limit=500))]


def test_success_records_selection_skips_and_latency(log, fakes):
    resp = fakes.route_request("chat_architect", "generate_content", "hello", use_cache=False)
    assert resp.success and resp.metadata["observability"] == {"provider": "fake_a", "attempt": 1, "fallbackUsed": False, "testProvider": False}
    assert _kinds(log) == ["chain_resolved", "success"]
    resolved = log.events()[-1]
    # Every provider left out says why: the policy's own reason codes
    assert resolved["skipped"]["openai"] in ("blocked", "unverified", "not_enabled", "missing_credentials")
    assert "gemini" in resolved["skipped"]
    success = log.events()[0]
    assert success["latency_ms"] is not None and success["attempt"] == 1


def test_fallback_and_failure_categories_without_messages(log, fakes):
    fakes.providers["fake_a"].mode = "raise"
    fakes.providers["fake_a"].message = f"Connection reset while sending {RESUME_TEXT} with key {SECRET}"
    resp = fakes.route_request("chat_architect", "generate_content", RESUME_TEXT, use_cache=False)
    assert resp.success and resp.metadata["observability"]["fallbackUsed"] is True
    assert _kinds(log) == ["chain_resolved", "provider_failed", "success"]
    failed = [e for e in log.events() if e["kind"] == "provider_failed"][0]
    assert failed["reason"] == "network" and failed["provider"] == "fake_a"
    dumped = json.dumps(log.events()) + json.dumps(log.summary())
    assert SECRET not in dumped and "rahul" not in dumped.lower() and "91234" not in dumped, "no content or secrets are recorded"
    assert log.summary()["services"]["chat_architect"]["fallbacks"] == 1


def test_quota_rate_limit_policy_refusal_and_all_failed(log, fakes, monkeypatch):
    fakes.providers["fake_a"].mode = "fail"
    fakes.providers["fake_a"].message = "429 RESOURCE_EXHAUSTED: quota exceeded"
    fakes.providers["fake_b"].mode = "fail"
    fakes.providers["fake_b"].message = "Request timed out after 20s"
    resp = fakes.route_request("chat_architect", "generate_content", "hi", use_cache=False)
    assert not resp.success
    assert _kinds(log) == ["chain_resolved", "provider_failed", "quota_paused", "provider_failed", "all_failed"]
    reasons = [e["reason"] for e in reversed(log.events()) if e["kind"] == "provider_failed"]
    assert reasons == ["quota", "timeout"]

    # The paused provider is now refused by the policy at call time, and the refusal is recorded
    monkeypatch.setattr(fakes, "get_provider_chain", lambda requested_provider=None, contains_personal_data=True: [fakes.providers["fake_a"]])
    fakes.route_request("chat_architect", "generate_content", "hi", use_cache=False)
    refusal = [e for e in log.events() if e["kind"] == "policy_refused"][0]
    assert refusal["provider"] == "fake_a" and refusal["reason"] == "quota_exhausted"

    from app.utils import rate_limiter as rl
    monkeypatch.setattr(rl.rate_limiter, "check_rate_limit", lambda name, rpm: False)
    monkeypatch.setattr(fakes, "get_provider_chain", lambda requested_provider=None, contains_personal_data=True: [fakes.providers["fake_b"]])
    fakes.route_request("chat_architect", "generate_content", "hi", use_cache=False)
    assert any(e["kind"] == "rate_limited" and e["provider"] == "fake_b" for e in log.events())


def test_no_provider_is_recorded_with_reasons(log, monkeypatch):
    monkeypatch.setattr(ai_config, "primary_provider", "openai")
    monkeypatch.setattr(ai_config, "fallback_providers", ["openai", "huggingface"])
    monkeypatch.setenv("OPENAI_API_KEY", SECRET)
    gateway = AIGateway()
    gateway.providers.pop("mock", None)
    with pytest.raises(RuntimeError):
        gateway.route_request("chat_architect", "generate_content", "hi", use_cache=False)
    event = log.events()[0]
    assert event["kind"] == "no_provider"
    assert event["skipped"]["openai"] in ("blocked", "unverified"), "the paid provider stays out despite a key, and the reason is recorded"
    assert SECRET not in json.dumps(log.events())


def test_chat_refusal_before_routing_is_recorded(log, client, service_headers, monkeypatch):
    """Chat refuses the test provider before calling the gateway; that refusal must still be audited."""
    import app.routers.chat as chat_router
    from app.gateway.ai_gateway import ai_gateway as shared
    monkeypatch.setattr(shared, "get_provider_chain", lambda requested_provider=None, contains_personal_data=True: [shared.providers["mock"]] if "mock" in shared.providers else [])
    res = client.post("/api/v1/chat", json={"prompt": f"Review this: {RESUME_TEXT}"}, headers=service_headers)
    assert res.status_code == 503
    event = log.events()[0]
    assert event["kind"] == "no_provider" and event["service"] == "chat_architect"
    assert event["reason"] in ("only_test_provider", "no_allowed_provider")
    assert "rahul" not in json.dumps(log.events()).lower()
    assert log.summary()["services"]["chat_architect"]["noProvider"] == 1
    assert chat_router.MOCK_PROVIDER == "mock"


def test_statistics_and_retention(tmp_path):
    now = [1_000_000.0]
    log = AuditLog(retention_days=2, directory=str(tmp_path), clock=lambda: now[0])
    for latency in (100, 200, 300, 400, 500):
        log.record("chain_resolved", "svc")
        log.record("success", "svc", "fake_a", attempt=1, latency_ms=latency)
    log.record("provider_failed", "svc", "fake_a", reason="timeout", attempt=1)
    stats = log.summary(24)["providers"]["fake_a"]
    assert stats["latencyMs"] == {"p50": 300.0, "p95": 480.0, "samples": 5}
    assert stats["failures"] == {"timeout": 1} and stats["failureRate"] == round(1 / 6, 3)
    assert len(os.listdir(tmp_path)) == 1, "persisted as a daily file"
    # Three days later: old events and files are gone
    now[0] += 3 * 86400
    log.record("chain_resolved", "svc")
    assert log.summary(24 * 90)["events"] == 1
    files = os.listdir(tmp_path)
    assert files == [f"ai-audit-1970-01-15-{log.instance_id}.jsonl"], f"the expired daily file is purged: {files}"
    assert AuditLog(retention_days=365).retention_days == 90, "retention is capped"


def test_durable_store_spans_processes_and_restarts(tmp_path):
    now = [2_000_000.0]
    clock = lambda: now[0]
    first = AuditLog(retention_days=14, directory=str(tmp_path), clock=clock)
    second = AuditLog(retention_days=14, directory=str(tmp_path), clock=clock)  # another worker
    first.record("success", "svc", "fake_a", attempt=1, latency_ms=10)
    second.record("provider_failed", "svc", "fake_a", reason="timeout", attempt=1)
    second.record("success", "svc", "fake_b", attempt=2, latency_ms=30)
    assert len(os.listdir(tmp_path)) == 2, "one file per process, so writers never interleave"
    for log in (first, second):
        summary = log.summary(24)
        assert summary["events"] == 3, "each process reports every process's events"
        assert summary["scope"]["source"] == "files" and "All AI-service processes" in summary["scope"]["coverage"]
    # A restart: a new process with empty memory still sees what was recorded before
    restarted = AuditLog(retention_days=14, directory=str(tmp_path), clock=clock)
    assert restarted.summary(24)["providers"]["fake_a"]["failures"] == {"timeout": 1}
    assert restarted.summary(24)["services"]["svc"]["fallbacks"] == 1
    # Owner-only permissions where the platform supports them
    if os.name == "posix":
        assert stat.S_IMODE(os.stat(tmp_path / os.listdir(tmp_path)[0]).st_mode) == 0o600
    # A tampered or corrupt line is skipped or reduced to codes, never trusted as free text
    with open(tmp_path / f"ai-audit-1970-01-24-{first.instance_id}.jsonl", "a", encoding="utf-8") as fh:
        fh.write("not json\n")
        fh.write(json.dumps({"at": "1970-01-24T03:33:20+00:00", "kind": "prompt_text", "service": "svc"}) + "\n")
        fh.write(json.dumps({"at": "1970-01-24T03:33:20+00:00", "kind": "provider_failed", "service": "svc", "provider": "fake_a", "reason": RESUME_TEXT}) + "\n")
    events = restarted.events(limit=50, window_hours=24)
    assert len(events) == 4 and RESUME_TEXT not in json.dumps(events)
    assert any(e["reason"] == "unspecified" for e in events)


def test_memory_scope_says_one_process():
    scope = AuditLog(retention_days=1, directory=None).summary(1)["scope"]
    assert scope["source"] == "memory"
    assert "This AI-service process only" in scope["coverage"] and "last restart" in scope["coverage"]


def test_unwritable_directory_is_counted_not_fatal(tmp_path):
    blocker = tmp_path / "not-a-dir"
    blocker.write_text("x")
    log = AuditLog(retention_days=1, directory=str(blocker))
    log.record("chain_resolved", "svc")
    assert log.write_failures == 1 and log.scope()["writeFailures"] == 1


def test_only_codes_are_stored():
    log = AuditLog(retention_days=1, directory=None)
    log.record("provider_failed", "chat architect!", "fake_a", reason=f"Error: {SECRET} {RESUME_TEXT}")
    event = log.events()[0]
    assert event["service"] == "unspecified" and event["reason"] == "unspecified"
    with pytest.raises(ValueError):
        log.record("prompt_text", "svc")
    assert categorize_failure("HTTP 503 Service Unavailable") == "server_error"
    assert categorize_failure("Invalid JSON in model output") == "invalid_output"
    assert categorize_failure("401 Unauthorized: bad api key") == "auth"


def test_endpoints_are_internal_and_answer(client, service_headers):
    from fastapi.testclient import TestClient
    from app.main import app
    raw = TestClient(app)
    assert raw.get("/api/v1/observability/summary").status_code in (401, 403)
    res = raw.get("/api/v1/observability/summary?window_hours=24", headers=service_headers)
    assert res.status_code == 200 and "providers" in res.json()["data"]
    providers = raw.get("/api/v1/observability/providers", headers=service_headers).json()["data"]["providers"]
    openai = next(p for p in providers if p["provider"] == "openai")
    assert openai["personalData"]["allowed"] is False and openai["personalData"]["reason"]
    assert raw.get("/api/v1/observability/events?limit=0", headers=service_headers).status_code == 422
