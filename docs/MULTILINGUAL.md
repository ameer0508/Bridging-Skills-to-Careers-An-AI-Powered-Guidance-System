# Multilingual resumes and guidance (E5, X1)

**Branch:** `work/skillbridge-parallel-features` (Agent B). **Screen:** `/resume-language` ("Resume Language Check"). **API:** `/api/v1/languages` (backend, sign-in required) and `/api/v1/multilingual` (AI service, internal key). Cost: ₹0. No translation or inference service is used, and nothing is downloaded at run time. Scanned PDFs are read by **local Tesseract OCR** (X1, approved by the owner on 2026-10-13; see §4a): free, offline, inside the AI service.

## 1. Declared support

| Language | Resumes | Interface guidance |
|---|---|---|
| English | Supported | Supported |
| Hindi, Devanagari script | Supported for DOCX and text. PDFs: read from the text layer when the PDF embeds its full font; PDFs with subset fonts (most exporters) have a damaged text layer and are now **re-read by OCR**, which scored 1.00 on the labelled set (§4). Scanned Hindi PDFs are read by OCR. OCR values are marked as OCR guesses. | Supported |
| Spanish | Supported for DOCX, text and text PDFs. Scanned Spanish PDFs are read with the English OCR model only (the owner chose not to install Spanish OCR data), so accented words are often misread: sections 0.82 and education 0.00 on clean scans (§4). | Supported |
| Telugu, Tamil, Kannada, Malayalam | **Not supported.** Recognised by script, including in scanned PDFs read by OCR, and **refused with a message**. The OCR language data is installed and reads these scripts well (§4a), but there are no extraction rules, headings or labelled resumes for them, so no fields are extracted. | — |
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
| OCR | At first not installed. Since 2026-10-13: Tesseract 5.4.0.20240606 (leptonica 1.84.1) at `C:\Program Files\Tesseract-OCR`, languages eng, hin, tel, tam, kan, mal (+ osd), "fast" models. No Spanish data, by the owner's choice. |
| Language and ML libraries | None installed (no langdetect, fastText, spaCy, transformers, torch or onnxruntime) |
| Document libraries | PyMuPDF, pdfplumber and python-docx are installed |

**Decision.** No model is downloaded.
- Detection is deterministic: Unicode script shares, plus whole-word function-word counts.
- Extraction uses hand-written dictionaries for section headings, months, "present" words, Devanagari digits and a short list of skill terms written in Hindi or Spanish (in `ai/app/multilingual/languages.py`).

**OCR.** Tesseract OCR (Apache-2.0) was proposed here and approved by the owner, who installed it locally. It is used only as a fallback for scanned or damaged PDFs (§4a).

## 3. How a resume is read (`ai/app/multilingual`)

1. **Reading** (`document.py`):
   - **PDF:** text blocks are taken in reading order. A page is treated as two columns when its left blocks end before the right column starts and the right column holds at least 30% of the text; that column test keeps right-aligned dates in a single-column resume from triggering it.
   - **DOCX:** paragraphs and table cells are read in document order.
   - **TXT:** read as is.
2. **Scanned pages.** A page with images but under 20 characters of text is counted as scanned. Scanned pages go to OCR (§4a). Only when OCR is unavailable, fails or reads nothing does the file get `status: scanned_unreadable`, with a message that says which of these happened.
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
4. **Damaged text layers.** `assess_text_quality` flags Devanagari mixed with Latin-extended or symbol glyphs, `(cid:N)` codes, or vowel signs that start a word. These are the signs of a PDF whose shaped glyphs map to the wrong code points. The result gets `textQuality: degraded` and a warning recommending DOCX or plain text. A degraded **PDF** is then re-read by OCR; the OCR text replaces the text layer only if it passes the same quality check (§4a).
5. **Detection** (`detect.py`) produces a language, the script shares and the evidence. An unsupported language returns `status: unsupported`, with **no fields extracted**.
6. **Extraction** (`extract.py`, method `multilingual-rules-4`; rules-3 plus OCR provenance):

   | What | How |
   |---|---|
   | Sections | Headings in any of the three languages, case- and colon-insensitive, inline headings like "कौशल: Python" included |
   | Email | Regex |
   | Phone | 9–13 digits, normalised |
   | Experience | Date ranges inside an experience section: month names in all three languages, "06/2020", Devanagari digits, "present" words |
   | Education | Years in an education section |
   | Skills | Lexicon names in any script, plus the short list of Hindi and Spanish skill terms |

   - **Degraded mode.** When the text is degraded, single heading words are matched loosely, and date ranges outside any section become experience. Both are flagged `matchedLoosely` or `inferred`.
   - **Provenance.** Every value carries `source: {line, text}`, the original line it came from. The original lines are stored with the analysis. A value from an OCR line also carries `source.origin: "ocr"` and `source.ocrConfidence`, and the result carries `textSource` (`text_layer`, `ocr` or `mixed`).
   - **No translation.** Values are normalised (YYYY-MM dates, ASCII digits, lexicon skill names), never translated.

## 4. Measured accuracy (labelled set, per language and layout)

**Dataset.** `ai/tests/fixtures/multilingual/labelled_resumes.json` holds 6 synthetic, hand-labelled resumes, 2 per language. The labelling rule is stated in the file: for example, a Statistics degree counts as the skill Statistics in any language.

Each resume is rendered in 7 layouts:
- a single-column PDF;
- a two-column PDF;
- a single-column PDF with **subset fonts**, as most PDF exporters write them;
- a single-column PDF in a **second font** (the bundled Noto Sans Devanagari, TrueType);
- a DOCX table;
- a **scanned PDF**: the single-column page rendered at 200 dpi and stored as an image only, with no text layer;
- a **noisy scanned PDF**: 150 dpi greyscale, rotated 1°, Gaussian noise (σ 12, fixed seed) and JPEG quality 60, like a phone photo or an office scanner.

The PDFs are written with PyMuPDF's HTML text shaping (HarfBuzz). Except in the second-font layout, Devanagari uses MuPDF's built-in Noto Serif Devanagari (CFF). Noto fonts are under the SIL OFL 1.1; the licence is bundled at `ai/tests/fixtures/fonts/OFL.txt`.

**Run it with** `python -m app.multilingual.evaluation` from `ai/`. Set `MULTILINGUAL_EVAL_OUT=report.json` to also write the per-document rows. `tests/test_multilingual.py` asserts that the evaluation is reproducible and pins each row's expectations, with separate expectations for a machine with and without OCR.

**Results** (method `multilingual-rules-4`, 42 documents, Tesseract 5.4.0 "fast" models on Windows, 2026-10-13):

| Language / layout | Lang. | Sections | Email | Phone | Exp. recall | Exp. precision | Edu. recall | Skill recall | Skill precision | Read by OCR |
|---|---|---|---|---|---|---|---|---|---|---|
| en / PDF one column | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| en / PDF two columns | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| en / PDF subset fonts | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| en / PDF second font | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| en / DOCX table | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| en / **scanned PDF** | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 2/2 |
| en / **noisy scanned PDF** | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 2/2 |
| es / PDF one column | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / PDF two columns | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / PDF subset fonts | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / PDF second font | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / DOCX table | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / **scanned PDF** | 1.00 | **0.82** | 1.00 | 1.00 | 1.00 | 1.00 | **0.00** | 1.00 | 1.00 | 2/2 |
| es / **noisy scanned PDF** | 1.00 | **0.90** | 1.00 | 1.00 | 1.00 | 1.00 | **0.50** | 1.00 | 1.00 | 2/2 |
| hi / DOCX table | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| hi / PDF one column (full font) | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| hi / PDF two columns (full font) | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| hi / PDF second font (full, TrueType) | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| hi / PDF subset fonts | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 2/2 |
| hi / **scanned PDF** | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 2/2 |
| hi / **noisy scanned PDF** | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | **0.88** | 1.00 | 2/2 |

- **Clean text PDFs never went to OCR** (0/2 in every text-layer row), and every DOCX row is unchanged.
- **Hindi subset-font PDFs.** Without OCR (method rules-3) this row was: sections 0.47; experience and education 0.00; skills 0.68; degraded 2/2. With OCR the damaged text layer is detected, the pages are re-read by OCR, and the OCR text passes the quality check, so the row is now 1.00. Before glyph recovery (`multilingual-rules-2`), the full-font rows were as bad as that subset row.
- **Spanish scans are weaker,** because there is no Spanish OCR data (the owner's decision) and the English model drops or changes accents. The education headings ("Educación", "Formación académica") were not recognised in the OCR text, most likely because of the accented ó, so education years were not found. Spanish DOCX, text and text-layer PDFs are unaffected (1.00).
- **Noisy Hindi scans** lost one Hindi-script skill term (skill recall 0.88); nothing else was affected.

### 4a. Local OCR (X1)

**What is installed.** Tesseract 5 (Apache-2.0), called as a subprocess by `ai/app/multilingual/ocr.py`. No Python OCR wrapper, no cloud service, no paid API and no runtime download.

| Where | Engine | Languages | Models |
|---|---|---|---|
| Owner's Windows machine (local execution) | 5.4.0.20240606, `C:\Program Files\Tesseract-OCR\tesseract.exe` (found by `TESSERACT_CMD`, `PATH`, then that default) | eng, hin, tel, tam, kan, mal | "fast" (installer) |
| Docker AI image | Tesseract 5.5.0 from Debian: `tesseract-ocr` with `tesseract-ocr-{eng,hin,tel,tam,kan,mal}`, `--no-install-recommends`. Verified in Docker run 38382438611: those six plus osd listed; scanned English page 4/4 lines at 96.3%, scanned Hindi page 4/4 at 94.9%; AI image 733 MB | the same six | Debian's standard (`tessdata`) models |

- **Approved languages only.** `APPROVED_LANGUAGES` = eng, hin, tel, tam, kan, mal. Only those that are installed are passed to `-l`, in one combined pass. Spanish data is deliberately not installed; Spanish scans are read with the English model.
- **OSD is not used.** Tesseract's script detection named Hindi and Tamil pages "Latin" in a probe, so the language is decided by SkillBridge's own detector on the OCR output.
- **Docker vs Windows models differ** (standard vs "fast"). The numbers above are from the "fast" models. The Docker workflow checks that every language is present and that a scanned English and a scanned Hindi page are read through the real pipeline (`python -m app.multilingual.ocr_selfcheck`); it does not rerun the whole evaluation.

**When OCR runs (fallback only).**
- Only for PDFs.
- Only for pages counted as **scanned** (images and under 20 characters of text), or for every page when the text layer is **degraded** (§3.4).
- Clean text PDFs, DOCX and plain text never reach OCR; a test counts the calls.
- For a degraded document, the OCR text is used only if it passes the same quality check; otherwise the text layer is kept and `ocr.rejected` says `ocr_text_also_damaged`.
- Scanned pages are merged into the document page by page, so a mixed file keeps its text pages (`textSource: mixed`).

**Limits** (environment variables, each clamped to a safe range):

| Setting | Default | Allowed |
|---|---|---|
| `OCR_MAX_PAGES` | 5 pages per document; the rest are skipped and reported | 1–20 |
| `OCR_DPI` | 300 | 100–400 |
| `OCR_MAX_PIXELS` | 25 million per page; larger pages are rendered at a lower dpi (never below 72) | 1–60 million |
| `OCR_PAGE_SECONDS` | 45 s per page, then the process is killed | 5–180 |
| `OCR_TOTAL_SECONDS` | 120 s per document | 10–600 |
| File size | 5 MB (the AI service's existing upload limit) | — |
| `OCR_ENABLED=false` | turns OCR off | — |

- **Process safety.** The command is a list of arguments with no shell; it has a timeout; `OMP_THREAD_LIMIT=1` keeps one page to one core. Engine error text is never shown to the user or stored; failures become the codes `timeout`, `error` or `not_available`.
- **Temporary images.** Each page is rendered into a `TemporaryDirectory(prefix="sb-ocr-")`, deleted when the call ends, including after an error. No image is stored. A test checks that nothing is left behind.
- **Speed.** About 1.3–1.5 s for a full A4 page at 300 dpi with all six languages, on the owner's laptop CPU.

**What the user sees.**
- A warning: "Text on N page(s) was read by OCR (Tesseract, languages: …), mean confidence X%. OCR can misread…", plus how many lines were below 60% confidence and how many pages were skipped.
- On the screen: an OCR banner (`ocr-notice`) with the engine and mean confidence, and an "OCR" mark on every field and skill that came from an OCR line.
- When OCR is unavailable or fails, the message says so instead of "no OCR".

**OCR results are guesses, never verified evidence.**
- Every OCR value carries `source.origin: "ocr"` and its line confidence.
- The language-check screen never writes career skills (`UserSkill`); the backend test checks this for an OCR-read scan as well.
- The stored analysis keeps a whitelist of OCR metadata (used, reason, engine, languages, pages requested, read and skipped, failure codes, mean confidence, seconds, rejected). Raw engine output and limits are not stored; a test checks this.

**Telugu, Tamil, Kannada and Malayalam: recognised and refused, not supported.**

`ai/tests/fixtures/multilingual/script_samples.json` holds one SYNTHETIC short resume per script. Each was rendered as a text PDF, a scanned PDF and a noisy scanned PDF, read by the full pipeline, and compared with the source text (character accuracy = 1 − character error rate, after removing joiners):

| Script / layout | Status | Text source | OCR mean confidence | Character accuracy |
|---|---|---|---|---|
| Telugu / text PDF | unsupported | ocr | 92.0 | 0.985 |
| Telugu / scanned | unsupported | ocr | 92.4 | 0.974 |
| Telugu / noisy scan | unsupported | ocr | 92.7 | 0.995 |
| Tamil / text PDF | unsupported | ocr | 95.0 | 1.000 |
| Tamil / scanned | unsupported | ocr | 94.8 | 1.000 |
| Tamil / noisy scan | unsupported | ocr | 94.5 | 0.995 |
| Kannada / text PDF | unsupported | ocr | 93.6 | 0.995 |
| Kannada / scanned | unsupported | ocr | 93.2 | 0.985 |
| Kannada / noisy scan | unsupported | ocr | 92.5 | 0.990 |
| Malayalam / text PDF | unsupported | ocr | 89.3 | 0.920 |
| Malayalam / scanned | unsupported | ocr | 91.2 | 0.930 |
| Malayalam / noisy scan | unsupported | ocr | 92.4 | 0.930 |

- All 12 were detected as their own script and refused with no fields extracted. None was read as English.
- The text PDFs went to OCR too, because their shaped glyphs have no Unicode mapping and the text layer was flagged as damaged.
- Good character accuracy on 4 short synthetic samples is **not** production support: there are no headings, month names or skill terms for these languages, no labelled resumes, and Malayalam accuracy is lower (0.92–0.93, partly chillu-letter encoding differences).

**Reading these honestly:**
- **The dataset is small and synthetic.** 6 labelled resumes and 4 script samples, written alongside the rules and rendered by one generator. Real scans (skewed photos, stamps, handwriting, tables, low-contrast printing, mixed scripts in one line) were not available and were not measured.
- **OCR can misread.** Every OCR value is marked and the confidence is shown; users are asked to check them.
- **Spanish scans are partial** without Spanish OCR data.
- **Pages beyond the limit are skipped**, and very large pages are read at a lower resolution.
- **Not covered:** legacy non-Unicode Hindi fonts (Kruti Dev and similar) in text PDFs, images inside DOCX files, and any language other than English, Hindi and Spanish for extraction.

## 5. Tests

- `ai/tests/test_multilingual.py`, 9 tests:
  - detection, including refusing French, Marathi, Tamil and too-short text;
  - headings, dates (Devanagari digits, Spanish "junio de 2020", numeric, "actualidad"), email and phone;
  - provenance;
  - Hindi and Spanish skill terms;
  - unsupported text yields no fields;
  - damaged-text detection;
  - a scanned PDF with no readable text is reported, with the reason (OCR unavailable or no text found);
  - a reproducible evaluation with thresholds:
    - full-font Hindi PDFs, in two fonts, must be read cleanly at ≥ 0.95;
    - clean text layers in all three languages must never go to OCR and must score ≥ 0.95;
    - with OCR: Hindi subset-font PDFs and English and Hindi scans must be read by OCR at ≥ 0.95 on every metric, noisy scans at ≥ 0.85; Spanish scans must keep language, email, phone and skills (≥ 0.95), and their education score is pinned below 0.95 so that the documented weakness is updated if it changes;
    - without OCR: subset-font Hindi damage must always be flagged and scans reported;
  - glyph recovery (`test_devanagari_glyphs_are_recovered_from_the_embedded_font`): conjuncts, reph and half forms come back exactly where PyMuPDF's own text is garbled, and the recovery is disclosed;
  - the endpoint: internal key required, bad type 400, fake PDF 415, text analysis and the language list.
- `ai/tests/test_ocr.py`, 10 tests (the ones that need Tesseract are skipped on a machine without it):
  - clean text PDFs never reach OCR (calls counted);
  - a scanned PDF is read by OCR with provenance, confidence and the warning;
  - the page limit, and no temporary image left behind;
  - the pixel budget lowers the resolution of huge pages;
  - every limit is clamped to its safe range;
  - a timeout and an engine error are handled, and the engine's own text is not shown;
  - OCR unavailable is reported;
  - the subprocess: argument list, no shell, timeout, `OMP_THREAD_LIMIT=1`;
  - Telugu, Tamil, Kannada and Malayalam text is refused, never read as English;
  - damaged text is kept when the OCR text is no better.
- `python -m app.multilingual.ocr_selfcheck`: checks the engine and every approved language, and reads a scanned English and Hindi page. It runs in the Docker workflow.
- `backend/src/tests/multilingual.test.ts`:
  - the interface language: default, persistence and validation;
  - analyses: forwarding, storage with provenance, the base file name only (a UTF-8 Devanagari file name survives), refused and scanned results stored as such, 5 invalid inputs, owner-only access, deletion;
  - an OCR-read scan: `textSource` and the whitelisted OCR metadata are stored, raw engine output and limits are not, and no career skill is written;
  - AI service down: 503 with nothing stored;
  - no career skills written.
- `e2e/tests/languages.mjs`, 11 browser steps, against the stub AI service like every browser test (the stub's OCR reply shows the banner, confidence and marks; the real OCR is tested in the AI tests):
  - English guidance;
  - switching to Hindi translates the page and persists after reload;
  - a Hindi resume with skills and the "पंक्ति 3" provenance;
  - a French resume refused;
  - a scanned file reported;
  - an OCR-read scan shows the OCR banner with engine and confidence, and the OCR mark on the e-mail and both skills;
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
- **Treat inferred values as weaker evidence.** Values with `inferred` or `matchedLoosely`, and every value with `source.origin: "ocr"`, should not be treated as confirmed.
- **Stored analyses** (`ResumeLanguageAnalysis`) are separate records and are deleted by the user. They never write `UserSkill`.
