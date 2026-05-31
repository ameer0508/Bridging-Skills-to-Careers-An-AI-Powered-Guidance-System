# AI Module - Installation Guide

## Prerequisites

- **Python**: 3.8 or higher
- **pip**: Python package manager
- **Operating System**: Windows, macOS, or Linux
- **RAM**: Minimum 2GB
- **Disk Space**: 500MB free space

## Step-by-Step Installation

### Step 1: Clone or Download the Project

```bash
cd your-project-directory
```

### Step 2: Navigate to AI Module

```bash
cd ai-module
```

### Step 3: Create Virtual Environment (Recommended)

**Windows**:
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux**:
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 4: Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- spacy==3.7.2
- nltk==3.8.1
- PyPDF2==3.0.1
- python-docx==1.1.0
- pandas==2.1.4
- numpy==1.26.2
- scikit-learn==1.3.2

### Step 5: Download spaCy Language Model

```bash
python -m spacy download en_core_web_sm
```

### Step 6: Download NLTK Data

Run Python and execute:

```python
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
```

Or run the setup script:

```bash
python setup.py
```

### Step 7: Verify Installation

```python
python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('✓ Installation successful!')"
```

## Quick Setup (Automated)

Run the automated setup script:

```bash
python setup.py
```

This will:
1. Install all dependencies
2. Download spaCy model
3. Download NLTK data
4. Create necessary directories
5. Verify installation

## Testing the Installation

### Test 1: Import Modules

```python
python
>>> from main import process_resume_complete
>>> print("✓ Modules loaded successfully")
```

### Test 2: Run Example

```python
python main.py
```

### Test 3: Process Sample Text

```python
from extractors.skill_extractor import extract_skills

text = "Python React MongoDB AWS Docker"
skills = extract_skills(text)
print(f"Extracted skills: {skills}")
```

## Directory Structure After Installation

```
ai-module/
├── parsers/
│   ├── __init__.py
│   ├── pdf_parser.py
│   ├── docx_parser.py
│   └── resume_parser.py
├── preprocess/
│   ├── __init__.py
│   └── text_processor.py
├── extractors/
│   ├── __init__.py
│   └── skill_extractor.py
├── analyzers/
│   ├── __init__.py
│   └── skill_gap_analyzer.py
├── models/
│   ├── __init__.py
│   └── vectorizer.py
├── datasets/
│   ├── __init__.py
│   ├── skill_dictionary.py
│   └── job_skills.py
├── utils/
│   ├── __init__.py
│   └── json_generator.py
├── output/              # Created automatically
├── main.py
├── setup.py
├── requirements.txt
├── README.md
└── .gitignore
```

## Troubleshooting

### Issue: pip not found

**Solution**:
```bash
python -m ensurepip --upgrade
```

### Issue: Permission denied

**Solution** (Linux/macOS):
```bash
sudo pip install -r requirements.txt
```

Or use virtual environment (recommended).

### Issue: spaCy model download fails

**Solution**:
```bash
# Try direct download
pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.0/en_core_web_sm-3.7.0-py3-none-any.whl
```

### Issue: NLTK download fails

**Solution**:
```python
import nltk
nltk.download('punkt', download_dir='/path/to/nltk_data')
```

### Issue: Import errors

**Solution**:
```bash
# Ensure you're in the correct directory
cd ai-module

# Verify Python path
python -c "import sys; print(sys.path)"
```

### Issue: Memory errors

**Solution**:
- Close other applications
- Use smaller batch sizes
- Increase system RAM

## Platform-Specific Notes

### Windows

- Use PowerShell or Command Prompt
- May need to run as Administrator
- Use backslashes in paths: `ai-module\main.py`

### macOS

- May need to install Xcode Command Line Tools:
  ```bash
  xcode-select --install
  ```
- Use `python3` instead of `python`

### Linux

- May need to install Python development headers:
  ```bash
  sudo apt-get install python3-dev
  ```
- Use `python3` and `pip3`

## Docker Installation (Optional)

Create `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

COPY . .

CMD ["python", "main.py"]
```

Build and run:

```bash
docker build -t ai-module .
docker run -v $(pwd)/output:/app/output ai-module
```

## Environment Variables (Optional)

Create `.env` file:

```env
LOG_LEVEL=INFO
OUTPUT_DIR=output
MAX_FILE_SIZE=10485760  # 10MB
```

## Next Steps

After installation:

1. **Read Documentation**: Check `README.md` and `docs/`
2. **Run Tests**: Execute `python test_example.py`
3. **Try Examples**: Test with sample resumes
4. **Integrate**: Connect with your backend

## Updating

To update the AI module:

```bash
cd ai-module
git pull  # If using git
pip install -r requirements.txt --upgrade
python -m spacy download en_core_web_sm --upgrade
```

## Uninstallation

To remove the AI module:

```bash
# Deactivate virtual environment
deactivate

# Remove virtual environment
rm -rf venv

# Remove downloaded models (optional)
rm -rf ~/.spacy
rm -rf ~/nltk_data
```

## Support

If you encounter issues:

1. Check error logs in console
2. Verify all dependencies are installed
3. Ensure Python version is 3.8+
4. Review troubleshooting section
5. Contact development team

## Verification Checklist

- [ ] Python 3.8+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] spaCy model downloaded
- [ ] NLTK data downloaded
- [ ] Import test successful
- [ ] Example code runs
- [ ] Output directory created

## Performance Optimization

For better performance:

1. **Use SSD**: Faster file I/O
2. **Increase RAM**: Better for large files
3. **Use Virtual Environment**: Isolated dependencies
4. **Enable Caching**: Reduce redundant processing
5. **Batch Processing**: Process multiple files efficiently

## Security Considerations

- Keep dependencies updated
- Use virtual environment
- Validate file uploads
- Sanitize file paths
- Implement rate limiting
- Monitor resource usage

---

**Installation Complete!** 🎉

You're now ready to use the AI-powered Resume Analysis Engine.
