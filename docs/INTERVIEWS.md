# Advanced interviews (D-series)

**Branch:** `work/skillbridge-parallel-features` (Agent B). **Screen:** `/interview-agent`. **API:** `/api/v1/interviews` (sign-in required). No interview feature calls a paid service. Scoring uses the AI service only when a zero-cost provider is cleared; otherwise it uses the labelled rule-based rubric.

| ID | Status on this branch |
|---|---|
| **D5** role-specific rubrics | **Implemented and tested** (U H B) |
| **D4** technical assessments without code execution | **Implemented and tested** (U H B D) |
| **D3** answer-adaptive follow-ups | **Implemented and tested** (U H B) |
| **D6** historical performance comparison | **Implemented and tested** (U H B) |
| **D2** speech-to-text with typed fallback | **Implemented and tested** (U H B D); real recognition needs a manual check, see limits |
| **D1** voice interviews with consent, retention and deletion | **Implemented and tested** (U H B D); real microphone capture needs a manual check |

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

## D2. Speech-to-text with an unsupported-browser fallback

**Where audio goes.** SkillBridge never receives dictation audio. The browser's Web Speech API turns speech into text, either:
- on the device, where the browser confirms on-device recognition (`SpeechRecognition.available({processLocally: true})`); or
- through the **browser vendor's speech service**. In Chrome or Edge, that means Google or Microsoft receive the audio, under their own terms.

Only the resulting text is put into the answer box, where it stays editable. Only text is sent, stored and scored.

**Consent first, stored with the account.**
- Dictation is off until the user chooses, in a dialog that says the above:
  - "Only on this device" is enabled only when the browser confirms on-device recognition;
  - "Allow my browser's speech service";
  - "Not now".
- The choice is stored in `VoiceSettings.dictationConsent` (`none`, `on_device_only` or `browser_service`) via `GET` and `PUT /interviews/voice-settings`. Every change is appended to an audit history.
- *Turn off dictation* withdraws consent.
- If the user allowed on-device only and the browser cannot do it, dictation stays off and the screen says so.

**Fallback.**
- Typing works in every browser.
- Without the Web Speech API (for example Firefox), the room shows "Voice dictation is not available in this browser. Type your answer" and no dictation button.
- Recognition errors are explained, and the text written so far is kept:
  - microphone refused;
  - service unreachable;
  - no speech heard;
  - no microphone;
  - unsupported language.

**What is recorded.** Each answer stores `answerInputMethod`:
- `typed`, which is the default;
- `dictated`;
- `mixed`, meaning dictated and then edited.

No audio is stored for dictation. The lobby no longer says dictation is "supported locally", which was not true for browser-service recognition.

**Limits.**
- The browser test uses a stand-in `SpeechRecognition`, so it can check consent, transcript insertion, editing, errors and the fallback deterministically.
- Real recognition quality and vendor processing in Chrome or Edge were **not** tested automatically. They need a manual check with a microphone.
- The language is fixed to `en-US`.

**Tests:**
- `backend/src/tests/voice_interviews.test.ts` covers:
  - consent none by default;
  - changes audited once each;
  - 5 invalid updates refused;
  - settings per user;
  - `answerInputMethod` stored, with typed by default and invalid values refused.
- `e2e/tests/interviews.mjs` adds 4 browser steps:
  - nothing starts before consent, the consent text names the vendor, and on-device is disabled when unavailable;
  - dictated text appears, is edited and is stored as `mixed`;
  - an error message is shown and consent is withdrawn;
  - a browser without speech recognition gets the typed fallback and the typed answer is scored.

## D1. Voice interviews with consent, retention and deletion

A spoken round uses three pieces, all optional:
1. **Hear the question.** The question can be read aloud with an **on-device** browser voice. Network voices are never used, since they would send the text to a voice provider. Without an on-device voice, the button is hidden.
2. **Speak the answer.** The answer can be dictated (D2) or typed. The text is what is scored.
3. **Record the answer for self-review.** The user can listen back to their delivery.

**Recording rules.**
- **Consent and retention.** Recording is off until the user allows it in the room and picks how long recordings are kept:
  - until the round ends;
  - 7 days;
  - 30 days.

  This is stored in `VoiceSettings` (`recordingConsent`, `retentionDays`) with an audit history. The upload endpoint refuses without consent (403 `RECORDING_CONSENT_REQUIRED`).
- **Where recordings go.** Recordings are stored only on SkillBridge's server, under file names made from ids. They are:
  - playable only by their owner, with `Cache-Control: private, no-store`;
  - never sent to an AI or any third party;
  - never transcribed by SkillBridge;
  - never used for scoring.
- **Accepted audio.** WebM, Ogg, MP4 or WAV, checked by declared type **and** file signature, up to 5 MB. Durations are capped at 180 s. A new recording for the same question replaces the old one, and recording stops when the round ends (409).
- **Deletion.** Any of these deletes recordings:
  - deleting one recording, or all of them (`DELETE /interviews/recordings`);
  - **turning recording off**, which deletes every recording;
  - retention "until the round ends", which deletes the round's recordings when it completes (24 hours at most);
  - expiry: expired recordings are purged whenever recordings are touched and by `npx tsx src/scripts/purgeVoiceRecordings.ts`, which should run daily;
  - a shorter retention, which also shortens recordings already kept.

**API**, sign-in required; another user's session answers 404:

| Method and path | Purpose |
|---|---|
| `POST /interviews/:id/recordings` | Upload, multipart `audio` plus `questionIndex` |
| `GET /interviews/:id/recordings` | List |
| `GET /interviews/:id/recordings/:questionId/audio` | Play |
| `DELETE /interviews/:id/recordings/:questionId` | Delete one |
| `DELETE /interviews/recordings` | Delete all |

**Storage.** The default location is `<UPLOAD_DIR>/../voice-recordings`, which is git-ignored; `VOICE_RECORDING_DIR` overrides it. Docker deployments need it on a volume. Files are written with mode 600.

**Limits.**
- Browser tests use a stand-in microphone and `MediaRecorder`, so the consent, upload, playback, deletion and withdrawal flows are deterministic. Real microphone capture and codecs per browser need a manual check.
- The purge script is not scheduled automatically.

**Tests:**
- `backend/src/tests/voice_interviews.test.ts` covers:
  - consent required;
  - 7-day expiry;
  - owner-only byte-exact playback with no-store;
  - storage location never returned;
  - 6 bad uploads refused, including text disguised as audio, an image, oversize, no file and a bad index;
  - replacement;
  - 4 isolation probes;
  - deletion removing the file;
  - retention shortening;
  - deletion at round end;
  - no uploads after the round;
  - expiry purge;
  - withdrawal deleting everything.
- `e2e/tests/interviews.mjs` adds 3 browser steps:
  - no microphone access before consent, with consent text and retention;
  - record, listen and delete;
  - turning recording off deletes everything.
