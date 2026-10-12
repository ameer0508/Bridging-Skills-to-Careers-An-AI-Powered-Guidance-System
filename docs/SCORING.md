# How SkillBridge scores are calculated

Every score shown to a user is computed from that user's own stored data with the fixed
formulas below. None of them is produced by a machine-learning model, and none is a
prediction of interview or hiring outcomes. Expected values for each formula are pinned in
`backend/src/tests/scoring_accuracy.test.ts` and `backend/src/tests/interview_evaluation.test.ts`.

## 1. Skill extraction

Skills are found by matching resume and job text against a shared lexicon of 128 skills
(`ai/app/resources/skill_lexicon.json`, mirrored in `backend/src/seed/skillLexicon.ts`; a test
fails if the two differ).

- Links and e-mail addresses are ignored, so `github.com/jane` is not the skill "GitHub".
- A term matches only as a whole token: "Java" is not found inside "JavaScript", "C" is not found in "C++".
- Longer terms win: "React Native" is not also counted as "React".
- A skill is counted once, however often it is mentioned.
- Names that are ordinary words (Go, Swift, Express) need exact casing; single letters (C, R) must be list items.
- In a resume, skills are read from the skills, summary, experience, projects, certifications and
  education sections, not from the contact header.

**Limits.** Only skills in the lexicon are recognised. Tested on English, single-column, text-based
PDF, DOCX and TXT resumes. Scanned or image-only PDFs, multi-column layouts and other languages are
not supported and not tested.

## 2. Evidence score per skill (0-100)

| Evidence found in the resume | Points |
|---|---|
| Used in a work role | 40 for the first role, 15 for the second, 5 for each further one |
| Used in a project | 25 for the first project, 10 for the second, 5 for each further one |
| Named in a degree or branch of study | 15 (once) |
| Named in a certification | 30 (once) |
| Mentioned anywhere in the resume | 10 |
| Passed a SkillBridge skill check (not from the resume; see section 12) | 15 (once) |
| Portfolio project with a link (not from the resume; see section 15) | Counted as a further project: 25, 10, 5 after the resume's own projects |

Capped at 100. Repeating a skill inside one role or project adds nothing.
Proficiency estimate: 85+ expert, 60+ advanced, 35+ intermediate, otherwise beginner. A skill that
is only listed (10) is always "beginner".

A skill can also be **inferred** from a related one (PostgreSQL implies SQL, React implies
JavaScript). An inferred skill is credited at 70% of the source skill's evidence score.

## 3. Career match (0-100)

How much of a career's skill profile the resume covers.

```
points possible = requirement weight (1-5) x importance (required 3, preferred 2, supporting 1)
points earned   = points possible x (0.5 + 0.5 x evidence/100)   if the skill is evidenced, else 0
score           = 100 x sum(earned) / sum(possible) x (1 - 0.3 x required missing / required total)
```

- **0** means none of the career's skills appear in the resume evidence.
- **100** means every skill is present with the strongest evidence.
- A skill that is only listed earns 55% of its points; one used across roles and projects earns up to 100%.
- Each requirement is reported as `applied`, `listed`, `inferred` or `missing`, with the points it earned.
- `confidence` is the share of matched requirements backed by directly applied evidence.

Career requirements are an editorial baseline curated for this project (14 careers, 109
requirements). They are not derived from labour-market data.

### Worked example

The synthetic resume used in testing lists 11 skills, with one internship and one project.
For *Full Stack Developer* (87 points possible):

| Requirement | Status | Evidence | Earned / possible |
|---|---|---|---|
| JavaScript (required) | inferred from React | 53 | 11.48 / 15 |
| React (required) | applied | 75 | 10.5 / 12 |
| Node.js (required) | applied | 75 | 10.5 / 12 |
| REST APIs (required) | applied | 50 | 9 / 12 |
| Git (required) | listed | 10 | 4.95 / 9 |
| MongoDB (preferred) | applied | 50 | 4.5 / 6 |
| SQL (preferred) | inferred from PostgreSQL | 25 | 3.75 / 6 |
| TypeScript (supporting) | applied | 50 | 2.25 / 3 |
| HTML (preferred) | missing | 0 | 0 / 6 |
| CSS (preferred) | missing | 0 | 0 / 6 |

56.93 / 87 = **65%**, no required skill missing so no penalty.

Before this was corrected the same resume scored **26%**. The causes were defects, not a lack of
skills: "REST APIs" could not be extracted at all, PostgreSQL did not count towards SQL, React and
Node.js gave JavaScript no credit, and one number mixed coverage with depth of evidence. The same
resume still scores **0%** for *UI/UX Designer*, because it shows no design skills.

## 4. Career readiness (0-100)

How deeply the resume evidences the same requirements. It is deliberately stricter than the match
score: for the example above it is **48% ("Developing")**.

```
technical skills            50%   evidence-weighted coverage of the requirements
work experience             25%   share of requirement weight used in a work role
projects                    15%   share of requirement weight used in a project
education and certifications 10%
penalty: up to 40%, scaled by the share of requirements that are required and missing
```

Tiers describe the amount of evidence only: Strong evidence (75+), Solid foundation (50+),
Developing (25+), Early stage. They make no claim about seniority or employability.

## 5. Job match (0-100, or not scored)

Requirements are taken from what the employer wrote: the provider's required-skills list and
qualification bullets, and skills named in the description. A skill is treated as optional when
its sentence says so ("nice to have", "preferred", "a plus").

```
points possible: required skill 2, preferred skill 1
points earned:   possible x (0.5 + 0.5 x evidence/100)   if evidenced, else 0
score = 100 x earned / possible x (1 - 0.3 x required missing / required total)
```

No score is produced, and the reason is returned instead, when:

- the posting names no recognisable skills (`NO_REQUIREMENTS`), or
- the candidate has no evidenced skills yet (`NO_CANDIDATE_EVIDENCE`).

There is no minimum score. Previously every job scored between 65 and 99, postings without skills
were given a fixed list of five, and matched skills were invented when none matched.

## 6. Interview answers (0-100)

**AI rubric (when a provider is available).** The model rates relevance, completeness,
specificity, structure and technical accuracy from 0 to 5 against written anchors and returns
structured output, which is validated before use. Weights: relevance 25, completeness 20,
specificity 20, structure 15, technical accuracy 20. STAR structure is expected for behavioural
questions only. Whatever the model returns, an off-topic answer is capped at 20, an answer under
15 words at 30 and under 40 words at 60.

**Rule-based rubric (fallback, labelled as such).** Relevance 35% (topical overlap with the
question, full at three hits), completeness 25% (full from about 120 words), specificity 20%
(named technologies and measured results), structure 20% (STAR parts for behavioural questions,
explicit reasoning for technical ones). Caps: under 15 words 25, under 40 words 50, off-topic 15,
and never above 80, because it cannot check technical correctness. That dimension is reported as
not assessed.

An unanswered question counts as zero in the session score.

The old scorer gave every answer, including an empty one, at least 30 points, then added points
for single keywords, any action verb and any number. The one-sentence answer below scored 90
under it (measured in the milestone-1 test run).

| Answer | Rule-based rubric now |
|---|---|
| Empty | 0 |
| "I would use caching and make it scalable and fault tolerant." | 2 |
| One sentence with a metric (the answer that used to score 90) | 44 |
| 50 words about hiking (off-topic) | 15 |
| A list of the question's keywords | 25 |
| 130-word structured STAR answer with measured results | 80 |
| 150-word technical design answer, no STAR | 80 |

## 7. Other figures

- **Resume completeness score** (the field is named `atsScore` for compatibility): points for
  which sections and contact details were found. It is not the output of any applicant tracking system.
- **Token usage**: counts reported by the AI provider when available (`source: provider`);
  otherwise estimated from text length (`source: estimated`). Cost is always an estimate from a
  static price table.
- **Confidence** is never invented. Where nothing measures it, the value is `null`:
  - AI service response envelopes carry `confidence: null` and `confidence_basis: not_measured`.
    They used to carry a fixed number chosen by provider name (0.98 for Gemini).
  - The rule-based resume parser attaches no confidence to names, dates, roles or skills. It used
    to attach a per-rule constant between 0.85 and 0.99. Each field reports its extraction method
    instead.
  - Skill normalisation reports how a name was resolved (shared lexicon, alias table, or "not
    recognised; kept as written"), not a similarity percentage: it is a table lookup.
  - When an AI model produces a structured result, any confidence in it is the model's own
    estimate and is passed through as such. No AI path has been run against a live provider.
  - The career match's "confidence" (section 3) is different: it is a defined, calculated share
    of matched requirements backed by applied evidence, not a probability.
  - The development mock provider and the simulated modules below still contain fixed sample
    numbers. The mock never answers chat, interview questions or interview scoring, and resume
    extraction does not use it.
- AI service modules with no live data source (market, salary, GitHub, LinkedIn and the agent
  demos) label every response `data_origin: illustrative_sample`. No user workflow uses them.

## 8. Interview questions

Questions are not scored, but how they are chosen affects what an interview measures.

**When an AI provider answers**, it is given the target role, interview mode, the user's skills
(strongest evidence first), the gaps for the target career, the roles and project names on the
active resume, the job posting if the session was started from one, and the questions asked in the
last ten sessions as ones to avoid. Its output is accepted only if it contains at least the
requested number of usable questions (known category, not a repeat). Otherwise it is discarded
whole: questions are never padded. The session is marked `questionSource: ai`.

**Otherwise** questions come from a built-in bank of 108 (`backend/src/seed/interviewQuestionBank.ts`),
and the session is marked `questionSource: question_bank`. Selection is deterministic for a given
user and session number:

1. The mode fixes the category of each slot (for example a mixed session cycles technical,
   behavioural, project, technical, resume, career).
2. A question is eligible only if the facts it needs exist. A template about a skill needs a skill
   on the profile; one about a project needs a project name on the resume. No skill, employer or
   project is invented, and a test checks that no question names a skill that is not on record.
3. Role-family questions (frontend, backend, data, machine learning, DevOps, security, design,
   mobile, product) are chosen from the role title. An unrecognised title gets the general set.
4. Technical slots rotate between a question about a specific skill, a gap, the role family and a
   general skill question, and questions are spread across different skills.
5. Questions asked in the last ten sessions are avoided while unused ones remain. Six consecutive
   technical sessions of five questions give thirty different questions in the test profile.
6. With a job posting, about half of a technical, career or mixed session is tied to it; other
   modes open with one question about it. A skill the posting names that the profile lacks is
   asked about as a gap, never as existing experience.

## 9. Chat replies

A chat reply is either written by an AI provider or it is a fallback; there is no score.

- An AI reply is stored with `source: ai` and the provider and model that produced it.
- When the provider is unavailable, times out or fails, the stored reply has `source: fallback`.
  Its text says it is not an AI-generated answer and lists only figures already stored for the
  user (target role, number of skills and the three with the strongest evidence, readiness, largest
  gaps, top recommendation, roadmap progress). It does not attempt to answer the question.
- No confidence figure or token cost is attached to a chat reply.
- The development mock provider is never allowed to answer chat, interview questions or interview
  scoring.

## 10. Career Lab: comparison, what-if, counterfactuals, transition plans, freshness

None of these has its own formula. Each calls the career match formula of section 3 on a copy of
the user's skills. The method and its evaluation are written up in
[`NEXTGEN_RESEARCH.md`](NEXTGEN_RESEARCH.md).

- **Comparison.** For each chosen career: the match score, requirements covered by importance,
  how many covered requirements are applied, listed only or inferred, the mean evidence score of
  the covered ones, the skills to acquire and to strengthen, and the score points still open.
  Effort is expressed in skills and points. No time estimate is given: the system has no data on
  how long a skill takes to learn.
- **What-if.** A hypothetical project, role or certification earns the same evidence points as a
  real one (section 2), including diminishing returns and the cap at 100. A skill that newly
  appears also earns the 10 points for being listed. The result is never saved.
- **Counterfactuals.** Each requirement not yet backed by applied evidence is tried as one added
  project and ranked by score gain. A greedy search adds the best remaining change until the
  target score (default: current score plus 20) is met or nothing raises the score further.
- **Transition plan.** Intermediate careers must score higher than the target today, share at
  least one missing skill with it and have fewer missing skills. Up to two are used, ordered from
  closest to the user's current evidence. Each stage lists skills not assigned to an earlier
  stage; its projected score assumes each is used in one project. A stage is "reached" when the
  user's real evidence covers its skills.
- **Freshness.** Only dated evidence counts: the end of a role the skill was used in, a
  confirmation by the user, or an assessment. Used within 18 months is "current", within 36
  "ageing", beyond that "stale"; no dated evidence is "undated". These limits are a policy chosen
  for the tool, not a measured rate of forgetting. **Freshness does not change any score.** A
  user's confirmation is stored as unverified evidence worth 0 points.

Hypothetical scores describe the formula's output. They are not predictions of interviews,
offers or employment.

## 11. Versions and recalculation

Every recalculation records `scoringVersion` (currently `2026.10-3`, changed whenever a formula,
weight or threshold in this document changes) and `taxonomyVersion` (a hash of the career and
requirement data). A transition plan made under other versions is shown as outdated. Which events
recompute which figures is tabulated in `NEXTGEN_RESEARCH.md` (R1).

## 12. Skill checks

A skill check is a multiple-choice quiz written for SkillBridge and scored on the server.

| Rule | Value |
|---|---|
| Skills covered | 8: JavaScript, TypeScript, React, Node.js, Python, SQL, Git, Docker (7 questions each). No other skill can be verified this way |
| Questions per attempt | 5, preferring questions not asked in the previous attempt; option order is shuffled per attempt |
| Pass mark | 4 of 5. Criteria are defined per skill; every skill currently uses this default |
| Time allowed | 15 minutes from starting; a later submission earns nothing |
| Attempts | 3 per skill in any 24 hours; an attempt can be submitted once |
| Effect of a pass | Evidence of kind `assessment`, verification `assessed`, dated that day, **15 points, once per skill**. Passing again updates the date only |
| Effect of a fail | None on any score. The attempt is kept in the user's history |

The 15 points are a chosen value: more than being listed (10), the same as naming the skill in a
degree, less than using it in a project (25). They are not derived from data.

A pass on a skill the resume never mentioned puts the skill on the profile with those 15 points
only; it does not also receive the 10 points for being listed in a resume.

Evidence is kept by kind and never merged: stated in a resume (`stated`), the user's own record
(`self_attested`: a confirmation of recent use, always 0 points, or a portfolio project, section
15), and shown in a skill check (`assessed`). Evidence that did
not come from the resume survives replacing, reprocessing or deleting the resume; scores are then
recomputed from what remains.

**Limits.** A pass means five conceptual questions were answered correctly on one day. It is
labelled "verified by a SkillBridge skill check" and is not a professional certification. It does
not test building anything, nothing is executed, and the quiz is not supervised. With seven
questions per skill and the answers explained after each attempt, a person who retries can pass
by remembering the answers. The questions have not been validated against any external measure
of ability.

## 13. Roadmap schedule

The roadmap orders items by prerequisite (an item that builds on a skill comes after the item
that teaches it). A schedule is added only from figures the user supplies.

| Input | Source |
|---|---|
| Hours per week | Entered by the user (whole hours, 1 to 60). Never assumed: without it the roadmap shows hours of work but no weeks or dates |
| Effort per item | The hours the catalogue states for the resource, when it states hours. Otherwise a planning range by kind of item: learning resource 8 to 20 hours, project 15 to 40, certification 30 to 80, anything else 5 to 15 |

**These ranges are assumptions chosen for planning. SkillBridge has not measured how long any
skill takes to learn.** Every figure derived from them is shown as a range and each item says
whether its hours are stated by the resource or assumed.

- Remaining work is the sum of the ranges of items that are not completed or skipped. An item
  that has been started is planned in full, because how much of it is done is not recorded.
- Weeks remaining = remaining hours / hours per week, rounded up, for the low and the high end.
  Finish dates are today plus those weeks. Weeks in which the user cannot study are not modelled.
- An item is "blocked" while a prerequisite item of the same roadmap is unfinished. The next item
  is the first unfinished one that is not blocked.
- The schedule is computed on every read, so it follows progress and the weekly hours immediately.
  The dashboard shows the same figures.

**What a regeneration keeps.** The roadmap is rebuilt whenever recommendations are (new resume,
passed skill check, changed target role). Items are recognised by title and keep their id.
Anything the user has started, completed or skipped stays, with its dates, even when the
recommendation behind it is gone. An untouched item whose recommendation is gone is removed; the
roadmap history records each removal and whether the skill is now on the profile.

## 14. Practice project suggestions

Fifteen project briefs are curated in `backend/src/seed/projectBriefs.ts`. Nothing is generated at
run time. For one career:

1. The gaps are the requirements the user has not yet shown in a role or project (status missing,
   listed or inferred), exactly as in the counterfactual explanation of section 10.
2. A brief is suggested only if it exercises at least one of those gaps. Where a brief offers
   alternatives (one mobile framework, one dashboard tool), only the alternative worth most to
   that career is counted.
3. Suggestions are ranked by the change in the career's match score if the practised skills had
   project evidence. This is the what-if calculation of section 10, so the figure shown equals
   what the Career Lab returns for the same change. Ties: more required gaps closed, then less
   assumed effort.
4. The five highest are shown, each with the gap skills it practises, their importance and
   current status, its tasks and deliverables, and an assumed effort range. With weekly hours
   set, the range is also given in weeks.

**A project taken on here is a record, not evidence.** Its tasks and its "complete" status are
the user's own report and change no skill, score or recommendation. The score change shown is
hypothetical. Effort ranges are assumptions set per brief, not measurements.

## 15. Portfolio evidence

A portfolio entry is finished work the user records: title, skills used, the day it was finished
and, optionally, a link. It is the user's own statement. SkillBridge does not open the link,
check who made the work or judge its quality.

| Entry | Effect on each skill it names |
|---|---|
| With an https link | Counts as one more project: 25, 10 or 5 points on the project scale of section 2, continuing after the projects on the resume. Dated on the completion day. Verification `self_attested` |
| Without a link | Recorded and dated (it updates freshness). 0 points. It does not put a new skill on the profile |

- A project on a resume and a portfolio entry with a link are treated alike because both are
  unchecked statements by the user. The same piece of work entered in both places is counted
  twice; nothing detects that.
- A skill known only from the portfolio has its project points and no "listed in a resume" points.
- An entry never makes a skill "verified". A skill is shown as verified by skill check only when
  the user passed that skill check (section 12), and the two kinds of evidence are stored as
  separate records.
- An entry made from a practice project (section 14) is accepted only after the user has marked
  that project complete, and once per project.
- Portfolio evidence is rebuilt from the entries whenever an entry or the resume changes, so it
  is never added twice. Removing an entry removes exactly its evidence. Entries survive replacing
  or deleting the resume; after a deletion the first portfolio project for a skill counts as the
  first project.
- Limits: 30 entries, 8 skills per entry, skills must be ones SkillBridge recognises, completion
  date not in the future. Files cannot be uploaded; only a link is stored.

**Sharing.** Entries are private. A user can switch on a public link (a random 48-character
token); it shows only entries marked as shared, with title, description, date, link and skills.
The owner's name appears only if they allow it. No scores, resume data, ids or contact details
are included. Switching sharing off disables the link permanently; switching it on again issues a
new one.

## 16. Learning streaks and notifications

**Streak.** A day is active when SkillBridge recorded at least one of: a roadmap item completed,
a skill check submitted (passed or not), a practice project task ticked off or the project marked
complete, a portfolio entry added, a mock interview completed. Opening the app, uploading a
resume or saving a job does not count, and nothing the user did elsewhere can be entered.

- Days are UTC calendar days, because no time zone is stored for a user. Someone far from UTC
  will see the day change at an hour that is not their midnight.
- Current streak: consecutive active days ending today, or ending yesterday (a streak stays
  alive until the end of the following day). Longest streak and active days in the last 30 are
  reported alongside. Several activities on one day count as one day.
- A streak is information only. It changes no score.

**Notifications.** In-app only: nothing is sent by e-mail, SMS or push. Two kinds, each **off
until the user switches it on**:

| Kind | Created when |
|---|---|
| Milestone | A skill check is passed for the first time; a roadmap phase or the whole roadmap is finished; a practice project is marked complete; the streak reaches 3, 7, 14 or 30 days |
| Reminder | No recorded activity for 7 days while a roadmap item is still open; a roadmap item has been "in progress" for 14 days |

- One notification per occasion. Repeating the occasion (passing the same skill check again,
  reopening and completing a project) creates nothing new, and a dismissed notification does not
  come back.
- A milestone reached while the kind was off is not announced later.
- Reminders are worked out when the user opens the app. Nothing runs on a timer, so a reminder
  cannot reach a user who does not open SkillBridge.
- Switching a kind off stops new notifications of that kind. Existing ones stay until dismissed.
- The 7- and 14-day limits and the streak steps are chosen values.

## 17. Free learning resources

The catalogue (`backend/src/seed/learningResources.ts`) holds 39 links to official documentation
and first-party tutorials. For one career, the resources shown are those whose skill is one of
the user's gaps (as in section 10), in the order of the gaps. A gap for which the catalogue has
nothing is named as such; it is not hidden.

- Coverage is partial: 39 of the 52 distinct skills that careers require have a resource. The 13
  without one are mostly non-technical (communication, user research, product strategy and
  similar).
- Every resource is third-party content on another site. SkillBridge does not host it. The links
  were free to read when they were listed; they have **not been re-checked**, and nothing here
  promises a site stays free or keeps its content. No request is made to those sites by
  SkillBridge.
- No rating, duration, price or completion rate is shown, because none is known.
- "Saved" and "worked through" are the user's private notes. They are not course completions,
  are not learning activity for the streak, and change no score.

## 18. Next steps (next-best-action ranking)

The dashboard's "next steps" are ranked by a fixed formula over published factors:

```
score = impact + 4 x min(2, required gaps addressed) + 3 if it fits two weeks of your hours - 2 if a skill must be learnt first
```

Impact is the hypothetical change in the match score for the target career (section 10). Market
demand is a declared factor with weight 0 because no market data exists. Each action shows its
factors, its score and where it would stand if actions were ordered by gap importance alone. The
method, the baseline comparison and its limits are in [`NEXTGEN_RESEARCH.md`](NEXTGEN_RESEARCH.md)
(R3). The what-if engine also accepts a hypothetical passed skill check (`pass_assessment`): 15
points once per skill, without the "listed in a resume" points for a skill new to the profile.
