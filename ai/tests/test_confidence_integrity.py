"""
No confidence figure is returned as if it had been measured.

The response envelope, the rule-based resume parser and skill normalisation used to attach
fixed numbers such as 0.95. They now report None, with the method that produced the value.
"""
from app.resume_intelligence.semantic_entities import SemanticExtractedEntity, SemanticSkill
from app.schemas.ai_response import UnifiedAIResponse
from app.utils.confidence_calculator import ConfidenceCalculator
from app.utils.response_normalizer import ResponseNormalizer

RESUME = b"""Priya Sharma
Email: priya.sharma@example.com

Experience
Frontend Developer at Example Co (2022 - 2024)
- Built dashboards with React and TypeScript.

Projects
Campus Marketplace
- REST service written in Node.js.

Education
B.Tech Computer Science, Example University, 2022

Skills
React, TypeScript, Node.js, Git
"""


def _confidences(node):
    """Every value stored under a key named `confidence`, anywhere in a JSON-like structure."""
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "confidence":
                yield value
            else:
                yield from _confidences(value)
    elif isinstance(node, list):
        for item in node:
            yield from _confidences(item)


def test_schema_defaults_do_not_invent_a_confidence():
    assert UnifiedAIResponse().confidence is None
    assert SemanticExtractedEntity(value="x").confidence is None
    assert SemanticSkill(name="React", category="Frameworks").confidence is None
    assert SemanticExtractedEntity(value="x").transformer_model is None, "no model is named when none ran"


def test_response_envelope_reports_confidence_as_not_measured():
    for provider in ("gemini", "openai", "mock", "local"):
        ok = ResponseNormalizer.normalize_success(raw_data={"a": 1}, provider=provider, model="m", latency_ms=1.0)
        assert ok.confidence is None, f"{provider}: a confidence figure was attached"
        assert ok.metadata["confidence_basis"] == "not_measured"
    failed = ResponseNormalizer.normalize_error(error_msg="boom", provider="gemini", model="m", latency_ms=1.0)
    assert failed.confidence is None
    assert ConfidenceCalculator.calculate({"a": 1}, "gemini") is None


def test_rule_based_resume_extraction_attaches_no_confidence(client):
    res = client.post("/api/v1/extract", files={"file": ("resume.txt", RESUME, "text/plain")})
    assert res.status_code == 200, res.text
    data = res.json()["data"]
    assert data["personalInfo"]["fullName"]["value"] == "Priya Sharma"
    assert len(data["skills"]) >= 4
    found = list(_confidences(data))
    assert found, "the payload still carries the confidence fields the backend expects"
    assert all(value is None for value in found), f"invented confidence values: {sorted({v for v in found if v is not None})}"


def test_skill_normalisation_reports_method_not_confidence(client):
    res = client.post("/api/v1/skills/normalize", json={"skills": ["react", "Node JS", "Underwater Basket Weaving"]})
    assert res.status_code == 200, res.text
    body = res.json()
    skills = body["normalized_skills"]
    assert [s["canonical_name"] for s in skills][:1] == ["React"]
    assert all(value is None for value in _confidences(skills)), "normalisation attached a confidence figure"
    assert any("Canonical name found by: shared skill lexicon" in e for e in skills[0]["evidence"])
    assert any("not recognised; kept as written" in e for e in skills[2]["evidence"])
    assert not any("% confidence" in e for s in skills for e in s["evidence"])


# --- The fictional resume in the development mock must never be returned as a parse result ---

def _break_rule_parser(monkeypatch):
    """Makes the rule-based pipeline fail so that its AI fallback path is taken."""
    from app.resume_intelligence import parser_pipeline

    def boom(*args, **kwargs):
        raise RuntimeError("simulated parser failure")

    monkeypatch.setattr(parser_pipeline.ResumeIntelligencePipeline, "_convert_to_parsed_response", classmethod(boom))


def test_parser_failure_without_a_provider_is_an_error_not_a_made_up_resume(client, monkeypatch):
    _break_rule_parser(monkeypatch)
    res = client.post("/api/v1/extract", files={"file": ("resume.txt", RESUME, "text/plain")})
    assert res.status_code >= 400, "a failed parse was reported as a success"
    assert "Jane Doe" not in res.text and "Stanford" not in res.text, "the mock provider's fictional resume was returned"


def test_parser_failure_uses_a_real_provider_when_one_is_available(client, monkeypatch):
    from app.gateway.ai_gateway import ai_gateway

    class _RealProvider:
        provider_name = "fake_llm"
        default_model = "fake-model"

        def is_available(self):
            return True

        def parse_resume_text(self, text, schema_class):
            parsed = schema_class.model_validate({"personalInfo": {"fullName": {"value": "Priya Sharma"}}, "skills": [{"name": "React", "category": "Frameworks"}]})
            return ResponseNormalizer.normalize_success(raw_data=parsed.model_dump(), provider=self.provider_name, model=self.default_model, latency_ms=1.0)

    _break_rule_parser(monkeypatch)
    monkeypatch.setattr(ai_gateway, "get_provider_chain", lambda requested_provider=None: [_RealProvider()])
    res = client.post("/api/v1/extract", files={"file": ("resume-provider-path.txt", RESUME + b"\nunique", "text/plain")})
    assert res.status_code == 200, res.text
    data = res.json()["data"]
    assert data["personalInfo"]["fullName"]["value"] == "Priya Sharma"
    assert data["personalInfo"]["fullName"]["confidence"] is None, "no confidence is added to what the provider returned"
