# Multilingual resumes and guidance (E5, X1)

**Branch:** `work/skillbridge-parallel-features` (Agent B). **Screen:** `/resume-language` ("Resume Language Check"). **API:** `/api/v1/languages` (backend, sign-in required) and `/api/v1/multilingual` (AI service, internal key). Cost: ₹0. No translation, OCR or inference service is used, and nothing is downloaded at run time.

## 1. Declared support

| Language | Resumes | Interface guidance |
|---|---|---|
| English | Supported | Supported |
| Hindi, Devanagari script | Supported for DOCX and text. PDFs: read correctly when the PDF embeds its full font; PDFs with subset fonts (most exporters) are **not reliable** and are flagged with a warning to upload DOCX or text instead. See §4. | Supported |
| Spanish | Supported | Supported |
| Any other language | **Refused with a message**, never guessed | — |

- **Refusals.** French, German and Portuguese are recognised by their function words, Marathi by its markers (it shares Devanagari with Hindi), and Bengali, Gurmukhi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Arabic, Cyrillic and CJK by script. Each gets "SkillBridge cannot read this yet". Fewer than 15 words of text gets "too little text to tell".
- **Interface.** Only the resume language screen is translated, covering its guidance text and result labels. The rest of SkillBridge is English.
- **Translation quality.** The translations were written by SkillBridge and have not been professionally reviewed.
- **Persistence and accessibility.** The chosen interface language is saved to the account (`LanguageSettings`) and applied after reload. The page sets `lang` so screen readers switch pronunciation.

## 2. Hardware and dependency check (before any model)

| Item | Finding |
|---|---|
| Hardware | 23.3 GB RAM; AMD Ryzen AI 7 350, 8 cores and 16 threads; AMD Radeon 860M integrated GPU (no CUDA) |
| Free disk on E: | 221 GB |
| OCR | Not installed (no Tesseract) |
| Language and ML libraries | None installed (no langdetect, fastText, spaCy, transformers, torch or onnxruntime) |
| Document libraries | PyMuPDF, pdfplumber and python-docx are installed |

**Decision.** No model is downloaded.
- Detection is deterministic: Unicode script shares, plus whole-word function-word counts.
- Extraction uses hand-written dictionaries for section headings, months, "present" words, Devanagari digits and a short list of skill terms written in Hindi or Spanish (in `ai/app/multilingual/languages.py`).

**OCR option, not taken.** Tesseract OCR is Apache-2.0 and would run on this CPU. It is a separate system install of about 50 MB, plus the `hin` and `spa` data files. It is **not installed** without your approval, so scanned resumes are detected and refused (see §4).

## 3. How a resume is read (`ai/app/multilingual`)

1. **Reading** (`document.py`):
   - **PDF:** text blocks are taken in reading order. A page is treated as two columns when its left blocks end before the right column starts and the right column holds at least 30% of the text; that column test keeps right-aligned dates in a single-column resume from triggering it.
   - **DOCX:** paragraphs and table cells are read in document order.
   - **TXT:** read as is.
2. **Scanned pages.** A page with images but under 20 characters of text is counted as scanned. A fully scanned file gets `status: scanned_unreadable` and the message "SkillBridge has no OCR".
3. **Devanagari glyph recovery** (`pdf_glyphs.py`, added in `multilingual-rules-3`).
   - **The problem.** Shaped Devanagari is drawn with glyphs for conjuncts, half forms, the reph and similar that have no character of their own. Many PDFs give these glyphs no Unicode mapping, so extractors emit U+FFFD or stray Latin letters and then re-sort what is left by position. For example, "वर्मा" came out as "व ù मा".
   - **When it runs.** Only on a page with such unmapped glyphs; every other page is read exactly as before.
   - **How it works.**
     - The characters are taken in the order they are drawn (`get_texttrace`), with their glyph ids.
     - Each unmapped glyph is looked up in the font embedded in the PDF. Its `cmap` gives the base glyphs. Its `GSUB` table (single, alternate and ligature substitutions, including extension lookups) is reversed, so a glyph made from र + ् is read back as "र्".
     - When a glyph can be produced in several ways, the longest candidate resolved in the earliest pass wins. Joiners are dropped.
     - Lines are rebuilt per text block by baseline, and every character belongs to one block only.
     - Vowels drawn as another vowel plus a sign ("आे" for ओ) are rejoined, since a vowel sign never follows an independent vowel in Hindi spelling.
   - **Properties.**
     - It is deterministic and local: no OCR, no model, no network, and no new dependency (PyMuPDF only).
     - The result carries `textRecovery: {glyphsRecovered, glyphsUnrecovered}`, and a warning says how many glyphs were recovered from the embedded font.
     - A glyph it cannot map stays U+FFFD and keeps the page `degraded`. It is never guessed.
   - **What it needs.**
     - The PDF must embed the **full** font with its `GSUB` table.
     - The content stream must hold the text in logical order, as HarfBuzz-shaped output does.
     - **Subset fonts**, which most exporters write, lose `GSUB`. Such PDFs are not recovered and stay flagged (see §4).
4. **Damaged text layers.** `assess_text_quality` flags Devanagari mixed with Latin-extended or symbol glyphs, `(cid:N)` codes, or vowel signs that start a word. These are the signs of a PDF whose shaped glyphs map to the wrong code points. The result gets `textQuality: degraded` and a warning recommending DOCX or plain text.
5. **Detection** (`detect.py`) produces a language, the script shares and the evidence. An unsupported language returns `status: unsupported`, with **no fields extracted**.
6. **Extraction** (`extract.py`, method `multilingual-rules-3`):

   | What | How |
   |---|---|
   | Sections | Headings in any of the three languages, case- and colon-insensitive, inline headings like "कौशल: Python" included |
   | Email | Regex |
   | Phone | 9–13 digits, normalised |
   | Experience | Date ranges inside an experience section: month names in all three languages, "06/2020", Devanagari digits, "present" words |
   | Education | Years in an education section |
   | Skills | Lexicon names in any script, plus the short list of Hindi and Spanish skill terms |

   - **Degraded mode.** When the text is degraded, single heading words are matched loosely, and date ranges outside any section become experience. Both are flagged `matchedLoosely` or `inferred`.
   - **Provenance.** Every value carries `source: {line, text}`, the original line it came from. The original lines are stored with the analysis.
   - **No translation.** Values are normalised (YYYY-MM dates, ASCII digits, lexicon skill names), never translated.

## 4. Measured accuracy (labelled set, per language and layout)

**Dataset.** `ai/tests/fixtures/multilingual/labelled_resumes.json` holds 6 synthetic, hand-labelled resumes, 2 per language. The labelling rule is stated in the file: for example, a Statistics degree counts as the skill Statistics in any language.

Each resume is rendered in 5 layouts:
- a single-column PDF;
- a two-column PDF;
- a single-column PDF with **subset fonts**, as most PDF exporters write them;
- a single-column PDF in a **second font** (the bundled Noto Sans Devanagari, TrueType);
- a DOCX table.

The PDFs are written with PyMuPDF's HTML text shaping (HarfBuzz). Except in the second-font layout, Devanagari uses MuPDF's built-in Noto Serif Devanagari (CFF). Noto fonts are under the SIL OFL 1.1; the licence is bundled at `ai/tests/fixtures/fonts/OFL.txt`.

**Run it with** `python -m app.multilingual.evaluation` from `ai/`. Set `MULTILINGUAL_EVAL_OUT=report.json` to also write the per-document rows. `tests/test_multilingual.py` asserts that the evaluation is reproducible and pins each row's expectations.

**Results** (method `multilingual-rules-3`, 30 documents, 2026-10-13):

| Language / layout | Lang. | Sections | Email | Phone | Exp. recall | Exp. precision | Edu. recall | Skill recall | Skill precision | Degraded text |
|---|---|---|---|---|---|---|---|---|---|---|
| en / PDF one column | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| en / PDF two columns | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| en / PDF subset fonts | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| en / PDF second font | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| en / DOCX table | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / PDF one column | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / PDF two columns | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / PDF subset fonts | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / PDF second font | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / DOCX table | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| hi / DOCX table | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| hi / PDF one column (full font) | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| hi / PDF two columns (full font) | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| hi / PDF second font (full, TrueType) | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| **hi / PDF subset fonts** | 1.00 | **0.47** | 1.00 | 1.00 | **0.00** | **0.00** | **0.00** | **0.68** | 1.00 | **2/2** |

Before glyph recovery (`multilingual-rules-2`), both full-font Hindi PDF rows were what the subset row still is: sections 0.47; experience and education 0.00; skills 0.68; degraded 2/2.

**Reading these honestly:**
- **The dataset is small and synthetic.** It has 6 resumes, written alongside the rules and rendered by one generator with two Devanagari fonts. It shows the rules and the recovery work as designed, not that real resumes will score 1.00. No real resumes were available to evaluate.
- **Hindi PDFs that embed the full font are now read correctly.**
  - Every source line came back exactly, apart from ordinary wrapping in a narrow column, and one letter whose nukta came back as a separate character (फ + ़ for फ़), which renders identically.
  - The recovery is disclosed in a warning and in `textRecovery`.
- **Hindi PDFs with subset fonts are still not supported.**
  - Subsetting removes the `GSUB` table, so conjuncts cannot be recovered.
  - Headings, month names and words with conjuncts are lost, so experience and education are not found. Email, phone, digits and Latin-script skills survive.
  - **The damage is detected in every case (2/2), and the user is told to upload DOCX or plain text.**
  - Most real-world PDF exporters subset fonts, so for Hindi **DOCX or text remains the reliable path**, and SkillBridge does not claim reliable Hindi PDF extraction.
- **Not covered by recovery:**
  - PDFs whose content stream is in visual order;
  - PDFs made with legacy non-Unicode Hindi fonts (Kruti Dev, Chanakya and similar), whose "text" is Latin letters standing for glyphs;
  - fonts that are not embedded at all.
  - Legacy-font text is read as Latin gibberish; language detection then does not find Hindi, and the resume is refused or scored as English.
- **Two columns.** The two-column layout was detected for every two-column PDF.
- **Not measured:**
  - scanned documents, which are refused;
  - real-world layouts (sidebars with icons, tables with merged cells, headers and footers);
  - languages other than the three.

### OCR: proposal awaiting approval (not implemented)

OCR would help with scanned resumes and with subset-font Hindi PDFs, by rendering the page and reading the image.

- **Engine.** Tesseract 5 (Apache-2.0), run locally through `pytesseract` (Apache-2.0). It needs a system install, about 50 MB, plus the `hin`, `eng` and `spa` trained data, about 10–20 MB each with the "fast" models. No network or paid service is involved, and the 8-core CPU is enough: a few seconds per page.
- **Where it would run.**
  - Only for pages that are scanned, or flagged degraded with `glyphsUnrecovered > 0`.
  - Each page would be rendered at 300 dpi with PyMuPDF in a temporary directory that is deleted after use.
  - No image would be stored.
  - The OCR text would be labelled `source: "ocr"` with Tesseract's confidence, and kept apart from the text layer.
- **Privacy.** Processing stays inside the AI container, and resumes are already processed there. The trained-data files are static and contain no user data.
- **Tests it would need:**
  - the labelled set extended with rendered-image versions of each resume, measured per language;
  - a check that OCR text is never used when the text layer is clean;
  - a time limit per page;
  - the Docker image size recorded before and after.
- **Status.** Not installed and not enabled. It needs the project owner's approval of the install and the larger AI image.

## 5. Tests

- `ai/tests/test_multilingual.py`, 9 tests:
  - detection, including refusing French, Marathi, Tamil and too-short text;
  - headings, dates (Devanagari digits, Spanish "junio de 2020", numeric, "actualidad"), email and phone;
  - provenance;
  - Hindi and Spanish skill terms;
  - unsupported text yields no fields;
  - damaged-text detection;
  - scanned PDF refusal;
  - a reproducible evaluation with thresholds:
    - full-font Hindi PDFs, in two fonts, must be read cleanly at ≥ 0.95;
    - subset-font Hindi PDF damage must always be flagged;
  - glyph recovery (`test_devanagari_glyphs_are_recovered_from_the_embedded_font`): conjuncts, reph and half forms come back exactly where PyMuPDF's own text is garbled, and the recovery is disclosed;
  - the endpoint: internal key required, bad type 400, fake PDF 415, text analysis and the language list.
- `backend/src/tests/multilingual.test.ts`:
  - the interface language: default, persistence and validation;
  - analyses: forwarding, storage with provenance, the base file name only (a UTF-8 Devanagari file name survives), refused and scanned results stored as such, 5 invalid inputs, owner-only access, deletion;
  - AI service down: 503 with nothing stored;
  - no career skills written.
- `e2e/tests/languages.mjs`, 10 browser steps, against the stub AI service like every browser test:
  - English guidance;
  - switching to Hindi translates the page and persists after reload;
  - a Hindi resume with skills and the "पंक्ति 3" provenance;
  - a French resume refused;
  - a scanned file reported;
  - deletion and isolation;
  - 390 px;
  - a clean console.

**Bug found and fixed.** Multer decodes multipart file names as Latin-1, so a Devanagari or accented file name arrived garbled. `LanguageController` now re-reads the bytes as UTF-8 when they are valid UTF-8. **The core resume upload (`backend/src/middlewares/upload.ts`) very likely has the same problem**; Agent A owns that module, so this is reported and not changed here.

## 6. Adapter contract for the main resume pipeline (Agent A)

The existing resume parser and resume scoring are **not changed**. To use multilingual extraction in the main pipeline after integration:

- **Detect first.** Call `POST /api/v1/multilingual/analyze` (AI service, internal key; multipart `file`) before or instead of `/api/v1/extract` when `language.language !== 'en'` or when `textQuality === 'degraded'`.
- **Map the fields:**

  | Multilingual field | Main resume field |
  |---|---|
  | `fields.skills[].name` | Skill names, already lexicon-canonical |
  | `fields.experience[] {start, end, context}` | Experience entries (`end: 'present'` marks a current role) |
  | `fields.education[].year` | Education years |
  | `fields.email` / `fields.phone` | Contact details |

  Keep `source.line` and `originalLines` as evidence provenance.
- **Never score refusals.** Do not score `status !== 'extracted'`. Show `warnings` to the user instead.
- **Treat inferred values as weaker evidence.** Values with `inferred` or `matchedLoosely` should not be treated as confirmed.
- **Stored analyses** (`ResumeLanguageAnalysis`) are separate records and are deleted by the user. They never write `UserSkill`.
