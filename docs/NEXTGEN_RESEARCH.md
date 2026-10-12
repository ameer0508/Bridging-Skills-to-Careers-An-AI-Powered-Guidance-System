# Research contributions: method, evaluation and limits

The expansion plan names four research contributions. This document records, for each one that
has been implemented, what the method is, how it was evaluated, what the result was, and what it
does not show. Every result below is produced by an automated test in this repository and can be
reproduced with `pnpm test`.

Status: **R1 and R2 are implemented and evaluated. R3 and R4 are not started.**

All evaluation uses synthetic profiles. Nothing here has been tried with real users, so nothing
here is evidence about usefulness, learning outcomes or employment.

---

## R1. Continuously adaptive career intelligence

### Problem

A user's career figures (matches, readiness, gaps, recommendations) are derived from their skill
evidence and a few other inputs. When an input changes, the figures must follow. Recomputing
everything on every event is wasteful and, done concurrently, can produce duplicate or
inconsistent records. Recomputing too little leaves stale figures on screen.

### Method

`RecalculationService` (backend) holds an explicit dependency table from event types to the
derived modules they can change:

| Event | Matches | Readiness and gaps | Recommendations |
|---|---|---|---|
| Resume processed | recompute | recompute | recompute |
| Skill evidence changed | recompute | recompute | recompute |
| Career data (taxonomy) changed | recompute | recompute | recompute |
| Target role changed | | | recompute |
| Interview completed | | | recompute |
| Resume deleted | (caller clears what came from the resume; if assessed skills remain, it raises "skill evidence changed") | | |
| Roadmap progress | | | |

Three rules apply to every run:

1. **Ordering.** Modules are recomputed in dependency order: matches, then readiness and gaps,
   then recommendations.
2. **Serialisation.** Runs for one user are queued, so two events cannot interleave.
3. **Idempotence.** Before recomputing, the service hashes everything the modules are computed
   from (each skill's evidence score, the target role, the number of completed interviews, the
   scoring version and the taxonomy version). If the hash equals that of the last completed run
   and that run already covered the modules needed now, nothing is recomputed.

Every call writes a `RecalculationRun` record: trigger, modules recomputed and skipped, the
headline figures before and after, the two versions, and the duration. That record is the
measurable state change, and the user can read it in the Career Lab under *Activity*.

### Evaluation

Test suite `career_lab` (section R1), on a synthetic user:

| Scenario | Expected | Observed |
|---|---|---|
| A resume is processed | One run; all three modules recomputed; figures go from none to values | Pass |
| The target role is changed | One run; recommendations only; stored match records keep their ids | Pass |
| The same target role is submitted again | Recorded as a duplicate; nothing recomputed; figures identical | Pass |
| Ten identical triggers fired at once | Exactly one recompute, nine recognised as duplicates; no duplicate match records | Pass |
| The user confirms recent use of a skill (adds no points) | Recorded as a duplicate, because no score input changed | Pass |
| A what-if scenario is run | No run is recorded at all | Pass |
| A skill check is passed (suite `skill_assessment`) | One run naming the attempt; all three modules recomputed | Pass |
| The same skill check is passed again (no new points) | Recorded as a duplicate | Pass |
| A skill check is failed | No run is recorded | Pass |

The pre-existing regression suites (resume lifecycle, HTTP integration, interview questions and
others, 19 suites) all pass through the new service, which is the evidence that routing the
existing chain through it did not change any result.

### Limits

- The table is written by hand. A new derived module must be added to it; nothing detects a
  missing dependency automatically.
- The hash covers evidence *scores*. A change that leaves every score equal (for example a
  reworded evidence description) is correctly treated as "nothing to recompute", but so would a
  future module that depended on something outside the hash; such an input must be added to it.
- Serialisation is per backend process. With more than one backend instance, two instances could
  recompute for the same user at once. The deployment guide already says to run one instance.
- "Continuous" here means "on every event". Nothing recomputes on a timer, so a change in the
  outside world (for example job-market data, not yet implemented) does not reach the user until
  an event occurs.
- Duration is recorded but no performance claim is made: timings were only observed on a small
  in-memory database.

---

## R2. Explainable and counterfactual career matching

### Problem

A match score alone does not tell a user why it is what it is or what would change it. A
counterfactual explanation answers "what is the smallest change that would move the score?"
For that answer to be trustworthy it has to be computed by the same rules that produce the real
score; an approximation that disagrees with the real score later would be misleading.

### Method

There is one scoring function, `CareerScoringEngine.calculateScore(requirements, skills)`, and it
is pure. `CareerScenarioService` builds an in-memory copy of the user's skills, applies
hypothetical changes to the copy, and calls that same function.

- **Baseline.** The response includes the user's exact current breakdown per requirement
  (status, evidence score, points earned and possible).
- **Hypothetical evidence.** A hypothetical project, role or certification earns the points the
  real evidence calculator would award (`EVIDENCE_POINTS`), including diminishing returns for a
  second and third project or role, the single-count rule for certifications, and the cap at 100.
- **Requirement-level differences.** For each career the response lists every requirement whose
  status or points changed, before and after.
- **Counterfactual search.** For one career, each requirement not yet backed by applied evidence
  is tried as a single change and ranked by score gain. A greedy search then adds the best
  remaining change repeatedly until a target score is met or no change raises the score.
- **Isolation.** Nothing is written. A scenario cannot alter the user's skills, scores or
  recalculation history.

The wording shown to the user states that the result is hypothetical and is not a prediction of
hiring outcomes.

### Evaluation

1. **Agreement with reality, end to end.** A synthetic user asks what a project using Docker
   would do. The same user then replaces their resume with one that really has Docker in a
   project, and the real pipeline recomputes every match. For all six careers stored as matches,
   the real score equals the hypothetical score exactly. For the careers not stored (score of 10
   or below), the hypothetical score is also 10 or below.
2. **Agreement of the evidence model, exhaustively over a grid.** For every combination of
   existing evidence for a skill (0 to 3 roles, 0 to 3 projects, with or without a
   certification) and each kind of addition (project, role, certification), plus a skill that is
   new to the profile, the predicted evidence score equals the score the real calculator gives
   when the resume really contains that addition: **100 of 100 cases**.
3. **Internal consistency.** The final score of a counterfactual path equals the score the
   what-if endpoint returns for the same set of changes. The projected score of a transition plan
   equals the what-if score for acquiring all of its skills.
4. **Properties.** Adding evidence never lowers any career's score. Each step of a counterfactual
   path raises the score. A target that cannot be reached is reported as not reached.
5. **Isolation.** After a what-if call the user's skills, match scores and recalculation history
   are byte-for-byte unchanged (checked through the API and in the browser).

### Limits

- **These are statements about the scoring formula, not about the world.** "Your match would be
  17%" means the formula would output 17 given that evidence. It does not mean an employer would
  rate the user that way, and it is not a probability of anything.
- The agreement test proves the hypothetical engine matches the *evidence-point model*. It does
  not prove that the resume parser would detect the evidence in a real document; a project
  written in a way the parser does not recognise would earn nothing in reality.
- The greedy search is not guaranteed to find the smallest set of changes. With the current
  additive scoring it finds a good one; a counter-example would need requirements that interact,
  which the formula's missing-required penalty makes possible in principle.
- A hypothetical project for a skill that is new to the profile includes the 10 points for being
  listed in a resume. A real portfolio project for such a skill earns the project points only, so
  the two differ by those 10 points; for a skill already on the profile they agree exactly
  (suite `portfolio`).
- Counterfactual candidates assume project-level evidence for each skill. Other routes
  (certification, a job) are available in the what-if form but are not searched automatically.
- No effort or time is attached to a change, because the system holds no data about how long
  skills take to learn. Two changes with equal score gain are not distinguished by difficulty.
- The career taxonomy (14 careers, 109 requirements) is curated by hand. Explanations are only
  as good as those requirement lists.

---

## R3. Adaptive next-best-action recommendations

Not started. Planned method and baseline are in the implementation matrix.

## R4. Market-aware career adaptation

Not started. It depends on dated market records (matrix item C1), which do not exist yet. No
market figures are shown anywhere in the Career Lab.
