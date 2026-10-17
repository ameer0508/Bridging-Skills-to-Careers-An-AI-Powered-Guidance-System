# Local AI explanations

SkillBridge's scores come from deterministic, rule-based engines (docs/SCORING.md). An
explanation puts one of those results into plain words. It never changes a score, a requirement or
progress, and it is never generated unless the user asks for it.

Phase 1 covers **career matches**. Readiness, skill gaps, roadmaps and next actions are not yet
explained.

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
