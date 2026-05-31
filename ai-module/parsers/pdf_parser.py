"""
PDF Resume Parser
Extracts text content from PDF files
"""

import PyPDF2
from typing import Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_pdf(file_path: str) -> Optional[str]:
    """
    Extract text from PDF resume
    
    Args:
        file_path (str): Path to PDF file
        
    Returns:
        Optional[str]: Extracted text or None if error occurs
    """
    try:
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            
            logger.info(f"Processing PDF with {num_pages} pages")
            
            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                text += page.extract_text()
        
        if not text.strip():
            logger.warning(f"No text extracted from {file_path}")
            return None
            
        logger.info(f"Successfully extracted {len(text)} characters from PDF")
        return text.strip()
        
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        return None
    except PyPDF2.errors.PdfReadError as e:
        logger.error(f"PDF read error: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error extracting PDF: {str(e)}")
        return None
