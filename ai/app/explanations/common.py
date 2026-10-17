"""
Shared pieces of the local-AI explanation checks (docs/AI_EXPLANATIONS.md): text cleaning, number
and number-word handling, forbidden topics, form problems, status cue words, sentence and clause
splitting, and the checks every explained subject runs. Each subject module (career_match,
readiness, skill_gap, next_action) adds the checks specific to its own facts.
"""
import re
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Set, Tuple

from app.resume_intelligence.skill_lexicon import get_lexicon

ADDING = re.compile(r"\badd(?:s|ing)?\b", re.I)
EVIDENCE_WORDS = re.compile(r"\b(evidence|project|projects|work|using|use|practice|apply|applying|demonstrat\w*)\b", re.I)
DURATION_REASON = "states a time estimate or work history"
# "Adding 40 would raise readiness": a figure from the facts used as if it were the thing to add
NUMBER_AS_OBJECT = re.compile(r"\badd(?:s|ing)?\s+\d+\s+(?:would|will|could|can|to|raises?|increases?)\b", re.I)
# "would raise readiness by 10 points": a size of change; only the next action's facts give one
EFFECT_SIZE = re.compile(r"\b(?:raise|raises|raising|increase|increases|increasing|improve|improves|improving|boost|boosts|"
                         r"lift|lifts|add|adds|adding|move|moves)\b[^.]{0,50}?\bby\s+(?:about\s+|around\s+)?\d+", re.I)
MIN_WORDS = 15
MAX_WORDS = 150


@dataclass
class ValidationResult:
    text: str
    reasons: List[str] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return not self.reasons


NUMBER_WORDS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
    "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
    "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
    "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
    "hundred": 100,
}
_NUMBER_WORD_RE = re.compile(r"\b(" + "|".join(NUMBER_WORDS) + r")\b", re.IGNORECASE)
# "one of the missing skills" / "the one thing": "one" is used as a pronoun far more often than as a
# count, so it is only counted when it is followed by "of" and a number ("one of five")
_NUMBER_TOKEN = re.compile(r"(?<![\w.])\d+(?:\.\d+)?(?![\w])")

FORBIDDEN_TOPICS = [
    (re.compile(r"\b(salar(y|ies)|compensation|income|wages?|pay ?scale|ctc|lpa|lakhs?|crores?|per annum|stipend)\b|[$₹€£]|\b(usd|inr|rs\.?)\s?\d", re.I), "mentions pay or money"),
    (re.compile(r"\b(employers?|compan(y|ies)|recruiters?|hiring managers?|job postings?|job listings?|vacanc(y|ies)|openings?|job offers?|offer letters?)\b", re.I), "mentions employers or job postings"),
    (re.compile(r"\b(hired|hire you|get the job|land (a|the) (job|role)|chances?|odds|probability|likel(y|ihood) to (get|be)|guarantee\w*|predict\w*|forecast\w*|percentile)\b", re.I), "predicts outcomes"),
    (re.compile(r"\b(certif\w*|degrees?|diplomas?|bootcamps?|licen[cs]e[sd]?|accredit\w*)\b", re.I), "mentions credentials"),
    # No market data backs any explanation: demand, trends and popularity would be invented
    (re.compile(r"\b(in(?:\s+high)?\s+demand|high demand|demand for|trend(?:s|ing)?|popular|sought[- ]after|hot skills?|"
                r"market (?:demand|trends?|value)|employers? (?:want|look for|value|prefer))\b", re.I), "mentions market demand or trends"),
    # A count from the facts ("2") must not become a duration or work history ("2 years")
    (re.compile(r"\b(\d+|a|an|" + "|".join(NUMBER_WORDS) + r")[\s-]+(hours?|days?|weeks?|months?|years?)\b", re.I), DURATION_REASON),
]
FORM_PROBLEMS = [
    (re.compile(r"https?://|www\.|\]\(", re.I), "contains a link"),
    (re.compile(r"```|`"), "contains code formatting"),
    (re.compile(r"^\s*#", re.M), "contains a heading"),
    (re.compile(r"\b(BEGIN DATA|END DATA|ignore (all |any )?(previous|prior|above)|system prompt|instructions? (say|tell)|as an ai|language model)\b", re.I), "echoes the prompt or its instructions"),
]


# Cue words near a skill name, used clause by clause
HELD_CUES = re.compile(
    r"\b(you have|you've|you already|you possess|you bring|you know|you use|you used|already have|"
    r"strong (in|with)|proficien\w*|matched|covered|evidenced|demonstrat\w*|proven|shown|in place|"
    r"your (existing )?(experience|background|work|projects?) (with|in|using))\b", re.I)
DEMONSTRATED_CUES = re.compile(
    r"\b(demonstrat\w*|proven|shown|backed by|used in (a |your )?(role|work|job|projects?)|applied in|hands-on|"
    r"real-world|in your work|in (a |your )?projects?|practical experience|professional experience)\b", re.I)
HARD_MISSING_CUES = re.compile(r"\b(missing|absent|don't have|do not have|not (yet )?(found|listed|present|held))\b", re.I)
LACK_CUES = re.compile(r"\b(lack\w*|without)\b", re.I)
HEDGE_CUES = re.compile(
    r"\b(not|no|never|isn't|aren't|lack\w*|missing|without|yet|add|adding|learn\w*|build\w*|develop\w*|gain\w*|"
    r"acquir\w*|need\w*|would|could|should|can|will|raise|raising|improv\w*|boost\w*|strengthen\w*|close|"
    r"closing|focus\w*|consider\w*|next|start\w*)\b", re.I)
NOT_MISSING = re.compile(r"\bnot missing\b|\bno longer missing\b", re.I)


# "Without Docker, the score would rise" / "the score cannot rise": inverted or unsupported effects
INVERTED_EFFECT = re.compile(
    r"\bwithout\s+[^.,;]{1,40},?\s+(the|your)\s+score\s+(would|will|could|can)\s+(rise|increase|improve|go up|grow)\b|"
    r"\b(cannot|can't|can not|will not|won't|would not|wouldn't)\s+(rise|increase|improve|go up|grow)\b|"
    r"\bscore\s+(does not|doesn't|did not|didn't)\s+(rise|increase|improve|go up|grow)\b", re.I)

CLAUSE_SPLIT = re.compile(r"[;,:]|\b(?:but|while|whereas|however|although|though)\b", re.I)
SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")


def _skill_pattern(name: str) -> "re.Pattern[str]":
    return re.compile(rf"(?<![A-Za-z0-9+#]){re.escape(name)}(?![A-Za-z0-9+#])", re.IGNORECASE)


def _clean(text: str) -> str:
    text = (text or "").replace("**", "").replace("__", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _clauses(text: str) -> List[str]:
    # Lists in parentheses stay in one clause: "(Python, SQL and REST APIs) are shown"
    text = re.sub(r"\(([^)]*)\)", lambda m: "(" + m.group(1).replace(",", " and") + ")", text)
    out: List[str] = []
    for sentence in SENTENCE_SPLIT.split(text):
        out.extend(c.strip() for c in CLAUSE_SPLIT.split(sentence) if c and c.strip())
    return out


def _numbers_in(text: str) -> List[int]:
    # Leading list markers ("1. Build...") are formatting, not claims
    body = re.sub(r"(?m)^\s*\d+[.)]\s+", "", text)
    found = [int(float(n)) if float(n).is_integer() else -1 for n in _NUMBER_TOKEN.findall(body)]
    for word in _NUMBER_WORD_RE.findall(body):
        w = word.lower()
        if w == "one":
            continue  # see _NUMBER_TOKEN comment; "one of five" is caught by the pair check
        found.append(NUMBER_WORDS[w])
    return found


def _to_int(token: str) -> Optional[int]:
    token = token.lower()
    if token in NUMBER_WORDS:
        return NUMBER_WORDS[token]
    try:
        value = float(token)
    except ValueError:
        return None
    return int(value) if value.is_integer() else -1


_NUM = r"(\d+(?:\.\d+)?|" + "|".join(NUMBER_WORDS) + r")"
PAIR = re.compile(rf"\b{_NUM}\s+(?:of|out of)\s+(?:the\s+|your\s+|its\s+|all\s+)?{_NUM}\b|\b{_NUM}\s*/\s*{_NUM}\b", re.I)
PERCENT = re.compile(rf"\b{_NUM}\s*(?:%|percent\b)", re.I)



PREDICATES = [
    ("missing", re.compile(r"\b(missing|lack\w*|absent|gaps?|not\s+(yet\s+)?(found|matched|covered|met|held|evidenced))\b", re.I)),
    ("applied", re.compile(r"\b(used|applied|demonstrat\w*|shown|backed|practi[cs]\w*|hands-on|proven|in (your )?(work|projects?|a role)|work or projects)\b", re.I)),
    ("listed", re.compile(r"\blisted\b", re.I)),
    ("inferred", re.compile(r"\binferred\b", re.I)),
    ("matched", re.compile(r"\b(matched|covered|met|evidenced|present|in place|found|have|held|satisfied)\b", re.I)),
]


NOT_APPLIED = re.compile(r"\bnot\s+(yet\s+)?(used|shown|proven|demonstrated|applied)\b", re.I)


def _predicate(words: str) -> Optional[str]:
    """
    The status a count or proportion is attached to, read up to the next "and"/"but". "Not shown in
    work" covers listed, inferred and missing alike, so it names no single status. Otherwise a
    leading negation means missing, and "evidenced in work or projects" means applied, not matched.
    """
    words = re.split(r"\b(?:and|but|while|whereas|so)\b", words or "", maxsplit=1)[0]
    if NOT_APPLIED.search(words):
        return None
    hits = {name: m.start() for name, pattern in PREDICATES for m in [pattern.search(words)] if m}
    if not hits:
        return None
    if "missing" in hits and hits["missing"] == min(hits.values()):
        return "missing"
    for name in ("applied", "listed", "inferred", "matched"):
        if name in hits:
            return name
    return "missing"


def dedupe(reasons: List[str]) -> List[str]:
    """Each reason once, in the order found."""
    seen: Set[str] = set()
    return [r for r in reasons if not (r in seen or seen.add(r))]


def retry_prompt(prompt: str, reasons: List[str]) -> str:
    """The same prompt, with the checks the previous answer failed, for one more attempt."""
    problems = "\n".join(f"- {r}" for r in reasons[:6])
    return prompt + f"""
Your previous answer was rejected because it:
{problems}
Write a new answer that fixes these problems and follows every rule above.
"""


def outside_skills(text: str, fact_skills: Iterable[str], extra_allowed_text: str = "") -> List[str]:
    """Skills from the shared lexicon that the text names but the facts do not contain."""
    lexicon = get_lexicon()
    allowed = {name.lower() for name in fact_skills}
    for name in list(allowed):
        skill = lexicon.lookup(name)
        if skill:
            allowed.add(skill.name.lower())
    for mention in lexicon.find_mentions(extra_allowed_text):
        allowed.add(mention.skill.name.lower())
    return sorted({m.skill.name for m in lexicon.find_mentions(text) if m.skill.name.lower() not in allowed})


def names_any(text: str, names: Iterable[str]) -> bool:
    return any(_skill_pattern(n).search(text) for n in names)


def base_checks(text: str, *, numbers: Set[int], pairs: Set[Tuple[int, int]], percents: Set[int],
                fact_skills: Iterable[str], grounding: Iterable[str], extra_allowed_text: str = "",
                grounding_message: str = "does not name anything from the facts", allow_durations: bool = False) -> List[str]:
    """
    The checks every subject runs: length, form, forbidden topics, numbers (only the facts'
    figures, exact "X of Y" pairs and percentages), skills (none outside the facts) and grounding
    (at least one of the facts' names is mentioned).
    """
    reasons: List[str] = []
    words = len(text.split())
    if words < MIN_WORDS:
        reasons.append(f"too short ({words} words)")
    if words > MAX_WORDS:
        reasons.append(f"too long ({words} words)")
    for pattern, reason in FORM_PROBLEMS + FORBIDDEN_TOPICS:
        # A subject whose facts include durations (the next action's effort) checks them itself
        if allow_durations and reason == DURATION_REASON:
            continue
        if pattern.search(text):
            reasons.append(reason)
    invented = sorted({n for n in _numbers_in(text) if n not in numbers})
    if invented:
        reasons.append(f"uses numbers not in the facts: {invented}")
    for m in PAIR.finditer(text):
        a, b = (m.group(1), m.group(2)) if m.group(1) else (m.group(3), m.group(4))
        if (_to_int(a), _to_int(b)) not in pairs:
            reasons.append(f"states '{m.group(0)}', which the facts do not support")
    for m in PERCENT.finditer(text):
        if _to_int(m.group(1)) not in percents:
            reasons.append(f"states '{m.group(0)}', which is not a figure in the facts")
    if NUMBER_AS_OBJECT.search(text):
        reasons.append("uses a figure as if it were something to add")
    m = INVERTED_EFFECT.search(text)
    if m:
        reasons.append(f"states an inverted or unsupported effect on the score: '{m.group(0)}'")
    outside = outside_skills(text, fact_skills, extra_allowed_text)
    if outside:
        reasons.append(f"names skills that are not in the facts: {outside}")
    if not names_any(text, grounding):
        reasons.append(grounding_message)
    return reasons


def _mentions_other_missing(clause: str, missing: List[str]) -> bool:
    """A clause such as 'Python is covered and Docker is missing' is about the missing skill."""
    return any(_skill_pattern(s).search(clause) for s in missing)


def status_checks(text: str, by_status: Dict[str, List[str]]) -> List[str]:
    """
    Each skill presented with its real status: a missing skill never as held, a listed or inferred
    skill never as demonstrated or as something to add, a held skill never as missing.
    `by_status` maps applied / listed / inferred / missing to skill names.
    """
    reasons: List[str] = []
    for clause in _clauses(text):
        hedged = bool(HEDGE_CUES.search(clause))
        for skill in by_status.get("missing", []):
            if _skill_pattern(skill).search(clause) and HELD_CUES.search(clause) and not hedged:
                reasons.append(f"presents {skill} as held, but it is missing")
        for status in ("listed", "inferred"):
            for skill in by_status.get(status, []):
                if _skill_pattern(skill).search(clause) and DEMONSTRATED_CUES.search(clause) and not hedged:
                    reasons.append(f"presents {skill} as demonstrated, but it is only {status}")
        for status in ("applied", "listed", "inferred"):
            for skill in by_status.get(status, []):
                if not _skill_pattern(skill).search(clause) or NOT_MISSING.search(clause):
                    continue
                if HARD_MISSING_CUES.search(clause) and not _mentions_other_missing(clause, by_status.get("missing", [])):
                    reasons.append(f"presents {skill} as missing, but it is {status}")
                elif status == "applied" and LACK_CUES.search(clause) and not _mentions_other_missing(clause, by_status.get("missing", [])):
                    reasons.append(f"says you lack {skill}, but it is used in work or projects")
                elif (ADDING.search(clause) and not EVIDENCE_WORDS.search(clause)
                      and not _mentions_other_missing(clause, by_status.get("missing", []))):
                    reasons.append(f"suggests adding {skill}, but it is already matched ({status})")

    for sentence in SENTENCE_SPLIT.split(text):
        if not HARD_MISSING_CUES.search(sentence) or NOT_MISSING.search(sentence) or _mentions_other_missing(sentence, by_status.get("missing", [])):
            continue
        for status in ("applied", "listed", "inferred"):
            for skill in by_status.get(status, []):
                if _skill_pattern(skill).search(sentence):
                    reasons.append(f"presents {skill} as missing, but it is {status}")
    return reasons


IMPORTANCE_PHRASE = {
    importance: re.compile(rf"\b{importance}\s+(skills?|requirements?)\b", re.I)
    for importance in ("required", "preferred", "supporting")
}


def importance_checks(text: str, importance_of: Dict[str, str]) -> List[str]:
    """A sentence calls skills required, preferred or supporting only when that is their importance."""
    reasons: List[str] = []
    for sentence in SENTENCE_SPLIT.split(text):
        named = [s for s in importance_of if _skill_pattern(s).search(sentence)]
        if not named:
            continue
        # "Next.js is missing, and it is a required skill": every skill the sentence names is not required
        for importance, phrase in IMPORTANCE_PHRASE.items():
            if phrase.search(sentence) and all(importance_of[s] != importance for s in named):
                reasons.append(f"calls {', '.join(named)} {importance}, but {'it is' if len(named) == 1 else 'they are'} "
                               f"{' / '.join(sorted({importance_of[s] for s in named}))}")
    return reasons
