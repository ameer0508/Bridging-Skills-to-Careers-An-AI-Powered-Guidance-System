"""
Configuration file for AI Module
Centralized settings and parameters
"""

import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Directory paths
OUTPUT_DIR = BASE_DIR / "output"
DATASETS_DIR = BASE_DIR / "datasets"
MODELS_DIR = BASE_DIR / "models"

# Create directories if they don't exist
OUTPUT_DIR.mkdir(exist_ok=True)
DATASETS_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)

# File upload settings
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc'}

# NLP settings
SPACY_MODEL = "en_core_web_sm"
NLTK_TOKENIZER = "punkt"
NLTK_STOPWORDS = "stopwords"
NLTK_LEMMATIZER = "wordnet"

# Preprocessing settings
REMOVE_STOPWORDS = True
MIN_TOKEN_LENGTH = 2
LOWERCASE = True

# Skill extraction settings
MIN_SKILL_CONFIDENCE = 0.5
ENABLE_NER = True
ENABLE_PATTERN_MATCHING = True
ENABLE_DICTIONARY_MATCHING = True

# TF-IDF settings
TFIDF_NGRAM_RANGE = (1, 2)  # Unigrams and bigrams
TFIDF_MAX_FEATURES = 1000
TFIDF_MIN_DF = 1
TFIDF_MAX_DF = 0.95

# Skill gap analysis settings
REQUIRED_SKILLS_WEIGHT = 0.7
PREFERRED_SKILLS_WEIGHT = 0.3
EXACT_MATCH_WEIGHT = 0.7
TFIDF_MATCH_WEIGHT = 0.3

# Skill level thresholds
BEGINNER_THRESHOLD = 0.3
INTERMEDIATE_THRESHOLD = 0.6
ADVANCED_THRESHOLD = 0.8

# Recommendation settings
MAX_RECOMMENDATIONS = 10
PRIORITIZE_REQUIRED_SKILLS = True

# Logging settings
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_FILE = BASE_DIR / "ai_module.log"

# Output settings
SAVE_JSON_OUTPUT = True
JSON_INDENT = 2
INCLUDE_TIMESTAMP = True

# Performance settings
ENABLE_CACHING = False
CACHE_EXPIRY = 3600  # 1 hour in seconds
MAX_WORKERS = 4  # For parallel processing

# API settings (for backend integration)
API_VERSION = "v1"
API_TIMEOUT = 30  # seconds
MAX_RETRIES = 3

# Feature flags
ENABLE_MULTI_ROLE_COMPARISON = True
ENABLE_SKILL_CATEGORIZATION = True
ENABLE_DETAILED_LOGGING = True

# Validation settings
VALIDATE_FILE_TYPE = True
VALIDATE_FILE_SIZE = True
VALIDATE_JOB_ROLE = True

# Error messages
ERROR_MESSAGES = {
    "file_not_found": "Resume file not found",
    "invalid_format": "Invalid file format. Supported: PDF, DOCX",
    "file_too_large": f"File size exceeds {MAX_FILE_SIZE / (1024*1024)}MB limit",
    "no_text_extracted": "No text could be extracted from the resume",
    "no_skills_found": "No skills found in the resume",
    "invalid_job_role": "Invalid job role specified",
    "parsing_error": "Error parsing resume file",
    "analysis_error": "Error during skill gap analysis"
}

# Success messages
SUCCESS_MESSAGES = {
    "parsing_complete": "Resume parsed successfully",
    "extraction_complete": "Skills extracted successfully",
    "analysis_complete": "Skill gap analysis completed",
    "output_saved": "Results saved successfully"
}

# Development settings
DEBUG = False
VERBOSE = True

# Environment-specific settings
ENV = os.getenv("ENVIRONMENT", "development")

if ENV == "production":
    DEBUG = False
    LOG_LEVEL = "WARNING"
    ENABLE_DETAILED_LOGGING = False
elif ENV == "testing":
    DEBUG = True
    LOG_LEVEL = "DEBUG"
    SAVE_JSON_OUTPUT = False

# Database settings (for future use)
DATABASE_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 27017)),
    "name": os.getenv("DB_NAME", "career_guidance"),
    "user": os.getenv("DB_USER", ""),
    "password": os.getenv("DB_PASSWORD", "")
}

# Redis cache settings (for future use)
REDIS_CONFIG = {
    "host": os.getenv("REDIS_HOST", "localhost"),
    "port": int(os.getenv("REDIS_PORT", 6379)),
    "db": int(os.getenv("REDIS_DB", 0)),
    "password": os.getenv("REDIS_PASSWORD", None)
}

# Model versioning
MODEL_VERSION = "1.0.0"
SKILL_DICTIONARY_VERSION = "1.0.0"
JOB_ROLES_VERSION = "1.0.0"

# Metadata
PROJECT_NAME = "Bridging Skills to Careers"
MODULE_NAME = "AI/NLP Engine"
AUTHOR = "Career Guidance Team"
VERSION = "1.0.0"
DESCRIPTION = "AI-powered resume analysis and skill gap detection system"

def get_config():
    """
    Get configuration as dictionary
    
    Returns:
        dict: Configuration settings
    """
    return {
        "base_dir": str(BASE_DIR),
        "output_dir": str(OUTPUT_DIR),
        "max_file_size": MAX_FILE_SIZE,
        "allowed_extensions": list(ALLOWED_EXTENSIONS),
        "spacy_model": SPACY_MODEL,
        "log_level": LOG_LEVEL,
        "version": VERSION,
        "environment": ENV
    }

def print_config():
    """Print current configuration"""
    config = get_config()
    print("\n" + "=" * 60)
    print("AI Module Configuration")
    print("=" * 60)
    for key, value in config.items():
        print(f"{key}: {value}")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    print_config()
