# SkillBridge

### Official Academic Title: Bridging Skills to Careers: An AI-Powered Guidance System

SkillBridge is an enterprise-grade, AI-powered Career Intelligence Platform. It is designed to help students and professionals bridge the gap between their current skills and their desired careers through intelligent analysis, personalized guidance, adaptive learning roadmaps, and AI-powered recommendations.

## Version: `1.0.0` (Production Hardened)
Status: Stable / Production Ready

---

## 🚀 Technology Stack

### Frontend

- **Framework:** React 19, Vite, TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v4, Framer Motion (for fluid animations)
- **Routing:** React Router v7 / standard router
- **State Management & Data Fetching:** Zustand (global store), TanStack Query v5 (server cache), Axios (HTTP Client)
- **Form & Validation:** React Hook Form, Zod

### Backend API

- **Runtime & Framework:** Node.js, Express.js, TypeScript (Strict Mode)
- **Database:** MongoDB & Mongoose (Object Data Modeling)
- **Logging:** Winston (Structured JSON logger)
- **Validation:** Zod (environment and request payload schema validation)

### AI Service

- **Framework:** Python 3.10+, FastAPI, Uvicorn
- **Environment & Schemas:** Pydantic v2, Pydantic Settings
- **Machine Learning & NLP Libraries:** spaCy, Scikit-learn, Sentence Transformers, NumPy, Pandas
- **Document Processing:** pdfplumber, PyMuPDF, python-docx

### Development & Tooling

- **Package Manager:** `pnpm` (Monorepo Workspaces)
- **Code Quality:** ESLint, Prettier, EditorConfig

---

## 📂 Workspace Structure

The project is structured as a monorepo containing three isolated services:

```text
Bridging Skills to Careers An AI-Powered Guidance System/
├── frontend/             # React SPA Application
├── backend/              # Node.js Express REST API
├── ai/                   # FastAPI Service (Python ML/NLP)
├── docs/                 # Platform Documentation & Specs
│   ├── ARCHITECTURE.md   # System Architecture & Design
│   ├── API_REFERENCE.md  # API Endpoints Spec
│   └── CHANGELOG.md      # Project Release History
├── pnpm-workspace.yaml   # pnpm Workspace Configuration
├── package.json          # Root orchestration tasks
├── .gitignore            # Global file ignore rules
├── .editorconfig         # Code editor formatting rules
└── .gitattributes        # Git line endings normalization
```

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **pnpm** v8 or higher
- **Python** 3.10 or higher
- **MongoDB** (Local or Atlas instance)

### Installation

1. Clone the repository and navigate to the project directory:

   ```bash
   git clone <repository-url>
   cd "Bridging Skills to Careers An AI-Powered Guidance System"
   ```

2. Install Node.js dependencies for frontend and backend:

   ```bash
   pnpm install
   ```

3. Setup Python virtual environment for the AI service:

   ```bash
   cd ai
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   pip install -r requirements.txt
   cd ..
   ```

4. Create environmental configurations:
   - Copy `.env.example` to `.env` in `frontend/`, `backend/`, and `ai/` directories and fill in the values.

---

## 💻 Available Scripts & Deployment

SkillBridge is fully containerized and production-ready via Docker Compose.

```bash
docker-compose up --build -d
```
This spins up the Nginx frontend (port 3000), Node backend (port 5000), Python AI service (port 8000), and MongoDB. See `docs/DEPLOYMENT.md` for production variables and scaling strategies.

Alternatively, you can run isolated services locally:

| Script              | Description                                            |
| :------------------ | :----------------------------------------------------- |
| `pnpm dev`          | Starts Frontend, Backend, and AI services concurrently |
| `pnpm dev:frontend` | Starts only the Vite React Frontend                    |
| `pnpm dev:backend`  | Starts only the Express Backend API                    |
| `pnpm dev:ai`       | Starts only the FastAPI Python Service                 |
| `pnpm build`        | Builds both Frontend (Vite) and Backend (TS compile)   |
| `pnpm lint`         | Runs ESLint validations across frontend and backend    |
| `pnpm format`       | Formats all code files using Prettier                  |

---

## 🛡️ Coding Standards

- **TypeScript:** Strict type checks enabled (`strict: true`). No implicit `any`. Use interfaces for data models and types for utilities/props.
- **Python:** Strict type hints using Pydantic schemas. Follow PEP 8 guidelines.
- **Imports:** Absolute imports/path aliases enabled.
  - Frontend: `@/*` maps to `src/*`
  - Backend: `@/*` maps to `src/*`
- **Linting & Formatting:** ESLint checks must pass without warnings. Formatting is enforced via Prettier (2-space tabs, double quotes, trailing commas).
- **Error Handling:** Centralized. Never let exceptions bubble up unhandled. Always return standardized JSON error payloads.

---

## 🗺️ Future Roadmap

- **Milestone 2:** Authentication & User Profiles
- **Milestone 3:** Resume Parsing & Skill Extraction (spaCy / PyMuPDF)
- **Milestone 4:** Skill Gap Analysis & Skill Graph Architecture
- **Milestone 5:** AI Career Architect & Adaptive Learning Roadmaps
- **Milestone 6:** Job & Resource Recommendations & Progress Tracking
