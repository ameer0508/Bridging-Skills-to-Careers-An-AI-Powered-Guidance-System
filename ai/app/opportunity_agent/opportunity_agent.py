import time
import logging
from typing import Dict, Any, List, Optional
from app.opportunity_agent.discovery_engine import OpportunityDiscoveryEngine
from app.opportunity_agent.ranking_engine import OpportunityRankingEngine
from app.opportunity_agent.eligibility_engine import EligibilityEngine
from app.opportunity_agent.deadline_monitor import OpportunityDeadlineMonitor
from app.opportunity_agent.competition_analyzer import CompetitionAnalyzer
from app.opportunity_agent.scholarship_engine import ScholarshipEngine
from app.opportunity_agent.fellowship_engine import FellowshipEngine
from app.opportunity_agent.internship_engine import InternshipEngine
from app.opportunity_agent.startup_program_engine import StartupProgramEngine
from app.opportunity_agent.event_engine import EventEngine
from app.opportunity_agent.opportunity_reasoner import OpportunityReasoner
from app.opportunity_agent.notification_engine import OpportunityNotificationEngine

logger = logging.getLogger("skillbridge-opportunity-agent")

class AutonomousOpportunityAgent:
    """
    Central Autonomous Opportunity Discovery Agent Facade for SkillBridge.
    Continuously discovers, evaluates, ranks, & explains professional opportunities across careers, research, & entrepreneurship.
    """

    def run_discovery_cycle(self, user_id: str, user_skills: Optional[List[str]] = None) -> Dict[str, Any]:
        start = time.time()

        if user_skills is None:
            user_skills = ["FastAPI", "Python", "Docker", "Vector DB"]

        raw_opportunities = OpportunityDiscoveryEngine.discover_all(user_skills)
        ranked_ops = OpportunityRankingEngine.rank_opportunities(raw_opportunities)
        top_op = ranked_ops[0] if ranked_ops else {}

        eligibility = EligibilityEngine.check_eligibility(top_op.get("id", "opp_fel_01"), {"user_id": user_id})
        deadlines = OpportunityDeadlineMonitor.get_urgent_deadlines(user_id)
        competitions = CompetitionAnalyzer.get_competitions()
        scholarships = ScholarshipEngine.get_scholarships()
        fellowships = FellowshipEngine.get_fellowships()
        internships = InternshipEngine.get_internships()
        startup_programs = StartupProgramEngine.get_startup_programs()
        events = EventEngine.get_events()
        reasoning = OpportunityReasoner.explain_opportunity_match(top_op.get("id", "opp_fel_01"), top_op.get("title", "Fellowship"))

        OpportunityNotificationEngine.send_opportunity_digest(user_id, len(ranked_ops))

        return {
            "user_id": user_id,
            "top_ranked_opportunities": ranked_ops,
            "eligibility": eligibility,
            "upcoming_deadlines": deadlines,
            "competitions": competitions,
            "scholarships": scholarships,
            "fellowships": fellowships,
            "internships": internships,
            "startup_programs": startup_programs,
            "events": events,
            "match_reasoning": reasoning,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

# Global Singleton Instance
opportunity_agent_instance = AutonomousOpportunityAgent()
