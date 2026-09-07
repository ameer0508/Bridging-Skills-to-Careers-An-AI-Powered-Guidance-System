import time
import logging
from typing import Dict, Any, List, Optional
from app.networking_agent.connection_engine import ConnectionEngine
from app.networking_agent.relationship_graph import RelationshipGraph
from app.networking_agent.outreach_recommender import OutreachRecommender
from app.networking_agent.alumni_matcher import AlumniMatcher
from app.networking_agent.mentor_matcher import MentorMatcher
from app.networking_agent.event_matcher import EventMatcher
from app.networking_agent.conversation_planner import ConversationPlanner
from app.networking_agent.followup_scheduler import FollowupScheduler
from app.networking_agent.networking_reasoner import NetworkingReasoner
from app.networking_agent.relationship_tracker import RelationshipTracker
from app.networking_agent.opportunity_detector import NetworkingOpportunityDetector

logger = logging.getLogger("skillbridge-networking-agent")

class AutonomousNetworkingAgent:
    """
    Central Autonomous Networking Agent Facade for SkillBridge.
    Helps users identify, prioritize, & manage professional networking opportunities using explainable AI.
    """

    def run_networking_cycle(
        self,
        user_id: str,
        target_company: str = "OpenScale AI Systems",
        target_skill: str = "Vector Indexing & Milvus Architecture"
    ) -> Dict[str, Any]:
        start = time.time()

        connections = ConnectionEngine.recommend_connections(user_id, target_company)
        top_conn = connections[0] if connections else {}

        network_graph = RelationshipGraph.get_network_graph(user_id)
        outreach_draft = OutreachRecommender.generate_draft(
            top_conn.get("name", "Dr. Sarah Chen"),
            target_company,
            target_skill
        )
        alumni = AlumniMatcher.find_alumni(target_company)
        mentors = MentorMatcher.recommend_mentors(target_skill)
        events = EventMatcher.discover_events(target_skill)
        topics = ConversationPlanner.plan_topics(top_conn.get("name", "Dr. Sarah Chen"))
        followups = FollowupScheduler.get_reminders(user_id)
        reasoning = NetworkingReasoner.explain_match(top_conn.get("name", "Dr. Sarah Chen"), target_company)
        history = RelationshipTracker.get_interaction_history(user_id)
        opportunity = NetworkingOpportunityDetector.detect_opportunities(target_company)

        return {
            "user_id": user_id,
            "target_company": target_company,
            "target_skill": target_skill,
            "recommended_connections": connections,
            "network_graph": network_graph,
            "sample_outreach_draft": outreach_draft,
            "matched_alumni": alumni,
            "recommended_mentors": mentors,
            "upcoming_events": events,
            "conversation_topics": topics,
            "followup_reminders": followups,
            "match_reasoning": reasoning,
            "relationship_history": history,
            "detected_opportunities": opportunity,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

# Global Singleton Instance
networking_agent_instance = AutonomousNetworkingAgent()
