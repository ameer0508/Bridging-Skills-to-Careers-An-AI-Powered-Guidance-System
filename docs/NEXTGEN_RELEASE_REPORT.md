# Next-generation expansion: release report (2026-10-13)

**Branch:** `work/skillbridge-opus55-nextgen-expansion`, developed on `work/skillbridge-unified`.
`main`, `work/skillbridge-opus55-finalization` and draft PR #6 are untouched; releasing is the project owner's decision.

**Checklist:** `docs/NEXTGEN_CHECKLIST.md`. The original A–J release (`docs/FINALIZATION_CHECKLIST.md`) remains at 100/100 and separate.

## 1. What SkillBridge does now

| Area | What a user can do | Detail |
|---|---|---|
| Career intelligence | Matches to 20 careers with requirement-level evidence. Compare, what-if, counterfactuals, freshness and staged transition plans in the Career Lab | `SCORING.md`, `NEXTGEN_RESEARCH.md` (R1–R3) |
| Wider careers (E1) | Six careers informed by O*NET 31.0 (US data, stated as such) in the ordinary matches, readiness, roadmaps and resources | `E1_CAREER_DOMAINS.md` |
| Learning | Paced roadmaps, 65 official free resources, 21 practice briefs, skill checks for 8 skills, a portfolio with duplicate-safe credit, streaks and opt-in reminders | `SCORING.md` §12–19 |
| Exams (E2–E4) | GATE CS 2026 and SSC CGL 2026 Tier-I practice: original questions, official patterns, server-side timing, topic progress and study plans. Kept apart from career evidence | `EXAM_PREP.md` |
| Interviews | Role rubrics, adaptive follow-ups, technical assessments (no code execution), progress and explained scoring that caps explicit contradictions | `INTERVIEWS.md` |
| Voice (D1, D2) | Consent-gated recordings with retention and deletion; dictation with a typed fallback | `INTERVIEWS.md`, `MANUAL_VOICE_TEST_PLAN.md` |
| Languages (E5, X1) | Resume checks in English, Hindi and Spanish, with provenance and measured accuracy; scanned and damaged PDFs read by local Tesseract OCR, marked as OCR guesses with confidence; guidance in all three; other languages refused, including Telugu, Tamil, Kannada and Malayalam | `MULTILINGUAL.md` |
| Jobs | Search with truthful freshness, cross-source duplicates and limits; application history, reminders and outcome rates from the user's own data | `APPLICATION_OUTCOMES.md`, `SCORING.md` §22 |
| Market | The infrastructure for sourced, dated market evidence. **Shown as unavailable**: no source licenses counts, history or statistics. The Career Lab comparison can show **live OnJob.io listings** (republished with links under the feed licence; off by default) | `MARKET_INTELLIGENCE.md`, `MARKET_DATA_SOURCES.md`. Organizations can publish postings directly, granting retention and analysis (`EMPLOYER_POSTINGS.md`); none has yet, so nothing changes. No market figure is given from fewer than 5 employers or with one above half |
| AI | One zero-cost gateway (paid providers blocked even with keys present); an audited, privacy-safe observability log for administrators | `ZERO_COST_API_POLICY.md`, `AI_OBSERVABILITY.md` |
| Privacy | Account deletion of every record and file; bounded logs; stated retention for every kind of data | `PRIVACY_AND_RETENTION.md` |

## 2. Verification on the final tree

| Check | Result |
|---|---|
| Backend suites (`runAllTests.ts`) | 58 of 58 pass (308 checks), including `security_sweep` and `api_reference` (167 routes), `account_deletion`, `onjob_live_listings` and `employer_postings` |
| AI service (`pytest`) | 190 passed (with Tesseract installed), including the Devanagari tokenizer regression |
| Browser suites (15) | voiceRealCodec 24/24 (12 steps each in real Google Chrome Stable 155 and Edge 155), smoke 50/50, navigation 27/27 (all 24 sidebar entries), employer 8/8, accessibility 54/54, interviews 23/23, market 15/15, applications 15/15, salaries 14/14, exams 12/12, languages 11/11, outcomes 10/10, careerDomains 8/8, aiObservability 6/6, landing 6/6 |
| Typecheck, lint, production build | Pass (frontend and backend) |
| Docker Compose, local (Docker Desktop 29.8.2) | On the final code: all four images built; all services healthy; backend and AI run unprivileged; OCR self-check in the container (six languages, English and Hindi scans 4/4); `docker-smoke.mjs` 11/11 (health, nginx, auth, AI parsing, resume-to-career, isolation, recordings); restart persistence 2/2; no startup failures in the logs; with the OnJob feed on, `live/onjobCompareLive.mjs` 3/3 on real data; with onjob.io unreachable, the comparison answered 200 with "unavailable" |
| Docker Compose (GitHub Actions) | Run 38442538822 on `7a8ce13` (this pass's final code) passes: build, health, auth, the resume-to-career workflow, local OCR with the six approved languages, AI audit privacy, persistence across restart and recording retention. Earlier: 38382438611 on `b033d61`, 38377392127 on `d4264f6` |
| Security (V2) | `SECURITY_REVIEW.md`: 149 routes swept, isolation replay, races, admin role, exposure |
| Accessibility (V3) | `ACCESSIBILITY.md`: axe on 50 pages, 0 serious or critical violations; keyboard sign-in |
| API reference | Every route listed (enforced by `api_reference.test.ts`) |

All code figures above are from the final tree of 2026-10-14 (release readiness: employer review gate, Hindi tokenizer fix, navigation suite, demo material); the GitHub Actions row names its own commit. **Checklist: 81 / 100 verified; 19 open** (section 4). Demonstration: `DEMO_SCRIPT.md`; overview: `PROJECT_HANDBOOK.md`.

## 3. Honesty rules applied

- **No invented figures.** No invented market, salary, hiring or outcome figure is shown anywhere. With no licensed source, market features say "unavailable" and why.
- **Landing page.** The public page has no testimonials, user counts or false technical claims. Sample screens are labelled. See `PRODUCT_CLAIMS.md`, enforced by `landing.mjs`.
- **Scores are not predictions.** Every interview score states its method, uncertainty and that it does not predict hiring. Readiness states how much of its evidence is verified.
- **Exams and assessments are practice.** They never change career evidence (asserted).
- **US data is labelled.** O*NET-informed careers say the data is from the United States and is not a measure of Indian demand.

## 4. Known limits and open items

| Item | Points | Why open | What closes it |
|---|---|---|---|
| C1, C2, C3, C4, C5, R4 | 14 | No free source permits storing, counting, pricing or mining Indian job postings. OnJob.io's feed permits republishing live listings only (used for A1); its CC BY salary buckets fail a validity check (`MARKET_DATA_SOURCES.md`) | OnJob.io's written permission (request drafted in `MARKET_DATA_SOURCES.md` §5), Adzuna's written consent at ₹0, or another compliant source; C2 then needs months of history |
| D1, D2 | 5 | Every required step passes by the owner's hand in **Microsoft Edge** (real microphone, Narrator), and B6 in **Firefox**; B4 4 of 5 terms; B7 N/A. The award rule also requires **Google Chrome**. Real Chrome Stable 155 passes every automatable step (voice suite 12/12; A1, A2, A6–A12, B1, B5, B8, C1), but A4–A5 (physical microphone), B2–B4 (human voice) and C2–C4 (screen reader) need a person, and the owner has chosen not to test Chrome by hand | A manual Chrome run of A4, A5, B2–B4 and C2–C4 (`MANUAL_VOICE_EVIDENCE.md` §4). Not requested, at the owner's instruction |

**Other limits, all documented:**
- The labelled multilingual set is small and synthetic; no real scans were measured.
- Live OnJob.io listings: one job board, small (480 India listings on 2026-10-13; 11 of 20 careers matched), titles matched by rules, employer field sometimes a recruiting agency; off by default; a dead feed delays the first comparison by up to the 20-second timeout, then retries at most every 15 minutes.
- OCR: Spanish scans are partial (no Spanish OCR data, the owner's choice); OCR reads at most 5 pages per document by default; Telugu, Tamil, Kannada and Malayalam are refused, not supported.
- R3's evaluation is synthetic and partly circular.
- Contradiction detection catches explicit contradictions only.
- Token revocation and per-user limits are per process.
- No manual screen-reader pass was made.
- The AI audit log covers one process unless `AI_AUDIT_DIR` is shared.

## 5. Running the checks

```
pnpm typecheck && pnpm lint && pnpm build
cd backend && npx tsx src/tests/runAllTests.ts
cd ai && python -m pytest -q
cd e2e && E2E_TEST_FILE=./tests/<suite>.mjs node run.mjs     # each of the 12 suites
gh workflow run docker-smoke.yml --ref <branch>              # Docker Compose on GitHub Actions
```
