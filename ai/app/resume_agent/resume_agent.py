import time
import logging
from typing import Dict, Any, List, Optional
from app.resume_agent.ats_optimizer import ATSOptimizer
from app.resume_agent.keyword_engine import KeywordEngine
from app.resume_agent.tailoring_engine import TailoringEngine
from app.resume_agent.section_optimizer import SectionOptimizer
from app.resume_agent.bullet_optimizer import BulletOptimizer
from app.resume_agent.achievement_generator import AchievementGenerator
from app.resume_agent.evidence_validator import EvidenceValidator
from app.resume_agent.formatting_analyzer import FormattingAnalyzer
from app.resume_agent.version_manager import VersionManager
from app.resume_agent.resume_reasoner import ResumeReasoner
from app.resume_agent.export_manager import ExportManager

logger = logging.getLogger("skillbridge-resume-agent")

class AutonomousResumeAgent:
    """
    Central Autonomous Resume Optimization Agent Facade for SkillBridge.
    Analyzes, improves, tailors, & validates resumes against target careers & ATS systems using SkillBridge AI intelligence.
    """

    def run_optimization_cycle(
        self,
        user_id: str,
        target_role: str = "Principal AI Infrastructure Architect",
        original_resume: Optional[str] = None
    ) -> Dict[str, Any]:
        start = time.time()

        if original_resume is None:
            original_resume = "Experienced software engineer with FastAPI and Python."

        ats_eval = ATSOptimizer.evaluate_ats(original_resume, target_role)
        keywords = KeywordEngine.extract_keywords(target_role)
        tailoring = TailoringEngine.tailor_resume({"user_id": user_id}, target_role)
        bullet_opt = BulletOptimizer.optimize_bullet("Built vector search microservice in FastAPI.")
        achievements = AchievementGenerator.generate_achievements(target_role)
        evidence = EvidenceValidator.validate_claims(user_id, ["Python", "FastAPI", "Docker", "Kubernetes", "Terraform"])
        formatting = FormattingAnalyzer.analyze_formatting(original_resume)
        versions = VersionManager.get_versions(user_id)
        reasoning = ResumeReasoner.explain_changes(target_role)
        export_preview = ExportManager.export_resume({"name": "Alex Mercer", "summary": tailoring["tailored_summary"]})

        return {
            "user_id": user_id,
            "target_role": target_role,
            "ats_evaluation": ats_eval,
            "keywords": keywords,
            "tailored_profile": tailoring,
            "sample_bullet_optimization": bullet_opt,
            "suggested_achievements": achievements,
            "evidence_validation": evidence,
            "formatting": formatting,
            "version_history": versions,
            "optimization_reasoning": reasoning,
            "export_preview": export_preview,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

# Global Singleton Instance
resume_agent_instance = AutonomousResumeAgent()
