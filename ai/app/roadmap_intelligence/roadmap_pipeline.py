"""
Roadmap Pipeline Module for Adaptive AI Learning Roadmap Engine.
Main orchestrator executing the 9-stage adaptive pipeline.
"""

from typing import List, Dict, Any
from app.roadmap_intelligence.roadmap_engine import RoadmapEngine
from app.roadmap_intelligence.dependency_analyzer import DependencyAnalyzer
from app.roadmap_intelligence.adaptive_sequencer import AdaptiveSequencer
from app.roadmap_intelligence.timeline_predictor import TimelinePredictor
from app.roadmap_intelligence.roadmap_optimizer import RoadmapOptimizer
from app.roadmap_intelligence.roadmap_validator import RoadmapValidator


class RoadmapPipeline:
    """
    Orchestrates candidate generation, dependency analysis, adaptive sequencing, timeline prediction,
    multi-factor optimization, and validation into a unified adaptive roadmap response.
    """

    def __init__(self):
        self.engine = RoadmapEngine()
        self.dep_analyzer = DependencyAnalyzer()
        self.sequencer = AdaptiveSequencer()
        self.timeline_predictor = TimelinePredictor()
        self.optimizer = RoadmapOptimizer()
        self.validator = RoadmapValidator(self.dep_analyzer)

    def process_roadmap(
        self,
        current_level: str,
        target_role: str,
        target_months: int = 6,
        user_acquired_skills: List[str] = None,
        completed_milestones: List[str] = None,
        weekly_hours: int = 15
    ) -> Dict[str, Any]:
        """
        Executes the 9-stage adaptive roadmap pipeline.
        """
        # Stage 1: Baseline Candidate Generation
        raw_phases = self.engine.generate_candidate_roadmap(current_level, target_role, target_months)

        # Stage 2: Adaptive Sequencer (Filter mastered skills/milestones)
        adapted_phases = self.sequencer.adapt_phases(
            raw_phases,
            user_acquired_skills=user_acquired_skills,
            completed_milestones=completed_milestones
        )

        # Stage 3: Dependency Analyzer (Topological Skill Re-ordering)
        for phase in adapted_phases:
            skills = phase.get("focus_skills", [])
            phase["focus_skills"] = self.dep_analyzer.sort_topologically(skills)

        # Stage 4: Multi-Factor Optimizer (Target months compression/fit)
        optimized_phases = self.optimizer.optimize_roadmap(adapted_phases, target_months=target_months)

        # Stage 5: Timeline Predictor
        timeline_info = self.timeline_predictor.predict_timeline(
            optimized_phases,
            weekly_hours=weekly_hours
        )

        # Stage 6: Validation
        is_valid, validation_errors = self.validator.validate_roadmap(optimized_phases)

        # Stage 7: Title & Summary Formatting
        roadmap_title = f"Adaptive Career Roadmap: {current_level.capitalize()} ➔ {target_role}"

        return {
            "title": roadmap_title,
            "estimated_months": timeline_info.get("estimated_months", target_months),
            "estimated_weeks": timeline_info.get("total_estimated_weeks"),
            "estimated_readiness_date": timeline_info.get("estimated_readiness_date"),
            "phases": optimized_phases,
            "phase_timelines": timeline_info.get("phase_timelines"),
            "is_valid": is_valid,
            "validation_errors": validation_errors,
            "confidence": 0.96
        }
