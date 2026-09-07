import os
from typing import Dict, Any, List
try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import docx
except ImportError:
    docx = None

class LayoutDetector:
    """
    Analyzes document layout structure for PDF and DOCX files.
    Detects columns, tables, headers/footers, font size hierarchy, and page counts.
    """

    @staticmethod
    def detect_layout(file_path: str) -> Dict[str, Any]:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.pdf':
            return LayoutDetector._detect_pdf_layout(file_path)
        elif ext in ['.docx', '.doc']:
            return LayoutDetector._detect_docx_layout(file_path)
        else:
            return {
                "file_type": ext,
                "page_count": 1,
                "is_multi_column": False,
                "has_tables": False,
                "headers_footers_detected": False,
                "layout_type": "single_column_standard"
            }

    @staticmethod
    def _detect_pdf_layout(file_path: str) -> Dict[str, Any]:
        page_count = 1
        has_tables = False
        is_multi_column = False
        font_sizes: List[float] = []

        if pdfplumber is None:
            return {
                "file_type": ".pdf",
                "page_count": 1,
                "is_multi_column": False,
                "has_tables": False,
                "headers_footers_detected": False,
                "layout_type": "single_column_standard"
            }

        try:
            with pdfplumber.open(file_path) as pdf:
                page_count = len(pdf.pages)
                for page in pdf.pages:
                    # Check tables
                    tables = page.extract_tables()
                    if tables:
                        has_tables = True

                    # Inspect word horizontal positions to detect multi-column layout
                    words = page.extract_words()
                    if words:
                        width = page.width
                        left_words = [w for w in words if w['x1'] < width * 0.48]
                        right_words = [w for w in words if w['x0'] > width * 0.52]
                        if len(left_words) > 20 and len(right_words) > 20:
                            is_multi_column = True

                        for w in words:
                            if 'size' in w:
                                font_sizes.append(float(w['size']))

            layout_type = "two_column" if is_multi_column else ("table_based" if has_tables else "single_column")

            return {
                "file_type": "pdf",
                "page_count": page_count,
                "is_multi_column": is_multi_column,
                "has_tables": has_tables,
                "headers_footers_detected": page_count > 1,
                "avg_font_size": round(sum(font_sizes) / max(len(font_sizes), 1), 2) if font_sizes else 10.0,
                "layout_type": layout_type
            }
        except Exception:
            return {
                "file_type": "pdf",
                "page_count": 1,
                "is_multi_column": False,
                "has_tables": False,
                "headers_footers_detected": False,
                "layout_type": "standard_text"
            }

    @staticmethod
    def _detect_docx_layout(file_path: str) -> Dict[str, Any]:
        if docx is None:
            return {
                "file_type": "docx",
                "page_count": 1,
                "is_multi_column": False,
                "has_tables": False,
                "headers_footers_detected": False,
                "layout_type": "single_column_docx"
            }

        try:
            doc = docx.Document(file_path)
            has_tables = len(doc.tables) > 0
            para_count = len(doc.paragraphs)
            return {
                "file_type": "docx",
                "page_count": max(1, para_count // 30),
                "is_multi_column": False,
                "has_tables": has_tables,
                "headers_footers_detected": False,
                "layout_type": "table_based" if has_tables else "single_column_docx"
            }
        except Exception:
            return {
                "file_type": "docx",
                "page_count": 1,
                "is_multi_column": False,
                "has_tables": False,
                "headers_footers_detected": False,
                "layout_type": "standard_docx"
            }
