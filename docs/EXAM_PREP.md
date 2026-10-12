# Exam preparation pilots (E2, E3, E4)

**Branch:** `work/skillbridge-parallel-features` (Agent B). **Screens:** `/exams` and `/exams/:examId`, with tabs for Syllabus and sources, Practice, Progress, and Study plan. **API:** `/api/v1/exams` (sign-in required). Cost: ₹0. No external service is called at run time.

| ID | Status on this branch |
|---|---|
| **E2** competitive exam pilot: GATE 2026 CS | **Implemented and tested** (U H B D) |
| **E3** government / aptitude pilot: SSC CGL 2026 Tier-I | **Implemented and tested** (U H B D) |
| **E4** exam-specific assessments and roadmaps | **Implemented and tested** (U H B), as exam-specific services; Agent A's `RoadmapEngine` is not used or changed |

SkillBridge is **not affiliated with, endorsed by or partnered with** IIT Guwahati, the GATE organising committee or the Staff Selection Commission. Every exam screen says so.

## 1. Exams, versions and sources

Both definitions are in `backend/src/seed/exams/examDefinitions.ts`. Facts about each exam are copied from the official documents below. Everything else is labelled as SkillBridge's own.

| Pilot | Official documents | Published | Read |
|---|---|---|---|
| **GATE 2026: Computer Science and Information Technology (CS)**, organised by IIT Guwahati | [CS syllabus PDF](https://gate2026.iitg.ac.in/doc/GATE2026_Syllabus/CS_2026_Syllabus.pdf), [GA syllabus PDF](https://gate2026.iitg.ac.in/doc/GATE2026_Syllabus/GA_2026_Syllabus.pdf), [question paper pattern](https://gate2026.iitg.ac.in/question-paper-pattern.html) | The PDF metadata gives creation dates 2025-08-08 (CS) and 2025-08-07 (GA); the pattern page shows no date | 2026-10-12 |
| **SSC Combined Graduate Level Examination 2026, Tier-I**, by the Staff Selection Commission | [Notice of the examination (PDF)](https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2025.pdf), §13.8 (scheme) and §13.10 (indicative syllabus) | The notice states it was uploaded on 21-05-2026; the file name says 2025, but the content is the 2026 examination | 2026-10-12 |

**Taken from the sources:**
- the section and topic wording (the "Official syllabus" text on each topic);
- the pattern:
  - GATE: 3 hours, 100 marks, GA 15 / Engineering Mathematics 13 / subject 72, MCQ, MSQ and NAT;
  - SSC: four subjects of 25 questions and 50 marks each, 1 hour with a 15-minute sectional timer;
- the marking:
  - GATE: −1/3 for a wrong 1-mark MCQ and −2/3 for a wrong 2-mark MCQ, no negative marking for MSQ or NAT, no partial MSQ marks;
  - SSC: −0.50 per wrong answer.

**SkillBridge's own, and labelled so:**
- topic hour estimates and the prerequisite study order;
- the practice questions;
- timed practice scaled from the official timing (166 s per question for GATE, 36 s per question with sectional timers for SSC);
- the strength and weakness thresholds.

**Never shown** (none of these exists in SkillBridge's data):
- official or past-paper questions;
- cut-offs, ranks, pass rates or selection probabilities;
- exam dates.

Practice scores are labelled "a practice score, not an exam score". GATE 2026 has already taken place, and the screens point to the official site for the next cycle.

## 2. Practice question banks

| Bank | Size | Composition |
|---|---|---|
| `gateCsQuestions.ts` | 47 questions | MCQ, MSQ and NAT, 1 or 2 marks, covering GA and all ten CS sections |
| `sscCglQuestions.ts` | 33 questions | 2-mark MCQs covering all four Tier-I subjects |

All 80 questions are original, written by SkillBridge.
- Every question has a worked explanation.
- **General Awareness covers stable facts only.** Current affairs are excluded because a fixed bank would go out of date. Practice is English only, while the official exam is bilingual except for English Comprehension.
- Code in a question is shown, never run.

**Answer checks.** The tests re-derive 35 keys independently: arithmetic, combinatorics, probability, binary and two's complement, pipeline cycles, access time, FCFS waiting time, subnetting, letter and number coding, and an MST computed with Kruskal's algorithm. The remaining keys are conceptual and carry their reasoning in the explanation.

**Limited content.**
- A topic with fewer than 3 questions is flagged "Limited practice content" on the syllabus tab.
- Asking for more questions than exist shows "Only N questions exist for this choice".
- A selection with no questions answers 400 `NO_QUESTIONS`.

## 3. Practice attempts

| Method and path | Purpose |
|---|---|
| `GET /exams` | Catalogue: sources, pattern, practice rules, sections and topics with question counts |
| `GET /exams/:examId` | One exam |
| `POST /exams/:examId/attempts` | Start, with `{sectionIds?, topicIds?, count 1–40, mode: practice \| timed}` |
| `GET /exams/:examId/attempts` | The caller's history |
| `GET /exams/attempts/:id` | One attempt |
| `PUT /exams/attempts/:id/answers` | Save `{questionId, response}`: an option index (MCQ), indices (MSQ), a number (NAT) or `null` to clear |
| `POST /exams/attempts/:id/sections/:sectionId/start` | Start the next timed SSC section |
| `POST /exams/attempts/:id/submit` | Submit |

**Rules:**
- **Selection.** Questions the user has not seen come first, in a deterministic shuffle, and are then put in official section order.
- **Answers.** Answers can be changed until submission. **Answers and explanations are returned only after the attempt is completed.**
- **Timing is enforced on the server**, with 5 seconds of grace:
  - GATE has one deadline for the set.
  - SSC runs sections in order, each with its own deadline. Starting the next section closes the previous one for good.
  - Answering after time is up returns 409 `TIME_UP`, `SECTION_CLOSED` or `SECTION_NOT_STARTED`.
  - An expired attempt is completed with the answers given in time and marked "time ran out".
- **Marking.** Scoring is on the server, using the official scheme above (`backend/src/services/exams/examScoring.ts`). Unanswered questions score 0. The result is reported as correct, wrong and unanswered counts plus marks.
- **Ownership.** Another user's attempt, or a malformed id, answers 404. Unknown fields, topics or modes, counts over 40 and wrongly shaped answers answer 400.
- **Separation.** Exam practice is kept apart from career skill evidence: nothing is written to `UserSkill`, readiness or career scores, and the tests check this.

## 4. E4: progress, recommendations and study plans

`backend/src/services/exams/ExamStudyService.ts` provides:

| Method and path | Purpose |
|---|---|
| `GET /exams/:examId/performance` | Per-topic counts, accuracy and status, plus recommendations |
| `GET /exams/:examId/plan` | The study plan, or `null` |
| `PUT /exams/:examId/plan` | Create or regenerate, with `{hoursPerWeek 1–60, startDate?}` |
| `PATCH /exams/:examId/plan/items/:itemId` | Set `{status: pending \| done}` |

**Topic status.**
- A status needs **3 answered questions** on the topic.
- Strength: 75% correct or more. Weak: below 50%. Developing: in between.
- Below 3 answers the status is "Too few answers"; a topic never attempted is "Not practised".

**Recommendations.** For each weak topic, a weak or untried prerequisite in SkillBridge's study order comes first (for example, Programming and data structures before Algorithms). Then come topics with too few answers, then topics not yet practised. Each recommendation carries its evidence ("1 of 4 correct").

**Study plan.**
- **Order.** Topics are ordered by need: weak, then not practised, then too few answers, then developing, then strengths. Prerequisites are always placed before the topics that depend on them.
- **Hours per topic.** Each topic gets a share of its estimate:

  | Topic status | Plan item | Share of the estimate |
  |---|---|---|
  | Weak or not practised | Full study pass | 100% |
  | Too few answers | Study, then practise | 80% |
  | Developing | Targeted practice | 50% |
  | Strength | Light revision | 25% |

- **Weeks.** Weeks are filled up to the hours the user says they have; a topic can span weeks. The plan shows total and remaining hours and an estimated end date.
- **Regeneration.** **Regenerating keeps every completed item exactly** (week, hours and status). Only pending work is re-planned, after the last completed week. A topic finished in the plan is planned again only if practice still shows it as weak.
- **Honesty.** Hours are effort estimates for study. They do not promise or predict an exam result, and the screen says so.

**Integration interface for Agent A (roadmaps).** Nothing here calls or changes `RoadmapEngine`. If the main roadmap should show exam study, read `GET /api/v1/exams/:examId/plan`; the response holds `items[] {topicId, topicName, kind, hours, week, weekStarts, status}` and `totals`. Display it as an exam track beside career milestones, without merging the hours into career readiness. Marking items done stays with `PATCH /exams/:examId/plan/items/:itemId`.

## 5. Data model (additive; new collections only)

| Collection | Holds |
|---|---|
| `ExamAttempt` | The user, exam, syllabus version, mode, items (question, topic, response, outcome, marks), section timers, deadline, score and timestamps |
| `ExamStudyPlan` | One per user and exam: hours per week, start date, items (topic, kind, hours, week, reason, status, completion time) and the number of regenerations |

## 6. Tests

**`backend/src/tests/exam_prep.test.ts`:**
- **Definitions:** official sources with dates, disclaimers, acyclic prerequisites, and the official sections.
- **Bank:** 80 questions in their sections and every section covered; 35 keys re-derived; no question claims to be official.
- **Marking:** −1/3 and −2/3 for MCQs only, NAT tolerance, exact MSQ, SSC +2/−0.5, response shapes.
- **Rules:** status thresholds, prerequisite-first recommendations, plans within the weekly hours, light revision for strengths.
- **HTTP:**
  - answers hidden until submission;
  - marks equal to the scheme applied independently;
  - 3 invalid answers rejected, and 4 isolation probes answering 404;
  - the GATE deadline (`TIME_UP`, auto-completed);
  - SSC sectional order and closing;
  - 4 invalid starts rejected;
  - per-user history;
  - plan validation and completed items kept;
  - no career skill evidence written.

**`e2e/tests/exams.mjs`, 12 browser steps:**
- sign-in required;
- both pilots listed with their official links;
- sources with dates, the pattern and limited-content flags;
- an untimed set with hidden answers, server marks equal to the per-question marks, and explanations;
- topic progress and recommendations;
- a plan within the weekly hours that keeps a completed item on regeneration;
- the content-shortfall message;
- SSC sectional timing, where a closed section cannot be changed (409);
- another account sees nothing;
- 390 px;
- a clean console.

## 7. Limits

- The banks are small: 47 and 33 questions. Several topics are flagged as having limited content. They are enough to exercise the full workflow, not to replace a full mock test.
- Timed practice scales the official timing to the chosen number of questions. Practice runs in the browser and is not proctored.
- The SSC scribe extension (20 minutes per section) is documented but not offered as a practice option.
- Syllabi change each cycle. A new cycle needs a new definition with its own sources, while attempts keep their `syllabusVersion`.
