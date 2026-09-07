from typing import List, Dict, Any

class TaskPlanner:
    """
    Plans execution DAGs (Directed Acyclic Graphs) for complex career goals.
    """

    @staticmethod
    def plan_workflow(goal: str) -> List[Dict[str, Any]]:
        return [
            {"step": 1, "agent_id": "career_agent", "action": "Define Career Strategy & Milestones", "parallel": False},
            {"step": 2, "agent_id": "learning_agent", "action": "Generate Vector DB & Infrastructure Curriculum", "parallel": True},
            {"step": 2, "agent_id": "resume_agent", "action": "Tailor Resume for Principal AI Infrastructure Architect", "parallel": True},
            {"step": 3, "agent_id": "interview_agent", "action": "Conduct System Design & Vector Indexing Mock Interviews", "parallel": False},
            {"step": 4, "agent_id": "job_agent", "action": "Discover & Rank High-Match Openings", "parallel": True},
            {"step": 4, "agent_id": "networking_agent", "action": "Identify Alumni & Referral Contacts", "parallel": True},
            {"step": 4, "agent_id": "opportunity_agent", "action": "Discover Fellowships & Startup Accelerators", "parallel": True}
        ]
