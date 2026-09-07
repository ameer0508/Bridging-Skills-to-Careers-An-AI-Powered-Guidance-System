from typing import List, Dict, Any

class RepositoryAnalyzer:
    """
    Evaluates repository complexity, modularity, star popularity, & project diversity.
    """

    @staticmethod
    def analyze_repositories(repos: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_repos = len(repos)
        total_stars = sum(r.get("stars", 0) for r in repos)
        total_forks = sum(r.get("forks", 0) for r in repos)
        
        topics_set = set()
        for r in repos:
            topics_set.update(r.get("topics", []))

        return {
            "total_repositories": total_repos,
            "total_stars": total_stars,
            "total_forks": total_forks,
            "unique_topics_count": len(topics_set),
            "project_diversity_score": min(98.0, len(topics_set) * 12.0)
        }
