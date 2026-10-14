# Employer postings (first-party, consent-based market records)

**Screen:** `/employer-postings` ("Employer Postings" in the sidebar), with three tabs:
- **Openings**, for everyone;
- **Post a job**, for organizations;
- **Review reports**, for administrators only.

**API:** `/api/v1/employer` (sign-in required; see `API_REFERENCE.md`). Cost: ₹0. No external service is called.

## Why it exists

No free source grants SkillBridge the right to store and analyse Indian job postings (`MARKET_DATA_SOURCES.md`). The one lawful way to get such records without paying, scraping or asking a provider is for organizations to submit postings themselves, and **grant the uses in writing when they publish**. This feature is that channel.

**It does not create a dataset by existing.** Until real organizations publish real postings, every market figure stays "unavailable". Test postings are SYNTHETIC TEST DATA and are removed after each test.

## What an organization agrees to (contribution terms `employer-contribution-v1`)

Shown in full before publishing. Publishing needs three separate confirmations:
- authorised to post for the organization;
- a real, open position;
- the uses below are granted.

The grant is stored with the posting (version, the seven uses, time).

| Use | What SkillBridge may do |
|---|---|
| `display_to_signed_in_users` | Show the posting with the organization name to signed-in users until it closes |
| `retain_after_closing` | Keep title, organization, place, dates, pay range and recognised skills as market history. The description is not kept in the market records |
| `count_postings_by_role_and_place` | Count postings by role, place and month |
| `advertised_salary_statistics` | Include the pay range in advertised-salary statistics |
| `skill_frequency_from_text` | Count skills read from title, description and skill list |
| `demand_forecasting` | Use the counts to test and publish cautious forecasts |
| `personalised_recommendations` | Use the statistics in users' recommendations |

- **Withdrawal:** at any time. The posting disappears at once from listings and from every market figure.
- **Account deletion** withdraws all of the user's postings.
- **No verification:** the terms state that SkillBridge does not verify organizations.

## How a posting is handled

| Step | Behaviour |
|---|---|
| Organization | Name (2–120) and optional https website. The only check is whether the sign-in e-mail domain matches the website domain, shown as a signal ("matches" / "does not match"), never as verification. Every listing is labelled **self-declared, not verified** |
| Draft | Title, description (80–8,000, stored and shown as plain text; markup removed), city, Indian state or UT (36), work mode, employment type, skills, optional pay and https apply link |
| Skills | Normalised to the shared lexicon (`excel` → `Excel`). Unknown names are kept apart, shown to the owner as "not recognised, so not analysed", and never counted. At least one recognised skill is required |
| Pay | Optional. INR only, per year (₹50,000–₹5 crore) or per month (₹5,000–₹50 lakh). Minimum ≤ maximum ≤ 10 × minimum. At least one bound |
| Publish | Needs the three confirmations. Opens for 60 days. Refused as a duplicate if the same organization already published the same role in the same place the same day, or already has it open |
| Market review | A posting enters the market records only after an administrator has reviewed the **organization's claim** (Review tab: website, e-mail domain signal, other accounts claiming the same name, published postings). Until then it is listed for job seekers ("not counted in market figures") but in no statistic. Changing the organization's name or website sends it back to review and removes its postings from the figures. Rejecting removes them too. Review is a check of the claim, **not independent verification**: listings stay labelled self-declared |
| Market records | Once reviewed, published postings go through the normal ingestion path (`MarketIngestionService`). That covers registered source, fingerprint de-duplication across sources, and lexicon skills read from title, description and list; the description itself is not stored there. The source is "Employer submissions on SkillBridge (organizations self-declared, not verified)" |
| Edit | Drafts: any field. Open postings: description, pay, skills, mode, type, link. Pay and skills edits update the market record. Title and place are fixed once published: close it and post again |
| Close | By the owner, or automatically after 60 days. Stays in the market records as history, last advertised on the closing date |
| Withdraw | Removed from listings and market records at once |
| Reports | Any signed-in user, once per posting, not their own; six reasons and an optional note. **Three reports hide the posting** and remove it from market records until an administrator restores it (reports are then cleared) or keeps it hidden |
| Limits | 10 new postings a day and 25 open postings per account |

## The market source and its safeguards

- **Registration.** The channel becomes a registered market source only once a reviewed organization's posting is held in the market records. It is checked at start-up and whenever a posting is added. Before that, every market screen keeps saying that no licensed source is connected; an empty channel is never presented as a source.
- **Minimums.** Every existing minimum still applies: postings, months, freshness, salary sample sizes and trend thresholds.
- **Employer diversity** (new, applied to every source; `services/market/employerDiversity.ts`). No count trend, salary figure, skill trend or usable career summary is given unless postings come from at least **5 named employers** and **no employer supplies more than half**. Below that, counts are shown with the reason "too few employers" or "one employer dominates". This stops one organization, or one account, from manufacturing a market figure.
- **Synthetic data stays apart.** Synthetic fixtures stay in their own dataset and never mix with these records.

## Abuse audit (2026-10-14)

| Risk | Control | Evidence |
|---|---|---|
| Spam | 10 new postings a day and 25 open per account; 60-day expiry; reports (3 hide a posting); administrator hide | `employer_postings` |
| Duplicate submissions | Same role, place and day from one organization refused; the same role already open refused. The same posting submitted by two accounts is merged by the ingestion fingerprint, so it is counted once | `employer_postings`; `market_intelligence` (fingerprints) |
| Forged organization claims | Labelled self-declared everywhere. E-mail domain signal shown. Accounts claiming the same name are shown to the reviewer. **No market figure from an unreviewed organization.** A rename needs a new review | `employer_postings` (review, rename, rejection); browser `employer.mjs` |
| Misleading statistics | Review gate, the employer-diversity rule (at least 5 employers, none above half) and every existing minimum. One person with several accounts and invented names cannot reach a figure without an administrator accepting each claim | market suites; `employer_postings` |
| Consent withdrawal | Withdraw per posting, or delete the account: removed from listings and every figure at once | `employer_postings`; `account_deletion` |
| Cross-account isolation | Owner-only actions answer 404 to anyone else; administrator routes check the role in the database | `employer_postings`; `security_sweep` |
| Report abuse (three accounts hiding a genuine posting) | Hidden postings go to the administrator, who can restore them (reports are then cleared) | `employer_postings` |

### Defects found and fixed in the second review (2026-10-14)

Each has a regression test in `employer_postings` §11.

| Defect | Fix |
|---|---|
| A withdrawal racing an approval or an edit could leave the withdrawn posting in the market records | Status changes are single conditional updates; edits never write a stale status; every mirror re-reads the posting and checks eligibility before and after adding it |
| After a rename, re-approval re-added published postings under the **old**, unreviewed name | Postings take the organization's current name; a record is allowed only under the reviewed name |
| Market records were not tied to their grant | **Eligibility rule.** A posting may be in the market records only if it is open or closed, its stored consent grants every derived use at the current terms version, its organization is approved, and it carries the reviewed name. `reconcileMarketRecords()` removes any record or merged reference that fails the rule; it runs at start-up and after every review |
| Two accounts posting the same vacancy under one name were merged into one record; withdrawing the first dropped the second's consented posting | The second gets its own record back |
| Bidirectional overrides and zero-width characters could make a name or title display as something else | Stripped from every submitted text |
| Simultaneous publishes | Exactly one succeeds (tested with three at once) |

**Residual risk.** Administrator review is human judgement, not verification. A determined person with a matching domain could still pass it. Until real organizations use the channel there is no data to mislead with.

## Privacy and security

- **Scope.** Owner-only drafts and actions (404 for anyone else). Administrator actions check the role in the database. Every list is bounded. Query parameters are validated.
- **Untrusted content.** Postings are third-party text: markup and control characters are removed, and they are shown as plain text. Links must be https and open with `noopener noreferrer nofollow`. Postings are never sent to an AI service.
- **Personal data.** The submitter's e-mail address is never shown, only whether its domain matches the website.
- **Account deletion** removes the user's organization, postings, reports they made, reports about their postings, and their market records and import batches (`account_deletion` suite).

## Tests

- **Backend `employer_postings`:**
  - terms;
  - organization validation and the domain signal;
  - 13 invalid postings;
  - skill normalisation;
  - isolation of every owner action;
  - all four publish confirmations;
  - the market mirror, which carries no description;
  - duplicates;
  - fixed fields;
  - edits reaching market records;
  - reports, auto-hiding and administrator restore;
  - close kept, withdraw removed, 60-day expiry;
  - flow into market summaries with provenance and minimums;
  - daily limit;
  - account deletion.
- **Backend `account_deletion`:** a published posting leaves the market records.
- **Market suites:** the employer-diversity rule in history, summaries (a dominant employer), salaries (12 of 13 ranges from one employer) and trends.
- **Browser `employer.mjs` (7/7):**
  - reached from the sidebar;
  - the empty state;
  - organization and draft;
  - unknown skill;
  - the full terms with three confirmations;
  - another user sees the self-declared label, filters, and reports once;
  - close and withdraw;
  - 390 px width;
  - a clean console.
- **Browser `accessibility.mjs`:** axe on `/employer-postings`.

## Limits

- **No real postings exist yet.** Nothing here is evidence about the Indian job market until organizations use it, and even then it describes only those organizations' postings.
- **Identities are not verified.** The e-mail domain signal is weak (a personal address never matches). Reports and the diversity rule reduce, but do not remove, the risk of fake postings.
- **Short history.** History builds only from the day postings start. Forecasts (C2) need months of it.
