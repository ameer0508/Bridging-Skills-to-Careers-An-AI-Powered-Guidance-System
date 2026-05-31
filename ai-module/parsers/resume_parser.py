"""
Universal Resume Parser
Automatically detects file type and extracts text
"""

import os
from typing import Optional
import logging
from .pdf_parser import extract_pdf
from .docx_parser import extract_docx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_resume(file_path: str) -> Optional[str]:
    """
    Extract text from resume (auto-detects PDF or DOCX)
    
    Args:
        file_path (str): Path to resume file
        
    Returns:
        Optional[str]: Extracted text or None if error occurs
    """
    try:
        if not os.path.exists(file_path):
            logger.error(f"File does not exist: {file_path}")
            return None
        
        # Get file extension
        _, file_extension = os.path.splitext(file_path)
        file_extension = file_extension.lower()
        
        # Route to appropriate parser
        if file_extension == '.pdf':
            logger.info(f"Detected PDF file: {file_path}")
            return extract_pdf(file_path)
        elif file_extension in ['.docx', '.doc']:
            logger.info(f"Detected DOCX file: {file_path}")
            return extract_docx(file_path)
        else:
            logger.error(f"Unsupported file format: {file_extension}")
            return None
            
    except Exception as e:
        logger.error(f"Error in extract_resume: {str(e)}")
        return None
