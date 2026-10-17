# API Reference: SkillBridge

This document outlines the API guidelines, request/response models, and the standard health check endpoints for the **SkillBridge** platform.

---

## 🛠️ API Guidelines

- **Base URL:** `/api/v1`
- **Format:** All requests and responses must use the `application/json` format.
- **Status Codes:** Standard HTTP status codes are used to indicate request success or failure.

| Code  | Status                | Description                                       |
| :---- | :-------------------- | :------------------------------------------------ |
| `200` | OK                    | Request completed successfully.                   |
| `201` | Created               | Resource successfully created.                    |
| `400` | Bad Request           | Validation error or invalid payload formats.      |
| `401` | Unauthorized          | Missing or invalid auth credentials.              |
| `403` | Forbidden             | Insufficient permissions to access this endpoint. |
| `404` | Not Found             | Resource or route not found.                      |
| `429` | Too Many Requests     | Rate limit exceeded.                              |
| `500` | Internal Server Error | Unhandled server exception.                       |

---

## All endpoints

This table is checked against the route files in `backend/src/routes`. It lists every endpoint.
The detailed request and response examples further down were written earlier and cover only some
of them; where they differ from this table or from the tests in `backend/src/tests`, the table
and the tests are correct.

Rules that apply to every authenticated endpoint:

- Send `Authorization: Bearer <access token>`.
- Errors have the shape `{ "success": false, "error": { "code": "...", "message": "..." } }`.
- A record that does not exist and a record that belongs to another user both answer `404`.
- Malformed input answers `400` with code `VALIDATION_ERROR`.

### Health

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health` | No | Whether the backend and its database are up. Nothing else is reported. |
| `GET` | `/` | No | A one-line banner. In local development it serves the developer status page instead. |
| `GET` | `/api/v1` | No | API banner. |

### Authentication

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Create an account. Rate limited (15 / 15 min / IP). |
| `POST` | `/api/v1/auth/login` | No | Sign in. Rate limited (15 / 15 min / IP). |
| `POST` | `/api/v1/auth/refresh` | No | Exchange a refresh token; the old one is revoked. Reuse revokes every session. |
| `POST` | `/api/v1/auth/logout` | No | Revoke a refresh token. |

### Profile

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | Yes | The signed-in user's profile. |
| `PUT` | `/api/v1/users/me` | Yes | Update profile and onboarding fields. Unknown fields are rejected. |
| `DELETE` | `/api/v1/users/me` | Yes | Delete the account and everything stored about it. Body `password` and `confirm: "DELETE"`; a wrong password `403`. Removes resume files, recordings and every record with the account id; the token is refused afterwards. See `docs/PRIVACY_AND_RETENTION.md`. |
| `GET` | `/api/v1/users/me/career-snapshot` | Yes | One summary of resume, skills, readiness, roadmap, tracked jobs (with due reminders) and interviews. Feeds the Command Center. |

### Resume

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/resumes/upload` | Yes | Upload a PDF or DOCX (5 MB at most, content checked). 400 if a resume already exists. |
| `PUT` | `/api/v1/resumes/replace` | Yes | Replace the active resume. Skills, matches and readiness are rebuilt; roadmap progress is kept. |
| `POST` | `/api/v1/resumes/reprocess` | Yes | Run extraction again on the stored file. 202 when started, 409 `RESUME_PROCESSING` while a run is in flight, 404 without a resume. |
| `GET` | `/api/v1/resumes/me` | Yes | Active resume with parsed content, `parsingStatus`, `parsingError`, `isStuck` and `skillChanges` (added / removed / unchanged). `resume` is null when there is none. |
| `GET` | `/api/v1/resumes/download` | Yes | The stored file as an attachment. |
| `DELETE` | `/api/v1/resumes` | Yes | Delete the active resume and the skills, matches, readiness and active recommendations derived from it. Roadmaps, saved jobs and interviews are kept. |

### Skills, careers, readiness

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/skills/me` | Yes | Skills grouped by category with evidence score and proficiency. |
| `GET` | `/api/v1/skills/graph` | Yes | Skill relationship graph. |
| `GET` | `/api/v1/careers/matches` | Yes | Career matches with score, summary and per-requirement breakdown. |
| `GET` | `/api/v1/readiness` | Yes | Readiness per career with dimensions and gap analysis. |
| `GET` | `/api/v1/analytics` | Yes | Progress history. |

### Career Lab

Nothing in this group changes the user's skills or scores, except recording a confirmation (0 points) and passing a skill check (15 points, once per skill).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/careers/catalog` | Yes | Every career that can be compared or targeted. |
| `POST` | `/api/v1/careers/compare` | Yes | Body `careerIds` (2 to 4). Requirements, evidence and effort per career, plus `market` per career (state `sourced_valid`, `no_source`, `sparse`, `stale`, `synthetic` or `error`; a posting count with source, period and freshness only when `usable`) and `marketData`. Market evidence is read server-side from sourced records only; it cannot be supplied in the request. Also `liveListings` per career (state `listings`, `none`, `off` or `unavailable`; up to five live India listings from OnJob.io with title, employer, place, date and OnJob.io link; matching rule and read time; never a count) and a top-level `liveListings` scope note. Off unless the operator enables the OnJob feed (docs/MARKET_DATA_SOURCES.md). |
| `POST` | `/api/v1/careers/what-if` | Yes | Body `changes` (1 to 10 of `add_skill`, `remove_skill`, `add_project`, `add_certification`, `add_experience`, `pass_assessment`) and optional `careerIds`. Scores before and after with requirement-level changes. `400 UNKNOWN_SKILL` for a skill that is not recognised. Nothing is saved. |
| `GET` | `/api/v1/careers/:id/counterfactuals` | Yes | Ranked single changes and a path to `targetScore` (query, 0-100). |
| `GET` | `/api/v1/careers/:id/market-evidence` | Yes | Market evidence for one career: a posting count only for valid, fresh, sourced data, otherwise "unavailable" with the reason. |
| `GET` | `/api/v1/careers/:id/explanation` | Yes | The saved local-AI explanation of your match for one career, with the facts it was based on and whether the match has changed since (`stale`). Never runs the model. 404 for a career you have no match for. |
| `POST` | `/api/v1/careers/:id/explanation` | Yes | Experimental, off by default (403 `AI_EXPLANATIONS_DISABLED` unless `ENABLE_LOCAL_AI_EXPLANATIONS` is on). Returns the saved explanation if the match is unchanged (`cached: true`); otherwise the local model writes one from facts built on the server (the body is ignored). Errors: 409 `REPLY_IN_PROGRESS`, 422 `NO_EVIDENCE` or `EXPLANATION_REJECTED`, 503 `AI_BUSY` or `AI_UNAVAILABLE`, 504 `AI_TIMEOUT`. |
| `GET` | `/api/v1/careers/:id/explanations/:subject` | Yes | For your `readiness`, `skill-gap` or `next-action` result for one career: the verified `summary` (written by fixed rules from the facts, no model), `aiEnabled`, and the saved local-AI wording (only while `ENABLE_LOCAL_AI_EXPLANATIONS` is on). Never runs the model. 404 for an unknown subject or a career you have no such result for. |
| `POST` | `/api/v1/careers/:id/explanations/:subject` | Yes | Experimental local-AI wording for `readiness`, `skill-gap` or `next-action`: the saved wording if current, otherwise one written by the local model from facts built on the server (the body is ignored). 403 `AI_EXPLANATIONS_DISABLED` while the flag is off (the default); otherwise the same errors as the career-match explanation. |
| `GET` | `/api/v1/careers/transition-plans` | Yes | The caller's plans, each stage re-evaluated against current evidence. |
| `POST` | `/api/v1/careers/transition-plans` | Yes | Body `targetCareerId`. Builds or replaces the plan. `409 NO_SKILL_PROFILE` without a resume. |
| `DELETE` | `/api/v1/careers/transition-plans/:id` | Yes | Remove a plan. |
| `GET` | `/api/v1/skills/freshness` | Yes | When each skill was last shown to be in use, from dated evidence only. |
| `POST` | `/api/v1/skills/:id/revalidate` | Yes | Record the caller's confirmation of recent use (unverified, 0 points). Optional `note`. |
| `GET` | `/api/v1/skills/assessments` | Yes | Skills that have a skill check (8), the caller's standing on each (verified, attempts left today, attempt in progress), the last 20 attempts, and the rules. |
| `POST` | `/api/v1/skills/assessments` | Yes | Body `skill`. Starts an attempt (`201`) or returns the one in progress (`200`): questions and shuffled options, never answers. `404 ASSESSMENT_NOT_AVAILABLE` for a skill without a skill check, `429 ASSESSMENT_ATTEMPT_LIMIT` after 3 attempts in 24 hours. |
| `POST` | `/api/v1/skills/assessments/:attemptId/submit` | Yes | Body `answers`: one option position (0-3) or `null` per question. Returns the score, a review with explanations and, on a pass, the evidence change and recalculation. `409 ATTEMPT_ALREADY_SUBMITTED`, `409 ATTEMPT_EXPIRED`, `404` for another user's attempt. |
| `GET` | `/api/v1/users/me/intelligence-history` | Yes | The last 20 recalculations: trigger, modules recomputed, figures before and after, versions. |

### Recommendations and roadmap

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/recommendations` | Yes | Recommendations, those for the user's target career first (`isPrimaryCareer`). |
| `POST` | `/api/v1/recommendations/generate` | Yes | Regenerate from the current gap analysis. |
| `PATCH` | `/api/v1/recommendations/:id/status` | Yes | Set a recommendation's status. |
| `GET` | `/api/v1/roadmap/:id` | Yes | Roadmap for a career id; created on first request. |
| `POST` | `/api/v1/roadmap/:id/regenerate` | Yes | Rebuild the roadmap; items keep their ids, and anything started, completed or skipped stays. |
| `PATCH` | `/api/v1/roadmap/:id/items/:id/status` | Yes | Set an item to not_started, in_progress, completed or skipped. |
| `GET` | `/api/v1/roadmap/:id/schedule` | Yes | Hours of work remaining as a range, weeks and finish dates when weekly hours are set (`needsAvailability` otherwise), per-item effort with its basis (`catalogue` or `assumption`), blocked items, the next item, the assumptions used, and the last change to the roadmap with what was added or removed. `404 ROADMAP_NOT_FOUND`; does not create a roadmap. |
| `GET` | `/api/v1/users/me/learning-preferences` | Yes | `hoursPerWeek` (null until the user sets it) and its limits. |
| `PUT` | `/api/v1/users/me/learning-preferences` | Yes | Any of `hoursPerWeek` (a whole number from 1 to 60, or `null` to clear it), `reminders`, `milestoneNotifications` (booleans, both `false` until set). Only the fields sent change. |
| `GET` | `/api/v1/projects/suggestions` | Yes | Up to five practice projects for a career (`careerId` query; default the target role or best match), each tied to the caller's gaps, with reason, tasks, deliverables, assumed effort and the hypothetical score change. Empty with `hasProfile: false` when there is no skill profile. |
| `GET` | `/api/v1/projects` | Yes | Projects the caller has taken on. |
| `POST` | `/api/v1/projects` | Yes | Body `briefId`, optional `careerId`. Takes a project on (`201`), or returns the existing one (`200`). `409 PROJECT_NOT_RELEVANT` when it addresses none of the caller's gaps. |
| `PATCH` | `/api/v1/projects/:id` | Yes | Body `status` (`planned`, `in_progress`, `completed`) and/or `task` (`index`, `done`). The caller's own record; changes no score. |
| `DELETE` | `/api/v1/projects/:id` | Yes | Remove a project the caller took on. |
| `GET` | `/api/v1/portfolio` | Yes | The caller's entries (each with the points it earned per skill and whether that skill was separately verified by a skill check), limits, and the sharing settings. |
| `POST` | `/api/v1/portfolio` | Yes | Body `title`, `skills` (1 to 8 recognised skills), `completedOn` (`YYYY-MM-DD`, not in the future), optional `description`, `evidenceUrl` (https, no credentials), `sourceProjectId`, `visibility` (`private` default, or `shared`). `400 UNKNOWN_SKILL`, `409 PROJECT_NOT_COMPLETED`, `409 PROJECT_ALREADY_IN_PORTFOLIO`, `409 PORTFOLIO_FULL`. Rebuilds evidence and recalculates. |
| `PUT` | `/api/v1/portfolio/:id` | Yes | Replace an entry (same body). |
| `DELETE` | `/api/v1/portfolio/:id` | Yes | Remove an entry and the evidence it added. |
| `PUT` | `/api/v1/portfolio/share` | Yes | Body `enabled` and/or `showName`. Switching on issues a new link token; switching off disables it. |
| `GET` | `/api/v1/portfolio/shared/:token` | No | Public. Entries marked as shared, the owner's name only if allowed, and a note on what the entries mean. `404` for an unknown or switched-off link. |
| `GET` | `/api/v1/activity` | Yes | Learning streak (UTC days), the last 10 recorded learning activities, in-app notifications with the unread count, and the two notification settings. Works out any reminder that is due. |
| `GET` | `/api/v1/activity/unread-count` | Yes | Number of unread notifications. |
| `POST` | `/api/v1/activity/notifications/:id/read` | Yes | Mark one notification read. |
| `POST` | `/api/v1/activity/notifications/read-all` | Yes | Mark all read. |
| `DELETE` | `/api/v1/activity/notifications/:id` | Yes | Dismiss one; it is not created again for the same occasion. |
| `DELETE` | `/api/v1/activity/notifications` | Yes | Dismiss all. |
| `GET` | `/api/v1/learning-resources` | Yes | Free third-party resources grouped by the caller's gaps for a career (`careerId` query; default the best match), the gaps the catalogue has nothing for, and coverage figures. Each resource is marked third-party and "not re-checked". |
| `GET` | `/api/v1/learning-resources/mine` | Yes | Resources the caller saved or marked as worked through. |
| `PUT` | `/api/v1/learning-resources/:id/status` | Yes | Body `status`: `saved`, `done` or `null` to clear. The caller's own note; changes no score. |
| `GET` | `/api/v1/recommendations/next-actions` | Yes | Up to five ranked next actions for a career (`careerId` query; default the target role or best match): skill checks, practice projects and portfolio entries, each with its factors (impact, required gaps, existing evidence, prerequisites, effort, capacity, neutral market factor), score, baseline rank, reasons and the scenario changes it stands for. `hasProfile: false` and no actions without a skill profile. |

### Jobs and application tracking

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/opportunities` | Yes | Search. Query: `search`, `location`, `remote`, `employmentType`, `datePosted` (today, 3days, week, month), `salaryMin`, `sortBy` (match, date, salary, relevance), `minScore`, `page`, `limit` (1-50). Returns `opportunities`, `providerHealth` and `meta` (`source`: live, sample or unavailable; `total`, `hasMore`, `duplicatesRemoved`, `salaryDataAvailable`, `salaryFilter`, `excludedWithoutDate`, `fetchedAt`, `fromCache`). |
| `GET` | `/api/v1/opportunities/:id` | Yes | One posting from a recent search, scored for the caller. |
| `POST` | `/api/v1/opportunities/save` | Yes | Save a posting (idempotent per posting). |
| `POST` | `/api/v1/opportunities/:id/save` | Yes | Same as above. |
| `GET` | `/api/v1/opportunities/saved` | Yes | The caller's saved jobs with status history, notes, reminder and `reminderDue`. |
| `PATCH` | `/api/v1/opportunities/saved/:id/status` | Yes | Set status (saved, applied, interviewing, offer, rejected, withdrawn), optionally with notes. Each change is added to the history. |
| `PATCH` | `/api/v1/opportunities/saved/:id` | Yes | Update `notes`, `reminderAt` (a future ISO date, or null to clear) and `reminderNote`. |
| `DELETE` | `/api/v1/opportunities/saved/:id` | Yes | Remove a saved job. |
| `DELETE` | `/api/v1/opportunities/:id/save` | Yes | Same as above. |
| `GET` | `/api/v1/opportunities/telemetry` | Yes | Counts per status and `remindersDue`. |
| `GET` | `/api/v1/applications` | Yes | The caller's applications (saved jobs marked applied and manual ones) with status and reminder. |
| `POST` | `/api/v1/applications/manual` | Yes | Record an application made elsewhere. Body `title`, `company`, optional `applicationUrl` (https) and `appliedAt`. |
| `GET` | `/api/v1/applications/:id/history` | Yes | Dated status events of one application. |
| `POST` | `/api/v1/applications/:id/events` | Yes | Add a status event. Body `status`, `occurredAt`, optional `note`. |
| `PATCH` | `/api/v1/applications/:id/events/:eventId` | Yes | Correct an event's date or note. |
| `DELETE` | `/api/v1/applications/:id/events/:eventId` | Yes | Remove an event. |
| `PUT` | `/api/v1/applications/:id/reminder` | Yes | Set or clear a follow-up reminder. |
| `GET` | `/api/v1/applications/outcomes` | Yes | Outcome rates from the caller's own applications, with numerators, denominators and a minimum sample of 5. |

### Interviews

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/interviews` | Yes | Start a session. Body: `mode` (technical, behavioral, project, resume, career, mixed), `questionCount` (1-10), `targetCareerTitle`, `opportunityContext` (`title`, `company`, `description`). The session records `questionSource` (ai or question_bank). |
| `GET` | `/api/v1/interviews/history` | Yes | The caller's last 20 sessions. |
| `GET` | `/api/v1/interviews/:id` | Yes | One session with questions, answers and evaluations. |
| `POST` | `/api/v1/interviews/:id/respond` | Yes | Answer a question (10,000 characters at most). The evaluation records its `source` (ai or heuristic) and `dimensions`. |
| `POST` | `/api/v1/interviews/:id/complete` | Yes | Finish and score the session. |
| `GET` | `/api/v1/interviews/:id/report` | Yes | Report with `questionSource`, `evaluationSource`, `dimensionScores`, `answeredCount` and the job context. |
| `GET` | `/api/v1/interviews/rubrics` | Yes | Role rubrics with their weights; `role` query resolves one. |
| `GET` | `/api/v1/interviews/progress` | Yes | Per-dimension trend over the caller's completed sessions (a trend only from three sessions). |
| `GET` | `/api/v1/interviews/assessments/catalog` | Yes | Skills and task kinds available for technical assessments. |
| `GET` | `/api/v1/interviews/assessments` | Yes | The caller's technical assessments. |
| `POST` | `/api/v1/interviews/assessments` | Yes | Start one. Body `skills`, `count`. Tasks come without answers. No submitted text is ever executed. |
| `GET` | `/api/v1/interviews/assessments/:id` | Yes | One assessment; keys only for answered tasks. |
| `POST` | `/api/v1/interviews/assessments/:id/answers` | Yes | Answer one task once. |
| `POST` | `/api/v1/interviews/assessments/:id/finish` | Yes | Finish and score. Practice only: changes no skill, score or readiness. |
| `GET` | `/api/v1/interviews/voice-settings` | Yes | Dictation consent, recording consent and retention. |
| `PUT` | `/api/v1/interviews/voice-settings` | Yes | Change them. Withdrawing recording consent deletes every recording and reports how many. |
| `POST` | `/api/v1/interviews/:id/recordings` | Yes | Upload one answer's audio (multipart `audio`, `questionIndex`, `durationSec`). Needs recording consent; content checked. |
| `GET` | `/api/v1/interviews/:id/recordings` | Yes | Recordings of a session with their expiry. |
| `GET` | `/api/v1/interviews/:id/recordings/:questionId/audio` | Yes | Play one recording (owner only). |
| `DELETE` | `/api/v1/interviews/:id/recordings/:questionId` | Yes | Delete one (`202` when the file is still being removed). |
| `DELETE` | `/api/v1/interviews/recordings` | Yes | Delete all of the caller's recordings. |

### Market evidence

With no licensed source registered, every figure answers "unavailable" with the reason (`docs/MARKET_DATA_SOURCES.md`).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/market/sources` | Yes | Registered sources with licence and status. |
| `GET` | `/api/v1/market/history` | Yes | Dated posting counts from registered sources. |
| `GET` | `/api/v1/market/skill-trends` | Yes | Skill trends mined from sourced descriptions. |
| `GET` | `/api/v1/market/salaries` | Yes | Advertised salaries by place, period, currency and source. |
| `GET` | `/api/v1/market/forecast` | Yes | A demand forecast only with enough dated history (backtested), otherwise unavailable. |
| `GET` | `/api/v1/market/careers/:id/summary` | Yes | One career's market summary. |
| `GET` | `/api/v1/market/careers/:id/signals` | Yes | The market signal for a career; neutral unless evidence is valid. |
| `POST` | `/api/v1/market/imports` | Admin | Import postings from a registered source (licence checked). |
| `GET` | `/api/v1/market/imports` | Admin | Import batches. |

### Exam practice

Original practice questions on official patterns (GATE CS 2026, SSC CGL 2026 Tier-I); results never change career evidence (`docs/EXAM_PREP.md`).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/exams` | Yes | Exams with their sources and versions. |
| `GET` | `/api/v1/exams/:examId` | Yes | One exam: sections, topics, official pattern and practice rules. |
| `POST` | `/api/v1/exams/:examId/attempts` | Yes | Start a set. Body `count`, `mode` (practice or timed), optional `sectionIds`. |
| `GET` | `/api/v1/exams/:examId/attempts` | Yes | The caller's attempts. |
| `GET` | `/api/v1/exams/attempts/:attemptId` | Yes | One attempt; answers and marks only after submission. |
| `PUT` | `/api/v1/exams/attempts/:attemptId/answers` | Yes | Save one answer; refused after the server-side deadline or once submitted. |
| `POST` | `/api/v1/exams/attempts/:attemptId/sections/:sectionId/start` | Yes | Start the next timed section (in order). |
| `POST` | `/api/v1/exams/attempts/:attemptId/submit` | Yes | Submit and mark. |
| `GET` | `/api/v1/exams/:examId/performance` | Yes | Per-topic progress (a status only after 3 answers) and recommendations. |
| `GET` | `/api/v1/exams/:examId/plan` | Yes | The caller's study plan, or null. |
| `PUT` | `/api/v1/exams/:examId/plan` | Yes | Build or rebuild it. Body `hoursPerWeek` (1-60), optional `startDate`; completed items are kept. |
| `PATCH` | `/api/v1/exams/:examId/plan/items/:itemId` | Yes | Mark an item done or pending. |

### Career domains (E1)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/career-domains` | Yes | The six O*NET-informed careers with every requirement's basis, the attribution and the US-source note. |
| `GET` | `/api/v1/career-domains/matches` | Yes | The caller's stored matches for those careers. |

### Languages (E5, X1)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/languages/supported` | Yes | Declared resume and interface languages (English, Hindi, Spanish). |
| `GET` | `/api/v1/languages/settings` | Yes | The caller's interface language. |
| `PUT` | `/api/v1/languages/settings` | Yes | Body `uiLanguage` (`en`, `hi`, `es`). |
| `POST` | `/api/v1/languages/resume-analyses` | Yes | Analyse a PDF, DOCX or TXT resume (multipart `file`): language, layout, sections and fields with provenance; unsupported and scanned files are reported, not guessed. |
| `POST` | `/api/v1/languages/resume-analyses/text` | Yes | The same for pasted text. Body `text`. |
| `GET` | `/api/v1/languages/resume-analyses` | Yes | The caller's analyses (without their stored lines). |
| `GET` | `/api/v1/languages/resume-analyses/:id` | Yes | One analysis with its original lines. |
| `DELETE` | `/api/v1/languages/resume-analyses/:id` | Yes | Delete one with its stored text. |

### Employer postings (first-party, self-declared organizations)

See `docs/EMPLOYER_POSTINGS.md`. Organizations are not verified; every listing says so.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/employer/terms` | Yes | The contribution terms (version, the seven uses, withdrawal, no verification), limits, pay bounds and form options. |
| `GET` | `/api/v1/employer/organization` | Yes | The caller's organization, or `null`. |
| `PUT` | `/api/v1/employer/organization` | Yes | Body `organizationName`, optional https `website`. Records whether the sign-in e-mail domain matches the website (a signal, not verification). |
| `GET` | `/api/v1/employer/postings` | Yes | Open postings from all organizations, newest first (at most 100), with the self-declared disclosure. Query `skill` (lexicon name) and `state` (Indian state or UT). |
| `GET` | `/api/v1/employer/postings/mine` | Yes | The caller's postings in every state, with consent, report counts and whether each is in the market records. |
| `POST` | `/api/v1/employer/postings` | Yes | Create a draft: `title`, `description` (80–8,000), `city`, `state`, `workMode`, `employmentType`, `skills` (at least one recognised), optional `salary` (`INR`, `YEAR` or `MONTH`, plausible bounds, max ≤ 10× min) and https `applyUrl`. `409 NO_ORGANIZATION`; `429` above 10 a day. |
| `PATCH` | `/api/v1/employer/postings/:id` | Yes | Edit a draft (any field) or an open posting (description, pay, skills, mode, type, link; title and place are fixed). Owner only (404 otherwise). |
| `DELETE` | `/api/v1/employer/postings/:id` | Yes | Delete a draft. |
| `POST` | `/api/v1/employer/postings/:id/publish` | Yes | Body `termsVersion`, `authorizedToPost`, `realOpening`, `grantsUses` (all required). Opens it for 60 days; it enters the market records only once an administrator has reviewed the organization. `409 DUPLICATE_POSTING` for the same role, place and day; `429` above 25 open. |
| `POST` | `/api/v1/employer/postings/:id/close` | Yes | Close an open posting; it stays in the market history, as the terms allow. |
| `POST` | `/api/v1/employer/postings/:id/withdraw` | Yes | Withdraw a published posting: removed from listings and from every market figure at once. |
| `POST` | `/api/v1/employer/postings/:id/reports` | Yes | Body `reason` (`not_a_real_job`, `misleading`, `discriminatory`, `scam_or_fee`, `duplicate`, `other`), optional `note`. Once per user; not your own. Three reports hide the posting pending review. |
| `GET` | `/api/v1/employer/admin/reports` | Admin | Reported postings with counts and reasons. |
| `GET` | `/api/v1/employer/admin/organizations` | Admin | Organizations for market review (query `status`: `pending`, `approved`, `rejected`), with the e-mail domain signal, how many other accounts claim the same name and how many postings are published. |
| `POST` | `/api/v1/employer/admin/organizations/:id/review` | Admin | Body `decision` (`approve` or `reject`), optional `note`. Approving adds the organization's published postings to the market records; rejecting removes them. Not identity verification. |
| `POST` | `/api/v1/employer/admin/postings/:id/hide` | Admin | Hide a published posting (removed from market figures). |
| `POST` | `/api/v1/employer/admin/postings/:id/restore` | Admin | Restore a hidden posting; its reports are cleared. |

### AI observability (X11)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/ai-observability/summary` | Admin | Provider and feature statistics for `windowHours`, with the scope they cover. |
| `GET` | `/api/v1/ai-observability/events` | Admin | Recent gateway events (codes and timings only). Query `limit`, `windowHours`. |
| `GET` | `/api/v1/ai-observability/providers` | Admin | Each provider's zero-cost policy status for personal and other data. |

### Assistant chat

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/ai` | Yes | The caller's conversations. |
| `POST` | `/api/v1/ai` | Yes | Start a conversation. Optional `careerId` and `title`. |
| `GET` | `/api/v1/ai/:id` | Yes | A conversation and its messages. |
| `POST` | `/api/v1/ai/:id/messages` | Yes | Send a message (4,000 characters at most). The reply has `source` ai (with `aiProvider`, `aiModel`) or fallback (with `isFallback` and `fallbackReason`); a fallback is returned with status 200. |
| `POST` | `/api/v1/ai/:id/retry` | Yes | Ask again for the last question when its reply was a fallback. 409 `NOTHING_TO_RETRY` otherwise. |
| `PATCH` | `/api/v1/ai/:id/career` | Yes | Change the career a conversation is about. |
| `POST` | `/api/v1/ai/messages/:id/feedback` | Yes | Mark one of the caller's own messages helpful or not. |

### Orchestrator overview

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/orchestrator/agents` | Yes | Module overview built from the caller's stored data. |
| `GET` | `/api/v1/orchestrator/history` | Yes | Past workflow runs. |
| `POST` | `/api/v1/orchestrator/execute` | Yes | Run the overview workflow. Optional `goal` and `targetCompany`. |
| `GET` | `/api/v1/realtime` | Admin | Infrastructure diagnostics: uptime, memory use, database host and total record counts. Open without sign-in only when `NODE_ENV=development`; otherwise `401` without a token and `403` unless the caller's role is `admin` (set directly in the database). |

---

## 🟢 Health Endpoints

### 1. Backend Service

Used by monitoring tools or reverse proxies to check service availability.

- **URL:** `/health`
- **Method:** `GET`
- **Auth Required:** No
- **Headers:** None

#### Response (`200 OK`)

```json
{
  "status": "UP",
  "timestamp": "2026-07-19T14:50:00.000Z",
  "services": {
    "database": "UP"
  }
}
```

#### Response (`503 Service Unavailable`)

```json
{
  "status": "DOWN",
  "timestamp": "2026-07-19T14:50:00.000Z",
  "services": {
    "database": "DOWN"
  }
}
```

---

### 2. AI Python Service

Used by the Backend API to verify FastAPI service uptime before calling AI functions.

- **URL:** `/health`
- **Method:** `GET`
- **Auth Required:** No
- **Headers:** None

#### Response (`200 OK`)

```json
{
  "status": "healthy",
  "timestamp": "2026-07-19T14:50:00Z",
  "version": "0.1.0-alpha"
}
```

---

## 🔑 Authentication Endpoints

### 1. Register User

Creates a new user profile and returns access and refresh tokens.

- **URL:** `/auth/register`
- **Method:** `POST`
- **Auth Required:** No (Rate-limited: 15 req/15 min)
- **Body Schema:**
  ```json
  {
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "password": "strongpassword123"
  }
  ```

#### Response (`201 Created`)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60c72b2f9b1d8e1f845d8b8a",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "onboardingCompleted": false,
      "profileCompleted": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login User

Verifies email and password credentials and issues a fresh token pair.

- **URL:** `/auth/login`
- **Method:** `POST`
- **Auth Required:** No (Rate-limited: 15 req/15 min)
- **Body Schema:**
  ```json
  {
    "email": "john.doe@example.com",
    "password": "strongpassword123"
  }
  ```

#### Response (`200 OK`)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60c72b2f9b1d8e1f845d8b8a",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "onboardingCompleted": false,
      "profileCompleted": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Logout User

Revokes the refresh token to terminate the session.

- **URL:** `/auth/logout`
- **Method:** `POST`
- **Auth Required:** No (Validates Refresh Token in payload)
- **Body Schema:**
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

---

### 4. Refresh Token Rotation

Validates a refresh token and signs a rotated pair of access and refresh tokens.

- **URL:** `/auth/refresh`
- **Method:** `POST`
- **Auth Required:** No (Validates Refresh Token in payload)
- **Body Schema:**
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### Response (`200 OK`)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 👤 User Profile Endpoints

### 1. Get My Profile

Retrieves metadata details for the authenticated user.

- **URL:** `/users/me`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Auth Required:** Yes

#### Response (`200 OK`)

```json
{
  "success": true,
  "data": {
    "id": "60c72b2f9b1d8e1f845d8b8a",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "avatar": "https://example.com/avatar.png",
    "role": "user",
    "accountStatus": "active",
    "onboardingCompleted": false,
    "profileCompleted": false,
    "createdAt": "2026-07-19T15:20:00.000Z",
    "updatedAt": "2026-07-19T15:20:00.000Z",
    "lastLogin": "2026-07-19T15:20:00.000Z"
  }
}
```

---

### 2. Update My Profile

Updates specific user profile attributes.

- **URL:** `/users/me`
- **Method:** `PUT`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Auth Required:** Yes
- **Body Schema:**
  ```json
  {
    "fullName": "John H. Doe",
    "avatar": "https://example.com/new_avatar.png"
  }
  ```

#### Response (`200 OK`)

```json
{
  "success": true,
  "data": {
    "id": "60c72b2f9b1d8e1f845d8b8a",
    "fullName": "John H. Doe",
    "email": "john.doe@example.com",
    "avatar": "https://example.com/new_avatar.png",
    "role": "user",
    "accountStatus": "active",
    "onboardingCompleted": false,
    "profileCompleted": true,
    "createdAt": "2026-07-19T15:20:00.000Z",
    "updatedAt": "2026-07-19T15:22:00.000Z",
    "lastLogin": "2026-07-19T15:20:00.000Z"
  }
}
```

---

## 🧠 Skill Intelligence Endpoints

### Get User Skills

- **URL:** `/api/v1/skills/me`
- **Method:** `GET`
- **Auth Required:** `Bearer Token`
- **Description:** Retrieves the authenticated user's normalized skills, categorized and scored based on resume evidence.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "categories": {
      "Programming Languages": [
        {
          "id": "60d5ec49c1234a5b6789def0",
          "skillId": "60d5ec49c1234a5b6789def1",
          "name": "JavaScript",
          "evidenceScore": 85,
          "evidences": [
            {
              "sourceType": "resume_experience",
              "description": "Used at TechCorp as Software Engineer",
              "weight": 0.8
            }
          ],
          "aliases": ["JS"]
        }
      ]
    },
    "totalSkills": 1
  }
}
```

### Get Knowledge Graph

- **URL:** `/api/v1/skills/graph`
- **Method:** `GET`
- **Auth Required:** `Bearer Token`
- **Description:** Retrieves the global Skill Knowledge Graph edges representing 'parent', 'sub', or 'related' relationships between technical skills.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "edges": [
      {
        "source": "React",
        "target": "JavaScript",
        "type": "parent"
      }
    ]
  }
}
```

---

## 🎯 Career Intelligence Endpoints

### Get Career Matches

- **URL:** `/api/v1/careers/matches`
- **Method:** `GET`
- **Auth Required:** `Bearer Token`
- **Description:** Retrieves a user's deterministic career matches, ranked by score and accompanied by XAI (Explainable AI) strengths and missing skills.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "60d5ec49c1234a5b6789def0",
        "careerId": {
          "_id": "60d5ec49c1234a5b6789def1",
          "title": "Software Engineer",
          "category": "Engineering",
          "description": "Builds and maintains software systems."
        },
        "matchScore": 85,
        "matchingSkills": ["JavaScript", "Python"],
        "missingSkills": ["CI/CD"],
        "strengths": ["✓ Strong Python evidence"],
        "weaknesses": ["✗ Missing critical requirement: CI/CD"],
        "confidence": 75,
        "relatedCareers": [
          {
            "career": {
              "_id": "60d5ec49c1234a5b6789def2",
              "title": "Backend Engineer",
              "category": "Engineering"
            },
            "score": 80
          }
        ]
      }
    ]
  }
}
```

---

## 📊 Career Readiness Endpoints

### Get Career Readiness & Gaps

- **URL:** `/api/v1/readiness`
- **Method:** `GET`
- **Auth Required:** `Bearer Token`
- **Description:** Retrieves the user's readiness score, dimension breakdowns, and gap analysis for all matched careers.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "readiness": [
      {
        "_id": "60d5ec49c1234a5b6789def3",
        "careerId": {
          "_id": "60d5ec49c1234a5b6789def1",
          "title": "Software Engineer",
          "category": "Engineering"
        },
        "overallScore": 64,
        "readinessTier": "Mid Level Ready",
        "dimensions": [
          { "name": "Technical Skills", "score": 80, "weight": 0.5 },
          { "name": "Professional Experience", "score": 60, "weight": 0.25 }
        ],
        "gaps": {
          "criticalGaps": [
            { "skillName": "CI/CD", "impactScore": 85, "reason": "Critical missing competency." }
          ],
          "weakAreas": [],
          "strengthAreas": [
            {
              "skillName": "Python",
              "impactScore": 90,
              "reason": "Strong verified proficiency (90/100)."
            }
          ]
        }
      }
    ]
  }
}
```

---

## 🗺️ Learning Roadmap Endpoints

### Get Learning Roadmap
- **URL:** `/api/v1/roadmap/:careerId`
- **Method:** `GET`
- **Auth Required:** `Bearer Token`
- **Description:** Retrieves the adaptive learning roadmap for a specific career target.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "roadmap": {
      "_id": "60d5ec49c1234a5b6789def8",
      "progressPercentage": 25,
      "status": "active",
      "phases": [
        {
          "title": "Phase 1: Critical Foundations",
          "order": 1,
          "objective": "Resolve tier 1 dependencies and build necessary competencies.",
          "items": [
            {
              "title": "Learn Docker",
              "status": "completed"
            }
          ]
        }
      ]
    }
  }
}
```

### Update Item Status
- **URL:** `/api/v1/roadmap/:careerId/items/:itemId/status`
- **Method:** `PATCH`
- **Auth Required:** `Bearer Token`
- **Body:**
```json
{
  "status": "completed"
}
```
- **Description:** Updates the status of a specific roadmap item and recalculates overall roadmap progress.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "roadmap": { ... }
  }
}
```

---

## 📈 Analytics Endpoints

### Get Dashboard Analytics
- **URL:** `/api/v1/analytics`
- **Method:** `GET`
- **Auth Required:** `Bearer Token`
- **Query Params:** `period` (optional) - `weekly`, `monthly`, `quarterly`, `yearly` (default: `monthly`)
- **Description:** Retrieves the progress intelligence dashboard data for the requested period.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "currentMetrics": {
      "totalSkills": 12,
      "averageReadinessScore": 75,
      "totalGaps": 4,
      "completedRecommendations": 3,
      "completedRoadmapItems": 2
    },
    "trends": {
      "readinessGrowth": 5,
      "skillsAdded": 3,
      "gapsClosed": 1,
      "itemsCompleted": 2
    },
    "insights": [
      {
        "_id": "...",
        "type": "trend",
        "title": "Career Readiness Improving",
        "description": "Your average career readiness score increased by 5%."
      }
    ],
    "recentEvents": [],
    "historicalSnapshots": []
  }
}
```

---

## 🤖 AI Career Architect Endpoints

### Get Conversations
- **URL:** `/api/v1/ai`
- **Method:** `GET`
- **Auth Required:** `Bearer Token`
- **Description:** Retrieves the user's active conversation history.

### Create Conversation
- **URL:** `/api/v1/ai`
- **Method:** `POST`
- **Auth Required:** `Bearer Token`
- **Body:** `{ "careerId": "string (optional)", "title": "string" }`
- **Description:** Instantiates a new chat session.

### Get Conversation Messages
- **URL:** `/api/v1/ai/:id`
- **Method:** `GET`
- **Auth Required:** `Bearer Token`
- **Description:** Retrieves the messages for a specific conversation.

### Send Message
- **URL:** `/api/v1/ai/:id/messages`
- **Method:** `POST`
- **Auth Required:** `Bearer Token`
- **Body:** `{ "content": "What are my biggest gaps?" }`
- **Description:** Submits a message to the AI Architect. The backend automatically injects the latest verified platform context into the LLM prompt.

### Switch Target Career
- **URL:** `/api/v1/ai/:id/career`
- **Method:** `PATCH`
- **Auth Required:** `Bearer Token`
- **Body:** `{ "careerId": "new_career_id" }`
- **Description:** Switches the context of the active conversation to a different career target.

---

## ⚠️ Standard Error Response Model

When an error occurs, the API returns a structured error object.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload parameters.",
    "details": [
      {
        "field": "email",
        "issue": "Invalid email address format"
      }
    ]
  }
}
```
