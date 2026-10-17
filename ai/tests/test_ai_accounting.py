"""
AI accounting: token counts and costs are reported only when a model ran and its runtime reported
them. Rule-based and template pipelines report no tokens and no inference cost, and nothing is
estimated from text length or priced from an invented rate. No real provider is called.
"""
import io

import pytest

from app.ai_operations.metrics_engine import MetricsEngine
from app.schemas.ai_response import TokenUsage, UnifiedAIResponse
from app.utils.cost_tracker import CostTracker
from app.utils.response_normalizer import ResponseNormalizer

NOT_INVOKED = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "estimated_cost_usd": 0.0,
               "source": "not_applicable", "cost_basis": "not_applicable"}

RESUME = """Riya Synthetic
riya.synthetic@example.com
Junior Backend Developer, Example Labs (2023-2025)
Built REST APIs with Python, Flask and PostgreSQL.
Skills: Python, Flask, SQL, Git, Docker
"""


def _assert_deterministic(body, provider):
    assert body["success"] is True
    assert body["provider"] == provider
    assert body["usage"] == NOT_INVOKED, f"{provider} runs no model, so it reports no tokens and no cost"
    assert body["metadata"]["generation"] == "deterministic"
    assert body["confidence"] is None


def test_resume_extraction_reports_no_model_usage(client):
    res = client.post("/api/v1/extract", files={"file": ("resume.txt", io.BytesIO(RESUME.encode()), "text/plain")})
    assert res.status_code == 200
    _assert_deterministic(res.json(), "rule_based_parser")


@pytest.mark.parametrize("skills", [["python", "reactjs", "k8s"], []])
def test_skill_normalization_reports_no_model_usage(client, skills):
    res = client.post("/api/v1/skills/normalize", json={"skills": skills})
    assert res.status_code == 200
    body = res.json()
    _assert_deterministic(body, "semantic_skill_engine")
    assert isinstance(body["normalized_skills"], list), "the backward-compatible root key is kept"


def test_roadmap_pipeline_reports_no_model_usage(client):
    res = client.post("/api/v1/roadmap/generate", json={"current_level": "junior", "target_role": "Backend Developer", "target_months": 6})
    assert res.status_code == 200
    _assert_deterministic(res.json(), "roadmap_pipeline")


def test_recommendation_pipeline_reports_no_model_usage(client):
    res = client.post("/api/v1/recommendations/generate", json={
        "user_skills": ["Python", "SQL"], "career_goal": "Backend Developer", "preferred_learning_style": "hands-on"})
    assert res.status_code == 200
    _assert_deterministic(res.json(), "recommendation_intelligence")


def test_mock_provider_reports_no_model_usage():
    from app.providers.mock_adapter import MockProvider
    resp = MockProvider().generate_content("a prompt of several words")
    assert resp.usage.model_dump() == NOT_INVOKED, "the development mock is canned text, not a model"


def test_reported_usage_is_kept_exactly():
    resp = ResponseNormalizer.normalize_success(
        raw_data="reply", provider="local", model="qwen3:4b-instruct-2507-q4_K_M", latency_ms=5.0,
        actual_usage={"prompt_tokens": 812, "completion_tokens": 64})
    assert resp.usage.model_dump() == {"prompt_tokens": 812, "completion_tokens": 64, "total_tokens": 876,
                                       "estimated_cost_usd": 0.0, "source": "provider", "cost_basis": "no_charge_local"}


def test_a_reported_zero_is_distinguished_from_unavailable_counts():
    measured = ResponseNormalizer.normalize_success(raw_data="", provider="local", model="m", latency_ms=1.0,
                                                    actual_usage={"prompt_tokens": 0, "completion_tokens": 0})
    unreported = ResponseNormalizer.normalize_success(raw_data="a long reply " * 50, provider="local", model="m",
                                                      latency_ms=1.0, prompt_text="a long prompt " * 50)
    assert measured.usage.source == "provider" and measured.usage.total_tokens == 0
    assert unreported.usage.source == "unavailable" and unreported.usage.total_tokens == 0, "no length-based estimate"


def test_failed_calls_estimate_nothing():
    resp = ResponseNormalizer.normalize_error("timeout", provider="local", model="m", latency_ms=1.0,
                                              prompt_text="a prompt that was never answered " * 20)
    assert resp.usage.source == "unavailable"
    assert (resp.usage.prompt_tokens, resp.usage.total_tokens, resp.usage.estimated_cost_usd) == (0, 0, 0.0)


@pytest.mark.parametrize("provider,model", [
    ("local", "qwen3:4b-instruct-2507-q4_K_M"), ("gemini", "gemini-2.5-flash"),
    ("openai", "gpt-4o"), ("some_new_provider", "unlisted-model"),
])
def test_no_cost_is_invented(provider, model):
    assert CostTracker.calculate_cost(provider, model, 100_000, 100_000) == 0.0


def test_cost_basis_states_why_the_cost_is_zero():
    assert CostTracker.cost_basis("local") == "no_charge_local"
    assert CostTracker.cost_basis("gemini") == "no_charge_free_tier"
    assert CostTracker.cost_basis("some_new_provider") == "unpriced"


def test_defaults_claim_no_provider_and_no_measurement():
    resp = UnifiedAIResponse()
    assert (resp.provider, resp.model) == ("unknown", "unknown"), "no response is attributed to Gemini by default"
    assert TokenUsage().source == "unavailable"


def test_operations_metrics_sum_reported_costs_only():
    metrics = MetricsEngine()
    assert metrics.get_summary()["estimated_cost_usd"] == 0.0
    metrics.record_inference(latency_ms=10.0, tokens=1_000_000)
    summary = metrics.get_summary()
    assert summary["total_tokens_consumed"] == 1_000_000
    assert summary["estimated_cost_usd"] == 0.0, "no per-token rate is applied"
