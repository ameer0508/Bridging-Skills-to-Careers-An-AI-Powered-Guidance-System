import time
import logging
from typing import Dict, Any, List, Optional
from app.market_intelligence.trend_provider import TrendFilter, MarketTrendPoint
from app.market_intelligence.provider_manager import TrendProviderManager
from app.market_intelligence.skill_trend_analyzer import SkillTrendAnalyzer
from app.market_intelligence.technology_forecaster import TechnologyForecaster
from app.market_intelligence.industry_analyzer import IndustryAnalyzer
from app.market_intelligence.regional_market_analyzer import RegionalMarketAnalyzer
from app.market_intelligence.hiring_velocity import HiringVelocityEngine
from app.market_intelligence.demand_predictor import DemandPredictor
from app.market_intelligence.market_scoring import MarketScoringEngine
from app.market_intelligence.cache_manager import MarketCacheManager
from app.market_intelligence.health_monitor import MarketHealthMonitor

logger = logging.getLogger("skillbridge-ai")

class MarketEngine:
    """
    Central Market Trends Intelligence Engine orchestrator for SkillBridge.
    Unified facade providing live skill trends, tech forecasts, industry benchmarks,
    regional opportunity maps, hiring velocity, and composite opportunity scoring.
    """

    def __init__(self):
        self.provider_manager = TrendProviderManager()
        self.cache_manager = MarketCacheManager()
        self.health_monitor = MarketHealthMonitor()

    def get_market_intelligence(self, filter_params: TrendFilter) -> Dict[str, Any]:
        cache_key = f"market:{filter_params.category}:{filter_params.query}:{filter_params.country}"
        cached = self.cache_manager.get(cache_key)
        if cached:
            return cached

        start_time = time.time()
        # 1. Fetch market trend points
        trends = self.provider_manager.fetch_all_trends(filter_params)
        latency_ms = (time.time() - start_time) * 1000
        self.health_monitor.record_request("MarketEngine", latency_ms, True)

        # 2. Categorization & Top Demand Analysis
        categorized_trends = SkillTrendAnalyzer.categorize_trends(trends)
        top_in_demand = SkillTrendAnalyzer.get_top_in_demand(trends)

        # 3. Technology Forecast & Declining Skills
        emerging_tech = TechnologyForecaster.forecast_emerging_technologies(trends)
        declining_skills = TechnologyForecaster.identify_declining_skills()

        # 4. Industry & Regional Analysis
        industry_health = IndustryAnalyzer.get_industry_health_scores()
        regional_opportunities = RegionalMarketAnalyzer.get_regional_opportunity_indices()

        # 5. Hiring Velocity
        velocity = HiringVelocityEngine.compute_role_velocity(filter_params.query or "AI Architect")

        # 6. AI Demand Enrichment
        enriched_demand = DemandPredictor.enrich_skill_intelligence(filter_params.query or "Vector Indexing")

        # 7. Composite Market Scores
        scoring = MarketScoringEngine.compute_composite_scores(
            demand=95.0,
            growth=28.4,
            saturation=35.0,
            competition=55.0
        )

        result = {
            "query": filter_params.model_dump(),
            "trend_count": len(trends),
            "top_in_demand": top_in_demand,
            "categorized_trends": categorized_trends,
            "technology_forecast": {
                "emerging_technologies": emerging_tech,
                "declining_skills": declining_skills
            },
            "industry_health": industry_health,
            "regional_opportunities": regional_opportunities,
            "hiring_velocity": velocity,
            "ai_enriched_intelligence": enriched_demand,
            "market_scores": scoring,
            "telemetry": {
                "latency_ms": round(latency_ms, 2),
                "cache": self.cache_manager.get_telemetry(),
                "system_health": self.health_monitor.get_system_health()
            }
        }

        self.cache_manager.set(cache_key, result, ttl_seconds=1800)
        return result

# Global Instance
market_engine_instance = MarketEngine()
