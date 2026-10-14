# Live demonstration script (about 25 minutes)

Every account, resume, organization and posting used here is **SYNTHETIC DEMO DATA**. No real person's data is used, and no market, salary or demand figure shown in the demo describes the real job market. Where SkillBridge has no real data, the demo shows it saying "unavailable"; that honesty is part of what is being demonstrated.

## Before the demonstration

**1. Start the stack.** Use Docker Desktop:

```bash
docker compose up -d --build
```

Then open http://localhost:3000. Local development mode works too (see `PROJECT_HANDBOOK.md` §3).

**2. Demo documents.** They are in `demo/documents/` and can be regenerated with `ai/.venv/Scripts/python demo/make_demo_documents.py`.

| File | Use |
|---|---|
| `aarav-sharma-data-analyst-SYNTHETIC.pdf` | The main student's resume (English, text PDF) |
| `meera-iyer-frontend-SYNTHETIC.docx` | A second student (DOCX) |
| `riya-verma-hindi-SYNTHETIC.docx` | Hindi resume for the Resume Language Check |
| `aarav-sharma-scanned-SYNTHETIC.pdf` | Image-only scan for OCR |
| `not-a-resume-SYNTHETIC.txt` | To show a rejected upload |

**3. Accounts.** Create them during the demo, or beforehand. Use any password of 8+ characters with a capital, a digit and a symbol, e.g. `Demo@2026!`.

| Account | Role in the demo |
|---|---|
| `aarav.demo@example.com` | Student |
| `org.demo@example.com` | Organization representative ("Example Analytics, SYNTHETIC") |
| `admin.demo@example.com` | Administrator |

Making the administrator is an operator action; there is no screen for it, on purpose. Register the account, then run:

```bash
docker compose exec -T mongodb mongosh skillbridge --quiet --eval 'db.users.updateOne({email:"admin.demo@example.com"},{$set:{role:"admin"}})'
```

The administrator then signs out and in again.

**4. Optional: synthetic market demo data**, for showing the market charts:

```bash
docker compose exec -T backend node backend/dist/scripts/importMarketPostings.js --synthetic-fixture --imported-by admin.demo@example.com
```

These records are labelled "Synthetic test data" everywhere and never affect any user's figures. **Say so when you show them.**

**5. Optional: live OnJob.io listings in the Career Lab.**
- Set `SKILLBRIDGE_ENABLE_ONJOB=true` and `SKILLBRIDGE_ONJOB_FEED_TERMS_ACCEPTED=true` in `.env`, then run `docker compose up -d` again.
- This needs internet access. Without it the comparison says the listings are off or unavailable.

**6. Voice.** Use Microsoft Edge for the voice features: they were tested by hand there, with a real microphone.

## The script

| # | Do | Point out |
|---|---|---|
| 1 | Open the landing page | No testimonials, user counts or invented claims; sample screens are labelled (`PRODUCT_CLAIMS.md`) |
| 2 | Register **Aarav**; onboarding: Software Engineering → target role "Data Analyst" | Rotating sign-in tokens; the target role drives everything else |
| 3 | Resume Intelligence: upload `not-a-resume-SYNTHETIC.txt`, then `aarav-sharma-data-analyst-SYNTHETIC.pdf` | The bad file is refused with a message. The extraction lists skills with **evidence**: applied in a role or project counts more than merely listed |
| 4 | Career Intelligence | 20 careers with weighted requirements. Each score opens a per-requirement table showing how it was calculated. Six careers are informed by O*NET (US data, labelled) |
| 5 | Career Readiness | The same readiness figure on every page; it describes evidence, not hiring chances |
| 6 | Career Lab → Compare: Data Analyst, Business Analyst, Data Scientist | Gaps and effort per career. **Opportunities: "Market data unavailable"**: no licensed source exists, so no number is invented. If OnJob is on: real live listings with links, "one job board, not the Indian job market" |
| 7 | Career Lab → What-if: add "Tableau"; Counterfactuals | Hypothetical, never saved; shows which single change raises the match most |
| 8 | Learning Roadmap; mark an item done | Phased plan from real gaps; progress is stored |
| 9 | Interview Prep Agent → a short mock interview (type one answer) | Questions built from the role and resume. Without an AI key: the question bank and a rule-based rubric, **labelled as such**. The score states its method and uncertainty |
| 10 | In the interview (Edge): Record spoken answers → consent → record → listen → delete | No microphone request before consent; retention choice; owner-only playback; deletion |
| 11 | Enable voice dictation → consent → dictate a sentence → edit it | The browser's service, consented. The edited text is what is stored; typing always works |
| 12 | Job Search Agent → save a listing; Applications → status history and a reminder; Application Outcomes | Without a job-provider key, listings are **labelled demo listings**. Outcome rates show their denominators |
| 13 | Resume Language Check: upload `riya-verma-hindi-SYNTHETIC.docx`, then `aarav-sharma-scanned-SYNTHETIC.pdf` | Hindi detected; every value traced to its original line. The scan is read by local OCR (Tesseract) with a confidence banner and OCR marks. **OCR values are guesses and never become verified skills** |
| 14 | Exam Practice → GATE CS: a short timed attempt | Original practice questions; kept apart from career evidence |
| 15 | Market Evidence and Salary Insights | Real data: "unavailable", with the reason. If the synthetic fixture was imported: switch to "Synthetic test data" and say it is generated, labelled and never used for anyone's scores |
| 16 | Sign in as **org.demo** → Employer Postings → Post a job: save the organization, create a posting, Publish… | The full contribution terms and three confirmations; "self-declared, not verified"; "not in market data until an administrator reviews your organization" |
| 17 | As **Aarav** → Employer Postings → Openings | The posting with its self-declared label and "not counted in market figures"; Report |
| 18 | As **admin.demo** → Employer Postings → Review reports → Accept for market figures | The reviewer sees the e-mail domain signal and accounts claiming the same name. Review is not verification. Even reviewed postings give no market figure until there are at least 5 employers, none above half |
| 19 | As **Aarav** → Profile & Settings → delete the account | Every record and file is removed; the old sign-in is refused at once (`PRIVACY_AND_RETENTION.md`) |

## What not to say

- Do not call any market, salary, trend or forecast figure real. The only real external data are:
  - OnJob.io live listings, if enabled;
  - O*NET (US) requirements, labelled as such.
- Do not say voice dictation is accurate. It was 4 of 5 technical terms in the owner's Edge test, and the text stays editable.
- Do not say organizations are verified.
- Do not say the system is deployed or production-ready. It runs locally and in Docker, and is tested; it has not been deployed or load-tested.
- The score is **81/100** on the expansion checklist. The 19 open points are listed in `NEXTGEN_RELEASE_REPORT.md` §4.

## If something goes wrong

| Problem | Fix |
|---|---|
| A page says the AI service is unavailable | `docker compose ps`; the `ai-service` should be healthy. Resume parsing is rule-based and needs no AI key |
| No microphone prompt | Use `http://localhost:3000` (a secure context). Check the site's microphone permission |
| Voice recognition gives nothing | Expected offline; the text box still works |
| A clean slate is needed | Use new demo e-mail addresses. Do not reset the database or volumes: they hold the owner's data |
