"""
AI gateway observability (X11): what the gateway decided and why, with timing, and nothing else.

Privacy by construction: an event holds only the service name, the provider name, an event kind,
a reason or failure *category* code, the attempt number, a latency and whether the service carries
personal data. Prompts, payloads, responses, resume text, error messages and credentials are never
passed in, so they cannot be stored. Both stores are purged after AI_AUDIT_RETENTION_DAYS (default
14, at most 90).

Scope. Without AI_AUDIT_DIR, events live in this process's memory only: they cover one AI-service
process since it started and are lost on restart. With AI_AUDIT_DIR, every process appends to its
own daily file (owner-only permissions) and reads merge all files in the directory, so figures
survive restarts and include every process sharing the directory. Every summary states which.
"""
from __future__ import annotations

import json
import os
import re
import secrets
import threading
import time
from collections import deque
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Deque, Dict, List, Optional

from app.cost_policy import is_quota_error

EVENT_KINDS = {
    "cache_hit",           # served from the response cache, no provider called
    "chain_resolved",      # providers that will be tried, and why the others were skipped
    "no_provider",         # nothing is allowed or available: the feature is unavailable
    "policy_refused",      # the zero-cost policy refused a provider at call time
    "rate_limited",        # the gateway's own rate limit skipped a provider
    "provider_failed",     # a provider call failed (category only)
    "quota_paused",        # a provider reported an exhausted free quota and is paused
    "success",             # a provider answered
    "all_failed",          # every provider in the chain failed
}

FAILURE_CATEGORIES = ("quota", "timeout", "rate_limited", "auth", "network", "invalid_output", "server_error", "other")

MAX_EVENTS = 5000
MAX_FILE_EVENTS = 200_000
DEFAULT_RETENTION_DAYS = 14
MAX_RETENTION_DAYS = 90
_SAFE = re.compile(r"^[a-z0-9_.:-]{1,64}$")
# Daily files, one per process: ai-audit-YYYY-MM-DD-<instance>.jsonl (the older unsuffixed name is still read and purged)
_FILE = re.compile(r"ai-audit-(\d{4}-\d{2}-\d{2})(?:-[0-9a-f]{8})?\.jsonl")


def categorize_failure(message: str) -> str:
    """Maps an error message to a category; the message itself is not kept."""
    text = (message or "").lower()
    if is_quota_error(message or ""):
        return "quota"
    if "timeout" in text or "timed out" in text:
        return "timeout"
    if "rate limit" in text:
        return "rate_limited"
    if any(k in text for k in ("401", "403", "permission", "unauthor", "api key", "credential")):
        return "auth"
    if any(k in text for k in ("connection", "network", "unreachable", "dns", "refused")):
        return "network"
    if any(k in text for k in ("json", "parse", "validation", "schema", "invalid output")):
        return "invalid_output"
    if any(k in text for k in ("500", "502", "503", "504", "server error", "internal error")):
        return "server_error"
    return "other"


def _code(value: Optional[str]) -> Optional[str]:
    """Only short identifier-like codes are stored; anything else is dropped."""
    if value is None:
        return None
    value = str(value).strip().lower()
    return value if _SAFE.match(value) else "unspecified"


@dataclass
class AuditEvent:
    at: float
    kind: str
    service: str
    provider: Optional[str] = None
    reason: Optional[str] = None
    attempt: Optional[int] = None
    latency_ms: Optional[float] = None
    personal_data: bool = True
    skipped: Dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["at"] = datetime.fromtimestamp(self.at, tz=timezone.utc).isoformat()
        return d

    @classmethod
    def from_dict(cls, d: dict) -> Optional["AuditEvent"]:
        """Reads a stored line back; anything malformed or unexpected is skipped, not trusted."""
        try:
            kind = d["kind"]
            if kind not in EVENT_KINDS:
                return None
            skipped = d.get("skipped") or {}
            return cls(
                at=datetime.fromisoformat(d["at"]).timestamp(),
                kind=kind,
                service=_code(d.get("service")) or "unspecified",
                provider=_code(d.get("provider")),
                reason=_code(d.get("reason")),
                attempt=int(d["attempt"]) if d.get("attempt") is not None else None,
                latency_ms=float(d["latency_ms"]) if d.get("latency_ms") is not None else None,
                personal_data=bool(d.get("personal_data", True)),
                skipped={_code(k) or "unspecified": _code(v) or "unspecified" for k, v in skipped.items()} if isinstance(skipped, dict) else {},
            )
        except (KeyError, TypeError, ValueError, AttributeError):
            return None


def _percentile(values: List[float], p: float) -> Optional[float]:
    if not values:
        return None
    ordered = sorted(values)
    k = (len(ordered) - 1) * p
    lo, hi = int(k), min(int(k) + 1, len(ordered) - 1)
    return round(ordered[lo] + (k - lo) * (ordered[hi] - ordered[lo]), 1)


class AuditLog:
    def __init__(self, retention_days: Optional[int] = None, directory: Optional[str] = None, clock=time.time, max_events: int = MAX_EVENTS):
        days = retention_days if retention_days is not None else int(os.getenv("AI_AUDIT_RETENTION_DAYS", DEFAULT_RETENTION_DAYS) or DEFAULT_RETENTION_DAYS)
        self.retention_days = max(1, min(MAX_RETENTION_DAYS, days))
        self.directory = directory if directory is not None else (os.getenv("AI_AUDIT_DIR") or None)
        self._clock = clock
        self._events: Deque[AuditEvent] = deque(maxlen=max_events)
        self._lock = threading.Lock()
        # Names this process's files; random, so it reveals nothing about the host
        self.instance_id = secrets.token_hex(4)
        self.started_at = clock()
        self.write_failures = 0

    # -- recording ------------------------------------------------------------------------------
    def record(self, kind: str, service: str, provider: Optional[str] = None, reason: Optional[str] = None,
               attempt: Optional[int] = None, latency_ms: Optional[float] = None, personal_data: bool = True,
               skipped: Optional[Dict[str, str]] = None) -> None:
        if kind not in EVENT_KINDS:
            raise ValueError(f"unknown audit event kind: {kind}")
        event = AuditEvent(
            at=self._clock(),
            kind=kind,
            service=_code(service) or "unspecified",
            provider=_code(provider),
            reason=_code(reason),
            attempt=attempt,
            latency_ms=round(latency_ms, 1) if latency_ms is not None else None,
            personal_data=bool(personal_data),
            skipped={_code(k) or "unspecified": _code(v) or "unspecified" for k, v in (skipped or {}).items()},
        )
        with self._lock:
            self._events.append(event)
            self._purge_locked()
        if self.directory:
            self._append_file(event)

    def _append_file(self, event: AuditEvent) -> None:
        try:
            os.makedirs(self.directory, mode=0o700, exist_ok=True)
            day = datetime.fromtimestamp(event.at, tz=timezone.utc).strftime("%Y-%m-%d")
            path = os.path.join(self.directory, f"ai-audit-{day}-{self.instance_id}.jsonl")
            # Owner-only and append-only; one file per process, so writers never interleave
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
            with os.fdopen(fd, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(event.to_dict()) + "\n")
            self._purge_files()
        except OSError:
            # Observability must never break a request; the gap is reported in the summary's scope
            self.write_failures += 1

    # -- retention ------------------------------------------------------------------------------
    def _cutoff(self) -> float:
        return self._clock() - self.retention_days * 86400

    def _purge_locked(self) -> None:
        cutoff = self._cutoff()
        while self._events and self._events[0].at < cutoff:
            self._events.popleft()

    def _purge_files(self) -> int:
        if not self.directory or not os.path.isdir(self.directory):
            return 0
        removed = 0
        cutoff_day = datetime.fromtimestamp(self._cutoff(), tz=timezone.utc).strftime("%Y-%m-%d")
        for name in os.listdir(self.directory):
            m = _FILE.fullmatch(name)
            if m and m.group(1) < cutoff_day:
                os.remove(os.path.join(self.directory, name))
                removed += 1
        return removed

    def purge(self) -> int:
        with self._lock:
            before = len(self._events)
            self._purge_locked()
            removed = before - len(self._events)
        return removed + self._purge_files()

    # -- reading --------------------------------------------------------------------------------
    def _read_files(self, since: float) -> List[AuditEvent]:
        """Every process's events in the directory from `since`, oldest first."""
        since = max(since, self._cutoff())
        since_day = datetime.fromtimestamp(since, tz=timezone.utc).strftime("%Y-%m-%d")
        out: List[AuditEvent] = []
        try:
            names = sorted(n for n in os.listdir(self.directory) if (m := _FILE.fullmatch(n)) and m.group(1) >= since_day)
        except OSError:
            return out
        for name in names:
            try:
                with open(os.path.join(self.directory, name), encoding="utf-8") as fh:
                    for line in fh:
                        try:
                            event = AuditEvent.from_dict(json.loads(line))
                        except ValueError:
                            continue
                        if event and event.at >= since:
                            out.append(event)
            except OSError:
                continue
        out.sort(key=lambda e: e.at)
        return out[-MAX_FILE_EVENTS:]

    def _window(self, window_hours: Optional[float]) -> List[AuditEvent]:
        since = self._clock() - window_hours * 3600 if window_hours else 0
        if self.directory:
            return self._read_files(since)
        with self._lock:
            self._purge_locked()
            return [e for e in self._events if e.at >= since]

    def scope(self) -> dict:
        """What the figures cover, so one process's view is never presented as the whole platform's."""
        started = datetime.fromtimestamp(self.started_at, tz=timezone.utc).isoformat()
        if self.directory:
            return {
                "source": "files",
                "coverage": "All AI-service processes that write to the shared audit directory, across restarts, within the retention period.",
                "instanceId": self.instance_id,
                "processStartedAt": started,
                "writeFailures": self.write_failures,
            }
        return {
            "source": "memory",
            "coverage": "This AI-service process only, since it started. Events from other processes and from before the last restart are not included.",
            "instanceId": self.instance_id,
            "processStartedAt": started,
            "writeFailures": 0,
        }

    def events(self, limit: int = 200, window_hours: Optional[float] = None) -> List[dict]:
        items = self._window(window_hours)
        return [e.to_dict() for e in items[-limit:]][::-1]

    def summary(self, window_hours: float = 24) -> dict:
        items = self._window(window_hours)
        providers: Dict[str, dict] = {}
        services: Dict[str, dict] = {}

        def prov(name: str) -> dict:
            return providers.setdefault(name, {"attempts": 0, "successes": 0, "failures": {}, "policyRefusals": {}, "rateLimited": 0, "quotaPauses": 0, "latencies": [], "lastFailureAt": None})

        def serv(name: str) -> dict:
            return services.setdefault(name, {"requests": 0, "successes": 0, "allFailed": 0, "noProvider": 0, "cacheHits": 0, "fallbacks": 0})

        for e in items:
            s = serv(e.service)
            if e.kind in ("chain_resolved", "cache_hit", "no_provider"):
                s["requests"] += 1
            if e.kind == "cache_hit":
                s["cacheHits"] += 1
            elif e.kind == "no_provider":
                s["noProvider"] += 1
            elif e.kind == "all_failed":
                s["allFailed"] += 1
            elif e.kind == "success":
                s["successes"] += 1
                if (e.attempt or 1) > 1:
                    s["fallbacks"] += 1
                p = prov(e.provider or "unknown")
                p["attempts"] += 1
                p["successes"] += 1
                if e.latency_ms is not None:
                    p["latencies"].append(e.latency_ms)
            elif e.kind == "provider_failed":
                p = prov(e.provider or "unknown")
                p["attempts"] += 1
                p["failures"][e.reason or "other"] = p["failures"].get(e.reason or "other", 0) + 1
                p["lastFailureAt"] = datetime.fromtimestamp(e.at, tz=timezone.utc).isoformat()
            elif e.kind == "policy_refused":
                p = prov(e.provider or "unknown")
                p["policyRefusals"][e.reason or "unspecified"] = p["policyRefusals"].get(e.reason or "unspecified", 0) + 1
            elif e.kind == "rate_limited":
                prov(e.provider or "unknown")["rateLimited"] += 1
            elif e.kind == "quota_paused":
                prov(e.provider or "unknown")["quotaPauses"] += 1

        for p in providers.values():
            lat = p.pop("latencies")
            p["latencyMs"] = {"p50": _percentile(lat, 0.5), "p95": _percentile(lat, 0.95), "samples": len(lat)}
            failed = sum(p["failures"].values())
            p["failureRate"] = round(failed / p["attempts"], 3) if p["attempts"] else None
        return {
            "windowHours": window_hours,
            "events": len(items),
            "providers": providers,
            "services": services,
            "retentionDays": self.retention_days,
            "persisted": bool(self.directory),
            "scope": self.scope(),
        }


audit_log = AuditLog()
