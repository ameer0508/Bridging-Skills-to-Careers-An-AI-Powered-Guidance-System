import time
import logging
from typing import Dict, Any, Optional
from app.career_agent.goal_manager import GoalManager
from app.career_agent.strategy_planner import StrategyPlanner
from app.career_agent.reasoning_engine import AgentReasoningEngine
from app.career_agent.task_generator import TaskGenerator
from app.career_agent.adaptation_engine import AdaptationEngine
from app.career_agent.milestone_tracker import MilestoneTracker
from app.career_agent.planner_memory import PlannerMemory
from app.career_agent.execution_engine import ExecutionEngine
from app.career_agent.progress_evaluator import ProgressEvaluator

logger = logging.getLogger("skillbridge-agent")

class CareerPlanningAgent:
    """
    Central Autonomous Career Planning Agent Facade for SkillBridge.
    Reasons, plans, adapts, monitors, & executes personalized career strategies.
    """

    def __init__(self):
        self.memory = PlannerMemory()

    def run_agent_session(self, user_id: str, trigger_adaptation: bool = False) -> Dict[str, Any]:
        start = time.time()

        goal = GoalManager.get_user_goal(user_id)
        strategy = StrategyPlanner.generate_strategy(user_id, goal["target_role"])
        reasoning = AgentReasoningEngine.explain_strategy(user_id, goal["target_role"])
        tasks = TaskGenerator.generate_tasks(goal["target_role"])
        progress = MilestoneTracker.track_progress(user_id)
        evaluation = ProgressEvaluator.evaluate(user_id)

        adaptation_res = None
        if trigger_adaptation:
            adaptation_res = AdaptationEngine.adapt_plan(user_id, "Market Demand Surge for AI Vector DB Indexing")

        self.memory.log_decision(user_id, f"Executed plan session for role [{goal['target_role']}]")

        return {
            "user_id": user_id,
            "goal": goal,
            "strategy": strategy,
            "reasoning": reasoning,
            "actionable_tasks": tasks,
            "progress_tracking": progress,
            "readiness_evaluation": evaluation,
            "adaptation": adaptation_res,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

# Global Singleton Instance
career_agent_instance = CareerPlanningAgent()
