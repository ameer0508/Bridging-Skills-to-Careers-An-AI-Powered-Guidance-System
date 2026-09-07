from typing import Dict, Any

class PortfolioScorer:
    """
    Calculates overall Portfolio Strength Score (0-100) and Hiring Readiness metrics.
    """

    @staticmethod
    def calculate_score(repo_analysis: Dict[str, Any], arch_analysis: Dict[str, Any], doc_analysis: Dict[str, Any]) -> Dict[str, Any]:
        stars = repo_analysis.get("total_stars", 0)
        arch_score = arch_analysis.get("architecture_maturity_score", 70.0)
        doc_score = doc_analysis.get("documentation_quality_score", 75.0)

        portfolio_score = min(98.5, 65.0 + (stars * 0.1) + (arch_score * 0.2) + (doc_score * 0.1))
        hiring_readiness = "Production Ready" if portfolio_score >= 85.0 else "Intermediate"

        return {
            "portfolio_strength_score": round(portfolio_score, 1),
            "engineering_maturity": "Senior Staff Architect" if portfolio_score >= 90.0 else "Senior Engineer",
            "hiring_readiness_status": hiring_readiness
        }
