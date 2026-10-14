"""
Multilingual resume analysis (E5, X1): declared languages only, detection that refuses what is not
supported, normalised fields with provenance, honest handling of scanned and damaged PDFs, and a
reproducible per-language, per-layout evaluation on the labelled set.
"""
import io

import pymupdf

from app.multilingual import ocr
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


def test_devanagari_words_keep_their_vowel_signs():
    # Vowel signs and the virama are combining marks; splitting words at them turned "वर्मा" into
    # "वर" + "म" and "से" into "स", so Hindi function words went uncounted and fragments such as
    # "व" were counted as Marathi markers. This SYNTHETIC Hindi resume was refused as Marathi.
    from app.multilingual.detect import WORD
    assert WORD.findall("रिया वर्मा से वर्तमान कौशल") == ["रिया", "वर्मा", "से", "वर्तमान", "कौशल"]
    text = chr(10).join([
        "रिया वर्मा",
        "कार्य अनुभव",
        "डेटा विश्लेषक, उदाहरण एनालिटिक्स — जून 2023 से वर्तमान",
        "बिक्री डैशबोर्ड बनाए और SQL तथा Excel से रिपोर्ट तैयार कीं।",
        "शिक्षा",
        "बी.एससी. सांख्यिकी, उदाहरण विश्वविद्यालय, 2022",
        "कौशल",
        "SQL, Excel, Python, Power BI, सांख्यिकी",
    ])
    result = detect_language(text)
    assert result["language"] == "hi" and result["supported"], result
    assert result["evidence"]["hi"] > result["evidence"]["mr"]


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
    # A blank image has nothing to read: with OCR it says so, without OCR it says OCR is missing
    expected = "OCR found no readable text" if ocr.status()["available"] else "OCR is not available"
    assert document.scanned_pages == 1 and expected in document.warnings[0], document.warnings
    assert extract(document)["status"] == "scanned_unreadable"


def test_evaluation_is_reproducible_and_reported_per_language_and_layout():
    ocr_available = ocr.status()["available"]
    first = evaluate()
    second = evaluate()
    assert first["summary"] == second["summary"], "the evaluation is deterministic"
    summary = first["summary"]
    layouts = ("pdf_single_column", "pdf_two_column", "pdf_single_column_subset", "pdf_single_column_sans", "pdf_scanned", "pdf_scanned_noisy", "docx_table")
    assert set(summary) == {f"{lang}/{layout}" for lang in ("en", "es", "hi") for layout in layouts}
    text_layer = ("pdf_single_column", "pdf_two_column", "pdf_single_column_sans", "docx_table")

    def at_least(key, threshold, skip=()):
        for metric, value in summary[key].items():
            if metric in ("degradedTextLayer", "documents", "readByOcr") or metric in skip:
                continue
            assert value >= threshold, f"{key} {metric} = {value}"

    # Clean text layers: read directly, never by OCR, in all three languages
    for lang in ("en", "es", "hi"):
        for layout in text_layer:
            key = f"{lang}/{layout}"
            assert summary[key]["degradedTextLayer"] == 0 and summary[key]["readByOcr"] == 0, f"{key}: clean text, no OCR"
            at_least(key, 0.95)
    for lang in ("en", "es"):
        assert summary[f"{lang}/pdf_single_column_subset"]["readByOcr"] == 0, "Latin subset fonts keep their text layer"
        at_least(f"{lang}/pdf_single_column_subset", 0.95)

    if ocr_available:
        # Hindi subset fonts: the damaged text layer falls back to OCR and reads correctly
        assert summary["hi/pdf_single_column_subset"]["readByOcr"] == summary["hi/pdf_single_column_subset"]["documents"]
        at_least("hi/pdf_single_column_subset", 0.95)
        # Scans of English and Hindi resumes; the noisy scan loses a little skill recall in Hindi
        for lang in ("en", "hi"):
            assert summary[f"{lang}/pdf_scanned"]["readByOcr"] == summary[f"{lang}/pdf_scanned"]["documents"]
            at_least(f"{lang}/pdf_scanned", 0.95)
            at_least(f"{lang}/pdf_scanned_noisy", 0.85)
        # Spanish scans: no Spanish OCR data is installed, so accented headings are misread.
        # Language, contact details and skills hold; sections and education are measured, not promised.
        es = summary["es/pdf_scanned"]
        assert es["language"] == 1.0 and es["email"] == 1.0 and es["phone"] == 1.0 and es["skills_recall"] >= 0.95
        assert es["education_recall"] < 0.95, "if Spanish scans improve, update the documented accuracy"
    else:
        # Without OCR the damage and the scans are reported, never passed off as clean
        hi_subset = summary["hi/pdf_single_column_subset"]
        assert hi_subset["degradedTextLayer"] == hi_subset["documents"]
        assert all(r["status"] == "scanned_unreadable" for r in first["rows"] if r["layout"].startswith("pdf_scanned"))
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


def test_devanagari_glyphs_are_recovered_from_the_embedded_font(tmp_path):
    """Shaped conjuncts, reph and half forms that the text layer leaves unmapped come back exactly."""
    from app.multilingual.evaluation import render
    resume = {"id": "glyphs", "side": ["संपर्क"], "main": ["राहुल वर्मा", "मैं रिपोर्ट तैयार करता हूँ", "कार्य अनुभव", "विश्वविद्यालय"]}
    path = render(resume, "pdf_single_column", str(tmp_path))
    plain = "\n".join(page.get_text() for page in pymupdf.open(path))
    assert "वर्मा" not in plain, "PyMuPDF's own text is garbled for this PDF (otherwise this test proves nothing)"
    document = read_document(path, ".pdf")
    assert document.lines == ["राहुल वर्मा", "संपर्क", "मैं रिपोर्ट तैयार करता हूँ", "कार्य अनुभव", "विश्वविद्यालय"]
    assert document.glyphs_recovered > 0 and document.glyphs_unrecovered == 0
    assert document.text_quality == "ok"
    assert any("recovered from the embedded font" in w for w in document.warnings), "the recovery is disclosed"
