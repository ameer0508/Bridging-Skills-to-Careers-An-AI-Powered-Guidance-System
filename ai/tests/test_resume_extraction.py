"""
Accuracy tests for resume extraction, using synthetic resumes in TXT, PDF and DOCX form
with different layouts and missing sections.

Scope of what is verified here: English, single-column, text-based documents.
Scanned/image PDFs, multi-column layouts and other languages are NOT covered.
"""
import io

import pytest

from app.resume_intelligence.skill_lexicon import get_lexicon

# --- Fixtures -----------------------------------------------------------------------

STANDARD = """Priya Sharma
priya.sharma@example.com | +91 98765 43210
https://github.com/priyasharma | linkedin.com/in/priya-sharma

Summary
Final-year computer science student building full stack web applications.

Skills
JavaScript, TypeScript, React, Node.js, Express, MongoDB, PostgreSQL, Python, Docker, Git, AWS

Experience
Software Engineering Intern at Example Technologies (Jun 2025 - Aug 2025)
Built REST APIs with Node.js and Express backed by MongoDB.
Developed dashboards in React and TypeScript.

Projects
Campus Marketplace
Full stack marketplace using React, Node.js and PostgreSQL, deployed with Docker on AWS.

Education
B.Tech in Computer Science, Example Institute of Technology, 2026
"""

# Two-line job headers, bullet characters, several jobs without blank lines between them
MULTI_JOB = """Arjun Mehta
arjun.mehta@example.com

WORK EXPERIENCE
Backend Developer
Northwind Systems | Jan 2023 – Present
• Designed PostgreSQL schemas and wrote SQL for reporting.
• Containerised services with Docker and deployed them on Kubernetes.
Junior Developer
Acme Labs | Jul 2021 – Dec 2022
• Maintained a Java Spring Boot service.
• Wrote unit testing suites with JUnit.

EDUCATION
B.E. Information Technology, City Engineering College, 2021

TECHNICAL SKILLS
Java, SQL, Docker, Kubernetes, Git
"""

# Inline headings and punctuation-sensitive names
INLINE = """Neha Rao
neha.rao@example.com
Languages: English, Hindi
Skills: C, C++, C#, Java, JavaScript, Go, R, .NET
Education: B.Sc Computer Science, Lakeside University, 2024
"""

# No headings at all; the only mention of GitHub is a profile link
NO_HEADINGS = """Sam Lee
sam.lee@example.com
github.com/samlee
I build data pipelines in Python and analyse results with Pandas and SQL.
I enjoy javascript side projects.
"""

# Only JavaScript family skills: Java must not be reported
JS_ONLY = """Dana Cruz
dana@example.com

Skills
JavaScript, TypeScript, React Native

Projects
Budget App
Mobile app written in React Native with TypeScript. JavaScript, JavaScript, JavaScript.
"""


def _post(client, filename, content, content_type="application/octet-stream"):
    res = client.post("/api/v1/extract", files={"file": (filename, io.BytesIO(content), content_type)})
    assert res.status_code == 200, res.text
    return res.json()["data"]


def _txt(client, text):
    return _post(client, "resume.txt", text.encode("utf-8"), "text/plain")


def _names(data):
    return [s["name"] for s in data["skills"]]


def _pdf_bytes(text):
    pymupdf = pytest.importorskip("pymupdf")
    document = pymupdf.open()
    page = document.new_page()
    page.insert_text((50, 60), text, fontsize=10)
    return document.tobytes()


def _docx_bytes(text, skills_table=None):
    docx = pytest.importorskip("docx")
    document = docx.Document()
    for line in text.splitlines():
        document.add_paragraph(line)
    if skills_table:
        table = document.add_table(rows=1, cols=len(skills_table))
        for cell, value in zip(table.rows[0].cells, skills_table):
            cell.text = value
    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


# --- Lexicon matcher ----------------------------------------------------------------


@pytest.mark.parametrize(
    "text, expected",
    [
        ("Skills: Java, Spring Boot", ["Java", "Spring Boot"]),
        ("Skills: JavaScript and TypeScript", ["JavaScript", "TypeScript"]),
        ("Worked with C++ and C# daily", ["C++", "C#"]),
        ("Languages: C, C++, Python", ["C", "C++", "Python"]),
        ("React Native developer", ["React Native"]),
        ("SQL Server administration", ["SQL Server"]),
        ("Used PostgreSQL and MySQL", ["PostgreSQL", "MySQL"]),
        ("node js, reactjs, k8s", ["Node.js", "React", "Kubernetes"]),
        ("Built RESTful APIs", ["REST APIs"]),
    ],
)
def test_term_matching(text, expected):
    assert [s.name for s in get_lexicon().find_skills(text)] == expected


@pytest.mark.parametrize(
    "text",
    [
        "Visit https://github.com/jane and gitlab.com/jane",  # links are not skills
        "Contact: jane@docker.example.com",
        "I express my interest in this exciting role",  # ordinary words
        "Let us go to market swiftly with a rusty spark of excellence",
        "Conducted R&D on packaging; scored grade C in chemistry",  # stray single letters
        "Experienced with typescripting, reactive design and pythonic habits",  # substrings of skill names
    ],
)
def test_no_false_positives(text):
    assert get_lexicon().find_skills(text) == []


def test_repeated_mentions_are_reported_once():
    found = get_lexicon().find_skills("Python python PYTHON Python3 python")
    assert [s.name for s in found] == ["Python"]


# --- Whole-document extraction --------------------------------------------------------


def test_standard_resume_txt(client):
    data = _txt(client, STANDARD)
    names = _names(data)

    assert data["personalInfo"]["fullName"]["value"] == "Priya Sharma"
    assert data["personalInfo"]["email"]["value"] == "priya.sharma@example.com"
    # Profile links are captured as links, never as skills
    assert "github.com/priyasharma" in data["personalInfo"]["github"]["value"]
    assert "GitHub" not in names

    assert set(names) == {
        "JavaScript", "TypeScript", "React", "Node.js", "Express.js", "MongoDB",
        "PostgreSQL", "Python", "Docker", "Git", "AWS", "REST APIs",
    }
    assert len(names) == len(set(names)), "each skill is listed once"

    assert len(data["experience"]) == 1
    job = data["experience"][0]
    assert job["role"]["value"] == "Software Engineering Intern"
    assert job["company"]["value"] == "Example Technologies"
    assert job["duration"]["value"] == "Jun 2025 - Aug 2025"
    assert len(job["responsibilities"]) == 2

    assert len(data["projects"]) == 1
    project = data["projects"][0]
    assert project["name"]["value"] == "Campus Marketplace"
    assert {t["value"] for t in project["technologies"]} == {"React", "Node.js", "PostgreSQL", "Docker", "AWS"}

    assert data["education"][0]["degree"]["value"] == "B.Tech"


def test_multiple_jobs_with_two_line_headers(client):
    data = _txt(client, MULTI_JOB)
    jobs = data["experience"]
    assert [(j["role"]["value"], j["company"]["value"]) for j in jobs] == [
        ("Backend Developer", "Northwind Systems"),
        ("Junior Developer", "Acme Labs"),
    ]
    assert jobs[0]["duration"]["value"] == "Jan 2023 – Present"
    assert jobs[1]["duration"]["value"] == "Jul 2021 – Dec 2022"
    # Responsibilities stay with their own job
    assert any("Kubernetes" in r["value"] for r in jobs[0]["responsibilities"])
    assert all("Kubernetes" not in r["value"] for r in jobs[1]["responsibilities"])
    assert any("Spring Boot" in r["value"] for r in jobs[1]["responsibilities"])

    names = _names(data)
    for expected in ["Java", "SQL", "PostgreSQL", "Docker", "Kubernetes", "Git", "Spring Boot", "JUnit", "Testing"]:
        assert expected in names
    assert "JavaScript" not in names


def test_inline_headings_and_punctuation_sensitive_skills(client):
    data = _txt(client, INLINE)
    names = _names(data)
    assert names == ["C", "C++", "C#", "Java", "JavaScript", "Go", "R", "ASP.NET"]
    assert data["education"], "inline education heading is recognised"
    assert [language["value"] for language in data["languages"]] != []


def test_resume_without_headings_falls_back_to_whole_text(client):
    data = _txt(client, NO_HEADINGS)
    names = _names(data)
    assert set(names) == {"Python", "Pandas", "SQL", "JavaScript"}
    assert "GitHub" not in names, "a profile link is not a skill"
    assert data["experience"] == [] and data["projects"] == []


def test_java_is_not_inferred_from_javascript(client):
    names = _names(_txt(client, JS_ONLY))
    assert set(names) == {"JavaScript", "TypeScript", "React Native"}
    assert "Java" not in names
    assert "React" not in names, "React Native is not double-counted as React"


def test_missing_sections_are_empty_not_invented(client):
    data = _txt(client, "Alex Kim\nalex@example.com\n\nSkills\nFigma, Wireframing, Prototyping\n")
    assert _names(data) == ["Figma", "Wireframing", "Prototyping"]
    assert data["experience"] == []
    assert data["projects"] == []
    assert data["education"] == []
    assert data["certifications"] == []


def test_pdf_and_txt_extract_the_same_content(client):
    from_txt = _txt(client, STANDARD)
    from_pdf = _post(client, "resume.pdf", _pdf_bytes(STANDARD), "application/pdf")
    assert set(_names(from_pdf)) == set(_names(from_txt))
    assert from_pdf["personalInfo"]["fullName"]["value"] == "Priya Sharma"
    assert from_pdf["experience"][0]["company"]["value"] == "Example Technologies"
    assert "GitHub" not in _names(from_pdf)


def test_docx_including_skills_in_a_table(client):
    without_skills = STANDARD.replace(
        "JavaScript, TypeScript, React, Node.js, Express, MongoDB, PostgreSQL, Python, Docker, Git, AWS", ""
    )
    data = _post(
        client,
        "resume.docx",
        _docx_bytes(without_skills, skills_table=["Tableau", "Power BI", "Excel"]),
    )
    names = _names(data)
    for expected in ["Tableau", "Power BI", "Excel", "React", "Node.js"]:
        assert expected in names
    assert data["experience"][0]["role"]["value"] == "Software Engineering Intern"


def test_response_does_not_claim_a_transformer_model(client):
    res = client.post("/api/v1/extract", files={"file": ("resume.txt", io.BytesIO(STANDARD.encode()), "text/plain")})
    body = res.json()
    assert body["provider"] == "rule_based_parser"
    assert "transformer" not in body["model"]
