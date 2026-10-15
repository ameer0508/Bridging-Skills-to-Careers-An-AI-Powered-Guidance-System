"""
Local model (Ollama) integration: endpoint validation for the Docker service, the downloaded-model
check, honest structured output, redirect and proxy refusal, cache policy enforcement, and that a
slow model does not block the event loop. A fake Ollama server on loopback stands in for the real
one; nothing leaves the machine. All data is synthetic.
"""
import asyncio
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import httpx
import pytest

from app.cost_policy import runtime_policy, validate_local_model_endpoint
from app.gateway.ai_gateway import AIGateway
from app.providers.local_adapter import LocalModelAdapter
from app.schemas.ai_response import UnifiedAIResponse
from app.schemas.modules import CareerMatchResponse
from app.utils.caching_layer import ai_cache
from app.cost_policy.network_guard import block_external_network

MODEL = "qwen3:4b-instruct-2507-q4_K_M"
DOCKER_ENDPOINT = "http://ollama:11434/api/generate"
VALID_MATCH = {"match_score": 62.0, "matched_skills": ["Python"], "missing_skills": ["Docker"], "summary": "Synthetic."}


def private(host, port):
    return ["172.20.0.3"]


# --- Endpoint validation -----------------------------------------------------------------

def test_docker_ollama_service_is_accepted_when_it_resolves_privately():
    assert validate_local_model_endpoint(DOCKER_ENDPOINT, resolve=private) == ["172.20.0.3"]
    assert validate_local_model_endpoint("http://ollama:11434/api/chat", resolve=private) == ["172.20.0.3"]


@pytest.mark.parametrize("addresses", [
    ["8.8.8.8"],                    # public
    ["172.20.0.3", "34.1.2.3"],     # one public answer is enough to refuse
    ["169.254.169.254"],            # link-local (cloud metadata service)
    ["127.0.0.1"],                  # the name must not be a way around the loopback rule
    ["0.0.0.0"],
    ["2001:4860:4860::8888"],
    [],
])
def test_docker_ollama_service_is_refused_when_it_resolves_elsewhere(addresses):
    with pytest.raises(ValueError):
        validate_local_model_endpoint(DOCKER_ENDPOINT, resolve=lambda h, p: addresses)


def test_unresolvable_docker_name_is_refused():
    def fail(host, port):
        raise OSError("no such host")
    with pytest.raises(ValueError):
        validate_local_model_endpoint(DOCKER_ENDPOINT, resolve=fail)


@pytest.mark.parametrize("url", [
    "https://ollama:11434/api/generate",
    "http://ollama:8080/api/generate",
    "http://ollama/api/generate",
    "http://ollama:11434/api/pull",
    "http://ollama:11434/api/generate?x=1",
    "http://ollama:11434/api/generate#frag",
    "http://user:pw@ollama:11434/api/generate",
    "http://ollama.com:11434/api/generate",
    "http://ollama.evil.example:11434/api/generate",
    "http://my-ollama:11434/api/generate",
    "https://ollama.com/api/generate",
    "http://10.0.0.5:11434/api/generate",
    "http://ollama:notaport/api/generate",
])
def test_anything_but_the_exact_docker_endpoint_is_refused(url):
    with pytest.raises(ValueError):
        validate_local_model_endpoint(url, resolve=private)


def test_form_only_check_for_the_static_audit():
    assert validate_local_model_endpoint(DOCKER_ENDPOINT, resolve=None) == []
    with pytest.raises(ValueError):
        validate_local_model_endpoint("http://ollama.com:11434/api/generate", resolve=None)


def test_requests_are_pinned_to_the_validated_address(monkeypatch):
    monkeypatch.setenv("LOCAL_MODEL_ENDPOINT", DOCKER_ENDPOINT)
    url, headers = LocalModelAdapter()._url("/api/tags", ["172.20.0.3"])
    assert url == "http://172.20.0.3:11434/api/tags"
    assert headers == {"Host": "ollama:11434"}


# --- A fake Ollama server on loopback ----------------------------------------------------

class FakeOllama:
    def __init__(self):
        self.models = [MODEL]
        self.reply = json.dumps(VALID_MATCH)
        self.done_reason = "stop"
        self.prompt_eval_count = 120
        self.redirect_to = None
        self.generate_requests = []
        outer = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def _send(self, status, body, headers=None):
                data = json.dumps(body).encode()
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                for k, v in (headers or {}).items():
                    self.send_header(k, v)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def do_GET(self):
                if self.path == "/api/tags":
                    self._send(200, {"models": [{"name": m, "model": m} for m in outer.models]})
                else:
                    self._send(404, {"error": "not found"})

            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
                outer.generate_requests.append(body)
                if outer.redirect_to:
                    self._send(307, {}, {"Location": outer.redirect_to})
                    return
                if body["model"] not in outer.models:
                    self._send(404, {"error": f"model '{body['model']}' not found"})
                    return
                self._send(200, {"model": body["model"], "response": outer.reply, "done": True,
                                 "done_reason": outer.done_reason, "prompt_eval_count": outer.prompt_eval_count,
                                 "eval_count": 40})

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.endpoint = f"http://127.0.0.1:{self.server.server_address[1]}/api/generate"
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def close(self):
        self.server.shutdown()
        self.server.server_close()


@pytest.fixture
def ollama(monkeypatch):
    fake = FakeOllama()
    monkeypatch.setenv("ENABLE_LOCAL_MODEL", "true")
    monkeypatch.setenv("LOCAL_MODEL_ENDPOINT", fake.endpoint)
    monkeypatch.setenv("LOCAL_MODEL_NAME", MODEL)
    monkeypatch.delenv("OLLAMA_API_KEY", raising=False)
    yield fake
    fake.close()


def test_available_only_when_the_exact_model_is_downloaded(ollama):
    assert LocalModelAdapter().is_available() is True
    ollama.models = ["qwen3:4b"]  # a different tag of the same family does not count
    assert LocalModelAdapter().is_available() is False


def test_unavailable_when_the_server_is_down(monkeypatch):
    monkeypatch.setenv("ENABLE_LOCAL_MODEL", "true")
    monkeypatch.setenv("LOCAL_MODEL_ENDPOINT", "http://127.0.0.1:9/api/generate")
    monkeypatch.setenv("LOCAL_MODEL_NAME", MODEL)
    adapter = LocalModelAdapter()
    assert adapter.is_available() is False
    resp = adapter.generate_content("hello")
    assert resp.success is False and resp.response is None


def test_structured_result_is_validated_and_usage_is_reported(ollama):
    resp = LocalModelAdapter().match_career(["Python"], "Backend Developer", 1, CareerMatchResponse)
    assert resp.success is True
    assert resp.response == VALID_MATCH
    assert resp.provider == "local" and resp.model == MODEL
    assert resp.usage.source == "provider" and resp.usage.prompt_tokens == 120 and resp.usage.completion_tokens == 40
    assert resp.usage.estimated_cost_usd == 0.0, "a local model costs nothing, whatever its name"
    assert resp.confidence is None
    # The schema is handed to Ollama so it constrains the output
    assert ollama.generate_requests[-1]["format"]["required"] == ["match_score", "matched_skills", "missing_skills", "summary"]


@pytest.mark.parametrize("reply", [
    "not json at all",
    '{"match_score": 62}',                                       # missing fields
    json.dumps({**VALID_MATCH, "match_score": 250}),             # out of range
    "Here you go: " + json.dumps(VALID_MATCH) + " hope it helps",  # extra text is not repaired
])
def test_malformed_or_invalid_structured_output_is_a_failure(ollama, reply):
    ollama.reply = reply
    resp = LocalModelAdapter().match_career(["Python"], "Backend Developer", 1, CareerMatchResponse)
    assert resp.success is False
    assert resp.response is None and resp.data is None


def test_cut_off_structured_output_is_a_failure(ollama):
    ollama.done_reason = "length"
    resp = LocalModelAdapter().match_career(["Python"], "Backend Developer", 1, CareerMatchResponse)
    assert resp.success is False


def test_prompt_overflowing_the_context_window_is_a_failure(ollama, monkeypatch):
    monkeypatch.setenv("LOCAL_MODEL_NUM_CTX", "2048")
    ollama.prompt_eval_count = 2000
    assert LocalModelAdapter().generate_content("hello").success is False
    # Far too long to fit: refused before any request
    sent = len(ollama.generate_requests)
    assert LocalModelAdapter().generate_content("x" * 10000).success is False
    assert len(ollama.generate_requests) == sent


def test_chat_reply_is_real_text_and_cut_off_replies_are_flagged(ollama):
    ollama.reply = "<think>internal</think>Learn Docker next."
    resp = LocalModelAdapter().generate_content("What next?")
    assert resp.success and resp.response == "Learn Docker next."
    assert "truncated" not in resp.metadata
    ollama.done_reason = "length"
    assert LocalModelAdapter().generate_content("What next?").metadata.get("truncated") is True


def test_empty_reply_is_a_failure(ollama):
    ollama.reply = "   "
    assert LocalModelAdapter().generate_content("What next?").success is False


def test_redirects_are_not_followed(ollama):
    ollama.redirect_to = "http://example.com/api/generate"
    with block_external_network() as net:
        resp = LocalModelAdapter().generate_content("hello")
    assert resp.success is False
    assert net.attempts == [], "the redirect target was never contacted"


def test_proxy_settings_are_ignored(ollama, monkeypatch):
    monkeypatch.setenv("HTTP_PROXY", "http://proxy.example:3128")
    monkeypatch.setenv("http_proxy", "http://proxy.example:3128")
    with block_external_network() as net:
        assert LocalModelAdapter().generate_content("hello").success is True
    assert net.attempts == []


# --- Gateway: privacy routing and the cache -----------------------------------------------

GEMINI_CLEARED = {"SKILLBRIDGE_ENABLE_GEMINI": "true", "SKILLBRIDGE_GEMINI_NO_BILLING_ATTESTED": "true",
                  "GEMINI_API_KEY": "gemini-test-key-0008"}


def test_personal_services_go_to_the_local_model_never_gemini(ollama, monkeypatch):
    for k, v in GEMINI_CLEARED.items():
        monkeypatch.setenv(k, v)
    gateway = AIGateway()
    personal = [p.provider_name for p in gateway.get_provider_chain(contains_personal_data=True)]
    assert "gemini" not in personal and personal[0] == "local"
    non_personal = [p.provider_name for p in gateway.get_provider_chain(contains_personal_data=False)]
    assert non_personal[:2] == ["gemini", "local"]


def _cached(provider: str) -> UnifiedAIResponse:
    return UnifiedAIResponse(success=True, provider=provider, model="m", response=VALID_MATCH, data=VALID_MATCH)


def test_cached_answer_is_not_served_once_its_provider_is_refused(monkeypatch):
    payload = {"user_skills": ["Python"], "target_role": "Synthetic Role", "experience_years": 1.0}
    ai_cache.clear()
    # An answer from Gemini stored under a personal service must never be handed out
    ai_cache.set("career_matching", payload, _cached("gemini"))
    resp = AIGateway().route_request("career_matching", "match_career", payload, CareerMatchResponse)
    assert resp.provider != "gemini"
    assert ai_cache.get("career_matching", payload) is None or ai_cache.get("career_matching", payload).provider != "gemini"
    ai_cache.clear()


def test_cached_answer_from_an_allowed_provider_is_served(ollama):
    payload = {"user_skills": ["Python"], "target_role": "Synthetic Role 2", "experience_years": 1.0}
    ai_cache.clear()
    ai_cache.set("career_matching", payload, _cached("local"))
    sent = len(ollama.generate_requests)
    resp = AIGateway().route_request("career_matching", "match_career", payload, CareerMatchResponse)
    assert resp.provider == "local" and resp.metadata.get("cached") is True
    assert len(ollama.generate_requests) == sent
    ai_cache.clear()


def test_cache_returns_copies():
    ai_cache.clear()
    original = _cached("local")
    ai_cache.set("career_matching", {"k": 1}, original)
    original.metadata["changed_after_store"] = True
    hit = ai_cache.get("career_matching", {"k": 1})
    hit.metadata["changed_by_caller"] = True
    again = ai_cache.get("career_matching", {"k": 1})
    assert "changed_after_store" not in again.metadata and "changed_by_caller" not in again.metadata
    ai_cache.clear()


def test_chat_replies_are_never_cached(ollama, monkeypatch):
    from app.services import chat_service
    monkeypatch.setitem(chat_service.ai_gateway.providers, "local", LocalModelAdapter())
    stored = []
    monkeypatch.setattr(ai_cache, "set", lambda *a, **k: stored.append(a[0]))
    monkeypatch.setattr(ai_cache, "get", lambda *a, **k: pytest.fail("chat must not read the cache"))
    ollama.reply = "A synthetic reply."
    resp = chat_service.generate_chat_via_ai("[USER]: hi")
    assert resp.success and resp.provider == "local"
    assert stored == []


# --- Event loop ---------------------------------------------------------------------------

def test_slow_model_does_not_block_other_requests(monkeypatch, service_headers):
    from app.main import app
    from app.routers import chat as chat_router

    class Local:
        provider_name = "local"

    def slow_chat(prompt):
        time.sleep(1.5)  # blocking, like a real local generation
        return UnifiedAIResponse(success=True, provider="local", model=MODEL, response="ok", data="ok")

    monkeypatch.setattr(chat_router.ai_gateway, "get_provider_chain", lambda *a, **k: [Local()])
    monkeypatch.setattr(chat_router, "generate_chat_via_ai", slow_chat)

    async def scenario():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            async def chat():
                r = await client.post("/api/v1/chat", json={"prompt": "hi"}, headers=service_headers)
                return r, time.monotonic()

            async def health():
                await asyncio.sleep(0.2)
                r = await client.get("/api/v1/health")
                return r, time.monotonic()

            started = time.monotonic()
            (chat_r, chat_done), (health_r, health_done) = await asyncio.gather(chat(), health())
            return started, chat_r, chat_done, health_r, health_done

    started, chat_r, chat_done, health_r, health_done = asyncio.run(scenario())
    assert chat_r.status_code == 200 and health_r.status_code == 200
    assert health_done - started < 1.0, "health check waited for the model"
    assert health_done < chat_done
