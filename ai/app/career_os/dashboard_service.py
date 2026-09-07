import time
import logging
from typing import Dict, Any
from app.career_os.briefing_engine import BriefingEngine
from app.career_os.priority_engine import PriorityEngine
from app.career_os.digest_generator import DigestGenerator
from app.career_os.activity_aggregator import ActivityAggregator
from app.career_os.action_center import ActionCenter
from app.career_os.recommendation_hub import RecommendationHub
from app.career_os.notification_center import NotificationCenter
from app.career_os.insight_engine import InsightEngine
from app.career_os.workflow_summary import WorkflowSummaryEngine

logger = logging.getLogger("skillbridge-career-os")

class CareerOSDashboardService:
    """
    Central CareerOS API Facade for SkillBridge.
    Aggregates every Autonomous AI Agent & Intelligence Module into a single, unified Command Center payload.
    """

    def get_dashboard_payload(self, user_id: str) -> Dict[str, Any]:
        start = time.time()

        briefing = BriefingEngine.generate_briefing(user_id)
        priorities = PriorityEngine.get_top_priorities(user_id)
        digest = DigestGenerator.generate_digest(user_id)
        activities = ActivityAggregator.aggregate_activities(user_id)
        actions = ActionCenter.get_action_items(user_id)
        recommendations = RecommendationHub.get_unified_recommendations(user_id)
        notifications = NotificationCenter.get_notifications(user_id)
        insights = InsightEngine.generate_career_insights(user_id)
        workflow = WorkflowSummaryEngine.get_summary(user_id)

        return {
            "user_id": user_id,
            "briefing": briefing,
            "priorities": priorities,
            "digest": digest,
            "activities": activities,
            "action_center": actions,
            "recommendations": recommendations,
            "notifications": notifications,
            "career_insights": insights,
            "active_workflow": workflow,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

# Global Singleton Instance
career_os_dashboard_service_instance = CareerOSDashboardService()
