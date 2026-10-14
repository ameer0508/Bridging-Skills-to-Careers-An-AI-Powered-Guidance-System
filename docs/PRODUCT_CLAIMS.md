# Product claims review (2026-10-13)

SkillBridge shows no invented endorsements, user counts, outcomes or technical capabilities. This page records what the public landing page said, what it says now and how that is tested.

## Rules

- **No people who are not users.** No names, faces, ratings, quotes or outcomes presented as customers. Example situations describe what the product does, without people, and say they are not customer stories.
- **No unmeasured numbers.** No user counts, success rates, salary or promotion outcomes, "precision" multipliers or readiness thresholds. Sample screens may show sample figures only under a visible sample label.
- **No capabilities that do not exist.** The page names the methods the code uses: weighted requirement scoring, a shared skill list with aliases, and PyMuPDF and pdfplumber. It names no model or library that is not installed or not used.

## Removed or corrected on the live landing page

| Where | Before | Now |
|---|---|---|
| Social proof | Three named people with stock-photo faces, a verified tick, 5 stars and first-person outcome quotes ("land an AI Engineer role in under 6 weeks"). Labelled "illustrative" in small text | "Example scenarios": three situations with the real features used at each step, no people, and a note that they are not customer stories and that SkillBridge has no user outcomes or reviews |
| Call to action | "Join thousands of ambitious professionals" | What uploading a resume gives you |
| Pipeline, trust and FAQ | "spaCy NLP", "Sentence Transformer vector embeddings", "cosine similarity between your skill vector and 500+ tech role profiles", "thousands of standardized role requirements", "custom entity recognition" | Weighted requirement scoring over 20 careers; a shared list of 148 skills with aliases; PyMuPDF and pdfplumber; values linked to their source line |
| Agents | "evaluates answer quality using Gemini 1.5"; "scans live hiring market feeds"; "probabilistic match percentages"; "ATS-optimized JSON" | Published rubric, with AI scoring only through an approved free provider; job search only with a licensed source, otherwise labelled samples; deterministic scores |
| Comparison | "10x Extraction Precision", "98%+ … similarity match", "Zero Application Waste", "automated ATS score tracking", "confidence scores" | What each feature does, with no figures |
| Interactive demo | "Powered by Gemini 1.5 & Custom Skill Embeddings", "Confidence: 99.2%" | "Simulation with sample data, not your results"; the invented confidence figure is removed |
| Digital twin | "98/100 ATS Score", "high compatibility with Tier 1 AI Engineer roles", "94.8% Career Match Readiness" | Described as an illustration with sample data, with each value marked "Sample" |
| FAQ | "upload multiple versions of my resume for different target roles" (not supported) | One current resume plus the Career Lab what-if |
| Hero | "Production Grade AI", "Vector Skill Graph" | "No paid AI required", "Evidence-linked skills" |

**Deleted.** Eleven landing components that were no longer rendered but still held invented testimonials ("Transitioned to $165k AI Role", "Trusted by Engineers"), statistics and claims, so they cannot return by accident:

`HeroSection`, `FeatureShowcase`, `StatisticsSection`, `TestimonialsSection`, `WhySkillBridge`, `TechShowcase`, `FinalCTASection`, `FAQSection`, `Footer`, `Navbar`, `InteractiveCareerJourney`.

## Aurora Elite landing page (2026-10-14)

The landing page was rebuilt in the Aurora Elite visual language (`frontend/src/features/landing/aurora/`, primitives in `frontend/src/design/aurora/`). It keeps every rule above:

- **Headline and promises:**
  - "Turn Your Skills Into Meaningful Careers."
  - "Free to use. No paid AI required."
  - "Every score explained from your evidence."
  - "You can delete everything, any time."
- **Numbers.** Every figure stated is a property of the product: 20 careers, 148 skills, 5 MB, eight skill checks, 21 project briefs. The sample screens (next best action, resume lines, career match, readiness, the what-if simulation, roadmap, interview, applications) carry an "Illustrative demo" or "Simulation with sample data" label. None claims users, outcomes, partners, a paid plan or a hiring prediction.
- **Honest limits on the page:**
  - Job listings are labelled demos unless a source is on.
  - Market figures say "unavailable" until a licensed source exists.
  - OCR values are guesses with their confidence.
  - Unsupported languages are refused.
  - Readiness "does not predict hiring".
  - Portfolios are public only when shared.
- **The signature scene** (`JourneyScene`, an original inline SVG of a path through mountains at sunrise) has an accessible name listing the five stages. Its motion stops under reduced motion.
- **Removed.** The sixteen previous landing components were removed with the page that used them (`AgentConstellation`, `CareerOSReveal`, `CareerTransformation`, `CareerUniverse`, `CinematicCTA`, `DigitalTwinSection`, `ExampleScenarios`, `ImmersiveFooter`, `ImmersiveNavbar`, `IntelligenceFAQ`, `IntelligenceHero`, `IntelligencePipeline`, `IntelligenceTrust`, `InteractiveComparison`, `LiveAIExperience`, `MarketIntelligence`). The shared `effects/` helpers stay.

## Aurora Elite app shell and Command Center (2026-10-14)

The signed-in shell (sidebar, top bar, account menu, phone drawer) and the Command Center (`/home`) were rebuilt in Aurora Elite (`frontend/src/layouts/`, `frontend/src/features/home/aurora/`). During the migration, pages not yet redesigned kept their earlier dark design inside one dark container (`.sb-legacy-dark`, listed in `frontend/src/design/aurora/routes.ts`). Both were removed in group 5, once every route had moved.

- **Removed claims:**
  - the sidebar's "OS v2.0" and "AI Engine Online" badges;
  - the account menu's invented "AI Systems Architect Track". It now shows the student's own goal, when one is set.
  - the boot overlay that ran a fixed 1.9-second sequence ("Verifying Security Tokens", "Establishing encrypted session", "Initializing AI Models", "SkillBridge OS v1.0"). None of these steps happened. It was a timer.
  - the old home copy ("Awaken your profile intelligence", "Priority Activation", "Market Radar") and the 67 Spatial and orbital component files behind it.
- **Every figure on the Command Center comes from stored data:**
  - Career match, readiness, the skills count, roadmap progress, the study plan, the ranked next steps and the streak;
  - skill gaps and skills by area;
  - the tracked-job pipeline, practice interviews, the resume summary and recent activity (`/activity`).
  
  A figure that has not been measured reads "Not measured yet" or "No roadmap yet", never 0%.
- **Match and readiness are measured against the closest catalogue career.** When that career differs from the student's stated goal, the hero says so ("measured against your closest catalogue career, …").
- **The assistant card states the AI status.** It says whether a language model is reachable. When none is, it says that answers come from the built-in rules and are labelled.
- **The next best action follows the server's rule** (resume → skills → goal → gap → practice → jobs), worded plainly.

## Stage D group 1: Resume, Careers, Readiness, Career Lab (2026-10-14)

`/resume`, `/careers`, `/readiness` and `/career-lab` were rebuilt in Aurora Elite and added to `AURORA_ROUTES`. API calls, scoring and workflows are unchanged.

- **Resume Intelligence.**
  - **Removed claims:** "Transformer NLP Engine Active", "Executing 14-stage section classification", a hard-coded "all-MiniLM-L6-v2" model, and a page count and column layout that were never measured.
  - **Skills grouped by their strongest stored evidence:** assessed, applied (role, project or portfolio), studied or certified, confirmed by you, or listed only. Each skill opens to show its sources and the points each one earned. "Inferred" is explained as a career-requirement status.
  - **Sections:** shown as found or not found, in the parser's own words, plus the completeness check. No percentage per section, and nothing presented as an ATS prediction.
- **Career Intelligence.**
  - The explorer shows the stored matches. The careers in the catalogue that have no match are listed as such, with no score.
  - Each match is explained requirement by requirement: importance, the evidence status (applied, listed, inferred or missing) and the points earned.
  - The O*NET note stays on every O*NET-informed card.
  - **Removed:** the "100% Verified" and "High Impact" badges, and the claim that completing gaps "will elevate your match score".
- **Career Readiness.**
  - Shows the stored tier, with its score boundaries, and the four weighted dimensions, each with the points it adds.
  - Explains how match and readiness differ for the same career. The page says readiness is not a probability of being hired.
  - **Removed:** the invented "Impact: -30%" and "-15%" fallbacks. Gap priority is shown as the stored priority out of 100.
- **Career Lab.** Same panels and figures. What-if results now animate from the current score to the scenario score and stay labelled "Hypothetical". Live listings stay labelled with their source.

## Stage D group 2: Roadmap, Skill checks, Practice projects, Portfolio (2026-10-14)

`/roadmap` and `/portfolio` were rebuilt in Aurora Elite and added to `AURORA_ROUTES`. The skill checks (Career Lab, Verify tab) and the public page `/p/:token` were rebuilt too. APIs, scoring, the evidence model and sharing rules are unchanged.

- **Roadmap.**
  - **Layout:** the stored phases on a path. Completed phases are marked done, the first unfinished phase is "You are here", and later phases are upcoming. An item waiting on a prerequisite shows "Do first" from the schedule.
  - **Figures:** each item's hours come from the schedule and say whether the resource stated them or they are assumed. Items can be started, completed, skipped and undone. Progress is the stored percentage.
  - **Interactions:** the readiness gaps for the career highlight the items that work on them. Study reminders can be switched on from the page; they are off by default, using the existing setting.
  - **Removed:** the decision simulator, the opportunity forecast, the course and certification sample panels, and a status bar claiming "98.4" confidence. The heuristic or sample figures behind them are no longer shown. Opening a resource never marks anything.
- **Skill checks.**
  - Same questions, scoring, attempt limits and evidence.
  - Added: a directory of the eight checks; progress counted from the questions answered; a quiet minutes-left note, updated every 30 seconds; and a confirmation before the irreversible submission, saying how many questions are unanswered. The review shows each answer with its explanation.
  - `/career-lab?tab=verify` opens the checks directly.
- **Practice projects.** Suggestion cards with the gap reason, the skills each project puts to work, the assumed effort and the hypothetical score. The brief (tasks and deliverables) opens in place. Taken-on projects show the tasks you ticked, labelled as your own record that changes no score.
- **Portfolio.**
  - A showcase with the entry cards, the add and edit form in an accessible dialog, and the share panel stating "Sharing is off: nobody else can see your portfolio" or "Sharing is on…".
  - Entries keep the "Your own record, not checked" label. Only a passed skill check shows "verified by skill check".
  - The public page shows only shared entries and never the owner's e-mail. The owner's name appears only when they allow it.

`e2e/tests/group2.mjs` (16 browser steps) checks:
- signed-out access is refused, and the private endpoints answer 401;
- roadmap completion survives a reload, and undo and skip work;
- gap focus, details and the keyboard toggle; the reminder opt-in is stored;
- project briefs open; the skill-check confirmation, cancelling it, and the server-scored review;
- portfolio privacy through the public link;
- axe on every screen and dialog; reduced motion; no sideways scrolling at 1440, 1024, 768, 390 and 360 px; the load-failure notice; a clean console.

## Stage D group 3: Interviews, Voice, Technical assessment, Exams (2026-10-14)

`/interview-agent` (with `/interview-agent/assessments`), `/interviews` and `/exams` (with `/exams/:examId`) were rebuilt in Aurora Elite and added to `AURORA_ROUTES`. The following are all unchanged:
- question selection, rubrics, follow-ups and technical scoring;
- exam questions, timing and submission;
- voice consent, retention, playback and deletion.

- **Claims corrected.**
  - "Submit for AI Evaluation" is now "Submit answer for evaluation". When no model is reachable, answers are scored by the rule-based rubric, and every report already names the path that scored it. A note on the setup screen says so too.
  - Removed: "AI Interview Studio" telemetry copy, "Prepare for the Hot Seat", the "verified" wording for skills that only come from the resume, and the loading text "Connecting to Grounded AI Interview Studio".
  - The page header states that scores describe the answer, not the chance of being hired.
- **Voice.** States are shown only as the browser and backend actually report them:
  - unsupported dictation;
  - consent before the microphone is touched;
  - a refused microphone, announced in a live region;
  - recording, saved and playback;
  - withdrawal, which deletes every recording.

  No waveform or level meter is drawn, because the existing component does not measure the stream.
- **Technical assessment.** Same tasks and scoring. It still says nothing you type is run as code, and there is no run or terminal control.
- **Exams.**
  - A sticky question navigator marks each question answered or not, with a progress bar counted from the stored answers. Answer rows are larger touch targets.
  - The server timer, the submit confirmation and the timeout behaviour are unchanged. Results show marks, correct, wrong, unanswered and each answer's explanation.
  - No rank, percentile, cutoff or affiliation is shown.

`e2e/tests/group3.mjs` (13 browser steps) checks:
- signed-out access is refused;
- the scoring note on setup, and the absence of the old claims;
- unsupported dictation, consent before the microphone, the refused-microphone alert and consent withdrawal;
- the typed answer, the report's scoring source and keyboard access to history;
- a technical assessment from start to history;
- GATE CS with the navigator, the submit confirmation and per-question results; an SSC CGL timed set with a running server timer;
- axe on every screen and the consent panel; reduced motion; no sideways scrolling at five widths; a clean console.

## Stage D group 4: Jobs, Applications, Outcomes, Market, Salaries (2026-10-14)

`/job-agent`, `/opportunities`, `/applications`, `/application-outcomes`, `/market` and `/market/salaries` were rebuilt in Aurora Elite and added to `AURORA_ROUTES`. All of the following are unchanged:
- search, saving, status, notes, reminders and history;
- the outcome denominators and minimum samples;
- market sufficiency, source registration, synthetic separation and the five-employer rule;
- salary grouping by country, currency and period.

- **Claims corrected.**
  - On `/opportunities`, removed "Autonomous AI Opportunity Discovery", "RapidAPI JSearch Feed" (shown regardless of the actual source), "Verified Skills" for resume skills, "Executing live provider query" and "real-time telemetry". The header now says that sample listings are labelled and that a match score is not a hiring prediction.
  - On `/job-agent`, "Verified Competencies", "Skills Verified" and "Live Opportunity Inspection" now read as skills on your profile and listing details.
- **Unavailable is not zero.** With no registered market source, Market Evidence shows "Unavailable" for postings, months and undated counts (it previously showed 0), and "No source" for the retrieval date. Salary Insights shows "Data unavailable" and no figure.
- **Charts** use the light palette and keep their text tables. Their focus layer is off, so keyboard focus no longer lands inside chart wrappers that are hidden from screen readers.

`e2e/tests/group4.mjs` (15 browser steps) checks:
- signed-out access to the screens and the private endpoints is refused;
- outcomes are empty before any application, and never show 0%;
- sample listings are labelled, with no invented claims;
- a saved job keeps its notes and reminder after a reload;
- a saved job is not counted as applied; empty-form validation; a manual application is labelled "Added by you";
- outcomes count only applications and flag the small sample;
- market evidence is unavailable rather than zero, and synthetic data is labelled; salaries are unavailable;
- the honest header on `/opportunities`;
- keyboard filters; axe on every screen; reduced motion; no sideways scrolling at five widths; a clean console.

## Stage D group 5: AI assistant, Language and OCR, Employer, Administration, Settings, and every remaining route (2026-10-14)

`/ai`, `/agent`, `/resume-language`, `/employer-postings`, `/ai-observability`, `/settings` and `/profile` were rebuilt in Aurora Elite, along with every other signed-in route that still used the dark design. The temporary dark container (`.sb-legacy-dark`), `design/aurora/routes.ts` and the `.sb-legacy-dark` token scope in `styles/main.css` are gone, and the base components, dialogs, menus, toasts and portals were moved to the light design. All of the following are unchanged:
- the AI architect's requests and answers;
- language detection, translation, OCR confidence and deletion of stored text;
- employer self-declaration, publishing confirmations, reports and administrator review;
- administrator-only access to AI observability;
- profile and preference saving.

- **Dark leftovers fixed.** The AI architect's stylesheet (`features/ai/styles/neural_command_center.css`) no longer paints a near-black canvas and dark glass panels. Dark hero gradients, dark chart tooltips and `bg-black` panels behind dark text were replaced.
- **Contrast.** White text on cyan-600 and emerald-600 buttons (about 3.7:1) now sits on violet or emerald-700 (4.5:1 or more).
- **Reduced motion.** `GlassPanel` and `PremiumSection` show their content at once under reduced motion. Previously, a panel below the fold stayed invisible until it was scrolled into view.

`e2e/tests/group5.mjs` (14 browser steps) checks:
- signed-out access to the group 5 screens and the administrator API is refused;
- no legacy dark container is rendered and the document is light;
- no large dark surface and no error screen on the group 5 screens or on the 23 other remaining routes;
- Hindi guidance is kept after a reload and stored on the account;
- the employer disclosure is shown, with no "verified employer" claim and no review tab for a regular user;
- a target role edited in Settings is saved and kept after a reload;
- a regular user is refused AI observability, while an administrator sees it and the employer review tab on the light design;
- axe on every screen; reduced motion; no sideways scrolling at five widths; a clean console.

## Stage E: product-wide claims and polish (2026-10-14)

Every signed-in route, the sign-in and registration pages and the onboarding dialog were read in the running product at five widths. These claims were removed or corrected:

| Where | Before | Now |
|---|---|---|
| Sign-in and registration | "94.8% Vector Match", "Embedding Cosine Search", "ATS Index 98/100", "4.8x Velocity", "256-Bit Encrypted Workspace Auth", "Production Hardened v1.0", "AI System: Real-time guidance engine ready", "With AI Vector Precision" | What signing in opens, with no figures; "Passwords are stored hashed, never in plain text" (bcrypt); the guidance source stated as an AI provider when configured, otherwise labelled rules |
| "Forgot password?" | A pop-up saying "Password reset link sent to your registered email address"; no e-mail is sent | An inline note that reset by e-mail is not available and whom to ask |
| Sign-in form | "Remember this device for 30 days", which did nothing (sessions last 7 days) | Removed |
| Registration | Links to a Terms of Service and Privacy Policy that do not exist; a pop-up when unticked | A plain statement of what is stored and that the account can be deleted in Settings; an inline, announced message |
| Skill counts everywhere | "Verified Skills", "Verified Competencies", "verified skill graph" for every skill on the profile | "Skills on your profile", "skill evidence"; "verified" is kept only for a passed SkillBridge skill check |
| Status bars | "AI Gateway Connected", invented confidence (94.8 to 100), invented latency (105 ms, 160 ms), "Telemetry Live", "Live Synced" | What the page loaded and from where; no confidence or latency is shown because none is measured |
| AI assistant (`/ai`) | "Engine: Gemini Multi-Agent Orchestration", "Core Synchronized", "Resume ATS Index", a "Predictive AI" simulator returning fixed numbers (+8%, +12%, "40% faster", "Accelerated Placement Qualification"), "Ranked by ROI", "Mathematical Convergence Model" | Who answers, from the backend's own availability check (a language model, or built-in rules); "Resume completeness"; a link to the Career Lab what-if, which computes from real requirements; "In roadmap order" |
| Settings | "Connected Vault & SSO: 2 Services", "Security & Safety Index" (fixed 100), "AI Advisor Personalization" (fixed 98), made-up trend lines, counting animations, "Encrypted file", "Single sign-on", "automated recruiter matching" | Four figures from the account (profile completeness, closest match, skills, resume) shown as they are; the stored resume and session described as they are; "Commands" opens the command palette instead of a pop-up |
| Recommendations | "Live Sync", "analysed against market requirements", "maximize recruiter callback velocity", "Execute Top Priority Move" | Gaps against the target career's requirements, ranked by a fixed formula that does not predict hiring |
| Agent Orchestrator | "10 / 10 Active", "Workflow Latency 0ms", "COMPLETED" before any run, "OPTIMAL HARMONY", "Zero Contention", "Multi-Agent Orchestration Engine" | A module summary: what it reads, that no agent runs on its own, and the real time the last summary took, or "Not run yet" |
| Progress analytics | "Deterministic Daily Telemetry", "Authentic benchmark fit", "genuine daily snapshots" | Snapshots SkillBridge has recorded so far |
| Error screens | "Telemetry Connection Failed", raw "Request failed with status code 429" | What happened in plain words, with the technical text under "Technical details" |
| Pulsing "live" dots | About 30 decorative pings and pulses on static content | Removed; animation remains only where something is happening (recording, searching, loading) |

**Removed:** `components/experience/initialization/AIInitializationOverlay.tsx`, a timed "Verifying Security Tokens / Initializing AI Models" screen that was not rendered anywhere, so it cannot return.

`e2e/tests/polish.mjs` (11 browser steps) checks the sign-in and registration copy and the absence of browser pop-ups; 30 forbidden claim patterns on all 46 signed-in routes; the assistant's stated source; the Settings figures and the command palette; dialog keyboard behaviour; plain error states; the tablet drawer; and that no looping animation runs under reduced motion.

## Stage F: release audit corrections (2026-10-14)

Found by the release audit ([`AURORA_ELITE_RELEASE_AUDIT.md`](AURORA_ELITE_RELEASE_AUDIT.md) §3):

| Where | Before | Now |
|---|---|---|
| Recommendations, each action | "AI Rationale:" over a fixed sentence written by rules from the user's gaps | "Why:" |
| Recommendations, list heading | "Strategic Intelligence Stream: Chronologically ordered by impact leverage and career readiness delta" (the list is not chronological) | "Your actions: In the order chosen above; by default the action that closes the largest gap comes first" |
| Recommendations, related pages | "Downstream Execution Hubs: Pivot seamlessly into roadmap execution and neural guidance" | "Related pages: Continue in your roadmap or ask the assistant" |
| AI observability opened by a non-administrator | Refused requests and "Some of your data could not be loaded … Try again" | "Administrator access is required", with no request sent |

`e2e/tests/polish.mjs` now also forbids "AI Rationale", "neural guidance" and "Chronologically ordered".

## Pages inside the app

Pages whose content is built-in sample content are wrapped in `DemoWorkspace`, which shows the "Illustrative sample data" notice:
- diagnostics, graph, AI operations;
- coding, open source and brand;
- planning agent, personal memory and Career OS.

The analytics, learning and AI architect pages draw on the user's own data and mark estimates with `IllustrativeNotice kind="heuristic"`. The production bundle was checked for every component with hard-coded figures. Each one shipped either sits behind one of these notices or renders the user's data.

## Test

`e2e/tests/landing.mjs`, 10 browser steps, run as a visitor:
- the headline, both calls to action and the scene's accessible name;
- none of the forbidden claims after scrolling every section, now including paid plans, "verified employer", hiring probabilities and placement rates; no stock portraits;
- the scenarios note, with no faces;
- at least six sample labels and the simulation label;
- the what-if demo responds, exposes its toggle state and announces its result;
- Explore Careers scrolls to discovery; Start Your Journey and Sign in open their pages;
- keyboard: the skip link comes first with visible focus, and the main action is reachable;
- reduced motion: the headline is visible at once and the route is not drawn;
- 390, 360 and 768 px fit, and the phone menu navigates and closes;
- the console is clean.

`e2e/tests/accessibility.mjs` also runs axe on the page (0 serious or critical issues).
