import re
from typing import List
from app.resume_intelligence.semantic_entities import SemanticProject, SemanticExtractedEntity

class ProjectParser:
    """
    Parses Projects section text into structured SemanticProject objects.
    """

    @classmethod
    def parse_projects_section(cls, text: str) -> List[SemanticProject]:
        if not text.strip():
            return []

        projects: List[SemanticProject] = []
        blocks = [b.strip() for b in re.split(r'\n\s*\n', text) if b.strip()]

        for block in blocks:
            lines = [l.strip() for l in block.splitlines() if l.strip()]
            if not lines:
                continue

            name = lines[0].strip('•-*\t ')
            description = lines[1] if len(lines) > 1 else name
            tech_stack = cls._extract_tech_stack(block)
            contributions = [
                SemanticExtractedEntity(
                    value=l.strip('•-*\t '),
                    confidence=0.90,
                    source="project_bullets",
                    transformer_model="project-parser-v1",
                    extraction_method="bullet-extraction"
                )
                for l in lines[2:] if len(l) > 10
            ]

            projects.append(SemanticProject(
                name=SemanticExtractedEntity(
                    value=name,
                    confidence=0.93,
                    source="project_title",
                    transformer_model="project-parser-v1",
                    extraction_method="title-ner"
                ),
                description=SemanticExtractedEntity(
                    value=description,
                    confidence=0.90,
                    source="project_summary",
                    transformer_model="project-parser-v1",
                    extraction_method="text-summary"
                ),
                technologies=[
                    SemanticExtractedEntity(
                        value=t,
                        confidence=0.95,
                        source="project_tech",
                        transformer_model="project-parser-v1",
                        extraction_method="tech-regex"
                    ) for t in tech_stack
                ],
                contributions=contributions
            ))

        return projects

    @classmethod
    def _extract_tech_stack(cls, text: str) -> List[str]:
        # Match lines like "Technologies: Python, React, MongoDB" or "Tech Stack: TypeScript, Docker"
        match = re.search(r'(?:Technologies|Tech Stack|Built with|Tools used)[:\s]*(.+)', text, re.IGNORECASE)
        if match:
            return [t.strip() for t in match.group(1).split(',') if t.strip()]
        return []
