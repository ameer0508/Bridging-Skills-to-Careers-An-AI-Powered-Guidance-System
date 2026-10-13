# Voice acceptance evidence (D1 recordings, D2 dictation)

Review dates: 2026-10-13 (Edge results), updated the same day with the owner's follow-up results (Edge A1–A3, Firefox B6, Edge C3 on `b7c2e91`). Procedure and award rule: [`MANUAL_VOICE_TEST_PLAN.md`](MANUAL_VOICE_TEST_PLAN.md).

**Award rule (unchanged):**
- **D1** is awarded when A1–A12 and C1–C4 pass in both Chrome and Edge.
- **D2** is awarded when B1–B6 and B8 pass in both, B4's accuracy is recorded, and B7 is passed or reported as not offered.

**Decision: D1 pending, D2 pending.** Every step required in Microsoft Edge now passes by the owner's hand, and Firefox B6 passes. **The only gap is Google Chrome**, which the award rule names and which the owner has explicitly chosen not to test. With no Chrome evidence of any kind, the rule is not met, and the points are not awarded. See §4.

## 1. Kinds of evidence

| Kind | What it proves | What it does not |
|---|---|---|
| **Owner, physical** | The owner, on Windows with a real microphone, Microsoft Edge and Windows Narrator | Other browsers |
| **Automated, real codec** | `e2e/tests/voiceRealCodec.mjs` in real Edge 155: real `getUserMedia`, capture track, MediaRecorder WebM/Opus, upload, storage and decoding, fed by the browser's **fake device** playing a synthetic 440 Hz tone; really refused permission; Edge's own speech recogniser on a refused microphone | A physical microphone, real voices, recognition accuracy |
| **Automated, stand-in** | `e2e/tests/interviews.mjs`: the same screens with a stand-in recorder and recogniser | Any real capture, codec or recognition |
| **Automated, server** | Backend suites `voice_interviews`, `voice_retention`, `security_sweep`; Docker smoke | Anything in the browser |

## 2. Owner's results (as reported; Microsoft Edge on Windows, real microphone, Narrator)

All results below are **reported by the owner**, not produced by automation. The owner explicitly skipped Google Chrome. B6 was run in Firefox.

### D1: recording

| Step | Owner (Edge) | Automated evidence | Status for Edge |
|---|---|---|---|
| A1 No microphone request before consent | **Pass** (follow-up): no microphone request before recording consent | Real codec: `getUserMedia` called 0 times before consent and 0 after consent until "Record answer" | Pass |
| A2 Consent panel, focus and wording | **Pass** (follow-up): "the recording consent flow worked"; C2: Narrator read the panel | Stand-in: focus moves into the panel; text states server storage, owner-only, no AI or third party, no transcription, no score effect, withdrawal deletes all | Pass |
| A3 Choose retention; browser asks for permission | **Pass** (follow-up): Edge asked for microphone permission only when the owner clicked "Record answer" | Retention choice stored (7 days, and "until this round ends") | Pass |
| A4 Real recording; microphone released on stop | Pass ("actual microphone recording worked") | Real codec: track `ended` after stop | Pass |
| A5 Audible playback | Pass | Real codec: decoded 3.00 s at 453 Hz (source 440 Hz), not silent | Pass |
| A6 Survives reload | Pass | Real codec: byte-identical after reload | Pass |
| A7 Re-recording replaces | Pass; the new take survived refresh | Real codec and backend (the replacement is dated as the new take; fixed in `8cc32fb`) | Pass |
| A8 Delete is permanent | Pass | Real codec: 0 listed and audio 404 after reload | Pass |
| A9 Turning recording off deletes all | Pass | Stand-in and backend | Pass |
| A10 Another account cannot play it | Pass (a pasted URL carries no sign-in, so this is weaker) | Real codec: B's **signed-in** list, play and delete all 404; backend 4 isolation probes; `security_sweep` cross-user replay | Pass (automated is the stronger evidence) |
| A11 "Until this round ends" deletes at round end | Pass | Real codec: 1 during the round, 0 after concluding | Pass |
| A12 Blocked microphone: clear error, typing works | Pass | Real codec with a really refused permission: message shown, no track opened, typed answer stored | Pass |

### D2: dictation

| Step | Owner (Edge) | Automated evidence | Status for Edge |
|---|---|---|---|
| B1 Consent panel; on-device offered only if supported | Pass | Stand-in: focus and wording; real Edge 155 API reports on-device (en-US) "unavailable" | Pass |
| B2 Words appear while speaking | Pass | (needs a real voice) | Pass |
| B3 Edited text is what is stored | Pass | Stand-in: stored as `mixed`, edited text stored and scored | Pass |
| B4 Technical vocabulary | **4 of 5 right**: Redis, token bucket, rate limiter, Kubernetes; **PostgreSQL wrong** | — | Recorded (an accuracy figure, not a pass/fail; the text stays editable) |
| B5 Blocked microphone: clear error, typing works | Pass | Real Edge recogniser with a refused microphone: message shown each time | Pass |
| B6 Firefox: dictation unavailable, typing works | **Pass** (follow-up, Firefox): unsupported speech recognition handled clearly; typing and submitting the answer worked | Stand-in: a browser without SpeechRecognition gets the typed fallback | Pass |
| B7 On-device, offline | **N/A**: Edge's consent panel showed on-device unavailable | Real Edge API: on-device "unavailable" | N/A (honestly reported as not offered) |
| B8 Stop releases the microphone; turning off removes Dictate | Pass | Stand-in | Pass |

### Accessibility

| Step | Owner (Edge + Narrator) | Status for Edge |
|---|---|---|
| C1 Keyboard only, visible focus | Pass (dictation, recording, stop and playback) | Pass |
| C2 Narrator reads both consent panels | Pass | Pass |
| C3 Errors announced without moving focus | First attempt: only one of the two permission errors was announced. Retest: both. **Follow-up retest on `b7c2e91` (with the hardening in §3): Narrator announced both the recording and the dictation permission errors without moving focus** | Pass; the first-attempt inconsistency stays recorded, see §3 |
| C4 Button names read (Record answer, Stop recording with duration, Listen) | Pass | Pass |

## 3. Investigation of the C3 inconsistency

- **Hypothesis.** Both controls created their `role="alert"` element only when an error occurred. Screen readers announce changes to a live region that already exists more reliably than a region inserted together with its text. A repeated identical error could also, in principle, be merged by React into no DOM change at all.
- **Reproduction attempt (real Edge 155, microphone really refused).**
  - Recording, pressed 3 times: each error inserted a new alert node.
  - Dictation with Edge's own recogniser, pressed 3 times: each error inserted a new alert node.
  - The DOM never failed to change, so the owner's first result could not be reproduced automatically. Narrator itself cannot be automated here.
- **Hardening applied anyway.** This follows the WAI-ARIA live-region guidance; it is not a reproduced defect.
  - Both controls now keep an empty `role="alert"` region mounted from the start (`AnnouncedError.tsx`, `useAnnouncedError.ts`).
  - Every error is rendered as a new node in it, so even an identical repeated message is a fresh announcement.
- **Regression check.** `voiceRealCodec.mjs` (denied-microphone step) asserts that both regions exist and are empty before any error, and that two refusals in a row add two nodes, for recording and for the real Edge recogniser. Edge: pass.
- **Confirmed on the hardened code.** The owner retested C3 on `b7c2e91`, which includes this hardening: both errors were announced without moving focus.

## 4. What remains

| Requirement | Status | Why it is still required |
|---|---|---|
| D1 in **Chrome** (A1–A12, C1–C4) | **Not tested**, by the owner's explicit choice. No automated run either: Chrome is not installed on the development machine | The award rule names Chrome. Capture, codec and playback depend on the browser |
| D2 in **Chrome** (B1–B5, B8) | **Not tested**, by the owner's explicit choice | Chrome's recognition is a different service (Google's) from Edge's |

Everything else in the rule is satisfied: Edge A1–A12, B1–B5, B8 and C1–C4 by the owner; B4 recorded (4 of 5); B6 in Firefox by the owner; B7 not offered in Edge.

**Consequence.** D1 (3 points) and D2 (2 points) stay pending for as long as there is no Chrome evidence. As instructed, no further Chrome testing is requested here, and the acceptance criteria are not changed.
