# Market data sources: assessment and decision (U4), 2026-10-13

**Question.** Is there a genuinely free (₹0) source whose terms allow SkillBridge to store and analyse dated job-market records for India, so the blocked items can be completed honestly?

| Item | Points |
|---|---|
| A1 | 3 |
| C1 | 3 |
| C2 | 2 |
| C3 | 3 |
| C4 | 2 |
| C5 | 2 |
| R4 | 2 |
| **Total** | **17** |

**Short answer.** No source was found that is free, covers India at the level of roles and skills, and permits storing and aggregating postings in a product. The market module therefore keeps showing "Market data unavailable", and none of the 17 points is claimed.

What was checked is below. Each finding gives its source. Terms change, so they were read on the date above.

## What the items need

- **C1 and C4:** dated postings (title, skills or description, location, date), stored and de-duplicated over time.
- **C2:** enough dated history to forecast and backtest.
- **C3:** advertised salaries by place, period and source.
- **A1, C5 and R4:** these feed C1–C3 into comparisons, recommendations and adaptation.

A source that only serves *current* listings can power live job search (X7, already done), but it does not provide history or aggregates unless its terms allow keeping and analysing them.

## Sources assessed

| Source | Cost | India | Role-level postings | Store and aggregate? | Verdict |
|---|---|---|---|---|---|
| **Adzuna API** ([terms](https://developer.adzuna.com/docs/terms_of_service)) | Free key; default 25 calls a minute, 250 a day, 2,500 a month | India listed (`in`, INR) by third-party clients; not confirmed on Adzuna's own page | Yes: titles, descriptions, salary where advertised | **No, without a licence.** Permitted uses are "Publishing Adzuna ad listings", "Publishing Jobsworth salary estimates" and "Personal research". Other use by a commercial, government or academic organisation is a 14-day trial, after which "a licence agreement may be required". Aggregation "(including but not limited to vacancy counts, average salaries etc)" needs written consent. Listings must be labelled "Adzuna". A January 2026 version filed on the UK G-Cloud site says such use may carry a subscription fee | Best candidate, but only with Adzuna's **written consent or licence**. Cost unknown |
| **Remotive API** ([README](https://github.com/remotive-com/remote-jobs-api)) | Free, no key | Remote jobs worldwide, not an India market | Yes, remote roles only | Display with attribution. Advises at most 4 fetches a day, delays jobs 24 hours, forbids passing jobs to other sites, and forbids using them to collect sign-ups. No permission to build statistics was found | Not representative of the Indian market. Could be a labelled extra listing source; does not satisfy C1–C4 |
| **National Career Service (ncs.gov.in)** | Free | Yes | Vacancies on the portal | **No public API.** data.gov.in lists aggregate tables such as "State-wise Number of Vacancies Mobilised Through NCS Portal" with "API: NA". The page blocks automated reading, so its exact licence text could not be fetched | Aggregate counts by state and sector, not by role or skill. Possible macro context only |
| **PLFS earnings** (MoSPI, via data.gov.in and [microdata.gov.in](https://microdata.gov.in)) | Free (microdata needs a free account) | Yes | No: earnings by state, gender, sector and broad occupation | Published tables on data.gov.in fall under the Government Open Data License – India, which allows commercial use with attribution per its gazette notification (not fetched directly). No redistribution terms were found for the unit-level microdata | Official wage statistics, but not advertised salaries for SkillBridge careers. They cannot be presented as C3 "salary insights by career" |
| **Large job boards (Naukri, LinkedIn, Indeed, Foundit)** | n/a | Yes | Yes | No free API for this use. Their terms forbid scraping | Excluded |
| **O*NET / BLS** (already used for E1) | Free | **United States only** | Occupation profiles; BLS wages | Allowed with attribution | Not Indian market data; must not be shown as such |

## Options for the project owner

1. **Ask Adzuna for written consent or a licence** to store Indian listings and show aggregates (counts, advertised salary ranges) with "Adzuna" attribution.
   - If they grant it at no cost, the existing adapter path can be finished. The market module already has registered sources, licence checks, de-duplication, history, freshness, and "unavailable" states for sparse or stale data.
   - C1, C3 and C4 could then be earned. C2 follows once enough months have accumulated. A1, C5 and R4 follow after that.
   - **This needs your approval and Adzuna's answer.** Paying a fee would break the ₹0 rule.
2. **Use official aggregates as context only.** Import the NCS state vacancy counts and the PLFS state earnings under GODL-India, with attribution, as a clearly labelled "national context" panel.
   - This is honest and free.
   - It does **not** satisfy C1–C5, because those are role- and skill-level items, so no points.
3. **Keep the current state.** Every market figure shows "unavailable" with the reason, and synthetic data never influences scores (asserted in suites `market_signals` and `career_market`).

**Recommendation.** Option 3 now, with option 1 started by you: a short request to Adzuna describing the student-guidance use, the attribution and the expected volume. Option 2 adds little and risks confusing national wage statistics with career salaries, so it is not built.

## What stays true in the product

- No live third-party call is made for market data. JSearch remains blocked by the zero-cost policy, and the live-source paths are exercised only with in-process stand-ins.
- With no licensed source registered, every market, salary, trend, forecast and market signal is shown as unavailable, with the reason.
- Synthetic fixtures can be imported only as labelled test data, and they have no effect on any user's figures.
