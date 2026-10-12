# Advanced interviews (D-series)

**Branch:** `work/skillbridge-parallel-features` (Agent B). **Screen:** `/interview-agent`. **API:** `/api/v1/interviews` (sign-in required). No interview feature calls a paid service. Scoring uses the AI service only when a zero-cost provider is cleared; otherwise it uses the labelled rule-based rubric.

| ID | Status on this branch |
|---|---|
| **D5** role-specific rubrics | **Implemented and tested** (U H B) |
| D4, D3, D6, D2, D1 | Not started |

## D5. Role-specific scoring rubrics

Every answer is measured on the same dimensions as before:
- relevance;
- completeness;
- specificity;
- structure;
- technical accuracy, but only when an AI evaluator judged it.

A **rubric** sets how those dimensions are weighted for a role family. It changes nothing else: the caps that stop weak answers scoring well are identical for every rubric.

| Rubric | Roles | Rule-based weights (rel / comp / spec / struct) | AI weights (rel / comp / spec / struct / accuracy) | Emphasis |
|---|---|---|---|---|
| General | Any other role | 35 / 25 / 20 / 20 | 25 / 20 / 20 / 15 / 20 | The weights used before D5 |
| Software engineering | Software, Backend, Frontend, Full Stack, Mobile | 30 / 20 / 25 / 25 | 20 / 15 / 20 / 15 / 30 | Correctness and reasoning about trade-offs |
| Data and machine learning | Data Analyst, Data Scientist, ML Engineer | 30 / 20 / 30 / 20 | 20 / 15 / 25 / 15 / 25 | Measured results and named methods |
| Infrastructure, reliability and security | DevOps, Cloud, Cybersecurity, SRE | 30 / 15 / 30 / 25 | 20 / 10 / 25 / 15 / 30 | Precise, correct operational detail |
| Product and business | Product Manager, Business Analyst | 35 / 20 / 15 / 30 | 25 / 20 / 15 / 25 / 15 | A clear situation, decision and outcome |
| Design | UI/UX Designer, Product Designer | 35 / 20 / 20 / 25 | 25 / 20 / 20 / 20 / 15 | Relevance and the design-process story |

**Rules:**
- **Choice.** A session's rubric is the one the user picks in the lobby. Otherwise it is resolved from the role title, using ordered keyword rules in `backend/src/services/interview/InterviewRubrics.ts`; an unmatched title uses General. `GET /interviews/rubrics?role=` returns the rubrics and the one a role resolves to, so the lobby never duplicates the rules.
- **Stored.** `rubricId` and `rubricVersion` are stored on the session and on every evaluation. A session is always scored with its own rubric. Sessions from before D5 have no `rubricId` and keep being scored with General, so historical scores do not change.
- **Unchanged caps.** These apply under every rubric:
  - under 15 words → at most 25, or 30 on the AI path;
  - under 40 words → at most 50, or 60 on the AI path;
  - off-topic → at most 15, or 20 on the AI path;
  - rule-based scoring → at most 80.
- **Missing accuracy.** When the AI does not judge technical accuracy, the other AI weights are rescaled to 100.
- **Shown.** The lobby shows the chosen rubric, its emphasis and its weights. The debrief names the rubric and version (`RubricNote`).

**Limits.**
- The weights are design choices that reflect what each role family is usually assessed on. They have not been calibrated against hiring outcomes, and no such data exists here.
- The rule-based path still cannot judge correctness.

**Tests:**
- `backend/src/tests/interview_rubrics.test.ts` covers:
  - weight sums;
  - 19 role titles resolved;
  - General identical to the earlier scoring;
  - scores following each rubric's weights;
  - role differentiation: a structured story scores higher under Product, and a metric-heavy answer higher under Data;
  - identical caps;
  - the AI path with and without accuracy;
  - the rubric stored per session, with older sessions kept on General;
  - HTTP: 401, 400 and 404 for another user's report.
- `e2e/tests/interviews.mjs` covers:
  - picker and weights;
  - a chosen rubric stored and named in the debrief;
  - "match my role" equal to the server's resolution;
  - a clean console.
