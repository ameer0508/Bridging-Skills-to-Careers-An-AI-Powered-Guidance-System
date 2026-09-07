import time
import logging
from typing import Dict, Any, List, Optional
from app.coding_intelligence.provider_manager import CodingProviderManager
from app.coding_intelligence.contest_analyzer import ContestAnalyzer
from app.coding_intelligence.problem_analyzer import ProblemAnalyzer
from app.coding_intelligence.topic_analyzer import TopicAnalyzer
from app.coding_intelligence.difficulty_estimator import DifficultyEstimator
from app.coding_intelligence.interview_readiness import InterviewReadinessEvaluator
from app.coding_intelligence.cache_manager import CodingCacheManager
from app.coding_intelligence.sync_scheduler import CodingSyncScheduler

logger = logging.getLogger("skillbridge-coding")

class CodingPlatformIntelligenceEngine:
    """
    Central Coding Platform Intelligence Engine Facade for SkillBridge.
    Aggregates profile evidence across LeetCode, Codeforces, HackerRank, CodeChef, and GeeksforGeeks.
    Computes FAANG Interview Readiness & DSA Mastery.
    """

    def __init__(self):
        self.provider_mgr = CodingProviderManager()
        self.cache = CodingCacheManager()
        self.scheduler = CodingSyncScheduler()

    def analyze_profile(self, username: str) -> Dict[str, Any]:
        start = time.time()
        cached = self.cache.get(username)
        if cached:
            return cached

        platform_profiles = self.provider_mgr.fetch_all_platforms(username)
        contest_res = ContestAnalyzer.analyze_contests(platform_profiles)
        problem_res = ProblemAnalyzer.analyze_problems(platform_profiles)
        topic_res = TopicAnalyzer.analyze_topics(username)
        diff_res = DifficultyEstimator.estimate_difficulty(problem_res)
        readiness_res = InterviewReadinessEvaluator.evaluate_readiness(contest_res, problem_res)

        result = {
            "username": username,
            "platform_profiles": platform_profiles,
            "contest_analysis": contest_res,
            "problem_summary": problem_res,
            "topic_analysis": topic_res,
            "difficulty_estimation": diff_res,
            "interview_readiness": readiness_res,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

        self.cache.set(username, result)
        self.scheduler.record_sync(username)
        return result

# Global Singleton Instance
coding_intelligence_instance = CodingPlatformIntelligenceEngine()
