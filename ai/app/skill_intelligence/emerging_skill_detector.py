import re
from typing import List, Set, Dict, Any

class EmergingSkillDetector:
    """
    Identifies modern emerging technologies and modern AI/Cloud tech stacks.
    """

    EMERGING_REGISTRY: Set[str] = {
        "generative ai", "llms", "prompt engineering", "langchain", "rag",
        "vector databases", "pinecone", "chromadb", "mlops", "kubernetes",
        "rust", "webassembly", "edge ai", "model context protocol", "mcp",
        "agentic ai", "transformers", "autogen", "crewai"
    }

    @classmethod
    def is_emerging(cls, skill_name: str) -> bool:
        clean = skill_name.lower().strip()
        for tech in cls.EMERGING_REGISTRY:
            if tech in clean or clean in tech:
                return True
        return False

    @classmethod
    def get_emerging_metadata(cls, skill_name: str) -> Dict[str, Any]:
        emerging = cls.is_emerging(skill_name)
        return {
            "is_emerging": emerging,
            "growth_trend": "+45% YoY Demand" if emerging else "Stable Industry Demand",
            "market_category": "Next-Gen AI & Modern Stack" if emerging else "Core Industry Stack"
        }
