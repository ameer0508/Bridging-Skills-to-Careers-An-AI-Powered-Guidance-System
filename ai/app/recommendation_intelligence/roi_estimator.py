from typing import Dict, Any

class ROIEstimator:
    """
    Estimates Learning Return-on-Investment (ROI), difficulty rating, and learning duration.
    """

    @classmethod
    def estimate_roi(cls, item_type: str, priority: str) -> Dict[str, Any]:
        if item_type in ["project", "certification"] and priority == "high":
            return {
                "learning_roi": "Exceptional",
                "estimated_learning_time": "3-4 weeks (15 hrs/week)",
                "difficulty": "Intermediate to Advanced",
                "roi_score": 96.0
            }
        elif item_type in ["course", "technology", "skill"]:
            return {
                "learning_roi": "Very High",
                "estimated_learning_time": "1-2 weeks (10 hrs/week)",
                "difficulty": "Intermediate",
                "roi_score": 88.0
            }
        elif item_type in ["resume_improvement", "github_improvement", "portfolio_improvement"]:
            return {
                "learning_roi": "Exceptional",
                "estimated_learning_time": "3-5 hours",
                "difficulty": "Beginner to Intermediate",
                "roi_score": 98.0
            }
        else:
            return {
                "learning_roi": "High",
                "estimated_learning_time": "1 week",
                "difficulty": "Intermediate",
                "roi_score": 80.0
            }
