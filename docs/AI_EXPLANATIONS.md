# Local AI explanations

SkillBridge's scores come from deterministic, rule-based engines (docs/SCORING.md). An
explanation puts one of those results into plain words. It never changes a score, a requirement or
progress, and it is never generated unless the user asks for it.

Four results can be explained, each on the page that shows it:

| Subject | Where | Source of truth | Phase |
|---|---|---|---|
| Career match | Careers → "Explain this match" dialog | CareerScoringEngine (stored match and breakdown) | 1 |
| Readiness | Readiness page, "Readiness in plain words" | ReadinessCalculator (score, tier, dimensions, evidence basis) | 2 |
| Skill gaps | Readiness page, "Your gaps in plain words" | GapPrioritizer (gaps, order, impact), with each skill's importance and status from the match | 2 |
| Next-best action | Dashboard, "Why this step comes first" | NextBestAction ranking (the first action and its factors) | 2 |

Roadmaps are not explained.

## Verified summaries first, AI wording off by default

Testing showed that the local model can write plausible but wrong conclusions, and that pattern
checks cannot catch them. In an offline probe, 9 of 9 such statements got through the checks:
- comparisons ("nearly as important as");
- emphasis ("held back mainly by");
- advice that contradicts the weights;
- false limits ("cannot go above");
- unsupported superlatives ("the quickest way").

So each explanation has two parts.

1. **Verified summary**, always shown for readiness, skill gaps and the next action:
   - written by fixed templates (`backend/src/services/explanations/summaries.ts`) from the same
     verified facts, with no model involved;
   - states the exact score, tier, the four dimensions and their weights, the gaps in the engine's
     order (ties included) with importance, status and priority, and why the first action is ranked
     first (hypothetical score change, required skills addressed, what must be learnt first, effort
     and fit with your weekly hours);
   - labelled "Verified summary · written by SkillBridge's rules". It makes no comparison,
     prediction or market claim beyond what the engines compute.
2. **Experimental local AI wording**: only when the server sets `ENABLE_LOCAL_AI_EXPLANATIONS=true`.
   It is off by default and covers all four subjects, career match included. It is enforced on the
   backend (`config/aiFeatures.ts`). While it is off:
   - the API reports `aiEnabled: false`;
   - every generation request, including a direct `POST`, gets 403 `AI_EXPLANATIONS_DISABLED`
     after the usual sign-in and ownership checks, so another user's career is still 404;
   - no saved AI text is returned. Saved records are kept, not deleted, and reappear only if the
     flag is turned on again and they still match the facts.

   While it is on, everything below applies unchanged:
   - only the local model can generate;
   - the checks and the single retry still apply;
   - the busy, unavailable, timeout and rejected messages still apply;
   - the wording appears in its own section labelled "Experimental local AI wording", with the
     warning, and never replaces the verified summary.

Docker Compose passes the flag to the backend from `.env` (default `false`).

All four share one implementation: the backend `ExplanationService` (one cache per user, subject
and career; the shared generation lock; labelled failures) and the AI service's `/api/v1/explain/<subject>`
endpoints with shared checks (`ai/app/explanations/common.py`) plus checks per subject.

### Phase 2 checks per subject

- **Readiness** (`readiness.py`):
  - the tier is named only as computed;
  - a dimension is called strongest or weakest only if its score is the highest or lowest;
  - no dimension is given another dimension's score;
  - required-skill counts carry the right status;
  - a missing required skill is never presented as held;
  - readiness is never said to rest on one kind of evidence;
  - the dimension name "Education & Certifications" does not count as a credential claim.
- **Skill gaps** (`skill_gap.py`):
  - only the first gap in the prioritiser's order may be called the most important;
  - importance and status are stated as they are (missing, weakly shown, strength);
  - an impact score is attached only to the gap it belongs to.
- **Next-best action** (`next_action.py`):
  - the score change is stated exactly ("from 64 to 70", "by 6") and only as hypothetical ("would", not "will");
  - no other action or order is discussed;
  - the action is called what it is (skill check, practice project, portfolio entry);
  - durations appear only as the facts give them;
  - "learn first" and "fits your hours" are claimed only where true.
- **All subjects:** no market demand, trends or popularity; no SkillBridge data backs them.

## What the user sees

The career detail dialog (Careers → "Explain this match") has a section "Explanation in plain
words" below the requirement breakdown:

| State | Shown |
|---|---|
| No explanation yet | An **Explain with local AI** button. Opening the dialog only reads a saved explanation; it never runs the model. |
| Generating | "AI is thinking... Running locally..." with the elapsed time. The section is marked busy. |
| Ready | The text, "Written by local AI · *model*", the time it was written, a warning that AI text can contain mistakes and that the verified figures are authoritative, and **Facts given to the model**. Focus moves to the explanation. |
| Out of date | The saved text, a notice that the match has changed since, and **Refresh explanation**. |
| Busy, unavailable, timed out, rejected, another reply in progress | A distinct message for each, announced to screen readers, with **Try again**. Nothing is shown as an explanation. |
| No breakdown | "Nothing to explain yet." |

## How it works

1. **Backend** (`POST /api/v1/careers/:id/explanation`): loads the signed-in user's own match. Another
   user's match is simply not found (404). It builds a minimal fact sheet on the server from the
   stored match only; the request body is ignored. The sheet contains the exact score, the evidence
   share, each requirement's importance and status, the counts by importance, and the missing
   requirements with the most points at stake. No resume text is included.
2. The facts are hashed (SHA-256 of a stable serialisation plus a format version). A saved
   explanation with the same hash is returned without calling the model. Two identical requests at
   the same time share one generation.
3. A generation takes the user's single local-AI slot, which is shared with chat. A second
   generation for the same user gets 409 `REPLY_IN_PROGRESS`.
4. **AI service** (`POST /api/v1/explain/career-match`, internal key only):
   - The facts are validated as untrusted data. Names may only use the characters real skill names
     use, instruction-like wording is refused, and every count is recomputed from the requirement
     list and must agree with what was sent.
   - The request is restricted to the **local** provider. No external provider and no development
     mock is ever tried, and the reply's provider is checked again.
   - The prompt keeps the facts between `BEGIN DATA` and `END DATA` and says they are data, not
     instructions. It also states how the score is calculated.
   - The global local-model capacity limit and timeouts apply.
5. **Checks** (`ai/app/explanations/career_match.py`): the text is shown only if it passes all of
   them.
   - **Numbers:** every number, in digits or words, is a figure from the facts. "X of Y", "X%" and
     "X/100" must be exact pairs and values from the facts. Each count must be the right figure for
     the group and status it describes, so "4 are matched" fails when 3 are.
   - **Proportions:** words like "all", "none", "half" and "most" must agree with the counts, and
     "no other … are missing" must not leave a missing skill unnamed.
   - **Statuses:** a missing skill is never presented as held. A listed or inferred skill is never
     presented as demonstrated, or suggested as something to add. A held skill is never presented
     as missing.
   - **Importance:** a skill is only called required, preferred or supporting as it is in the facts.
   - **Scoring claims:** no "only proven skills count", no points per requirement, no "without X the
     score would rise", and no penalty for a missing skill that is not required.
   - **Skills:** no skill from the shared lexicon outside the facts, and at least one skill from the
     facts is named.
   - **Topics:** no salaries, employers, job postings, hiring chances, predictions, credentials or
     durations.
   - **Form:** plain text of 15 to 150 words, with no links, code or prompt echoes.

   A reply that fails gets one more attempt, with the reasons added to the prompt. No retry starts
   after 45 seconds, and every attempt is checked. Otherwise the result is 422
   `EXPLANATION_REJECTED` and no text. Token usage reports the sum of all attempts, as counted by
   Ollama.
6. The explanation is saved with the facts it was based on (one per user and career) and deleted
   with the account.

## Limits

- The checks are pattern-based. They catch the mistakes seen in testing, including real ones from
  the local model, but they cannot prove a paragraph true. That is why the warning is always shown,
  and why the verified score and breakdown stay above the explanation.
- On this hardware a warm generation takes about 3 to 5 seconds, and 9 to 11 seconds when the retry
  is needed. The first request after the model has been idle for 30 minutes adds about 25 seconds
  while the model loads.
- The local model answers one request at a time, with at most 2 running or waiting. A third
  simultaneous request is refused at once as busy.

## What CI verifies

The Docker CI workflow never downloads a model, so no CI run can contain a real explanation.

| CI step | What it proves |
|---|---|
| Explanations reach only a local model… (`e2e/ci/explanation-tests.sh ai-service`) | The running AI service refuses requests without the internal key, refuses facts with injected instructions or inconsistent counts (422), and, with no local model, answers valid facts with `AI_UNAVAILABLE` (503) and no text. |
| Smoke check "career explanation is answered honestly (none)" (`e2e/lib/explanationSmoke.mjs`) | Through nginx and the real backend: sign-in is required, another user gets 404, reading never generates, generating gives the labelled `AI_UNAVAILABLE`, nothing is stored, and the stored score is unchanged. A generated explanation fails this check in CI. |
| Explanation routes with a stub AI service (`… backend`) | The backend explanation suites (career match, and readiness, skill gaps and next action), run in the backend build image against a dedicated `skillbridge_ci_*` database (dropped before and after): ownership, identities, caching, staleness, request de-duplication, the shared chat lock, labelled failures, account deletion and unchanged scores. |
| Explanation checks in the AI service image (`… ai`) | The AI service's explanation tests for all four subjects (validator, untrusted facts, local-only routing, busy, timeout and rejected) against the image's own code, with a fake Ollama on loopback. Only pytest (pinned, about 1 MB) is installed into the throwaway container. |

Real explanation quality, latency and memory use still need a run with the real local Ollama model.
