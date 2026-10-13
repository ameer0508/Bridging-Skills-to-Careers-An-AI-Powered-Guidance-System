"""
Reproducible accuracy evaluation of multilingual extraction (E5, X1).

Renders every labelled resume in tests/fixtures/multilingual/labelled_resumes.json in three
layouts, runs the same reader and extractor the API uses, and scores each field against its
labels. Results are reported per language and per layout, never as one blended number.

    python -m app.multilingual.evaluation            # prints the table and writes JSON

The resumes are synthetic. These figures measure behaviour on controlled documents, not accuracy
on real-world resumes.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
from collections import defaultdict
from typing import Dict, List

import docx
import pymupdf

from .document import read_document
from .extract import METHOD_VERSION, extract

HERE = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DATASET = os.path.join(AI_ROOT, "tests", "fixtures", "multilingual", "labelled_resumes.json")
FONT = os.path.join(AI_ROOT, "tests", "fixtures", "fonts", "NotoSansDevanagari-Regular.ttf")
# pdf_single_column_subset embeds subset fonts, as most PDF exporters do; subsetting drops the
# font tables that Devanagari glyph recovery needs, so it measures that common case separately.
# pdf_single_column_sans uses the bundled Noto Sans Devanagari (TrueType) instead of MuPDF's built-in
# Noto Serif Devanagari (CFF), so glyph recovery is measured on two different fonts.
# pdf_scanned is an image-only PDF (the single-column page rasterised at 200 dpi, as a scanner
# produces): it has no text layer, so only OCR can read it (X1).
# pdf_scanned_noisy is a harder scan: 150 dpi greyscale, rotated 1 degree, with noise and JPEG artefacts.
LAYOUTS = ["pdf_single_column", "pdf_two_column", "pdf_single_column_subset", "pdf_single_column_sans", "pdf_scanned", "pdf_scanned_noisy", "docx_table"]


def _html(lines: List[str]) -> str:
    return "".join(f"<p>{l}</p>" for l in lines)


def _css(bundled_first: bool = False) -> str:
    families = "deva, sans-serif" if bundled_first else "sans-serif, deva"
    return "@font-face {font-family: deva; src: url(NotoSansDevanagari-Regular.ttf);} body {font-family: " + families + "; font-size: 10px;} p {margin: 0 0 4px 0;}"


def _as_scan(doc, noisy: bool = False):
    """An image-only copy of the document, no text layer. Plain: each page at 200 dpi. Noisy: 150 dpi
    greyscale, rotated 1 degree, Gaussian noise and JPEG compression, closer to a phone or office scan.
    The noise is seeded, so the evaluation stays reproducible."""
    scan = pymupdf.open()
    for page in doc:
        out = scan.new_page(width=page.rect.width, height=page.rect.height)
        if not noisy:
            out.insert_image(out.rect, pixmap=page.get_pixmap(dpi=200))
            continue
        import io
        import numpy as np
        from PIL import Image
        pix = page.get_pixmap(dpi=150, colorspace=pymupdf.csGRAY)
        img = Image.frombytes("L", (pix.width, pix.height), pix.samples).rotate(1.0, fillcolor=255, expand=False)
        arr = np.asarray(img, dtype=np.float32) + np.random.default_rng(7).normal(0, 12, (img.height, img.width))
        img = Image.fromarray(np.clip(arr, 0, 255).astype("uint8"))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=60)
        out.insert_image(out.rect, stream=buf.getvalue())
    return scan


def render(resume: dict, layout: str, folder: str) -> str:
    """Writes the resume in the given layout and returns the file path."""
    side, main = resume["side"], resume["main"]
    if layout.startswith("pdf"):
        doc = pymupdf.open()
        page = doc.new_page(width=595, height=842)
        archive = pymupdf.Archive(os.path.dirname(FONT))
        if layout in ("pdf_single_column", "pdf_single_column_subset", "pdf_single_column_sans", "pdf_scanned", "pdf_scanned_noisy"):
            page.insert_htmlbox(pymupdf.Rect(40, 40, 555, 800), _html(main[:1] + side + main[1:]), css=_css(layout == "pdf_single_column_sans"), archive=archive)
        else:
            page.insert_htmlbox(pymupdf.Rect(30, 40, 200, 800), _html(side), css=_css(), archive=archive)
            page.insert_htmlbox(pymupdf.Rect(260, 40, 565, 800), _html(main), css=_css(), archive=archive)
        if layout == "pdf_single_column_subset":
            doc.subset_fonts()
        if layout == "pdf_scanned":
            doc = _as_scan(doc)
        if layout == "pdf_scanned_noisy":
            doc = _as_scan(doc, noisy=True)
        path = os.path.join(folder, f"{resume['id']}-{layout}.pdf")
        doc.save(path, garbage=3, deflate=True)
        return path
    d = docx.Document()
    table = d.add_table(rows=1, cols=2)
    for cell, lines in zip(table.rows[0].cells, (side, main)):
        cell.paragraphs[0].text = lines[0]
        for line in lines[1:]:
            cell.add_paragraph(line)
    path = os.path.join(folder, f"{resume['id']}-{layout}.docx")
    d.save(path)
    return path


def _ratio(hit: int, total: int):
    return None if total == 0 else hit / total


def score(result: dict, labels: dict, language: str) -> Dict[str, float]:
    fields = result["fields"]
    sections = {s["key"] for s in result["sections"]}
    exp_found = {(e["start"], e["end"]) for e in fields["experience"]}
    exp_expected = {tuple(x) for x in labels["experience"]}
    edu_found = {e["year"] for e in fields["education"]}
    skills_found = {s["name"] for s in fields["skills"]}
    skills_expected = set(labels["skills"])
    return {
        "language": 1.0 if result["language"].get("language") == language else 0.0,
        "sections_recall": _ratio(len(sections & set(labels["sections"])), len(labels["sections"])),
        "email": 1.0 if (fields["email"] or {}).get("value") == labels["email"] else 0.0,
        "phone": 1.0 if (fields["phone"] or {}).get("value") == labels["phone"] else 0.0,
        "experience_recall": _ratio(len(exp_found & exp_expected), len(exp_expected)),
        "experience_precision": _ratio(len(exp_found & exp_expected), len(exp_found)) if exp_found else 0.0,
        "education_recall": _ratio(len(edu_found & set(labels["education"])), len(labels["education"])),
        "skills_recall": _ratio(len(skills_found & skills_expected), len(skills_expected)),
        "skills_precision": _ratio(len(skills_found & skills_expected), len(skills_found)) if skills_found else 0.0,
    }


def evaluate() -> dict:
    with open(DATASET, encoding="utf-8") as fh:
        dataset = json.load(fh)
    rows = []
    with tempfile.TemporaryDirectory() as folder:
        for resume in dataset["resumes"]:
            for layout in LAYOUTS:
                path = render(resume, layout, folder)
                document = read_document(path, os.path.splitext(path)[1])
                result = extract(document)
                rows.append({
                    "id": resume["id"],
                    "language": resume["language"],
                    "layout": layout,
                    "detectedLayout": result["layout"]["type"],
                    "textQuality": result["textQuality"],
                    "textSource": result["textSource"],
                    "ocrConfidence": (result["ocr"] or {}).get("meanConfidence"),
                    "status": result["status"],
                    "scores": score(result, resume["labels"], resume["language"]),
                    "missedSkills": sorted(set(resume["labels"]["skills"]) - {s["name"] for s in result["fields"]["skills"]}),
                    "extraSkills": sorted({s["name"] for s in result["fields"]["skills"]} - set(resume["labels"]["skills"])),
                })
    groups: Dict[str, List[dict]] = defaultdict(list)
    for row in rows:
        groups[f"{row['language']}/{row['layout']}"].append(row)
    summary = {}
    for key, members in sorted(groups.items()):
        metrics = {}
        for metric in members[0]["scores"]:
            values = [m["scores"][metric] for m in members if m["scores"][metric] is not None]
            metrics[metric] = round(sum(values) / len(values), 3) if values else None
        metrics["degradedTextLayer"] = sum(1 for m in members if m["textQuality"] == "degraded")
        metrics["readByOcr"] = sum(1 for m in members if m["textSource"] != "text_layer")
        metrics["documents"] = len(members)
        summary[key] = metrics
    return {"method": METHOD_VERSION, "datasetVersion": dataset["version"], "documents": len(rows), "summary": summary, "rows": rows}


SCRIPT_DATASET = os.path.join(AI_ROOT, "tests", "fixtures", "multilingual", "script_samples.json")
SCRIPT_LAYOUTS = ["pdf_single_column", "pdf_scanned", "pdf_scanned_noisy"]


def _normalise(text: str) -> str:
    import unicodedata
    return unicodedata.normalize("NFC", text).replace("‌", "").replace("‍", "")


def _char_accuracy(expected: str, got: str) -> float:
    """1 - character error rate (Levenshtein distance / expected length), floored at 0."""
    a, b = _normalise(expected), _normalise(got)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return round(max(0.0, 1 - prev[-1] / max(1, len(a))), 3)


def evaluate_scripts() -> dict:
    """Scripts SkillBridge can OCR but does not extract: each must be refused as unsupported (never
    read as English). OCR character accuracy is reported for information, not as support."""
    with open(SCRIPT_DATASET, encoding="utf-8") as fh:
        dataset = json.load(fh)
    rows = []
    with tempfile.TemporaryDirectory() as folder:
        for sample in dataset["samples"]:
            resume = {"id": sample["id"], "side": [], "main": sample["lines"]}
            for layout in SCRIPT_LAYOUTS:
                path = render(resume, layout, folder)
                document = read_document(path, ".pdf")
                result = extract(document)
                rows.append({
                    "id": sample["id"],
                    "script": sample["script"],
                    "layout": layout,
                    "status": result["status"],
                    "languageStatus": result["language"].get("status"),
                    "detected": result["language"].get("language"),
                    "textSource": result["textSource"],
                    "ocrConfidence": (result["ocr"] or {}).get("meanConfidence"),
                    "charAccuracy": _char_accuracy("\n".join(sample["lines"]), "\n".join(document.lines)),
                    "fieldsExtracted": sum(len(v) if isinstance(v, list) else int(v is not None) for v in result["fields"].values()),
                })
    return {"datasetVersion": dataset["version"], "rows": rows}


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    report = evaluate()
    metrics = ["language", "sections_recall", "email", "phone", "experience_recall", "experience_precision", "education_recall", "skills_recall", "skills_precision"]
    print("group".ljust(26) + " ".join(m[:12].rjust(12) for m in metrics) + "  degraded")
    for key, values in report["summary"].items():
        print(key.ljust(26) + " ".join(("—" if values[m] is None else f"{values[m]:.2f}").rjust(12) for m in metrics) + f"  {values['degradedTextLayer']}/{values['documents']}  ocr {values['readByOcr']}")
    scripts = evaluate_scripts()
    print("\nscript/layout".ljust(30) + "status".rjust(14) + "textSource".rjust(12) + "ocrConf".rjust(9) + "charAcc".rjust(9))
    for row in scripts["rows"]:
        print(f"{row['script']}/{row['layout']}".ljust(30) + str(row["status"]).rjust(14) + str(row["textSource"]).rjust(12) + str(row["ocrConfidence"]).rjust(9) + str(row["charAccuracy"]).rjust(9))
    report["scripts"] = scripts
    out = os.environ.get("MULTILINGUAL_EVAL_OUT")
    if out:
        with open(out, "w", encoding="utf-8") as fh:
            json.dump(report, fh, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
