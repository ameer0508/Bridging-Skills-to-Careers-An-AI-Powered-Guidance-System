import time
import logging
from typing import Dict, Any, List, Optional
from app.github_intelligence.github_client import GitHubClient
from app.github_intelligence.repository_analyzer import RepositoryAnalyzer
from app.github_intelligence.commit_analyzer import CommitAnalyzer
from app.github_intelligence.language_analyzer import LanguageAnalyzer
from app.github_intelligence.architecture_analyzer import ArchitectureAnalyzer
from app.github_intelligence.documentation_analyzer import DocumentationAnalyzer
from app.github_intelligence.collaboration_analyzer import CollaborationAnalyzer
from app.github_intelligence.portfolio_scorer import PortfolioScorer
from app.github_intelligence.skill_evidence import SkillEvidenceExtractor
from app.github_intelligence.cache_manager import GitHubCacheManager
from app.github_intelligence.sync_scheduler import GitHubSyncScheduler

logger = logging.getLogger("skillbridge-github")

class GitHubIntelligenceEngine:
    """
    Central GitHub Intelligence Engine Facade for SkillBridge.
    Analyzes software engineering capability, verifies resume skills against codebase evidence,
    and rates portfolio strength.
    """

    def __init__(self):
        self.client = GitHubClient()
        self.cache = GitHubCacheManager()
        self.scheduler = GitHubSyncScheduler()

    def analyze_profile(self, username: str, target_skills: Optional[List[str]] = None) -> Dict[str, Any]:
        start = time.time()
        cached = self.cache.get(username)
        if cached:
            return cached

        if target_skills is None:
            target_skills = ["Python", "FastAPI", "Docker", "Kubernetes", "TypeScript"]

        profile = self.client.fetch_user_profile(username)
        repos = self.client.fetch_user_repositories(username)

        repo_res = RepositoryAnalyzer.analyze_repositories(repos)
        commit_res = CommitAnalyzer.analyze_commit_activity(username)
        lang_res = LanguageAnalyzer.analyze_languages(repos)
        arch_res = ArchitectureAnalyzer.analyze_architecture(repos)
        doc_res = DocumentationAnalyzer.analyze_documentation(repos)
        collab_res = CollaborationAnalyzer.analyze_collaboration(username)

        score_res = PortfolioScorer.calculate_score(repo_res, arch_res, doc_res)
        evidence_res = SkillEvidenceExtractor.extract_skill_evidence(repos, target_skills)

        result = {
            "username": username,
            "profile_meta": profile,
            "repository_summary": repo_res,
            "commit_activity": commit_res,
            "languages": lang_res,
            "architecture": arch_res,
            "documentation": doc_res,
            "collaboration": collab_res,
            "portfolio_score": score_res,
            "skill_evidence": evidence_res,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

        self.cache.set(username, result)
        self.scheduler.record_sync(username)
        return result

# Global Singleton Instance
github_intelligence_instance = GitHubIntelligenceEngine()
