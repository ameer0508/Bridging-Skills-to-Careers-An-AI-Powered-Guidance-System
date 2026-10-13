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
| Market | The infrastructure for sourced, dated market evidence. **Shown as unavailable**: no licensed source exists | `MARKET_INTELLIGENCE.md`, `MARKET_DATA_SOURCES.md` |
| AI | One zero-cost gateway (paid providers blocked even with keys present); an audited, privacy-safe observability log for administrators | `ZERO_COST_API_POLICY.md`, `AI_OBSERVABILITY.md` |
| Privacy | Account deletion of every record and file; bounded logs; stated retention for every kind of data | `PRIVACY_AND_RETENTION.md` |

## 2. Verification on the final tree

| Check | Result |
|---|---|
| Backend suites (`runAllTests.ts`) | 56 of 56 pass, including `security_sweep`, `account_deletion` and `api_reference` |
| AI service (`pytest`) | 189 passed (with Tesseract installed) |
| Browser suites (12) | smoke 50/50, market 15/15, salaries 14/14, applications 15/15, outcomes 10/10, interviews 23/23, exams 12/12, careerDomains 8/8, languages 11/11, aiObservability 6/6, landing 6/6, accessibility 53/53 |
| Typecheck, lint, production build | Pass (frontend and backend) |
| Docker Compose (GitHub Actions) | Run 38382438611 on `b033d61` passes: build, health, auth, the resume-to-career workflow, local OCR with the six approved languages (Tesseract 5.5.0; scanned English and Hindi pages read 4/4), persistence across restart, recording retention, AI audit file permissions and privacy. Earlier run 38377392127 on `d4264f6` |
| Security (V2) | `SECURITY_REVIEW.md`: 149 routes swept, isolation replay, races, admin role, exposure |
| Accessibility (V3) | `ACCESSIBILITY.md`: axe on 50 pages, 0 serious or critical violations; keyboard sign-in |
| API reference | Every route listed (enforced by `api_reference.test.ts`) |

All figures are from the tree `b033d61` (OCR, X1) on 2026-10-13; the docs-only commits after it change no code. **Checklist: 78 / 100 verified; 22 open** (section 4).

## 3. Honesty rules applied

- **No invented figures.** No invented market, salary, hiring or outcome figure is shown anywhere. With no licensed source, market features say "unavailable" and why.
- **Landing page.** The public page has no testimonials, user counts or false technical claims. Sample screens are labelled. See `PRODUCT_CLAIMS.md`, enforced by `landing.mjs`.
- **Scores are not predictions.** Every interview score states its method, uncertainty and that it does not predict hiring. Readiness states how much of its evidence is verified.
- **Exams and assessments are practice.** They never change career evidence (asserted).
- **US data is labelled.** O*NET-informed careers say the data is from the United States and is not a measure of Indian demand.

## 4. Known limits and open items

| Item | Points | Why open | What closes it |
|---|---|---|---|
| A1, C1, C2, C3, C4, C5, R4 | 17 | No free source permits storing and aggregating Indian job postings (`MARKET_DATA_SOURCES.md`) | Adzuna's written consent or licence at ₹0, or another compliant source |
| D1, D2 | 5 | Real microphones and browser speech recognition cannot be tested automatically | The owner runs `MANUAL_VOICE_TEST_PLAN.md` and any defects are fixed |

**Other limits, all documented:**
- The labelled multilingual set is small and synthetic; no real scans were measured.
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
