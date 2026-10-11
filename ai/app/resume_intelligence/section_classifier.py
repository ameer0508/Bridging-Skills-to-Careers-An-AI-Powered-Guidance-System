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
        for raw_line in raw_text.splitlines():
            line = raw_line.strip()
            if not line:
                # Blank lines are kept: they separate jobs and projects inside a section
                sections[current_section].append("")
                continue

            detected = cls._match_heading(line)
            if detected:
                current_section = detected
                continue

            # Inline heading: "Skills: Python, SQL" or "Languages - English, Hindi"
            inline = re.match(r"^([A-Za-z &/]{3,40}?)\s*[:\-–]\s+(.+)$", line)
            inline_section = cls._match_heading(inline.group(1)) if inline else None
            if inline_section:
                current_section = inline_section
                sections[current_section].append(inline.group(2).strip())
            else:
                sections[current_section].append(line)

        return {k: "\n".join(v).strip() for k, v in sections.items() if "\n".join(v).strip()}

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
