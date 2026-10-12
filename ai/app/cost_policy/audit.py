"""
Environment audit against the zero-cost policy. Reports variable names only, never values.

    python -m app.cost_policy.audit [path/to/.env]    exit code 1 when a violation is found

Values from the given .env file (default: ./.env when present) are checked together with the
process environment, which takes precedence, as it does for the service itself.
"""
import os
import sys
from dataclasses import dataclass
from typing import List, Mapping, Optional

from app.cost_policy.policy import (
    CostPolicy,
    ProviderStatus,
    validate_local_model_endpoint,
    validate_ollama_model,
)


@dataclass(frozen=True)
class Finding:
    severity: str  # "violation" or "warning"
    provider: str
    message: str


def audit_environment(env: Optional[Mapping[str, str]] = None) -> List[Finding]:
    env = os.environ if env is None else env
    policy = CostPolicy(env=env)
    findings: List[Finding] = []

    for name, entry in policy.providers.items():
        status = ProviderStatus(entry["status"])
        configured = [c for c in entry.get("credential_env", []) if env.get(c)]
        if configured and status in (ProviderStatus.BLOCKED, ProviderStatus.UNVERIFIED):
            findings.append(Finding(
                "violation", name,
                f"{', '.join(configured)} is set but '{name}' is {status.value}; the app may call it. Remove the value.",
            ))

    if env.get("ENABLE_LOCAL_MODEL", "").lower() == "true":
        try:
            validate_local_model_endpoint(env.get("LOCAL_MODEL_ENDPOINT", "http://localhost:11434/api/generate"))
        except ValueError as exc:
            findings.append(Finding("violation", "ollama", str(exc)))
    for var in ("LOCAL_MODEL_NAME", "OLLAMA_MODEL"):
        if env.get(var):
            try:
                validate_ollama_model(env[var])
            except ValueError as exc:
                findings.append(Finding("violation", "ollama", str(exc)))

    if env.get("GEMINI_FALLBACK_MODELS"):
        findings.append(Finding(
            "warning", "gemini",
            "GEMINI_FALLBACK_MODELS is set; each listed model must also be free-tier eligible.",
        ))
    if env.get("GEMINI_API_KEY") and not policy.check("gemini").allowed:
        findings.append(Finding(
            "warning", "gemini",
            "GEMINI_API_KEY is set but Gemini is not cleared (enable flag or no-billing attestation missing).",
        ))
    return findings


def _environment_with_dotenv(path: str) -> Mapping[str, str]:
    merged: dict = {}
    if os.path.exists(path):
        from dotenv import dotenv_values

        merged.update({k: v for k, v in dotenv_values(path).items() if v is not None})
    merged.update(os.environ)
    return merged


def main() -> int:
    findings = audit_environment(_environment_with_dotenv(sys.argv[1] if len(sys.argv) > 1 else ".env"))
    for f in findings:
        print(f"[{f.severity.upper()}] {f.provider}: {f.message}")
    if not findings:
        print("Zero-cost audit: no findings.")
    return 1 if any(f.severity == "violation" for f in findings) else 0


if __name__ == "__main__":
    sys.exit(main())
