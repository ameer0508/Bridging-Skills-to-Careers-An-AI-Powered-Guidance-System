from typing import List, Dict, Any

class LanguageAnalyzer:
    """
    Analyzes language breakdown, primary tech stack, & framework proficiency.
    """

    @staticmethod
    def analyze_languages(repos: List[Dict[str, Any]]) -> Dict[str, Any]:
        lang_counts: Dict[str, int] = {}
        for r in repos:
            lang = r.get("language")
            if lang:
                lang_counts[lang] = lang_counts.get(lang, 0) + 1

        primary = max(lang_counts, key=lang_counts.get) if lang_counts else "Python"
        return {
            "primary_language": primary,
            "language_distribution": lang_counts,
            "languages_count": len(lang_counts)
        }
