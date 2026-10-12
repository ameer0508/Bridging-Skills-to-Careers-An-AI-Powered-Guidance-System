"""
Shared skill lexicon and the text matcher built on it.

The same lexicon (ai/app/resources/skill_lexicon.json) is mirrored in the backend
(backend/src/seed/skillLexicon.ts) so both services agree on canonical skill names.

Matching rules, applied identically in both services:
  * URLs and e-mail addresses are removed first, so "github.com/jane" is not the skill GitHub.
  * A term only matches as a whole token: "Java" does not match inside "JavaScript", and
    "C" does not match inside "C++" or "C#".
  * Longer terms win: "React Native" is not also counted as "React"; "SQL Server" is not "SQL".
  * A skill is reported once however often it is mentioned.
  * Names that are ordinary words or single letters (Go, R, C, Swift...) need exact casing, and
    single-letter names must also appear as a list item ("C, C++, Java").
"""
import json
import os
import re
from dataclasses import dataclass
from functools import lru_cache
from typing import Dict, List, Optional, Tuple

_LEXICON_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "resources", "skill_lexicon.json")

_URL_OR_EMAIL = re.compile(
    r"(?:https?://|www\.)\S+"                                  # explicit URLs
    r"|\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b"                       # e-mail addresses
    r"|\b(?:[a-z0-9-]+\.)+(?:com|org|net|io|dev|in|co|edu|app|me)(?:/\S*)?",  # bare domains / profile links
    re.IGNORECASE,
)

_TOKEN_CHARS = r"A-Za-z0-9+#"


@dataclass(frozen=True)
class LexiconSkill:
    name: str
    category: str
    aliases: Tuple[str, ...]
    exact_aliases: Tuple[str, ...]
    implies: Tuple[str, ...]
    case_sensitive: bool


@dataclass(frozen=True)
class SkillMention:
    skill: LexiconSkill
    start: int
    matched_text: str


def _term_pattern(term: str, case_sensitive: bool) -> "re.Pattern[str]":
    escaped = re.escape(term)
    if len(term) == 1:
        # Single letters ("C", "R") only count as list items: "C, C++", "Languages: R / Python"
        body = rf"(?:(?<=^)|(?<=[,:/(|;])|(?<=[,:/(|;]\s)){escaped}(?=\s*(?:[,/)|;]|$))"
        return re.compile(body, re.MULTILINE)
    body = rf"(?<![{_TOKEN_CHARS}]){escaped}(?![{_TOKEN_CHARS}])"
    return re.compile(body, 0 if case_sensitive else re.IGNORECASE)


class SkillLexicon:
    def __init__(self, skills: List[LexiconSkill]):
        self.skills = skills
        self._by_key: Dict[str, LexiconSkill] = {}
        terms: List[Tuple[str, "re.Pattern[str]", LexiconSkill]] = []
        for skill in skills:
            self._by_key[skill.name.lower()] = skill
            terms.append((skill.name, _term_pattern(skill.name, skill.case_sensitive), skill))
            for alias in skill.aliases:
                self._by_key.setdefault(alias.lower(), skill)
                terms.append((alias, _term_pattern(alias, False), skill))
            for alias in skill.exact_aliases:
                self._by_key.setdefault(alias.lower(), skill)
                terms.append((alias, _term_pattern(alias, True), skill))
        # Longest terms first so that specific names claim their text before general ones
        self._terms = sorted(terms, key=lambda t: len(t[0]), reverse=True)

    def lookup(self, name: str) -> Optional[LexiconSkill]:
        """Exact (case-insensitive) lookup of a canonical name or alias."""
        key = re.sub(r"\s+", " ", (name or "").strip().lower())
        if key in self._by_key:
            return self._by_key[key]
        # "Amazon Web Services (AWS)" -> try "amazon web services" and "aws"
        parenthetical = re.match(r"^(.*?)\s*\(([^)]+)\)\s*$", key)
        if parenthetical:
            for part in parenthetical.groups():
                if part.strip() in self._by_key:
                    return self._by_key[part.strip()]
        return None

    @staticmethod
    def strip_links(text: str) -> str:
        return _URL_OR_EMAIL.sub(" ", text or "")

    def find_mentions(self, text: str) -> List[SkillMention]:
        """Every distinct skill mentioned in the text, in order of first appearance."""
        cleaned = self.strip_links(text)
        consumed: List[Tuple[int, int]] = []
        first_mention: Dict[str, SkillMention] = {}

        for _term, pattern, skill in self._terms:
            for match in pattern.finditer(cleaned):
                start, end = match.span()
                if any(start < c_end and end > c_start for c_start, c_end in consumed):
                    continue
                consumed.append((start, end))
                existing = first_mention.get(skill.name)
                if existing is None or start < existing.start:
                    first_mention[skill.name] = SkillMention(skill=skill, start=start, matched_text=match.group(0))

        return sorted(first_mention.values(), key=lambda m: m.start)

    def find_skills(self, text: str) -> List[LexiconSkill]:
        return [mention.skill for mention in self.find_mentions(text)]


@lru_cache(maxsize=1)
def get_lexicon() -> SkillLexicon:
    with open(_LEXICON_PATH, "r", encoding="utf-8") as handle:
        raw = json.load(handle)
    return SkillLexicon([
        LexiconSkill(
            name=entry["name"],
            category=entry["category"],
            aliases=tuple(entry.get("aliases", [])),
            exact_aliases=tuple(entry.get("exactAliases", [])),
            implies=tuple(entry.get("implies", [])),
            case_sensitive=bool(entry.get("caseSensitive", False)),
        )
        for entry in raw["skills"]
    ])
