"""
Reads a resume file into ordered lines, keeping track of layout, with no OCR and no network.

- PDF (PyMuPDF): text blocks are ordered by column when the page has two columns, otherwise top
  to bottom. Pages with images but almost no text are reported as scanned: SkillBridge has no
  local OCR, so they cannot be read.
- DOCX (python-docx): paragraphs and table cells in document order.
- TXT: as is.
The text layer is also checked for damage that commonly affects Devanagari in PDFs (shaped glyphs
mapped to the wrong characters), so a garbled extraction is reported instead of trusted.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List

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


def _lines(text: str) -> List[str]:
    return [l.strip() for l in text.splitlines() if l.strip()]


def _read_pdf(path: str) -> DocumentText:
    if pymupdf is None:
        raise ValueError("PDF support (PyMuPDF) is not installed on the AI service.")
    doc = pymupdf.open(path)
    lines: List[str] = []
    two_column_pages = 0
    scanned = 0
    for page in doc:
        blocks = [b for b in page.get_text("blocks") if b[6] == 0 and b[4].strip()]
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
    layout = "two_column" if two_column_pages > 0 else "single_column"
    return DocumentText(lines=lines, layout=layout, pages=pages, scanned_pages=scanned, warnings=warnings)


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
