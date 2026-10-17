"""
Facts for an explanation of a career-match result. They come from the backend's rule-based scoring
engine, but they are treated as untrusted data here: every string is restricted to the characters
skill names and career titles use, instruction-like wording is refused, and every count is
recomputed from the requirement list and must agree with what was sent.
"""
import re
from typing import List, Literal, Optional

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


# --- Readiness --------------------------------------------------------------------------------

READINESS_DIMENSIONS = ["Technical Skills", "Professional Experience", "Project Portfolio", "Education & Certifications"]
READINESS_TIERS = ["Early stage", "Developing", "Solid foundation", "Strong evidence"]


def readiness_tier(score: int) -> str:
    """The engine's bands (backend ReadinessCalculator)."""
    if score >= 75:
        return "Strong evidence"
    if score >= 50:
        return "Solid foundation"
    if score >= 25:
        return "Developing"
    return "Early stage"


class ReadinessDimension(BaseModel):
    name: Literal["Technical Skills", "Professional Experience", "Project Portfolio", "Education & Certifications"]
    score: int = Field(ge=0, le=100)
    weight_percent: int = Field(ge=0, le=100)


class EvidenceShares(BaseModel):
    """Share of the credited skill evidence by how it was checked; all None when nothing is credited."""
    assessed: Optional[int] = Field(default=None, ge=0, le=100)
    self_reported: Optional[int] = Field(default=None, ge=0, le=100)
    stated: Optional[int] = Field(default=None, ge=0, le=100)
    inferred: Optional[int] = Field(default=None, ge=0, le=100)

    def values(self) -> List[Optional[int]]:
        return [self.assessed, self.self_reported, self.stated, self.inferred]


class ReadinessFacts(BaseModel):
    career_title: str
    readiness_score: int = Field(ge=0, le=100)
    tier: Literal["Early stage", "Developing", "Solid foundation", "Strong evidence"]
    dimensions: List[ReadinessDimension] = Field(min_length=4, max_length=4)
    required_total: int = Field(ge=0, le=200)
    required_missing_skills: List[str] = Field(default_factory=list, max_length=40)
    requirements_total: int = Field(ge=0, le=200)
    requirements_covered: int = Field(ge=0, le=200)
    requirements_assessed: int = Field(ge=0, le=200)
    evidence_shares: EvidenceShares

    @field_validator("career_title")
    @classmethod
    def _title(cls, v: str) -> str:
        return _safe(v, "The career title")

    @field_validator("required_missing_skills")
    @classmethod
    def _missing(cls, v: List[str]) -> List[str]:
        return [_safe(s, "A skill name") for s in v]

    @model_validator(mode="after")
    def _consistent(self) -> "ReadinessFacts":
        if sorted(d.name for d in self.dimensions) != sorted(READINESS_DIMENSIONS):
            raise ValueError("The readiness dimensions must be the engine's four dimensions.")
        if sum(d.weight_percent for d in self.dimensions) != 100:
            raise ValueError("The dimension weights must add up to 100.")
        if self.tier != readiness_tier(self.readiness_score):
            raise ValueError("The tier does not match the readiness score.")
        if len(self.required_missing_skills) > self.required_total:
            raise ValueError("More required skills are missing than are required.")
        if len({s.lower() for s in self.required_missing_skills}) != len(self.required_missing_skills):
            raise ValueError("A missing skill appears more than once.")
        if not (self.requirements_assessed <= self.requirements_covered <= self.requirements_total):
            raise ValueError("The requirement coverage counts are inconsistent.")
        if self.required_total > self.requirements_total:
            raise ValueError("More required skills than requirements.")
        shares = self.evidence_shares.values()
        if any(v is None for v in shares):
            if any(v is not None for v in shares):
                raise ValueError("Evidence shares are either all present or all absent.")
        elif sum(shares) != 100:
            raise ValueError("The evidence shares must add up to 100.")
        return self

    @property
    def required_met(self) -> int:
        return self.required_total - len(self.required_missing_skills)

    def dimension(self, name: str) -> ReadinessDimension:
        return next(d for d in self.dimensions if d.name == name)


class ReadinessExplanationRequest(BaseModel):
    facts: ReadinessFacts


# --- Skill gaps -------------------------------------------------------------------------------

class GapFact(BaseModel):
    skill: str
    importance: Importance
    # missing: not on the profile; limited_evidence: a required skill shown only weakly
    kind: Literal["missing", "limited_evidence"]
    impact: int = Field(ge=0, le=100)

    @field_validator("skill")
    @classmethod
    def _skill(cls, v: str) -> str:
        return _safe(v, "A skill name")


class StrengthFact(BaseModel):
    skill: str
    impact: int = Field(ge=0, le=100)

    @field_validator("skill")
    @classmethod
    def _skill(cls, v: str) -> str:
        return _safe(v, "A skill name")


class SkillGapFacts(BaseModel):
    career_title: str
    # In the engine's priority order: missing required skills first, then the others, each by impact
    gaps: List[GapFact] = Field(min_length=1, max_length=15)
    strengths: List[StrengthFact] = Field(default_factory=list, max_length=10)

    @field_validator("career_title")
    @classmethod
    def _title(cls, v: str) -> str:
        return _safe(v, "The career title")

    @model_validator(mode="after")
    def _consistent(self) -> "SkillGapFacts":
        names = [g.skill.lower() for g in self.gaps] + [s.skill.lower() for s in self.strengths]
        if len(set(names)) != len(names):
            raise ValueError("A skill appears more than once.")
        if any(g.kind == "limited_evidence" and g.importance != "required" for g in self.gaps):
            raise ValueError("Only a required skill can be a limited-evidence gap.")
        critical = [g for g in self.gaps if g.importance == "required" and g.kind == "missing"]
        if self.gaps[: len(critical)] != critical:
            raise ValueError("Missing required skills must come first.")
        for group in (critical, [g for g in self.gaps if g not in critical]):
            if [g.impact for g in group] != sorted((g.impact for g in group), reverse=True):
                raise ValueError("Gaps must be ordered by impact.")
        return self


class SkillGapExplanationRequest(BaseModel):
    facts: SkillGapFacts


# --- Next-best action -------------------------------------------------------------------------

class EffortFact(BaseModel):
    low: int = Field(ge=0, le=10000)
    high: int = Field(ge=0, le=10000)
    unit: Literal["minutes", "hours"]
    # 'time limit': a skill check's fixed limit; 'assumption': a planning range, not a measurement
    basis: Literal["time limit", "assumption"]
    # True when the figures were rounded from the engine's (e.g. 10.25 hours shown as 10)
    approximate: bool = False


class NextActionFacts(BaseModel):
    career_title: str
    action_title: str
    kind: Literal["verify", "project", "portfolio"]
    skills: List[str] = Field(min_length=1, max_length=6)
    # The ranked action explained is always the first; the ranking itself is not the model's to change
    rank: Literal[1] = 1
    total_actions: int = Field(ge=1, le=200)
    score_before: int = Field(ge=0, le=100)
    score_after: int = Field(ge=0, le=100)
    impact: int = Field(ge=1, le=100)
    required_gaps_addressed: int = Field(ge=0, le=6)
    needs_learning_first: List[str] = Field(default_factory=list, max_length=6)
    effort: EffortFact
    hours_per_week: Optional[int] = Field(default=None, ge=1, le=168)
    weeks_low: Optional[int] = Field(default=None, ge=1, le=520)
    weeks_high: Optional[int] = Field(default=None, ge=1, le=520)
    fits_two_weeks: Optional[bool] = None

    @field_validator("career_title", "action_title")
    @classmethod
    def _text(cls, v: str) -> str:
        return _safe(v, "A title")

    @field_validator("skills", "needs_learning_first")
    @classmethod
    def _skills(cls, v: List[str]) -> List[str]:
        return [_safe(s, "A skill name") for s in v]

    @model_validator(mode="after")
    def _consistent(self) -> "NextActionFacts":
        if self.score_after - self.score_before != self.impact:
            raise ValueError("The impact must be the change from score_before to score_after.")
        skills = {s.lower() for s in self.skills}
        if len(skills) != len(self.skills) or any(s.lower() not in skills for s in self.needs_learning_first):
            raise ValueError("needs_learning_first may only name the action's skills, each once.")
        if self.required_gaps_addressed > len(self.skills):
            raise ValueError("More required gaps addressed than skills.")
        if self.effort.low > self.effort.high:
            raise ValueError("The effort range is inverted.")
        capacity = (self.weeks_low, self.weeks_high, self.fits_two_weeks)
        if self.hours_per_week is None:
            if any(v is not None for v in capacity):
                raise ValueError("Capacity figures need the weekly hours.")
        elif any(v is None for v in capacity) or self.weeks_low > self.weeks_high:
            raise ValueError("The capacity figures are incomplete or inverted.")
        return self


class NextActionExplanationRequest(BaseModel):
    facts: NextActionFacts
