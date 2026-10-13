"""
Reads a resume file into ordered lines, keeping track of layout, with no OCR and no network.

- PDF (PyMuPDF): text blocks are ordered by column when the page has two columns, otherwise top
  to bottom. Pages with images but almost no text are reported as scanned: SkillBridge has no
  local OCR, so they cannot be read.
- DOCX (python-docx): paragraphs and table cells in document order.
- TXT: as is.
The text layer is also checked for damage that commonly affects Devanagari in PDFs (shaped glyphs
mapped to the wrong characters), so a garbled extraction is reported instead of trusted. Where a
PDF leaves shaped Devanagari glyphs without characters but embeds its font, the characters are
recovered from the font's own tables (pdf_glyphs.py) before that check.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from app.multilingual.pdf_glyphs import glyph_text_map

try:
    import pymupdf  # PyMuPDF
except ImportError:  # pragma: no cover
    pymupdf = None

try:
    import docx  # python-docx
except ImportError:  # pragma: no cover
    docx = None

SCANNED_PAGE_TEXT_CHARS = 20


@dataclass
class DocumentText:
    lines: List[str]
    layout: str  # single_column | two_column | table | plain_text
    pages: int = 1
    scanned_pages: int = 0
    warnings: List[str] = field(default_factory=list)
    text_quality: str = "ok"  # ok | degraded
    # Devanagari glyphs the PDF left without characters: recovered from the embedded font, or not
    glyphs_recovered: int = 0
    glyphs_unrecovered: int = 0


def _lines(text: str) -> List[str]:
    return [l.strip() for l in text.splitlines() if l.strip()]


_UNMAPPED = 0xFFFD


def _font_key(name: str) -> str:
    """'ABCDEF+Noto Serif Devanagari Regular' and 'NotoSerifDevanagari-Regular' compare equal."""
    name = name.split("+", 1)[-1]
    return re.sub(r"[^a-z0-9]", "", name.lower())


class _GlyphRecovery:
    """Per document: glyph -> characters for each embedded font that needs it."""

    def __init__(self, doc):
        self.doc = doc
        self.maps: Dict[str, Optional[Dict[int, str]]] = {}
        self.recovered = 0
        self.unrecovered = 0

    def _map_for(self, page, font_name: str) -> Optional[Dict[int, str]]:
        key = _font_key(font_name)
        if key not in self.maps:
            self.maps[key] = None
            for xref, _ext, _type, basefont, _name, _enc in page.get_fonts(full=False):
                if _font_key(basefont) != key:
                    continue
                buffer = self.doc.extract_font(xref)[3]
                if buffer:
                    font = pymupdf.Font(fontbuffer=buffer)
                    self.maps[key] = glyph_text_map(buffer, font.has_glyph)
                break
        return self.maps[key]

    def page_chars(self, page):
        """(text, x, baseline, font size) per character in content-stream order, or None when
        the page has no unmapped glyph (then the ordinary extraction is used unchanged)."""
        trace = page.get_texttrace()
        if not any(c[0] == _UNMAPPED for span in trace for c in span["chars"]):
            return None
        chars = []
        for span in trace:
            mapping = None
            for ucs, gid, origin, bbox in span["chars"]:
                if ucs == _UNMAPPED:
                    mapping = mapping if mapping is not None else (self._map_for(page, span["font"]) or {})
                    text = mapping.get(gid)
                    if text:
                        self.recovered += 1
                    else:
                        self.unrecovered += 1
                        text = "�"
                else:
                    text = chr(ucs) if ucs > 0 else ""
                chars.append((text, origin[0], origin[1], span["size"], bbox[2]))
        return chars


def _blocks_text_from_chars(chars, blocks) -> List[str]:
    """Each block's text rebuilt from the characters drawn inside it, in drawing order, one line
    per baseline. Every character belongs to one block only: the first whose box holds its origin."""
    texts: List[List[str]] = [[] for _ in blocks]
    state = [("", None, None)] * len(blocks)  # (current line, its baseline, rightmost glyph edge so far) per block
    for text, x, y, size, right in chars:
        for i, b in enumerate(blocks):
            if b[0] - 1 <= x <= b[2] + 1 and b[1] - 1 <= y <= b[3] + 1:
                line, baseline, line_right = state[i]
                if baseline is not None and abs(y - baseline) > max(2.0, size * 0.4):
                    texts[i].append(line)
                    line, line_right = "", None
                elif line_right is not None and line and not line.endswith(" ") and text != " " and (x - line_right > size or x < line_right - 3 * size):
                    # A gap of a font size or more, or a long jump back to the left (another column),
                    # separates words. Shaped marks are drawn out of order (the short-i sign left of
                    # its cluster, the reph right of it), so gaps are measured from the line's
                    # rightmost edge and short jumps are normal.
                    line += " "
                state[i] = (line + text, y, right if line_right is None else max(line_right, right))
                break
    for i, (line, _baseline, _right) in enumerate(state):
        texts[i].append(line)
    return ["\n".join(_rejoin_vowel_signs(l) for l in t) for t in texts]


# A vowel sign never follows an independent vowel in Hindi spelling. When a font draws a vowel as
# another vowel plus a sign (ओ as आ + े), the text layer can hold that drawing instead of the letter.
_VOWEL_DRAWINGS = {"अा": "आ", "आे": "ओ", "आै": "औ", "अो": "ओ", "अौ": "औ", "एे": "ऐ", "अॉ": "ऑ"}


def _rejoin_vowel_signs(text: str) -> str:
    for drawn, letter in _VOWEL_DRAWINGS.items():
        text = text.replace(drawn, letter)
    return text


def _read_pdf(path: str) -> DocumentText:
    if pymupdf is None:
        raise ValueError("PDF support (PyMuPDF) is not installed on the AI service.")
    doc = pymupdf.open(path)
    recovery = _GlyphRecovery(doc)
    lines: List[str] = []
    two_column_pages = 0
    scanned = 0
    for page in doc:
        blocks = [b for b in page.get_text("blocks") if b[6] == 0 and b[4].strip()]
        chars = recovery.page_chars(page)
        if chars is not None:
            # The ordinary text of these blocks has unmapped glyphs and position-sorted characters
            rebuilt = _blocks_text_from_chars(chars, blocks)
            blocks = [(*b[:4], text, *b[5:]) for b, text in zip(blocks, rebuilt) if text.strip()]
        text_chars = sum(len(b[4].strip()) for b in blocks)
        if text_chars < SCANNED_PAGE_TEXT_CHARS and page.get_images(full=False):
            scanned += 1
            continue
        width = page.rect.width
        # Each block belongs to the column it starts in
        left = [b for b in blocks if b[0] < width * 0.4]
        right = [b for b in blocks if b[0] >= width * 0.4]
        right_chars = sum(len(b[4].strip()) for b in right)
        gutter = min((b[0] for b in right), default=width)
        # Two columns: left blocks end before the right column starts, and the right column holds
        # a real share of the text (so right-aligned dates in one column do not count)
        if (
            len(left) >= 2
            and len(right) >= 3
            and all(b[2] <= gutter + 2 for b in left)
            and right_chars >= 0.3 * max(1, text_chars)
        ):
            two_column_pages += 1
            ordered = sorted(left, key=lambda b: (b[1], b[0])) + sorted(right, key=lambda b: (b[1], b[0]))
        else:
            ordered = sorted(blocks, key=lambda b: (round(b[1], 1), b[0]))
        for b in ordered:
            lines.extend(_lines(b[4]))
    pages = doc.page_count
    warnings = []
    if scanned:
        warnings.append(
            f"{scanned} of {pages} page(s) look scanned (images without a text layer). SkillBridge has no OCR, so their text cannot be read."
        )
    if recovery.recovered:
        warnings.append(
            f"{recovery.recovered} Devanagari glyph(s) had no character in the PDF's text layer and were recovered from the embedded font."
            + (f" {recovery.unrecovered} could not be recovered." if recovery.unrecovered else "")
        )
    layout = "two_column" if two_column_pages > 0 else "single_column"
    return DocumentText(
        lines=lines, layout=layout, pages=pages, scanned_pages=scanned, warnings=warnings,
        glyphs_recovered=recovery.recovered, glyphs_unrecovered=recovery.unrecovered,
    )


def _read_docx(path: str) -> DocumentText:
    if docx is None:
        raise ValueError("DOCX support (python-docx) is not installed on the AI service.")
    d = docx.Document(path)
    lines: List[str] = []
    table_chars = 0
    body = d.element.body
    for child in body.iterchildren():
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "p":
            text = "".join(t.text or "" for t in child.iter() if t.tag.endswith("}t"))
            lines.extend(_lines(text))
        elif tag == "tbl":
            for row in child.iter():
                if not row.tag.endswith("}tr"):
                    continue
                for cell in row.iter():
                    if not cell.tag.endswith("}tc"):
                        continue
                    for p in cell.iter():
                        if p.tag.endswith("}p"):
                            text = "".join(t.text or "" for t in p.iter() if t.tag.endswith("}t"))
                            table_chars += len(text)
                            lines.extend(_lines(text))
    total = sum(len(l) for l in lines) or 1
    return DocumentText(lines=lines, layout="table" if table_chars / total > 0.5 else "single_column")


# Characters that should never sit inside a Devanagari word: Latin-extended and symbol glyphs
# appear when a PDF maps shaped conjuncts to the wrong code points.
_FOREIGN_IN_DEVANAGARI = re.compile(r"[ऀ-ॿ][ -ɏʰ-ͯ -⁯�-]|[ -ɏ�-][ऀ-ॿ]")
_MATRA_START = re.compile(r"(?:^|\s)[ा-्]")


def assess_text_quality(lines: List[str]) -> tuple[str, List[str]]:
    text = "\n".join(lines)
    devanagari = len(re.findall(r"[ऀ-ॿ]", text))
    issues = len(_FOREIGN_IN_DEVANAGARI.findall(text)) + len(re.findall(r"\(cid:\d+\)", text)) + len(_MATRA_START.findall(text))
    if devanagari and issues >= max(2, devanagari * 0.01):
        return "degraded", [
            "The PDF's text layer garbles part of the Devanagari text (a common problem with Hindi PDFs). "
            "Words with conjuncts may be wrong or missing; dates, numbers and Latin-script skills are less affected. "
            "For best results upload the resume as DOCX or plain text."
        ]
    if "�" in text:
        return "degraded", ["Some characters could not be decoded from the file."]
    return "ok", []


def read_document(path: str, ext: str) -> DocumentText:
    if ext == ".pdf":
        result = _read_pdf(path)
    elif ext == ".docx":
        result = _read_docx(path)
    elif ext == ".txt":
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            result = DocumentText(lines=_lines(fh.read()), layout="plain_text")
    else:
        raise ValueError(f"Unsupported document type: {ext}")
    quality, warnings = assess_text_quality(result.lines)
    result.text_quality = quality
    result.warnings.extend(warnings)
    return result


def from_text(text: str) -> DocumentText:
    lines = _lines(text)
    quality, warnings = assess_text_quality(lines)
    return DocumentText(lines=lines, layout="plain_text", text_quality=quality, warnings=warnings)
