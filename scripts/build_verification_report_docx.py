import os
import re
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcMar = parse_xml(f'''<w:tcMar {nsdecls("w")}>
        <w:top w:w="{top}" w:type="dxa"/>
        <w:bottom w:w="{bottom}" w:type="dxa"/>
        <w:left w:w="{left}" w:type="dxa"/>
        <w:right w:w="{right}" w:type="dxa"/>
    </w:tcMar>''')
    cell._tc.get_or_add_tcPr().append(tcMar)

def set_table_borders(table, border_color="333333", inside_color="CCCCCC"):
    tblPr = table._tbl.tblPr
    tblBorders = parse_xml(f'''<w:tblBorders {nsdecls("w")}>
        <w:top w:val="single" w:sz="8" w:space="0" w:color="{border_color}"/>
        <w:bottom w:val="single" w:sz="8" w:space="0" w:color="{border_color}"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{inside_color}"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="{inside_color}"/>
    </w:tblBorders>''')
    tblPr.append(tblBorders)

def add_header_footer(doc):
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        
        # Header
        header = s.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("SkillBridge Full-Stack Verification & QA Report | Phase-II")
        hrun.font.name = "Times New Roman"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(120, 120, 120)
        
        # Footer
        footer = s.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Automated Quality Assurance & Verification Audit - New Horizon College of Engineering")
        frun.font.name = "Times New Roman"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(120, 120, 120)

def main():
    doc = docx.Document()
    add_header_footer(doc)

    # Base style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = RGBColor(40, 40, 40)
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(4)

    # Document Header Title
    p_pre = doc.add_paragraph()
    p_pre.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_pre = p_pre.add_run("TECHNICAL VERIFICATION & QUALITY AUDIT REPORT")
    r_pre.font.name = "Times New Roman"
    r_pre.font.size = Pt(10)
    r_pre.font.bold = True
    r_pre.font.color.rgb = RGBColor(100, 100, 100)
    p_pre.paragraph_format.space_after = Pt(2)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("SKILLBRIDGE: FULL-STACK VERIFICATION & QUALITY ASSURANCE DELIVERABLE")
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(18)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(20, 30, 50)
    p_title.paragraph_format.space_after = Pt(8)

    # Metadata Box Table
    meta_tbl = doc.add_table(rows=4, cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_tbl.autofit = False
    col_widths = [Inches(2.2), Inches(4.3)]
    set_table_borders(meta_tbl, border_color="444444", inside_color="DDDDDD")
    
    meta_data = [
        ("Project Title:", "BRIDGING SKILLS TO CAREERS: AN AI-POWERED GUIDANCE SYSTEM"),
        ("Evaluation Date & State:", "November 12, 2026 | Active Multi-Tier Local Deployment"),
        ("System Architecture:", "Frontend (:3000), Core Backend (:5000), AI Microservice (:8000), Local DB (:5000)"),
        ("Overall Audit Verdict:", "PASSED / PRODUCTION-READY GRADE (576 Checks Executed, 0 5xx Errors)")
    ]

    for i, (k, v) in enumerate(meta_data):
        row = meta_tbl.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = col_widths[0]
        c1.width = col_widths[1]
        set_cell_background(c0, "F5F5F5")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=80, bottom=80, left=120, right=120)
        set_cell_margins(c1, top=80, bottom=80, left=120, right=120)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(10)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(v)
        r1.font.size = Pt(10)
        if "PASSED" in v:
            r1.font.bold = True
            r1.font.color.rgb = RGBColor(0, 100, 0)

    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_after = Pt(8)

    # Read markdown source
    md_path = r'C:\Users\skame\.gemini\antigravity\brain\bb5181ef-f544-4b81-bbc8-da97b9e294a2\SkillBridge_Full_Stack_Verification_Report.md'
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    lines = md_text.splitlines()
    in_code_block = False
    code_lines = []
    in_table = False
    table_lines = []

    def flush_code(lines_to_flush):
        if not lines_to_flush:
            return
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.rows[0].cells[0]
        cell.width = Inches(6.5)
        set_cell_background(cell, "F8F9FA")
        set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
        set_table_borders(tbl, border_color="BBBBBB", inside_color="BBBBBB")
        p = cell.paragraphs[0]
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run("\n".join(lines_to_flush))
        run.font.name = "Consolas"
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(30, 30, 30)
        p_sp = doc.add_paragraph()
        p_sp.paragraph_format.space_after = Pt(4)

    def flush_table(tbl_lines):
        if not tbl_lines:
            return
        # Parse markdown table
        rows_data = []
        for line in tbl_lines:
            if re.match(r'^\s*\|?\s*[-:]+[-| :]*$', line):
                continue
            cells = [c.strip() for c in line.split('|')]
            if line.startswith('|'):
                cells = cells[1:]
            if line.endswith('|'):
                cells = cells[:-1]
            if any(cells):
                rows_data.append(cells)
        if not rows_data:
            return
        
        num_cols = max(len(r) for r in rows_data)
        tbl = doc.add_table(rows=len(rows_data), cols=num_cols)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl, border_color="000000", inside_color="CCCCCC")

        for r_idx, r_data in enumerate(rows_data):
            row = tbl.rows[r_idx]
            is_header = (r_idx == 0)
            for c_idx in range(num_cols):
                cell = row.cells[c_idx]
                val = r_data[c_idx] if c_idx < len(r_data) else ""
                val = val.replace("**", "").replace("`", "")
                
                if is_header:
                    set_cell_background(cell, "EEEEEE")
                else:
                    set_cell_background(cell, "FFFFFF" if r_idx % 2 == 1 else "F9F9F9")
                
                set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
                p = cell.paragraphs[0]
                p.paragraph_format.line_spacing = 1.05
                p.paragraph_format.space_after = Pt(0)
                
                run = p.add_run(val)
                run.font.name = "Times New Roman"
                run.font.size = Pt(9.5 if not is_header else 10)
                if is_header:
                    run.font.bold = True
                if val == "PASS":
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(0, 120, 0)

        p_sp = doc.add_paragraph()
        p_sp.paragraph_format.space_after = Pt(6)

    # Skip document title and preamble as already written
    idx = 0
    while idx < len(lines):
        line = lines[idx]
        
        # Check code fence
        if line.strip().startswith("```"):
            if in_code_block:
                in_code_block = False
                flush_code(code_lines)
                code_lines = []
            else:
                if in_table:
                    in_table = False
                    flush_table(table_lines)
                    table_lines = []
                in_code_block = True
                code_lines = []
            idx += 1
            continue

        if in_code_block:
            code_lines.append(line)
            idx += 1
            continue

        # Check markdown table
        if line.strip().startswith("|") and "|" in line[1:]:
            if not in_table:
                in_table = True
                table_lines = [line]
            else:
                table_lines.append(line)
            idx += 1
            continue
        else:
            if in_table:
                in_table = False
                flush_table(table_lines)
                table_lines = []

        # Normal text processing
        stripped = line.strip()
        if not stripped:
            idx += 1
            continue

        # Skip original H1 and metadata
        if stripped.startswith("# SkillBridge:") or stripped.startswith("**Project Title:**") or stripped.startswith("**Evaluation Date:**") or stripped.startswith("**Stack Components:**") or stripped.startswith("**Verification Scope:**"):
            idx += 1
            continue

        if stripped.startswith("---"):
            idx += 1
            continue

        # Heading 2
        if stripped.startswith("## "):
            h_text = stripped[3:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(h_text)
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            r.font.bold = True
            r.font.color.rgb = RGBColor(15, 30, 60)
            idx += 1
            continue

        # Heading 3
        if stripped.startswith("### "):
            h_text = stripped[4:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.keep_with_next = True
            r = p.add_run(h_text)
            r.font.name = "Times New Roman"
            r.font.size = Pt(12)
            r.font.bold = True
            r.font.color.rgb = RGBColor(30, 50, 80)
            idx += 1
            continue

        # Bullet items (* or -)
        if stripped.startswith("* ") or stripped.startswith("- "):
            b_text = stripped[2:].strip()
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            
            # Parse bold prefix like **Item:**
            parts = re.split(r'(\*\*.*?\*\*)', b_text)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    r = p.add_run(part[2:-2])
                    r.font.bold = True
                else:
                    # Clean inline backticks
                    clean_part = part.replace('`', '')
                    p.add_run(clean_part)
            idx += 1
            continue

        # Numbered items (1. 2. etc)
        m_num = re.match(r'^(\d+)\.\s+(.*)', stripped)
        if m_num:
            n_text = m_num.group(2)
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            parts = re.split(r'(\*\*.*?\*\*)', n_text)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    r = p.add_run(part[2:-2])
                    r.font.bold = True
                else:
                    p.add_run(part.replace('`', ''))
            idx += 1
            continue

        # Standard paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.15
        parts = re.split(r'(\*\*.*?\*\*)', stripped)
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                r = p.add_run(part[2:-2])
                r.font.bold = True
            else:
                p.add_run(part.replace('`', ''))
        idx += 1

    # Cleanup table if file ended inside table
    if in_table:
        flush_table(table_lines)
    if in_code_block:
        flush_code(code_lines)

    # Save outputs
    out_docx_1 = r'C:\Users\skame\Downloads\SkillBridge_Full_Stack_Verification_Report.docx'
    out_docx_2 = r'C:\Users\skame\Downloads\SkillBridge_Report\SkillBridge_Full_Stack_Verification_Report.docx'
    
    doc.save(out_docx_1)
    doc.save(out_docx_2)
    print(f"Document successfully created and saved to:\n  - {out_docx_1}\n  - {out_docx_2}")

    # Also copy the 80-page main report docx to user's downloads folder for immediate access
    src_main_report = r'E:\Bridging Skills to Careers - An AI Powered Guidance System\reports\SkillBridge_Chapters_1_to_9_Report.docx'
    dst_main_1 = r'C:\Users\skame\Downloads\SkillBridge_Chapters_1_to_9_Report.docx'
    dst_main_2 = r'C:\Users\skame\Downloads\SkillBridge_Report\SkillBridge_Chapters_1_to_9_Report.docx'
    if os.path.exists(src_main_report):
        shutil.copyfile(src_main_report, dst_main_1)
        shutil.copyfile(src_main_report, dst_main_2)
        print(f"Also copied Chapters 1 to 9 report to:\n  - {dst_main_1}\n  - {dst_main_2}")

if __name__ == '__main__':
    main()

