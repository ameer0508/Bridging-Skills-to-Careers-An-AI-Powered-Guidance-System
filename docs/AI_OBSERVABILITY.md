# AI observability (X11)

The AI gateway (`ai/app/gateway/ai_gateway.py`) records each routing decision, with the reason and timing, in an audit log (`ai/app/observability/audit.py`). Administrators can read it in the app.

## What is recorded

One event per decision. Every event has the same fields: time, kind, service (the AI feature, e.g. `chat_architect`), provider, reason code, attempt number, latency in milliseconds, whether the service handles personal data, and, for chain events, the reason code for each provider that was skipped.

| Event | When |
|---|---|
| `cache_hit` | Answered from the response cache; no provider was called |
| `chain_resolved` | The providers that will be tried. `skipped` gives the reason each other provider was left out: the zero-cost policy's reason (`blocked`, `unverified`, `missing_credentials`, `not_enabled`, `quota_exhausted`, …), `unavailable`, or `not_configured_in_chain` |
| `no_provider` | No provider is allowed and available, so the feature is unavailable; includes `skipped` |
| `policy_refused` | The zero-cost policy refused a provider at call time, e.g. after its free quota ran out |
| `rate_limited` | The gateway's own rate limit skipped a provider |
| `provider_failed` | A call failed. The reason is a category only: `quota`, `timeout`, `rate_limited`, `auth`, `network`, `invalid_output`, `server_error`, `other` |
| `quota_paused` | A provider reported an exhausted free quota and is paused until it resets |
| `success` | A provider answered; attempt > 1 means a fallback was used |
| `all_failed` | Every provider in the chain failed |

## Privacy

- **The gateway never stores** prompts, payloads, responses, resume text, error messages, API keys or user identifiers. Error messages are mapped to a category and then discarded, because a provider error can repeat request content.
- **Stored values are codes only.** `AuditLog.record` keeps a value only if it matches `^[a-z0-9_.:-]{1,64}$`; anything else becomes `unspecified`. Unknown event kinds are rejected, so a future caller cannot slip free text in.
- **Tests:**
  - `test_fallback_and_failure_categories_without_messages` sends a resume (name, email, phone) and a key through a failing provider, then checks that none of them appear in the events or the summary.
  - `test_no_provider_is_recorded_with_reasons` checks that a paid key stays out of the log.
  - `test_only_codes_are_stored` checks the code-only rule directly.

## Retention

- **Duration:** events are kept for `AI_AUDIT_RETENTION_DAYS` (default 14; values are clamped to 1–90).
- **Storage:** by default events are kept in memory only, capped at 5,000, and are lost when the AI service restarts. If `AI_AUDIT_DIR` is set, they are also written to daily `ai-audit-YYYY-MM-DD.jsonl` files in that directory.
- **Purging:** expired events are removed from memory on every write and read. Daily files older than the retention period are deleted on every write.
- **Test:** `test_statistics_and_retention` covers retention in memory and in files.

## Statistics

`GET /summary` gives these figures for a time window:

- **Per provider:** attempts, successes, failures by category, policy refusals by reason, rate-limit skips, quota pauses, failure rate, last failure time, and latency p50/p95 with the sample count.
- **Per service:** requests, answers, answers after fallback, cache hits, all-failed and no-provider counts.

Latency covers the provider call including retries. Percentiles use linear interpolation. The page shows the sample count because a percentile from a few samples is not representative.

## Confidence indicators

A successful response now includes `metadata.observability = { provider, attempt, fallbackUsed, testProvider }`. Callers can use it to say which provider answered, whether a fallback was used, and whether the answer came from the offline test provider (`mock`).

SkillBridge does not show a model confidence score. The approved providers do not report calibrated probabilities, so any number would be invented.

The older `ai/app/ai_operations` module reports fixed values: 150 tokens, 0.95 confidence, and an always-healthy status. It is not used for observability, and those numbers should not be taken as measurements.

## Zero-cost guarantee

Observability reads the gateway's existing decisions and adds no infrastructure. There is no external telemetry service and no paid storage; the log lives in memory or in local files.

Tests showing that paid providers cannot bypass the policy:

- `test_no_provider_is_recorded_with_reasons`: OpenAI configured as both primary and fallback, with a key present, is still not in the chain, and the event records why.
- `test_quota_rate_limit_policy_refusal_and_all_failed`: a provider whose free quota is exhausted is refused even when it is put directly into the chain.
- The existing `test_runtime_cost_enforcement.py` and the backend `zero_cost_runtime.test.ts` still pass.

## Access

AI service endpoints (internal only; they need the service key):

- `GET /api/v1/observability/summary?window_hours` (1–2160)
- `GET /api/v1/observability/events?limit&window_hours` (limit 1–500)
- `GET /api/v1/observability/providers`: each provider's policy status for personal and non-personal data, with the remaining free quota

Backend, administrators only:

- `GET /api/v1/ai-observability/{summary,events,providers}`, with `windowHours` and `limit` as whole numbers. Unknown parameters are rejected with 400.
- The administrator role is read from the database on every request, so demoting someone takes effect immediately.
- If the AI service is unreachable, the endpoints return 503 `AI_UNAVAILABLE`.

Frontend: `/ai-observability`. The sidebar entry appears for administrators only, and the server enforces access whatever the client shows.

## Tests

- `ai/tests/test_observability.py`: 7 tests covering success and skip reasons, fallback with failure categories and no content, quota pause, policy refusal, rate limit and all-failed, no provider, statistics and retention, the code-only rule, and the endpoints being internal.
- `backend/src/tests/ai_observability.test.ts`: admin-only access (401 and 403), forwarding, 7 invalid queries rejected, demotion, and 503.
- `e2e/tests/aiObservability.mjs`: 6 steps covering user refusal, no sidebar entry for a user, the admin view of policy, statistics and events, window changes, the phone layout, and no console errors. The browser run uses the fake AI service; the real log is covered by the AI tests.

## Limitations

- The log is per process. With several AI-service workers, each worker keeps and reports its own events. `AI_AUDIT_DIR` keeps a durable on-disk record of all of them, but the endpoints read only the answering worker's memory.
- Failure categories come from matching keywords in the error message, so an unusual message can be counted as `other`.
- Only calls routed through the gateway are recorded. Rule-based local modules, such as multilingual extraction and rule-based interview scoring, call no provider and are not recorded.
