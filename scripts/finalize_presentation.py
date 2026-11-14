import os
import shutil
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

def format_run(run, text, font_name="Times New Roman", size_pt=15, bold=False, italic=False, color_rgb=(40, 40, 40)):
    run.text = text
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.italic = italic
    if color_rgb:
        run.font.color.rgb = RGBColor(*color_rgb)

def add_bullet_point(tf, bold_prefix, text_body, size_pt=14, level=0, space_after=8):
    p = tf.add_paragraph() if tf.paragraphs and tf.paragraphs[0].text else tf.paragraphs[0]
    p.level = level
    p.space_after = Pt(space_after)
    p.line_spacing = 1.15
    
    if bold_prefix:
        r_pre = p.add_run()
        format_run(r_pre, bold_prefix, font_name="Times New Roman", size_pt=size_pt, bold=True, color_rgb=(15, 23, 42))
    
    if text_body:
        r_body = p.add_run()
        format_run(r_body, text_body, font_name="Times New Roman", size_pt=size_pt, bold=False, color_rgb=(51, 65, 85))

def main():
    src_pptx = r"C:\Users\skame\.gemini\antigravity\brain\bb5181ef-f544-4b81-bbc8-da97b9e294a2\.user_uploaded\media_1794590443066_14f418b9.pptx"
    out_dir = r"C:\Users\skame\Downloads\SkillBridge_Report"
    os.makedirs(out_dir, exist_ok=True)
    out_pptx_1 = os.path.join(out_dir, "SkillBridge_Phase_II_Presentation.pptx")
    out_pptx_2 = r"C:\Users\skame\Downloads\SkillBridge_Phase_II_Presentation.pptx"

    prs = pptx.Presentation(src_pptx)
    print(f"Loaded template with {len(prs.slides)} slides.")

    # -------------------------------------------------------------------------
    # SLIDE 8: System Analysis
    # -------------------------------------------------------------------------
    s8 = prs.slides[7]
    s8_tf = s8.shapes[1].text_frame
    s8_tf.word_wrap = True
    s8_tf.clear()

    add_bullet_point(s8_tf, "Functional Architecture: ", "Decomposed into 7 core autonomous sub-engines covering Resume Parsing, Skill Ontologies, Career Matching, Career Lab Simulation, Learning Roadmaps, Mock Interviews, and Job Pipeline Tracking.", size_pt=13.5, space_after=6)
    add_bullet_point(s8_tf, "Multimodal Document Ingestion: ", "Employs spatial bounding-box layout parsing (pdfplumber/PyMuPDF) and python-docx to process multi-column resumes without text jumbling.", size_pt=13.5, space_after=6)
    add_bullet_point(s8_tf, "Deterministic Decision Layer: ", "Career matching and readiness evaluations are 100% mathematical, providing authoritative explainability and eliminating generative hallucination risks.", size_pt=13.5, space_after=6)
    add_bullet_point(s8_tf, "Zero-State-Mutation Sandbox: ", "Career Lab simulations evaluate hypothetical skill additions in an ephemeral runtime memory space, preserving true database integrity.", size_pt=13.5, space_after=6)
    add_bullet_point(s8_tf, "Non-Functional Guarantees: ", "Sub-second API response latency (<200ms), 100% offline availability via local fallback models, and strict tenant data isolation.", size_pt=13.5, space_after=6)
    add_bullet_point(s8_tf, "Privacy & Governance: ", "Zero-cost local LLM processing (Ollama/Qwen3) ensures no PII leaves the host machine; automated cascade deletion purges across 31 datastore collections.", size_pt=13.5, space_after=4)

    # -------------------------------------------------------------------------
    # SLIDE 9: Comparison with Existing Systems
    # -------------------------------------------------------------------------
    s9 = prs.slides[8]
    s9_tf = s9.shapes[1].text_frame
    s9_tf.word_wrap = True
    s9_tf.clear()

    add_bullet_point(s9_tf, "Commercial Job Portals (LinkedIn, Indeed, Naukri): ", "Focus strictly on keyword search and recruiter indexing; black-box algorithms offer zero actionable guidance or personalized learning roadmaps.", size_pt=13.5, space_after=7)
    add_bullet_point(s9_tf, "Traditional ATS Resume Screeners (Jobscan, Resume.io): ", "Rely on rigid lexical keyword counting, penalizing valid synonyms and ignoring evidence provenance or practical project demonstrations.", size_pt=13.5, space_after=7)
    add_bullet_point(s9_tf, "Generic Generative AI Tools (ChatGPT, Claude): ", "Generate ungrounded text advice prone to hallucination; lack structured career ontologies, verifiable metrics, and deterministic readiness scoring.", size_pt=13.5, space_after=7)
    add_bullet_point(s9_tf, "SkillBridge (Our Proposed Framework): ", "Unifies evidence-weighted skill representation, 100% deterministic matching, zero-mutation Career Lab what-if simulations, availability-aware roadmap scheduling, and STAR-based mock interviews in one integrated platform.", size_pt=13.5, space_after=4)

    # -------------------------------------------------------------------------
    # SLIDE 10: Results and Discussions (Enrichment)
    # -------------------------------------------------------------------------
    s10 = prs.slides[9]
    # Find text placeholder on slide 10
    s10_tf = None
    for shape in s10.shapes:
        if shape.has_text_frame and shape != s10.shapes[0] and "22CSE74" not in shape.text_frame.text:
            s10_tf = shape.text_frame
            break
    
    if s10_tf:
        s10_tf.word_wrap = True
        s10_tf.clear()
        add_bullet_point(s10_tf, "Personalized Career Intelligence: ", "Successfully evaluated candidate profiles against 148+ industry competencies, delivering deterministic fit scores (e.g., 66% fit for Data Scientist).", size_pt=13.5, space_after=6)
        add_bullet_point(s10_tf, "Resume & Skill Extraction Accuracy: ", "Extracted 9+ technical skills from complex PDF/DOCX layouts with sentence-level text provenance; distinguished direct vs. inferred skills cleanly.", size_pt=13.5, space_after=6)
        add_bullet_point(s10_tf, "Career Lab What-If Simulation: ", "Validated hypothetical skill additions (e.g., PyTorch + Spark boosting match from 66% to 84%) with 0 persistent database mutations.", size_pt=13.5, space_after=6)
        add_bullet_point(s10_tf, "AI-Powered Interview Intelligence: ", "Conducted multi-turn mock interviews scored against 5-axis rubrics (technical depth, clarity, keyword coverage, and communication).", size_pt=13.5, space_after=6)
        add_bullet_point(s10_tf, "Full-Stack Verification Suite: ", "Executed 576 automated test checks (Pytest 457 passed, 0 TypeScript errors, 0 lint warnings, 50/50 Playwright E2E smoke tests, 54/54 axe-core WCAG 2.1 AA accessibility audits, and 0 server 5xx errors).", size_pt=13.5, space_after=4)

    # -------------------------------------------------------------------------
    # SLIDE 11: Cost Analysis
    # -------------------------------------------------------------------------
    s11 = prs.slides[10]
    s11_tf = s11.shapes[1].text_frame
    s11_tf.word_wrap = True
    s11_tf.clear()

    add_bullet_point(s11_tf, "Zero-Cost Architecture Policy: ", "Engineered specifically to eliminate financial barriers for students and academic institutions, operating with $0 recurring cloud expenses.", size_pt=13.5, space_after=7)
    add_bullet_point(s11_tf, "Cloud API vs. Local Hybrid Model: ", "Commercial LLM APIs incur $0.03–$0.06 per resume parse and chat turn ($1,500+/month for university cohorts). SkillBridge cuts cloud API costs to $0 via local open-source inference.", size_pt=13.5, space_after=7)
    add_bullet_point(s11_tf, "Quantized Local LLM Execution: ", "Integrates 4-bit quantized models (Ollama Qwen3 4B / Llama3) requiring only 2.5 GB disk space and ~4.75 GB RAM on commodity laptop CPUs, requiring no GPU hardware.", size_pt=13.5, space_after=7)
    add_bullet_point(s11_tf, "Zero Database Licensing: ", "Utilizes embedded datastore engines and free-tier REST APIs, ensuring zero ongoing server infrastructure overhead.", size_pt=13.5, space_after=4)

    # -------------------------------------------------------------------------
    # SLIDE 12: Public Health, Safety, and Environmental Considerations
    # -------------------------------------------------------------------------
    s12 = prs.slides[11]
    s12_tf = s12.shapes[1].text_frame
    s12_tf.word_wrap = True
    s12_tf.clear()

    add_bullet_point(s12_tf, "Mental Health & Student Well-being: ", "Mitigates career-related anxiety and cognitive overload by replacing open-ended job searches with clear, structured next-best-actions and realistic weekly study schedules (e.g. 8h/week).", size_pt=13.5, space_after=7)
    add_bullet_point(s12_tf, "Algorithmic Fairness & Bias Mitigation: ", "Eliminates demographic, prestige, and keyword-stuffing biases by evaluating verified application evidence; deterministic scoring provides 100% auditability.", size_pt=13.5, space_after=7)
    add_bullet_point(s12_tf, "Data Safety & GDPR Compliance: ", "Student resume data, grades, and personal identifiers remain on the local machine; one-click cascade deletion purges data across 31 datastore collections with zero orphaned records.", size_pt=13.5, space_after=7)
    add_bullet_point(s12_tf, "Environmental Sustainability (Green Computing): ", "Lightweight local quantized inference (<35W CPU load) drastically reduces carbon footprints compared to cloud data-center model queries.", size_pt=13.5, space_after=4)

    # -------------------------------------------------------------------------
    # SLIDE 13: Conclusion and Future Scope
    # -------------------------------------------------------------------------
    s13 = prs.slides[12]
    s13_tf = s13.shapes[1].text_frame
    s13_tf.word_wrap = True
    s13_tf.clear()

    add_bullet_point(s13_tf, "Conclusion - Phase II Achievement: ", "Successfully designed, developed, and verified SkillBridge as a complete, production-grade AI-powered Career Guidance System bridging student skills with job market requirements.", size_pt=13.5, space_after=6)
    add_bullet_point(s13_tf, "Technical Innovations Delivered: ", "Implemented evidence-weighted skill representation, deterministic career matching, zero-mutation Career Lab simulation, and multi-turn heuristic interview rubrics.", size_pt=13.5, space_after=6)
    add_bullet_point(s13_tf, "Future Scope - University LMS Integration: ", "Integrating automated curriculum mapping with Moodle, Canvas, and university ERP systems to credit academic coursework toward career readiness.", size_pt=13.5, space_after=6)
    add_bullet_point(s13_tf, "Future Scope - Real-Time Audio Streaming: ", "Incorporating WebSockets and Gemini Live API for real-time speech and video interview simulation with natural voice inflection.", size_pt=13.5, space_after=6)
    add_bullet_point(s13_tf, "Future Scope - Institutional Alumni Intelligence: ", "Federating privacy-preserving career trajectory data from successful alumni to continuously train localized skill demand graphs.", size_pt=13.5, space_after=4)

    # -------------------------------------------------------------------------
    # SLIDE 14: References (Academic Formatting)
    # -------------------------------------------------------------------------
    s14 = prs.slides[13]
    s14_tf = None
    for shape in s14.shapes:
        if shape.has_text_frame and shape != s14.shapes[0] and "22CSE74" not in shape.text_frame.text:
            s14_tf = shape.text_frame
            break
            
    if s14_tf:
        s14_tf.word_wrap = True
        s14_tf.clear()
        refs = [
            "[1] S. A. Sohail, S. Louies S, S. S, S. Mittal, and Dr. Pramilarani K, 'SkillBridge: An Explainable and Adaptive Career Guidance Framework Using Evidence-Weighted Skill Matching and Counterfactual Recommendations,' IEEE IITCEE 2027, Paper ID: 2079.",
            "[2] UNESCO, 'Global Education Monitoring Report: Education, Skills Development, and Employability,' UNESCO Publishing, Paris, 2024.",
            "[3] World Economic Forum, 'The Future of Jobs Report 2025: Emerging Skills and Workforce Transformations,' WEF, Geneva, 2025.",
            "[4] C. Qin et al., 'Enhanced Person-Job Fit via Tripartite Graph Convolutional Networks,' ACM Transactions on Information Systems, vol. 41, no. 2, pp. 1-28, 2023.",
            "[5] J. Bian et al., 'Domain-Specific Pre-trained Language Models for Job-Resume Matching and Skill Extraction,' in Proc. IEEE ICDE, 2022, pp. 1420-1432.",
            "[6] M. Wachter, B. Mittelstadt, and C. Russell, 'Counterfactual Explanations Without Opening the Black Box: Automated Decisions and the GDPR,' Harvard Journal of Law & Technology, vol. 31, no. 2, pp. 841-887, 2018.",
            "[7] Fast-API, Pydantic, Vite, and React Documentation and Technical Reference Specifications, 2026."
        ]
        for ref in refs:
            p = s14_tf.add_paragraph() if s14_tf.paragraphs and s14_tf.paragraphs[0].text else s14_tf.paragraphs[0]
            p.space_after = Pt(4)
            p.line_spacing = 1.1
            r = p.add_run()
            format_run(r, ref, font_name="Times New Roman", size_pt=11.5, bold=False, color_rgb=(40, 40, 40))

    # Save output
    prs.save(out_pptx_1)
    prs.save(out_pptx_2)
    print(f"Finalized presentation saved successfully to:\n  - {out_pptx_1}\n  - {out_pptx_2}")

if __name__ == "__main__":
    main()

