# Manual voice test plan (D1 recordings, D2 dictation)

D1 (3 points) and D2 (2 points) are awarded only after **you** run this plan on real hardware and send the results sheet, and any failures are fixed. Automated tests cannot stand in for a physical microphone or a real speech service, so nothing below is self-awarded.

## What is already verified automatically (2026-10-13, updated for Chrome)

| Check | Suite | Result | What it does not prove |
|---|---|---|---|
| Consent, retention, owner-only playback, replace, isolation, deletion, withdrawal, end-of-round deletion, failed-deletion retry | backend `voice_interviews`, `voice_retention` | Pass | Real devices |
| The same flows in the browser, with a stand-in recorder and recogniser | `e2e/tests/interviews.mjs` (23/23) | Pass | Any real capture or codec |
| **Real capture and codec path in Microsoft Edge 155 and Google Chrome Stable 155**: the browser's own fake capture device plays a generated 440 Hz tone; real `getUserMedia`, `MediaStream` track, `MediaRecorder` (WebM/Opus), upload, storage and the browser's decoder | `e2e/tests/voiceRealCodec.mjs` (12/12 in each browser, with a real-recogniser step and a keyboard-only step) | Pass in both: no microphone request before consent; 48,596-byte WebM/Opus; track `ended` after stop; decoded 3.00 s at 453 Hz (source 440 Hz), not silent; byte-identical after reload; second account 404 on list, play and delete; replacement dated as the new take; deletion final after reload; "until this round ends" deletes on conclusion; a **really refused** permission shows the message and typing still works | A physical microphone, real voices, a screen reader, other devices |
| Real speech API in Edge 155 and Chrome 155 | probe and suite | `SpeechRecognition` present in both; on-device recognition (en-US) unavailable in both; synthetic speech from Windows text-to-speech is not transcribed by either under automation | Whether recognition of a human voice is accurate |

**Defect found by the real-codec suite and fixed:** re-recording an answer kept the first take's date, because the database timestamps make `createdAt` immutable. The replacement is now a new record dated when it was made, which is what its retention counts from (regression check in `voice_interviews`).

**Chrome has been run automatically** (2026-10-13). Google Chrome Stable 155.0.8059.40 was extracted from Google's signed installer and run without a system install (`E2E_CHROME_PATH=<path to chrome.exe> E2E_CODEC_CHANNELS=chrome E2E_TEST_FILE=./tests/voiceRealCodec.mjs node run.mjs` in `e2e/`). The steps that still need a person in Chrome (A4, A5, B2–B4, C2–C4) are listed in [`MANUAL_VOICE_EVIDENCE.md`](MANUAL_VOICE_EVIDENCE.md) §2a and §4. The owner has chosen not to run them.

## Setup

- **App:** your Docker stack at `http://localhost:3000`. `localhost` is a secure context, so browsers allow the microphone there. Rebuild first so it includes the fix above: `docker compose up -d --build`.
- **Browsers:** Google Chrome and Microsoft Edge, current stable versions. Firefox as a third check if you have it: it has no speech recognition.
- **Microphone:** a working one (built-in is fine) and a quiet room. Headphones avoid echo during playback.
- **Account:** two fresh test accounts (A and B). Do not use real personal data; speak only sample answers.
- **Screen reader:** Narrator (Windows + Ctrl + Enter) or NVDA.
- Note the browser and version (`edge://version`, `chrome://version`), Windows version and the date.

## A. Recording (D1)

Do A1–A12 in **Chrome**, then again in **Edge**.

| # | Step | Expected |
|---|---|---|
| A1 | Sign in as A. Interview room → Enter Interview Studio. Look at the address bar | No microphone icon; nothing has been requested |
| A2 | Click "Record spoken answers" | A consent panel appears and focus moves into it. It says recordings stay on SkillBridge's server, only you can play them, they are not sent to any AI or other company, are not transcribed, do not change the score, and turning recording off deletes them all. Still no microphone request |
| A3 | Choose "for 7 days" and click "Allow recording" | Recording is switched on. The microphone is still not requested until you press "Record answer" |
| A4 | Click "Record answer", allow the browser prompt, speak for 10–20 seconds, click "Stop recording" | "Recording saved (N s)…" appears. The browser's microphone indicator **turns off** after stopping |
| A5 | Click "Listen" and play | Your own voice, audible and complete, with no clipping at the start or end |
| A6 | Reload the page and reopen the round | The recording is still listed and still plays |
| A7 | Click "Record again" and record a different sentence | The new take replaces the old; only one is listed, and it plays the new sentence |
| A8 | Click "Delete recording", then reload | It is gone and does not come back |
| A9 | Record again, then click "Turn off recording" and confirm | All recordings are deleted; nothing can be played |
| A10 | Record again. Open the developer tools (F12) → Network, click "Listen", copy the `/audio` request URL. Sign in as B in a private window and paste that URL into B's address bar | Refused (401, because a pasted URL carries no sign-in, or 404); nothing plays. The automated suites also check that B's signed-in requests get 404 |
| A11 | As A: turn recording off, turn it on with "until this round ends", record, answer, then "Conclude Round" | The recording is deleted when the round ends |
| A12 | Site settings (lock icon) → Microphone → Block. Reload and click "Record answer" | "The microphone could not be used…" is shown; typing and submitting an answer still works |

## B. Dictation (D2)

Do B1–B8 in **Chrome** and **Edge**; B6 in Firefox.

| # | Step | Expected |
|---|---|---|
| B1 | Click "Enable voice dictation" | A consent panel with focus in it. It says SkillBridge does not receive or store your voice and the browser vendor's service may process it. "Only on this device" is offered only if the browser supports on-device recognition (Edge 155 reported it does not, for English) |
| B2 | Choose "Allow my browser…", click "Dictate", speak two sentences | Words appear in the answer box while you speak or shortly after |
| B3 | Edit the dictated text by hand, then submit | Your edited text is what is stored and scored. The answer is labelled as dictated or mixed input |
| B4 | Say: "I used Redis and PostgreSQL with a token bucket rate limiter in Kubernetes" | Note how many technical words were right. Mistakes are expected; the text stays editable |
| B5 | Block the microphone, then click "Dictate" | "Microphone access was refused…" is announced; typing still works |
| B6 | In Firefox | Dictation is shown as unavailable with an explanation; typing works |
| B7 | Only if "Only on this device" is offered: choose it, disconnect the network, dictate | Recognition still works offline. If it does not, write that down |
| B8 | Click "Dictate", then click "Listening…" to stop; then "Turn off dictation" | Listening stops at once (the browser's microphone indicator turns off); after turning dictation off the Dictate button is gone |

## C. Keyboard and screen reader

| # | Step | Expected |
|---|---|---|
| C1 | Do A2–A5 and B1–B3 with the keyboard only (Tab, Shift+Tab, Enter, Space) | Every control can be reached and used, in a sensible order; focus is always visible |
| C2 | With Narrator or NVDA, open each consent panel | The panel title and its text are read |
| C3 | With the screen reader on, trigger A12 and B5 | The error messages are announced without moving focus by hand |
| C4 | With the screen reader on, record and stop | The button names ("Record answer", "Stop recording (N s / 180 s)", "Listen") are read |

## Results sheet

Reply with this table filled in (one row per step and browser). "Pass" or "Fail", and for a failure say what happened.

| Step | Chrome (version) | Edge (version) | Notes |
|---|---|---|---|
| A1 | | | |
| A2 | | | |
| A3 | | | |
| A4 | | | |
| A5 | | | |
| A6 | | | |
| A7 | | | |
| A8 | | | |
| A9 | | | |
| A10 | | | |
| A11 | | | |
| A12 | | | |
| B1 | | | |
| B2 | | | |
| B3 | | | |
| B4 (words right / total) | | | |
| B5 | | | |
| B6 (Firefox) | | | |
| B7 | | | |
| B8 | | | |
| C1 | | | |
| C2 | | | |
| C3 | | | |
| C4 | | | |

A screenshot of the console helps for a failure; please do not send the audio itself.

**Results so far:** see [`MANUAL_VOICE_EVIDENCE.md`](MANUAL_VOICE_EVIDENCE.md) (Edge and Firefox done by the owner; Chrome skipped by the owner, so D1 and D2 stay pending).

**How the points will be decided.** D1 is awarded when A1–A12 and C1–C4 pass in both Chrome and Edge (after fixes, if any). D2 is awarded when B1–B6 and B8 pass in both, B4's accuracy is recorded whatever it is, and B7 is either passed or honestly reported as not offered.
