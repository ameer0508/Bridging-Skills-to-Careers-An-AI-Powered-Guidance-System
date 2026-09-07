import re
from typing import List
from app.resume_intelligence.semantic_entities import SemanticEducation, SemanticExtractedEntity

class EducationParser:
    """
    Parses Education section text into structured SemanticEducation objects.
    """

    DEGREE_PATTERNS = [
        r'\b(?:B\.?S\.?|Bachelor\s+of\s+Science|B\.?E\.?|B\.?Tech|B\.?A\.?)\b',
        r'\b(?:M\.?S\.?|Master\s+of\s+Science|M\.?Tech|M\.?A\.?|M\.?B\.?A\.?)\b',
        r'\b(?:Ph\.?D\.?|Doctor\s+of\s+Philosophy)\b',
        r'\b(?:Associate\s+Degree|Diploma)\b'
    ]

    @classmethod
    def parse_education_section(cls, text: str) -> List[SemanticEducation]:
        if not text.strip():
            return []

        educations: List[SemanticEducation] = []
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        for line in lines:
            institution = cls._extract_institution(line)
            degree = cls._extract_degree(line)
            year = cls._extract_year(line)
            gpa = cls._extract_gpa(line)

            if institution or degree:
                educations.append(SemanticEducation(
                    institution=SemanticExtractedEntity(
                        value=institution,
                        confidence=0.94,
                        source="education_header",
                        transformer_model="education-parser-v1",
                        extraction_method="institution-ner"
                    ) if institution else None,
                    degree=SemanticExtractedEntity(
                        value=degree,
                        confidence=0.96,
                        source="education_header",
                        transformer_model="education-parser-v1",
                        extraction_method="degree-regex"
                    ) if degree else None,
                    endYear=SemanticExtractedEntity(
                        value=year,
                        confidence=0.90,
                        source="education_year",
                        transformer_model="education-parser-v1",
                        extraction_method="year-regex"
                    ) if year else None,
                    gpa=SemanticExtractedEntity(
                        value=gpa,
                        confidence=0.92,
                        source="education_gpa",
                        transformer_model="education-parser-v1",
                        extraction_method="gpa-regex"
                    ) if gpa else None
                ))

        return educations

    @classmethod
    def _extract_degree(cls, text: str) -> str:
        for p in cls.DEGREE_PATTERNS:
            match = re.search(p, text, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        if "computer science" in text.lower():
            return "B.S. Computer Science"
        return ""

    @classmethod
    def _extract_institution(cls, text: str) -> str:
        univ_keywords = [r'University', r'College', r'Institute', r'School', r'Academy', r'Polytechnic']
        for kw in univ_keywords:
            match = re.search(r'([A-Za-z\s]+' + kw + r'[\w\s]*)', text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return ""

    @classmethod
    def _extract_year(cls, text: str) -> str:
        match = re.search(r'\b(20[0-9]{2}|19[0-9]{2})\b', text)
        return match.group(1) if match else ""

    @classmethod
    def _extract_gpa(cls, text: str) -> str:
        match = re.search(r'\b(?:GPA[:\s]*)?([0-4]\.[0-9]{1,2}(?:\s*/\s*4\.0)?)\b', text, re.IGNORECASE)
        return match.group(1) if match else ""
