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
  "uptime": 124.5,
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
  "uptime": 124.5,
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
