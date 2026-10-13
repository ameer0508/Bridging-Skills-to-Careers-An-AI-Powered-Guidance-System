# Voice acceptance evidence (D1 recordings, D2 dictation)

Review dates: 2026-10-13 (Edge results), updated the same day with the owner's follow-up results (Edge A1–A3, Firefox B6, Edge C3 on `b7c2e91`). Procedure and award rule: [`MANUAL_VOICE_TEST_PLAN.md`](MANUAL_VOICE_TEST_PLAN.md).

**Award rule (unchanged):**
- **D1** is awarded when A1–A12 and C1–C4 pass in both Chrome and Edge.
- **D2** is awarded when B1–B6 and B8 pass in both, B4's accuracy is recorded, and B7 is passed or reported as not offered.

**Decision: D1 pending, D2 pending.** Every step required in Microsoft Edge passes by the owner's hand, and Firefox B6 passes. Google Chrome, which the award rule names, has now been exercised **automatically in real Google Chrome Stable 155** (§2a), but automation cannot perform the steps the plan defines with a physical microphone, a human voice and a screen reader (§4). The owner has chosen not to test Chrome by hand, so the rule is not met and the points are not awarded.

## 1. Kinds of evidence

| Kind | What it proves | What it does not |
|---|---|---|
| **Owner, physical** | The owner, on Windows with a real microphone, Microsoft Edge and Windows Narrator | Other browsers |
| **Automated, real codec** | `e2e/tests/voiceRealCodec.mjs` in real Edge 155 and real Google Chrome 155 (§2a): real `getUserMedia`, capture track, MediaRecorder WebM/Opus, upload, storage and decoding, fed by the browser's **fake device** playing a synthetic 440 Hz tone; really refused permission; Edge's own speech recogniser on a refused microphone | A physical microphone, real voices, recognition accuracy |
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

## 2a. Automated runs in real Google Chrome (2026-10-13)

**The browser.**
- Google Chrome Stable 155.0.8059.40, as served by Google's update service for Windows x64.
- Obtained from Google's signed full installer:
  - SHA-256 `c43d400e…1d97f06`, matching the hash Google published;
  - Authenticode signature valid, signer "Google LLC".
- Extracted into a scratch folder and run from there, so nothing was installed system-wide and the owner's Docker stack was not touched.
- The suites check that the browser reports the brand **"Google Chrome"** (Edge reports "Microsoft Edge").
- Harness option: `E2E_CHROME_PATH`.

| Suite (Chrome 155) | Result |
|---|---|
| `voiceRealCodec.mjs` | **12/12**. Each step listed below. Edge 155: 12/12 as well |
| `interviews.mjs` (stand-in recorder and recogniser; consent focus and wording, dictation flows, typed fallback) | **23/23** |
| `accessibility.mjs` (axe WCAG 2.0/2.1 A+AA on every page) | **53/53** (now 54 with the employer page) |

The 12 `voiceRealCodec.mjs` steps:
- brand check;
- no microphone request before consent;
- real capture track (41,834-byte WebM/Opus) released on stop;
- playback decoded at 456 Hz (source 440 Hz), 2.58 s, not silent;
- byte-identical after reload;
- second account 404 on list, play and delete;
- re-recording replaces, and deletion is final after reload;
- "until this round ends" deletes at the end of the round;
- clean console;
- a **really refused** permission, with errors announced again on retry and typing still working;
- the real Chrome recogniser: consent, start, its own "No speech was heard" for the synthetic tone, then the typed fallback stored;
- keyboard only: consent, record, stop, listen and dictate with Tab, Enter and Space, visible focus at each stop, focus moved into both consent panels, roles and names read from the accessibility tree.

**Synthetic speech does not reach the recognisers.**
- A sentence spoken by Windows' built-in text-to-speech ("Microsoft David") was fed through the fake device.
- Chrome's recogniser started, received audio and ended with `no-speech`.
- Edge's detected speech but returned empty results.
- No transcript, and therefore no accuracy, can be produced by automation here.

### What automation satisfies in Chrome, step by step

| Step | In real Chrome, automatically | Meets the plan's step? |
|---|---|---|
| A1 | No `getUserMedia` before consent or before "Record answer" | Yes (the indicator cannot show without a request) |
| A2 | Panel, focus, wording (stand-in suite and keyboard step in Chrome) | Yes |
| A3 | Retention stored; the request happens only on "Record answer" | Partly: the permission prompt itself is auto-accepted by the test flag and not observed |
| A4 | Real capture and encoder; track released on stop | **No**: the plan requires speaking into a physical microphone |
| A5 | Decoded audio has the source pitch | **No**: the plan requires hearing your own voice |
| A6–A11 | All pass | Yes |
| A12 | A really refused permission: message, no track, typing works | Yes |
| B1 | Consent panel; on-device not offered (Chrome reports it unavailable) | Yes |
| B2 | Recognition starts; nothing is transcribed from synthetic audio | **No** |
| B3 | Stand-in: edited text stored as mixed input | Partly: not with real recognised words |
| B4 | — | **No**: needs a human voice |
| B5 | Real recogniser with a refused microphone: message, typing works | Yes |
| B8 | Stop and turn off (stand-in and real "Listening" stop) | Yes |
| C1 | Keyboard only, visible focus | Yes |
| C2–C4 | Roles, names and live regions in the accessibility tree | **No**: the plan requires a screen reader reading them |

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

| Requirement | Status |
|---|---|
| D1 in Chrome: A4 and A5 with a physical microphone and a listener; C2–C4 with a screen reader | Not done. Automation covers every other D1 step in real Chrome (§2a) |
| D2 in Chrome: B2 and B4 with a human voice, B3 with real recognised text | Not done. Synthetic speech is not recognised in Chrome under automation |

Edge and Firefox are complete by the owner's hand.

**Consequence.** D1 (3 points) and D2 (2 points) stay pending. The award rule is unchanged, and no further manual testing is requested. Only a person in Chrome can close these steps: a physical microphone for A4 and A5, a human voice for B2 to B4, and a screen reader for C2 to C4.
