# E1: additional career domains (proposal, catalogue and integration patch)

**Branch:** `work/skillbridge-parallel-features` (Agent B). **Status:** the catalogue, preview API, preview screen and tests are implemented here.

**Not integrated:** Agent A owns the shared career taxonomy, the skill lexicon, matching, scoring, readiness, recommendations and roadmaps. None of them is edited on this branch. Under the plan's rule, these roles earn checklist credit only once they work across recommendations, readiness and roadmaps, which needs the patch in §5.

## 1. What exists today (read-only inspection)

- **Taxonomy.** `backend/src/seed/careerTaxonomy.ts` holds **14 careers** in 7 domains:
  - Software Engineering (5);
  - Data & Analytics (2);
  - Cloud & DevOps (2);
  - Business & Management (2);
  - Artificial Intelligence;
  - Cybersecurity;
  - Design.

  Requirements are editorial, with no stated source.
- **Seeding.** `CareerService.seedInitialTaxonomy` is idempotent per career: it inserts missing careers and their requirements, but **does not update requirements of careers that already have some**.
- **Versioning.** `utils/versions.ts` hashes `CAREER_TAXONOMY` into the taxonomy version (F2). Any change re-versions career scores.
- **Lexicon.** Skills are recognised only if they are in the shared lexicon (`backend/src/seed/skillLexicon.ts`, mirrored in `ai/app/resources/skill_lexicon.json` and protected by a drift test).

## 2. Proposed roles and domains

Six roles: two new roles in existing domains, and four in **new domains**.

| Role | Domain | O*NET-SOC basis | New domain |
|---|---|---|---|
| QA Automation Engineer | Software Engineering | 15-1253.00 Software Quality Assurance Analysts and Testers | no |
| Data Engineer | Data & Analytics | 15-1243.01 Data Warehousing Specialists (O*NET has no separate "Data Engineer") | no |
| Embedded Systems Engineer | Electronics & Embedded Systems | 17-2061.00 Computer Hardware Engineers | **yes** |
| Digital Marketing Analyst | Marketing | 13-1161.01 Search Marketing Strategists | **yes** |
| Financial Analyst | Finance | 13-2051.00 Financial and Investment Analysts (O*NET 31.0 has no knowledge ratings for it) | **yes** |
| Health Informatics Specialist | Healthcare Informatics | 15-1211.01 Health Informatics Specialists | **yes** |

The full requirements are in `backend/src/seed/careerDomainCatalogue.ts`, and on the `/career-domains` preview screen.

### Sources and how requirements were chosen

**Source.** The O*NET 31.0 Database, CC BY 4.0, by USDOL/ETA. The CSV files `occupation_data`, `software_skills`, `knowledge` and `related_occupations` were read on 2026-10-12 from `https://www.onetcenter.org/dl_files/database/db_31_0_csv/`. The attribution required by the licence is shown on the screen and stored as `ONET_ATTRIBUTION`, including the statement that SkillBridge modified the information.

Every requirement records its basis:
- **`onet_software`** names the exact O*NET "Workplace Example" strings for the occupation, with O*NET's own Hot Technology and In Demand flags. Every cited example was checked programmatically against `software_skills.csv`.
- Two first drafts failed that check and were changed:
  - "Apache Airflow" is not listed for 15-1243.01, so it was **dropped**.
  - O*NET has no generic "ETL software" entry, so **ETL is cited through the ETL tools O*NET does list**: Informatica PowerCenter, Talend Open Studio and Adeptia ETL Suite.
- **`onet_knowledge`** names a knowledge area and its O*NET importance (1–5). For example, Communication for Digital Marketing Analyst rests on English Language, importance 4.27.
- **`editorial`** is used where O*NET has no direct example, and says so:
  - Microcontrollers and RTOS (embedded);
  - Financial Modeling and Statistics (finance);
  - Healthcare Data Standards and Data Analysis (health);
  - Testing (QA).

**Editorial.** Which skills are included, and their importance and weight, are SkillBridge editorial choices informed by O*NET. They are not O*NET ratings. Most In Demand software is required or preferred; Hot-only or unflagged tools are preferred or supporting.

## 3. Mapping strategy

- **Skills.** Each requirement uses a SkillBridge skill name. 44 of 65 requirement slots use skills **already in the lexicon**, including Selenium, Postman, Jenkins, Jira, Kafka, Apache Spark, Hadoop, Tableau, Power BI, Excel, MATLAB, C, R, Statistics and Communication.
- **New skills.** 20 skills are **proposed** for the lexicon (`PROPOSED_LEXICON_SKILLS`), each with a category, aliases and any implied skill:

  | Area | Proposed skills |
  |---|---|
  | Testing | Playwright, Appium, JMeter |
  | Data engineering | ETL, Data Warehousing |
  | Embedded and hardware | Microcontrollers, RTOS, Verilog, VHDL |
  | Marketing and web | Google Analytics, SEO, Google Ads, Google Tag Manager, WordPress |
  | Finance and analytics | Financial Modeling, VBA, SAP, SAS |
  | Healthcare IT | EHR Systems, Healthcare Data Standards (HL7, FHIR, ICD-10, SNOMED CT as aliases) |

- **Clashes.** The tests check that no proposed name or alias collides with an existing lexicon entry. Short or ambiguous names (SEO, SAP, SAS, VBA) are case-sensitive, and EHR, EMR and GTM are exact-case aliases.
- **Before the patch.** Until the patch, a resume **cannot evidence** those 20 skills. The preview lists them as "not yet recognised" and counts them as missing.
- **Similarity.** Similar-career links point only at existing titles or at other proposed titles.

## 4. Compatibility with the 14 careers (tested)

- No proposed title collides with an existing career, and `CAREER_TAXONOMY` still has 14 entries on this branch.
- `CareerMatchingEngine`, `CareerService`, `RecommendationEngine`, `RoadmapEngine`, `CareerReadinessService`, `careerTaxonomy.ts` and `versions.ts` do **not** import the catalogue, so live matches, readiness, recommendations, roadmaps and the taxonomy version are unchanged.
- The preview uses the **same** `CareerScoringEngine.calculateScore`, called and never modified, on the user's own `UserSkill` evidence. It stores nothing.

## 5. Integration patch for Agent A (exact)

Apply after the second integration settles, in one reviewed change:

1. **Lexicon.** Append the 20 entries of `PROPOSED_LEXICON_SKILLS` to `SKILL_LEXICON` in `backend/src/seed/skillLexicon.ts`, and the same JSON objects to `ai/app/resources/skill_lexicon.json`. Bump `SKILL_LEXICON_VERSION` to 2. The existing drift test then guards the copies.
2. **Taxonomy.** Append each catalogue role to `CAREER_TAXONOMY`:
   ```ts
   { title, category, domain, description, requirements: c.requirements.map(r => req(r.skill, r.importance, r.weight)), similar: c.similar }
   ```
   Keep `careerDomainCatalogue.ts` as the provenance record, or add an optional `source` field to `TaxonomyCareer`. Optionally add reverse `similar` links on existing careers; seeding upserts links with `$setOnInsert`, so existing scores are untouched.
3. **Seeding.** No migration is needed. `seedInitialTaxonomy` inserts the 6 careers, their requirements and their similarity links on next start, and existing careers and their requirements are not touched.
4. **Versions and recalculation.** The taxonomy hash and lexicon version change, so new `IntelligenceSnapshot` and `RecalculationRun` rows carry new versions. Users' matches gain the 6 careers on their next recalculation; scores for existing careers do not change, because their requirements do not. Decide whether to trigger one recalculation per active user or let the next evidence change do it.
5. **Recommendations, readiness and roadmaps.** These modules work on any career with requirements. For useful roadmaps, add learning resources (B1 catalogue) and project templates for the new skills. Without them, roadmap items for those skills have no linked resources. This is the remaining dependency for credit.
6. **Tests to run after the patch:**
   - `career_domains.test.ts`, with its isolation assertions inverted so the catalogue is now in the taxonomy;
   - `scoring_accuracy`, `core_pipeline`, `career_lab`, `api_integration`, and the lexicon drift test;
   - AI `pytest`, for the lexicon mirror;
   - the smoke browser suite.

   Add a matching test per new role: a profile with that role's skills ranks it first among all careers.

**Risks.**
- The new careers can enter users' top matches and change the "top career" shown in places. Expected, but worth a release note.
- Aliases such as "informatica", "talend" (mapped to ETL) or "stm32" and "avr" (mapped to Microcontrollers) could create false positives in resume extraction. Review them against real resumes before release.
- O*NET describes the US labour market. The requirements are a reasonable skills baseline, not an Indian market measurement, and nothing here claims demand or pay.

## 6. API and screen (implemented here)

| Method and path | Purpose |
|---|---|
| `GET /api/v1/career-domains` | Catalogue with each requirement's basis and lexicon status (`present` or `proposed`), plus the O*NET attribution and licence links. Sign-in required; parameters → 400. |
| `GET /api/v1/career-domains/preview` | Read-only coverage of the 6 roles for the caller's own skills, with "not yet recognised" skills listed |

The screen is `/career-domains`, "More Career Domains" in the sidebar. It has:
- a dashed preview banner saying the roles are not yet part of matches, readiness, recommendations or roadmaps;
- a coverage table;
- a role card per role with a requirements table showing each basis;
- the attribution footer.

## 7. Tests

- `backend/src/tests/career_domains.test.ts` covers:
  - **Catalogue:** integrity, and compatibility with the 14 careers.
  - **Lexicon:** consistency, with 20 proposed skills and aliases clashing with nothing.
  - **Matching:** the four profiles each rank their role first with the shared scoring, and unrecognisable skills stay missing.
  - **Isolation:** live modules do not import the catalogue.
  - **HTTP:** sign-in required, attribution served, parameters refused, own-skills-only preview, and nothing stored.
- `e2e/tests/careerDomains.mjs`, 7 browser steps:
  - sign-in required;
  - the preview banner;
  - basis and not-yet-recognised badges;
  - attribution and licence link;
  - the empty profile;
  - 390 px;
  - a clean console.
