"""
X1 OCR fallback: Tesseract is used only for scanned or demonstrably damaged PDF pages, within
fixed limits, with its output marked as OCR with confidence, and with every failure handled.
Tests that need the engine are skipped where Tesseract is not installed; the rest run anywhere.
"""
import os
import subprocess
import tempfile

import pymupdf
import pytest

from app.multilingual import ocr
from app.multilingual import document as document_module
from app.multilingual.document import read_document
from app.multilingual.evaluation import _as_scan, evaluate_scripts, render
from app.multilingual.extract import extract

HAS_OCR = ocr.status()["available"]
needs_ocr = pytest.mark.skipif(not HAS_OCR, reason="Tesseract is not installed here")

EN = {"id": "en-t", "side": ["Contact", "sam@example.com", "+91 91234 56789", "Skills", "Python, SQL, Docker"],
      "main": ["Sam Candidate", "I am a data analyst with three years of experience building reports and dashboards for business teams.", "Experience", "Data Analyst, Example Analytics", "January 2021 - Present", "Education", "B.Sc. Statistics, Example University, 2020"]}


def _scan_pdf(tmp_path, resume=EN, pages=1, noisy=False) -> str:
    path = render(resume, "pdf_single_column", str(tmp_path))
    doc = pymupdf.open(path)
    for _ in range(pages - 1):
        doc.insert_pdf(pymupdf.open(path))
    scan = _as_scan(doc, noisy=noisy)
    out = os.path.join(str(tmp_path), f"scan-{pages}-{noisy}.pdf")
    scan.save(out)
    return out


@pytest.fixture
def count_ocr(monkeypatch):
    calls = []
    real = ocr.ocr_pages

    def counting(doc, pages):
        calls.append(list(pages))
        return real(doc, pages)

    monkeypatch.setattr(ocr, "ocr_pages", counting)
    return calls


def test_clean_pdfs_never_reach_ocr(tmp_path, count_ocr):
    """English, Spanish and Hindi PDFs with a good text layer are read directly."""
    resumes = [
        EN,
        {"id": "es-t", "side": [], "main": ["Experiencia", "Analista de datos, Ejemplo", "enero 2021 - actualidad", "Habilidades", "Python, SQL"]},
        {"id": "hi-t", "side": [], "main": ["कार्य अनुभव", "डेटा विश्लेषक, उदाहरण एनालिटिक्स", "जनवरी २०२१ से वर्तमान तक", "कौशल", "Python, SQL"]},
    ]
    for resume in resumes:
        for layout in ("pdf_single_column", "pdf_two_column", "pdf_single_column_sans"):
            doc = read_document(render(resume, layout, str(tmp_path)), ".pdf")
            assert doc.text_source == "text_layer" and doc.ocr is None, (resume["id"], layout)
    assert count_ocr == [], "OCR was invoked for a clean PDF"


@needs_ocr
def test_scanned_pdf_is_read_by_ocr_with_provenance(tmp_path):
    doc = read_document(_scan_pdf(tmp_path), ".pdf")
    assert doc.text_source == "ocr" and doc.ocr["used"] and doc.ocr["reason"] == "scanned"
    assert doc.ocr["engine"].startswith("tesseract") and "eng" in doc.ocr["languages"] and "hin" in doc.ocr["languages"]
    assert 0 < doc.ocr["meanConfidence"] <= 100
    assert any("read by OCR" in w for w in doc.warnings), "the user is told the text is OCR output"
    result = extract(doc)
    assert result["status"] == "extracted" and result["textSource"] == "ocr"
    assert result["fields"]["email"]["value"] == "sam@example.com"
    # Every extracted value is marked as an OCR guess with its line's confidence
    for skill in result["fields"]["skills"]:
        assert skill["source"]["origin"] == "ocr" and 0 <= skill["source"]["ocrConfidence"] <= 100
    assert {s["name"] for s in result["fields"]["skills"]} >= {"Python", "SQL", "Docker"}


@needs_ocr
def test_page_limit_and_cleanup(tmp_path, monkeypatch):
    monkeypatch.setenv("OCR_MAX_PAGES", "2")
    before = {n for n in os.listdir(tempfile.gettempdir()) if n.startswith("sb-ocr-")}
    doc = read_document(_scan_pdf(tmp_path, pages=4), ".pdf")
    assert doc.ocr["pagesRequested"] == 4 and doc.ocr["pagesRead"] == 2 and doc.ocr["pagesSkipped"] == 2
    assert any("not read because of the OCR page or time limit" in w for w in doc.warnings)
    after = {n for n in os.listdir(tempfile.gettempdir()) if n.startswith("sb-ocr-")}
    assert after == before, "temporary page images are removed"


def test_pixel_budget_lowers_resolution_for_huge_pages():
    lim = {**ocr.limits(), "dpi": 300, "maxPixels": 25_000_000}
    assert ocr.render_dpi(595, 842, lim) == 300, "A4 at the requested 300 dpi"
    a0 = ocr.render_dpi(2384, 3370, lim)  # A0
    assert a0 < 300 and (2384 / 72 * a0) * (3370 / 72 * a0) <= 25_000_000
    assert ocr.render_dpi(100_000, 100_000, lim) == 72, "never below 72 dpi"


def test_limits_are_bounded(monkeypatch):
    monkeypatch.setenv("OCR_MAX_PAGES", "999")
    monkeypatch.setenv("OCR_DPI", "5000")
    monkeypatch.setenv("OCR_PAGE_SECONDS", "not-a-number")
    lim = ocr.limits()
    assert lim["maxPages"] == 20 and lim["dpi"] == 400 and lim["pageSeconds"] == 45


@needs_ocr
def test_timeout_and_engine_errors_are_handled(tmp_path, monkeypatch):
    path = _scan_pdf(tmp_path)

    def timeout(*args, **kwargs):
        if "--list-langs" in args[0] or "--version" in args[0]:
            return subprocess.CompletedProcess(args[0], 0, stdout="", stderr="")
        raise subprocess.TimeoutExpired(args[0], 1)

    real_run = subprocess.run
    monkeypatch.setattr(ocr.subprocess, "run", lambda *a, **k: timeout(*a, **k) if "tsv" in a[0] else real_run(*a, **k))
    doc = read_document(path, ".pdf")
    assert doc.ocr["failures"] == ["timeout"] and doc.ocr["pagesRead"] == 0
    assert extract(doc)["status"] == "scanned_unreadable", "a failed OCR is reported, not guessed"

    monkeypatch.setattr(ocr.subprocess, "run", lambda *a, **k: subprocess.CompletedProcess(a[0], 1, stdout=b"", stderr=b"boom") if "tsv" in a[0] else real_run(*a, **k))
    doc = read_document(path, ".pdf")
    assert doc.ocr["failures"] == ["error"] and not any("boom" in w for w in doc.warnings), "engine output is not shown"


def test_ocr_unavailable_is_reported(tmp_path, monkeypatch):
    monkeypatch.setenv("OCR_ENABLED", "false")
    doc = read_document(_scan_pdf(tmp_path), ".pdf")
    assert doc.ocr["failures"] == ["not_available"]
    assert any("OCR is not available on this server" in w for w in doc.warnings)
    assert extract(doc)["status"] == "scanned_unreadable"


def test_subprocess_is_called_safely(tmp_path, monkeypatch):
    """A list of arguments, never a shell; one thread; a timeout on every call."""
    seen = []
    monkeypatch.setattr(ocr, "tesseract_path", lambda: "tesseract-stub")
    monkeypatch.setattr(ocr, "status", lambda: {"available": True, "engine": "tesseract stub", "languages": ["eng", "hin"], "missing": []})

    def fake_run(args, **kwargs):
        seen.append((args, kwargs))
        return subprocess.CompletedProcess(args, 0, stdout=b"level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n5\t1\t1\t1\t1\t1\t0\t0\t1\t1\t91\tPython\n", stderr=b"")

    monkeypatch.setattr(ocr.subprocess, "run", fake_run)
    doc = pymupdf.open(_scan_pdf(tmp_path))
    result = ocr.ocr_pages(doc, [0])
    args, kwargs = seen[-1]
    assert isinstance(args, list) and args[0] == "tesseract-stub" and "-l" in args and args[args.index("-l") + 1] == "eng+hin"
    assert "shell" not in kwargs and kwargs["timeout"] > 0 and kwargs["env"]["OMP_THREAD_LIMIT"] == "1"
    assert [l.text for l in result.lines] == ["Python"] and result.lines[0].confidence == 91.0


@needs_ocr
def test_unsupported_scripts_are_refused_not_read_as_english():
    rows = evaluate_scripts()["rows"]
    assert len(rows) == 12
    for row in rows:
        assert row["status"] == "unsupported" and row["detected"] != "en", row
        assert row["fieldsExtracted"] == 0, "nothing is extracted from an unsupported language"


def test_damaged_text_is_kept_when_ocr_reads_no_better(tmp_path, monkeypatch):
    """OCR replaces a damaged text layer only when its own text is clean."""
    import json
    from app.multilingual.evaluation import DATASET
    hindi = next(r for r in json.load(open(DATASET, encoding="utf-8"))["resumes"] if r["id"] == "hi-1")
    path = render(hindi, "pdf_single_column_subset", str(tmp_path))
    monkeypatch.setattr(ocr, "ocr_pages", lambda doc, pages: ocr.OcrResult(lines=[ocr.OcrLine("डेटा ùविश्लेषक काùय वùतमान राȩल", 40.0)], page_lines={0: [ocr.OcrLine("डेटा ùविश्लेषक काùय वùतमान राȩल", 40.0)]}, pages=1, languages=["eng", "hin"], engine="stub"))
    doc = read_document(path, ".pdf")
    assert doc.text_quality == "degraded" and doc.text_source == "text_layer"
    assert doc.ocr["rejected"] == "ocr_text_also_damaged"
