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
| `POST` | `/api/v1/careers/compare` | Yes | Body `careerIds` (2 to 4). Requirements, evidence and effort per career, plus `market` per career (state `sourced_valid`, `no_source`, `sparse`, `stale`, `synthetic` or `error`; a posting count with source, period and freshness only when `usable`) and `marketData`. Market evidence is read server-side from sourced records only; it cannot be supplied in the request. |
| `POST` | `/api/v1/careers/what-if` | Yes | Body `changes` (1 to 10 of `add_skill`, `remove_skill`, `add_project`, `add_certification`, `add_experience`, `pass_assessment`) and optional `careerIds`. Scores before and after with requirement-level changes. `400 UNKNOWN_SKILL` for a skill that is not recognised. Nothing is saved. |
| `GET` | `/api/v1/careers/:id/counterfactuals` | Yes | Ranked single changes and a path to `targetScore` (query, 0-100). |
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

### Interviews

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/interviews` | Yes | Start a session. Body: `mode` (technical, behavioral, project, resume, career, mixed), `questionCount` (1-10), `targetCareerTitle`, `opportunityContext` (`title`, `company`, `description`). The session records `questionSource` (ai or question_bank). |
| `GET` | `/api/v1/interviews/history` | Yes | The caller's last 20 sessions. |
| `GET` | `/api/v1/interviews/:id` | Yes | One session with questions, answers and evaluations. |
| `POST` | `/api/v1/interviews/:id/respond` | Yes | Answer a question (10,000 characters at most). The evaluation records its `source` (ai or heuristic) and `dimensions`. |
| `POST` | `/api/v1/interviews/:id/complete` | Yes | Finish and score the session. |
| `GET` | `/api/v1/interviews/:id/report` | Yes | Report with `questionSource`, `evaluationSource`, `dimensionScores`, `answeredCount` and the job context. |

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
