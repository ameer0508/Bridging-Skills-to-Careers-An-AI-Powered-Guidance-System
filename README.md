# SkillBridge: Bridging Skills to Careers

> **An AI-Powered Career Intelligence Platform & Autonomous Career Operating System**  
> *Transforming fragmented user skills into clear, evidence-based career pathways through verified skill taxonomies, deterministic gap analysis, adaptive learning roadmaps, live opportunity discovery, and multi-agent AI orchestration.*

---

[![Production Status](https://img.shields.io/badge/status-production--ready-emerald?style=for-the-badge&logo=shield)](https://github.com/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)](https://github.com/)
[![Node.js](https://img.shields.io/badge/node.js-%3E%3D20.0.0-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x_strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/react-19.0.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/python-3.10%2B-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.109%2B-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/docker-containerized-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-MIT-purple?style=for-the-badge)](LICENSE)

---

## 📑 Table of Contents

- [Overview](#-overview)
  - [The Problem](#the-problem)
  - [The Solution](#the-solution)
  - [Who It Is For](#who-it-is-for)
- [System Architecture](#-system-architecture)
  - [Architectural Topology](#architectural-topology)
  - [Core Design Principles](#core-design-principles)
- [Key Features & Subsystems](#-key-features--subsystems)
  - [1. Resume & Skill Intelligence](#1-resume--skill-intelligence)
  - [2. Career Matching & Gap Analysis](#2-career-matching--gap-analysis)
  - [3. Adaptive Learning Roadmaps](#3-adaptive-learning-roadmaps)
  - [4. Live Opportunity Discovery](#4-live-opportunity-discovery)
  - [5. STAR Mock Interview Simulator](#5-star-mock-interview-simulator)
  - [6. Grounded AI Career Architect & Multi-Agent Network](#6-grounded-ai-career-architect--multi-agent-network)
  - [7. Analytics, Knowledge Graph & Personal Memory](#7-analytics-knowledge-graph--personal-memory)
- [Feature Implementation Status](#-feature-implementation-status)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Local Installation & Development](#local-installation--development)
- [Containerized Deployment (Docker)](#-containerized-deployment-docker)
- [API Reference & Telemetry](#-api-reference--telemetry)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security & Privacy Posture](#-security--privacy-posture)
- [Roadmap & Future Horizons](#-roadmap--future-horizons)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 Overview

### The Problem
The modern career landscape moves faster than traditional educational curricula. Learners and job seekers face acute challenges:
- **Fragmented Credentialing:** Resumes and portfolios fail to quantify true competency, leaving candidates unaware of how their abilities measure up against real market requirements.
- **The "Black Box" Job Market:** Job postings list long requirement wishlists without clear guidance on which missing skills actually block hiring decisions.
- **Generic AI Advice:** Off-the-shelf chatbots hallucinate generic learning paths, lack access to authenticated profile evidence, and provide advice disconnected from industry prerequisite sequences.

### The Solution
**SkillBridge** is an enterprise-grade Career Intelligence Platform and autonomous Career Operating System (Career OS). It bridges the gap between existing skills and target professional roles by combining:
1. **Deterministic Algorithmic Engines:** Exact mathematical calculations for skill evidence (0–100), multi-dimensional career readiness, and topological learning roadmaps.
2. **Grounded AI Intelligence Layer:** An asynchronous Python FastAPI service with an enterprise AI Gateway (Google Gemini primary, OpenAI/HuggingFace/Local fallbacks) that ingests structured profile snapshots to deliver grounded, non-hallucinatory coaching.
3. **Closed-Loop Career Execution:** Live job opportunity feeds (RapidAPI JSearch), STAR-method behavioral and technical interview prep, and multi-agent workflow orchestration.

### Who It Is For
- **Students & Graduates:** Map university coursework and personal projects directly to hiring benchmarks.
- **Career Changers:** Identify transferable skills and close critical gaps with topological learning paths.
- **Engineers & Professionals:** Benchmark readiness against senior, staff, and leadership roles.
- **Hackathon Judges & Technical Recruiters:** Inspect a fully verified, multi-tiered full-stack architecture demonstrating advanced AI integration, TypeScript strictness, and microservice decoupling.

---

## 🏛️ System Architecture

### Architectural Topology

SkillBridge is built as a three-tier decoupled system designed for high availability, low latency, and modularity.

```mermaid
flowchart TB
    subgraph Client ["Client Tier (Browser)"]
        UI["React 19 Single Page App\n(Vite + Tailwind v4 + Framer Motion)"]
        Workspaces["29 Dedicated Feature Workspaces\n(Code-Split via React.lazy)"]
        StateStore["Client State & Cache\n(Zustand + TanStack Query v5)"]
        UI --> Workspaces
        Workspaces --> StateStore
    end

    subgraph Gateway ["Application Tier (Node.js / Express :5000)"]
        APIGateway["Express.js API Gateway\n(Strict TS • Helmet • Rate-Limit • CORS)"]
        Controllers["Controllers & Zod Validators"]
        Services["Domain Engines & Services\n(Matching • Readiness • Roadmap • Interview)"]
        ContextAssembler["ContextAssembler\n(Grounded Prompt Context Synthesis)"]
        Repositories["Mongoose Data Access Layer"]
        
        APIGateway --> Controllers
        Controllers --> Services
        Services --> ContextAssembler
        Services --> Repositories
    end

    subgraph Intelligence ["AI & Machine Learning Tier (Python / FastAPI :8000)"]
        FastAPIApp["FastAPI Intelligence Engine"]
        AIGatewayMod["Enterprise AI Gateway\n(Caching • Rate-Limiting • Fallback Chain)"]
        KG["Knowledge Graph Engine\n(Ontology • Entities • Relationships • Inferences)"]
        DocParsers["Document Parsing Pipeline\n(PyMuPDF • pdfplumber • python-docx)"]
        MultiAgents["Autonomous Multi-Agent Subsystem\n(Job • Resume • Interview • Learning • Network)"]
        
        FastAPIApp --> AIGatewayMod
        FastAPIApp --> KG
        FastAPIApp --> DocParsers
        FastAPIApp --> MultiAgents
    end

    subgraph DataTier ["Persistence & External Providers"]
        MongoDB[("MongoDB Database\n(Atlas or In-Memory WiredTiger)")]
        GeminiAPI["Google Gemini API\n(Primary AI Model)"]
        OpenAIAPI["OpenAI / HuggingFace\n(Fallback Providers)"]
        JSearchAPI["RapidAPI JSearch\n(Live Job Ingestion)"]
    end

    StateStore <-->|REST / JSON • JWT Bearer| APIGateway
    Repositories <-->|Mongoose ODM| MongoDB
    ContextAssembler <-->|HTTP / JSON (15s Timeout)| FastAPIApp
    AIGatewayMod --> GeminiAPI
    AIGatewayMod -.-> OpenAIAPI
    Services <-->|Live API Feeds| JSearchAPI
```

### Core Design Principles

1. **Deterministic Business Logic First:** Mathematical evaluations (evidence weights, readiness percentages, topological roadmap sorting) run entirely in deterministic TypeScript/Python algorithms. LLMs are never allowed to fabricate scores.
2. **Context-Grounded AI Generation:** The `ContextAssembler` extracts a complete verified telemetry snapshot (profile, parsed resume, verified skills, readiness gaps, target career) before prompting the AI, preventing hallucinations.
3. **Multi-Provider Fallback Gateway:** The AI layer implements a resilient provider fallback pipeline:
   $$\text{Gemini (Primary)} \longrightarrow \text{OpenAI} \longrightarrow \text{HuggingFace} \longrightarrow \text{Local (Ollama)} \longrightarrow \text{Dev Mock}$$
4. **Zero-Setup Local Persistence:** The backend supports both cloud MongoDB Atlas and an automated `MongoMemoryServer` with local disk persistence (`WiredTiger` engine in `backend/data/local_db`).
5. **Defense-in-Depth Security:** Stateless JWT authentication, refresh token rotation with MongoDB TTL indexes, rate-limiting, Helmet headers, payload bounds (10MB), and isolated secret variables.

---

## ⚡ Key Features & Subsystems

### 1. Resume & Skill Intelligence
- **Multi-Format Ingestion:** Robust extraction from PDF and DOCX files utilizing `PyMuPDF`, `pdfplumber`, and `python-docx` with encoding sanitization.
- **Canonical Skill Taxonomy:** Normalizes raw resume terminology into a standard taxonomy, mapping aliases to canonical records.
- **4-Tier Evidence Scoring:** Computes verifiable skill confidence (0–100) using a multi-factor evidence matrix:
  - Direct work experience (highest weight)
  - Demonstrated technical projects
  - Academic coursework and degrees
  - Industry certifications

### 2. Career Matching & Gap Analysis
- **Requirements Matching Engine:** Evaluates candidate skill profiles against structured career benchmark requirements.
- **Tri-Dimensional Readiness Index:** Evaluates user preparedness across three independent pillars:
  - **Technical Competency:** Core mandatory vs. secondary elective skills.
  - **Experience Depth:** Years of demonstrated production work.
  - **Educational Foundation:** Degree alignment and formal training.
- **Impact-Ranked Gap Prioritizer:** Ranks missing skills by their mathematical impact on the candidate's target career readiness score.
- **Explainable AI (XAI) Reasoning:** Generates transparent, rule-grounded explanations highlighting verified strengths and critical hurdles.

### 3. Adaptive Learning Roadmaps
- **Topological Prerequisite Sorting:** Utilizes a directed acyclic graph (DAG) dependency resolver to ensure foundational concepts precede advanced frameworks.
- **Dynamic Phase Sequencing:** Organizes roadmaps into logical phases (Foundational, Intermediate, Advanced, Specialization).
- **Interactive Execution Horizon:** Users can toggle item statuses (`not_started`, `in_progress`, `completed`), triggering real-time progress events and telemetry updates.

### 4. Live Opportunity Discovery
- **Live Market Ingestion:** Real-time job and internship aggregation powered by RapidAPI JSearch.
- **Intelligent Relevancy Scoring:** Automatically ranks open positions based on candidate skill overlap and readiness match.
- **Application Pipeline Ledger:** Track opportunities through a 4-stage pipeline: `Saved` $\rightarrow$ `Applied` $\rightarrow$ `Interviewing` $\rightarrow$ `Offered`.

### 5. STAR Mock Interview Simulator
- **Structured STAR Evaluation:** Generates context-specific technical and behavioral questions mapped to target careers.
- **Real-Time Response Feedback:** Analyzes candidate answers across Situation, Task, Action, and Result (STAR) dimensions.
- **Comprehensive Competency Reports:** Generates post-session feedback with concrete improvement vectors and strengths.

### 6. Grounded AI Career Architect & Multi-Agent Network
- **Context-Bound Conversational Coach:** Real-time AI advisory grounded in the candidate's verified profile data.
- **Dynamic Context Switching:** Automatically resets context when the user switches target careers.
- **Specialized Multi-Agent Subsystem:**
  - **Job Search Agent:** Discovers role openings matched to current readiness.
  - **Learning Agent:** Curates high-impact resources to close immediate gaps.
  - **Resume Optimization Agent:** Audits resume bullet points against role requirements.
  - **Interview Prep Agent:** Conducts customized mock drills.
  - **Networking Agent:** Formulates strategic outreach templates.
  - **AI Orchestrator:** Coordinates multi-agent workflows and execution graphs.

### 7. Analytics, Knowledge Graph & Personal Memory
- **Historical Telemetry Snapshots:** Tracks readiness velocity, skill acquisition rate, and gap closures over time.
- **Interactive Visualizations:** Responsive trend charts rendered using Recharts.
- **Knowledge Graph Explorer:** Inspects semantic relationships between skills, career paths, and industries.
- **Long-Term Memory Engine:** Retains user goals, preferences, and progress milestones across sessions.

---

## 📊 Feature Implementation Status

The table below reflects the **verified implementation state** in the repository:

| Functional Area | Subsystem / Feature | Status | Implementation Details |
| :--- | :--- | :---: | :--- |
| **Authentication** | JWT Auth with Refresh Token Rotation | ✅ | Stateless JWTs, bcrypt hashing, TTL-indexed session cleanup |
| **Authentication** | Route Guards & RBAC | ✅ | `ProtectedRoute`, `GuestRoute`, role middleware |
| **Document Processing**| Resume Upload & Parsing | ✅ | Express `multer`, FastAPI `pdfplumber`, `PyMuPDF`, `python-docx` |
| **Skills Layer** | Canonical Skill Taxonomy Normalization | ✅ | Normalizes skill variants, maps aliases to canonical taxonomy |
| **Skills Layer** | 4-Tier Evidence Scoring (0–100) | ✅ | Weighted multi-source proof (experience, projects, certs, degrees) |
| **Career Matching** | Mathematical Match Scoring | ✅ | Requirement matrix evaluation, deterministic alignment |
| **Readiness Engine** | Tri-Dimensional Readiness Scoring | ✅ | Technical, Experience, and Educational dimension calculations |
| **Readiness Engine** | Impact-Ranked Gap Prioritizer | ✅ | Mathematical ranking of missing skills by career impact |
| **Roadmaps** | Topological Dependency Resolver | ✅ | DAG sorting preventing prerequisite inversion |
| **Roadmaps** | Roadmap History & Item Statuses | ✅ | Interactive state machine (`not_started`, `in_progress`, `completed`) |
| **Opportunities** | Live Job Search via RapidAPI JSearch | ✅ | Query enrichment, salary parsing, live external URL verification |
| **Opportunities** | Application Status Pipeline Ledger | ✅ | Track status across Saved, Applied, Interviewing, and Offered |
| **Interview Prep** | STAR Simulated Interview Engine | ✅ | Multi-turn mock sessions, response feedback, competency reports |
| **AI Layer** | Multi-Provider AI Gateway | ✅ | Dynamic routing: Gemini, OpenAI, HuggingFace, Local, Mock |
| **AI Layer** | Deterministic ContextAssembler | ✅ | Gathers verified user state before LLM generation |
| **AI Layer** | Conversational Career Architect | ✅ | Real-time chat, context switching, persistent session history |
| **AI Agents** | Specialized Multi-Agent Subsystem | ✅ | Job, Learning, Resume, Interview, Networking, and Orchestrator agents |
| **Analytics** | Historical Snapshot & Velocity Engine | ✅ | Temporal progress snapshots, Recharts visualization |
| **Knowledge Graph** | Semantic Entity & Relationship Graph | ✅ | Node/edge graph engine, ontology manager, visual explorer |
| **DevOps** | Full Docker Containerization | ✅ | Multi-stage Dockerfiles for Frontend, Backend, AI, and Compose |
| **DevOps** | Zero-Setup Persistence | ✅ | Automatic `MongoMemoryServer` with WiredTiger local persistence |
| **Observability** | Live Real-Time Telemetry & HTML Portal | ✅ | `/health`, `/api/v1/realtime`, and live dashboard on `/` |

---

## 🛠️ Technology Stack

### Frontend Application
- **Runtime & Build:** [React 19](https://react.dev/), [Vite 5](https://vitejs.dev/), [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode)
- **Styling & Design System:** [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion 11](https://www.framer.com/motion/) (Spring physics, specular lighting profiles)
- **Routing:** [React Router v6](https://reactrouter.com/) (Configured with v7 transition flags)
- **State & Data Fetching:** [Zustand](https://github.com/pmndrs/zustand), [TanStack Query v5](https://tanstack.com/query/latest), [Axios](https://axios-http.com/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Visualizations & Icons:** [Recharts 3](https://recharts.org/), [Lucide React](https://lucide.dev/)

### Backend Core API
- **Runtime & Framework:** [Node.js](https://nodejs.org/) (ES Modules), [Express 4](https://expressjs.com/), [TypeScript 5](https://www.typescriptlang.org/)
- **Database & ODM:** [MongoDB](https://www.mongodb.com/), [Mongoose 8](https://mongoosejs.com/)
- **Zero-Setup Database:** [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server) (With local WiredTiger persistence)
- **Security & Protection:** [Helmet](https://helmetjs.github.io/), [express-rate-limit](https://express-rate-limit.mintlify.app/), [bcrypt](https://github.com/kelektiv/node.bcrypt.js), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- **File Handling:** [Multer](https://github.com/expressjs/multer)
- **Logging & Validation:** [Winston 3](https://github.com/winstonjs/winston), [Zod 3](https://zod.dev/)

### AI Intelligence Service
- **Runtime & Framework:** [Python 3.10+](https://www.python.org/), [FastAPI](https://fastapi.tiangolo.com/), [Uvicorn](https://www.uvicorn.org/)
- **Data Validation & Settings:** [Pydantic v2](https://docs.pydantic.dev/), [pydantic-settings](https://github.com/pydantic/pydantic-settings)
- **AI SDKs & Providers:** [google-genai](https://pypi.org/project/google-genai/), [google-antigravity](https://pypi.org/project/google-antigravity/)
- **Document Processing:** [pdfplumber](https://github.com/jsvine/pdfplumber), [PyMuPDF](https://pymupdf.readthedocs.io/), [python-docx](https://python-docx.readthedocs.io/)
- **Numerical Processing:** [NumPy](https://numpy.org/), [Pandas](https://pandas.pydata.org/)

### DevOps & Tooling
- **Package Manager:** [pnpm](https://pnpm.io/) (Monorepo Workspaces)
- **Containerization:** [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/)
- **Code Quality:** [ESLint 9](https://eslint.org/), [Prettier 3](https://prettier.io/)

---

## 📂 Repository Structure

```text
Bridging Skills to Careers An AI-Powered Guidance System/
├── package.json                   # Root monorepo orchestration scripts
├── pnpm-workspace.yaml            # pnpm workspace configuration
├── docker-compose.yml             # 4-tier container orchestration (Mongo, AI, Backend, Frontend)
├── .env.production.example        # Production environment configuration template
├── docs/                          # Comprehensive technical documentation
│   ├── ARCHITECTURE.md            # Detailed system design & component patterns
│   ├── API_REFERENCE.md           # API request/response specifications
│   ├── CHANGELOG.md               # Version history and milestone progression
│   ├── DEPLOYMENT.md              # Container deployment guide
│   ├── EXPERIENCE_DESIGN_SYSTEM.md# UX, lighting profiles & motion physics spec
│   └── SECURITY.md                # Security controls & defense-in-depth posture
│
├── frontend/                      # React 19 Single Page Application
│   ├── src/
│   │   ├── app/                   # Root application providers & error wrappers
│   │   ├── components/            # Reusable UI primitives (Buttons, Cards, Modals)
│   │   ├── features/              # Feature modules (auth, resume, skills, careers, etc.)
│   │   ├── layouts/               # AppShell, AuthLayout, Navigation
│   │   ├── routes/                # createBrowserRouter definitions & RouteGuards
│   │   ├── store/                 # Global Zustand stores (authStore, experienceStore)
│   │   ├── workspaces/            # 29 dedicated full-page intelligence workspaces
│   │   └── main.tsx               # Client entry point
│   ├── Dockerfile                 # Multi-stage production Nginx container
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                       # Node.js / Express REST API Gateway
│   ├── src/
│   │   ├── config/                # Environment schema (Zod), logger (Winston), DB pool
│   │   ├── controllers/           # HTTP route handlers
│   │   ├── middlewares/           # Auth, rate-limiter, error-handler, request logger
│   │   ├── models/                # 31 Mongoose data models (User, Career, Skill, etc.)
│   │   ├── routes/                # Express versioned routers (/api/v1/*)
│   │   ├── services/              # Domain logic (Matching, Readiness, Roadmaps, AIClient)
│   │   ├── tests/                 # Automated integration test suites
│   │   ├── app.ts                 # Express application assembly & telemetry dashboard
│   │   └── server.ts              # HTTP server bootstrap & graceful shutdown
│   ├── Dockerfile                 # Production Node.js container
│   └── package.json
│
└── ai/                            # Python FastAPI Intelligence Service
    ├── app/
    │   ├── config/                # AI provider configuration & settings
    │   ├── core/                  # Logging, telemetry, startup hooks
    │   ├── gateway/               # Enterprise AI Gateway & fallback router
    │   ├── knowledge_graph/       # Graph engine, ontologies, entity & relation managers
    │   ├── providers/             # Adapters for Gemini, OpenAI, HuggingFace, Local, Mock
    │   ├── routers/               # 35+ FastAPI sub-routers (extract, skills, agents, etc.)
    │   ├── schemas/               # Pydantic request/response validation models
    │   ├── services/              # Document parsers & extraction engines
    │   └── main.py                # FastAPI app bootstrap & telemetry endpoints
    ├── Dockerfile                 # Production Python FastAPI container
    └── requirements.txt           # Python dependency manifest
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local development machine:

- **Node.js:** `v20.0.0` or higher
- **pnpm:** `v8.0.0` or higher
- **Python:** `3.10` or higher
- **Docker & Docker Compose:** *(Optional, for containerized run)*
- **MongoDB:** *(Optional: The backend will automatically boot an embedded persistent MongoDB if none is provided)*

### Environment Configuration

SkillBridge requires configuration files for each isolated tier. Copy the provided sample files:

#### 1. Backend (`backend/.env`)
```bash
cp backend/.env.example backend/.env
```
Populate the configuration values:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Leave empty or set to localhost to use the automatic persistent local MongoDB
MONGODB_URI=mongodb://localhost:27017/skillbridge

# Cryptographically secure secrets for JWT tokens
JWT_SECRET=<your-development-jwt-secret>
JWT_EXPIRES_IN=1d

# URL pointing to the running Python AI Service
AI_SERVICE_URL=http://127.0.0.1:8000

# RapidAPI Key for Live Opportunity Discovery (Optional for mock fallback)
RAPIDAPI_KEY=<your-rapidapi-jsearch-key>
```

#### 2. AI Intelligence Service (`ai/.env`)
```bash
cp ai/.env.example ai/.env
```
Populate the configuration values:
```env
ENV=development
PORT=8000
PRIMARY_PROVIDER=gemini
GEMINI_API_KEY=<your-google-gemini-api-key>

# Optional fallback provider keys
OPENAI_API_KEY=<your-openai-api-key>
HUGGINGFACE_API_KEY=<your-huggingface-key>
```

#### 3. Frontend Client (`frontend/.env`)
```bash
cp frontend/.env.example frontend/.env
```
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

### Local Installation & Development

SkillBridge is organized as a monorepo. Dependencies can be installed and services launched concurrently from the root directory.

#### Step 1: Clone the Repository
```bash
git clone https://github.com/SystemTron01/Bridging-Skills-to-Careers-An-AI-Powered-Guidance-System.git
cd "Bridging Skills to Careers - An AI Powered Guidance System"
```

#### Step 2: Install Node.js Dependencies
```bash
pnpm install
```

#### Step 3: Set Up Python AI Virtual Environment
```bash
cd ai
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1

# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cd ..
```

#### Step 4: Run All Services Concurrently
From the root directory, execute:
```bash
pnpm dev
```
This single command orchestrates:
- **Frontend SPA:** `http://localhost:3000` (or `http://localhost:5173`)
- **Backend API & Telemetry Portal:** `http://localhost:5000`
- **FastAPI AI Intelligence Service:** `http://127.0.0.1:8000`

#### Individual Service Commands
If you prefer running services in separate terminal windows:
```bash
# Terminal 1 — Backend Express API:
pnpm dev:backend

# Terminal 2 — Frontend React App:
pnpm dev:frontend

# Terminal 3 — Python FastAPI AI Service:
pnpm dev:ai
```

---

## 🐳 Containerized Deployment (Docker)

SkillBridge is fully containerized with multi-stage Docker builds for rapid deployment across cloud environments (AWS ECS, Google Cloud Run, Render, or VPS).

### Deploying with Docker Compose

Run the entire platform (Database, AI Service, API Gateway, and Nginx Frontend) with one command:

```bash
docker-compose up --build -d
```

### Container Network Map

| Container Name | Service | Internal Port | Host Port | Role |
| :--- | :--- | :---: | :---: | :--- |
| `skillbridge-frontend` | React SPA / Nginx | `80` | `3000` | Production static web application |
| `skillbridge-backend` | Express API Gateway | `5000` | `5000` | Core business logic & database access |
| `skillbridge-ai` | FastAPI ML Layer | `8000` | `8000` | Document parsing & AI Gateway |
| `skillbridge-mongo` | MongoDB Database | `27017` | `27017` | Database persistence engine |

To view live container logs:
```bash
docker-compose logs -f
```

To stop all containers:
```bash
docker-compose down
```

---

## 📡 API Reference & Telemetry

### Base URL: `/api/v1`

| HTTP Method | Endpoint Path | Authentication | Description |
| :---: | :--- | :---: | :--- |
| `GET` | `/health` | Public | System health check (MongoDB status, uptime) |
| `GET` | `/` | Public | Live telemetry dashboard (HTML in browser, JSON in API) |
| `GET` | `/api/v1/realtime` | Public | Machine-readable system telemetry and metric counters |
| `POST`| `/api/v1/auth/register` | Public | Register new user account; returns access/refresh tokens |
| `POST`| `/api/v1/auth/login` | Public | Authenticate user credentials and issue session tokens |
| `POST`| `/api/v1/auth/refresh-token` | Public | Rotate expired access token using active refresh token |
| `POST`| `/api/v1/auth/logout` | Authenticated | Invalidate refresh token and terminate active session |
| `GET` | `/api/v1/users/me` | Authenticated | Retrieve current user profile and career configuration |
| `POST`| `/api/v1/resumes/upload` | Authenticated | Upload PDF/DOCX resume for asynchronous parsing |
| `GET` | `/api/v1/skills` | Authenticated | Retrieve user skills, taxonomy categories, and evidence |
| `GET` | `/api/v1/careers/matches` | Authenticated | Retrieve matched careers ranked by suitability percentage |
| `GET` | `/api/v1/readiness` | Authenticated | Retrieve tri-dimensional readiness breakdown and skill gaps |
| `GET` | `/api/v1/roadmap/:careerId`| Authenticated | Retrieve topological learning roadmap for target career |
| `PATCH`|`/api/v1/roadmap/items/:id`| Authenticated | Update roadmap item progress (`in_progress`, `completed`)|
| `GET` | `/api/v1/recommendations` | Authenticated | Retrieve prioritized learning resources and project templates|
| `GET` | `/api/v1/opportunities` | Authenticated | Retrieve live job and internship openings (RapidAPI JSearch)|
| `POST`| `/api/v1/opportunities/save`| Authenticated | Save opportunity to personal career pipeline ledger |
| `POST`| `/api/v1/interviews` | Authenticated | Start new simulated STAR mock interview session |
| `POST`| `/api/v1/interviews/:id/respond`| Authenticated | Submit response to interview question for live evaluation |
| `GET` | `/api/v1/ai/conversations` | Authenticated | Retrieve conversational AI Career Architect history |
| `POST`| `/api/v1/ai/conversations/:id/messages`| Authenticated | Send prompt to AI Career Architect (grounded context) |
| `GET` | `/api/v1/orchestrator/agents`| Authenticated | Inspect registered autonomous multi-agents and capabilities |

---

## 🧪 Testing & Quality Assurance

SkillBridge maintains rigorous testing standards across its monorepo workspaces.

### 1. Run Complete Backend Test Suite
The backend contains automated integration test suites executed with an in-memory database:
```bash
pnpm --filter backend test
```
**Executed Suites:**
- `auth.test.ts`: User registration, password hashing, JWT creation, token refresh rotation.
- `onboarding_domain.test.ts`: Profile creation, skill initialization, career baseline setting.
- `opportunities.test.ts`: Live JSearch ingestion, query parameter encoding, candidate score matching.
- `interviews.test.ts`: STAR session initialization, prompt evaluation, scoring consistency.
- `unified_orchestration.test.ts`: Multi-tenant user isolation, snapshot state compilation.
- `resume_differential.test.ts`: Document parser resilience, extraction accuracy.
- `snapshot_resilience.test.ts`: Analytics snapshot generation across missing dates.
- `orchestrator_service.test.ts`: Multi-agent execution pipelines and history logging.

### 2. Run Type Validation & Linting
```bash
# Validate strict TypeScript compilation across monorepo:
pnpm --filter backend exec tsc --noEmit
pnpm --filter frontend exec tsc --noEmit

# Run ESLint validations:
pnpm lint

# Format codebase:
pnpm format
```

### 3. Verify Production Builds
```bash
# Build both frontend (Vite) and backend (tsc):
pnpm build
```

---

## 🔒 Security & Privacy Posture

SkillBridge is built following **Defense-in-Depth** principles:

1. **Authentication & Multi-Tenant Isolation:**
   - Stateless JWT tokens with short-lived access lifespans (15m) and cryptographically isolated refresh tokens (7d).
   - Refresh tokens feature MongoDB TTL indexes for automated server-side expiration.
   - Every database query strictly scopes operations to the verified `req.user.id`.
2. **API Layer Hardening:**
   - **Helmet:** Automatically enforces security headers (HSTS, XSS filtering, clickjacking protection).
   - **Rate Limiting:** `express-rate-limit` guards against brute-force attacks and volumetric DoS (1000 requests per 15-minute window per IP).
   - **CORS Whitelisting:** Strictly controls allowed client origins (`FRONTEND_URL`), preventing unauthorized cross-origin access.
   - **Request Sizing:** Strict 10MB payload cap on JSON bodies to prevent buffer exhaustion.
3. **AI Security & Zero Secret Leakage:**
   - `GEMINI_API_KEY` and third-party credentials reside exclusively within server-side environments. The frontend client never contacts AI providers directly.
   - Health and telemetry endpoints sanitize all internal system state; credentials and keys are never logged or exposed.
   - System prompts are static and immutable; user inputs are strictly injected into structured variables rather than raw prompt strings, mitigating prompt injection vulnerabilities.

---

## 🗺️ Roadmap & Future Horizons

- [x] **Milestone 1:** Monorepo Foundation & Microservice Scaffolding
- [x] **Milestone 2:** JWT Authentication, Session Management & User Profiles
- [x] **Milestone 3:** Multi-Format Resume Parsing & Skill Taxonomy Extraction
- [x] **Milestone 4:** Deterministic Skill Evidence & Career Requirement Matrix Matching
- [x] **Milestone 5:** Tri-Dimensional Readiness Scoring & Impact-Ranked Gap Prioritizer
- [x] **Milestone 6:** Topological Adaptive Learning Roadmaps with Dependency Sorting
- [x] **Milestone 7:** Historical Telemetry Analytics, Snapshot Engine & Trend Visualizations
- [x] **Milestone 8:** Grounded AI Career Architect & Context-Driven Advisory
- [x] **Milestone 9:** Live Opportunity Ingestion (JSearch) & Career Pipeline Ledger
- [x] **Milestone 10:** Simulated STAR Technical & Behavioral Mock Interview Engine
- [x] **Milestone 11:** Autonomous Multi-Agent Network & AI Orchestrator Dashboard
- [x] **Milestone 12:** Production Hardening, Dockerization & Observability Telemetry
- [ ] **Milestone 13 (Upcoming):** Real-time Bidirectional Audio Interviews via Gemini Live API (WebSockets)
- [ ] **Milestone 14 (Upcoming):** Local Vector Database Integration (ChromaDB / Qdrant) for Semantic Search
- [ ] **Milestone 15 (Upcoming):** Mobile Application (React Native / Expo)

---

## 🤝 Contributing

Contributions are welcomed! Follow these steps to ensure high code quality:

1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Adhere to Code Standards:**
   - TypeScript must pass in strict mode (`noImplicitAny`, zero warnings).
   - Follow feature-first architecture conventions.
   - Add unit/integration tests for any new backend services.
4. **Commit Changes:**
   ```bash
   git commit -m "feat(skills): add automated certification verification"
   ```
5. **Push and Open a Pull Request:**
   ```bash
   git push origin feature/amazing-feature
   ```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete terms.

```text
MIT License

Copyright (c) 2026 SkillBridge Platform Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">
  <sub>SkillBridge: Bridging Skills to Careers — Designed and Engineered with ❤️ for ambitious professionals and students.</sub>
</div>
