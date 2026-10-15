"""
Test configuration is isolated from real settings: no .env file (ai/.env or the repository-root
.env that Docker Compose reads) and no provider variable from the shell reaches a test, and no
test can open a connection to an external AI endpoint. Outside tests, ai/.env still loads.
"""
import json
import os
import shutil
import socket
import subprocess
import sys
from pathlib import Path

import pytest

from app.cost_policy import runtime_policy
from app.cost_policy.network_guard import LiveNetworkCallBlocked, block_external_network
from tests.conftest import PROVIDER_ENV_NAMES, PROVIDER_ENV_PREFIXES

AI_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = AI_DIR.parent


def test_no_provider_variable_reaches_the_tests():
    leaked = [n for n in os.environ if n in PROVIDER_ENV_NAMES or n.startswith(PROVIDER_ENV_PREFIXES)]
    assert leaked == []
    assert os.environ.get("SKILLBRIDGE_SKIP_DOTENV") == "1"


def test_repository_root_env_does_not_leak_into_tests():
    """On a machine with a real root .env (as Docker Compose needs), none of its names are set here."""
    root_env = REPO_ROOT / ".env"
    if not root_env.exists():
        pytest.skip("no repository-root .env on this machine")
    from dotenv import dotenv_values
    names = [n for n in dotenv_values(root_env) if n in PROVIDER_ENV_NAMES or n.startswith(PROVIDER_ENV_PREFIXES)]
    assert [n for n in names if n in os.environ] == []


def test_gemini_and_local_model_are_off_in_tests():
    assert not runtime_policy.check("gemini").allowed
    from app.providers.local_adapter import LocalModelAdapter
    assert LocalModelAdapter().is_available() is False


@pytest.mark.parametrize("host", ["generativelanguage.googleapis.com", "api.openai.com", "ollama.com", "ollama"])
def test_external_ai_endpoints_cannot_be_reached_from_tests(host):
    with block_external_network() as net:
        with pytest.raises(LiveNetworkCallBlocked):
            socket.getaddrinfo(host, 443)
    assert net.attempts == [host]


# --- Loading outside tests, in a throwaway copy of the layout --------------------------------

PROBE = """
import json, os, sys
sys.path.insert(0, os.environ["PROBE_APP_DIR"])
from app.core.config import settings
print(json.dumps({
    "root_gemini_flag": os.getenv("SKILLBRIDGE_ENABLE_GEMINI"),
    "root_gemini_key": os.getenv("GEMINI_API_KEY"),
    "root_local_flag": os.getenv("ENABLE_LOCAL_MODEL"),
    "ai_marker": os.getenv("AI_DEV_MARKER"),
    "port": settings.PORT,
    "settings_gemini_key": settings.GEMINI_API_KEY,
}))
"""


@pytest.fixture
def layout(tmp_path):
    """root/.env (Compose's, with provider flags) and root/ai/.env (the AI service's own)."""
    root = tmp_path / "root"
    (root / "ai" / "app" / "core").mkdir(parents=True)
    shutil.copy(AI_DIR / "app" / "__init__.py", root / "ai" / "app" / "__init__.py")
    shutil.copy(AI_DIR / "app" / "core" / "config.py", root / "ai" / "app" / "core" / "config.py")
    (root / ".env").write_text(
        "SKILLBRIDGE_ENABLE_GEMINI=true\nSKILLBRIDGE_GEMINI_NO_BILLING_ATTESTED=true\n"
        "GEMINI_API_KEY=root-env-synthetic-marker\nENABLE_LOCAL_MODEL=true\n", encoding="utf-8")
    (root / "ai" / ".env").write_text("AI_DEV_MARKER=from-ai-env\nPORT=8123\n", encoding="utf-8")
    return root


def _probe(cwd: Path, skip_dotenv: bool, service_env: str = "test") -> dict:
    """Imports the settings in a fresh interpreter started in `cwd`, the app living in root/ai."""
    env = {k: v for k, v in os.environ.items() if k != "SKILLBRIDGE_SKIP_DOTENV"}
    env["PROBE_APP_DIR"] = str(cwd / "ai" if (cwd / "ai").is_dir() else cwd)
    env["ENV"] = service_env
    if skip_dotenv:
        env["SKILLBRIDGE_SKIP_DOTENV"] = "1"
    out = subprocess.run([sys.executable, "-c", PROBE], cwd=cwd, env=env, capture_output=True, text=True, timeout=60)
    assert out.returncode == 0, out.stderr[-2000:]
    return json.loads(out.stdout.strip().splitlines()[-1])


def test_development_loads_ai_env_but_never_the_root_env(layout):
    result = _probe(layout / "ai", skip_dotenv=False)
    assert result["ai_marker"] == "from-ai-env" and result["port"] == 8123
    assert result["root_gemini_flag"] is None and result["root_gemini_key"] is None and result["root_local_flag"] is None
    assert result["settings_gemini_key"] is None


def test_root_env_is_ignored_when_there_is_no_ai_env(layout):
    # The usual Docker developer's checkout: only the root .env exists. A parent-directory search
    # for a .env used to find it and load its provider flags into the AI service.
    (layout / "ai" / ".env").unlink()
    result = _probe(layout / "ai", skip_dotenv=False)
    assert result["root_gemini_flag"] is None and result["root_gemini_key"] is None and result["root_local_flag"] is None
    assert result["settings_gemini_key"] is None and result["port"] == 8000


def test_root_env_is_ignored_even_when_started_from_the_repository_root(layout):
    # The settings class used to read a .env from the working directory: here, Compose's
    result = _probe(layout, skip_dotenv=False)
    assert result["root_gemini_flag"] is None and result["root_gemini_key"] is None
    assert result["settings_gemini_key"] is None


@pytest.mark.parametrize("service_env", ["production", "development"])
def test_skip_switch_is_ignored_outside_a_test_run(layout, service_env):
    # Left set on a deployed service, the switch must not strip its configuration
    result = _probe(layout / "ai", skip_dotenv=True, service_env=service_env)
    assert result["ai_marker"] == "from-ai-env" and result["port"] == 8123


def test_skip_switch_disables_every_env_file(layout):
    result = _probe(layout / "ai", skip_dotenv=True)
    assert result["ai_marker"] is None and result["port"] == 8000
    assert result["root_gemini_flag"] is None and result["settings_gemini_key"] is None
