# SkillBridge project handbook

The one-document overview for examiners and the project owner. Details live in the linked documents.

**Status (2026-10-14):**
- The original A–J release scores **100/100** (`FINALIZATION_CHECKLIST.md`).
- The next-generation expansion scores **81/100 verified**, with 19 points open (`NEXTGEN_CHECKLIST.md`).
- SkillBridge runs locally and in Docker and is covered by automated tests. It has **not** been deployed to a server, load-tested or used by real students, and it is not claimed to be production-ready.

## 1. Feature inventory

### Original release (A–J, 100/100)

| Area | What a student can do |
|---|---|
| Account | Register, sign in with rotating refresh tokens, sign out; three-step onboarding (domain and target role) |
| Resume | Upload PDF or DOCX (5 MB); replace, download, reprocess, delete; see which skills changed |
| Skills | Recognised from a lexicon of **148 skills**, scored by evidence (applied in a role or project beats merely listed) |
| Career matches | **20 careers, 239 weighted requirements**; each score has a per-requirement explanation |
| Readiness | 0–100 per career with tier and dimensions; describes evidence, not hiring chances |
| Recommendations and roadmap | One recommendation per gap; phased roadmap with saved progress |
| Jobs | Search with filters; save, status, notes, reminders, history |
| Interviews | Mock interviews from role, skills, gaps and resume; rubric scoring; reports and history |
| Assistant | Chat grounded in the user's stored data, with labelled fallbacks |

### Expansion (81/100 verified)

| ID | Feature | Status |
|---|---|---|
| A1–A5 | Career Lab: compare careers (with OnJob.io live listings when enabled), what-if, skill freshness, staged transition plans, counterfactuals | Done (15) |
| B1–B6 | Free official resources, project suggestions, skill checks, paced roadmaps, evidence-backed portfolio with share link, streaks and opt-in reminders | Done (15) |
| C1–C5 | Market history, forecasts, salaries, skill trends, market-aware recommendations: **built and tested, but unavailable on real data** (no licensed source; see §6) | Pending (12) |
| C6 | Application outcome analytics with denominators | Done (3) |
| D1, D2 | Voice recording and dictation, consent-gated: everything passes in Edge (owner) and Firefox; Chrome's human-only steps not done | Pending (5) |
| D3–D6 | Follow-up questions, technical assessments (no code execution), role rubrics, history comparison | Done (10) |
| E1–E5 | Six O*NET-informed careers (US data, labelled), GATE CS and SSC CGL practice, domain assessments, multilingual resume check (English, Hindi, Spanish) | Done (10) |
| X1–X12 | Local OCR for scanned resumes, dated skill evidence, explanations, calibrated readiness, measurable recommendations, job freshness and de-duplication, application histories, interview scoring quality, Command Center, AI observability, security and privacy | Done (12) |
| R1–R3 | Adaptive recalculation, counterfactual matching, next-best-action ranking | Done (6) |
| R4 | Market-aware adaptation | Pending (2) |
| V1–V5 | Regression, isolation, accessibility, Docker, documentation | Done (10) |

### Built after 81/100, earning no points

- **Employer postings** (`EMPLOYER_POSTINGS.md`): organizations publish jobs with a stored grant of retention and analysis. They count in market figures only after an administrator reviews the organization. No real organization has used it.
- **Employer-diversity rule:** no market figure from fewer than 5 employers, or from one employer supplying more than half.
- **Real Google Chrome voice runs:** automated runs in real Chrome, plus a keyboard-only voice test.

## 2. Architecture

```
Browser: React 19 + Vite 5 + TanStack Query + Tailwind
   │  HTTPS (nginx serves the build and proxies /api in Docker)
   ▼
Backend: Node.js + Express 4 + TypeScript + Mongoose 8      ──▶ MongoDB 7
   │  JWT access + rotating refresh tokens; zod validation; per-IP and per-user limits
   │  internal service key
   ▼
AI service: Python 3.11 + FastAPI
   ├─ resume extraction (rule-based, optional AI fallback)
   ├─ multilingual detection and extraction; local Tesseract OCR (eng, hin, tel, tam, kan, mal)
   ├─ AI gateway (zero-cost policy; Gemini free tier only if attested; labelled fallbacks)
   └─ AI audit log (codes and timings only, 14-day retention)
```

**Key design rules:**
- **Evidence-first scoring.** Scores come from stated evidence with published weights. AI never sets a score silently.
- **Zero-cost runtime policy.** `ai/app/cost_policy/provider_registry.json` is mirrored in `backend/src/config/costPolicy.ts`. Paid providers are blocked even when keys are present, and external sources are off until enabled.
- **Honest unavailability.** Missing data shows as "unavailable" with a reason, never as zero or an estimate. Synthetic fixtures are labelled and never mix with sourced data.
- **Isolation.** Every user-data route is owner-scoped, and administrator checks read the role from the database (`SECURITY_REVIEW.md`).

**Repository:**

| Path | Contents |
|---|---|
| `frontend/` | React app |
| `backend/` | Express API, models, services, the backend test suites |
| `ai/` | FastAPI service and pytest suite |
| `e2e/` | Browser suites (Playwright Core with an installed browser) |
| `demo/` | Synthetic demo documents |
| `docs/` | Documentation |

## 3. Installation

**Docker (recommended for a demonstration).** Install Docker Desktop, then:

```bash
# .env needs JWT_ACCESS_SECRET, JWT_REFRESH_SECRET and INTERNAL_SERVICE_KEY (long random values)
docker compose up -d --build
```

Open http://localhost:3000. Data lives in Docker volumes, which survive restarts. Tesseract and the six OCR languages are inside the AI image.

**Local development:** see `README.md` → "Run it locally".
- Node.js 24, pnpm and Python 3.11.
- `pnpm install`; create `ai/.venv` and run `pip install -r requirements.txt`.
- `pnpm dev:backend` (port 5000), `pnpm dev:frontend` (port 3000), and the AI service with `python -m uvicorn app.main:app --port 8000`.
- MongoDB is embedded in development.
- OCR locally needs Tesseract installed (on Windows, `C:\Program Files\Tesseract-OCR`); without it, scans are reported as unreadable.

**Optional settings** (all off or empty by default):

| Setting | Effect |
|---|---|
| `GEMINI_API_KEY` | AI replies, with the free-tier attestation |
| `RAPIDAPI_KEY` | JSearch; still blocked by the zero-cost policy |
| `SKILLBRIDGE_ENABLE_ONJOB` + `SKILLBRIDGE_ONJOB_FEED_TERMS_ACCEPTED` | Live OnJob.io listings in comparisons |

## 4. Screenshots checklist

Capture each with a synthetic account (see `DEMO_SCRIPT.md`). Before using a screenshot, check that any figure on it is either labelled synthetic or says unavailable.

| # | Screen | What must be visible |
|---|---|---|
| 1 | Landing page | No invented claims; labelled sample screens |
| 2 | Registration and onboarding | Target role step |
| 3 | Resume Intelligence after upload | Extracted skills with evidence; the rejected-file message |
| 4 | Career Intelligence | A match score and its per-requirement table |
| 5 | Career Readiness | Score, tier, dimensions, "describes evidence" note |
| 6 | Career Lab → Compare | Gaps, effort, "Market data unavailable", live listings row |
| 7 | Career Lab → What-if and Counterfactuals | Before and after scores, "nothing is saved" |
| 8 | Learning Roadmap | Phases and progress |
| 9 | Portfolio | Self-reported label, share switch |
| 10 | Interview room | Question source label, score with method and uncertainty |
| 11 | Recording and dictation consent panels | Consent text, retention choice |
| 12 | Technical assessment | "Runs nothing" note, task and explanation |
| 13 | Jobs | Labelled demo listings, freshness |
| 14 | Applications and Application Outcomes | History, reminder, rates with denominators |
| 15 | Resume Language Check | Hindi result with line provenance; scanned PDF with the OCR banner |
| 16 | Exam Practice | GATE CS attempt with timer |
| 17 | Market Evidence / Salary Insights | "Unavailable" with reason; the synthetic toggle labelled |
| 18 | Employer Postings | Publish terms; self-declared label; review tab |
| 19 | AI Observability (administrator) | Provider statistics, scope note |
| 20 | Profile & Settings | Account deletion |
| 21 | Phone width (390 px) | Any main page without horizontal scroll |

## 5. Testing summary

Run on the final code, 2026-10-14.

| Check | Result |
|---|---|
| Backend suites (`cd backend && npx tsx src/tests/runAllTests.ts`) | 58/58 pass (310 checks), including the route-wide security sweep, account deletion, the API-reference coverage check (167 routes) and the employer and market suites |
| AI service (`cd ai && python -m pytest`) | 190 passed |
| Browser suites (`cd e2e && E2E_TEST_FILE=./tests/<suite>.mjs node run.mjs`) | 15 suites, all pass; the voice suite runs in real Chrome and Edge. See the release report |
| Typecheck, lint (no warnings allowed), production build | Pass |
| Docker Compose (GitHub Actions `docker-smoke.yml`) | Pass: build, health, auth, resume-to-career, OCR in the container, audit privacy, restart persistence, recording retention |
| Manual | Voice in Edge with a real microphone and Narrator, and Firefox B6 (owner, `MANUAL_VOICE_EVIDENCE.md`) |

No test contacts a paid service. The browser suites run an isolated copy of the stack with a stub AI service, and never touch the development database or the Docker volumes.

## 6. Known limitations

**Market intelligence.**
- No licensed source of Indian job postings exists at ₹0 (`MARKET_DATA_SOURCES.md`).
- Market history, salaries, trends and forecasts are built and tested, but show "unavailable" on real data.
- The employer channel has no real postings.
- OnJob.io listings are one small job board, republished only.

**Voice.**
- Chrome's microphone, human-voice and screen-reader steps were not run by hand, so D1 and D2 are pending.
- Dictation accuracy depends on the browser's service: 4 of 5 technical terms in Edge.

**Languages.**
- English, Hindi and Spanish only. Telugu, Tamil, Kannada and Malayalam are recognised and refused.
- Spanish scans are weaker (no Spanish OCR data).
- The labelled evaluation set is small and synthetic.

**Scores.** Scores describe resume evidence with published weights. They are not predictions of hiring.

**Not done.** No deployment, load test, real-user study or manual full screen-reader audit.

**AI.** Optional and free-tier only. Without a key, every AI feature uses a labelled fallback.

## 7. Viva questions and answers

**1. Why is the expansion 81/100 and not 100?**
- Nineteen points need things that cannot honestly be produced at ₹0.
- **14 market points** need licensed, stored Indian job postings, and none exist.
- **5 voice points** need Chrome steps that only a person can do: a physical microphone, a human voice and a screen reader. The owner chose not to run them.
- The criteria were not lowered to raise the score.

**2. How is a match score calculated?**
- Each career has weighted requirements.
- Each skill's evidence (applied, project, listed, assessed) earns points.
- The score is the weighted share of requirement points earned, and the page shows every row (`SCORING.md`).

**3. Can a student fake their resume to raise the score?**
- Listing a skill earns less than evidence of applying it.
- Skill checks and portfolio entries add assessed or self-reported evidence, labelled as such.
- Nothing claims to verify a resume.

**4. Where is AI used, and what if it is unavailable?**
- AI is used for optional fallback parsing, interview questions and scoring, and chat.
- Every reply carries its provider. Without a key there are labelled rule-based fallbacks.
- Paid providers are blocked by policy, even with keys present.

**5. How do you avoid showing fake market data?**
- The evidence contract allows a number only for valid, fresh, sourced records.
- Synthetic fixtures are a separate dataset, labelled everywhere.
- Every other case says "unavailable" with the reason.
- New: the employer-diversity rule and the employer review gate.

**6. What did you do about job-market data licensing?**
- Assessed Adzuna, OnJob.io, JobTether, Hopin, DeUnemployment, NCS and Kaggle/Hugging Face datasets against their terms.
- Used only what is granted: OnJob's live-listing republication.
- Built a first-party, consent-based employer channel.

**7. How does OCR work, and is it trusted?**
- Local Tesseract reads scanned or damaged PDFs only, under page, resolution and time limits, and deletes its temporary images.
- OCR values are marked with their confidence and never become verified skills.

**8. How is user data protected?**
- Owner-scoped routes (404 to others), with the administrator role read from the database.
- Rotating refresh tokens.
- Validation on every route, checked by a sweep over 167 routes.
- Recordings are owner-only with chosen retention.
- Account deletion removes every record and file.

**9. How are voice recordings handled?**
- Nothing is requested before consent.
- Retention is "until this round ends", 7 days or 30 days.
- Owner-only playback, never sent to AI.
- Turning recording off deletes them all. A daily job removes expired files.

**10. How do you test this?**
- 58 backend suites against an in-memory database.
- 190 AI tests.
- 15 browser suites against an isolated stack, including real Chrome and Edge for voice.
- A Docker workflow, axe accessibility checks, and owner manual tests for the voice features.

**11. What is a counterfactual explanation here?**
- The smallest single change (adding evidence for a skill) that raises a match most, computed by re-scoring hypothetical evidence.
- It is never saved, and it is checked equal to really adding that evidence.

**12. What is next-best-action ranking?**
- Evidence-producing actions ranked on published factors and weights.
- Its market factor has weight 0 until valid market data exists.

**13. Why can a Hindi resume be read but not Tamil?**
- Hindi has headings, dates and skill terms in the extraction rules, and a measured labelled set.
- Tamil text is recognised (and OCR reads it well), but there are no extraction rules or evaluation for it, so it is refused rather than guessed.

**14. What bug did testing find late?**
1. A re-recorded answer kept the first take's date. Found by the real-codec suite.
2. Hindi words were split at vowel signs, so a Hindi resume could be refused as Marathi. Found while preparing demo documents.
3. Employer statistics could be manufactured with fake organizations. Found in the abuse audit.

**15. Is it production-ready?**
- No: it has not been deployed, load-tested or used by real students.
- It is ready for a local demonstration, with the limits above stated openly.

**16. Why Docker?**
- One command starts MongoDB, the AI service (with Tesseract), the backend and nginx with the frontend.
- Volumes persist data, and the GitHub workflow checks the same stack.

**17. What does the zero-cost policy do technically?**
- Every external call goes through `guardedFetch` or the AI gateway, which check the provider registry.
- Unknown, unverified or blocked providers are refused before any network request; tests assert this.

## 8. Where to read more

| Topic | Document |
|---|---|
| Expansion results and open items | `NEXTGEN_RELEASE_REPORT.md`, `NEXTGEN_CHECKLIST.md` |
| Scoring | `SCORING.md`, `NEXTGEN_RESEARCH.md` |
| Market data and licences | `MARKET_INTELLIGENCE.md`, `MARKET_DATA_SOURCES.md`, `EMPLOYER_POSTINGS.md` |
| Voice | `INTERVIEWS.md`, `MANUAL_VOICE_TEST_PLAN.md`, `MANUAL_VOICE_EVIDENCE.md` |
| Languages and OCR | `MULTILINGUAL.md` |
| Security, privacy, accessibility | `SECURITY_REVIEW.md`, `PRIVACY_AND_RETENTION.md`, `ACCESSIBILITY.md` |
| API | `API_REFERENCE.md` |
| Demonstration | `DEMO_SCRIPT.md` |
