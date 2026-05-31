"""
Skill Extraction Engine
Uses spaCy NER and custom skill dictionary to extract technical skills
"""

import re
import spacy
from typing import List, Dict, Set
import logging
from ..datasets.skill_dictionary import get_all_skills, SKILL_DICTIONARY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SkillExtractor:
    """
    Advanced skill extraction using NLP and pattern matching
    """
    
    def __init__(self):
        """Initialize skill extractor with spaCy model"""
        try:
            # Load spaCy model
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("spaCy model loaded successfully")
        except OSError:
            logger.warning("spaCy model not found. Run: python -m spacy download en_core_web_sm")
            self.nlp = None
        
        # Load skill dictionary
        self.all_skills = get_all_skills()
        self.skill_dict = SKILL_DICTIONARY
        
        # Create lowercase mapping for case-insensitive matching
        self.skill_map = {skill.lower(): skill for skill in self.all_skills}
    
    def extract_skills_from_text(self, text: str) -> List[str]:
        """
        Extract skills from text using multiple strategies
        
        Args:
            text (str): Input text (resume content)
            
        Returns:
            List[str]: Extracted skills
        """
        if not text:
            return []
        
        extracted_skills = set()
        
        # Strategy 1: Direct dictionary matching (case-insensitive)
        extracted_skills.update(self._extract_by_dictionary(text))
        
        # Strategy 2: Pattern-based extraction
        extracted_skills.update(self._extract_by_patterns(text))
        
        # Strategy 3: spaCy NER (if available)
        if self.nlp:
            extracted_skills.update(self._extract_by_ner(text))
        
        logger.info(f"Extracted {len(extracted_skills)} unique skills")
        return sorted(list(extracted_skills))
    
    def _extract_by_dictionary(self, text: str) -> Set[str]:
        """
        Extract skills by matching against skill dictionary
        
        Args:
            text (str): Input text
            
        Returns:
            Set[str]: Matched skills
        """
        skills = set()
        text_lower = text.lower()
        
        for skill_lower, skill_original in self.skill_map.items():
            # Use word boundaries for accurate matching
            pattern = r'\b' + re.escape(skill_lower) + r'\b'
            if re.search(pattern, text_lower):
                skills.add(skill_original)
        
        return skills
    
    def _extract_by_patterns(self, text: str) -> Set[str]:
        """
        Extract skills using regex patterns for common formats
        
        Args:
            text (str): Input text
            
        Returns:
            Set[str]: Extracted skills
        """
        skills = set()
        
        # Pattern for version numbers (e.g., Python 3.9, Node.js 16)
        version_pattern = r'\b([A-Za-z][A-Za-z0-9\+\#\.]*)\s+\d+(?:\.\d+)*\b'
        matches = re.findall(version_pattern, text)
        for match in matches:
            if match.lower() in self.skill_map:
                skills.add(self.skill_map[match.lower()])
        
        # Pattern for frameworks with .js extension
        js_pattern = r'\b([A-Za-z]+\.js)\b'
        matches = re.findall(js_pattern, text, re.IGNORECASE)
        for match in matches:
            if match.lower() in self.skill_map:
                skills.add(self.skill_map[match.lower()])
        
        # Pattern for C++, C#, .NET
        special_pattern = r'\b(C\+\+|C#|\.NET|ASP\.NET)\b'
        matches = re.findall(special_pattern, text, re.IGNORECASE)
        for match in matches:
            if match.lower() in self.skill_map:
                skills.add(self.skill_map[match.lower()])
        
        return skills
    
    def _extract_by_ner(self, text: str) -> Set[str]:
        """
        Extract skills using spaCy Named Entity Recognition
        
        Args:
            text (str): Input text
            
        Returns:
            Set[str]: Extracted skills
        """
        skills = set()
        
        try:
            doc = self.nlp(text)
            
            # Extract entities that might be skills
            for ent in doc.ents:
                if ent.label_ in ['ORG', 'PRODUCT', 'GPE']:
                    ent_lower = ent.text.lower()
                    if ent_lower in self.skill_map:
                        skills.add(self.skill_map[ent_lower])
            
            # Extract noun chunks that might be skills
            for chunk in doc.noun_chunks:
                chunk_lower = chunk.text.lower()
                if chunk_lower in self.skill_map:
                    skills.add(self.skill_map[chunk_lower])
        
        except Exception as e:
            logger.error(f"NER extraction error: {str(e)}")
        
        return skills
    
    def categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        """
        Categorize extracted skills by type
        
        Args:
            skills (List[str]): List of skills
            
        Returns:
            Dict[str, List[str]]: Skills grouped by category
        """
        categorized = {}
        
        for category, category_skills in self.skill_dict.items():
            matched = [skill for skill in skills if skill in category_skills]
            if matched:
                categorized[category] = matched
        
        return categorized


def extract_skills(text: str) -> List[str]:
    """
    Convenience function to extract skills from text
    
    Args:
        text (str): Input text
        
    Returns:
        List[str]: Extracted skills
        
    Example:
        Input: "Experienced in Python, React, MongoDB, AWS, and Git"
        Output: ["Python", "React", "MongoDB", "AWS", "Git"]
    """
    extractor = SkillExtractor()
    return extractor.extract_skills_from_text(text)
