from typing import List

class AgentSelector:
    """
    Dynamically selects optimal sub-agents required to fulfill user intent.
    """

    @staticmethod
    def select_agents_for_intent(user_intent: str) -> List[str]:
        return ["career_agent", "learning_agent", "resume_agent", "interview_agent", "job_agent", "networking_agent", "opportunity_agent"]
