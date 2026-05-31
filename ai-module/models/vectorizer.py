"""
TF-IDF Vectorization and Similarity Computation
Converts skills to vectors and computes cosine similarity
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer as SklearnTfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TFIDFVectorizer:
    """
    TF-IDF Vectorizer for skill comparison
    """
    
    def __init__(self):
        """Initialize TF-IDF vectorizer"""
        self.vectorizer = SklearnTfidfVectorizer(
            lowercase=True,
            token_pattern=r'\b[A-Za-z][A-Za-z0-9\+\#\.]*\b',
            ngram_range=(1, 2)  # Capture single words and bigrams
        )
        self.is_fitted = False
    
    def fit_transform(self, documents: List[str]) -> np.ndarray:
        """
        Fit vectorizer and transform documents
        
        Args:
            documents (List[str]): List of text documents
            
        Returns:
            np.ndarray: TF-IDF matrix
        """
        try:
            vectors = self.vectorizer.fit_transform(documents)
            self.is_fitted = True
            logger.info(f"Vectorized {len(documents)} documents")
            return vectors.toarray()
        except Exception as e:
            logger.error(f"Vectorization error: {str(e)}")
            return np.array([])
    
    def transform(self, documents: List[str]) -> np.ndarray:
        """
        Transform documents using fitted vectorizer
        
        Args:
            documents (List[str]): List of text documents
            
        Returns:
            np.ndarray: TF-IDF matrix
        """
        if not self.is_fitted:
            raise ValueError("Vectorizer must be fitted before transform")
        
        try:
            vectors = self.vectorizer.transform(documents)
            return vectors.toarray()
        except Exception as e:
            logger.error(f"Transform error: {str(e)}")
            return np.array([])


def compute_similarity(user_skills: List[str], job_skills: List[str]) -> Tuple[float, List[str], List[str]]:
    """
    Compute cosine similarity between user skills and job requirements
    
    Args:
        user_skills (List[str]): Skills from user's resume
        job_skills (List[str]): Required skills for job
        
    Returns:
        Tuple[float, List[str], List[str]]: 
            - Match percentage (0-100)
            - Existing skills (intersection)
            - Missing skills (difference)
    """
    try:
        if not user_skills or not job_skills:
            logger.warning("Empty skill lists provided")
            return 0.0, [], job_skills
        
        # Convert skills to lowercase for comparison
        user_skills_lower = set([skill.lower() for skill in user_skills])
        job_skills_lower = set([skill.lower() for skill in job_skills])
        
        # Find existing and missing skills
        existing_skills_lower = user_skills_lower.intersection(job_skills_lower)
        missing_skills_lower = job_skills_lower - user_skills_lower
        
        # Map back to original case
        user_skill_map = {skill.lower(): skill for skill in user_skills}
        job_skill_map = {skill.lower(): skill for skill in job_skills}
        
        existing_skills = [user_skill_map.get(skill, skill) for skill in existing_skills_lower]
        missing_skills = [job_skill_map.get(skill, skill) for skill in missing_skills_lower]
        
        # Calculate match percentage
        if len(job_skills_lower) == 0:
            match_percentage = 0.0
        else:
            match_percentage = (len(existing_skills_lower) / len(job_skills_lower)) * 100
        
        # Use TF-IDF for more sophisticated similarity (optional enhancement)
        if len(user_skills) > 0 and len(job_skills) > 0:
            user_text = ' '.join(user_skills)
            job_text = ' '.join(job_skills)
            
            vectorizer = TFIDFVectorizer()
            vectors = vectorizer.fit_transform([user_text, job_text])
            
            if vectors.shape[0] == 2:
                tfidf_similarity = cosine_similarity([vectors[0]], [vectors[1]])[0][0]
                # Blend exact match with TF-IDF similarity
                match_percentage = (match_percentage * 0.7) + (tfidf_similarity * 100 * 0.3)
        
        match_percentage = round(match_percentage, 2)
        
        logger.info(f"Match: {match_percentage}%, Existing: {len(existing_skills)}, Missing: {len(missing_skills)}")
        
        return match_percentage, sorted(existing_skills), sorted(missing_skills)
    
    except Exception as e:
        logger.error(f"Similarity computation error: {str(e)}")
        return 0.0, [], job_skills
