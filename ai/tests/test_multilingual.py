"""
Multilingual resume analysis (E5, X1): declared languages only, detection that refuses what is not
supported, normalised fields with provenance, honest handling of scanned and damaged PDFs, and a
reproducible per-language, per-layout evaluation on the labelled set.
"""
import io

import pymupdf
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.multilingual.detect import detect_language
from app.multilingual.document import assess_text_quality, from_text, read_document
from app.multilingual.evaluation import evaluate
from app.multilingual.extract import date_range, extract, find_dates, heading_of

EN = "Data analyst with experience in reporting and the automation of dashboards for the operations team. I worked on data quality and the weekly reports for the business and the finance team with my colleagues."
ES = "Analista de datos con experiencia en la creación de informes y en la automatización de procesos para el equipo de ventas. Trabajé en la calidad de los datos y en los informes semanales para la empresa."
HI = "मैं एक डेटा विश्लेषक हूँ और मुझे रिपोर्ट तैयार करने का अनुभव है। मैंने टीम के लिए साप्ताहिक रिपोर्ट को स्वचालित किया और समय की बचत की। मैं Python और SQL का उपयोग करता हूँ और डेटा से जानकारी निकालता हूँ।"
FR = "Analyste de données avec une expérience dans la création de rapports et le suivi des tableaux de bord pour les équipes de la direction et des ventes dans une entreprise de services."
MR = "मी एक डेटा विश्लेषक आहे आणि मला अहवाल तयार करण्याचा अनुभव आहे. मी संघाच्या साप्ताहिक अहवालांचे स्वयंचलन केले आणि वेळ वाचवला. मी Python आणि SQL चा वापर करतो आणि डेटा मध्ये काम केले आहे."
TA = "நான் ஒரு தரவு பகுப்பாய்வாளர். அறிக்கைகளைத் தயாரிப்பதில் எனக்கு அனுபவம் உள்ளது. நான் குழுவுக்காக வாராந்திர அறிக்கைகளை தானியக்கமாக்கினேன் மற்றும் நேரத்தை மிச்சப்படுத்தினேன். தரவு பகுப்பாய்வு செய்கிறேன்."


def test_detection_supported_and_refused():
    assert detect_language(EN)["language"] == "en"
    assert detect_language(ES)["language"] == "es"
    hi = detect_language(HI)
    assert hi["language"] == "hi" and hi["supported"] and hi["mixed"] is False
    fr = detect_language(FR)
    assert fr["supported"] is False and fr["language"] == "fr" and "French" in fr["message"]
    mr = detect_language(MR)
    assert mr["supported"] is False and mr["language"] == "mr", "Marathi shares the script but is not claimed"
    ta = detect_language(TA)
    assert ta["status"] == "unsupported_script" and "Tamil" in ta["message"]
    short = detect_language("Python SQL")
    assert short["status"] == "too_little_text" and short["supported"] is False


def test_headings_dates_and_contacts_normalised():
    assert heading_of("कार्य अनुभव")[:2] == ("experience", "hi")
    assert heading_of("Formación académica")[:2] == ("education", "es")
    assert heading_of("FORMACION ACADEMICA:")[:2] == ("education", "es"), "case, accents-free spelling and colon"
    assert heading_of("कौशल: Python, SQL") == ("skills", "hi", "Python, SQL"), "inline heading keeps its content"
    assert heading_of("Experience with Python") is None, "a sentence is not a heading"
    assert date_range("जनवरी २०२१ से वर्तमान तक") == {"start": "2021-01", "end": "present"}, "Devanagari digits and months"
    assert date_range("junio de 2020 a diciembre de 2020") == {"start": "2020-06", "end": "2020-12"}
    assert date_range("06/2020 to 12/2020") == {"start": "2020-06", "end": "2020-12"}
    assert date_range("mar 2019 - ago 2023") == {"start": "2019-03", "end": "2023-08"}
    assert date_range("Graduated in 2018") is None
    assert [v for _, v in find_dates("Sept 2019 – actualidad")] == ["2019-09", "present"]

    text = "\n".join(["Contacto", "lucia@example.com", "Teléfono: 699 112 233", "Experiencia", "Analista, Ejemplo", "enero 2021 - actualidad", ES])
    result = extract(from_text(text))
    fields = result["fields"]
    assert fields["email"]["value"] == "lucia@example.com"
    assert fields["phone"]["value"] == "699112233"
    assert fields["experience"] == [{"start": "2021-01", "end": "present", "context": "Analista, Ejemplo", "source": {"line": 5, "text": "enero 2021 - actualidad"}}]
    # Provenance: every source line is the original text
    for value in [fields["email"], fields["phone"], *fields["experience"], *fields["skills"]]:
        assert result["originalLines"][value["source"]["line"]] == value["source"]["text"]


def test_skills_in_any_script_without_translation_services():
    result = extract(from_text("कौशल\nपायथन, एसक्यूएल और सांख्यिकी\n" + HI))
    names = {s["name"] for s in result["fields"]["skills"]}
    assert {"Python", "SQL", "Statistics"} <= names
    es = extract(from_text("Habilidades\nEstadística y análisis de datos con Excel\n" + ES))
    assert {"Statistics", "Data Analysis", "Excel"} <= {s["name"] for s in es["fields"]["skills"]}


def test_unsupported_language_is_refused_not_guessed():
    result = extract(from_text(FR + "\nCompétences\nPython, SQL"))
    assert result["status"] == "unsupported"
    assert result["fields"]["skills"] == [] and result["sections"] == []
    assert any("French" in w for w in result["warnings"])


def test_damaged_devanagari_text_layer_is_flagged():
    garbled = ["काǺय अनुभव", "सॉ÷टवेयर इंजीन", "ȡ यर, उदाहरण ĵाइवेट ल", "जनवरी २०२० से माǺच २०२२ तक"]
    quality, warnings = assess_text_quality(garbled)
    assert quality == "degraded" and "DOCX" in warnings[0]
    assert assess_text_quality(["कार्य अनुभव", "सॉफ्टवेयर इंजीनियर", HI])[0] == "ok"


def test_scanned_pdf_is_reported_not_read(tmp_path):
    doc = pymupdf.open()
    page = doc.new_page()
    pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, 200, 100), False)
    pix.clear_with(200)
    page.insert_image(pymupdf.Rect(50, 50, 450, 250), pixmap=pix)
    path = tmp_path / "scan.pdf"
    doc.save(str(path))
    document = read_document(str(path), ".pdf")
    assert document.scanned_pages == 1 and "no OCR" in document.warnings[0]
    assert extract(document)["status"] == "scanned_unreadable"


def test_evaluation_is_reproducible_and_reported_per_language_and_layout():
    first = evaluate()
    second = evaluate()
    assert first["summary"] == second["summary"], "the evaluation is deterministic"
    summary = first["summary"]
    assert set(summary) == {f"{lang}/{layout}" for lang in ("en", "es", "hi") for layout in ("pdf_single_column", "pdf_two_column", "docx_table")}
    for key, metrics in summary.items():
        assert metrics["language"] == 1.0, f"{key}: language detected"
    for key in ("en/pdf_single_column", "en/pdf_two_column", "en/docx_table", "es/pdf_single_column", "es/pdf_two_column", "es/docx_table", "hi/docx_table"):
        for metric, value in summary[key].items():
            if metric in ("degradedTextLayer", "documents"):
                continue
            assert value >= 0.95, f"{key} {metric} = {value}"
    # Hindi PDFs with shaped text: the damage must always be detected and reported
    for key in ("hi/pdf_single_column", "hi/pdf_two_column"):
        assert summary[key]["degradedTextLayer"] == summary[key]["documents"]
    rows = {(r["id"], r["layout"]): r for r in first["rows"]}
    assert all(rows[(rid, "pdf_two_column")]["detectedLayout"] == "two_column" for rid in ("en-1", "es-1", "hi-1")), "two-column layout detected"


@pytest.fixture
def raw_client():
    return TestClient(app)


def test_endpoint_requires_internal_key_and_validates(raw_client, service_headers):
    files = {"file": ("cv.txt", io.BytesIO(("Experience\nAnalyst, Example\nJanuary 2021 - Present\n" + EN).encode()), "text/plain")}
    assert raw_client.post("/api/v1/multilingual/analyze", files=files).status_code in (401, 403)
    files["file"][1].seek(0)
    res = raw_client.post("/api/v1/multilingual/analyze", files=files, headers=service_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["language"]["language"] == "en" and data["fields"]["experience"][0]["start"] == "2021-01"
    bad = {"file": ("cv.exe", io.BytesIO(b"MZ..."), "application/octet-stream")}
    assert raw_client.post("/api/v1/multilingual/analyze", files=bad, headers=service_headers).status_code == 400
    fake_pdf = {"file": ("cv.pdf", io.BytesIO(b"not a pdf at all"), "application/pdf")}
    assert raw_client.post("/api/v1/multilingual/analyze", files=fake_pdf, headers=service_headers).status_code == 415
    text = raw_client.post("/api/v1/multilingual/analyze-text", json={"text": ES}, headers=service_headers)
    assert text.json()["data"]["language"]["language"] == "es"
    langs = raw_client.get("/api/v1/multilingual/languages", headers=service_headers).json()["data"]["supported"]
    assert [l["code"] for l in langs] == ["en", "hi", "es"]
