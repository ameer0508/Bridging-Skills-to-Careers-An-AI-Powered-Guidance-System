# Advanced interviews (D-series)

**Branch:** `work/skillbridge-parallel-features` (Agent B). **Screen:** `/interview-agent`. **API:** `/api/v1/interviews` (sign-in required). No interview feature calls a paid service. Scoring uses the AI service only when a zero-cost provider is cleared; otherwise it uses the labelled rule-based rubric.

| ID | Status on this branch |
|---|---|
| **D5** role-specific rubrics | **Implemented and tested** (U H B) |
| **D4** technical assessments without code execution | **Implemented and tested** (U H B D) |
| **D3** answer-adaptive follow-ups | **Implemented and tested** (U H B) |
| **D6** historical performance comparison | **Implemented and tested** (U H B) |
| D2, D1 | Not started |

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

## D4. Technical assessments without code execution

**Screen:** `/interview-agent/assessments`, linked from the interview lobby. **API**, sign-in required and scoped to the caller:

| Method and path | Purpose |
|---|---|
| `GET /interviews/assessments/catalog` | Skills and task types available |
| `POST /interviews/assessments` | Start, with `{skills?, kinds?, count 1–10}` |
| `GET /interviews/assessments` | Past attempts |
| `GET /interviews/assessments/:id` | One attempt |
| `POST /interviews/assessments/:id/answers` | Answer one task, with `{taskId, response}` |
| `POST /interviews/assessments/:id/finish` | Finish the attempt |

**No code is executed, ever.** The tasks are curated, read-only items in `backend/src/seed/technicalAssessmentBank.ts`. There are 23 tasks over JavaScript, Python, SQL, and data structures and algorithms:

| Type | What the candidate does |
|---|---|
| Trace | Say what the code prints |
| Review | Find the defect, as a line number or an option |
| Complexity | Give the big-O |
| SQL | Read a query against tables shown with it |

The candidate answers with an option index, a line number or a short value, which is compared with a stored key.
- Anything typed, including code, is stored as text and compared as text.
- The runtime modules import nothing that can execute code; a test audits them for `eval`, `Function`, `vm` and process spawning.
- No user content leaves the server.

**Rules:**
- **Matching.**
  - Text answers ignore case, surrounding quotes and spacing.
  - Numbers are compared numerically, so `70.0` equals `70`.
  - Choices and lines must be the exact index or number. Nothing looser is accepted.
- **Keys stay hidden until answered.** Keys and explanations are returned only for tasks already answered. Before that, the response contains no key, explanation or "correct" field.
- **One answer per task.** An answer cannot be changed (409).
- **Scoring.** Finishing scores unanswered tasks as incorrect. Answering every task finishes the attempt automatically. The score is correct over total, also broken down by skill.
- **Selection.** Tasks not seen in the user's last two attempts come first. The order is a seeded shuffle, so an attempt always lists the same way.
- **Validation.**
  - Unknown skills, task types and fields → 400.
  - More than 10 tasks → 400.
  - Text answers over 200 characters → 400.
  - A line outside the code, or a choice outside the options → 400.
  - Another user's attempt → 404.
- **Results are practice only.** They do not add skill evidence and do not change career scores. Agent A's skill verification (B3) owns evidence; feeding D4 results into it is an integration decision.

**Key verification.**
- The five SQL keys are re-derived in the test from the tables shown to the candidate.
- The five JavaScript trace keys are checked by running the bank's own snippets in a sandbox inside the test only. No user input is involved.
- Python keys were worked out by hand and carry explanations.

**Tests:**
- `backend/src/tests/technical_assessments.test.ts` covers:
  - bank integrity;
  - re-derived keys;
  - matching rules;
  - the no-execution audit;
  - HTTP: keys withheld, code-as-answer stored as text, one answer per task, finish scoring, 4 isolation probes, line and choice validation, auto-completion, unseen tasks preferred, 4 invalid starts.
- `e2e/tests/interviews.mjs` adds 6 browser steps:
  - the lobby link and the no-execution statement;
  - SQL tasks with tables and no visible answers;
  - a right answer and a code answer;
  - finish and history;
  - a line answer;
  - 390 px.

## D3. Answer-adaptive follow-up questions

**Opt-in per round.** In the lobby, check *Ask follow-up questions*, or send `adaptiveFollowUps: true` to `POST /interviews`. It is off by default, so existing rounds behave exactly as before.

**When a follow-up is asked.** Right after an answer is scored, `backend/src/services/interview/FollowUpService.ts` decides from what the answer lacked, in this order:

1. **A missing expected concept** (the first in `missingConcepts`):
   - technical: "Your answer did not cover *concept*. How does it apply here, and what would you do about it?"
   - behavioural: "In the situation you described, what part did *concept* play?"
2. **Specificity below 40.** It asks for the concrete tools, methods and measured results.
3. **Structure below 50.** It asks for the STAR steps for behavioural questions, or the reasoning and trade-offs otherwise.

**No follow-up** is asked:
- after an empty answer, which still needs an answer itself;
- after a strong answer (75 or more with nothing missing);
- for a follow-up;
- beyond **one per question** or **three per round**.

**What it is.**
- It is deterministic and needs no AI.
- It is inserted immediately after the answered question, so it is asked next.
- It carries `source: 'follow_up'`, `followUpOf`, `followUpReason` and a `groundedIn` such as "your answer to question 2 did not cover …". The room labels it **FOLLOW-UP · not part of the overall score**.

**Scoring.**
- A follow-up answer is scored with the session's rubric (D5).
- The overall score, the dimension averages and "answered" cover the **planned questions only**, so asking follow-ups can never lower or raise the headline score.
- The report adds `followUpSummary`:
  - `asked`, `answered`;
  - `recovered`: the concept is now covered, or the weak dimension reached its threshold;
  - `averageScore`.

  It also adds one line of advice.

**Limits.** The lexical coverage check behind "missing concept" is coarse, the same as in the rule-based rubric. A follow-up may ask about a point the candidate did make, in other words.

**Tests:**
- `backend/src/tests/interview_followups.test.ts` covers:
  - reasons in priority order;
  - no follow-up for empty, strong or follow-up answers;
  - wording;
  - recovery;
  - opt-in only;
  - placement;
  - one per question;
  - the cap of 3;
  - an overall score from planned questions only;
  - the summary;
  - HTTP validation, isolation (404) and the report.
- `e2e/tests/interviews.mjs` adds 2 browser steps: a follow-up asked at once with its provenance, then answered and reported apart from the overall score.

## D6. Historical performance comparison

**API:** `GET /interviews/progress?mode=` (sign-in required; only the caller's completed sessions; at most the latest 50). **Screen:** "Progress across sessions", under *Inspect Past Sessions* in the interview studio. Each scoring source gets a line chart and a table alternative.

**Like with like.** Implemented in `backend/src/services/interview/InterviewProgressService.ts`:
- **Rubrics.** The dimensions (relevance, completeness, specificity, structure, technical accuracy) are measured the same way under every rubric, so they are compared across rubrics.
- **Scoring source.** AI-scored and rule-scored sessions are **separate series**. The rule-based rubric is capped at 80 and cannot judge accuracy, so the two are not on one scale.
- **Exclusions.** Sessions scored partly by each (`mixed`) are listed as excluded, as are completed sessions with no answer.
- **Accuracy.** Technical accuracy only appears for AI-scored sessions.
- **Overall scores.** These depend on the rubric's weights, so they are compared only within one scoring source and one rubric (`overallByRubric`).

**Direction.**
- It needs at least **3 sessions**.
- The mean of the earlier half is compared with the recent half; for an odd count, the middle session is dropped.
- It is stated as improved or declined only when the difference is at least **10 points**; otherwise it is "no clear change".
- With fewer sessions, the screen says "Not stated: n of 3 sessions needed". The first and latest values and the latest-vs-previous difference are still shown.

**Limits.**
- This compares a person's own practice, not other candidates, and it predicts nothing.
- Different questions are asked each time, so part of any change comes from the questions. The screen says so.

**Tests:**
- `backend/src/tests/interview_progress.test.ts` covers:
  - the trend rule and its threshold;
  - series kept apart by source;
  - mixed and unanswered sessions excluded;
  - accuracy only for AI sessions;
  - overall scores grouped by rubric;
  - date ordering;
  - HTTP: own completed sessions only, the mode filter and 2 invalid queries.
- `e2e/tests/interviews.mjs` adds 1 browser step: the panel's values equal the API, three sessions state a direction, and rule-based sessions have no accuracy row.
