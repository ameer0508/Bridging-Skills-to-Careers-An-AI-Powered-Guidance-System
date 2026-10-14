"""
Generates the SYNTHETIC demo documents used in docs/DEMO_SCRIPT.md. Every person, employer and
detail in them is invented; each file says "SYNTHETIC DEMO DATA".

Run from the repository root with the AI service's Python (it has PyMuPDF and python-docx):
    ai/.venv/Scripts/python demo/make_demo_documents.py
"""
from __future__ import annotations

import pathlib

import pymupdf
from docx import Document

OUT = pathlib.Path(__file__).resolve().parent / "documents"
OUT.mkdir(exist_ok=True)

STUDENT = [
    "Aarav Sharma (SYNTHETIC DEMO DATA)",
    "Email: aarav.sharma.demo@example.com",
    "",
    "Summary:",
    "Final-year B.Tech student aiming for a Data Analyst role.",
    "",
    "Experience:",
    "Data Analyst Intern at Example Retail Pvt Ltd (2025-2026)",
    "Built weekly sales dashboards in Excel and Power BI and wrote SQL queries against the sales warehouse.",
    "Cleaned survey data with Python and Pandas and presented the findings to the regional team.",
    "",
    "Projects:",
    "Campus Canteen Demand",
    "Forecasted daily demand with Python, Pandas and scikit-learn; code tracked with Git.",
    "",
    "Education:",
    "B.Tech, Computer Science, Example Institute of Technology (2022-2026)",
    "",
    "Skills:",
    "SQL, Excel, Power BI, Python, Pandas, Statistics, Git, Communication",
]

SECOND_STUDENT = [
    "Meera Iyer (SYNTHETIC DEMO DATA)",
    "Email: meera.iyer.demo@example.com",
    "",
    "Experience:",
    "Frontend Developer Intern at Example Web Studio (2025)",
    "Built responsive pages with React, JavaScript, HTML and CSS; wrote unit tests with Jest.",
    "",
    "Projects:",
    "Library Booking App",
    "React front end with a Node.js and Express REST API, deployed with Docker; tracked with Git.",
    "",
    "Skills:",
    "React, JavaScript, TypeScript, HTML, CSS, Node.js, Express, Docker, Git",
]

HINDI = [
    "रिया वर्मा (SYNTHETIC DEMO DATA)",
    "ईमेल: riya.verma.demo@example.com",
    "फ़ोन: +91 98765 43210",
    "",
    "कार्य अनुभव",
    "डेटा विश्लेषक, उदाहरण एनालिटिक्स — जून 2023 से वर्तमान",
    "बिक्री डैशबोर्ड बनाए और SQL तथा Excel से रिपोर्ट तैयार कीं।",
    "",
    "शिक्षा",
    "बी.एससी. सांख्यिकी, उदाहरण विश्वविद्यालय, 2022",
    "",
    "कौशल",
    "SQL, Excel, Python, Power BI, सांख्यिकी",
]


def text_pdf(lines: list[str], path: pathlib.Path) -> None:
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    page.insert_htmlbox(pymupdf.Rect(48, 48, 547, 800), "".join(f"<p>{line or '&nbsp;'}</p>" for line in lines), css="body{font-size:11px;font-family:sans-serif}")
    doc.set_metadata({"title": "SYNTHETIC DEMO DATA", "author": "SkillBridge demo generator"})
    doc.save(str(path))


def scanned_pdf(lines: list[str], path: pathlib.Path) -> None:
    """The same page rendered to an image only: no text layer, so OCR is needed."""
    source = pymupdf.open()
    page = source.new_page(width=595, height=842)
    page.insert_htmlbox(pymupdf.Rect(48, 48, 547, 800), "".join(f"<p>{line or '&nbsp;'}</p>" for line in lines), css="body{font-size:13px;font-family:sans-serif}")
    scan = pymupdf.open()
    out = scan.new_page(width=595, height=842)
    # Greyscale JPEG keeps the file well under the 5 MB upload limit
    pixmap = page.get_pixmap(dpi=150, colorspace=pymupdf.csGRAY)
    out.insert_image(out.rect, stream=pixmap.tobytes("jpeg", jpg_quality=75))
    scan.save(str(path))


def docx(lines: list[str], path: pathlib.Path) -> None:
    document = Document()
    for line in lines:
        document.add_paragraph(line)
    document.core_properties.title = "SYNTHETIC DEMO DATA"
    document.save(str(path))


text_pdf(STUDENT, OUT / "aarav-sharma-data-analyst-SYNTHETIC.pdf")
docx(SECOND_STUDENT, OUT / "meera-iyer-frontend-SYNTHETIC.docx")
docx(HINDI, OUT / "riya-verma-hindi-SYNTHETIC.docx")
scanned_pdf(STUDENT, OUT / "aarav-sharma-scanned-SYNTHETIC.pdf")
(OUT / "not-a-resume-SYNTHETIC.txt").write_text("This file is not a resume. SYNTHETIC DEMO DATA.\n", encoding="utf-8")
print("\n".join(sorted(p.name for p in OUT.iterdir())))
