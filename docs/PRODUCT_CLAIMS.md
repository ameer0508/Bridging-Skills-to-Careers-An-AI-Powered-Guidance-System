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

The signed-in shell (sidebar, top bar, account menu, phone drawer) and the Command Center (`/home`) were rebuilt in Aurora Elite (`frontend/src/layouts/`, `frontend/src/features/home/aurora/`). Pages not yet migrated keep their earlier dark design inside one dark container (`.sb-legacy-dark`, listed in `frontend/src/design/aurora/routes.ts`). That container goes away once every group is migrated.

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
