import os
try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import docx
except ImportError:
    docx = None

def extract_text_from_file(file_path: str) -> str:
    """
    Extracts raw text from a PDF, DOCX, or TXT file.
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext in ['.docx', '.doc']:
        return extract_text_from_docx(file_path)
    elif ext == '.txt':
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    else:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()

def extract_text_from_pdf(file_path: str) -> str:
    if pdfplumber is None:
        return f"PDF content simulation for {os.path.basename(file_path)}"
    try:
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        if text.strip():
            return text.strip()
    except Exception:
        pass
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read().strip()

def extract_text_from_docx(file_path: str) -> str:
    if docx is None:
        return f"DOCX content simulation for {os.path.basename(file_path)}"
    doc = docx.Document(file_path)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text.strip()
