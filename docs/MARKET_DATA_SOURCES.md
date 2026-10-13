# Market data sources: assessment and decision

**First assessment (U4):** 2026-10-12/13, Adzuna, Remotive, NCS, PLFS, large job boards, O*NET.
**Second assessment (this revision):** 2026-10-13, the new candidates OnJob.io, JobTether, Hopin and DeUnemployment. Every page below was read on **2026-10-13** (UTC); terms change, so each finding is dated.

**Question.** Which free (₹0) sources permit which market uses, so that A1, C1–C5 and R4 (17 points) can be built honestly?

**Short answer.**
- **OnJob.io's jobs feed** grants one thing clearly: crawling, caching and republishing its *live* listings with a link back to each. SkillBridge now uses exactly that, for **A1** (live listings in the career comparison, off by default).
- No source grants the stored, historical, role-level data that **C1, C2, C4, C5 and R4** need.
- **C3**: OnJob's CC BY 4.0 salary figures may be reused, but they fail a validity check (below), so they are not shown as career salaries.
- The rest stays "unavailable", and a permission request to OnJob is drafted for the owner.

## 1. OnJob.io

### What was read

| Page | Relevant text (quoted) |
|---|---|
| [For job boards](https://onjob.io/for-job-boards/) | "OnJob.io's live listings are free to crawl, ingest and republish. Pull our Indeed-standard XML or JSON feed, refresh daily, and link applicants back to apply. That is it — no API key, no rate limit, no fee." · "License — free to integrate: Crawl, cache and republish every listing at no cost · Render our Google JobPosting structured data as-is · No API key, no quota, no commercial fee · Only ask: link each role back to its OnJob.io url to apply" · "Closed roles drop out of the feed automatically — re-crawl every 24h to stay fresh and avoid stale listings." · FAQ: "Any job board or aggregator can crawl, ingest and republish OnJob.io's live listings at no cost." |
| [Feed `jobs.json`](https://onjob.io/feeds/jobs.json) `license` object | `"type": "free-to-integrate"`, `"terms": "OnJob.io job listings are free to crawl, ingest and republish on your job board. The only request: link each listing back to its OnJob.io url so candidates can apply."`, `"refresh": "Re-crawl daily; closed jobs are removed from this feed automatically."` |
| [Terms of Service](https://onjob.io/terms/) (last updated June 2026) | Acceptable use: you agree not to "Scrape, harvest, or resell candidate data, or use automated tools to access the service without our written permission." Intellectual property: "OnJob.io, including its software, design, logos, and content, is owned by us or our licensors." · "AI match scores, salary predictions, and insights are estimates, not promises." |
| [Trends](https://onjob.io/trends/) and its downloads (`summary.json`, `sectors.json`, `cities.json`, `hiring-momentum.json`) | "Download this dataset … Free to reuse with attribution under CC BY 4.0." Each file carries `"license": "https://creativecommons.org/licenses/by/4.0/"` and `"attribution": "OnJob.io — https://onjob.io/trends (CC BY 4.0)"` |
| [Salary](https://onjob.io/salary/) and [Software Engineer salary](https://onjob.io/salary/software-engineer) | "Free to cite and republish under CC BY 4.0 with a link back to OnJob.io." Method: "A median is published only when at least 10 priced listings from 3 or more employers are live." No machine-readable salary download exists |

### What the data actually contains (measured 2026-10-13)

- **Feed:** 1 page, 859 live listings worldwide, of which **480 are in India** (by the `country`/`location` fields). Every India listing has a `skills` list and 342 state INR pay. Posting dates run from 2025-11-22 to 2026-10-13. Listings carry `descriptionHtml`.
- **Coverage per SkillBridge career is small.** Through the A1 matching rules, a real read (10:58 UTC) found live India listings for 11 of 20 careers (between 1 and 5 shown each), and none for Data Analyst, Frontend Engineer, Machine Learning Engineer, Cloud Engineer, Cybersecurity Analyst, UI/UX Designer, Product Manager, Embedded Systems Engineer, Financial Analyst and Health Informatics Specialist.
- **Employer field.** Several listings are posted by recruiting agencies under their own name, with the hiring company named only in the description (for example a "Sales Coordinator" posted by a consultancy for another firm). SkillBridge shows the field as given, as "posted by".
- **Trends aggregates:** `summary.json` gives 1,171 live listings, 617 open India roles, 298 employers and 85 Indian cities, plus the top 6 cities and categories (for example "Engineering 149", "Data & AI 134"). `sectors.json` reports 10 sectors, **every one flagged `"indexable": false`** by OnJob's own gate (100 roles and 5 employers), and seven of them have 0 India roles.
- **No history.** `hiring-momentum.json`, "the only genuine time series we own", returned `"available": false, "unavailableReason": "No lifecycle capture is present in this build."` and an empty series.
- **Salary buckets fail a validity check.**
  - "Software Engineer": median ₹6L, p25–p75 ₹3.5L–₹12.5L, 36 listings, as of 6 Oct 2026.
  - "Engineer": exactly the same figures from the same 36 listings.
  - The page's own "listings behind this number" include a *Piping Engineer / HVAC Engineer / HSE Officer / Fire Fighter* posting in Baghdad and Splunk/Linux roles in Brussels.
  - So the bucket is built from titles containing "Engineer", not software engineering. Showing it as the salary of SkillBridge's Software Engineer career would be false.

### Rights matrix

"Granted" means an official OnJob text grants it. Anything not granted is **blocked**.

| # | Use | Feed (`/feeds/jobs.json`) | CC BY 4.0 aggregates (`/trends/data/*`, `/salary`) | SkillBridge |
|---|---|---|---|---|
| 1 | Republish individual job listings | **Granted**: "free to crawl, ingest and republish … link applicants back to apply" | n/a | **Used (A1)**, each with its OnJob.io link |
| 2 | Cache and retain records | **Granted for live listings**: "Crawl, cache and republish every listing"; "re-crawl every 24h … avoid stale listings" | CC BY permits keeping copies of the published figures | Memory only; a fetch older than 24 hours is never shown |
| 3 | Persist records after a job closes | **Not granted.** The feed removes closed roles and asks for a daily re-crawl to avoid stale listings; nothing permits keeping them | n/a | **Blocked**: nothing is stored |
| 4 | Derive and publish vacancy counts | **Not granted** (republication is not aggregation) | OnJob's *own* counts may be reused with attribution, but only by OnJob category, city and sector, for one moment; sectors are marked non-indexable by OnJob | **Blocked / not used**: no count is shown; the comparison shows listings, not numbers |
| 5 | Derive advertised salary statistics | **Not granted** | Reuse permitted, but the role buckets fail the validity check above | **Not used** (C3 pending) |
| 6 | Mine descriptions for skill trends | **Not granted** | n/a | **Blocked**: descriptions are never read |
| 7 | Train or evaluate forecasting | **Not granted**, and no history exists to train on | Single snapshot; OnJob's own time series is unavailable | **Blocked** (C2 pending) |
| 8 | Statistics in user-specific recommendations | **Not granted** (depends on 4–5) | Category-level snapshots only; mapping "Engineering" to a career would be invented | **Blocked** (C5, R4 pending) |

### The apparent conflict with the general terms

The Terms forbid using "automated tools to access the service without our written permission". The jobs-feed page is OnJob's own published, written permission that names crawling the feed URLs ("Point your crawler at a feed … No key, no signup, no rate caps"). SkillBridge therefore reads it as follows:

- **Fetching the feed URLs** to republish live listings is permitted, because the specific grant covers the general clause for those URLs.
- **Automated reading of any other OnJob page**, including the salary and trends HTML, is not permitted. SkillBridge fetches no other OnJob page.
- The CC BY files were read once, by hand, for this assessment.
- **Uses 3 to 8 are not covered by the feed grant.** The feed grant speaks of job boards republishing listings, not of a stored market-intelligence corpus.

The operator must still set `SKILLBRIDGE_ONJOB_FEED_TERMS_ACCEPTED=true`, after reading the feed page, before anything is fetched. Asking OnJob to confirm (§5) would remove the remaining doubt.

## 2. Other new candidates

| Source | Licence (quoted) | What it contains | Verdict |
|---|---|---|---|
| [JobTether research](https://jobtether.com/research) | "The data and the figures in these studies are free to use under CC BY 4.0 … The one condition is attribution with a link" | Snapshot of 26 Sep 2026: 29,815 postings from 1,057 company career boards. Downloadable CSVs are per company, per ATS platform, per city and per experience bucket. Its own limits: "The sample is chosen … none of them reports that as a market trend." Only 0.36% of descriptions state rupee pay | **No role-level or skill-level data** and no history: cannot feed C1–C5. Usable at most as cited national context; not built |
| [Hopin fresher-hiring dataset](https://hopinjobs.com/reports/fresher-hiring-india.json) and [API docs](https://hopinjobs.com/docs) | Dataset `"license": "CC-BY-4.0"`. [Terms](https://hopinjobs.com/terms): you agree not to "Scrape, resell, copy, or reverse engineer Hopin except where allowed by law" | Updated 2026-10-12: 13,795 live fresher listings; top 10 roles (for example Software Engineer 564, Data Analyst 86), top cities and companies; one snapshot. Its methodology says it "continuously collects public job listings **from LinkedIn**, company career sites and major job boards". The public API serves listing-level data with no licence for storage or analysis | **Not used.** The CC BY label cannot cure upstream content taken from LinkedIn, whose terms forbid scraping, and the listing API carries no grant. A top-10 snapshot would also not meet C1/C2 |
| [DeUnemployment dataset](https://deunemployment.com/dataset) | "CC BY 4.0 — reuse them, credit us"; DOI 10.5281/zenodo.22865284 | October 2026 edition: 7.48 million postings, 82 countries. `postings_by_role.csv` is one row per role family worldwide with its top location (no India rows); the country table gives India 161,449 postings, 0.7% stating pay. "Aggregate only. The per-posting corpus is not redistributed" | **No India × role data**: cannot feed any item. National context only; not built |
| data.gov.in / NCS | GODL-India for published tables (first assessment) | State-level vacancy and earnings tables; no role or skill level | Unchanged from the first assessment (not re-read today): context only, no points |
| Employer ATS feeds (Greenhouse, Lever and similar) | Per employer | Listings on each company's board | Not assumed redistributable; no employer has granted SkillBridge anything. Not used |
| Adzuna | Aggregation "(including but not limited to vacancy counts, average salaries etc)" needs written consent | Indian listings | Unchanged: blocked until written consent at ₹0 |

**Not used under any circumstances:** Naukri, LinkedIn, Indeed, Foundit and similar sites, whose terms forbid scraping.

## 3. Decision per item

| Item | Points | Decision | Why |
|---|---|---|---|
| A1 | 3 | **Built**: live OnJob.io listings in the comparison | Use 1 is granted; listings are fresh (memory cache, at most 24 hours), attributable (each links to OnJob.io), India-only, matched by stated title rules, shown as "none" or "unavailable" where absent, and never presented as a market count. Off by default |
| C1 | 3 | Pending | Needs stored, dated records with history (uses 2–4 beyond live caching): not granted |
| C2 | 2 | Pending | Needs months of genuine history (use 7): not granted, and none exists anywhere free |
| C3 | 3 | Pending | Feed salary statistics are not granted (use 5); OnJob's CC BY salary buckets fail the validity check |
| C4 | 2 | Pending | Description mining (use 6) not granted |
| C5 | 2 | Pending | Needs valid, stable sourced statistics (use 8) |
| R4 | 2 | Pending | Same as C5 |

## 4. What stays true in the product

- The OnJob feed is the only external market-related source that can be switched on. It is off unless the operator sets both `SKILLBRIDGE_ENABLE_ONJOB=true` and `SKILLBRIDGE_ONJOB_FEED_TERMS_ACCEPTED=true`.
- Even then, listings are only republished. Nothing from the feed is stored, counted, averaged or mined.
- Every market, salary, trend, forecast and market-signal figure remains "unavailable", with its reason.
- Synthetic fixtures can be imported only as labelled test data, and have no effect on any user.

## 5. Permission request (for the owner to send; no answer has been received)

> **To:** OnJob.io (contact address on https://onjob.io/terms/)
> **Subject:** Permission request: academic, non-commercial use of OnJob.io listings for market statistics
>
> Hello,
>
> I am building SkillBridge, an academic career-guidance project for students in India. It is non-commercial and has no paid features. Following your jobs-feed licence, SkillBridge republishes your live India listings, each linking back to its OnJob.io page to apply.
>
> I would like to ask for permanent, royalty-free permission for the following, for academic use, with "Source: OnJob.io" attribution and a link on every figure:
>
> 1. keeping a dated record of listings from the daily feed after they close (title, employer, city, posting date, and listed skills; no descriptions or personal data);
> 2. publishing counts of listings per role and city over time;
> 3. publishing advertised-salary medians and ranges by role and city, with sample sizes;
> 4. computing skill frequencies from the listed skills;
> 5. training and evaluating simple demand forecasts on that history;
> 6. using these statistics to adjust the career recommendations shown to signed-in students.
>
> We fetch the feed at most a few times a day. If any of these uses is not acceptable, or you prefer different attribution wording, please tell me and we will follow it.
>
> Thank you,
> [Owner's name], SkillBridge

If OnJob grants uses 1–6 in writing, the existing market module (registered sources, licence checks, de-duplication, history, freshness and the "unavailable" states) can store the feed as a registered source. C1 and C4 could then be built first, then C3 (with role-validity checks), C5 and R4, and C2 once enough months exist.
