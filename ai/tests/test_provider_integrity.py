"""
Provider and telemetry integrity: no silent model substitution, honest token accounting,
and explicit labelling of modules that only return illustrative sample data.
No real provider is called.
"""
from types import SimpleNamespace

import pytest

from app.providers.gemini_provider import GeminiProvider, _reported_usage
from app.schemas.resume import ParsedResumeResponse
from app.utils.response_normalizer import ResponseNormalizer


class _FakeModels:
    """Stands in for the Gemini SDK's `client.models`."""

    def __init__(self, failing=()):
        self.failing = set(failing)
        self.requested = []

    def generate_content(self, model, contents, config=None):
        self.requested.append(model)
        if model in self.failing:
            raise RuntimeError("404 model not found")
        return SimpleNamespace(
            text="A grounded answer.",
            usage_metadata=SimpleNamespace(prompt_token_count=321, candidates_token_count=45),
        )


def _provider(monkeypatch, failing=(), fallbacks=None):
    monkeypatch.setenv("GEMINI_MODEL", "configured-model")
    if fallbacks is None:
        monkeypatch.delenv("GEMINI_FALLBACK_MODELS", raising=False)
    else:
        monkeypatch.setenv("GEMINI_FALLBACK_MODELS", fallbacks)
    provider = GeminiProvider()
    models = _FakeModels(failing)
    provider.client = SimpleNamespace(models=models)
    return provider, models


def test_only_the_configured_model_is_used_by_default(monkeypatch):
    provider, models = _provider(monkeypatch)
    assert provider._candidate_models() == ["configured-model"]
    response = provider.generate_content("hello")
    assert response.success and response.model == "configured-model"
    assert models.requested == ["configured-model"]
    assert "model_fallback_from" not in response.metadata


def test_a_failing_model_is_reported_not_silently_replaced(monkeypatch):
    provider, models = _provider(monkeypatch, failing={"configured-model"})
    response = provider.generate_content("hello")
    assert response.success is False, "no other model may be substituted without being configured"
    assert models.requested == ["configured-model"]
    assert "404" in response.errors[0]


def test_explicit_fallback_is_used_and_disclosed(monkeypatch):
    provider, models = _provider(monkeypatch, failing={"configured-model"}, fallbacks="backup-model, ")
    assert provider._candidate_models() == ["configured-model", "backup-model"]
    response = provider.generate_content("hello")
    assert response.success
    assert response.model == "backup-model", "the model that actually answered is reported"
    assert response.metadata["model_fallback_from"] == "configured-model"
    assert models.requested == ["configured-model", "backup-model"]


def test_token_usage_comes_from_the_provider_when_reported(monkeypatch):
    provider, _ = _provider(monkeypatch)
    usage = provider.generate_content("hello").usage
    assert (usage.prompt_tokens, usage.completion_tokens, usage.total_tokens) == (321, 45, 366)
    assert usage.source == "provider"


def test_token_usage_is_labelled_as_estimated_otherwise():
    response = ResponseNormalizer.normalize_success(
        raw_data="some text", provider="mock", model="mock-v1", latency_ms=1.0, prompt_text="a prompt of several words"
    )
    assert response.usage.source == "estimated"
    assert response.confidence is None, "no confidence figure is invented for a response"
    assert response.metadata["confidence_basis"] == "not_measured"
    assert _reported_usage(SimpleNamespace()) is None
    assert _reported_usage(SimpleNamespace(usage_metadata=None)) is None


def test_structured_output_failure_is_not_hidden(monkeypatch):
    provider, _ = _provider(monkeypatch)
    # The fake returns plain text, which is not valid JSON for the requested schema
    response = provider.parse_resume_text("resume text", ParsedResumeResponse)
    assert response.success is False
    assert response.errors


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/market/trends",
        "/api/v1/salary/intelligence",
        "/api/v1/github/analyze/sample",
        "/api/v1/linkedin/analyze/sample",
    ],
)
def test_simulated_modules_label_their_data_as_illustrative(client, path):
    res = client.get(path)
    assert res.status_code == 200
    assert res.json()["data_origin"] == "illustrative_sample"


def test_status_page_makes_no_online_claims_for_demo_modules(client):
    body = client.get("/api/v1/realtime").json()
    assert all(agent["status"] == "DEMO" for agent in body["agents"])
    assert all(agent["mode"] == "ILLUSTRATIVE_DATA" for agent in body["agents"])
