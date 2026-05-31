# AI-Powered Resume Analysis Engine

Complete AI/NLP engine for resume parsing, skill extraction, and skill gap analysis.

## 🎯 Features

- **Resume Text Extraction**: PDF and DOCX support
- **NLP Preprocessing**: Tokenization, lemmatization, stop-word removal
- **Skill Extraction**: spaCy NER + custom skill dictionary
- **Job Role Database**: 8 job roles with skill requirements
- **TF-IDF Vectorization**: Advanced skill comparison
- **Skill Gap Analysis**: Cosine similarity-based matching
- **JSON Output**: Backend-ready structured responses

## 📦 Installation

### 1. Install Python Dependencies

```bash
cd ai-module
pip install -r requirements.txt
```

### 2. Download spaCy Model

```bash
python -m spacy download en_core_web_sm
```

### 3. Download NLTK Data

```python
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
```

## 🚀 Quick Start

### Complete Pipeline

```python
from main import process_resume_complete

# Analyze resume for a specific role
result = process_resume_complete('resume.pdf', 'Frontend Developer')
print(result)
```

### Step-by-Step Usage

```python
from main import parse_resume, extract_skills_from_resume, analyze_skill_gap_for_role

# Step 1: Parse resume
resume_text = parse_resume('resume.pdf')

# Step 2: Extract skills
user_skills = extract_skills_from_resume(resume_text)

# Step 3: Analyze skill gap
analysis = analyze_skill_gap_for_role(user_skills, 'Data Scientist')
```

### Compare Multiple Roles

```python
from main import compare_multiple_roles

# Compare against all job roles
result = compare_multiple_roles('resume.pdf')

# Compare against specific roles
result = compare_multiple_roles('resume.pdf', ['Frontend Developer', 'Backend Developer'])
```

## 🔌 Backend Integration

### Node.js Integration Example

```python
# These functions return JSON-ready dictionaries
from main import api_parse_resume, api_extract_skills, api_analyze_skill_gap

# Parse resume
result = api_parse_resume('uploads/resume.pdf')
# Returns: {"status": "success", "text": "...", "length": 5000}

# Extract skills
result = api_extract_skills(resume_text)
# Returns: {"status": "success", "skills": [...], "count": 15}

# Analyze skill gap
result = api_analyze_skill_gap(user_skills, 'Machine Learning Engineer')
# Returns: Complete JSON response with match percentage, gaps, recommendations
```

## 📊 Output Format

```json
{
  "status": "success",
  "timestamp": "2026-05-31T10:30:00",
  "data": {
    "jobRole": "Frontend Developer",
    "matchPercentage": 72.5,
    "requiredSkillsMatch": 80.0,
    "preferredSkillsMatch": 60.0,
    "userSkills": ["HTML", "CSS", "JavaScript", "React", "Git"],
    "existingSkills": {
      "required": ["HTML", "CSS", "JavaScript", "React", "Git"],
      "preferred": ["Redux", "TypeScript"]
    },
    "missingSkills": {
      "required": ["Angular", "Vue.js"],
      "preferred": ["Webpack", "Jest", "Next.js"]
    },
    "recommendedSkills": ["Angular", "Vue.js", "Webpack", "Jest"],
    "skillLevel": "Intermediate",
    "summary": {
      "totalUserSkills": 15,
      "totalRequiredSkills": 10,
      "totalPreferredSkills": 10
    }
  }
}
```

## 📁 Project Structure

```
ai-module/
├── parsers/              # Resume text extraction
│   ├── pdf_parser.py     # PDF extraction
│   ├── docx_parser.py    # DOCX extraction
│   └── resume_parser.py  # Universal parser
├── preprocess/           # NLP preprocessing
│   └── text_processor.py # Tokenization, lemmatization
├── extractors/           # Skill extraction
│   └── skill_extractor.py # spaCy + dictionary matching
├── analyzers/            # Skill gap analysis
│   └── skill_gap_analyzer.py # Similarity computation
├── models/               # ML models
│   └── vectorizer.py     # TF-IDF vectorization
├── datasets/             # Job role database
│   ├── skill_dictionary.py # Comprehensive skill list
│   └── job_skills.py     # Job role requirements
├── utils/                # Utilities
│   └── json_generator.py # JSON response generation
├── output/               # Output directory
├── main.py               # Main entry point
├── requirements.txt      # Dependencies
└── README.md            # Documentation
```

## 🎓 Supported Job Roles

1. **Frontend Developer**
2. **Backend Developer**
3. **Full Stack Developer**
4. **Data Analyst**
5. **Data Scientist**
6. **Cybersecurity Analyst**
7. **Machine Learning Engineer**
8. **DevOps Engineer**

## 🔧 Module Details

### Module 1: Resume Text Extraction
- Supports PDF and DOCX formats
- Automatic format detection
- Error handling and logging

### Module 2: NLP Preprocessing
- Tokenization using NLTK
- Stop-word removal
- Lemmatization
- Text normalization

### Module 3: Skill Extraction
- spaCy Named Entity Recognition
- Custom skill dictionary (200+ skills)
- Pattern-based extraction
- Case-insensitive matching

### Module 4: Job Role Database
- 8 comprehensive job roles
- Required vs. preferred skills
- Beginner vs. advanced skills
- Easily extensible

### Module 5: TF-IDF Vectorization
- Scikit-learn TF-IDF
- Skill text vectorization
- Bigram support

### Module 6: Skill Gap Analysis
- Cosine similarity computation
- Match percentage calculation
- Missing skill identification
- Skill level determination
- Personalized recommendations

### Module 7: JSON Response Generation
- Structured JSON output
- Backend-ready format
- Timestamp and metadata
- Error handling

## 🧪 Testing

```python
# Run main.py to see usage examples
python main.py

# Test individual modules
from parsers.resume_parser import extract_resume
text = extract_resume('test_resume.pdf')
print(f"Extracted {len(text)} characters")

from extractors.skill_extractor import extract_skills
skills = extract_skills("Python React MongoDB AWS Git")
print(f"Skills: {skills}")
```

## 📝 Example Workflow

```python
from main import process_resume_complete

# Process a resume
result = process_resume_complete(
    file_path='resumes/john_doe.pdf',
    job_role='Full Stack Developer',
    save_output=True
)

# Access results
print(f"Match: {result['data']['matchPercentage']}%")
print(f"Existing Skills: {result['data']['existingSkills']['required']}")
print(f"Missing Skills: {result['data']['missingSkills']['required']}")
print(f"Recommendations: {result['data']['recommendedSkills']}")
```

## 🔐 Error Handling

All functions include comprehensive error handling:
- File not found errors
- Parsing errors
- Empty content handling
- Invalid job role handling
- Logging for debugging

## 🚀 Production Ready

- Modular architecture
- Reusable functions
- Proper documentation
- Exception handling
- Logging system
- Scalable design

## 📞 Backend Integration Guide

### Python Flask Example

```python
from flask import Flask, request, jsonify
from main import process_resume_complete

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    file = request.files['resume']
    job_role = request.form['job_role']
    
    # Save file temporarily
    file_path = f"temp/{file.filename}"
    file.save(file_path)
    
    # Process resume
    result = process_resume_complete(file_path, job_role, save_output=False)
    
    return jsonify(result)
```

### Node.js Integration (via child_process)

```javascript
const { spawn } = require('child_process');

function analyzeResume(filePath, jobRole) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [
      'ai-module/main.py',
      '--file', filePath,
      '--role', jobRole
    ]);
    
    let result = '';
    python.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve(JSON.parse(result));
      } else {
        reject(new Error('Analysis failed'));
      }
    });
  });
}
```

## 📈 Performance

- Resume parsing: < 1 second
- Skill extraction: < 2 seconds
- Gap analysis: < 1 second
- Total pipeline: < 5 seconds

## 🔄 Future Enhancements

- Support for more file formats (TXT, RTF)
- Custom skill dictionary upload
- Multi-language support
- Advanced NER training
- Real-time processing
- Batch processing
- API rate limiting
- Caching layer

## 📄 License

This project is part of the "Bridging Skills to Careers" system.

## 👥 Contact

For questions or support, please contact the development team.
