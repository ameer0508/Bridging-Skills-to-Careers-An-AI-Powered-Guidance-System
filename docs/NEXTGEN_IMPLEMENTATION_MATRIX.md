# Next-generation expansion: implementation matrix

Scope is fixed by [`NEXTGEN_EXPANSION_PLAN.md`](NEXTGEN_EXPANSION_PLAN.md). This document maps each
requested feature to what already exists, what must be built, and how it will be accepted.
Progress is tracked in [`NEXTGEN_CHECKLIST.md`](NEXTGEN_CHECKLIST.md), separately from the original
A-J checklist, which stays at 100/100.

## 1. What already exists and will be reused

| Capability | Where | Reused for |
|---|---|---|
| Career match score as a pure function of requirements and skills | `CareerScoringEngine.calculateScore` | Career comparison, what-if, counterfactual search, transition plans. **No second scoring engine is created.** |
| Evidence points per kind of evidence | `EvidenceCalculator.EVIDENCE_POINTS` | Computing what a hypothetical project or certification would add |
| Skill lexicon, aliases, implied skills | `utils/skillLexicon`, `utils/skillMatching` | Every feature that names a skill; job-description mining |
| Career taxonomy (14 careers, 109 requirements) and similarity | `seed/careerTaxonomy`, `CareerSimilarity` | Transition paths; new domains are added to the same seed |
| Readiness, gaps, recommendations, roadmap chain | `CareerReadinessService`, `GapPrioritizer`, `RecommendationEngine`, `RoadmapEngine` | Next-best-action ranking; time-aware roadmaps |
| Per-user serialisation | `utils/userLock` | Recalculation without duplicate updates |
| Job search with result metadata and saved-job history | `OpportunityService`, `SavedOpportunity` | Market records, outcome analytics |
| Interview sessions, rubric evaluation, question generation | `InterviewService`, `InterviewEvaluator`, `InterviewQuestionGenerator` | Follow-ups, role rubrics, voice, history comparison |
| AI gateway with "unavailable" semantics and labelled fallbacks | `ai/app/gateway`, `aiHttp` | Every AI-backed addition follows the same rule: a real provider or an honest fallback |
| Snapshot for the Command Center | `SnapshotService` | Extended, not replaced |
| Test harnesses | `tests/helpers/httpHarness`, `fakeAiService`, `e2e/` | All new tests |

## 2. Shared foundation (built first)

| # | Foundation piece | Design | Needed by |
|---|---|---|---|
| F1 | Dated, source-attributed evidence | `UserSkill.evidences[]` gains optional `observedAt`, `source` (`resume`, `assessment`, `project`, `certificate`, `self_attested`) and `verification` (`stated`, `self_attested`, `assessed`). `UserSkill.lastEvidencedAt` is derived. Old records without these fields stay valid. | Decay, verification, portfolios, calibration |
| F2 | Scoring and data versions | `SCORING_VERSION` and a hash of the career taxonomy are stored with each recalculation and snapshot. | Reproducible experiments, market versions |
| F3 | Event-driven recalculation | `RecalculationService.run(userId, trigger)`: a dependency table says which modules a trigger affects; only those are recomputed, under the user lock; each run is written to `RecalculationRun` with before/after figures. A trigger with the same fingerprint as the last completed run is skipped. | Research 1; every feature that changes evidence |
| F4 | Intelligence snapshots over time | Each `RecalculationRun` stores the headline figures before and after (top match, readiness, skill count, open recommendations) with versions; no separate snapshot collection is needed. | Trends, history comparisons, research evaluation |
| F5 | Hypothetical evaluation | `CareerScenarioService` builds an in-memory copy of the user's skills, applies changes and calls the real scoring function. Nothing is written. | What-if, counterfactuals, transitions, next-best-action impact |
| F6 | Preferences and consent | `User.learningPreferences` (`hoursPerWeek`, `reminderConsent`, `milestoneConsent`, `voiceRecordingConsent`, `preferredLanguage`). Defaults are "no consent". | Roadmaps, reminders, voice |
| F7 | Auditable recommendation decisions | Each ranked action stores its factor values and the baseline rank. | Research 3 |

## 3. Feature matrix

Legend for acceptance: **U** unit/service test, **H** HTTP test with ownership and validation cases,
**B** browser check in `e2e/`, **D** documented limits.

### A. Advanced career intelligence (15 points)

| Feature | Reuses | New backend | Data | Frontend | Recalc trigger | Accept |
|---|---|---|---|---|---|---|
| A1 Compare careers | Scoring engine, taxonomy, job search | `POST /careers/compare` | none (computed) | Career Lab: Compare | none | U H B |
| A2 What-if changes | Scoring engine, evidence points | `POST /careers/what-if` | none (nothing is saved) | Career Lab: What-if | none | U H B |
| A3 Skill freshness and revalidation | Parsed resume dates, F1 | `GET /skills/freshness`, `POST /skills/:id/revalidate` | F1 fields | Career Lab: Freshness | `skill_evidence_changed` | U H B |
| A4 Multi-stage transition plans | Scoring engine, similarity, F5 | `POST/GET/DELETE /careers/transition-plans` | `TransitionPlan` | Career Lab: Transition | none (re-evaluated on read) | U H B |
| A5 Counterfactual explanations | Scoring engine, F5 | `GET /careers/:id/counterfactuals` | none | Career Lab: What-if | none | U H B D |

### B. Adaptive learning (15 points)

| Feature | Reuses | New backend | Data | Frontend | Accept |
|---|---|---|---|---|---|
| B1 Course integration | Curated resource catalogue | Provider interface with link-out catalogue; no scraped ratings or prices | `LearningResource` gains provider, checkedAt | Roadmap item resources | U H B D |
| B2 Project suggestions | Gaps, skills | Rule-based project briefs per gap cluster; AI-written when a provider answers | `ProjectSuggestion` | Roadmap / Portfolio | U H B |
| B3 Quizzes and verification | Lexicon, F1, F3 | Curated question bank per skill, server-side scoring, attempt limits | `SkillAssessment`, `AssessmentAttempt` | Skill verification page | U H B |
| B4 Availability-aware roadmaps | RoadmapEngine, F6 | Scheduling from hours per week and progress | Roadmap gains schedule | Roadmap | U H B |
| B5 Evidence-backed portfolio | F1 | Portfolio entries linked to skills; owner-controlled sharing | `PortfolioEntry` | Portfolio page | U H B |
| B6 Streaks, reminders, milestones | Progress events, F6 | In-app notifications only, opt-in | `Notification` | Notification centre | U H B |

### C. Market intelligence (15 points)

| Feature | Reuses | New backend | Data | Accept |
|---|---|---|---|---|
| C1 Historical demand | Job search results | Each fetched posting is stored once with provider, fetch date and posting date | `MarketPosting` | U H B D |
| C2 Demand forecasting | C1 | Only above a minimum number of dated weeks; otherwise "insufficient data" | computed | U H D |
| C3 Salary insights | Posting salaries | Grouped by location, currency and period; never converted or merged; sample size shown | computed | U H B |
| C4 JD trend mining | Lexicon | Skill frequency over time windows from stored postings | computed | U H B |
| C5 Market-aware recommendations | RecommendationEngine, C1 | Demand factor with provenance; neutral when data is sparse | F7 | U H |
| C6 Application outcome analytics | SavedOpportunity history | Rates with numerator, denominator and minimum sample | computed | U H B |

### D. Interviews (15 points)

| Feature | Reuses | New | Accept |
|---|---|---|---|
| D1 Voice interviews | Interview room | Browser recording with explicit consent, retention setting, delete | U H B D |
| D2 Speech-to-text | Web Speech dictation already in the room | Capability detection and text fallback; transcript is editable | B D |
| D3 Adaptive follow-ups | Evaluator output (missing concepts) | Follow-up generated from what the answer lacked | U H B |
| D4 Coding/technical assessments | Question bank | Curated non-executable tasks (trace, review, complexity, SQL reading). **No user code is executed on the server.** | U H B D |
| D5 Role-specific rubrics | Evaluator | Rubric weights per role family | U H |
| D6 Historical comparison | Session history, F4 | Per-dimension trend across sessions | U H B |

### E. Education and coverage (10 points)

| Feature | New | Constraint | Accept |
|---|---|---|---|
| E1 More career domains | Taxonomy entries with requirements | Same seed, versioned | U H |
| E2 Competitive exam pilot | Syllabus records with source URL, publication date and retrieval date | Only from an official published syllabus; otherwise not shipped | U H B D |
| E3 Government/aptitude pilot | Same structure | Same | U H B D |
| E4 Domain assessments and roadmaps | B3 and B4 over E1-E3 | | U H B |
| E5 Multilingual | Language detection, declared supported list, measured extraction accuracy on synthetic fixtures | Unsupported languages are refused with a message | U H D |

### Existing-feature enhancements (12 points) and research (8 points)

Each enhancement is counted once, under the feature that delivers it (the plan says overlapping
features are counted once). The four research contributions are algorithms inside the features
above, plus an evaluation each:

| Contribution | Implemented by | Evaluation |
|---|---|---|
| R1 Continuously adaptive career intelligence | F3, F4 | Triggers and affected modules are asserted in tests; duplicate triggers produce one run; consistency of scores before and after is checked |
| R2 Explainable and counterfactual matching | A2, A5 | Counterfactual score equals the score after really adding the evidence; requirement-level deltas sum to the total |
| R3 Adaptive next-best-action | F7, C5 | Ranked list compared with a fixed baseline (gap importance only) on synthetic profiles |
| R4 Market-aware adaptation | C1-C5 | Behaviour on sparse, missing and conflicting dated data; no forecast without the minimum history |

## 4. Order of work

```
F1 F2 F3 F4 F5  ->  A1 A2 A5 A3 A4   (this is the first vertical workflow)
F6 F7           ->  B3 B4 B6 B2 B5 B1
C1              ->  C4 C3 C6 C2 C5
                    D3 D5 D6 D4 D2 D1
                    E1 E5 E2 E3 E4
evaluation of R1-R4, then regression, security, CI and Docker
```

## 5. Rules that apply to every item

- Authenticated, scoped to the caller; another user's record answers 404.
- Inputs validated; malformed requests answer 400.
- Schema changes are additive and optional. No migration rewrites existing records.
- Where data is missing or too sparse, the API says so (`insufficient_data`) and the screen shows that, not a number.
- No external paid call is made by any test. Gemini and JSearch remain unverified live until authorised.
- Hypothetical scores are labelled as hypothetical and are never described as a hiring prediction.
- Fixtures are synthetic.
