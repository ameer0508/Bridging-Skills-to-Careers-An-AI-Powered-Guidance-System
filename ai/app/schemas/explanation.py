"""
Facts for an explanation of a career-match result. They come from the backend's rule-based scoring
engine, but they are treated as untrusted data here: every string is restricted to the characters
skill names and career titles use, instruction-like wording is refused, and every count is
recomputed from the requirement list and must agree with what was sent.
"""
import re
from typing import List, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

# Skill names and career titles in the shared lexicon and career catalogue use only these characters
SAFE_TEXT = re.compile(r"^[A-Za-z0-9 .,+#/&()'\-]{1,80}$")
# Words that never occur in a skill name or career title but do occur in prompt-injection attempts
# (checked against every name in the skill lexicon and the career catalogue; "Prompt Engineering"
# and "Embedded Systems Engineer" are real, so "prompt" and "system" are not on the list)
INSTRUCTION_WORDS = re.compile(
    r"\b(ignore|disregard|instructions?|pretend|roleplay|override|forget|jailbreak|reveal|previous|"
    r"you are|you must|respond|hired|salary|salaries)\b",
    re.IGNORECASE,
)

Importance = Literal["required", "preferred", "supporting"]
Status = Literal["applied", "listed", "inferred", "missing"]
IMPORTANCES: List[str] = ["required", "preferred", "supporting"]


def _safe(value: str, what: str) -> str:
    value = re.sub(r"\s+", " ", value or "").strip()
    if not SAFE_TEXT.match(value):
        raise ValueError(f"{what} contains characters that are not allowed.")
    if INSTRUCTION_WORDS.search(value):
        raise ValueError(f"{what} contains wording that is not allowed in data.")
    return value


class RequirementFact(BaseModel):
    skill: str
    importance: Importance
    status: Status

    @field_validator("skill")
    @classmethod
    def _skill(cls, v: str) -> str:
        return _safe(v, "A skill name")


class StatusCounts(BaseModel):
    total: int = Field(ge=0, le=200)
    applied: int = Field(ge=0, le=200)
    listed: int = Field(ge=0, le=200)
    inferred: int = Field(ge=0, le=200)
    missing: int = Field(ge=0, le=200)

    @property
    def matched(self) -> int:
        return self.applied + self.listed + self.inferred


class CareerMatchFacts(BaseModel):
    career_title: str
    match_score: int = Field(ge=0, le=100)
    # Share of matched requirements backed by work, projects or certifications (the engine's "confidence")
    evidence_share_percent: int = Field(ge=0, le=100)
    requirements: List[RequirementFact] = Field(min_length=1, max_length=40)
    required: StatusCounts
    preferred: StatusCounts
    supporting: StatusCounts
    # Missing requirements with the most points at stake, highest first
    top_missing: List[str] = Field(default_factory=list, max_length=5)

    @field_validator("career_title")
    @classmethod
    def _title(cls, v: str) -> str:
        return _safe(v, "The career title")

    @field_validator("top_missing")
    @classmethod
    def _top_missing(cls, v: List[str]) -> List[str]:
        return [_safe(s, "A skill name") for s in v]

    @model_validator(mode="after")
    def _consistent(self) -> "CareerMatchFacts":
        names = [r.skill.lower() for r in self.requirements]
        if len(set(names)) != len(names):
            raise ValueError("A requirement appears more than once.")
        for importance in IMPORTANCES:
            rows = [r for r in self.requirements if r.importance == importance]
            counts: StatusCounts = getattr(self, importance)
            recomputed = {s: sum(1 for r in rows if r.status == s) for s in ("applied", "listed", "inferred", "missing")}
            if counts.total != len(rows) or any(getattr(counts, s) != n for s, n in recomputed.items()):
                raise ValueError(f"The {importance} counts do not match the requirement list.")
        missing = {r.skill.lower() for r in self.requirements if r.status == "missing"}
        if any(s.lower() not in missing for s in self.top_missing):
            raise ValueError("top_missing may only name missing requirements.")
        matched = sum(1 for r in self.requirements if r.status != "missing")
        applied = sum(1 for r in self.requirements if r.status == "applied")
        expected_share = round(applied / matched * 100) if matched else 0
        if abs(expected_share - self.evidence_share_percent) > 1:
            raise ValueError("evidence_share_percent does not match the requirement list.")
        return self

    # --- Derived figures the explanation may use ---------------------------------------------
    def group(self, importance: str) -> StatusCounts:
        return getattr(self, importance)

    @property
    def overall(self) -> StatusCounts:
        return StatusCounts(
            total=len(self.requirements),
            applied=sum(1 for r in self.requirements if r.status == "applied"),
            listed=sum(1 for r in self.requirements if r.status == "listed"),
            inferred=sum(1 for r in self.requirements if r.status == "inferred"),
            missing=sum(1 for r in self.requirements if r.status == "missing"),
        )


class CareerMatchExplanationRequest(BaseModel):
    facts: CareerMatchFacts
