"""
Recovers Devanagari text that a PDF's text layer does not map to Unicode.

Shaped Devanagari is drawn with glyphs for conjuncts, half forms, reph and similar that have no
character of their own. Many PDFs (including those written by common exporters) give these glyphs
no Unicode mapping, so extractors emit U+FFFD or stray Latin letters and re-sort what is left by
position. The font embedded in the PDF still says how each such glyph was made: its cmap maps
characters to base glyphs, and its GSUB table maps sequences of glyphs to ligatures and variants.
Reversing those substitutions gives the characters behind each glyph.

This is deterministic, local and free: no OCR, no model and no network. It works only when the PDF
embeds the font with its GSUB table and draws text in logical order (as HarfBuzz-shaped output
does); anything it cannot map is counted and left reported, never guessed.
"""
from __future__ import annotations

import struct
from typing import Dict, List, Optional, Tuple

# Code points worth mapping from the cmap: Devanagari, Devanagari Extended, Vedic, joiners, the
# dotted circle used for isolated marks, and Devanagari-related punctuation.
_RANGES = [(0x0900, 0x097F), (0xA8E0, 0xA8FF), (0x1CD0, 0x1CFF), (0x200C, 0x200D), (0x25CC, 0x25CC), (0x0964, 0x0965)]


def _u16(b: bytes, o: int) -> int:
    return struct.unpack_from(">H", b, o)[0]


def _i16(b: bytes, o: int) -> int:
    return struct.unpack_from(">h", b, o)[0]


def _u32(b: bytes, o: int) -> int:
    return struct.unpack_from(">I", b, o)[0]


def _table(buf: bytes, tag: bytes) -> Optional[int]:
    """Offset of a table in an OpenType/TrueType font, or None."""
    if len(buf) < 12:
        return None
    for i in range(_u16(buf, 4)):
        rec = 12 + 16 * i
        if buf[rec:rec + 4] == tag:
            return _u32(buf, rec + 8)
    return None


def _coverage(buf: bytes, off: int) -> List[int]:
    fmt = _u16(buf, off)
    if fmt == 1:
        n = _u16(buf, off + 2)
        return [_u16(buf, off + 4 + 2 * i) for i in range(n)]
    if fmt == 2:
        glyphs: List[int] = []
        for i in range(_u16(buf, off + 2)):
            rec = off + 4 + 6 * i
            glyphs.extend(range(_u16(buf, rec), _u16(buf, rec + 2) + 1))
        return glyphs
    return []


def gsub_reverse(buf: bytes) -> Dict[int, List[Tuple[int, ...]]]:
    """For every glyph a substitution can produce, the input glyph sequences that produce it."""
    out: Dict[int, List[Tuple[int, ...]]] = {}
    gsub = _table(buf, b"GSUB")
    if gsub is None:
        return out

    def add(produced: int, inputs: Tuple[int, ...]) -> None:
        if produced not in inputs:
            out.setdefault(produced, []).append(inputs)

    def subtable(kind: int, st: int) -> None:
        if kind == 7:  # extension: the real subtable is elsewhere
            subtable(_u16(buf, st + 2), st + _u32(buf, st + 4))
            return
        fmt = _u16(buf, st)
        if kind == 1:  # single
            cov = _coverage(buf, st + _u16(buf, st + 2))
            if fmt == 1:
                delta = _i16(buf, st + 4)
                for g in cov:
                    add((g + delta) & 0xFFFF, (g,))
            elif fmt == 2:
                for i, g in enumerate(cov):
                    add(_u16(buf, st + 6 + 2 * i), (g,))
        elif kind == 3 and fmt == 1:  # alternate
            cov = _coverage(buf, st + _u16(buf, st + 2))
            for i, g in enumerate(cov):
                alt = st + _u16(buf, st + 6 + 2 * i)
                for j in range(_u16(buf, alt)):
                    add(_u16(buf, alt + 2 + 2 * j), (g,))
        elif kind == 4 and fmt == 1:  # ligature
            cov = _coverage(buf, st + _u16(buf, st + 2))
            for i, first in enumerate(cov):
                ligset = st + _u16(buf, st + 6 + 2 * i)
                for j in range(_u16(buf, ligset)):
                    lig = ligset + _u16(buf, ligset + 2 + 2 * j)
                    count = _u16(buf, lig + 2)
                    comps = tuple(_u16(buf, lig + 4 + 2 * k) for k in range(count - 1))
                    add(_u16(buf, lig), (first,) + comps)

    try:
        lookups = gsub + _u16(buf, gsub + 8)
        for i in range(_u16(buf, lookups)):
            lookup = lookups + _u16(buf, lookups + 2 + 2 * i)
            kind = _u16(buf, lookup)
            for j in range(_u16(buf, lookup + 4)):
                subtable(kind, lookup + _u16(buf, lookup + 6 + 2 * j))
    except struct.error:
        # A truncated or unusual table: keep what was read
        pass
    return out


def glyph_text_map(buf: bytes, glyph_for_codepoint) -> Dict[int, str]:
    """glyph id -> the characters it stands for, from the cmap and reversed GSUB substitutions."""
    mapping: Dict[int, str] = {}
    for lo, hi in _RANGES:
        for cp in range(lo, hi + 1):
            gid = glyph_for_codepoint(cp)
            if gid and gid not in mapping:
                mapping[gid] = chr(cp)
    reverse = gsub_reverse(buf)
    # Each glyph is fixed in the first pass in which it can be resolved, so derivations cannot
    # feed back into themselves. Within a pass a glyph may have several resolved candidates, e.g.
    # the reph is both a ligature of र + ् and a positional variant used next to ं; the ligature
    # says more about the text, so the longest wins. Joiners (ZWJ, ZWNJ) only steer rendering and
    # are dropped from recovered text.
    for _ in range(16):
        resolved: Dict[int, str] = {}
        for produced, candidates in reverse.items():
            if produced in mapping:
                continue
            for inputs in candidates:
                if all(g in mapping for g in inputs):
                    text = "".join(mapping[g] for g in inputs).replace("‍", "").replace("‌", "")
                    if len(text) > len(resolved.get(produced, "")):
                        resolved[produced] = text
        if not resolved:
            break
        mapping.update(resolved)
    return mapping
