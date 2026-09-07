import time
import logging
from typing import Dict, Any, List, Optional
from app.interview_agent.question_generator import QuestionGenerator
from app.interview_agent.technical_engine import TechnicalEngine
from app.interview_agent.behavioral_engine import BehavioralEngine
from app.interview_agent.coding_engine import CodingEngine
from app.interview_agent.system_design_engine import SystemDesignEngine
from app.interview_agent.answer_evaluator import AnswerEvaluator
from app.interview_agent.feedback_engine import FeedbackEngine
from app.interview_agent.confidence_engine import InterviewConfidenceEngine
from app.interview_agent.mock_interview import MockInterviewManager
from app.interview_agent.interview_reasoner import InterviewReasoner
from app.interview_agent.session_history import SessionHistoryManager

logger = logging.getLogger("skillbridge-interview-agent")

class AutonomousInterviewAgent:
    """
    Central Autonomous Interview Preparation Agent Facade for SkillBridge.
    Generates, adapts, evaluates, & continuously improves interview preparation using SkillBridge AI intelligence.
    """

    def run_interview_prep_cycle(
        self,
        user_id: str,
        company: str = "OpenScale AI Systems",
        target_role: str = "Principal AI Infrastructure Architect"
    ) -> Dict[str, Any]:
        start = time.time()

        questions = QuestionGenerator.generate_questions(company, target_role)
        tech_questions = TechnicalEngine.generate_technical_questions("Vector Indexing & Milvus Architecture")
        beh_questions = BehavioralEngine.generate_behavioral_questions()
        coding_challenge = CodingEngine.generate_coding_challenge()
        sys_design = SystemDesignEngine.generate_system_design_scenario(company)

        sample_eval = AnswerEvaluator.evaluate_answer(
            "q_sys_01",
            "I would architect a microservice in FastAPI using HNSW vector indexing in Milvus, yielding sub-40ms p99 latency."
        )
        feedback = FeedbackEngine.generate_feedback(sample_eval)
        readiness = InterviewConfidenceEngine.calculate_readiness(user_id, company)
        mock_session = MockInterviewManager.start_session(user_id, company, target_role)
        reasoning = InterviewReasoner.explain_evaluation("q_sys_01")
        history = SessionHistoryManager.get_history(user_id)

        return {
            "user_id": user_id,
            "company": company,
            "target_role": target_role,
            "generated_questions": questions,
            "technical_questions": tech_questions,
            "behavioral_questions": beh_questions,
            "coding_challenge": coding_challenge,
            "system_design_scenario": sys_design,
            "sample_answer_evaluation": sample_eval,
            "feedback": feedback,
            "interview_readiness": readiness,
            "mock_session": mock_session,
            "evaluation_reasoning": reasoning,
            "session_history": history,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

# Global Singleton Instance
interview_agent_instance = AutonomousInterviewAgent()
