from typing import List, Dict, Any
from app.skill_intelligence.ontology_manager import OntologyManager

class SkillClusterer:
    """
    Groups skills into cohesive functional domain clusters.
    """

    @classmethod
    def cluster_skills(cls, skills: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        clusters: Dict[str, List[Dict[str, Any]]] = {}

        for skill_item in skills:
            category = skill_item.get("category") or OntologyManager.get_category_for_skill(skill_item.get("canonical_name", ""))
            
            # Map category to higher-level domain cluster
            if category in ["Programming Languages", "Frontend", "Backend"]:
                cluster_name = "Software Engineering & Full Stack"
            elif category in ["AI / ML", "Data Science"]:
                cluster_name = "AI, Data & Machine Learning"
            elif category in ["Cloud Platforms", "DevOps", "Networking", "Operating Systems"]:
                cluster_name = "Cloud Infrastructure & DevOps"
            elif category in ["Cybersecurity"]:
                cluster_name = "Cybersecurity & Defense"
            elif category in ["Databases"]:
                cluster_name = "Database & Data Architecture"
            elif category in ["Soft Skills", "Business Skills"]:
                cluster_name = "Professional & Leadership Skills"
            else:
                cluster_name = "Tools & Supporting Technologies"

            if cluster_name not in clusters:
                clusters[cluster_name] = []
            clusters[cluster_name].append(skill_item)

        return clusters
