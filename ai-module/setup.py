"""
Setup script for AI Module
Handles installation and initial setup
"""

import subprocess
import sys
import os


def install_requirements():
    """Install Python dependencies"""
    print("Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error installing dependencies: {e}")
        return False


def download_spacy_model():
    """Download spaCy language model"""
    print("\nDownloading spaCy model...")
    try:
        subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
        print("✓ spaCy model downloaded successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error downloading spaCy model: {e}")
        return False


def download_nltk_data():
    """Download required NLTK data"""
    print("\nDownloading NLTK data...")
    try:
        import nltk
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
        print("✓ NLTK data downloaded successfully")
        return True
    except Exception as e:
        print(f"✗ Error downloading NLTK data: {e}")
        return False


def create_directories():
    """Create necessary directories"""
    print("\nCreating directories...")
    directories = ['output', 'datasets', 'models', 'utils']
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
    
    print("✓ Directories created successfully")
    return True


def verify_installation():
    """Verify that all components are installed correctly"""
    print("\nVerifying installation...")
    
    try:
        # Test imports
        import spacy
        import nltk
        import PyPDF2
        import docx
        import pandas
        import numpy
        import sklearn
        
        # Test spaCy model
        nlp = spacy.load("en_core_web_sm")
        
        print("✓ All components verified successfully")
        return True
    except Exception as e:
        print(f"✗ Verification failed: {e}")
        return False


def main():
    """Main setup function"""
    print("=" * 60)
    print("AI Module Setup")
    print("=" * 60)
    
    steps = [
        ("Installing dependencies", install_requirements),
        ("Downloading spaCy model", download_spacy_model),
        ("Downloading NLTK data", download_nltk_data),
        ("Creating directories", create_directories),
        ("Verifying installation", verify_installation)
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print(f"\n✗ Setup failed at: {step_name}")
            sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✓ Setup completed successfully!")
    print("=" * 60)
    print("\nYou can now use the AI module:")
    print("  python main.py")
    print("\nOr import it in your code:")
    print("  from main import process_resume_complete")


if __name__ == "__main__":
    main()
