# Manual voice test plan (D1 recordings, D2 dictation)

The automated suites test voice features with a stand-in recorder and recogniser. Physical microphones, real codecs and real browser speech recognition can only be checked by a person. D1 (3 points) and D2 (2 points) are awarded only after this plan has been run and any defects fixed.

## Setup

- **Browsers:** Google Chrome and Microsoft Edge, current stable versions, on the machine you will use. Firefox as a third check if you can: it has no speech recognition.
- **Microphone:** a working one (built-in is fine) and a quiet room.
- **App:** the app running locally (`pnpm dev`) or the Docker stack, opened at `http://localhost` (a secure context; microphones are blocked on plain http from other hosts).
- **Account:** a fresh test account. Do not use real personal data. Speak only sample answers.
- Note the browser and version, the operating system and the date on the results sheet.

## A. Recording (D1)

| # | Step | Expected |
|---|---|---|
| A1 | Start an interview round in the Interview room. Before recording, look at the browser's address bar | No microphone indicator is shown; nothing has been requested |
| A2 | Click "Record spoken answers" | A consent panel appears and keyboard focus moves into it. It says recordings stay on SkillBridge's server, only you can play them, they are not sent to any AI or other company, are not transcribed, do not change the score, and turning recording off deletes them all |
| A3 | Choose "for 7 days" and accept | The browser asks for microphone permission (first time only) |
| A4 | Allow, record a 10–20 second answer, stop | A recording appears for the question with its duration. The browser's microphone indicator turns off after stopping |
| A5 | Play it back | Your own voice, audible and complete, with no clipping at the start or end |
| A6 | Reload the page and open the round again | The recording is still listed and still plays |
| A7 | Record the same question again | The new recording replaces the old one; only one is listed |
| A8 | Delete the recording | It disappears and no longer plays. Reloading does not bring it back |
| A9 | Record again, then turn recording off in the voice settings | You are told how many recordings were deleted; none can be played |
| A10 | Sign in as a second test account and try to open the first account's recording URL (copy it from the browser's network panel) | Refused (404); nothing plays |
| A11 | Set retention to "until this round ends", record, then finish the round | The recording is deleted when the round ends |
| A12 | Block the microphone in the site settings, then try to record | A clear message explains that the microphone is blocked and how to allow it; typing answers still works |

## B. Dictation (D2)

| # | Step | Expected |
|---|---|---|
| B1 | Click "Enable voice dictation" | A consent panel appears, with focus in it. It says SkillBridge does not receive or store your voice and that the browser vendor's service may process it; "Only on this device" is offered only if the browser supports on-device recognition |
| B2 | Allow the browser service, click "Dictate" and speak two sentences | Words appear in the answer box while you speak or shortly after |
| B3 | Edit the dictated text by hand, then submit | Your edited text is what is stored and scored. The answer is labelled as dictated or mixed input |
| B4 | Say a technical phrase ("I used Redis and PostgreSQL with a token bucket") | Note the accuracy. Mistakes are expected; the text stays editable |
| B5 | Deny the microphone, then click "Dictate" | A clear error; typing still works |
| B6 | In Firefox (no speech recognition) | Dictation is shown as unavailable with an explanation; typing works |
| B7 | If offered, choose "Only on this device" and dictate with the network disconnected | Recognition still works offline. If it does not, record that |
| B8 | Turn dictation off | The Dictate button disappears; nothing listens |

## C. Accessibility while using voice

| # | Step | Expected |
|---|---|---|
| C1 | Do A2–A4 and B1–B2 with the keyboard only (Tab, Enter, Space) | Every control can be reached and used; focus is visible |
| C2 | With a screen reader (NVDA or Narrator on Windows), open each consent panel | The panel title and text are read; errors are announced |

## Results sheet

Copy this table into an issue or reply, one row per step:

| Step | Browser/version | Pass/Fail | Notes (what happened, if different) |
|---|---|---|---|
| A1 | | | |
| … | | | |

Report any failure with the step number, the browser and what you saw. A screenshot of the console helps; please do not send the audio itself.
