# Multilingual resumes and guidance (E5, X1)

**Branch:** `work/skillbridge-parallel-features` (Agent B). **Screen:** `/resume-language` ("Resume Language Check"). **API:** `/api/v1/languages` (backend, sign-in required) and `/api/v1/multilingual` (AI service, internal key). Cost: ₹0. No translation, OCR or inference service is used, and nothing is downloaded at run time.

## 1. Declared support

| Language | Resumes | Interface guidance |
|---|---|---|
| English | Supported | Supported |
| Hindi, Devanagari script | Supported. Hindi PDFs are read **unreliably**; see §4. | Supported |
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
3. **Damaged text layers.** `assess_text_quality` flags Devanagari mixed with Latin-extended or symbol glyphs, `(cid:N)` codes, or vowel signs that start a word. These are the signs of a PDF whose shaped glyphs map to the wrong code points. The result gets `textQuality: degraded` and a warning recommending DOCX or plain text.
4. **Detection** (`detect.py`) produces a language, the script shares and the evidence. An unsupported language returns `status: unsupported`, with **no fields extracted**.
5. **Extraction** (`extract.py`, method `multilingual-rules-2`):

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

**Dataset.** `ai/tests/fixtures/multilingual/labelled_resumes.json` holds 6 synthetic, hand-labelled resumes, 2 per language. The labelling rule is stated in the file: for example, a Statistics degree counts as the skill Statistics in any language. Each resume is rendered in 3 layouts: single-column PDF, two-column PDF and a DOCX table. PDFs use HTML text shaping with the bundled Noto Sans Devanagari font (SIL OFL 1.1; licence at `ai/tests/fixtures/fonts/OFL.txt`).

**Run it with** `python -m app.multilingual.evaluation` from `ai/`. Set `MULTILINGUAL_EVAL_OUT=report.json` to also write the per-document rows. `tests/test_multilingual.py` asserts that the evaluation is reproducible.

**Results** (method `multilingual-rules-2`, 18 documents):

| Language / layout | Lang. | Sections | Email | Phone | Exp. recall | Exp. precision | Edu. recall | Skill recall | Skill precision | Degraded text |
|---|---|---|---|---|---|---|---|---|---|---|
| en / PDF one column | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| en / PDF two columns | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| en / DOCX table | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / PDF one column | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / PDF two columns | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| es / DOCX table | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| hi / DOCX table | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 0/2 |
| **hi / PDF one column** | 1.00 | **0.47** | 1.00 | 1.00 | **0.00** | **0.00** | **0.00** | **0.68** | 1.00 | **2/2** |
| **hi / PDF two columns** | 1.00 | **0.47** | 1.00 | 1.00 | **0.00** | **0.00** | **0.00** | **0.68** | 1.00 | **2/2** |

**Reading these honestly:**
- **English and Spanish are perfect, and so is Hindi DOCX.** But these are **6 synthetic resumes written alongside the rules**. That shows the rules work as designed, not that real resumes will score 1.00. No real resumes were available to evaluate.
- **Hindi PDFs are the real limitation.**
  - Shaped Devanagari text extracts garbled from both PyMuPDF and pdfplumber: for example "कार्य" becomes "काùय", and "वर्तमान" becomes "वùतमान".
  - Headings, month names and words with conjuncts are lost, so experience and education are not found.
  - Email, phone, digits and Latin-script skills survive.
  - **The damage was detected in every case (2/2 per layout), and the user is told to upload DOCX or plain text instead.**
- **Two columns.** The two-column layout was detected for every two-column PDF.
- **Not measured:**
  - scanned documents, which are refused;
  - real-world layouts (sidebars with icons, tables with merged cells, headers and footers);
  - languages other than the three.

## 5. Tests

- `ai/tests/test_multilingual.py`, 8 tests:
  - detection, including refusing French, Marathi, Tamil and too-short text;
  - headings, dates (Devanagari digits, Spanish "junio de 2020", numeric, "actualidad"), email and phone;
  - provenance;
  - Hindi and Spanish skill terms;
  - unsupported text yields no fields;
  - damaged-text detection;
  - scanned PDF refusal;
  - a reproducible evaluation with thresholds, where Hindi PDF damage must always be flagged;
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
