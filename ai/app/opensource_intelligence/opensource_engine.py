import time
import logging
from typing import Dict, Any, List, Optional
from app.opensource_intelligence.contribution_analyzer import ContributionAnalyzer
from app.opensource_intelligence.repository_influence import RepositoryInfluenceAnalyzer
from app.opensource_intelligence.maintainer_analyzer import MaintainerAnalyzer
from app.opensource_intelligence.issue_activity import IssueActivityAnalyzer
from app.opensource_intelligence.pull_request_analyzer import PullRequestAnalyzer
from app.opensource_intelligence.discussion_analyzer import DiscussionAnalyzer
from app.opensource_intelligence.review_analyzer import ReviewAnalyzer
from app.opensource_intelligence.community_score import CommunityScoreCalculator
from app.opensource_intelligence.influence_score import InfluenceScoreCalculator
from app.opensource_intelligence.evidence_engine import EvidenceEngine
from app.opensource_intelligence.cache_manager import OpenSourceCacheManager
from app.opensource_intelligence.sync_scheduler import OpenSourceSyncScheduler

logger = logging.getLogger("skillbridge-opensource")

class OpenSourceIntelligenceEngine:
    """
    Central Open Source Intelligence Engine Facade for SkillBridge.
    Evaluates open-source contributions, ecosystem influence, maintainer status, and community trust.
    """

    def __init__(self):
        self.cache = OpenSourceCacheManager()
        self.scheduler = OpenSourceSyncScheduler()

    def analyze_contributor(self, username: str, target_skills: Optional[List[str]] = None) -> Dict[str, Any]:
        start = time.time()
        cached = self.cache.get(username)
        if cached:
            return cached

        if target_skills is None:
            target_skills = ["Python", "FastAPI", "Docker", "Kubernetes", "Milvus"]

        contrib_res = ContributionAnalyzer.analyze_contributions(username)
        repo_res = RepositoryInfluenceAnalyzer.analyze_influence(username)
        maint_res = MaintainerAnalyzer.analyze_maintainer_status(username)
        issue_res = IssueActivityAnalyzer.analyze_issues(username)
        pr_res = PullRequestAnalyzer.analyze_prs(username)
        disc_res = DiscussionAnalyzer.analyze_discussions(username)
        review_res = ReviewAnalyzer.analyze_reviews(username)

        comm_res = CommunityScoreCalculator.calculate_community_score(contrib_res, review_res)
        infl_res = InfluenceScoreCalculator.calculate_influence_score(repo_res, maint_res)
        evidence_res = EvidenceEngine.verify_opensource_evidence(username, target_skills)

        result = {
            "username": username,
            "contribution_summary": contrib_res,
            "repository_influence": repo_res,
            "maintainer_status": maint_res,
            "issue_activity": issue_res,
            "pull_requests": pr_res,
            "discussions": disc_res,
            "code_reviews": review_res,
            "community_trust": comm_res,
            "opensource_influence": infl_res,
            "skill_evidence": evidence_res,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

        self.cache.set(username, result)
        self.scheduler.record_sync(username)
        return result

# Global Singleton Instance
opensource_intelligence_instance = OpenSourceIntelligenceEngine()
