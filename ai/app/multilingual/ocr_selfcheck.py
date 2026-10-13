"""
OCR self-check for deployments: `python -m app.multilingual.ocr_selfcheck`.

Verifies that Tesseract is installed with every approved language, then builds an English and a
Hindi page, turns them into image-only (scanned) PDFs and reads them through the real pipeline.
Prints one JSON line; exits 1 if anything required is missing or unreadable. No network, no files
left behind.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile

import pymupdf

from app.multilingual import ocr
from app.multilingual.document import read_document

CHECKS = {
    "eng": ["Skills", "Python, SQL, Docker", "Experience", "Data Analyst, Example Analytics"],
    "hin": ["कौशल", "Python, SQL, Excel", "कार्य अनुभव", "डेटा विश्लेषक, उदाहरण एनालिटिक्स"],
}


def _scanned_pdf(lines, folder: str, name: str) -> str:
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.insert_htmlbox(pymupdf.Rect(40, 40, 555, 800), "".join(f"<p>{l}</p>" for l in lines), css="body{font-size:14px}")
    scan = pymupdf.open()
    out = scan.new_page(width=595, height=842)
    out.insert_image(out.rect, pixmap=page.get_pixmap(dpi=200))
    path = os.path.join(folder, name)
    scan.save(path)
    return path


def main() -> int:
    st = ocr.status()
    report = {"status": st, "documents": {}}
    ok = st["available"] and not st["missing"]
    with tempfile.TemporaryDirectory() as folder:
        for lang, lines in CHECKS.items():
            document = read_document(_scanned_pdf(lines, folder, f"{lang}.pdf"), ".pdf")
            found = [l for l in lines if l in document.lines]
            report["documents"][lang] = {
                "textSource": document.text_source,
                "linesFound": f"{len(found)}/{len(lines)}",
                "meanConfidence": (document.ocr or {}).get("meanConfidence"),
            }
            ok = ok and document.text_source == "ocr" and len(found) >= len(lines) - 1
    report["ok"] = ok
    print(json.dumps(report, ensure_ascii=False))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
