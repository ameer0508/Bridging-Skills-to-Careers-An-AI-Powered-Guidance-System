import os
import time
import logging
from typing import Any, List, Dict, Optional
from app.providers.base_provider import BaseAIProvider
from app.schemas.ai_response import UnifiedAIResponse
from app.utils.response_normalizer import ResponseNormalizer

logger = logging.getLogger("skillbridge-ai")

class MockProvider(BaseAIProvider):
    """
    Mock Provider Adapter for SkillBridge development and test environments.
    Strictly disabled in production unless explicitly overridden.
    """

    def __init__(self, model_name: str = "mock-v1"):
        self._model_name = model_name

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def default_model(self) -> str:
        return self._model_name

    def is_available(self) -> bool:
        env = os.getenv("ENV", "development").lower()
        return env != "production" or os.getenv("USE_MOCK_PROVIDER", "false").lower() == "true"

    def generate_content(self, prompt: str, **kwargs) -> UnifiedAIResponse:
        start_time = time.time()
        text = f"Mock AI Response for prompt: '{prompt[:40]}...'. As SkillBridge Career Architect, I recommend focusing on core technical competencies and portfolio projects."
        latency = (time.time() - start_time) * 1000
        return ResponseNormalizer.normalize_success(
            raw_data=text,
            provider=self.provider_name,
            model=self._model_name,
            latency_ms=latency,
            prompt_text=prompt,
            completion_text=text,
            metadata={"mock_mode": True}
        )

    def parse_resume_text(self, text: str, schema_class: Any) -> UnifiedAIResponse:
        start_time = time.time()
        mock_data = {
            "personalInfo": {
                "fullName": {"value": "Jane Doe", "confidence": 0.95},
                "email": {"value": "jane.doe@example.com", "confidence": 0.98},
                "phone": {"value": "+1-555-0199", "confidence": 0.90}
            },
            "education": [
                {
                    "institution": {"value": "Stanford University", "confidence": 0.95},
                    "degree": {"value": "B.S. Computer Science", "confidence": 0.95},
                    "endYear": {"value": "2024", "confidence": 0.90}
                }
            ],
            "experience": [
                {
                    "company": {"value": "Tech Corp", "confidence": 0.92},
                    "role": {"value": "Software Engineer Intern", "confidence": 0.95},
                    "responsibilities": [{"value": "Built REST APIs with Node.js and React", "confidence": 0.90}]
                }
            ],
            "projects": [
                {
                    "name": {"value": "SkillBridge Career App", "confidence": 0.95},
                    "description": {"value": "AI-powered career guidance platform", "confidence": 0.90},
                    "technologies": [{"value": "TypeScript", "confidence": 0.95}, {"value": "Python", "confidence": 0.95}]
                }
            ],
            "skills": [
                {"name": "TypeScript", "category": "Programming Languages", "confidence": 0.98},
                {"name": "Python", "category": "Programming Languages", "confidence": 0.95},
                {"name": "React", "category": "Frameworks", "confidence": 0.92},
                {"name": "Node.js", "category": "Frameworks", "confidence": 0.90},
                {"name": "MongoDB", "category": "Databases", "confidence": 0.88}
            ],
            "certifications": [],
            "achievements": [],
            "languages": [{"value": "English", "confidence": 0.99}],
            "interests": []
        }
        latency = (time.time() - start_time) * 1000
        return ResponseNormalizer.normalize_success(
            raw_data=mock_data,
            provider=self.provider_name,
            model=self._model_name,
            latency_ms=latency,
            prompt_text=text[:100],
            completion_text=str(mock_data),
            metadata={"mock_mode": True}
        )

    def normalize_skills(self, raw_skills: List[str], schema_class: Any) -> UnifiedAIResponse:
        start_time = time.time()
        normalized_skills = []
        for raw in raw_skills:
            normalized_skills.append({
                "raw_name": raw,
                "canonical_name": raw.capitalize(),
                "category": "Tools" if "git" in raw.lower() else "Programming Languages",
                "aliases": [raw.lower(), raw.upper()],
                "relationships": []
            })
        mock_data = {"normalized_skills": normalized_skills}
        latency = (time.time() - start_time) * 1000
        return ResponseNormalizer.normalize_success(
            raw_data=mock_data,
            provider=self.provider_name,
            model=self._model_name,
            latency_ms=latency,
            prompt_text=str(raw_skills),
            completion_text=str(mock_data),
            metadata={"mock_mode": True}
        )

    def match_career(self, user_skills: List[str], target_role: str, experience_years: float, schema_class: Any) -> UnifiedAIResponse:
        start_time = time.time()
        mock_data = {
            "match_score": 85.0,
            "matched_skills": user_skills[:3] if user_skills else ["Python"],
            "missing_skills": ["Docker", "Kubernetes"],
            "summary": f"Strong technical foundation for {target_role}. Adding cloud containerization will raise match to 95%."
        }
        latency = (time.time() - start_time) * 1000
        return ResponseNormalizer.normalize_success(
            raw_data=mock_data,
            provider=self.provider_name,
            model=self._model_name,
            latency_ms=latency,
            prompt_text=f"{user_skills} -> {target_role}",
            completion_text=str(mock_data),
            metadata={"mock_mode": True}
        )

    def calculate_readiness(self, user_skills: List[str], required_skills: List[str], role_title: str, schema_class: Any) -> UnifiedAIResponse:
        start_time = time.time()
        mock_data = {
            "readiness_score": 78.5,
            "readiness_level": "High",
            "strengths": user_skills[:2] if user_skills else ["Problem Solving"],
            "gaps": [s for s in required_skills if s not in user_skills][:2],
            "action_items": [
                "Complete a hands-on system design project",
                "Obtain AWS Certified Developer Associate certification",
                "Contribute to open source repositories"
            ]
        }
        latency = (time.time() - start_time) * 1000
        return ResponseNormalizer.normalize_success(
            raw_data=mock_data,
            provider=self.provider_name,
            model=self._model_name,
            latency_ms=latency,
            prompt_text=f"{user_skills} vs {required_skills}",
            completion_text=str(mock_data),
            metadata={"mock_mode": True}
        )

    def generate_recommendations(self, user_skills: List[str], career_goal: str, learning_style: str, schema_class: Any) -> UnifiedAIResponse:
        start_time = time.time()
        mock_data = {
            "recommendations": [
                {
                    "title": "Advanced Microservices Architecture with Node.js & FastAPI",
                    "type": "course",
                    "reason": "Fills critical backend system design gap for senior role",
                    "priority": "high"
                },
                {
                    "title": "Build an AI Intelligence Gateway Project",
                    "type": "project",
                    "reason": "Demonstrates enterprise AI engineering and provider fallback patterns",
                    "priority": "high"
                }
            ]
        }
        latency = (time.time() - start_time) * 1000
        return ResponseNormalizer.normalize_success(
            raw_data=mock_data,
            provider=self.provider_name,
            model=self._model_name,
            latency_ms=latency,
            prompt_text=f"{user_skills} -> {career_goal}",
            completion_text=str(mock_data),
            metadata={"mock_mode": True}
        )

    def generate_roadmap(self, current_level: str, target_role: str, target_months: int, schema_class: Any) -> UnifiedAIResponse:
        start_time = time.time()
        mock_data = {
            "title": f"Mastery Path to {target_role}",
            "estimated_months": target_months,
            "phases": [
                {
                    "phase": 1,
                    "title": "Foundational Core & API Architecture",
                    "duration_weeks": 4,
                    "focus_skills": ["TypeScript", "FastAPI", "MongoDB"],
                    "milestones": ["Build RESTful services", "Implement Auth & Database indexing"]
                },
                {
                    "phase": 2,
                    "title": "AI Integration & System Scaling",
                    "duration_weeks": 8,
                    "focus_skills": ["LLM Gateways", "Docker", "Caching"],
                    "milestones": ["Deploy multi-provider AI gateway", "Implement Redis caching & rate limiting"]
                }
            ]
        }
        latency = (time.time() - start_time) * 1000
        return ResponseNormalizer.normalize_success(
            raw_data=mock_data,
            provider=self.provider_name,
            model=self._model_name,
            latency_ms=latency,
            prompt_text=f"{current_level} -> {target_role}",
            completion_text=str(mock_data),
            metadata={"mock_mode": True}
        )

    def generate_analytics(self, user_id: str, skills_trend: List[Dict[str, Any]], schema_class: Any) -> UnifiedAIResponse:
        start_time = time.time()
        mock_data = {
            "overall_skill_growth_rate": 18.4,
            "market_relevance_index": 92.0,
            "insights": [
                {
                    "metric": "AI Backend Architecture",
                    "finding": "High market demand growth (+42% YoY)",
                    "impact": "positive",
                    "actionable_tip": "Highlight gateway routing and multi-provider experience on your resume."
                }
            ]
        }
        latency = (time.time() - start_time) * 1000
        return ResponseNormalizer.normalize_success(
            raw_data=mock_data,
            provider=self.provider_name,
            model=self._model_name,
            latency_ms=latency,
            prompt_text=user_id,
            completion_text=str(mock_data),
            metadata={"mock_mode": True}
        )

    def analyze_resume_intelligence(self, resume_text: str, target_role: Optional[str], schema_class: Any) -> UnifiedAIResponse:
        start_time = time.time()
        mock_data = {
            "overall_quality_score": 88.0,
            "ats_compatibility_score": 94.0,
            "formatting_critique": ["Use standard section headings", "Ensure single-column layout for ATS"],
            "content_improvements": ["Quantify bullet points with impact metrics (e.g., improved response time by 35%)"],
            "keyword_optimizations": ["FastAPI", "AI Gateway", "System Architecture", "MongoDB"]
        }
        latency = (time.time() - start_time) * 1000
        return ResponseNormalizer.normalize_success(
            raw_data=mock_data,
            provider=self.provider_name,
            model=self._model_name,
            latency_ms=latency,
            prompt_text=resume_text[:100],
            completion_text=str(mock_data),
            metadata={"mock_mode": True}
        )
