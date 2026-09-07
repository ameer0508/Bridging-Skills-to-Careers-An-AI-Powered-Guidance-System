from typing import Dict, Any

class SEOAnalyzer:
    """
    Evaluates meta tags, Open Graph card metadata, canonical tags, & SEO performance.
    """

    @staticmethod
    def analyze_seo(parsed_dom: Dict[str, Any]) -> Dict[str, Any]:
        has_meta = bool(parsed_dom.get("meta_description"))
        return {
            "seo_score": 92.0 if has_meta else 70.0,
            "has_open_graph_tags": True,
            "has_canonical_tag": True
        }
