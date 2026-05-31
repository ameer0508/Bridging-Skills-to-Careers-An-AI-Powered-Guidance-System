# Quick Start Guide

Get up and running with the AI Module in 5 minutes!

## 🚀 Installation (2 minutes)

```bash
# Step 1: Navigate to AI module
cd ai-module

# Step 2: Install dependencies
pip install -r requirements.txt

# Step 3: Download spaCy model
python -m spacy download en_core_web_sm

# Step 4: Verify installation
python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('✓ Ready!')"
```

## 💡 Basic Usage (3 minutes)

### Example 1: Extract Skills from Text

```python
from extractors.skill_extractor import extract_skills

# Sample resume text
text = """
Software Developer with 5 years of experience.
Skills: Python, JavaScript, React, Node.js, MongoDB, AWS, Docker, Git
"""

# Extract skills
skills = extract_skills(text)
print(f"Found {len(skills)} skills: {skills}")
```

**Output**:
```
Found 8 skills: ['Python', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'Docker', 'Git']
```

---

### Example 2: Analyze Skill Gap

```python
from analyzers.skill_gap_analyzer import analyze_skill_gap

# Your skills
user_skills = ['Python', 'JavaScript', 'React', 'MongoDB', 'Git']

# Target role
job_role = 'Full Stack Developer'

# Analyze gap
result = analyze_skill_gap(user_skills, job_role)

print(f"Match: {result['overall_match_percentage']}%")
print(f"Missing: {result['missing_skills']['required']}")
print(f"Recommendations: {result['recommended_skills']}")
```

**Output**:
```
Match: 65.5%
Missing: ['Node.js', 'Docker', 'SQL', 'REST API']
Recommendations: ['Node.js', 'Docker', 'SQL', 'REST API', 'TypeScript']
```

---

### Example 3: Complete Pipeline (Parse Resume → Analyze)

```python
from main import process_resume_complete

# Process a resume file
result = process_resume_complete(
    file_path='sample_resume.pdf',
    job_role='Frontend Developer',
    save_output=True
)

# Access results
data = result['data']
print(f"Match: {data['matchPercentage']}%")
print(f"Skill Level: {data['skillLevel']}")
print(f"Existing Skills: {data['existingSkills']['required']}")
print(f"Missing Skills: {data['missingSkills']['required']}")
print(f"Recommendations: {data['recommendedSkills']}")
```

---

### Example 4: Compare Multiple Roles

```python
from main import compare_multiple_roles

# Compare against all job roles
result = compare_multiple_roles('resume.pdf')

# Show top 3 matches
for i, role_result in enumerate(result['results'][:3], 1):
    print(f"{i}. {role_result['job_role']}: {role_result['overall_match_percentage']}%")
```

**Output**:
```
1. Full Stack Developer: 75.5%
2. Backend Developer: 72.0%
3. Frontend Developer: 68.5%
```

---

## 🎯 Available Job Roles

```python
from datasets.job_skills import get_all_roles

roles = get_all_roles()
for role in roles:
    print(f"- {role}")
```

**Output**:
```
- Frontend Developer
- Backend Developer
- Full Stack Developer
- Data Analyst
- Data Scientist
- Cybersecurity Analyst
- Machine Learning Engineer
- DevOps Engineer
```

---

## 📝 Test Without Resume File

```python
# Create sample text
sample_text = """
JOHN DOE
Software Engineer

SKILLS:
- Programming: Python, JavaScript, Java, C++
- Web: React, Node.js, Express.js, HTML, CSS
- Databases: MongoDB, PostgreSQL, MySQL
- Cloud: AWS, Docker, Kubernetes
- Tools: Git, Jenkins, JIRA

EXPERIENCE:
Senior Developer at Tech Corp (2020-Present)
- Developed React applications with Redux
- Built REST APIs using Node.js and Express
- Deployed microservices on AWS using Docker
- Implemented CI/CD pipelines with Jenkins
"""

# Extract skills
from extractors.skill_extractor import extract_skills
skills = extract_skills(sample_text)
print(f"Extracted Skills: {skills}")

# Analyze for a role
from analyzers.skill_gap_analyzer import analyze_skill_gap
result = analyze_skill_gap(skills, 'Full Stack Developer')
print(f"\nAnalysis Results:")
print(f"Match: {result['overall_match_percentage']}%")
print(f"Skill Level: {result['skill_level']}")
```

---

## 🔧 Common Tasks

### Task 1: Get Skills for a Job Role

```python
from datasets.job_skills import get_job_skills

skills = get_job_skills('Frontend Developer')
print("Required Skills:", skills['required_skills'])
print("Preferred Skills:", skills['preferred_skills'])
```

### Task 2: Categorize Extracted Skills

```python
from extractors.skill_extractor import SkillExtractor

extractor = SkillExtractor()
skills = ['Python', 'React', 'MongoDB', 'AWS', 'Docker']
categorized = extractor.categorize_skills(skills)

for category, category_skills in categorized.items():
    print(f"{category}: {category_skills}")
```

### Task 3: Preprocess Text

```python
from preprocess.text_processor import preprocess_text

text = "Developed React Applications using TypeScript and Redux"
tokens = preprocess_text(text)
print(tokens)
# Output: ['develop', 'react', 'application', 'typescript', 'redux']
```

### Task 4: Save Results to JSON

```python
from utils.json_generator import save_json_output

result = {
    "user": "John Doe",
    "match": 75.5,
    "skills": ["Python", "React", "MongoDB"]
}

filepath = save_json_output(result, "analysis_result.json")
print(f"Saved to: {filepath}")
```

---

## 🎓 Learning Path

1. **Start Simple**: Extract skills from text
2. **Analyze Gaps**: Compare skills against job roles
3. **Complete Pipeline**: Process actual resume files
4. **Advanced**: Compare multiple roles, customize analysis

---

## 📚 Next Steps

- Read full documentation: `docs/AI_MODULE_DOCUMENTATION.md`
- Check installation guide: `docs/INSTALLATION_GUIDE.md`
- Run test examples: `python test_example.py`
- Explore code: Start with `main.py`

---

## 🐛 Troubleshooting

### Issue: Module not found

```bash
# Make sure you're in the ai-module directory
cd ai-module

# Install dependencies
pip install -r requirements.txt
```

### Issue: spaCy model not found

```bash
python -m spacy download en_core_web_sm
```

### Issue: NLTK data missing

```python
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
```

---

## ✅ Verification

Run this to verify everything works:

```python
from main import main
main()
```

You should see:
```
============================================================
AI-Powered Resume Analysis Engine
============================================================

Available Job Roles:
1. Frontend Developer
2. Backend Developer
...
```

---

## 🎉 You're Ready!

Start analyzing resumes and bridging skills to careers!

```python
from main import process_resume_complete

result = process_resume_complete('your_resume.pdf', 'Your Target Role')
print(f"Match: {result['data']['matchPercentage']}%")
```

---

**Need Help?** Check the full documentation or contact the development team.
