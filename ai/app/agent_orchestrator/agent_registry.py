from typing import Dict, Any, List

class AgentRegistry:
    """
    Central registry registering all SkillBridge Autonomous AI Agents.
    """

    _REGISTRY: Dict[str, Dict[str, Any]] = {
        "career_agent": {"name": "Career Planning Agent", "version": "1.0.0", "status": "ACTIVE"},
        "learning_agent": {"name": "Learning Agent", "version": "1.0.0", "status": "ACTIVE"},
        "job_agent": {"name": "Job Search Agent", "version": "1.0.0", "status": "ACTIVE"},
        "resume_agent": {"name": "Resume Optimization Agent", "version": "1.0.0", "status": "ACTIVE"},
        "interview_agent": {"name": "Interview Preparation Agent", "version": "1.0.0", "status": "ACTIVE"},
        "networking_agent": {"name": "Networking Agent", "version": "1.0.0", "status": "ACTIVE"},
        "opportunity_agent": {"name": "Opportunity Discovery Agent", "version": "1.0.0", "status": "ACTIVE"}
    }

    @classmethod
    def list_agents(cls) -> List[Dict[str, Any]]:
        return [{"agent_id": k, **v} for k, v in cls._REGISTRY.items()]
