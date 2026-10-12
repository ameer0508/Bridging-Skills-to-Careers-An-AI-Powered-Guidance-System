import re
from typing import List, Tuple
from app.resume_intelligence.semantic_entities import SemanticExperience, SemanticExtractedEntity

_MONTH = r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?"
_DATE = rf"(?:{_MONTH}\s+\d{{4}}|\d{{1,2}}/\d{{4}}|\d{{4}})"
_DATE_RANGE = re.compile(
    rf"\(?\s*({_DATE}\s*(?:-|–|—|to)\s*(?:Present|Current|Now|Ongoing|{_DATE}))\s*\)?",
    re.IGNORECASE,
)
_BULLET_PREFIX = re.compile(r"^\s*[•\-*‣▪●◦·]\s+")
_ROLE_COMPANY_DELIMITERS = [r"\s+at\s+", r"\s+@\s+", r"\s+\|\s+", r"\s+[-–—]\s+", r",\s+"]


def _entity(value: str, source: str, method: str) -> SemanticExtractedEntity:
    return SemanticExtractedEntity(
        value=value,
        source=source,
        transformer_model="rule-based",
        extraction_method=method,
    )


class ExperienceParser:
    """
    Rule-based parser turning the Work Experience section into structured entries.

    Supported layouts (covered by tests): one or two header lines per job, where the
    header carries a date range or jobs are separated by blank lines, followed by
    responsibility lines with or without bullet characters.
    """

    @classmethod
    def parse_experience_section(cls, text: str) -> List[SemanticExperience]:
        if not text.strip():
            return []

        experiences: List[SemanticExperience] = []
        for header_lines, body_lines in cls._split_into_job_blocks(text):
            header = " | ".join(header_lines)
            duration = cls._extract_duration(header)
            role, company = cls._extract_role_and_company(header_lines)
            if not role and not company:
                continue

            responsibilities = [
                _entity(_BULLET_PREFIX.sub("", line).strip(), "experience_bullets", "bullet-extraction")
                for line in body_lines
                if len(line.strip()) > 10
            ]

            experiences.append(SemanticExperience(
                company=_entity(company, "experience_header", "header-rules") if company else None,
                role=_entity(role, "experience_header", "header-rules") if role else None,
                duration=_entity(duration, "experience_dates", "date-regex") if duration else None,
                responsibilities=responsibilities,
            ))
        return experiences

    @classmethod
    def _split_into_job_blocks(cls, text: str) -> List[Tuple[List[str], List[str]]]:
        """Returns (header_lines, body_lines) for each job found in the section."""
        lines = text.splitlines()
        non_empty = [i for i, line in enumerate(lines) if line.strip()]
        if not non_empty:
            return []

        # Preferred: every job header carries a date range
        date_lines = [i for i in non_empty if _DATE_RANGE.search(lines[i]) and not _BULLET_PREFIX.match(lines[i])]
        starts: List[Tuple[int, int]] = []  # (first header line, last header line)
        if date_lines:
            for i in date_lines:
                remainder = _DATE_RANGE.sub("", lines[i]).strip(" |,-–—()")
                previous = cls._previous_non_empty(lines, i)
                is_title_above = (
                    previous is not None
                    and not _BULLET_PREFIX.match(lines[previous])
                    and not lines[previous].strip().endswith(".")
                    and len(lines[previous].strip()) <= 80
                    and previous not in [s for pair in starts for s in pair]
                    and (not starts or previous > starts[-1][1])
                )
                has_role_and_company = bool(remainder) and cls._split_role_company(remainder)[1] != ""
                if is_title_above and not has_role_and_company:
                    starts.append((previous, i))  # two-line header: title above, company/date below
                else:
                    starts.append((i, i))
        else:
            # Otherwise jobs are separated by blank lines
            block_start = True
            for i, line in enumerate(lines):
                if not line.strip():
                    block_start = True
                    continue
                if block_start:
                    starts.append((i, i))
                    block_start = False

        blocks: List[Tuple[List[str], List[str]]] = []
        for index, (first, last) in enumerate(starts):
            end = starts[index + 1][0] if index + 1 < len(starts) else len(lines)
            header_lines = [lines[j].strip() for j in range(first, last + 1) if lines[j].strip()]
            body_lines = [lines[j].strip() for j in range(last + 1, end) if lines[j].strip()]
            blocks.append((header_lines, body_lines))
        return blocks

    @staticmethod
    def _previous_non_empty(lines: List[str], index: int):
        for j in range(index - 1, -1, -1):
            if lines[j].strip():
                return j
        return None

    @classmethod
    def _split_role_company(cls, line: str) -> Tuple[str, str]:
        for delimiter in _ROLE_COMPANY_DELIMITERS:
            parts = re.split(delimiter, line, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) == 2 and parts[0].strip() and parts[1].strip():
                return parts[0].strip(), parts[1].strip()
        return line.strip(), ""

    @classmethod
    def _extract_role_and_company(cls, header_lines: List[str]) -> Tuple[str, str]:
        # Examples: "Software Engineer at Google (2021-2024)", "Senior Developer | Tech Corp",
        # or two lines: "Data Analyst" / "Acme Analytics, Jan 2022 - Present"
        cleaned = [_DATE_RANGE.sub("", line).strip(" |,-–—()") for line in header_lines]
        cleaned = [line for line in cleaned if line]
        if not cleaned:
            return "", ""
        if len(cleaned) >= 2:
            return cleaned[0], cls._split_role_company(cleaned[1])[0]
        return cls._split_role_company(cleaned[0])

    @classmethod
    def _extract_duration(cls, text: str) -> str:
        match = _DATE_RANGE.search(text)
        return re.sub(r"\s+", " ", match.group(1)).strip() if match else ""
