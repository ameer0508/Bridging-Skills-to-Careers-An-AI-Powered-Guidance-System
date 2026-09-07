import re
from typing import Dict, List, Tuple

class SectionClassifier:
    """
    Classifies resume text blocks into canonical semantic sections using fuzzy heading matching and keyword scoring.
    """

    SECTION_PATTERNS: Dict[str, List[str]] = {
        "experience": [
            r"work\s+experience", r"professional\s+experience", r"employment\s+history",
            r"work\s+history", r"career\_summary", r"career\s+history", r"relevant\s+experience",
            r"experience", r"internships", r"industry\s+experience"
        ],
        "education": [
            r"education", r"academic\s+background", r"academic\s+qualifications?",
            r"education\s+&\s+credentials", r"degrees?", r"scholastic\s+achievements?"
        ],
        "skills": [
            r"technical\s+skills", r"core\s+competencies", r"skills\s+&\s+abilities",
            r"areas\s+of\s+expertise", r"technologies", r"technical\s+proficiencies",
            r"skills", r"programming\s+languages", r"skills\s+overview"
        ],
        "projects": [
            r"projects", r"academic\s+projects", r"personal\s+projects", r"key\s+projects",
            r"research\s+experience", r"open\s+source\s+contributions", r"portfolio\s+projects"
        ],
        "certifications": [
            r"certifications?", r"licenses\s+&\s+certifications?", r"professional\s+certifications?",
            r"credentials", r"accreditations?", r"certificates?"
        ],
        "languages": [
            r"languages?", r"language\s+proficiency", r"spoken\s+languages?"
        ],
        "summary": [
            r"summary", r"professional\s+summary", r"profile", r"executive\s+summary",
            r"about\s+me", r"objective", r"career\s+objective"
        ]
    }

    @classmethod
    def classify_sections(cls, raw_text: str) -> Dict[str, str]:
        """
        Splits text into lines/blocks and groups them under canonical section names.
        Returns a dict mapping section_name -> block_text.
        """
        sections: Dict[str, List[str]] = {
            "header": [],
            "summary": [],
            "experience": [],
            "education": [],
            "skills": [],
            "projects": [],
            "certifications": [],
            "languages": [],
            "other": []
        }

        current_section = "header"
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

        for line in lines:
            detected = cls._match_heading(line)
            if detected:
                current_section = detected
            else:
                sections[current_section].append(line)

        return {k: "\n".join(v).strip() for k, v in sections.items() if v}

    @classmethod
    def _match_heading(cls, line: str) -> str | None:
        # Heading criteria: short line (< 50 chars), no trailing period, matches pattern
        if len(line) > 50 or line.endswith('.'):
            return None

        clean_line = line.lower().strip(':').strip('-').strip()

        for canonical, patterns in cls.SECTION_PATTERNS.items():
            for p in patterns:
                if re.fullmatch(p, clean_line) or re.search(f"^{p}$", clean_line):
                    return canonical
        return None
