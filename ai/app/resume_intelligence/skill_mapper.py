from typing import Dict, List
from app.resume_intelligence.semantic_entities import SemanticSkill
from app.resume_intelligence.skill_lexicon import get_lexicon

# Resume sections that legitimately evidence a skill. The header (name, contact details,
# profile links) and unclassified text are deliberately excluded.
SKILL_BEARING_SECTIONS = ("skills", "summary", "experience", "projects", "certifications", "education")


class SkillMapper:
    """
    Lexicon-based skill extraction.

    Maps terms found in the resume to canonical skill names using the shared skill lexicon.
    This is deterministic term matching (see skill_lexicon.py for the rules); it is not a
    machine-learning model and only recognises skills present in the lexicon.
    """

    @classmethod
    def extract_semantic_skills(cls, text: str) -> List[SemanticSkill]:
        """Extracts skills from a block of text. Each skill is returned once."""
        skills: List[SemanticSkill] = []
        for mention in get_lexicon().find_mentions(text):
            skills.append(SemanticSkill(
                name=mention.skill.name,
                category=mention.skill.category,
                # Canonical-name hits are slightly more certain than alias hits
                confidence=0.95 if mention.matched_text.lower() == mention.skill.name.lower() else 0.9,
                source="skill_lexicon",
                transformer_model="skill-lexicon-v1",
                extraction_method="lexicon-term-match",
                parent_domains=list(mention.skill.implies)
            ))
        return skills

    @classmethod
    def extract_from_sections(cls, sections: Dict[str, str], full_text: str) -> List[SemanticSkill]:
        """
        Extracts skills only from sections that can evidence them. When the resume has no
        recognisable headings, falls back to the whole text (links are always ignored).
        """
        relevant = [sections[name] for name in SKILL_BEARING_SECTIONS if sections.get(name)]
        if not relevant:
            return cls.extract_semantic_skills(full_text)
        return cls.extract_semantic_skills("\n".join(relevant))
