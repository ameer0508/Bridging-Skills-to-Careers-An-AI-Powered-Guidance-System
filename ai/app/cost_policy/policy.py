"""
Zero-cost provider policy (docs/ZERO_COST_API_POLICY.md).

Every live call to something outside this process must first be cleared by `CostPolicy.check`.
The policy fails closed: an unknown, unverified or blocked provider, a missing flag or
credential, personal data bound for a provider that may not receive it, or a used-up quota all
refuse the call. Refusals never name a secret, and nothing here ever picks another provider.
"""
import ipaddress
import json
import os
import socket
import threading
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List, Mapping, Optional
from urllib.parse import urlparse

REGISTRY_PATH = Path(__file__).with_name("provider_registry.json")

LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "::1"}
# The Ollama service in docker-compose.yml, reachable only on its internal-only network. Fixed here
# rather than read from the environment, so configuration cannot widen it to another host.
DOCKER_LOCAL_MODEL_HOSTS = {"ollama"}
DOCKER_LOCAL_MODEL_PORT = 11434
DOCKER_LOCAL_MODEL_PATHS = {"/api/generate", "/api/chat"}
TRUE_VALUES = {"1", "true", "yes"}

# Names the AI gateway uses for providers registered under a more specific id
ALIASES = {"huggingface": "huggingface_inference", "local": "ollama"}


class ProviderStatus(str, Enum):
    APPROVED = "APPROVED"
    CONDITIONAL = "CONDITIONAL"
    UNVERIFIED = "UNVERIFIED"
    BLOCKED = "BLOCKED"


class DenyReason(str, Enum):
    UNKNOWN_PROVIDER = "unknown_provider"
    BLOCKED = "blocked"
    UNVERIFIED = "unverified"
    NOT_ENABLED = "not_enabled"
    NOT_ATTESTED = "not_attested"
    MISSING_CREDENTIALS = "missing_credentials"
    PERSONAL_DATA = "personal_data_not_allowed"
    QUOTA_EXHAUSTED = "quota_exhausted"


@dataclass(frozen=True)
class Decision:
    provider: str
    allowed: bool
    reason: Optional[DenyReason] = None
    detail: str = ""

    def as_unavailable(self, feature: str) -> Dict[str, Any]:
        """A response a caller can return instead of data: clearly unavailable, never invented."""
        return unavailable_feature(feature, self.provider, self.reason.value if self.reason else "", self.detail)


class ProviderBlockedError(RuntimeError):
    def __init__(self, decision: Decision):
        super().__init__(f"Live call to '{decision.provider}' refused ({decision.reason.value}): {decision.detail}")
        self.decision = decision


class QuotaExhaustedError(ProviderBlockedError):
    """The provider used its self-imposed quota. Callers report it; they do not fall back."""


def unavailable_feature(feature: str, provider: str, reason: str, detail: str = "") -> Dict[str, Any]:
    return {
        "available": False,
        "feature": feature,
        "provider": provider,
        "reason": reason,
        "message": detail or f"{feature} is unavailable: provider '{provider}' is not cleared for live use.",
        "data": None,
    }


def _flag(env: Mapping[str, str], name: str) -> bool:
    return env.get(name, "").strip().lower() in TRUE_VALUES


def load_registry(path: Path = REGISTRY_PATH) -> Dict[str, Any]:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


@dataclass
class _Window:
    seconds: int
    limit: int
    calls: List[float] = field(default_factory=list)

    def used(self, now: float) -> int:
        cutoff = now - self.seconds
        self.calls = [t for t in self.calls if t > cutoff]
        return len(self.calls)


class QuotaLedger:
    """
    Counts live calls per provider against the registry's self-imposed limits, which sit below
    the published free-tier limits. In-process only: after a restart counting starts again,
    so the self-imposed limits must leave room for that.
    """

    WINDOWS = {"per_minute": 60, "per_hour": 3600, "per_day": 86400, "per_month": 30 * 86400}

    def __init__(self, clock=time.time):
        self._clock = clock
        self._windows: Dict[str, List[_Window]] = {}
        self._exhausted_until: Dict[str, float] = {}
        self._lock = threading.Lock()

    def configure(self, provider: str, limits: Mapping[str, int]) -> None:
        with self._lock:
            self._windows[provider] = [
                _Window(self.WINDOWS[name], int(limit)) for name, limit in limits.items() if name in self.WINDOWS
            ]

    def remaining(self, provider: str) -> Optional[int]:
        """Calls left in the tightest window, or None when the provider has no limits configured."""
        with self._lock:
            now = self._clock()
            if self._exhausted_until.get(provider, 0) > now:
                return 0
            windows = self._windows.get(provider)
            if not windows:
                return None
            return min(w.limit - w.used(now) for w in windows)

    def record(self, provider: str) -> None:
        with self._lock:
            now = self._clock()
            for window in self._windows.get(provider, []):
                window.calls.append(now)

    def mark_exhausted(self, provider: str, retry_after_seconds: float = 86400) -> None:
        """Record a provider-reported quota error (e.g. HTTP 429) so no further calls are tried."""
        with self._lock:
            self._exhausted_until[provider] = self._clock() + retry_after_seconds


class CostPolicy:
    def __init__(self, registry: Optional[Dict[str, Any]] = None, env: Optional[Mapping[str, str]] = None,
                 ledger: Optional[QuotaLedger] = None):
        self.registry = registry if registry is not None else load_registry()
        self.providers: Dict[str, Dict[str, Any]] = self.registry["providers"]
        self._env = env
        self.ledger = ledger or QuotaLedger()
        for name, entry in self.providers.items():
            limits = (entry.get("rate_limits") or {}).get("self_imposed")
            if limits:
                self.ledger.configure(name, limits)

    @property
    def env(self) -> Mapping[str, str]:
        return self._env if self._env is not None else os.environ

    def status(self, provider: str) -> ProviderStatus:
        entry = self.providers.get(ALIASES.get(provider, provider))
        return ProviderStatus(entry["status"]) if entry else ProviderStatus.BLOCKED

    def check(self, provider: str, contains_personal_data: bool = False) -> Decision:
        provider = ALIASES.get(provider, provider)
        entry = self.providers.get(provider)
        if entry is None:
            return Decision(provider, False, DenyReason.UNKNOWN_PROVIDER, "Provider is not in the zero-cost registry.")

        status = ProviderStatus(entry["status"])
        if status is ProviderStatus.BLOCKED:
            return Decision(provider, False, DenyReason.BLOCKED, entry.get("billing_risk", "Blocked by policy."))
        if status is ProviderStatus.UNVERIFIED:
            return Decision(provider, False, DenyReason.UNVERIFIED, "Free access has not been verified from official terms.")

        if contains_personal_data and not entry.get("allows_personal_data", False):
            return Decision(provider, False, DenyReason.PERSONAL_DATA, "This provider may not receive personal data.")

        if entry.get("kind") == "external":
            enable_env = entry.get("enable_env")
            if not enable_env or not _flag(self.env, enable_env):
                return Decision(provider, False, DenyReason.NOT_ENABLED,
                                f"External provider is off; the operator must set {enable_env or 'its enable flag'}=true.")
        if status is ProviderStatus.CONDITIONAL:
            missing = [name for name in entry.get("attestation_env", []) if not _flag(self.env, name)]
            if missing:
                return Decision(provider, False, DenyReason.NOT_ATTESTED,
                                f"Operator has not confirmed the free-tier conditions ({', '.join(missing)}).")

        credentials = entry.get("credential_env", [])
        if entry.get("kind") == "external" and credentials and not any(self.env.get(c) for c in credentials):
            return Decision(provider, False, DenyReason.MISSING_CREDENTIALS,
                            f"No credential configured ({' / '.join(credentials)}).")

        if self.ledger.remaining(provider) == 0:
            return Decision(provider, False, DenyReason.QUOTA_EXHAUSTED,
                            "Free quota is used up; no other provider is substituted.")

        return Decision(provider, True)

    def require(self, provider: str, contains_personal_data: bool = False) -> Decision:
        """Clears and counts one live call, or raises. Call immediately before the request."""
        decision = self.check(provider, contains_personal_data)
        provider = decision.provider
        if not decision.allowed:
            if decision.reason is DenyReason.QUOTA_EXHAUSTED:
                raise QuotaExhaustedError(decision)
            raise ProviderBlockedError(decision)
        self.ledger.record(provider)
        return decision

    def mark_exhausted(self, provider: str, retry_after_seconds: float = 86400) -> None:
        """Records a provider-reported quota error under the provider's registry name."""
        self.ledger.mark_exhausted(ALIASES.get(provider, provider), retry_after_seconds)

    def filter_chain(self, providers: Iterable[str], contains_personal_data: bool = False) -> List[str]:
        """The given fallback chain with every refused provider removed. Order is kept; nothing is added."""
        return [p for p in providers if self.check(p, contains_personal_data).allowed]

    def secret_values(self) -> List[str]:
        names = {c for entry in self.providers.values() for c in entry.get("credential_env", [])}
        names.update({"INTERNAL_SERVICE_KEY", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"})
        return [v for v in (self.env.get(n, "") for n in names) if len(v) >= 4]

    def redact(self, text: str) -> str:
        """Removes every configured credential value from text bound for logs or responses."""
        for value in sorted(self.secret_values(), key=len, reverse=True):
            text = text.replace(value, "[REDACTED]")
        return text


def _resolve_tcp(host: str, port: int) -> List[str]:
    return [info[4][0] for info in socket.getaddrinfo(host, port, proto=socket.IPPROTO_TCP)]


def validate_local_model_endpoint(url: str, resolve: Optional[Callable[[str, int], List[str]]] = _resolve_tcp) -> List[str]:
    """
    A 'local' model endpoint must be on this machine; anything else could be a hosted service.

    Loopback is accepted as before. The only other host is the Ollama service of this project's
    Docker Compose stack, and only in its exact form (http, port 11434, an Ollama API path, no
    credentials, query or fragment) and only while every address the name resolves to is a private
    one. The validated addresses are returned so the caller can connect to one of them directly
    instead of resolving the name a second time. `resolve=None` checks the form only (for the
    static environment audit, which may run where the Docker name does not resolve).
    """
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if host in LOOPBACK_HOSTS:
        return []
    if host not in DOCKER_LOCAL_MODEL_HOSTS:
        raise ValueError(
            f"Local model endpoint must be a loopback address or the Docker '{'/'.join(sorted(DOCKER_LOCAL_MODEL_HOSTS))}' service, not '{host or url}'."
        )
    try:
        port = parsed.port
    except ValueError:
        port = None
    if (parsed.scheme != "http" or port != DOCKER_LOCAL_MODEL_PORT or parsed.username or parsed.password
            or parsed.path not in DOCKER_LOCAL_MODEL_PATHS or parsed.params or parsed.query or parsed.fragment):
        raise ValueError(
            f"The Docker local model endpoint must be exactly http://{host}:{DOCKER_LOCAL_MODEL_PORT}"
            f" followed by one of {sorted(DOCKER_LOCAL_MODEL_PATHS)}."
        )
    if resolve is None:
        return []
    try:
        addresses = resolve(host, DOCKER_LOCAL_MODEL_PORT)
    except OSError as exc:
        raise ValueError(f"Docker local model host '{host}' does not resolve here ({exc.__class__.__name__}).") from exc
    if not addresses:
        raise ValueError(f"Docker local model host '{host}' does not resolve here.")
    for address in addresses:
        ip = ipaddress.ip_address(address.split("%", 1)[0])
        if not ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_unspecified or ip.is_multicast:
            raise ValueError(f"Docker local model host '{host}' resolves to a non-private address; refused.")
    return addresses


def validate_ollama_model(name: str) -> None:
    lowered = name.strip().lower()
    if lowered.endswith(":cloud") or lowered.endswith("-cloud"):
        raise ValueError(f"'{name}' is an Ollama cloud model; only locally downloaded models are allowed.")


QUOTA_ERROR_MARKERS = ("429", "RESOURCE_EXHAUSTED", "quota", "rate limit")


def is_quota_error(message: str) -> bool:
    """True when a provider error says a free quota or rate limit was hit."""
    lowered = (message or "").lower()
    return any(marker.lower() in lowered for marker in QUOTA_ERROR_MARKERS)


# The policy every runtime entry point consults. It reads os.environ at each check, so a
# changed environment takes effect without a restart; its quota ledger lives for the process.
runtime_policy = CostPolicy()

from app.cost_policy.log_redaction import install_log_redaction  # noqa: E402

install_log_redaction(runtime_policy)
