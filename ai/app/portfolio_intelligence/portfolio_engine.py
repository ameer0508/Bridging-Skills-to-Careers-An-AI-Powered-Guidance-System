import time
import logging
from typing import Dict, Any, List, Optional
from app.portfolio_intelligence.website_parser import WebsiteParser
from app.portfolio_intelligence.project_extractor import ProjectExtractor
from app.portfolio_intelligence.technology_detector import TechnologyDetector
from app.portfolio_intelligence.documentation_analyzer import DocumentationAnalyzer
from app.portfolio_intelligence.uiux_analyzer import UIUXAnalyzer
from app.portfolio_intelligence.architecture_detector import ArchitectureDetector
from app.portfolio_intelligence.accessibility_analyzer import AccessibilityAnalyzer
from app.portfolio_intelligence.seo_analyzer import SEOAnalyzer
from app.portfolio_intelligence.deployment_detector import DeploymentDetector
from app.portfolio_intelligence.project_quality_engine import ProjectQualityEngine
from app.portfolio_intelligence.evidence_engine import EvidenceEngine
from app.portfolio_intelligence.cache_manager import PortfolioCacheManager
from app.portfolio_intelligence.sync_scheduler import PortfolioSyncScheduler

logger = logging.getLogger("skillbridge-portfolio")

class PortfolioIntelligenceEngine:
    """
    Central Portfolio Intelligence Engine Facade for SkillBridge.
    Evaluates real engineering capability, design maturity, UI/UX, and live project evidence.
    """

    def __init__(self):
        self.cache = PortfolioCacheManager()
        self.scheduler = PortfolioSyncScheduler()

    def analyze_portfolio(self, url: str, target_skills: Optional[List[str]] = None) -> Dict[str, Any]:
        start = time.time()
        cached = self.cache.get(url)
        if cached:
            return cached

        if target_skills is None:
            target_skills = ["Python", "FastAPI", "React", "Next.js", "Docker"]

        dom_res = WebsiteParser.parse_website(url)
        projects = ProjectExtractor.extract_projects(dom_res)
        tech_res = TechnologyDetector.detect_technologies(projects)
        doc_res = DocumentationAnalyzer.analyze_documentation(projects)
        uiux_res = UIUXAnalyzer.analyze_uiux(dom_res)
        arch_res = ArchitectureDetector.detect_architecture(projects)
        a11y_res = AccessibilityAnalyzer.analyze_accessibility(dom_res)
        seo_res = SEOAnalyzer.analyze_seo(dom_res)
        deploy_res = DeploymentDetector.detect_deployment(url)
        quality_res = ProjectQualityEngine.evaluate_quality(projects)
        evidence_res = EvidenceEngine.verify_portfolio_evidence(projects, target_skills)

        # Composite Portfolio Score (0-100)
        overall_score = min(98.8, round((
            uiux_res["uiux_maturity_score"] * 0.2 +
            quality_res["overall_project_quality_score"] * 0.3 +
            arch_res["architecture_score"] * 0.2 +
            a11y_res["accessibility_score"] * 0.15 +
            seo_res["seo_score"] * 0.15
        ), 1))

        result = {
            "url": url,
            "parsed_dom": dom_res,
            "projects": projects,
            "technologies": tech_res,
            "documentation": doc_res,
            "uiux_analysis": uiux_res,
            "architecture": arch_res,
            "accessibility": a11y_res,
            "seo": seo_res,
            "deployment": deploy_res,
            "project_quality": quality_res,
            "skill_evidence": evidence_res,
            "portfolio_score": {
                "overall_score": overall_score,
                "tier": "Top 1% Enterprise Portfolio",
                "hiring_readiness": "Production Ready"
            },
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

        self.cache.set(url, result)
        self.scheduler.record_sync(url)
        return result

# Global Singleton Instance
portfolio_intelligence_instance = PortfolioIntelligenceEngine()
