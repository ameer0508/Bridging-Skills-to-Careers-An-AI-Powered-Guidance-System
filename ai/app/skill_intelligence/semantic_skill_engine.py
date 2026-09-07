import logging
from typing import List, Dict, Any
from app.skill_intelligence.semantic_similarity import SemanticSimilarity
from app.skill_intelligence.ontology_manager import OntologyManager
from app.skill_intelligence.skill_relationships import SkillRelationshipEngine
from app.skill_intelligence.proficiency_estimator import ProficiencyEstimator
from app.skill_intelligence.transferable_skill_detector import TransferableSkillDetector
from app.skill_intelligence.emerging_skill_detector import EmergingSkillDetector
from app.skill_intelligence.career_relevance import CareerRelevanceEngine
from app.skill_intelligence.skill_clusterer import SkillClusterer
from app.schemas.skill import NormalizedSkill, SkillRelationship, SkillProficiency, SkillCareerRelevance

logger = logging.getLogger("skillbridge-ai")

class SemanticSkillEngine:
    """
    Enterprise Semantic Skill Intelligence Engine.
    Executes end-to-end skill resolution, ontology mapping, relationship discovery, proficiency estimation,
    transferable skill detection, emerging tech identification, and career relevance scoring.
    """

    @classmethod
    def analyze_skills(cls, raw_skills: List[str], context_text: str = "") -> Dict[str, Any]:
        logger.info(f"[SemanticSkillEngine] Analyzing {len(raw_skills)} skills...")

        normalized_list: List[NormalizedSkill] = []
        skill_dicts: List[Dict[str, Any]] = []

        for raw in raw_skills:
            if not raw or not raw.strip():
                continue

            # 1. Alias & Similarity Resolution
            canonical_name, sim_confidence = SemanticSimilarity.resolve_canonical_name(raw)

            # 2. Ontology Category Mapping
            category = OntologyManager.get_category_for_skill(canonical_name)

            # 3. Relationship Discovery
            raw_rels = SkillRelationshipEngine.discover_relationships(canonical_name)
            relationships = [
                SkillRelationship(related_skill=r["related_skill"], type=r["type"])
                for r in raw_rels
            ]

            # 4. Proficiency Estimation
            prof_data = ProficiencyEstimator.estimate_proficiency(
                skill_name=canonical_name,
                context_text=context_text,
                experience_years=3.0 if "senior" in context_text.lower() else 1.0,
                mention_count=context_text.lower().count(raw.lower()) + 1
            )
            proficiency = SkillProficiency(
                level=prof_data["level"],
                confidence=prof_data["confidence"],
                evidence_score=prof_data["evidence_score"]
            )

            # 5. Transferable Skills Inference
            transferable = TransferableSkillDetector.detect_transferable_skills(canonical_name)

            # 6. Emerging Tech Detection
            is_emerging = EmergingSkillDetector.is_emerging(canonical_name)

            # 7. Career Relevance Scoring
            relevance_data = CareerRelevanceEngine.calculate_relevance(canonical_name, category)
            career_relevance = SkillCareerRelevance(
                score=relevance_data["score"],
                industry_demand=relevance_data["industry_demand"],
                recommendation_priority=relevance_data["recommendation_priority"],
                learning_priority=relevance_data["learning_priority"],
                growth_potential=relevance_data["growth_potential"]
            )

            # 8. Generate Evidence Traces
            evidence = [
                f"Extracted from input string: '{raw}'",
                f"Mapped to taxonomy category: '{category}'",
                f"Resolved via semantic similarity index with {sim_confidence*100:.0f}% confidence"
            ]

            norm_skill = NormalizedSkill(
                raw_name=raw,
                canonical_name=canonical_name,
                category=category,
                aliases=[raw.strip().lower(), raw.strip().upper()],
                relationships=relationships,
                proficiency=proficiency,
                career_relevance=career_relevance,
                is_emerging=is_emerging,
                transferable_skills=transferable,
                evidence=evidence,
                confidence=round(sim_confidence * prof_data["confidence"], 2),
                source="semantic_skill_engine"
            )
            normalized_list.append(norm_skill)
            skill_dicts.append(norm_skill.model_dump())

        # 9. Skill Clustering
        clusters = SkillClusterer.cluster_skills(skill_dicts)

        return {
            "normalized_skills": [s.model_dump() for s in normalized_list],
            "skill_clusters": clusters,
            "total_skills_analyzed": len(normalized_list),
            "emerging_skills_detected": sum(1 for s in normalized_list if s.is_emerging)
        }
