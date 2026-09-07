from typing import List, Dict
from app.skill_intelligence.skill_graph import skill_graph

class SkillRelationshipEngine:
    """
    Discovers semantic relationships, multi-hop ancestor paths, and child sub-skills.
    """

    @classmethod
    def discover_relationships(cls, canonical_name: str) -> List[Dict[str, str]]:
        rels = skill_graph.get_related_skills(canonical_name)
        if rels:
            return rels

        # Fallback heuristic relationships for unregistered skills
        clean = canonical_name.lower()
        fallback_rels = []

        if "python" in clean:
            fallback_rels.append({"related_skill": "Software Engineering", "type": "parent"})
        elif "react" in clean:
            fallback_rels.append({"related_skill": "JavaScript", "type": "prerequisite"})
            fallback_rels.append({"related_skill": "Frontend", "type": "parent"})
        elif "aws" in clean or "cloud" in clean:
            fallback_rels.append({"related_skill": "Cloud Platforms", "type": "parent"})
        elif "sql" in clean or "db" in clean:
            fallback_rels.append({"related_skill": "Databases", "type": "parent"})

        return fallback_rels
