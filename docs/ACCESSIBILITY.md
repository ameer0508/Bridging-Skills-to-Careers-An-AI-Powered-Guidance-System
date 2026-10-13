# Accessibility and failure states (V3), 2026-10-13

## Method

The browser suite `e2e/tests/accessibility.mjs` runs axe-core 4.10.2 (MPL-2.0; a development dependency of the e2e package only) in Chromium on every screen of the app:
- 3 public pages, signed out;
- 47 signed-in pages, after a real resume has been processed, so pages show data rather than empty states.

It applies the WCAG 2.0 and 2.1 level A and AA rules, with reduced motion requested by the browser. A page fails on any **serious** or **critical** violation, or when it falls back to the error screen. Two further steps check the keyboard:
- sign-in with the keyboard alone;
- a visible focus indicator on the first control reached with Tab.

Run it with `E2E_TEST_FILE=./tests/accessibility.mjs node run.mjs` from `e2e/`. `A11Y_REPORT=1` lists every finding instead of failing.

## Found and fixed

| Finding | Pages | Fix |
|---|---|---|
| A screen crashed into the error boundary | `/github`, whenever the resume has a project | Parsed resume fields are objects (`{value, confidence, source}`), and the page rendered them directly. They are now read as text. The suite now fails any screen that shows the error boundary |
| Stack traces shown to users on the error screen | every screen that crashes | Technical details only in development. The error screen is announced as an alert |
| Controls without accessible names (selects, a range input, inputs labelled only by placeholder, a textarea) | `/register`, `/opportunities`, `/opportunity-agent`, `/graph`, `/events`, `/networking-agent` | `htmlFor`/`id` or `aria-label` with the visible meaning |
| Interactive controls nested in a "button" card | `/roadmap` (course and certification cards) | The card is no longer a button. Its title is the button that opens details, stretched over the card for mouse users. Bookmark and status buttons sit above it |
| Scrollable regions not reachable by keyboard | `/readiness`, `/diagnostics`, `/github`, `/career-os` | Named regions with `tabIndex={0}` |
| Focus lost when the voice consent panels open or close (the trigger button disappears) | interview room | Focus moves into the consent panel when it opens and back to the trigger, or to the control's container, when it closes. `interviews.mjs` asserts this; the assertion fails if the focus move is removed (checked) |

After the fixes: **0 serious or critical violations on 50 pages**, no screen crashes, and keyboard sign-in works (`accessibility.mjs` 52/52).

## Failure states and announcements (checked in the code and in the browser suites)

| Area | Behaviour | Where tested |
|---|---|---|
| Exam timers | `role="timer"` without constant announcements; one assertive "Less than one minute left"; expiry is enforced and shown by the server | `exams.mjs`, `exam_prep` |
| Resume-language warnings | Unsupported languages, scanned pages and damaged text are shown as warnings; errors use `role="alert"` and loading uses `role="status"` | `languages.mjs` |
| Voice controls | Consent before any microphone or recognition use; typed answers when the browser cannot recognise speech or the microphone is refused; errors announced | `interviews.mjs` (stand-in recorder and recogniser) |
| Job-search rate limit | A clear message that searching is limited, with saved jobs still reachable | `smoke.mjs` |
| Market data | "Market data unavailable", with the reason and no number, for no source, sparse, stale, synthetic or failed data | `market.mjs`, `salaries.mjs` |
| AI unavailable | Labelled rule-based scoring, or a 503 message and a fallback; never an invented AI result | `interviews.mjs`, backend `chat_reliability` |
| Administrator dashboards | Refusal message for non-administrators; the AI-observability scope is stated | `aiObservability.mjs` |
| Phone width | 390 px, with no horizontal overflow, on the pages added in this expansion | each feature's browser suite |

## Limits

- **Automated rules catch a share of accessibility problems, not all.** No manual screen-reader pass was made with NVDA, JAWS or VoiceOver, and none with a real switch device or magnifier.
- **Contrast.** axe reported no serious contrast failure in the rendered states. Hover-only, animated and gradient-text states are not fully covered by automated contrast checks.
- **Moderate and minor findings** (axe impact below "serious") are not enforced.
- **Pages wrapped as demo previews** are scanned, but their sample content is not a product flow.
- **Reduced motion.** The browser requests reduced motion and components use `useReducedMotion`. Whether every animation honours it was not measured.
