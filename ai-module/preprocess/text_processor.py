"""
Text Preprocessing Pipeline
Tokenization, stop-word removal, lemmatization, normalization
"""

import re
import string
import nltk
from typing import List
import logging

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet', quiet=True)

from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize lemmatizer and stop words
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))


def tokenize_text(text: str) -> List[str]:
    """
    Tokenize text into words
    
    Args:
        text (str): Input text
        
    Returns:
        List[str]: List of tokens
    """
    try:
        tokens = word_tokenize(text)
        return tokens
    except Exception as e:
        logger.error(f"Tokenization error: {str(e)}")
        return []


def lemmatize_text(tokens: List[str]) -> List[str]:
    """
    Lemmatize tokens
    
    Args:
        tokens (List[str]): List of tokens
        
    Returns:
        List[str]: Lemmatized tokens
    """
    try:
        lemmatized = [lemmatizer.lemmatize(token.lower()) for token in tokens]
        return lemmatized
    except Exception as e:
        logger.error(f"Lemmatization error: {str(e)}")
        return tokens


def preprocess_text(text: str, remove_stopwords: bool = True) -> List[str]:
    """
    Complete preprocessing pipeline:
    1. Lowercase conversion
    2. Punctuation removal
    3. Tokenization
    4. Stop-word removal (optional)
    5. Lemmatization
    6. Text normalization
    
    Args:
        text (str): Input text
        remove_stopwords (bool): Whether to remove stop words
        
    Returns:
        List[str]: Preprocessed tokens
        
    Example:
        Input: "Developed React Applications"
        Output: ["develop", "react", "application"]
    """
    try:
        # Lowercase conversion
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-zA-Z0-9\s\+\#\.]', ' ', text)
        
        # Tokenization
        tokens = tokenize_text(text)
        
        # Remove punctuation and single characters
        tokens = [token for token in tokens if token not in string.punctuation and len(token) > 1]
        
        # Remove stop words (optional)
        if remove_stopwords:
            tokens = [token for token in tokens if token not in stop_words]
        
        # Lemmatization
        tokens = lemmatize_text(tokens)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_tokens = []
        for token in tokens:
            if token not in seen:
                seen.add(token)
                unique_tokens.append(token)
        
        logger.info(f"Preprocessed text: {len(unique_tokens)} unique tokens")
        return unique_tokens
        
    except Exception as e:
        logger.error(f"Preprocessing error: {str(e)}")
        return []
