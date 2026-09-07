import time
import logging
from typing import Dict, Any, List, Optional
from app.job_search_agent.search_engine import JobSearchEngine
from app.job_search_agent.ranking_engine import JobRankingEngine
from app.job_search_agent.application_tracker import ApplicationTracker
from app.job_search_agent.company_monitor import CompanyMonitor
from app.job_search_agent.recruiter_signal import RecruiterSignalDetector
from app.job_search_agent.opportunity_ranker import OpportunityRanker
from app.job_search_agent.job_reasoner import JobReasoner
from app.job_search_agent.salary_negotiation import SalaryNegotiationEngine
from app.job_search_agent.deadline_tracker import DeadlineTracker
from app.job_search_agent.interview_tracker import InterviewTracker
from app.job_search_agent.notification_engine import JobNotificationEngine

logger = logging.getLogger("skillbridge-job-agent")

class AutonomousJobAgent:
    """
    Central Autonomous Job Search Agent Facade for SkillBridge.
    Continuously discovers, ranks, tracks, monitors, & explains employment opportunities.
    """

    def run_agent_cycle(self, user_id: str, target_role: str = "Principal AI Infrastructure Architect") -> Dict[str, Any]:
        start = time.time()

        raw_opportunities = JobSearchEngine.search_opportunities(target_role)
        ranked_ops = OpportunityRanker.rank_opportunities(raw_opportunities)

        top_match = ranked_ops[0] if ranked_ops else {}
        match_eval = JobRankingEngine.calculate_match(top_match, ["FastAPI", "Python", "Docker", "Vector DB"])
        company_meta = CompanyMonitor.inspect_company(top_match.get("company", "OpenScale AI Systems"))
        recruiter_meta = RecruiterSignalDetector.detect_signals(top_match.get("company", "OpenScale AI Systems"))
        reasoning = JobReasoner.explain_job_match(top_match.get("job_id", "job_ai_01"), top_match.get("company", "OpenScale AI Systems"))
        tracked_apps = ApplicationTracker.get_tracked_applications(user_id)
        interviews = InterviewTracker.get_scheduled_interviews(user_id)
        deadlines = DeadlineTracker.get_upcoming_deadlines(user_id)
        salary_guidance = SalaryNegotiationEngine.get_negotiation_strategy(220000)

        JobNotificationEngine.send_opportunity_alert(user_id, top_match.get("title", target_role), top_match.get("company", "OpenScale AI Systems"))

        return {
            "user_id": user_id,
            "target_role": target_role,
            "top_ranked_opportunities": ranked_ops,
            "top_match_evaluation": match_eval,
            "company_insights": company_meta,
            "recruiter_signals": recruiter_meta,
            "match_reasoning": reasoning,
            "tracked_applications": tracked_apps,
            "scheduled_interviews": interviews,
            "upcoming_deadlines": deadlines,
            "salary_negotiation": salary_guidance,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

# Global Singleton Instance
job_agent_instance = AutonomousJobAgent()
