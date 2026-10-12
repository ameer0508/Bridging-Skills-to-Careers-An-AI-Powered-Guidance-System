"""
Chat endpoint: a real provider's reply is passed through with its provider and model; the
development mock is never presented as an AI reply; failures are reported without detail.
"""
import pytest

from app.gateway.ai_gateway import ai_gateway
from app.utils.response_normalizer import ResponseNormalizer

URL = "/api/v1/chat"


class _ChatProvider:
    provider_name = "fake_llm"
    default_model = "fake-model"

    def __init__(self, reply="Based on your profile, practise Docker next."):
        self.reply = reply
        self.prompts = []

    def is_available(self):
        return True

    def generate_content(self, prompt, **kwargs):
        self.prompts.append(prompt)
        return ResponseNormalizer.normalize_success(
            raw_data=self.reply, provider=self.provider_name, model=self.default_model, latency_ms=12.0
        )


@pytest.fixture
def use_provider(monkeypatch):
    def _install(provider):
        monkeypatch.setattr(ai_gateway, "get_provider_chain", lambda requested_provider=None: [provider])
        return provider
    return _install


def test_mock_provider_never_answers_chat(client):
    """With no real provider configured the canned mock text must not reach the user."""
    res = client.post(URL, json={"prompt": "What should I learn next? (mock check)"})
    assert res.status_code == 503
    assert res.json() == {"success": False, "code": "AI_UNAVAILABLE", "error": "AI chat is unavailable."}
    assert "Mock AI Response" not in res.text


def test_real_provider_reply_is_returned_with_its_source(client, use_provider):
    provider = use_provider(_ChatProvider())
    res = client.post(URL, json={"prompt": "What should I learn next? (real check)"})
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"] == "Based on your profile, practise Docker next."
    assert body["provider"] == "fake_llm" and body["model"] == "fake-model"
    assert "confidence" not in body, "no confidence figure is invented for a chat reply"
    assert provider.prompts == ["What should I learn next? (real check)"]


def test_mock_reply_reached_through_fallback_is_rejected(client, use_provider):
    class _MockLike(_ChatProvider):
        provider_name = "mock"

    class _Real(_ChatProvider):
        def generate_content(self, prompt, **kwargs):
            raise RuntimeError("upstream exploded: secret-internal-detail")

    # A chain containing only the mock is treated as "no real provider"
    use_provider(_MockLike())
    assert client.post(URL, json={"prompt": "fallback check 1"}).status_code == 503

    # A real provider that fails is reported as unavailable, without leaking the reason
    use_provider(_Real())
    res = client.post(URL, json={"prompt": "fallback check 2"})
    assert res.status_code == 503
    assert "secret-internal-detail" not in res.text


def test_empty_reply_is_not_passed_on(client, use_provider):
    use_provider(_ChatProvider(reply="   "))
    assert client.post(URL, json={"prompt": "empty reply check"}).status_code == 503


@pytest.mark.parametrize("payload", [{}, {"prompt": ""}, {"prompt": "x" * 60001}])
def test_request_validation(client, payload):
    assert client.post(URL, json=payload).status_code == 422


def test_requires_internal_credentials(anonymous_client):
    assert anonymous_client.post(URL, json={"prompt": "hello"}).status_code == 401
