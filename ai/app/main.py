from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.logging import logger
from app.config.ai_config import ai_config
from app.gateway.ai_gateway import ai_gateway
from app.routers import (
    health, extract, skills, chat,
    career, readiness, recommendations,
    roadmap, analytics, resume_intelligence,
    salary, market, courses, certifications,
    external_gateway, knowledge_graph, events,
    feature_store, ai_operations, github, linkedin, portfolio, coding, opensource, brand, professional_graph, agent, job_agent_router, learning_agent_router, resume_agent_router, interview_agent_router, networking_agent_router, opportunity_agent_router, orchestrator_router, memory_router
)
from app.career_os import dashboard_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logging hooks
    logger.info("SkillBridge Enterprise AI Intelligence Layer starting...")
    logger.info(f"Service configured for [{settings.ENV}] mode on port {settings.PORT}")
    logger.info(f"Primary AI Provider: [{ai_config.primary_provider}] | Mock Enabled: [{ai_config.enable_mock_provider}]")
    yield
    # Shutdown logging hooks
    logger.info("SkillBridge Enterprise AI Intelligence Layer shutting down...")

app = FastAPI(
    title="SkillBridge AI Intelligence Layer",
    description="Enterprise Modular AI Gateway for Resume Parsing, Skill Extraction, Career Matching, and Guidance Services",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route registries
app.include_router(health.router)
app.include_router(extract.router)
app.include_router(skills.router)
app.include_router(chat.router)
app.include_router(career.router)
app.include_router(readiness.router)
app.include_router(recommendations.router)
app.include_router(roadmap.router)
app.include_router(analytics.router)
app.include_router(resume_intelligence.router)
app.include_router(salary.router)
app.include_router(market.router)
app.include_router(courses.router)
app.include_router(certifications.router)
app.include_router(external_gateway.router)
app.include_router(knowledge_graph.router)
app.include_router(events.router)
app.include_router(feature_store.router)
app.include_router(ai_operations.router)
app.include_router(github.router)
app.include_router(linkedin.router)
app.include_router(portfolio.router)
app.include_router(coding.router)
app.include_router(opensource.router)
app.include_router(brand.router)
app.include_router(professional_graph.router)
app.include_router(agent.router)
app.include_router(job_agent_router.router)
app.include_router(learning_agent_router.router)
app.include_router(resume_agent_router.router)
app.include_router(interview_agent_router.router)
app.include_router(networking_agent_router.router)
app.include_router(opportunity_agent_router.router)
app.include_router(orchestrator_router.router)
app.include_router(memory_router.router)
app.include_router(dashboard_router.router)

@app.get("/")
def read_root():
    return {
        "success": True,
        "message": "SkillBridge Enterprise AI Intelligence Layer Active",
        "version": "1.0.0",
        "primary_provider": ai_config.primary_provider,
        "active_providers": list(ai_gateway.providers.keys())
    }
