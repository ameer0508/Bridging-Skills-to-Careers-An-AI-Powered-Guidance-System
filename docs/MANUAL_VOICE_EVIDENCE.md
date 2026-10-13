# Voice acceptance evidence (D1 recordings, D2 dictation)

Review date: 2026-10-13. Procedure and award rule: [`MANUAL_VOICE_TEST_PLAN.md`](MANUAL_VOICE_TEST_PLAN.md).

**Award rule (unchanged):**
- **D1** is awarded when A1–A12 and C1–C4 pass in both Chrome and Edge.
- **D2** is awarded when B1–B6 and B8 pass in both, B4's accuracy is recorded, and B7 is passed or reported as not offered.

**Decision: D1 pending, D2 pending.** Every step the owner ran in Microsoft Edge passed, but the rule also requires Chrome (not tested by hand or automatically) and Firefox for B6 (not installed). §4 lists the smallest set that would complete them.

## 1. Kinds of evidence

| Kind | What it proves | What it does not |
|---|---|---|
| **Owner, physical** | The owner, on Windows with a real microphone, Microsoft Edge and Windows Narrator | Other browsers |
| **Automated, real codec** | `e2e/tests/voiceRealCodec.mjs` in real Edge 155: real `getUserMedia`, capture track, MediaRecorder WebM/Opus, upload, storage and decoding, fed by the browser's **fake device** playing a synthetic 440 Hz tone; really refused permission; Edge's own speech recogniser on a refused microphone | A physical microphone, real voices, recognition accuracy |
| **Automated, stand-in** | `e2e/tests/interviews.mjs`: the same screens with a stand-in recorder and recogniser | Any real capture, codec or recognition |
| **Automated, server** | Backend suites `voice_interviews`, `voice_retention`, `security_sweep`; Docker smoke | Anything in the browser |

## 2. Owner's results (as reported; Microsoft Edge on Windows, real microphone, Narrator)

The owner did not repeat the procedure in Google Chrome (by choice). Firefox is not installed.

### D1: recording

| Step | Owner (Edge) | Automated evidence | Status for Edge |
|---|---|---|---|
| A1 No microphone request before consent | Not documented | Real codec: `getUserMedia` called 0 times before consent and 0 after consent until "Record answer" | **Automated only** |
| A2 Consent panel, focus and wording | Not documented as a step; the owner's C2 (Narrator read the consent panel) covers the text | Stand-in: focus moves into the panel; text states server storage, owner-only, no AI or third party, no transcription, no score effect, withdrawal deletes all | **Partly owner (C2), automated** |
| A3 Choose retention; browser asks for permission | Not documented | Retention choice stored (7 days, and "until this round ends"); the permission prompt itself is not observed by automation (auto-accepted) | **Partly verified**: retention yes, permission prompt not observed |
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
| B6 Firefox: dictation unavailable, typing works | **Not tested** (Firefox not installed) | Stand-in: a browser without SpeechRecognition gets the typed fallback | **Not tested by hand** |
| B7 On-device, offline | **N/A**: Edge's consent panel showed on-device unavailable | Real Edge API: on-device "unavailable" | N/A (honestly reported as not offered) |
| B8 Stop releases the microphone; turning off removes Dictate | Pass | Stand-in | Pass |

### Accessibility

| Step | Owner (Edge + Narrator) | Status for Edge |
|---|---|---|
| C1 Keyboard only, visible focus | Pass (dictation, recording, stop and playback) | Pass |
| C2 Narrator reads both consent panels | Pass | Pass |
| C3 Errors announced without moving focus | **First attempt: only one of the two permission errors was announced. Retest: both were announced** | Pass on retest; the first-attempt inconsistency is recorded, see §3 |
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
- **Note.** The owner's C3 retest ran on the code before this hardening. A future manual check on the current code should confirm that it still announces both errors.

## 4. What remains, and the smallest set that completes it

| Requirement | Missing | Why it cannot be skipped |
|---|---|---|
| D1 in **Chrome** (A1–A12, C1–C4) | No manual run. No automated run either: Chrome is not installed | The award rule names Chrome. Capture, codec and playback depend on the browser |
| D2 in **Chrome** (B1–B5, B8) | No manual run | Chrome's recognition is a different service (Google's) from Edge's |
| B6 in **Firefox** | Not installed | The award rule names it; it is the real "no speech recognition" browser |
| A1 and A3 in Edge, by hand | Not documented | A1 is covered by automation (no request before consent); A3's permission prompt was not observed |

**Smallest set that satisfies the rule** (about 15 minutes, once Chrome and Firefox are installed; both are free):
1. SkillBridge then runs the real-codec suite in Chrome (`E2E_CODEC_CHANNELS=chrome`). That covers A1, A2 and A6–A11 in real Chrome, because those steps check state the server holds and show nothing the owner would see differently.
2. The owner, in **Chrome** with the microphone:
   - **A3–A5**: first permission prompt, record, listen.
   - **A12**: block the microphone.
   - **B1–B5**: dictation consent, speak, edit and submit, technical sentence, block.
   - **B8**: stop and turn off.
   - **C1–C4** while doing the above: keyboard, Narrator reading the consent panels, errors announced, button names.
3. The owner, in **Firefox**: **B6** only.
4. The owner, in **Edge**: reset the site's microphone permission (lock icon → Reset permissions), then **A1–A3**, about a minute.

If the owner prefers a full manual Chrome run instead of step 1, that also satisfies the rule.
