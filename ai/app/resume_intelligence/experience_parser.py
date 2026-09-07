import re
from typing import List
from app.resume_intelligence.semantic_entities import SemanticExperience, SemanticExtractedEntity

class ExperienceParser:
    """
    Parses Work Experience section text into structured SemanticExperience objects.
    """

    @classmethod
    def parse_experience_section(cls, text: str) -> List[SemanticExperience]:
        if not text.strip():
            return []

        experiences: List[SemanticExperience] = []
        blocks = cls._split_into_job_blocks(text)

        for block in blocks:
            lines = [l.strip() for l in block.splitlines() if l.strip()]
            if not lines:
                continue

            first_line = lines[0]
            role, company = cls._extract_role_and_company(first_line)
            duration = cls._extract_duration(block)
            responsibilities = [
                SemanticExtractedEntity(
                    value=l.strip('•-*\t '),
                    confidence=0.90,
                    source="experience_bullets",
                    transformer_model="experience-parser-v1",
                    extraction_method="bullet-extraction"
                )
                for l in lines[1:] if len(l) > 10
            ]

            experiences.append(SemanticExperience(
                company=SemanticExtractedEntity(
                    value=company,
                    confidence=0.92,
                    source="experience_header",
                    transformer_model="experience-parser-v1",
                    extraction_method="header-ner"
                ) if company else None,
                role=SemanticExtractedEntity(
                    value=role,
                    confidence=0.94,
                    source="experience_header",
                    transformer_model="experience-parser-v1",
                    extraction_method="header-ner"
                ) if role else None,
                duration=SemanticExtractedEntity(
                    value=duration,
                    confidence=0.88,
                    source="experience_dates",
                    transformer_model="experience-parser-v1",
                    extraction_method="date-regex"
                ) if duration else None,
                responsibilities=responsibilities
            ))

        return experiences

    @classmethod
    def _split_into_job_blocks(cls, text: str) -> List[str]:
        # Split by empty double lines or date headers
        raw_blocks = re.split(r'\n\s*\n', text)
        return [b for b in raw_blocks if len(b.strip()) > 15]

    @classmethod
    def _extract_role_and_company(cls, line: str) -> Tuple[str, str]:
        # Examples: "Software Engineer at Google", "Senior Developer - Tech Corp", "Data Scientist | Amazon"
        delimiters = [r'\s+at\s+', r'\s+-\s+', r'\s+\|\s+', r'\s+,\s+']
        for d in delimiters:
            parts = re.split(d, line, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) == 2:
                return parts[0].strip(), parts[1].strip()
        return line.strip(), ""

    @classmethod
    def _extract_duration(cls, text: str) -> str:
        date_pattern = r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[0-9]{2}/)?[0-9]{4}\s*(?:-|to|–)\s*(?:Present|Current|[0-9]{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[0-9]{2}/)[0-9]{4}))'
        match = re.search(date_pattern, text, re.IGNORECASE)
        return match.group(1).strip() if match else ""
