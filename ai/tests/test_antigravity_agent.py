"""
Automated unit and integration test suite for the Google Antigravity Career Intelligence Agent.
Validates custom tools, Pydantic schemas, agent orchestration, and FastAPI endpoint execution.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.career_agent.antigravity_tools import (
    benchmark_role_prerequisites,
    audit_skill_gaps,
    synthesize_learning_trajectory,
    query_market_opportunity_radar,
)
from app.career_agent.antigravity_schemas import (
    AutonomousCareerIntelligenceReport,
    RoleBenchmarkData,
    SkillGapBreakdown,
)
from app.career_agent.antigravity_agent import AutonomousCareerIntelligenceAgent

@pytest.fixture
def client():
    return TestClient(app)

def test_benchmark_role_prerequisites_ai_engineer():
    res = benchmark_role_prerequisites("AI Engineer")
    assert res["target_role"] == "AI Engineer"
    assert "Python" in res["prerequisite_skills"]
    assert "PyTorch" in res["prerequisite_skills"]
    assert res["market_demand_rating"] == "Very High"
    assert res["benchmark_confidence"] > 0.9

def test_benchmark_role_prerequisites_fullstack():
    res = benchmark_role_prerequisites("Full Stack Software Engineer")
    assert "TypeScript" in res["prerequisite_skills"]
    assert "React" in res["prerequisite_skills"]
    assert res["market_demand_rating"] == "High"

def test_audit_skill_gaps_partial_match():
    candidate_skills = ["Python", "Docker", "FastAPI"]
    res = audit_skill_gaps(candidate_skills, "AI Engineer")
    assert "Python" in res["verified_skills"]
    assert "PyTorch" in res["missing_skills"]
    assert len(res["critical_gaps"]) > 0
    assert 0 <= res["match_score"] <= 100
    assert 0 <= res["gap_percentage"] <= 100

def test_synthesize_learning_trajectory():
    gaps = ["Vector Databases", "LLM Fine-Tuning", "RAG Architecture"]
    res = synthesize_learning_trajectory(gaps, timeline_months=6)
    assert res["timeline_months"] == 6
    assert len(res["phases"]) == 3
    assert res["phases"][0]["phase_number"] == 1
    assert "Vector Databases" in res["phases"][0]["title"]
    assert len(res["phases"][0]["milestones"]) > 0
    assert res["phases"][0]["milestones"][0]["deliverable"] is not None

def test_query_market_opportunity_radar():
    res = query_market_opportunity_radar("Data Architect", "Remote")
    assert "$" in res["estimated_salary_range"]
    assert len(res["top_employers"]) > 0
    assert "Remote" in res["remote_work_availability"]

import asyncio

def test_agent_run_analysis_deterministic():
    agent = AutonomousCareerIntelligenceAgent(api_key=None)
    report = asyncio.run(agent.run_analysis(
        target_role="AI Engineer",
        candidate_skills=["Python", "FastAPI"],
        timeline_months=6
    ))
    assert isinstance(report, AutonomousCareerIntelligenceReport)
    assert report.candidate_target_role == "AI Engineer"
    assert report.benchmark.match_score >= 0
    assert report.gap_analysis.gap_percentage >= 0
    assert len(report.remediation_roadmap) == 3
    assert report.next_best_action.action_key.startswith("remediate_")
    assert report.agent_confidence_score >= 0.9

def test_fastapi_autonomous_guidance_endpoint(client):
    payload = {
        "target_role": "AI Engineer",
        "candidate_skills": ["Python", "FastAPI", "Docker"],
        "timeline_months": 6
    }
    response = client.post("/api/v1/agent/autonomous-guidance", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["candidate_target_role"] == "AI Engineer"
    assert "benchmark" in data
    assert "gap_analysis" in data
    assert "remediation_roadmap" in data
    assert "market_intelligence" in data
    assert "next_best_action" in data
    assert len(data["remediation_roadmap"]) == 3
    assert data["benchmark"]["match_score"] > 0
