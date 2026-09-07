import logging
from typing import List, Dict, Any, Optional
from app.recommendation_intelligence.recommendation_engine import RecommendationEngine
from app.recommendation_intelligence.recommendation_validator import RecommendationValidator
from app.recommendation_intelligence.recommendation_reasoner import RecommendationReasoner
from app.recommendation_intelligence.impact_predictor import ImpactPredictor
from app.recommendation_intelligence.roi_estimator import ROIEstimator
from app.recommendation_intelligence.learning_priority import LearningPriorityEngine
from app.recommendation_intelligence.recommendation_ranker import RecommendationRanker
from app.recommendation_intelligence.recommendation_explainer import RecommendationExplainer
from app.schemas.modules import RecommendationResponse, RecommendationItem

logger = logging.getLogger("skillbridge-ai")

class ExplainableRecommendationPipeline:
    """
    Enterprise 8-Stage Explainable AI Recommendation Pipeline.
    """

    @classmethod
    def execute(
        cls,
        user_skills: List[str],
        career_goal: str,
        learning_style: str = "hands-on",
        completed_learning: Optional[List[str]] = None
    ) -> RecommendationResponse:
        logger.info(f"[ExplainableRecommendationPipeline] Generating recommendations for goal '{career_goal}'...")

        # 1. Candidate Generation
        candidates = RecommendationEngine.generate_candidates(user_skills, career_goal, learning_style)

        # 2. Validation & Filtering
        validated = RecommendationValidator.validate_and_filter(
            candidates=candidates,
            completed_learning=completed_learning or [],
            user_skills=user_skills
        )

        processed_items: List[Dict[str, Any]] = []

        for item in validated:
            t = item["title"]
            item_type = item["type"]
            skills_imp = item.get("skills_improved", [])

            # 3. Reasoner & Evidence
            reasoning = RecommendationReasoner.generate_reasoning(t, item_type, career_goal, skills_imp)
            item["why_recommended"] = reasoning["why_recommended"]
            item["supporting_evidence"] = reasoning["supporting_evidence"]

            # 4. Impact Predictor
            impact = ImpactPredictor.predict_impact(t, item_type, career_goal, skills_imp)
            item["estimated_readiness_improvement"] = impact["estimated_readiness_improvement"]
            item["estimated_match_score_improvement"] = impact["estimated_match_score_improvement"]
            item["career_impact"] = impact

            # 5. ROI & Difficulty
            roi_data = ROIEstimator.estimate_roi(item_type, item["priority"])
            item["learning_roi"] = roi_data["learning_roi"]
            item["estimated_learning_time"] = roi_data["estimated_learning_time"]
            item["difficulty"] = roi_data["difficulty"]
            item["industry_demand"] = "Very High" if item["priority"] == "high" else "High"
            item["confidence"] = 0.96

            processed_items.append(item)

        # 6. Priority Ranking
        ranked_items = RecommendationRanker.rank_recommendations(processed_items)

        # 7. Map to RecommendationItem DTO List
        item_models: List[RecommendationItem] = []
        for r in ranked_items:
            item_models.append(RecommendationItem(
                title=r["title"],
                type=r["type"],
                reason=r["reason"],
                priority=r["priority"],
                why_recommended=r.get("why_recommended"),
                supporting_evidence=r.get("supporting_evidence", []),
                skills_improved=r.get("skills_improved", []),
                career_impact=str(r.get("career_impact", {})),
                estimated_readiness_improvement=r.get("estimated_readiness_improvement", 10.0),
                estimated_match_score_improvement=r.get("estimated_match_score_improvement", 12.0),
                estimated_learning_time=r.get("estimated_learning_time", "1-2 weeks"),
                difficulty=r.get("difficulty", "Intermediate"),
                industry_demand=r.get("industry_demand", "High"),
                learning_roi=r.get("learning_roi", "High"),
                confidence=r.get("confidence", 0.95)
            ))

        logger.info(f"[ExplainableRecommendationPipeline] Successfully generated {len(item_models)} explainable recommendations.")
        return RecommendationResponse(recommendations=item_models)
