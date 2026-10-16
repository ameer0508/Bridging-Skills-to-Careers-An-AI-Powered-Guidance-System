# Zero-cost API policy (₹0)

**Status:** in force from 2026-10-12. **Owner:** project owner. **Machine-readable source of truth:**
[`ai/app/cost_policy/provider_registry.json`](../ai/app/cost_policy/provider_registry.json).

SkillBridge must cost **₹0 in application API and infrastructure charges** while it is being developed and operated. A Claude Code
or Claude Pro subscription is separate. It does **not** pay for any API the application calls.

## 1. Rules

1. **No paid endpoints.** Nothing paid per request or per token, and no subscription-only integrations.
2. **No billing exposure.** Nothing that needs a credit card or a linked billing account. No trial credits that convert to billing, and no automatic overage charges.
3. **No paid infrastructure.** Everything runs locally or in Docker Compose on the developer's own machine.
4. **Unverified means blocked.** A provider is usable only after its current official terms have been read and the date recorded here. If verification cannot be completed, the provider is `UNVERIFIED`, and `UNVERIFIED` is treated exactly like `BLOCKED`.
5. **External providers are off by default.** Even an `APPROVED` external provider stays off until the operator sets its `SKILLBRIDGE_ENABLE_<PROVIDER>=true` flag.
6. **Fail closed, never substitute.** If a provider is refused, unavailable or out of quota, the feature reports that it is unavailable. Nothing ever falls back to a paid provider, and no output is fabricated in its place. Falling back to a *free local* provider (for example Ollama) is allowed.
7. **No personal data to free tiers that forbid it.** Resume text, contact details and interview answers go only to providers whose `allows_personal_data` is `true`, which in practice means local ones.
8. **Secrets never appear in logs or responses.** Use `CostPolicy.redact` / `redactSecrets`.
9. **Tests never reach the network.** Tests run with provider keys blank. The network tripwire turns any non-loopback connection into an error.

We cannot see any billing account, so this project does **not** claim that charges were "verified ₹0". The claim is narrower: **no paid service was activated and no live external API call was initiated** while this policy was written and tested.

## 2. Status meanings

| Status | Live calls | Needs |
|---|---|---|
| `APPROVED` | Yes, when enabled | Local: nothing. External: its enable flag. |
| `CONDITIONAL` | Only when every condition holds | Enable flag, every attestation flag, and a credential if one is listed |
| `UNVERIFIED` | **Never** | Official terms showing free access with no billing exposure, then a registry update |
| `BLOCKED` | **Never** | A deliberate policy change by the project owner |
| *(not listed)* | **Never** | A registry entry |

## 3. Provider inventory

All entries were verified on **2026-10-12** from the sources listed. "Code" shows where the project uses each provider today.

### 3.1 Local and offline: approved, ₹0, no network at runtime

| Provider | Code today | Licence | Notes and conditions |
|---|---|---|---|
| Development mock provider | `ai/app/providers/mock_adapter.py` | — | Dev/test only. Never answers chat, interview questions or interview scoring. |
| **Ollama** (local models) | `ai/app/providers/local_adapter.py` (`ENABLE_LOCAL_MODEL`) | MIT ([github.com/ollama/ollama](https://github.com/ollama/ollama)) | The endpoint must be loopback, or exactly `http://ollama:11434/api/generate`: the Compose `ollama` service on the internal-only `skillbridge-ai-local` network (no published port, no internet route, `OLLAMA_NO_CLOUD=1`), accepted only while every address it resolves to is private. The adapter connects to the validated address, follows no redirects and ignores proxy variables. It reports itself available only once the configured model is downloaded (`/api/tags`). Section 9 has the setup. **Ollama cloud models** (`gemma4:cloud`, `*-cloud`, or the ollama.com API) need an account and are not free ([docs.ollama.com/cloud](https://docs.ollama.com/cloud)), so they are rejected. |
| **Sentence Transformers** | `ai/app/resume_intelligence/transformer_parser.py` (optional; package not installed) | Apache-2.0 | Weights download once from the public Hugging Face Hub. After that, run with `HF_HUB_OFFLINE=1`. |
| **spaCy** | same, `TRANSFORMER_PROVIDER=spacy` (not installed) | MIT | — |
| **Tesseract OCR** | not used yet | Apache-2.0 | Candidate for scanned resumes. |
| **Whisper** (open-source, local) | not used yet | MIT ([github.com/openai/whisper](https://github.com/openai/whisper)) | Code and weights are MIT. The hosted OpenAI transcription API is a different service and is **blocked**. |
| **PyMuPDF** | `ai/requirements.txt` | **AGPL** or commercial ([about](https://pymupdf.readthedocs.io/en/latest/about.html)) | Costs ₹0. A *hosted* deployment must meet AGPL source obligations, or switch to `pdfplumber` (MIT), which is already installed. |
| pdfplumber, python-docx | resume extraction | MIT | — |

### 3.2 Browser

| Provider | Status | Notes |
|---|---|---|
| **Web Speech API** | CONDITIONAL | Free to SkillBridge. MDN: *"By default … your audio is sent to a web service for recognition processing."* Use `processLocally = true` where the browser supports it. Use server recognition only after explicit voice consent, and always offer a typed answer as the fallback. ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)) |

### 3.3 External: conditional or approved (off until enabled)

| Provider | Status | Verified terms | Billing risk | Conditions before live use |
|---|---|---|---|---|
| **Google Gemini Developer API** | CONDITIONAL | The free plan exists and offers "Free input & output tokens" on Flash / Flash-Lite models, including the configured `gemini-3.6-flash` and `gemini-2.5-flash` ([pricing](https://ai.google.dev/gemini-api/docs/pricing), updated 2026-10-09). Limits are per model and shown only in AI Studio. Exceeding them returns `429 RESOURCE_EXHAUSTED` ([rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)). | **A key from a project with billing linked is on the paid tier and is billed per token.** The app cannot tell which tier a key belongs to. Tier 1 starts as soon as billing is linked. | `SKILLBRIDGE_ENABLE_GEMINI=true` and `SKILLBRIDGE_GEMINI_NO_BILLING_ATTESTED=true` (key from an AI Studio project with no billing account). **Unpaid Services terms: "Do not submit sensitive, confidential, or personal information"**, so no resume text. Users must be 18+. Not for users in the EEA, UK or Switzerland. Prompts may be human-reviewed and used to improve Google products ([terms](https://ai.google.dev/gemini-api/terms)). Self-imposed cap: 10/min, 200/day. |
| **GitHub REST API**, unauthenticated | APPROVED | 60 requests per hour per IP. Over the limit returns 403/429 ([rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)). | None: no account or token means no billing relationship. | `SKILLBRIDGE_ENABLE_GITHUB_REST_PUBLIC=true`. Cache responses and send no token. Self-imposed cap: 5/min, 1,000/day. **Note:** `github_intelligence/github_client.py` currently returns *invented* profile data and must not be shown as real (see §7). |
| **Arbeitnow** job API | CONDITIONAL | "Free Job Search API … requires no API key" ([blog](https://www.arbeitnow.com/blog/job-board-api)). Rate limits are not published. | None (no key) | Enable flag. Cache results. Label each listing with its source and fetch date. Self-imposed cap: 2/min, 100/day. |
| **OnJob.io jobs feed** (`onjob_feed`, added 2026-10-13) | CONDITIONAL | "OnJob.io's live listings are free to crawl, ingest and republish … no API key, no rate limit, no fee"; "link each role back to its OnJob.io url to apply" ([for job boards](https://onjob.io/for-job-boards/)). The general [terms](https://onjob.io/terms/) forbid other automated access without written permission. | None (no key) | `SKILLBRIDGE_ENABLE_ONJOB=true` and the attestation `SKILLBRIDGE_ONJOB_FEED_TERMS_ACCEPTED=true`. Republishing live listings only: memory cache of at most 24 hours, nothing stored, counted or mined (docs/MARKET_DATA_SOURCES.md). Self-imposed: refresh every 6 h, at most 8 fetches a day, 25 MiB per page, 20 s timeout. |
| **Remote OK** API | CONDITIONAL | Terms: link back with a followed link and name Remote OK as the source, *"If you do not we'll have to suspend API access"*. Logo use is not allowed ([remoteok.com/api](https://remoteok.com/api)). | None (no key) | Enable flag, attribution link, no logo. Self-imposed cap: 2/min, 100/day. |

### 3.4 Unverified: blocked until verified

| Provider | Code today | Why it is unverified |
|---|---|---|
| **JSearch** (RapidAPI / OpenWeb Ninja) | `backend/src/services/opportunities/JSearchProvider.ts` (`RAPIDAPI_KEY`, `JSEARCH_API_KEY`), `ai/app/job_intelligence/providers.py` | The official pricing page did not render, so I could not confirm whether the free plan is hard-limited without a card on file. Paid marketplace plans charge per request over quota. |
| **USAJOBS** | `ai/app/job_intelligence/providers.py` (`USAJOBS_API_KEY`) | The rate-limit and terms pages returned errors. It is also US federal jobs only. |
| **YouTube Data API v3** | not used | Quota is verified (10,000 units/day; `search.list` 100/day), but the official pages read do not say whether usage is free. |
| **Coursera API** | `ai/app/external_gateway/auth_manager.py` (`COURSERA_API_KEY`) | No public developer terms found. |
| Other learning-provider APIs (Udemy, edX, …) | not used | Each needs its own entry. Use the curated links in `backend/src/seed/learningResources.ts` instead. |
| Public job-market, salary and exam-syllabus datasets | not used | Each dataset needs its own entry with licence, source URL, publication date and retrieval date. |

### 3.5 Blocked

| Provider | Code today | Reason |
|---|---|---|
| **OpenAI API** | `ai/app/providers/openai_adapter.py`, gateway fallback chain | Billed per token from prepaid credits. |
| **Hugging Face Inference Providers / hf-inference** | `ai/app/providers/huggingface_adapter.py` | Free users get **no** monthly credits. Use needs a "credits purchase", and past included credits *"you get charged for every inference request"* ([pricing](https://huggingface.co/docs/inference-providers/pricing)). The adapter targets the legacy `api-inference.huggingface.co` "Inference API (serverless)", which Hugging Face says is now the billed `hf-inference` provider. |
| **Adzuna** | `ai/app/job_intelligence/providers.py`, `auth_manager.py` | Terms limit commercial use to a "14 day trial period", after which "a licence agreement may be required". Aggregate statistics (counts, average salaries) need written consent. Limits: 25/min, 250/day, 1,000/week, 2,500/month ([terms](https://developer.adzuna.com/docs/terms_of_service)). The owner could reclassify it as CONDITIONAL for personal or academic research with attribution. |
| **Ollama cloud models** | — | Need an ollama.com account and key. Plan prices are not published on the docs page. |
| **Google Vertex AI** | reachable through `ai/app/services/gemini.py` | Billed to a Google Cloud account. `genai.Client()` with no key can select Vertex from `GOOGLE_GENAI_USE_VERTEXAI` / `GOOGLE_CLOUD_PROJECT`. |

Other outbound references: Google Fonts (`fonts.googleapis.com`) appears only in a CSP allow-list. It is free and keyless and is loaded by the browser, not by the app.

## 4. Quota and rate-limit strategy

- **Self-imposed caps** (`rate_limits.self_imposed` in the registry) sit well below the published free limits. `QuotaLedger` counts calls per minute, hour, day and month, and refuses the next call with `quota_exhausted` once a cap is reached.
- **Provider-reported exhaustion** (HTTP 429 / `RESOURCE_EXHAUSTED`) is recorded with `ledger.mark_exhausted(provider, retry_after)`. No retry is attempted until it resets.
- **No paid fallback.** `CostPolicy.filter_chain` removes every refused provider from a fallback chain. It keeps the original order and never adds anything.
- **Caching.** Permitted public responses (GitHub public data, open job feeds) must be cached with their source and fetch time. The AI gateway already caches AI responses for one hour (`ai/app/utils/caching_layer.py`).
- **Limit:** the ledger is in-process memory, so a restart resets it. The caps leave headroom for this. Persist the ledger before any provider is enabled in a long-running deployment.

## 5. Guardrails implemented

| Guardrail | Where | Behaviour |
|---|---|---|
| Provider registry | `ai/app/cost_policy/provider_registry.json` | Status, verification source and date, credentials, enable flags, attestations, caps and privacy for every provider. |
| `CostPolicy.check` / `require` | `ai/app/cost_policy/policy.py` | Fails closed with one of: `unknown_provider`, `blocked`, `unverified`, `not_enabled`, `not_attested`, `missing_credentials`, `personal_data_not_allowed`, `quota_exhausted`. `require` raises `ProviderBlockedError` / `QuotaExhaustedError` and counts the call. |
| Unavailable-feature response | `Decision.as_unavailable(feature)` | `{available: false, reason, message, data: null}`: a clear indicator, never invented data. |
| Local-model checks | `validate_local_model_endpoint`, `validate_ollama_model` | Loopback endpoints, or the exact Docker `ollama` endpoint resolving only to private addresses. Cloud model names are rejected. |
| Secret redaction | `CostPolicy.redact` (Python), `redactSecrets` (TypeScript) | Removes every configured credential value from text. |
| Network tripwire | `ai/app/cost_policy/network_guard.py` | Within `block_external_network()`, any non-loopback connect or DNS lookup raises and is recorded. |
| Environment audit | `python -m app.cost_policy.audit [.env]` (run from `ai/`) | Prints variable names only. Exits 1 when a key is set for a blocked or unverified provider, or a local model points at a remote or cloud endpoint. |
| Backend guard | `backend/src/config/costPolicy.ts` | `checkLiveCall`, `guardedFetch` (refuses before `fetch` is called) and `redactSecrets`. A test keeps it in step with the registry. |

### Tests

- `ai/tests/test_zero_cost_policy.py`, 31 tests:
  - registry completeness;
  - blocked and unverified providers refused even with keys;
  - off-by-default;
  - Gemini flags, attestation and credential;
  - personal-data refusal;
  - quota exhaustion with no paid fallback;
  - the gateway fallback chain stripped of OpenAI and Hugging Face;
  - a keyed OpenAI adapter stopped by the tripwire;
  - existing chat and extract endpoints making no live call;
  - redaction;
  - the audit.

  Run them with `cd ai && pytest tests/test_zero_cost_policy.py`.
- `backend/src/tests/cost_policy.test.ts`: registry consistency, unverified JSearch refused with a key, unknown providers refused, `guardedFetch` never calling `fetch`, missing flag or credential, redaction. Run it with `cd backend && npx tsx src/tests/cost_policy.test.ts`.

## 6. Hardware and storage for local alternatives

| Component | Disk | Memory | Source |
|---|---|---|---|
| Whisper tiny / base | ~75–145 MB | ~1 GB VRAM (runs on CPU, slower) | Whisper README (verified) |
| Whisper small | ~460 MB | ~2 GB VRAM | Whisper README (verified) |
| Whisper medium / turbo | ~1.5 GB | ~5–6 GB VRAM | Whisper README (verified) |
| Sentence Transformers `all-MiniLM-L6-v2` | ~90 MB | < 1 GB RAM, CPU is fine | model card (approximate) |
| spaCy `en_core_web_sm` | ~15 MB | < 1 GB RAM | approximate |
| Tesseract + one language pack | ~30–50 MB | small | approximate |
| Ollama 7–8B model, 4-bit | ~4–5 GB | ~8 GB RAM | approximate; not stated on the current README |
| Ollama `qwen3:4b-instruct-2507-q4_K_M` (in use) | 2.50 GB | 4.75 GiB in the container at an 8192-token context, CPU only | measured 2026-10-15 |

The development machine has about 222 GB free on E:, where the repository lives. No model was downloaded while writing this policy. Check free RAM before pulling any model larger than 1 GB.

## 7. Runtime enforcement (applied 2026-10-12)

Every known outbound entry point is guarded by the policy itself, not only by the policy's unit tests:

| Entry point | Guard |
|---|---|
| AI gateway chain (`ai/app/gateway/ai_gateway.py`) | `get_provider_chain` includes only providers that `runtime_policy` clears for the request's data class. A paid key never puts a provider in the chain. |
| AI gateway call (`route_request`) | `runtime_policy.require` runs immediately before *each* provider call, so a provider injected into the chain is still refused. This step also counts the free quota. |
| Quota errors | A `429` / `RESOURCE_EXHAUSTED` response pauses that provider for an hour. Paid providers are never in the chain, so nothing paid can follow. |
| Personal data | Every service except `skill_normalization` is treated as personal, unknown services included. Personal services reach only providers with `allows_personal_data` (local ones). |
| OpenAI / Hugging Face adapters | `is_available()` is false and the HTTP call raises before `urlopen`, even with a key and even when called directly. |
| Gemini adapter | Checked on every call (`_get_client`), even when a client object already exists. `is_available()` needs the enable flag, the attestation and a key. |
| Local adapter | Loopback or the exact Docker `ollama` endpoint (private addresses only, pinned per request, no redirects, no proxies), no `:cloud` / `-cloud` models, no `OLLAMA_API_KEY`, model downloaded. Checked in `is_available()` and again before each request. Structured output that does not validate against its schema, or is cut off, is a failure. |
| Response cache | A cached answer is served only while the provider that produced it is still cleared for the request's data class. Chat replies are never cached. |
| Career agent (`google.antigravity`) | Previously called `gemini-2.5-pro` directly whenever a key was set. Now it runs the deterministic pipeline unless the policy clears Gemini for personal data, which it never does on the free tier. |
| `ai/app/services/gemini.py` | Removed. It was unused and created `genai.Client()` with no key, which can select billed Vertex AI. |
| `auth_manager.py` | Placeholder credentials removed; unset keys are `None`. |
| Health report | Shows each provider's `cost_policy` status (`allowed`, `blocked`, `not_enabled`, …). Never shows key values. |
| Logs | A process-wide log-record factory removes configured key values from every log record. |
| JSearch (`backend/.../JSearchProvider.ts`) | A key only changes the health status to `BLOCKED_BY_POLICY`, never `UP`. Search returns the labelled demo listings. The live branch is reachable only through `guardedFetch`. |
| Tests | Every AI test runs inside a session-wide network tripwire that fails the run on any live connection attempt. |

**Consequence:** with only a free Gemini key, chat and the personal structured services (career matching, readiness, recommendations, roadmap, resume intelligence) use the local model if one is enabled, and otherwise report themselves unavailable with their existing labelled fallbacks. Interview questions and interview scoring need a provider that implements them, which the local adapter does not, so they stay unavailable. The deterministic features are unchanged.

**Remaining known gaps:**
- Model weight downloads by `sentence-transformers` / `transformers` if those optional packages are installed. They are not installed today. Set `HF_HUB_OFFLINE=1` before installing them.
- The browser's Web Speech API, once voice features exist (D1/D2).
- The quota ledger is in memory only, so it resets on restart.

### Still for coordination

- `github_intelligence/github_client.py` and `job_intelligence/providers.py` `MockJobProvider` return invented data. They make no network calls, but must be labelled or removed before features rely on them.
- Add a CI step that runs `python -m app.cost_policy.audit`.

## 8. Before any provider goes live

1. The official terms are re-read, and the registry entry's `sources` and `verified_on` are updated.
2. The status is `APPROVED` or `CONDITIONAL`, and every listed condition is met and attested by the operator.
3. No billing account is linked to the credential's project. The provider's own usage page is checked after the first day.
4. Caching, self-imposed caps and attribution are in place, and the feature shows an unavailable state when refused.
5. `python -m app.cost_policy.audit` passes.

## 9. Local model in Docker (added 2026-10-15)

| Item | Value |
|---|---|
| Image | `ollama/ollama:0.35.1@sha256:292ee7945dfc3d5840a181f3ab86fedb1e66703e02c8af98b50f4da56b7e278c` (Docker Hub digest checked) |
| Model | `qwen3:4b-instruct-2507-q4_K_M`, Apache-2.0, 2.50 GB, model blob `sha256:85e4a5b7b8ef…` matching the registry manifest |
| Download (once) | `docker compose --profile setup run --rm ollama-pull`: the only service with internet access, model name fixed in the file |
| Network | `ollama` is only on `skillbridge-ai-local` (`internal: true`), shared with `ai-service`. Not published to the host. The backend, frontend and MongoDB cannot resolve it. |
| Switch | `ENABLE_LOCAL_MODEL=true` and `LOCAL_MODEL_NAME` in `.env`. Off by default. |
| Measured on CPU (16 vCPU) | Prompt ~100 tokens/s; generation 8.5–15 tokens/s; first load 17 s; chat 27–42 s end to end; career match 8 s; resume intelligence 41 s |
| Timeout chain | `LOCAL_MODEL_TIMEOUT_SECONDS` 120 s < backend `CHAT_AI_TIMEOUT_MS` 130 s < nginx `proxy_read_timeout` 150 s < browser 160 s |
| Limits | `LOCAL_MODEL_NUM_CTX` 8192 (a prompt that does not fit is a failure, not silently truncated), `LOCAL_MODEL_MAX_TOKENS` 384 for chat (a reply that hits it is flagged `truncated`), `LOCAL_MODEL_STRUCTURED_MAX_TOKENS` 768 |
| Runs as | uid 10002, with the model volume mounted read-only (it can serve the model but not change it). `ollama-init` creates the empty model directories on a fresh volume as root, without network and without changing ownership; `ollama-pull` stays root and is the only writer |
| Memory | Model, KV cache and buffers about 3.7 GiB in the 6 GiB container. llama.cpp's prompt cache defaulted to 8192 MiB, more than the cap: four concurrent synthetic chats took the container to 5.83 GiB. `LLAMA_ARG_CACHE_RAM=1024` bounds it; the same load then peaked at 4.79 GiB |
| Capacity | Ollama answers one request at a time, about 37 s per typical chat (1,323 prompt tokens, 384 reply tokens). `LOCAL_MODEL_MAX_PENDING` 2 (one running, one waiting, worst about 75 s): beyond it a request is refused at once as busy (`AI_BUSY`, labelled fallback) instead of waiting to time out. Measured with four at once: before, three answered in 39, 77 and 115 s and the rest timed out at 120 s; after, two answered in 37 and 73 s and two were refused in 0.1 s. The backend also allows one chat reply in progress per user (409 otherwise) |
| Context | The backend's chat prompt is capped at `CHAT_PROMPT_MAX_CHARS` 22,000 (8192 tokens less the 384-token reply and a margin, at 3 characters per token; measured 3.12). Only the oldest history is left out; the instructions, the user's own context and the latest message always stay, and the reply records how many messages were left out |
| Preloading | Not used. A cold start cost 5.5 s over a warm one with the model file in the disk cache and up to about 35 s without, on the first request after a restart or 30 minutes idle only. Keeping the model loaded permanently would hold 3.7–4.7 GiB on a host with 2.8 GiB free, which that does not justify |
