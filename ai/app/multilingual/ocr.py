"""
Local OCR fallback with Tesseract (X1). Free, offline, no model downloads at run time.

Used only for PDF pages that are scanned (images with no usable text layer) or whose text layer is
demonstrably damaged; clean documents never reach it. Every limit is explicit:

- at most OCR_MAX_PAGES pages per document (default 5) and OCR_TOTAL_SECONDS in all (default 120);
- each page is rendered at OCR_DPI (default 300) but never above OCR_MAX_PIXELS (default 25 million
  pixels), so a huge page cannot exhaust memory;
- Tesseract runs as a subprocess with a list of arguments (never a shell), a per-page timeout
  (OCR_PAGE_SECONDS, default 45) and one thread; images go to a private temporary directory that is
  always removed;
- the text it returns is a guess. Callers mark it as OCR output with its confidence; it is never
  treated as verified evidence.

Languages: one pass with every approved language whose trained data is installed (English, Hindi,
Telugu, Tamil, Kannada, Malayalam). Tesseract keeps each script in its own script, so text in a
script SkillBridge cannot extract (Telugu, Tamil, Kannada, Malayalam) is recognised as that script
and then refused by language detection, instead of being misread as English. Spanish has no
installed OCR data; Latin-script pages are read with the English model.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import time
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Dict, List, Optional

APPROVED_LANGUAGES = ("eng", "hin", "tel", "tam", "kan", "mal")
WINDOWS_DEFAULT = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def _int_env(name: str, default: int, low: int, high: int) -> int:
    try:
        value = int(os.getenv(name, default))
    except ValueError:
        value = default
    return max(low, min(high, value))


def limits() -> Dict[str, int]:
    return {
        "maxPages": _int_env("OCR_MAX_PAGES", 5, 1, 20),
        "dpi": _int_env("OCR_DPI", 300, 100, 400),
        "maxPixels": _int_env("OCR_MAX_PIXELS", 25_000_000, 1_000_000, 60_000_000),
        "pageSeconds": _int_env("OCR_PAGE_SECONDS", 45, 5, 180),
        "totalSeconds": _int_env("OCR_TOTAL_SECONDS", 120, 10, 600),
    }


def tesseract_path() -> Optional[str]:
    """The Tesseract executable: TESSERACT_CMD, then PATH, then the default Windows install."""
    if (os.getenv("OCR_ENABLED", "true") or "").lower() == "false":
        return None
    for candidate in (os.getenv("TESSERACT_CMD"), shutil.which("tesseract"), WINDOWS_DEFAULT):
        if candidate and os.path.isfile(candidate):
            return candidate
    return None


@lru_cache(maxsize=4)
def _installed(cmd: str) -> tuple:
    try:
        out = subprocess.run([cmd, "--list-langs"], capture_output=True, text=True, timeout=15, check=False)
    except (OSError, subprocess.SubprocessError):
        return ()
    return tuple(line.strip() for line in out.stdout.splitlines()[1:] if line.strip())


@lru_cache(maxsize=4)
def _version(cmd: str) -> str:
    try:
        out = subprocess.run([cmd, "--version"], capture_output=True, text=True, timeout=15, check=False)
        return (out.stdout or out.stderr).splitlines()[0].strip()
    except (OSError, subprocess.SubprocessError, IndexError):
        return "unknown"


def status() -> dict:
    """Whether OCR can run here, its version, and the approved languages actually installed."""
    cmd = tesseract_path()
    if not cmd:
        return {"available": False, "engine": None, "languages": [], "missing": list(APPROVED_LANGUAGES)}
    installed = set(_installed(cmd))
    langs = [lang for lang in APPROVED_LANGUAGES if lang in installed]
    return {
        "available": "eng" in installed,
        "engine": _version(cmd),
        "languages": langs,
        "missing": [lang for lang in APPROVED_LANGUAGES if lang not in installed],
    }


@dataclass
class OcrLine:
    text: str
    confidence: float  # mean word confidence, 0-100


@dataclass
class OcrResult:
    lines: List[OcrLine] = field(default_factory=list)
    page_lines: Dict[int, List[OcrLine]] = field(default_factory=dict)
    pages: int = 0
    pages_skipped: int = 0
    failures: List[str] = field(default_factory=list)  # codes only: timeout, error, not_available
    seconds: float = 0.0
    languages: List[str] = field(default_factory=list)
    engine: Optional[str] = None

    @property
    def mean_confidence(self) -> Optional[float]:
        if not self.lines:
            return None
        return round(sum(l.confidence for l in self.lines) / len(self.lines), 1)


def _parse_tsv(tsv: str) -> List[OcrLine]:
    """Tesseract TSV -> lines in reading order, each with the mean confidence of its words."""
    lines: Dict[tuple, List[tuple]] = {}
    order: List[tuple] = []
    for row in tsv.splitlines()[1:]:
        cols = row.split("\t")
        if len(cols) < 12 or cols[0] != "5":
            continue
        text = cols[11].strip()
        try:
            conf = float(cols[10])
        except ValueError:
            continue
        if not text or conf < 0:
            continue
        key = (cols[1], cols[2], cols[3], cols[4])  # page, block, paragraph, line
        if key not in lines:
            lines[key] = []
            order.append(key)
        lines[key].append((text, conf))
    out = []
    for key in order:
        words = lines[key]
        text = " ".join(w for w, _ in words).replace("\u200c", "").replace("\u200d", "")
        out.append(OcrLine(text=text, confidence=round(sum(c for _, c in words) / len(words), 1)))
    return out


def render_dpi(width_pt: float, height_pt: float, lim: Optional[Dict[str, int]] = None) -> int:
    """The resolution to render a page at: OCR_DPI, lowered so the image never exceeds the pixel
    budget whatever the page size, and never below 72."""
    lim = lim or limits()
    area_in2 = max(1.0, (width_pt / 72) * (height_pt / 72))
    return max(72, min(lim["dpi"], int((lim["maxPixels"] / area_in2) ** 0.5)))


def ocr_pages(doc, page_numbers: List[int]) -> OcrResult:
    """OCR the given pages of an open PyMuPDF document within every limit above."""
    result = OcrResult()
    cmd = tesseract_path()
    st = status()
    if not cmd or not st["available"]:
        result.failures.append("not_available")
        result.pages_skipped = len(page_numbers)
        return result
    lim = limits()
    result.languages = st["languages"]
    result.engine = st["engine"]
    started = time.monotonic()
    env = {**os.environ, "OMP_THREAD_LIMIT": "1"}
    with tempfile.TemporaryDirectory(prefix="sb-ocr-") as folder:
        for index, number in enumerate(page_numbers):
            remaining = lim["totalSeconds"] - (time.monotonic() - started)
            if index >= lim["maxPages"] or remaining <= 1:
                result.pages_skipped = len(page_numbers) - index
                break
            page = doc[number]
            dpi = render_dpi(page.rect.width, page.rect.height, lim)
            image = os.path.join(folder, f"page-{number}.png")
            try:
                page.get_pixmap(dpi=dpi).save(image)
                run = subprocess.run(
                    [cmd, image, "stdout", "-l", "+".join(result.languages), "--psm", "3", "tsv"],
                    capture_output=True,
                    timeout=min(lim["pageSeconds"], remaining),
                    env=env,
                    check=False,
                )
                if run.returncode != 0:
                    result.failures.append("error")
                    continue
                parsed = _parse_tsv(run.stdout.decode("utf-8", errors="replace"))
                result.page_lines[number] = parsed
                result.lines.extend(parsed)
                result.pages += 1
            except subprocess.TimeoutExpired:
                result.failures.append("timeout")
            except (OSError, RuntimeError, ValueError):
                result.failures.append("error")
            finally:
                if os.path.exists(image):
                    os.remove(image)
    result.seconds = round(time.monotonic() - started, 2)
    return result
