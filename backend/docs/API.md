# Bridging Skills to Careers — Backend API Documentation

**Base URL:** `http://localhost:5000`  
**API Prefix:** `/api`  
**Version:** 1.0.0

---

## Table of Contents

1. [Response Format](#response-format)
2. [Error Handling](#error-handling)
3. [Health Check](#health-check)
4. [Profile API](#profile-api)
5. [Roadmap API](#roadmap-api)
6. [Future Endpoints](#future-endpoints)

---

## Response Format

All responses follow a consistent JSON structure.

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human-readable message",
  "data": { }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Human-readable error message"
}
```

### Validation Error Response
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address." }
  ]
}
```

---

## Error Handling

| Status Code | Meaning                        |
|-------------|--------------------------------|
| 200         | OK                             |
| 201         | Created                        |
| 400         | Bad Request / Invalid ID       |
| 404         | Resource Not Found             |
| 409         | Conflict (duplicate email)     |
| 422         | Validation Failed              |
| 500         | Internal Server Error          |

---

## Health Check

### `GET /health`

Confirms the server is running.

**Response:**
```json
{
  "status": "running",
  "environment": "development",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

---

## Profile API

Base path: `/api/profile`

---

### `POST /api/profile`

Creates a new user profile.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "skills": ["html", "css", "javascript"],
  "careerInterests": ["web development", "ui/ux"],
  "targetRole": "Frontend Developer",
  "education": [
    {
      "institution": "State University",
      "degree": "Bachelor of Science",
      "fieldOfStudy": "Computer Science",
      "startYear": 2019,
      "endYear": 2023,
      "isCurrentlyStudying": false
    }
  ]
}
```

**Validation Rules:**
| Field             | Required | Rules                                      |
|-------------------|----------|--------------------------------------------|
| `name`            | ✅ Yes   | String, 2–100 characters                  |
| `email`           | ✅ Yes   | Valid email format, unique                 |
| `skills`          | ❌ No    | Array of strings, max 100 items            |
| `careerInterests` | ❌ No    | Array of strings, max 20 items             |
| `targetRole`      | ❌ No    | String                                     |
| `education`       | ❌ No    | Array of education objects                 |

**Success Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Profile created successfully.",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "skills": ["html", "css", "javascript"],
    "careerInterests": ["web development", "ui/ux"],
    "targetRole": "Frontend Developer",
    "education": [...],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `422` — Validation failed (missing name, invalid email, etc.)
- `409` — Email already exists

---

### `GET /api/profile/:id`

Retrieves a user profile by MongoDB ObjectId.

**URL Parameters:**
| Parameter | Type     | Description          |
|-----------|----------|----------------------|
| `id`      | ObjectId | MongoDB document ID  |

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved successfully.",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Jane Doe",
    "email": "jane@example.com",
    ...
  }
}
```

**Error Responses:**
- `400` — Invalid ID format
- `404` — Profile not found

---

### `PUT /api/profile/:id`

Updates an existing user profile. All fields are optional — only provided fields are updated.

**URL Parameters:**
| Parameter | Type     | Description          |
|-----------|----------|----------------------|
| `id`      | ObjectId | MongoDB document ID  |

**Request Body (all fields optional):**
```json
{
  "name": "Jane Smith",
  "skills": ["html", "css", "javascript", "react"],
  "targetRole": "Full Stack Developer"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully.",
  "data": { ... }
}
```

**Error Responses:**
- `400` — Invalid ID format
- `404` — Profile not found
- `409` — Email already in use by another profile
- `422` — Validation failed

---

### `DELETE /api/profile/:id`

Permanently deletes a user profile.

**URL Parameters:**
| Parameter | Type     | Description          |
|-----------|----------|----------------------|
| `id`      | ObjectId | MongoDB document ID  |

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile deleted successfully.",
  "data": null
}
```

**Error Responses:**
- `400` — Invalid ID format
- `404` — Profile not found

---

## Roadmap API

Base path: `/api/roadmap`

---

### `GET /api/roadmap/roles`

Returns all supported target roles for roadmap generation.

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Available roles retrieved.",
  "data": {
    "roles": [
      "Frontend Developer",
      "Backend Developer",
      "Full Stack Developer",
      "Data Analyst",
      "Cybersecurity Analyst",
      "Machine Learning Engineer"
    ]
  }
}
```

---

### `POST /api/roadmap`

Generates a personalized weekly learning roadmap based on current skills and target role.

The engine compares the user's existing skills against the full role roadmap and filters out topics already known, returning only the remaining learning path.

**Request Body:**
```json
{
  "currentSkills": ["html", "css"],
  "targetRole": "Frontend Developer"
}
```

**Validation Rules:**
| Field           | Required | Rules                                                  |
|-----------------|----------|--------------------------------------------------------|
| `targetRole`    | ✅ Yes   | Must be one of the 6 supported roles (case-insensitive)|
| `currentSkills` | ❌ No    | Array of strings, max 100 items (defaults to `[]`)     |

**Supported Roles:**
- `Frontend Developer`
- `Backend Developer`
- `Full Stack Developer`
- `Data Analyst`
- `Cybersecurity Analyst`
- `Machine Learning Engineer`

**Success Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Roadmap generated successfully.",
  "data": {
    "targetRole": "Frontend Developer",
    "currentSkills": ["html", "css"],
    "alreadyKnownSkills": ["html", "css"],
    "skillsToLearn": ["javascript", "dom", "react", "state management", "git", "responsive design", "api integration", "testing"],
    "totalWeeks": 8,
    "roadmap": [
      {
        "week": 1,
        "topic": "JavaScript Essentials",
        "description": "Core JS: variables, functions, arrays, objects, ES6+ features.",
        "resources": ["https://javascript.info/"]
      },
      {
        "week": 2,
        "topic": "DOM Manipulation & Events",
        "description": "Interact with the DOM, handle events, and manipulate page content dynamically.",
        "resources": ["https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model"]
      }
    ]
  }
}
```

**Error Responses:**
- `404` — Unsupported target role
- `422` — Validation failed (missing targetRole, invalid skills array)

---

## Future Endpoints

The following endpoints are reserved for upcoming AI module integrations.  
They are **not yet implemented** but the architecture is prepared for them.

| Method | Endpoint                          | Description                          |
|--------|-----------------------------------|--------------------------------------|
| POST   | `/api/resume/parse`               | Parse and extract data from a resume |
| GET    | `/api/resume/:id`                 | Retrieve parsed resume data          |
| POST   | `/api/skill-gap/analyze`          | AI-powered skill gap analysis        |
| GET    | `/api/skill-gap/:userId`          | Get skill gap report for a user      |
| GET    | `/api/resources`                  | Get curated learning resources       |
| GET    | `/api/resources/:role`            | Get resources filtered by role       |
| GET    | `/api/recommendations/:userId`    | AI-powered career recommendations    |
