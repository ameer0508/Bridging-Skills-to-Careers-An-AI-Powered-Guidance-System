"""
Language detection for resumes without any model: Unicode script shares decide the script, and
whole-word function-word counts decide the language within a script. The result says how it was
decided, and refuses what SkillBridge does not support instead of guessing.
"""
from __future__ import annotations

import re
from typing import Dict

from .languages import RECOGNISED_UNSUPPORTED, SCRIPT_NAMES, SCRIPTS, STOPWORDS, SUPPORTED

MIN_WORDS = 15
WORD = re.compile(r"[^\W\d_]+", re.UNICODE)


def script_counts(text: str) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for ch in text:
        if not ch.isalpha():
            continue
        code = ord(ch)
        for name, lo, hi in SCRIPTS:
            if lo <= code <= hi:
                counts[name] = counts.get(name, 0) + 1
                break
        else:
            counts["other"] = counts.get("other", 0) + 1
    return counts


def detect_language(text: str) -> dict:
    words = [w.lower() for w in WORD.findall(text or "")]
    counts = script_counts(text or "")
    letters = sum(counts.values()) or 1
    shares = {k: round(v / letters, 3) for k, v in sorted(counts.items(), key=lambda kv: -kv[1])}
    base = {"scripts": shares, "words": len(words)}

    if len(words) < MIN_WORDS:
        return {**base, "language": None, "supported": False, "status": "too_little_text",
                "message": f"Only {len(words)} words of text were found; at least {MIN_WORDS} are needed to tell the language."}

    devanagari = shares.get("devanagari", 0)
    latin = shares.get("latin", 0)
    other_scripts = {k: v for k, v in shares.items() if k not in ("latin", "devanagari", "other")}
    dominant_other = max(other_scripts.items(), key=lambda kv: kv[1]) if other_scripts else None

    if dominant_other and dominant_other[1] >= 0.2 and dominant_other[1] > devanagari:
        name = SCRIPT_NAMES.get(dominant_other[0], dominant_other[0])
        return {**base, "language": None, "supported": False, "status": "unsupported_script", "script": dominant_other[0],
                "message": f"This resume is mostly in {name}, which SkillBridge cannot read yet. Supported: {', '.join(SUPPORTED.values())}."}

    word_set = words
    hits = {lang: sum(1 for w in word_set if w in stop) for lang, stop in STOPWORDS.items()}

    if devanagari >= 0.2:
        if hits["mr"] > hits["hi"]:
            return {**base, "language": "mr", "supported": False, "status": "unsupported_language", "evidence": {"hi": hits["hi"], "mr": hits["mr"]},
                    "message": "This resume looks like Marathi. SkillBridge reads Hindi in Devanagari script, not Marathi yet."}
        return {**base, "language": "hi", "name": SUPPORTED["hi"], "supported": True, "status": "detected",
                "mixed": latin >= 0.2, "evidence": {"hi": hits["hi"], "mr": hits["mr"], "devanagariShare": devanagari}}

    latin_langs = {lang: hits[lang] for lang in ("en", "es", "fr", "de", "pt")}
    accents = len(re.findall(r"[ñ¿¡áéíóú]", text.lower()))
    latin_langs["es"] += accents // 3
    best = max(latin_langs.items(), key=lambda kv: kv[1])
    second = sorted(latin_langs.values(), reverse=True)[1]
    if best[1] == 0:
        return {**base, "language": None, "supported": False, "status": "undetermined", "evidence": latin_langs,
                "message": "The language could not be determined from the text."}
    if best[0] in RECOGNISED_UNSUPPORTED:
        return {**base, "language": best[0], "supported": False, "status": "unsupported_language", "evidence": latin_langs,
                "message": f"This resume looks like {RECOGNISED_UNSUPPORTED[best[0]]}. Supported: {', '.join(SUPPORTED.values())}."}
    return {**base, "language": best[0], "name": SUPPORTED[best[0]], "supported": True, "status": "detected",
            "mixed": devanagari >= 0.05, "evidence": latin_langs, "margin": best[1] - second}
