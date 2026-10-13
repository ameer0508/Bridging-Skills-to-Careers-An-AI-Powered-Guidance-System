# E1: additional career domains

**Status:** integrated on 2026-10-13. Six careers, four of them in new domains, are part of the shared taxonomy and lexicon. Matching, readiness, recommendations, roadmaps, learning resources, practice projects and the Career Lab use them like any other career.

## 1. The careers

| Career | Domain | O*NET-SOC basis | New domain |
|---|---|---|---|
| QA Automation Engineer | Software Engineering | 15-1253.00 Software Quality Assurance Analysts and Testers | no |
| Data Engineer | Data & Analytics | 15-1243.01 Data Warehousing Specialists (O*NET has no separate "Data Engineer") | no |
| Embedded Systems Engineer | Electronics & Embedded Systems | 17-2061.00 Computer Hardware Engineers | **yes** |
| Digital Marketing Analyst | Marketing | 13-1161.01 Search Marketing Strategists | **yes** |
| Financial Analyst | Finance | 13-2051.00 Financial and Investment Analysts (O*NET 31.0 has no knowledge ratings for it) | **yes** |
| Health Informatics Specialist | Healthcare Informatics | 15-1211.01 Health Informatics Specialists | **yes** |

The taxonomy now has **20 careers with 174 requirements**: the original 14 with 109, plus these 6 with 65.

## 2. Sources and how requirements were chosen

**Source.** The O*NET 31.0 Database by USDOL/ETA, under CC BY 4.0. The CSV files `occupation_data`, `software_skills`, `knowledge` and `related_occupations` were read on 2026-10-12 from `https://www.onetcenter.org/dl_files/database/db_31_0_csv/`. The attribution the licence requires, including the statement that SkillBridge modified the information, is stored as `ONET_ATTRIBUTION` and shown on `/career-domains`.

**Provenance per requirement.** `backend/src/seed/careerDomainCatalogue.ts` records a basis for every requirement:
- **`onet_software`** names the exact O*NET "Workplace Example" strings, with O*NET's Hot Technology and In Demand flags. Each was checked against `software_skills.csv`.
  - "Apache Airflow" is not listed for 15-1243.01, so it was dropped.
  - O*NET has no generic ETL entry, so ETL is cited through the ETL tools it does list.
- **`onet_knowledge`** names a knowledge area and its O*NET importance (1–5).
- **`editorial`** marks a choice O*NET does not make directly, with the reason.

Which skills are included, and their importance and weight, are SkillBridge editorial choices informed by O*NET. They are not O*NET ratings.

**United States, not India.** O*NET describes occupations in the United States. The requirements are a skills baseline. They are not a measure of hiring demand, pay or job availability in India, and the app says so in two places:
- in `catalogueView().scopeNote` on `/career-domains`;
- on every match card for these careers (`career-source-note`).

No demand, pay or hiring figure is attached to them.

## 3. How it is wired in

- **Taxonomy.**
  - `seed/careerTaxonomy.ts` appends the six careers, derived from the catalogue, with `source: { kind: 'onet', code, title }`.
  - The original 14 entries are **byte-for-byte unchanged**: the test pins their hash, `f893cd3244e27676`.
  - Career scores depend only on a career's own requirements, so existing careers score exactly as before for the same evidence.
- **Seeding.**
  - `CareerService.seedInitialTaxonomy` inserts the missing careers and their requirements on start, and stores `source` on the new `Career` documents.
  - Existing careers and their requirements are not touched.
  - Similarity links are inserted with `$setOnInsert`.
- **Lexicon v2.**
  - `SKILL_LEXICON_VERSION` is now 2, with 148 skills.
  - The 20 new skills are in `backend/src/seed/skillLexicon.ts` and its mirror `ai/app/resources/skill_lexicon.json`, which the drift test keeps identical.
  - The aliases were reviewed for false positives in real resumes before acceptance:

    | Proposed alias | Decision |
    |---|---|
    | `informatica`, `talend` | Replaced by the product names `informatica powercenter` and `talend open studio`, because the bare names are employers |
    | `avr` | Dropped: also "automatic voltage regulator" |
    | `GTM` | Dropped: usually "go-to-market" in marketing resumes |
    | `mcu` | Became the exact-case `MCU` |

  - Remaining risk: `SAP` (case-sensitive) also matches "SAP Labs" as an employer.
- **Learning content.**
  - 26 official, free starting points were added to `seed/learningResources.ts`. Each returned HTTP 200 with the expected page title on 2026-10-13, and has no tracking parameters.
  - Redirects were followed to the canonical URL. One candidate (a HealthIT.gov EHR FAQ) redirected to a home page and was not used.
  - Of the 47 skills these careers use, **40** have a resource.
  - No resource is given for Verilog, VHDL (standards are paywalled), Communication, Data Analysis, Financial Modeling, SAS and EHR Systems, because no free first-party starting point fits the catalogue's rules. These gaps are named without a link, as for every other career.
  - Six practice briefs were added to `seed/projectBriefs.ts`, one per career, each exercising its required skills with free tools and public or synthetic data.
- **Onboarding.** Three preference domains were added: Digital Marketing & Analytics, Electronics & Embedded Systems, and Healthcare Informatics. Finance was already offered. The domain is a label; it does not change any score.

## 4. Existing users: recomputation

Stored matches, readiness and recommendations were computed against 14 careers.

**What runs.** `services/careers/TaxonomyRefreshService.ts` recomputes each affected user once, through the ordinary recalculation with trigger `taxonomy_changed`.

**Who is affected.** Users with skill evidence whose last completed match recalculation carries another taxonomy version.

**When.**
- The backend runs the refresh in the background 10 seconds after start, one user at a time.
- Set `TAXONOMY_REFRESH_ON_START=false` to switch it off.
- `src/scripts/refreshCareerMatches.ts [--dry-run]` runs it on demand. With `--dry-run` it only counts.

**What changes, and what does not.**
- Only derived records are rebuilt: matches, readiness and recommendations. Skill evidence, resumes, portfolios, plans and progress are not touched.
- Each run is a `RecalculationRun` with before and after figures, shown in the Career Lab activity as "Career data updated".
- Running it again finds nothing to do.
- The result counts `refreshed`, `unchanged` (same inputs as the last run) and `failed`.

**Matches below the threshold.** As for every career, a match is stored only above 10 points, so a user sees the new careers they have some evidence for.

## 5. API and screen

| Method and path | Purpose |
|---|---|
| `GET /api/v1/career-domains` | The six careers with every requirement's basis, `status: 'integrated'`, the US-source note, the O*NET attribution and licence links. Sign-in required; any parameter gives 400. |
| `GET /api/v1/career-domains/matches` | The caller's **stored** matches for the six careers: the same records as `/careers/matches`, or `null` when there is none. The old `/preview` endpoint is removed. |

**Screen.** `/career-domains`, "More Career Domains" in the sidebar, shows:
- the US-source note;
- the user's matches;
- a card per career with its requirement bases;
- the attribution.

Career match cards in Career Intelligence show the O*NET code and the US-source note for these careers.

## 6. Tests

- **`backend/src/tests/career_domains.test.ts`**
  - **Taxonomy:** 20 careers; the original 14 pinned by hash; sources; four new domains.
  - **Lexicon:** every requirement of the 20 careers resolves; new skills and aliases are read correctly; GTM, Informatica, AVR and lower-case "mcu" are not false positives.
  - **Learning content:** resources for 40 of 47 skills; a brief per career for its required skills; no tracking parameters.
  - **Pipeline:** a profile per career ranks that career first in the ordinary matches, with readiness, a roadmap, resources and project suggestions. A QA profile gets the official Playwright and JMeter links.
  - **Resume:** Playwright, Appium and JMeter in an uploaded resume become evidence and a QA Automation Engineer match.
  - **Refresh:**
    - a stale user is found, and a dry run changes nothing;
    - one `taxonomy_changed` run adds exactly the new careers the scoring engine says they qualify for;
    - evidence is unchanged, and a second run does nothing.
  - **HTTP:**
    - the integrated catalogue, with the US note and attribution;
    - own stored matches only;
    - 400 on parameters, and 404 for the removed preview.
- **`backend/src/tests/interview_integration.test.ts`:** exam practice does not change career evidence (E2–E4).
- **`ai/tests/test_resume_extraction.py`:** the real AI extractor reads 14 E1 skills from a resume, and the reviewed aliases do not misfire.
- **`e2e/tests/careerDomains.mjs`:** 8 browser steps.
  - sign-in required;
  - a QA resume upload, with QA Automation Engineer in the ordinary matches and the US note on its card;
  - the stored score shown on `/career-domains`, with no preview banner;
  - O*NET bases and the attribution;
  - an official resource link;
  - the 390 px layout;
  - a clean console.
- **Other suites:**
  - `career_lab` now expects the catalogue and what-if to cover all taxonomy careers (20).
  - The R3 evaluation, whose profiles are built from the taxonomy, now runs on 60 profiles; its figures are updated in `docs/NEXTGEN_RESEARCH.md`.

## 7. Limits

- O*NET is US data. Requirements are a baseline, not Indian market evidence.
- Importance and weights are editorial. No requirement was validated against Indian job postings, because no licensed source is registered.
- The aliases were reviewed by reading them, not against a corpus of real resumes. `SAP` can still match an employer name.
- Seven skills have no learning resource.
- The fake AI service used in backend tests recognises the E1 skills from a fixed list. The real service reads them from the shared lexicon, which the AI tests cover.
