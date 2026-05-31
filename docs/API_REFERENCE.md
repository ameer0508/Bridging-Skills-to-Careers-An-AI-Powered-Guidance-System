# AI Module - API Reference

Complete reference for all functions, classes, and modules in the AI/NLP Engine.

---

## Table of Contents

1. [Parsers Module](#parsers-module)
2. [Preprocess Module](#preprocess-module)
3. [Extractors Module](#extractors-module)
4. [Analyzers Module](#analyzers-module)
5. [Models Module](#models-module)
6. [Datasets Module](#datasets-module)
7. [Utils Module](#utils-module)
8. [Main Module](#main-module)

---

## Parsers Module

### `extract_pdf(file_path: str) -> Optional[str]`

Extract text from PDF file.

**Parameters**:
- `file_path` (str): Path to PDF file

**Returns**:
- `Optional[str]`: Extracted text or None if error

**Example**:
```python
from parsers.pdf_parser import extract_pdf

text = extract_pdf('resume.pdf')
if text:
    print(f"Extracted {len(text)} characters")
```

**Errors**:
- `FileNotFoundError`: File doesn't exist
- `PdfReadError`: Invalid PDF format

---

### `extract_docx(file_path: str) -> Optional[str]`

Extract text from DOCX file.

**Parameters**:
- `file_path` (str): Path to DOCX file

**Returns**:
- `Optional[str]`: Extracted text or None if error

**Example**:
```python
from parsers.docx_parser import extract_docx

text = extract_docx('resume.docx')
if text:
    print(f"Extracted {len(text)} characters")
```

**Features**:
- Extracts from paragraphs
- Extracts from tables
- Preserves structure

---

### `extract_resume(file_path: str) -> Optional[str]`

Universal resume parser with automatic format detection.

**Parameters**:
- `file_path` (str): Path to resume file (PDF or DOCX)

**Returns**:
- `Optional[str]`: Extracted text or None if error

**Example**:
```python
from parsers.resume_parser import extract_resume

text = extract_resume('resume.pdf')  # Auto-detects format
```

**Supported Formats**:
- `.pdf`
- `.docx`
- `.doc`

---

## Preprocess Module

### `tokenize_text(text: str) -> List[str]`

Tokenize text into words.

**Parameters**:
- `text` (str): Input text

**Returns**:
- `List[str]`: List of tokens

**Example**:
```python
from preprocess.text_processor import tokenize_text

tokens = tokenize_text("Hello World")
# Output: ['Hello', 'World']
```

---

### `lemmatize_text(tokens: List[str]) -> List[str]`

Lemmatize tokens to base form.

**Parameters**:
- `tokens` (List[str]): List of tokens

**Returns**:
- `List[str]`: Lemmatized tokens

**Example**:
```python
from preprocess.text_processor import lemmatize_text

tokens = ['running', 'ran', 'runs']
lemmatized = lemmatize_text(tokens)
# Output: ['running', 'ran', 'run']
```

---

### `preprocess_text(text: str, remove_stopwords: bool = True) -> List[str]`

Complete preprocessing pipeline.

**Parameters**:
- `text` (str): Input text
- `remove_stopwords` (bool): Whether to remove stop words (default: True)

**Returns**:
- `List[str]`: Preprocessed tokens

**Pipeline**:
1. Lowercase conversion
2. URL/email removal
3. Special character handling
4. Tokenization
5. Punctuation removal
6. Stop-word removal (optional)
7. Lemmatization
8. Deduplication

**Example**:
```python
from preprocess.text_processor import preprocess_text

text = "Developed React Applications using TypeScript"
tokens = preprocess_text(text)
# Output: ['develop', 'react', 'application', 'typescript']
```

---

## Extractors Module

### `extract_skills(text: str) -> List[str]`

Extract technical skills from text.

**Parameters**:
- `text` (str): Input text (resume content)

**Returns**:
- `List[str]`: List of extracted skills

**Example**:
```python
from extractors.skill_extractor import extract_skills

text = "Experienced in Python, React, MongoDB, AWS"
skills = extract_skills(text)
# Output: ['Python', 'React', 'MongoDB', 'AWS']
```

**Extraction Methods**:
1. Dictionary matching (200+ skills)
2. Pattern-based extraction
3. spaCy NER

---

### Class: `SkillExtractor`

Advanced skill extraction with categorization.

#### `__init__()`

Initialize skill extractor.

**Example**:
```python
from extractors.skill_extractor import SkillExtractor

extractor = SkillExtractor()
```

---

#### `extract_skills_from_text(text: str) -> List[str]`

Extract skills using multiple strategies.

**Parameters**:
- `text` (str): Input text

**Returns**:
- `List[str]`: Extracted skills

**Example**:
```python
extractor = SkillExtractor()
skills = extractor.extract_skills_from_text("Python React MongoDB")
```

---

#### `categorize_skills(skills: List[str]) -> Dict[str, List[str]]`

Categorize skills by type.

**Parameters**:
- `skills` (List[str]): List of skills

**Returns**:
- `Dict[str, List[str]]`: Skills grouped by category

**Example**:
```python
extractor = SkillExtractor()
skills = ['Python', 'React', 'MongoDB', 'AWS']
categorized = extractor.categorize_skills(skills)
# Output: {
#   'programming_languages': ['Python'],
#   'web_frameworks': ['React'],
#   'databases': ['MongoDB'],
#   'cloud_platforms': ['AWS']
# }
```

---

## Analyzers Module

### `analyze_skill_gap(user_skills: List[str], job_role: str) -> Dict`

Analyze skill gap for a job role.

**Parameters**:
- `user_skills` (List[str]): User's skills
- `job_role` (str): Target job role

**Returns**:
- `Dict`: Analysis results

**Return Structure**:
```python
{
    "job_role": str,
    "overall_match_percentage": float,
    "required_skills_match": float,
    "preferred_skills_match": float,
    "user_skills": List[str],
    "existing_skills": {
        "required": List[str],
        "preferred": List[str]
    },
    "missing_skills": {
        "required": List[str],
        "preferred": List[str]
    },
    "skill_level": str,  # "Beginner", "Intermediate", "Advanced"
    "recommended_skills": List[str],
    "total_user_skills": int,
    "total_required_skills": int,
    "total_preferred_skills": int
}
```

**Example**:
```python
from analyzers.skill_gap_analyzer import analyze_skill_gap

user_skills = ['HTML', 'CSS', 'JavaScript', 'React']
result = analyze_skill_gap(user_skills, 'Frontend Developer')

print(f"Match: {result['overall_match_percentage']}%")
print(f"Missing: {result['missing_skills']['required']}")
```

---

### Class: `SkillGapAnalyzer`

Advanced skill gap analysis.

#### `__init__()`

Initialize analyzer.

**Example**:
```python
from analyzers.skill_gap_analyzer import SkillGapAnalyzer

analyzer = SkillGapAnalyzer()
```

---

#### `analyze(user_skills: List[str], job_role: str) -> Dict`

Analyze skill gap.

**Parameters**:
- `user_skills` (List[str]): User's skills
- `job_role` (str): Target job role

**Returns**:
- `Dict`: Analysis results

**Example**:
```python
analyzer = SkillGapAnalyzer()
result = analyzer.analyze(['Python', 'React'], 'Full Stack Developer')
```

---

#### `compare_multiple_roles(user_skills: List[str], roles: List[str] = None) -> List[Dict]`

Compare skills against multiple roles.

**Parameters**:
- `user_skills` (List[str]): User's skills
- `roles` (List[str], optional): Roles to compare (default: all roles)

**Returns**:
- `List[Dict]`: Analysis results for each role, sorted by match percentage

**Example**:
```python
analyzer = SkillGapAnalyzer()
results = analyzer.compare_multiple_roles(['Python', 'React', 'MongoDB'])

for result in results[:3]:  # Top 3 matches
    print(f"{result['job_role']}: {result['overall_match_percentage']}%")
```

---

## Models Module

### Class: `TFIDFVectorizer`

TF-IDF vectorization for skill comparison.

#### `__init__()`

Initialize vectorizer.

**Example**:
```python
from models.vectorizer import TFIDFVectorizer

vectorizer = TFIDFVectorizer()
```

---

#### `fit_transform(documents: List[str]) -> np.ndarray`

Fit and transform documents.

**Parameters**:
- `documents` (List[str]): Text documents

**Returns**:
- `np.ndarray`: TF-IDF matrix

**Example**:
```python
vectorizer = TFIDFVectorizer()
vectors = vectorizer.fit_transform(['Python React', 'Java Spring'])
```

---

#### `transform(documents: List[str]) -> np.ndarray`

Transform documents using fitted vectorizer.

**Parameters**:
- `documents` (List[str]): Text documents

**Returns**:
- `np.ndarray`: TF-IDF matrix

**Example**:
```python
vectors = vectorizer.transform(['MongoDB AWS'])
```

---

### `compute_similarity(user_skills: List[str], job_skills: List[str]) -> Tuple[float, List[str], List[str]]`

Compute similarity between skill sets.

**Parameters**:
- `user_skills` (List[str]): User's skills
- `job_skills` (List[str]): Required job skills

**Returns**:
- `Tuple[float, List[str], List[str]]`:
  - Match percentage (0-100)
  - Existing skills (intersection)
  - Missing skills (difference)

**Example**:
```python
from models.vectorizer import compute_similarity

user_skills = ['Python', 'JavaScript', 'React']
job_skills = ['Python', 'JavaScript', 'React', 'Node.js', 'MongoDB']

match_pct, existing, missing = compute_similarity(user_skills, job_skills)
print(f"Match: {match_pct}%")
print(f"Existing: {existing}")
print(f"Missing: {missing}")
```

---

## Datasets Module

### `get_all_skills() -> list`

Get all skills from dictionary.

**Returns**:
- `list`: All available skills

**Example**:
```python
from datasets.skill_dictionary import get_all_skills

all_skills = get_all_skills()
print(f"Total skills: {len(all_skills)}")
```

---

### `get_skills_by_category(category: str) -> list`

Get skills for a specific category.

**Parameters**:
- `category` (str): Category name

**Returns**:
- `list`: Skills in that category

**Categories**:
- `programming_languages`
- `web_frameworks`
- `databases`
- `cloud_platforms`
- `devops_tools`
- `version_control`
- `data_science`
- `ai_ml`
- `cybersecurity`
- `mobile_development`
- `testing`
- `design_tools`
- `methodologies`
- `certifications`

**Example**:
```python
from datasets.skill_dictionary import get_skills_by_category

languages = get_skills_by_category('programming_languages')
print(languages)
```

---

### `get_job_skills(role: str) -> dict`

Get skill requirements for a job role.

**Parameters**:
- `role` (str): Job role name

**Returns**:
- `dict`: Skill requirements

**Return Structure**:
```python
{
    "required_skills": List[str],
    "preferred_skills": List[str],
    "beginner_skills": List[str],
    "advanced_skills": List[str]
}
```

**Example**:
```python
from datasets.job_skills import get_job_skills

skills = get_job_skills('Frontend Developer')
print(skills['required_skills'])
```

---

### `get_all_roles() -> list`

Get all available job roles.

**Returns**:
- `list`: List of job role names

**Example**:
```python
from datasets.job_skills import get_all_roles

roles = get_all_roles()
for role in roles:
    print(role)
```

---

## Utils Module

### `generate_json_response(analysis_result: Dict) -> Dict[str, Any]`

Generate structured JSON response.

**Parameters**:
- `analysis_result` (Dict): Analysis result from skill gap analyzer

**Returns**:
- `Dict[str, Any]`: Formatted JSON response

**Example**:
```python
from utils.json_generator import generate_json_response

response = generate_json_response(analysis_result)
print(response['status'])
```

---

### `save_json_output(data: Dict, filename: str, output_dir: str = "output") -> str`

Save JSON data to file.

**Parameters**:
- `data` (Dict): Data to save
- `filename` (str): Output filename
- `output_dir` (str): Output directory (default: "output")

**Returns**:
- `str`: Path to saved file

**Example**:
```python
from utils.json_generator import save_json_output

filepath = save_json_output(result, "analysis.json")
print(f"Saved to: {filepath}")
```

---

### `format_for_api(analysis_result: Dict) -> str`

Format analysis result as JSON string.

**Parameters**:
- `analysis_result` (Dict): Analysis result

**Returns**:
- `str`: JSON string

**Example**:
```python
from utils.json_generator import format_for_api

json_string = format_for_api(analysis_result)
```

---

## Main Module

### `parse_resume(file_path: str) -> Optional[str]`

Parse resume and extract text.

**Parameters**:
- `file_path` (str): Path to resume file

**Returns**:
- `Optional[str]`: Extracted text

**Example**:
```python
from main import parse_resume

text = parse_resume('resume.pdf')
```

---

### `extract_skills_from_resume(resume_text: str) -> list`

Extract skills from resume text.

**Parameters**:
- `resume_text` (str): Resume content

**Returns**:
- `list`: Extracted skills

**Example**:
```python
from main import extract_skills_from_resume

skills = extract_skills_from_resume(resume_text)
```

---

### `analyze_skill_gap_for_role(user_skills: list, job_role: str) -> Dict`

Analyze skill gap for a role.

**Parameters**:
- `user_skills` (list): User's skills
- `job_role` (str): Target job role

**Returns**:
- `Dict`: Analysis results

**Example**:
```python
from main import analyze_skill_gap_for_role

result = analyze_skill_gap_for_role(skills, 'Data Scientist')
```

---

### `process_resume_complete(file_path: str, job_role: str, save_output: bool = True) -> Dict`

Complete pipeline: Parse → Extract → Analyze → Generate JSON.

**Parameters**:
- `file_path` (str): Path to resume file
- `job_role` (str): Target job role
- `save_output` (bool): Save output to file (default: True)

**Returns**:
- `Dict`: Complete analysis results

**Example**:
```python
from main import process_resume_complete

result = process_resume_complete('resume.pdf', 'Frontend Developer')
print(f"Match: {result['data']['matchPercentage']}%")
```

---

### `compare_multiple_roles(file_path: str, roles: list = None) -> Dict`

Compare resume against multiple roles.

**Parameters**:
- `file_path` (str): Path to resume file
- `roles` (list, optional): Roles to compare (default: all roles)

**Returns**:
- `Dict`: Comparison results

**Example**:
```python
from main import compare_multiple_roles

result = compare_multiple_roles('resume.pdf')
for role_result in result['results'][:3]:
    print(f"{role_result['job_role']}: {role_result['overall_match_percentage']}%")
```

---

### `api_parse_resume(file_path: str) -> Dict`

API endpoint: Parse resume.

**Parameters**:
- `file_path` (str): Path to resume file

**Returns**:
- `Dict`: JSON response with text

**Example**:
```python
from main import api_parse_resume

response = api_parse_resume('resume.pdf')
if response['status'] == 'success':
    print(response['text'])
```

---

### `api_extract_skills(resume_text: str) -> Dict`

API endpoint: Extract skills.

**Parameters**:
- `resume_text` (str): Resume text

**Returns**:
- `Dict`: JSON response with skills

**Example**:
```python
from main import api_extract_skills

response = api_extract_skills(resume_text)
print(response['skills'])
```

---

### `api_analyze_skill_gap(user_skills: list, job_role: str) -> Dict`

API endpoint: Analyze skill gap.

**Parameters**:
- `user_skills` (list): User's skills
- `job_role` (str): Target job role

**Returns**:
- `Dict`: JSON response with analysis

**Example**:
```python
from main import api_analyze_skill_gap

response = api_analyze_skill_gap(skills, 'Machine Learning Engineer')
print(response['data']['matchPercentage'])
```

---

## Error Handling

All functions include error handling and return appropriate error messages:

```python
{
    "status": "error",
    "error": "Error message",
    "timestamp": "2026-05-31T10:30:00"
}
```

---

## Type Hints

All functions use Python type hints for clarity:

```python
def extract_skills(text: str) -> List[str]:
    ...

def analyze_skill_gap(user_skills: List[str], job_role: str) -> Dict:
    ...
```

---

## Logging

All modules include logging for debugging:

```python
import logging

logger = logging.getLogger(__name__)
logger.info("Processing resume...")
logger.error("Error occurred: ...")
```

---

## Constants

### File Size Limits
- `MAX_FILE_SIZE`: 10 MB

### Supported Formats
- `ALLOWED_EXTENSIONS`: {'.pdf', '.docx', '.doc'}

### Skill Categories
- 14 categories
- 200+ total skills

### Job Roles
- 8 predefined roles
- Extensible structure

---

## Best Practices

1. **Always check return values**:
```python
text = parse_resume('resume.pdf')
if text:
    # Process text
else:
    # Handle error
```

2. **Use try-except for robustness**:
```python
try:
    result = process_resume_complete('resume.pdf', 'Frontend Developer')
except Exception as e:
    print(f"Error: {e}")
```

3. **Validate inputs**:
```python
if job_role not in get_all_roles():
    print("Invalid job role")
```

4. **Check status in responses**:
```python
if result['status'] == 'success':
    # Process data
else:
    # Handle error
```

---

## Performance Tips

1. **Reuse extractors**:
```python
extractor = SkillExtractor()  # Initialize once
skills1 = extractor.extract_skills_from_text(text1)
skills2 = extractor.extract_skills_from_text(text2)
```

2. **Batch processing**:
```python
analyzer = SkillGapAnalyzer()
results = analyzer.compare_multiple_roles(user_skills)  # Compare all at once
```

3. **Cache results**:
```python
# Save results to avoid reprocessing
save_json_output(result, "cached_result.json")
```

---

## Version Information

- **API Version**: 1.0.0
- **Python**: 3.8+
- **spaCy Model**: en_core_web_sm
- **Last Updated**: May 31, 2026

---

**For more information, see the complete documentation in `docs/`**
