import time
import logging
from typing import Dict, Any, List, Optional
from app.learning_agent.curriculum_planner import CurriculumPlanner
from app.learning_agent.learning_scheduler import LearningScheduler
from app.learning_agent.adaptive_learning import AdaptiveLearningEngine
from app.learning_agent.prerequisite_engine import PrerequisiteEngine
from app.learning_agent.progress_monitor import ProgressMonitor
from app.learning_agent.difficulty_estimator import DifficultyEstimator
from app.learning_agent.resource_selector import ResourceSelector
from app.learning_agent.revision_planner import RevisionPlanner
from app.learning_agent.milestone_predictor import MilestonePredictor
from app.learning_agent.learning_reasoner import LearningReasoner
from app.learning_agent.reminder_engine import LearningReminderEngine

logger = logging.getLogger("skillbridge-learning-agent")

class AutonomousLearningAgent:
    """
    Central Autonomous Learning Agent Facade for SkillBridge.
    Continuously plans, adapts, monitors, & optimizes a user's learning journey using SkillBridge AI intelligence.
    """

    def run_learning_cycle(self, user_id: str, target_skill: str = "Vector Indexing & Milvus Architecture") -> Dict[str, Any]:
        start = time.time()

        curriculum = CurriculumPlanner.generate_curriculum(target_skill)
        schedule = LearningScheduler.create_schedule(user_id)
        prereq_check = PrerequisiteEngine.check_prerequisites(target_skill, ["Python", "FastAPI"])
        progress = ProgressMonitor.get_progress(user_id)
        difficulty = DifficultyEstimator.estimate_difficulty(target_skill)
        resources = ResourceSelector.select_resources(target_skill)
        revisions = RevisionPlanner.plan_revisions(user_id)
        prediction = MilestonePredictor.predict_completion(user_id, target_skill)
        reasoning = LearningReasoner.explain_curriculum_choice(target_skill)
        adaptation = AdaptiveLearningEngine.adapt_path(user_id)

        LearningReminderEngine.send_study_reminder(user_id, target_skill)

        return {
            "user_id": user_id,
            "target_skill": target_skill,
            "curriculum": curriculum,
            "schedule": schedule,
            "prerequisites": prereq_check,
            "progress": progress,
            "difficulty": difficulty,
            "curated_resources": resources,
            "revisions": revisions,
            "milestone_prediction": prediction,
            "reasoning": reasoning,
            "adaptation": adaptation,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

# Global Singleton Instance
learning_agent_instance = AutonomousLearningAgent()
