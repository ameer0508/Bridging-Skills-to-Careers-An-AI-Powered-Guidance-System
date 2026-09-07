# SkillBridge Deployment Guide

## Architecture Overview
The platform consists of three containerized services:
1. **Frontend**: React application served via Nginx.
2. **Backend**: Express API server.
3. **AI Service**: FastAPI Python service communicating with Gemini.
4. **Database**: MongoDB (can be external or containerized).

## Environment Configuration
Create a `.env` file at the root or within each service directory:
```env
# Backend & AI Configuration
MONGO_URI=mongodb://mongodb:27017/skillbridge
JWT_SECRET=your_secure_secret_here
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_key
```

## Running with Docker Compose (Local & Production)
The repository includes a `docker-compose.yml` for unified deployment.
```bash
docker-compose up --build -d
```
This builds and starts the Frontend on port 3000, Backend on port 5000, AI Service on port 8000, and Mongo on port 27017.

## CI/CD Strategy
- **Linting & Tests**: Ensure `pnpm lint` and unit tests pass before merging to `main`.
- **Builds**: Docker images should be built on tag pushes.
- **Releases**: Update `CHANGELOG.md` upon every semantic release.
