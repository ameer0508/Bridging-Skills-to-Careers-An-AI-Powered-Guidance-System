"""
Field extraction for English, Hindi and Spanish resumes (E5, X1), with provenance.

Every extracted value carries the line it came from (index and original text), so it can be
checked against the document. Values are normalised: section headings to canonical keys, dates to
YYYY-MM (or YYYY), Devanagari digits to ASCII, phone numbers to digits, skills to lexicon names.
Nothing is translated and nothing is invented: a field that cannot be found is left empty.
"""
from __future__ import annotations

import re
import unicodedata
from typing import Dict, List, Optional, Tuple

from app.resume_intelligence.skill_lexicon import get_lexicon

from .detect import detect_language
from .document import DocumentText
from .languages import DEVANAGARI_DIGITS, MONTHS, PRESENT_WORDS, SECTION_HEADINGS, SUPPORTED, TRANSLATED_SKILL_TERMS

METHOD_VERSION = "multilingual-rules-2"

EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
PHONE = re.compile(r"(?<!\d)(\+?\d[\d\s().-]{7,16}\d)(?!\d)")
YEAR = re.compile(r"(?<!\d)(19[5-9]\d|20[0-4]\d)(?!\d)")
NUMERIC_MONTH_YEAR = re.compile(r"(?<!\d)(0?[1-9]|1[0-2])[/.-](19[5-9]\d|20[0-4]\d)(?!\d)")


def _fold(s: str) -> str:
    """Lower-case, NFC-normalised, without trailing colons or bullets."""
    s = unicodedata.normalize("NFC", s).strip().strip("•·-–—*").strip()
    return s.rstrip(":：").strip().casefold()


_HEADINGS: Dict[str, Tuple[str, str]] = {}
for _lang, _sections in SECTION_HEADINGS.items():
    for _key, _phrases in _sections.items():
        for _p in _phrases:
            _HEADINGS[_fold(_p)] = (_key, _lang)
_HEADING_PREFIXES = sorted(_HEADINGS, key=len, reverse=True)

# Single heading words that belong to exactly one section, used only when a PDF's text layer is
# damaged and full headings no longer match (see heading_of_degraded)
_token_keys: Dict[str, set] = {}
for _lang, _sections in SECTION_HEADINGS.items():
    for _key, _phrases in _sections.items():
        for _p in _phrases:
            for _t in _fold(_p).split():
                if len(_t) >= 3:
                    _token_keys.setdefault(_t, set()).add(_key)
_HEADING_TOKENS: Dict[str, str] = {t: next(iter(k)) for t, k in _token_keys.items() if len(k) == 1}
_LETTERS_ONLY = re.compile(r"[^\wऀ-ॿ]+")

_SKILL_TERMS = [(re.compile(r"(?<![\wऀ-ॿ])" + re.escape(t) + r"(?![\wऀ-ॿ])", re.IGNORECASE), t, n) for t, n in TRANSLATED_SKILL_TERMS.items()]

_MONTH_WORDS: Dict[str, int] = {}
for _lang, _months in MONTHS.items():
    for _w, _n in _months.items():
        _MONTH_WORDS[_w.casefold()] = _n
_MONTH_PATTERN = re.compile(
    r"(?<![\wऀ-ॿ])(" + "|".join(sorted(map(re.escape, _MONTH_WORDS), key=len, reverse=True)) + r")\.?,?\s+(?:de\s+)?(19[5-9]\d|20[0-4]\d)(?!\d)",
    re.IGNORECASE,
)
_PRESENT_PATTERN = re.compile("|".join(sorted(map(re.escape, PRESENT_WORDS), key=len, reverse=True)), re.IGNORECASE)


def heading_of(line: str) -> Optional[Tuple[str, str, str]]:
    """(section key, heading language, remainder) when the line is, or starts with, a heading."""
    folded = _fold(line)
    if folded in _HEADINGS:
        key, lang = _HEADINGS[folded]
        return key, lang, ""
    for prefix in _HEADING_PREFIXES:
        if folded.startswith(prefix) and len(folded) > len(prefix) and folded[len(prefix)] in ":：":
            key, lang = _HEADINGS[prefix]
            rest = line.split(":", 1)[1] if ":" in line else line.split("：", 1)[1]
            return key, lang, rest.strip()
    return None


def heading_of_degraded(line: str) -> Optional[str]:
    """For damaged text layers: a short line without digits that contains one heading word."""
    if re.search(r"[\d@]", line):
        return None
    tokens = [_LETTERS_ONLY.sub("", t) for t in _fold(line).split()]
    tokens = [t for t in tokens if t]
    if not 1 <= len(tokens) <= 4:
        return None
    for t in tokens:
        if t in _HEADING_TOKENS:
            return _HEADING_TOKENS[t]
    return None


def find_dates(line: str) -> List[Tuple[int, str]]:
    """Dates in a line as (position, value): 'YYYY-MM', 'YYYY' or 'present'."""
    text = line.translate(DEVANAGARI_DIGITS)
    found: List[Tuple[int, str]] = []
    taken: List[Tuple[int, int]] = []

    def free(a: int, b: int) -> bool:
        return all(b <= s or a >= e for s, e in taken)

    for m in _MONTH_PATTERN.finditer(text):
        found.append((m.start(), f"{m.group(2)}-{_MONTH_WORDS[m.group(1).casefold()]:02d}"))
        taken.append(m.span())
    for m in NUMERIC_MONTH_YEAR.finditer(text):
        if free(*m.span()):
            found.append((m.start(), f"{m.group(2)}-{int(m.group(1)):02d}"))
            taken.append(m.span())
    for m in YEAR.finditer(text):
        if free(*m.span()):
            found.append((m.start(), m.group(1)))
            taken.append(m.span())
    for m in _PRESENT_PATTERN.finditer(text):
        if free(*m.span()):
            found.append((m.start(), "present"))
    return sorted(found)


def date_range(line: str) -> Optional[Dict[str, str]]:
    dates = find_dates(line)
    if len(dates) >= 2:
        return {"start": dates[0][1], "end": dates[1][1]}
    return None


def _source(index: int, line: str) -> dict:
    return {"line": index, "text": line}


def extract(document: DocumentText) -> dict:
    lines = document.lines
    full_text = "\n".join(lines)
    language = detect_language(full_text)
    result = {
        "method": METHOD_VERSION,
        "language": language,
        "layout": {"type": document.layout, "pages": document.pages, "scannedPages": document.scanned_pages},
        "textQuality": document.text_quality,
        "warnings": list(document.warnings),
        "sections": [],
        "fields": {"email": None, "phone": None, "experience": [], "education": [], "skills": []},
        "lineCount": len(lines),
        "originalLines": lines,
    }
    if document.scanned_pages and not lines:
        result["status"] = "scanned_unreadable"
        return result
    if not language.get("supported"):
        result["status"] = "unsupported"
        result["warnings"].append(language.get("message", "This language is not supported."))
        return result
    result["status"] = "extracted"

    # Sections: from each heading to the next
    current: Optional[dict] = None
    section_of_line: List[Optional[str]] = []
    degraded = document.text_quality == "degraded"
    for i, line in enumerate(lines):
        h = heading_of(line)
        if not h and degraded:
            loose = heading_of_degraded(line)
            h = (loose, None, "") if loose else None
        if h:
            key, lang, rest = h
            current = {"key": key, "heading": line, "headingLanguage": lang, "startLine": i, "endLine": i, "matchedLoosely": lang is None}
            result["sections"].append(current)
            section_of_line.append(key if rest else None)
            continue
        if current:
            current["endLine"] = i
        section_of_line.append(current["key"] if current else None)

    lexicon = get_lexicon()
    seen_skills: set = set()
    previous_text: Optional[str] = None
    for i, line in enumerate(lines):
        section = section_of_line[i]
        text = line.translate(DEVANAGARI_DIGITS)
        if result["fields"]["email"] is None:
            m = EMAIL.search(text)
            if m:
                result["fields"]["email"] = {"value": m.group(0).lower(), **{"source": _source(i, line)}}
        if result["fields"]["phone"] is None and not EMAIL.search(text):
            for m in PHONE.finditer(text):
                digits = re.sub(r"[^\d+]", "", m.group(1))
                if 9 <= len(digits.lstrip("+")) <= 13 and not YEAR.fullmatch(m.group(1).strip()):
                    result["fields"]["phone"] = {"value": digits, "source": _source(i, line)}
                    break
        no_experience_heading = not any(sec["key"] == "experience" for sec in result["sections"])
        if section == "experience" or (degraded and no_experience_heading and section != "education"):
            rng = date_range(line)
            if rng:
                entry = {**rng, "context": previous_text, "source": _source(i, line)}
                if section != "experience":
                    # Damaged text: the heading was lost, so the date range alone suggests experience
                    entry["inferred"] = True
                result["fields"]["experience"].append(entry)
        if section == "education":
            years = [int(y) for y in YEAR.findall(text)]
            if years and not heading_of(line):
                result["fields"]["education"].append({"year": max(years), "source": _source(i, line)})
        # Skills anywhere, as the existing parser does: lexicon names in any script line, plus the
        # small Devanagari dictionary
        for mention in lexicon.find_mentions(line):
            name = mention.skill.name
            if name not in seen_skills:
                seen_skills.add(name)
                result["fields"]["skills"].append({"name": name, "matched": mention.matched_text, "source": _source(i, line)})
        for pattern, term, name in _SKILL_TERMS:
            if name not in seen_skills and pattern.search(line):
                seen_skills.add(name)
                result["fields"]["skills"].append({"name": name, "matched": term, "source": _source(i, line)})
        if not heading_of(line):
            previous_text = line
    return result


def supported_languages() -> List[dict]:
    return [{"code": code, "name": name} for code, name in SUPPORTED.items()]
