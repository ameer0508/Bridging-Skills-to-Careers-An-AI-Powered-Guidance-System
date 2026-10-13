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

## Pages inside the app

Pages whose content is built-in sample content are wrapped in `DemoWorkspace`, which shows the "Illustrative sample data" notice:
- diagnostics, graph, AI operations;
- coding, open source and brand;
- planning agent, personal memory and Career OS.

The home, analytics, learning and AI architect pages draw on the user's own data and mark estimates with `IllustrativeNotice kind="heuristic"`. The production bundle was checked for every component with hard-coded figures. Each one shipped either sits behind one of these notices or renders the user's data.

## Test

`e2e/tests/landing.mjs`, 6 browser steps, run as a visitor:
- the page loads;
- none of the removed claims is present after scrolling through every section, and there are no stock portraits;
- the scenarios carry their note and show no faces;
- the sample screens are labelled;
- the 390 px layout fits;
- the console is clean.
