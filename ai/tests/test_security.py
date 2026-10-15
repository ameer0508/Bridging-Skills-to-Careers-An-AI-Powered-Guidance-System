"""
Security tests for the internal AI service: service authentication, per-user ownership,
CORS, and resume upload hardening.
"""
import io
import os
import tempfile
import zipfile

import pytest

from app.main import app
from app.core.security import ACTING_USER_HEADER, INTERNAL_KEY_HEADER

USER_A = "64b000000000000000000001"
USER_B = "64b000000000000000000002"

PUBLIC_PATHS = {"/api/v1/health"}
# Developer status pages: open outside production, covered separately below
DEV_ONLY_PATHS = {"/", "/api/v1/realtime"}
FRAMEWORK_PATHS = {"/docs", "/redoc", "/openapi.json", "/docs/oauth2-redirect"}


class _Route:
    def __init__(self, path, methods):
        self.path = path
        self.methods = methods


def _all_api_routes():
    """Every documented operation, taken from the OpenAPI schema so nothing registered is missed."""
    http_methods = {"get", "post", "put", "patch", "delete"}
    return [
        _Route(path, {m.upper() for m in operations if m in http_methods})
        for path, operations in app.openapi()["paths"].items()
    ]


def _concrete(path: str) -> str:
    """Fills path parameters with harmless values so the route can be requested."""
    out = path
    for route_param in ("user_id", "entity_id"):
        out = out.replace("{" + route_param + "}", USER_A)
    for name in ("username", "profile_id", "domain", "node_id", "flag_key", "correlation_id"):
        out = out.replace("{" + name + "}", "sample")
    return out


# --- Authentication -----------------------------------------------------------------


def test_health_is_public_but_minimal(anonymous_client):
    res = anonymous_client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "healthy"
    # Provider configuration must not leak to unauthenticated callers
    assert "providers" not in body
    assert "primary_provider" not in body


def test_health_returns_details_with_credentials(client):
    body = client.get("/api/v1/health").json()
    assert "providers" in body


def test_every_route_except_health_rejects_missing_credentials(anonymous_client):
    """Audits ALL registered routes, not just the ones the backend happens to call."""
    checked = 0
    for route in _all_api_routes():
        if route.path in PUBLIC_PATHS | DEV_ONLY_PATHS | FRAMEWORK_PATHS:
            continue
        for method in route.methods - {"HEAD", "OPTIONS"}:
            res = anonymous_client.request(method, _concrete(route.path))
            assert res.status_code == 401, f"{method} {route.path} is reachable without credentials"
            checked += 1
    assert checked >= 40  # guards against the audit silently checking nothing


def test_invalid_credentials_are_rejected(anonymous_client):
    res = anonymous_client.post(
        "/api/v1/chat",
        json={"prompt": "hello"},
        headers={INTERNAL_KEY_HEADER: "definitely-not-the-key"},
    )
    assert res.status_code == 401
    # The response must not echo the presented or expected key
    assert "definitely-not-the-key" not in res.text
    assert "test-internal-service-key" not in res.text


def test_valid_credentials_are_accepted(client):
    res = client.post("/api/v1/skills/normalize", json={"skills": ["python"]})
    assert res.status_code == 200
    assert res.json()["normalized_skills"][0]["raw_name"] == "python"


# --- Ownership ----------------------------------------------------------------------


def _user_scoped_routes():
    return [r for r in _all_api_routes() if "{user_id}" in r.path or "{entity_id}" in r.path]


def test_user_scoped_routes_exist():
    assert len(_user_scoped_routes()) >= 8


def test_user_scoped_routes_require_an_acting_user(client):
    assert _user_scoped_routes(), "no user-scoped routes found; the audit would be vacuous"
    for route in _user_scoped_routes():
        for method in route.methods - {"HEAD", "OPTIONS"}:
            res = client.request(method, _concrete(route.path))
            assert res.status_code == 403, f"{method} {route.path} served without an acting user"


def test_cross_user_access_is_forbidden(client):
    """User B's session must not read or erase user A's data."""
    assert _user_scoped_routes(), "no user-scoped routes found; the audit would be vacuous"
    for route in _user_scoped_routes():
        for method in route.methods - {"HEAD", "OPTIONS"}:
            res = client.request(
                method,
                _concrete(route.path),
                headers={ACTING_USER_HEADER: USER_B},
            )
            assert res.status_code == 403, f"{method} {route.path} allowed cross-user access"


def test_owner_access_is_allowed(client):
    res = client.get(f"/api/v1/memory/context/{USER_A}", headers={ACTING_USER_HEADER: USER_A})
    assert res.status_code == 200


# --- Routes that name the user in the request body ------------------------------------

BODY_USER_FIELDS = ("user_id", "entity_id")
_PLACEHOLDERS = {"string": "synthetic", "integer": 1, "number": 1.0, "boolean": False, "array": [], "object": {}}


def _body_user_routes():
    """(path, method, minimal body) for every operation whose JSON body carries a user id."""
    spec = app.openapi()
    schemas = spec.get("components", {}).get("schemas", {})
    found = []
    for path, operations in spec["paths"].items():
        for method, op in operations.items():
            ref = op.get("requestBody", {}).get("content", {}).get("application/json", {}).get("schema", {}).get("$ref")
            if not ref:
                continue
            schema = schemas[ref.rsplit("/", 1)[-1]]
            field = next((f for f in BODY_USER_FIELDS if f in schema.get("properties", {})), None)
            if field is None:
                continue
            body = {name: _PLACEHOLDERS.get(schema["properties"][name].get("type"), "synthetic")
                    for name in schema.get("required", [])}
            found.append((path, method.upper(), field, body))
    return found


def test_body_user_routes_exist():
    paths = {p for p, *_ in _body_user_routes()}
    assert {"/api/v1/analytics/insights", "/api/v1/analytics/simulate"} <= paths


@pytest.mark.parametrize("acting_user", [None, "", USER_B])
def test_body_user_id_must_be_the_acting_user(client, acting_user):
    """Missing, empty or another user's identity: the body cannot name someone else."""
    for path, method, field, body in _body_user_routes():
        headers = {} if acting_user is None else {ACTING_USER_HEADER: acting_user}
        res = client.request(method, path, json={**body, field: USER_A}, headers=headers)
        assert res.status_code == 403, f"{method} {path} accepted {field}={USER_A} acting as {acting_user!r}"


def test_body_user_id_matching_the_acting_user_is_served(client):
    for path, method, field, body in _body_user_routes():
        res = client.request(method, path, json={**body, field: USER_A}, headers={ACTING_USER_HEADER: USER_A})
        assert res.status_code == 200, f"{method} {path} refused its own user ({res.status_code})"


def test_body_user_routes_still_need_the_service_key(anonymous_client):
    for path, method, field, body in _body_user_routes():
        res = anonymous_client.request(method, path, json={**body, field: USER_A}, headers={ACTING_USER_HEADER: USER_A})
        assert res.status_code == 401, f"{method} {path} served without the service key"


# --- CORS ---------------------------------------------------------------------------


def test_cors_rejects_untrusted_origin(anonymous_client):
    res = anonymous_client.options(
        "/api/v1/chat",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert res.headers.get("access-control-allow-origin") is None


def test_cors_allows_configured_origin_without_credentials(anonymous_client):
    res = anonymous_client.options(
        "/api/v1/chat",
        headers={"Origin": "http://localhost:5000", "Access-Control-Request-Method": "POST"},
    )
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5000"
    assert res.headers.get("access-control-allow-credentials") is None


# --- Upload hardening ---------------------------------------------------------------

RESUME_TEXT = (
    "Jordan Example\njordan@example.com\n\nSkills\nPython, React, Docker\n\n"
    "Experience\nSoftware Engineer at Example Co\nBuilt APIs with Python.\n"
).encode("utf-8")


def _upload(client, filename, content, content_type="application/octet-stream"):
    return client.post("/api/v1/extract", files={"file": (filename, io.BytesIO(content), content_type)})


def test_upload_requires_credentials(anonymous_client):
    assert _upload(anonymous_client, "resume.txt", RESUME_TEXT).status_code == 401


def test_valid_text_resume_is_parsed(client):
    res = _upload(client, "resume.txt", RESUME_TEXT, "text/plain")
    assert res.status_code == 200
    skills = {s["name"] for s in res.json()["data"]["skills"]}
    assert {"Python", "React", "Docker"} <= skills


@pytest.mark.parametrize(
    "malicious_name",
    [
        "../../../../evil.txt",
        "..\\..\\..\\evil.txt",
        "/etc/cron.d/evil.txt",
        "C:\\Windows\\System32\\evil.txt",
        "....//....//evil.txt",
    ],
)
def test_malicious_filenames_cannot_escape_the_temp_directory(client, malicious_name):
    marker_dir = tempfile.gettempdir()
    before = set(os.listdir(marker_dir))
    res = _upload(client, malicious_name, RESUME_TEXT, "text/plain")
    # The upload is processed safely from a server-generated path...
    assert res.status_code == 200
    # ...the client-supplied name is not reflected back...
    assert "evil" not in res.text
    # ...and nothing named by the attacker was written, nor any temp directory left behind
    after = set(os.listdir(marker_dir))
    assert not any("evil" in name for name in after - before)
    assert not any(name.startswith("skillbridge-resume-") for name in after - before)
    assert not os.path.exists("/etc/cron.d/evil.txt")


def test_unsupported_extension_is_rejected(client):
    assert _upload(client, "resume.exe", b"MZ\x90\x00").status_code == 400
    assert _upload(client, "resume", RESUME_TEXT).status_code == 400
    assert _upload(client, "resume.pdf.exe", RESUME_TEXT).status_code == 400


def test_oversized_upload_is_rejected(client):
    too_big = b"a" * (64 * 1024 + 1)  # limit is 64 KiB in the test environment
    res = _upload(client, "resume.txt", too_big, "text/plain")
    assert res.status_code == 413


def test_empty_upload_is_rejected(client):
    assert _upload(client, "resume.txt", b"", "text/plain").status_code == 400


def test_pdf_extension_with_non_pdf_content_is_rejected(client):
    res = _upload(client, "resume.pdf", b"MZ this is really an executable", "application/pdf")
    assert res.status_code == 415


def test_docx_extension_with_non_docx_content_is_rejected(client):
    assert _upload(client, "resume.docx", b"not a zip archive").status_code == 415

    # A real zip that is not a Word document must also be refused
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("payload.txt", "hello")
    assert _upload(client, "resume.docx", buffer.getvalue()).status_code == 415


def test_binary_content_with_txt_extension_is_rejected(client):
    assert _upload(client, "resume.txt", b"\x00\x01\x02binary", "text/plain").status_code == 415


def test_valid_docx_is_parsed(client):
    docx = pytest.importorskip("docx")
    document = docx.Document()
    for line in RESUME_TEXT.decode("utf-8").splitlines():
        document.add_paragraph(line)
    buffer = io.BytesIO()
    document.save(buffer)
    res = _upload(client, "resume.docx", buffer.getvalue())
    assert res.status_code == 200
    assert "Python" in {s["name"] for s in res.json()["data"]["skills"]}


# --- Production configuration -------------------------------------------------------


def test_production_refuses_the_development_key():
    from app.core.config import DEV_INTERNAL_SERVICE_KEY, Settings

    with pytest.raises(RuntimeError):
        Settings(ENV="production", INTERNAL_SERVICE_KEY=DEV_INTERNAL_SERVICE_KEY).validate_for_startup()
    with pytest.raises(RuntimeError):
        Settings(ENV="production", INTERNAL_SERVICE_KEY="strong-key", CORS_ALLOWED_ORIGINS="*").validate_for_startup()
    Settings(ENV="production", INTERNAL_SERVICE_KEY="a-strong-unique-key").validate_for_startup()
