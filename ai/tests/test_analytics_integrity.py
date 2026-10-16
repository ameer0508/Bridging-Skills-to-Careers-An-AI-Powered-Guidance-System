"""
The AI analytics routes return no unsupported numbers: no forecast, salary, growth, readiness or
confidence figure is presented as intelligence. They say plainly that predictive analytics are
unavailable for lack of evidence, and echo only exact counts of what was sent.
"""
import importlib.util
import json
import re

import pytest

from app.core.security import ACTING_USER_HEADER

USER = "64b000000000000000000001"
ROUTES = ["/api/v1/analytics/insights", "/api/v1/analytics/simulate"]
FULL_REQUEST = {
    "user_id": USER,
    "target_role": "Backend Developer",
    "current_level": "junior",
    "user_skills": ["Python", "SQL", "Docker"],
    "skills_trend": [{"month": "2026-08", "skills": 2}, {"month": "2026-09", "skills": 3}],
    "simulation_scenario": {"add_skills": ["Kubernetes"]},
}
FORECAST_WORDS = re.compile(r"salary|compensation|forecast|projected|predict|\$|%|usd|inr|₹", re.IGNORECASE)


def _post(client, route, body):
    return client.post(route, json=body, headers={ACTING_USER_HEADER: USER})


@pytest.mark.parametrize("route", ROUTES)
def test_answers_insufficient_evidence_without_data(client, route):
    res = _post(client, route, FULL_REQUEST)
    assert res.status_code == 200
    body = res.json()
    assert body["available"] is False and body["success"] is False
    assert body["status"] == "insufficient_evidence"
    assert body["data"] is None and body["confidence"] is None
    assert "salary_prediction" in body["not_produced"] and "readiness_forecast" in body["not_produced"]


@pytest.mark.parametrize("route", ROUTES)
def test_no_number_except_exact_input_counts(client, route):
    body = _post(client, route, FULL_REQUEST).json()
    assert body["inputs_received"] == {"skills": 3, "skills_trend_points": 2, "simulation_scenario": True}
    rest = {k: v for k, v in body.items() if k != "inputs_received"}
    text = json.dumps(rest)
    assert not re.search(r"\d", text), f"a number reached the response: {text[:200]}"


@pytest.mark.parametrize("route", ROUTES)
def test_no_forecast_or_salary_value_is_returned(client, route):
    body = _post(client, route, FULL_REQUEST).json()
    for name in body["not_produced"]:
        assert name not in body, f"{name} returned as a value"
    # The feature name, the list of withheld fields and the explanation are labels, not values
    values = json.dumps({k: v for k, v in body.items() if k not in ("feature", "not_produced", "reason")})
    assert not FORECAST_WORDS.search(values), values[:200]


def test_minimal_request_invents_nothing(client):
    """No skills sent: no default skill list or baseline is filled in."""
    body = _post(client, ROUTES[0], {"user_id": USER}).json()
    assert body["inputs_received"] == {"skills": 0, "skills_trend_points": 0, "simulation_scenario": False}
    assert body["data"] is None


def test_forecasting_code_is_gone():
    assert importlib.util.find_spec("app.predictive_analytics") is None
