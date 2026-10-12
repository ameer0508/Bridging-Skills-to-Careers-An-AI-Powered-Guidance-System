# SkillBridge next-generation expansion

**Branch:** `work/skillbridge-opus55-nextgen-expansion`, forked from verified release-candidate commit `f4386bc`.
**Baseline:** existing A–J checklist is 100/100; **new expansion 0/100 verified**. Keep draft PR #6 and `main` unchanged.

## Scope — implement, integrate and test all requested functions

**A. Advanced Career Intelligence (5):** compare careers by requirements/evidence/effort/opportunities; what-if changes from skills/projects/certifications; skill-decay/revalidation; multi-stage career transition plans; richer explainable and counterfactual matching.

**B. Adaptive Learning (6):** learning-platform/course integration; personalized project suggestions; practical quizzes and skill verification; availability-/progress-aware roadmaps; evidence-backed portfolios; learning streaks, opt-in reminders and milestone notifications.

**C. Market Intelligence (6):** sourced historical job-demand analytics; skill-demand forecasting only with sufficient dated data; geography-, currency-, period- and provenance-aware salary insights; job description trend mining; market-aware recommendations; application outcome analytics with denominators and sample sizes.

**D. Interviews (6):** voice interviews; speech-to-text with unsupported-browser fallback; answer-adaptive follow-up questions; coding/technical assessments using isolated execution or curated non-executable tasks; role-specific rubrics; historical performance comparisons.

**E. Education and Coverage (5):** additional career domains; syllabus-versioned competitive exam pilot(s); government/aptitude exam pilot(s); domain-specific assessments and roadmaps; multilingual guidance/resume extraction with declared supported languages and accuracy evaluations.

**Existing feature enhancements (12):** multi-layout/multilingual resume extraction; validated proficiency and skill evidence; career explanation; evidence-grounded readiness calibration; measurable personalized recommendations; time/progress-aware roadmaps; job freshness/deduplication/rate-limits; application histories/reminders/outcomes; interview scoring quality; cross-module Command Center state; AI observability/fallback/confidence calibration; security/privacy/retention/hardening.

**Research contributions (4):** Continuously Adaptive Career Intelligence; Explainable and Counterfactual Career Matching; Adaptive Next-Best-Action Recommendations; Market-Aware Career Adaptation. Build these as connected, measurable algorithms, not decorative agent dashboards.

## Expansion completion budget (separate from existing 100/100)

| Phase | Points | Initial status |
|---|---:|---|
| Existing A–J enhancements | 12 | Pending |
| Advanced career intelligence | 15 | Pending |
| Adaptive learning and skill verification | 15 | Pending |
| Historical market and opportunity intelligence | 15 | Pending |
| Advanced interview and coding assessment | 15 | Pending |
| Wider careers, exams and multilingual support | 10 | Pending |
| Four integrated research contributions and evaluation | 8 | Pending |
| Regression, security, UX, CI and release verification | 10 | Pending |
| **Total** | **100** | **0 complete; 100 remaining** |

No points are earned merely from implementing classes or screens. A completed task requires a user-facing workflow, authenticated backend, appropriate persistence, accurate data and provenance, validation/error states, documented limits, passing unit/API/browser tests, and no regression.

## Implementation protocol

1. Work only on this expansion branch. Audit reusable features, then design data models/APIs/event contracts and baseline tests before modifications; preserve release branch and PR #6.
2. Build shared dated evidence, provenance, consent, scoring explainability, and event-triggered re-evaluation before adaptive/counterfactual features.
3. Implement existing feature enhancements, career scenarios and skills/learning evidence incrementally.
4. Establish legitimate timestamped market records, duplicate control and provider-policy compliance before showing market changes, salaries or forecasts. Return 'insufficient data' instead of fabricated results.
5. Extend interview voice/STT with explicit consent and accessible text fallback. Never run user-supplied code directly in an app/server container; require isolation or safe non-executable tasks.
6. Version exam syllabi against official published sources, label scope, and test accuracy for each supported language. Do not claim universal multilingual/exam coverage.
7. Evaluate the four research contributions against reproducible baselines, holdout scenarios and failure cases. Hypothetical score differences are not causal employment predictions.
8. Run backend/frontend/AI tests, browser E2E and CI/Docker regression, privacy/cross-user tests and document limits before requesting release review.

No real or billable third-party calls without user approval. Never commit keys, actual resumes, databases, logs or backups. No destructive migrations. Commit validated milestones only on this branch and do not merge to `main` without explicit approval.

**Per-milestone report:** Existing release baseline 100/100; expansion X/100 verified, Y/100 pending; finished and blocked features; actual tests; risks; Git commit; next action. Keep overlapping features counted once.
