# Research contributions: method, evaluation and limits

The expansion plan names four research contributions. This document records, for each one that
has been implemented, what the method is, how it was evaluated, what the result was, and what it
does not show. Every result below is produced by an automated test in this repository and can be
reproduced with `pnpm test`.

Status: **R1, R2 and R3 are implemented and evaluated. R4 is not started in this branch.**

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
- **Hypothetical evidence.** A hypothetical project, role, certification or passed skill check earns
  the points the real calculation would award (`EVIDENCE_POINTS`), including diminishing returns for a
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
- The career taxonomy (20 careers, 174 requirements; six of them informed by O*NET, US data) is curated by hand. Explanations are only
  as good as those requirement lists.

---

## R3. Adaptive next-best-action recommendations

### Problem

A user with several gaps can do many things next: take a skill check, start a practice project,
record finished work. Ordering these by the importance of the gap alone ignores how much each
would actually add, what the user already has, whether a skill must be learnt first, and how much
time the user has.

### Method

`rankNextActions` (backend, `services/NextBestAction.ts`) is a pure function of the user's
skills, one career's requirements, the user's weekly hours and their progress. It is
deterministic: there is no learned model and no randomness.

**Candidates.** Only actions that would add evidence are considered:

| Action | Offered when | Evidence it would add |
|---|---|---|
| Take a skill check | The career requires a skill that has a skill check and is not yet verified | 15 points, once (SCORING section 12) |
| Do (or continue) a practice project | A brief exercises a requirement not yet shown in use | Project points for those skills (section 14) |
| Add a finished practice project to the portfolio | The project is marked complete and is not in the portfolio | Project points for its skills (section 15) |

**Factors**, all returned with each action:

| Factor | Source |
|---|---|
| Impact | Change in the career's match score when the action's evidence is added, computed by the shared scoring engine (the same figure the Career Lab what-if returns) |
| Gap severity | Number of required requirements the action addresses that are not yet shown in use |
| Existing evidence | Mean evidence score the user already has for the skills involved |
| Prerequisites | Skills not on the profile at all, which must be learnt before the action |
| Effort | The 15-minute limit for a skill check (a fact); a planning range for projects and for learning (assumptions, labelled as such) |
| Capacity | With weekly hours set: weeks needed, and whether the action fits into two weeks. Without them: not stated |
| Market demand | Declared, with no data. Value unknown, weight 0 |

**Formula** (weights are chosen values in match-score points, not fitted):

```
score = impact
      + 4 x min(2, required gaps addressed)
      + 3 if the action fits into two weeks of the user's hours (0 when no hours are set)
      - 2 if a skill must be learnt first
      + 0 x market demand
```

Ties are broken by less assumed effort, then by a fixed id order. The response also gives each
action's position under the baseline, so the effect of the formula is visible per action.

### Baseline

The same candidates ordered by gap importance only: actions addressing a required skill first,
then preferred, then supporting, with a fixed id order inside each group. It uses no impact,
evidence, prerequisite or capacity information.

### Evaluation

Test suite `next_best_action`. 60 synthetic profiles: for each of the 20 careers, a starter (two
requirements listed only, 5 hours a week), someone half-way (every other requirement used in a
project, 10 hours a week) and an experienced person with gaps (most requirements used at work, no
hours stated). For each profile both orderings are followed step by step: take the first action,
add its evidence, rank again.

| Measure | Adaptive ranking | Baseline | Profiles better / equal / worse |
|---|---|---|---|
| Mean match-score gain after three actions | 31.22 points | 28.87 points | 25 / 35 / 0 |
| Mean gain within 40 assumed hours | 5.8 points | 5.03 points | 13 / 46 / 1 |
| Mean assumed hours for the three actions | 107.67 | 119.03 | |

These figures are from the 20-career taxonomy (E1 added six careers, 2026-10-13). With the original
14 careers (42 profiles) they were 32.1 vs 30.43 points (16 / 25 / 1) after three actions and 6.36 vs
5.57 points (8 / 33 / 1) within 40 hours. The method did not change; the profile set grew.

Properties asserted on all 60 profiles (702 ranked actions): the same input gives the same order;
every score can be recomputed from the published factors and weights; every action has a positive
impact; the market factor is null with weight 0; no capacity claim is made without weekly hours;
learning time is always labelled an assumption; a verified skill is not offered for verification
again; a finished project is offered as a portfolio entry, not as a project to do.

Against a real profile through the API: each action's impact equals the what-if result for the
same change, and after really passing a suggested skill check the stored match score equals the
score the action predicted.

### Limits

- **The comparison is partly circular.** Impact is the largest term in the ranking and the
  evaluation measures score gain, so the ranking is expected to do at least as well as a baseline
  that ignores impact. The result shows the formula behaves as designed; it does not show that
  users who follow it learn more or get hired.
- The differences are small: equal in 35 of 60 profiles over three actions, and worse in one of 60
  within 40 hours. The cause of that case was not investigated.
- Everything is synthetic. No real user has followed these rankings and no outcome was observed.
- The weights (4, 3, 2) are chosen, not estimated. Different weights give different orders.
- Effort for projects and learning is an assumption; the "within 40 hours" row inherits it.
- Skill checks exist for 8 skills and project briefs for 15 projects, so the candidate set is
  small and for some careers is dominated by one kind of action.
- Greedy step-by-step choice is not guaranteed to be the best sequence.
- Market demand does not influence anything. Each action carries a market factor read from the
  market module's summary: `eligible` is true only for valid, fresh, genuinely sourced evidence
  (`usableForRecommendations`), and its weight is 0 in every case. Suite `career_market` shows
  that synthetic, sparse, stale, missing and inconsistent evidence, and valid evidence too, leave
  every score and rank unchanged.
- **Intended normalisation, not activated.** If a weight is ever given, the plan is: use only
  eligible evidence; compare a career's distinct postings with the median across the careers
  that have eligible evidence for the same location and period; cap the factor at plus or minus
  one step so demand can reorder near-ties but never outweigh a required gap; treat a career
  without eligible evidence as the median (no penalty for missing data). This must be evaluated
  against the current ranking on real sourced records before it is switched on. No such records
  exist yet, so nothing has been activated.

## R4. Market-aware career adaptation

Not started. It depends on dated market records (matrix item C1), which do not exist yet. No
market figures are shown anywhere in the Career Lab.
