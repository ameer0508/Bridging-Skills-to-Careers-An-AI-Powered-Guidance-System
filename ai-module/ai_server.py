"""
AI HTTP Server — Python 3.14 compatible
Serves AI endpoints on port 5001.
Uses only: stdlib, PyPDF2, python-docx, nltk, sklearn, re
No spaCy dependency (incompatible with Python 3.14).
"""

import json
import re
import os
import sys
import math
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import io

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger('ai_server')

# ── Skill Dictionary ───────────────────────────────────────────────────────────
SKILLS = {
    'programming': ['Python','JavaScript','TypeScript','Java','C++','C#','Go','Rust','Ruby','PHP','Swift','Kotlin','Scala','R','MATLAB'],
    'frontend': ['React','Vue.js','Angular','HTML','CSS','Sass','Tailwind CSS','Bootstrap','Next.js','Nuxt.js','Svelte','Redux','GraphQL','Webpack','Vite'],
    'backend': ['Node.js','Express.js','Django','Flask','FastAPI','Spring Boot','Laravel','Ruby on Rails','ASP.NET','NestJS','Fastify'],
    'database': ['MongoDB','PostgreSQL','MySQL','SQLite','Redis','Elasticsearch','Cassandra','DynamoDB','Firebase','Supabase','SQL','NoSQL'],
    'devops': ['Docker','Kubernetes','AWS','GCP','Azure','CI/CD','Jenkins','GitHub Actions','Terraform','Ansible','Linux','Nginx','Apache'],
    'data': ['Pandas','NumPy','Matplotlib','Seaborn','Scikit-learn','TensorFlow','PyTorch','Keras','Jupyter','Tableau','Power BI','Excel','Statistics'],
    'tools': ['Git','GitHub','Jira','Figma','Postman','VS Code','IntelliJ','Agile','Scrum','REST APIs','Microservices','System Design'],
    'security': ['Cybersecurity','Network Security','Penetration Testing','OWASP','Cryptography','Firewalls','SIEM','Ethical Hacking'],
    'ml': ['Machine Learning','Deep Learning','NLP','Computer Vision','Reinforcement Learning','Feature Engineering','Model Deployment','MLOps','LLMs'],
}

ALL_SKILLS = [s for cat in SKILLS.values() for s in cat]
SKILL_LOWER_MAP = {s.lower(): s for s in ALL_SKILLS}

# ── Job Role Requirements ──────────────────────────────────────────────────────
JOB_ROLES = {
    'frontend developer': {
        'required': ['HTML','CSS','JavaScript','React','Git'],
        'preferred': ['TypeScript','Redux','Next.js','Tailwind CSS','Webpack','Vite','REST APIs'],
        'salary': '$85K–$140K', 'demand': 'High',
    },
    'backend developer': {
        'required': ['Node.js','Python','SQL','REST APIs','Git'],
        'preferred': ['Docker','MongoDB','PostgreSQL','Redis','Microservices','AWS'],
        'salary': '$90K–$155K', 'demand': 'Very High',
    },
    'full stack developer': {
        'required': ['JavaScript','React','Node.js','SQL','Git'],
        'preferred': ['TypeScript','MongoDB','Docker','AWS','GraphQL','CI/CD'],
        'salary': '$95K–$160K', 'demand': 'Very High',
    },
    'data analyst': {
        'required': ['Python','SQL','Excel','Statistics','Pandas'],
        'preferred': ['Tableau','Power BI','NumPy','Matplotlib','Machine Learning'],
        'salary': '$70K–$115K', 'demand': 'High',
    },
    'machine learning engineer': {
        'required': ['Python','Machine Learning','Scikit-learn','NumPy','Pandas'],
        'preferred': ['TensorFlow','PyTorch','Deep Learning','MLOps','Docker','AWS'],
        'salary': '$120K–$195K', 'demand': 'Explosive',
    },
    'cybersecurity analyst': {
        'required': ['Linux','Network Security','Python','Cybersecurity','Git'],
        'preferred': ['Penetration Testing','SIEM','Cryptography','Firewalls','OWASP'],
        'salary': '$90K–$150K', 'demand': 'Critical',
    },
    'devops engineer': {
        'required': ['Linux','Docker','CI/CD','AWS','Git'],
        'preferred': ['Kubernetes','Terraform','Ansible','Python','Monitoring'],
        'salary': '$100K–$165K', 'demand': 'Very High',
    },
    'data scientist': {
        'required': ['Python','Machine Learning','Statistics','SQL','Pandas'],
        'preferred': ['TensorFlow','Deep Learning','NLP','Tableau','Spark'],
        'salary': '$110K–$180K', 'demand': 'High',
    },
}

# ── Skill Extraction ───────────────────────────────────────────────────────────
def extract_skills_from_text(text):
    """Extract skills using regex word-boundary matching."""
    if not text:
        return []
    found = set()
    text_lower = text.lower()
    for skill_lower, skill_original in SKILL_LOWER_MAP.items():
        pattern = r'\b' + re.escape(skill_lower) + r'\b'
        if re.search(pattern, text_lower):
            found.add(skill_original)
    return sorted(list(found))

# ── TF-IDF Cosine Similarity ───────────────────────────────────────────────────
def cosine_similarity_skills(user_skills, required_skills):
    """Compute match score between user skills and required skills."""
    if not required_skills:
        return 0.0
    user_set = set(s.lower() for s in user_skills)
    req_set  = set(s.lower() for s in required_skills)
    intersection = user_set & req_set
    return round(len(intersection) / len(req_set) * 100, 1)

# ── Skill Gap Analysis ─────────────────────────────────────────────────────────
def analyze_skill_gap(user_skills, target_role):
    role_key = target_role.lower().strip()
    role_data = JOB_ROLES.get(role_key)

    if not role_data:
        # Try partial match
        for key in JOB_ROLES:
            if key in role_key or role_key in key:
                role_data = JOB_ROLES[key]
                role_key = key
                break

    if not role_data:
        return {'error': f'Role "{target_role}" not found', 'available': list(JOB_ROLES.keys())}

    required  = role_data['required']
    preferred = role_data['preferred']
    user_lower = set(s.lower() for s in user_skills)

    req_match  = cosine_similarity_skills(user_skills, required)
    pref_match = cosine_similarity_skills(user_skills, preferred)
    overall    = round(req_match * 0.7 + pref_match * 0.3, 1)

    existing_req  = [s for s in required  if s.lower() in user_lower]
    missing_req   = [s for s in required  if s.lower() not in user_lower]
    existing_pref = [s for s in preferred if s.lower() in user_lower]
    missing_pref  = [s for s in preferred if s.lower() not in user_lower]

    return {
        'targetRole': target_role,
        'matchScore': overall,
        'requiredMatch': req_match,
        'preferredMatch': pref_match,
        'userSkills': user_skills,
        'existingSkills': {'required': existing_req, 'preferred': existing_pref},
        'missingSkills': {'required': missing_req, 'preferred': missing_pref},
        'totalRequired': len(required),
        'totalPreferred': len(preferred),
        'salary': role_data.get('salary', 'N/A'),
        'demand': role_data.get('demand', 'N/A'),
    }

# ── Career Matching ────────────────────────────────────────────────────────────
def match_careers(user_skills):
    results = []
    for role, data in JOB_ROLES.items():
        req_score  = cosine_similarity_skills(user_skills, data['required'])
        pref_score = cosine_similarity_skills(user_skills, data['preferred'])
        overall    = round(req_score * 0.7 + pref_score * 0.3, 1)
        results.append({
            'role': role.title(),
            'matchScore': overall,
            'salary': data.get('salary', 'N/A'),
            'demand': data.get('demand', 'N/A'),
        })
    results.sort(key=lambda x: x['matchScore'], reverse=True)
    return results

# ── Readiness Score ────────────────────────────────────────────────────────────
def compute_readiness(user_skills, target_role, has_resume=False, roadmap_progress=0):
    gap = analyze_skill_gap(user_skills, target_role)
    if 'error' in gap:
        return {'score': 0, 'breakdown': {}}
    skill_score    = gap['matchScore']
    resume_score   = 80 if has_resume else 20
    roadmap_score  = min(100, roadmap_progress)
    profile_score  = min(100, len(user_skills) * 8)
    overall = round(skill_score * 0.5 + resume_score * 0.2 + roadmap_score * 0.2 + profile_score * 0.1, 1)
    return {
        'score': overall,
        'breakdown': {
            'skillMatch': skill_score,
            'resumeStrength': resume_score,
            'roadmapProgress': roadmap_score,
            'profileCompleteness': profile_score,
        }
    }

# ── Resume Parsing ─────────────────────────────────────────────────────────────
def parse_pdf(file_bytes):
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ''
        for page in reader.pages:
            text += page.extract_text() or ''
        return text
    except Exception as e:
        logger.error(f'PDF parse error: {e}')
        return ''

def parse_docx(file_bytes):
    try:
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        return '\n'.join(p.text for p in doc.paragraphs)
    except Exception as e:
        logger.error(f'DOCX parse error: {e}')
        return ''

# ── HTTP Handler ───────────────────────────────────────────────────────────────
class AIHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        logger.info(f'{self.address_string()} - {format % args}')

    def send_json(self, status, data):
        body = json.dumps({'success': status < 400, 'data': data}).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def read_json_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length))

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/health':
            self.send_json(200, {'status': 'running', 'service': 'AI Engine'})
        elif path == '/api/ai/roles':
            self.send_json(200, {'roles': [r.title() for r in JOB_ROLES.keys()]})
        elif path == '/api/ai/skills':
            self.send_json(200, {'skills': ALL_SKILLS, 'categories': {k: v for k, v in SKILLS.items()}})
        else:
            self.send_json(404, {'error': 'Not found'})

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            body = self.read_json_body()

            if path == '/api/ai/extract-skills':
                text = body.get('text', '')
                skills = extract_skills_from_text(text)
                self.send_json(200, {'skills': skills, 'count': len(skills)})

            elif path == '/api/ai/skill-gap':
                skills = body.get('skills', [])
                role   = body.get('targetRole', '')
                result = analyze_skill_gap(skills, role)
                self.send_json(200 if 'error' not in result else 400, result)

            elif path == '/api/ai/career-match':
                skills = body.get('skills', [])
                result = match_careers(skills)
                self.send_json(200, {'matches': result})

            elif path == '/api/ai/readiness':
                skills   = body.get('skills', [])
                role     = body.get('targetRole', '')
                resume   = body.get('hasResume', False)
                progress = body.get('roadmapProgress', 0)
                result   = compute_readiness(skills, role, resume, progress)
                self.send_json(200, result)

            elif path == '/api/ai/parse-resume':
                # Expects base64-encoded file content
                import base64
                file_b64  = body.get('fileContent', '')
                file_type = body.get('fileType', 'pdf')
                if not file_b64:
                    self.send_json(400, {'error': 'fileContent required'})
                    return
                file_bytes = base64.b64decode(file_b64)
                text = parse_pdf(file_bytes) if 'pdf' in file_type else parse_docx(file_bytes)
                skills = extract_skills_from_text(text)
                self.send_json(200, {
                    'text': text[:2000],
                    'skills': skills,
                    'skillCount': len(skills),
                    'charCount': len(text),
                })

            elif path == '/api/ai/interview-questions':
                role  = body.get('targetRole', 'Software Engineer')
                count = min(int(body.get('count', 5)), 10)
                questions = generate_interview_questions(role, count)
                self.send_json(200, {'questions': questions, 'role': role})

            else:
                self.send_json(404, {'error': 'Endpoint not found'})

        except Exception as e:
            logger.error(f'Handler error: {e}')
            self.send_json(500, {'error': str(e)})

# ── Interview Question Generator ───────────────────────────────────────────────
INTERVIEW_BANK = {
    'frontend': [
        'Explain the difference between var, let, and const in JavaScript.',
        'What is the Virtual DOM and how does React use it?',
        'Describe CSS specificity and how it works.',
        'What are React hooks and why were they introduced?',
        'Explain the concept of closures in JavaScript.',
        'What is the difference between == and === in JavaScript?',
        'How does event delegation work in the DOM?',
        'What is a Promise and how does async/await work?',
        'Explain the CSS box model.',
        'What are Web Vitals and why do they matter?',
    ],
    'backend': [
        'What is the difference between REST and GraphQL?',
        'Explain database indexing and when to use it.',
        'What is middleware in Express.js?',
        'How do you handle authentication in a Node.js API?',
        'Explain the difference between SQL and NoSQL databases.',
        'What is connection pooling and why is it important?',
        'How do you prevent SQL injection attacks?',
        'Explain the CAP theorem.',
        'What is rate limiting and how do you implement it?',
        'Describe the difference between horizontal and vertical scaling.',
    ],
    'data': [
        'What is the difference between supervised and unsupervised learning?',
        'Explain overfitting and how to prevent it.',
        'What is cross-validation and why is it used?',
        'Describe the bias-variance tradeoff.',
        'What is feature engineering?',
        'Explain the difference between precision and recall.',
        'What is a confusion matrix?',
        'How does gradient descent work?',
        'What is regularization in machine learning?',
        'Explain the difference between bagging and boosting.',
    ],
    'general': [
        'Tell me about a challenging technical problem you solved.',
        'How do you approach debugging a complex issue?',
        'Describe your experience with version control.',
        'How do you stay updated with new technologies?',
        'Explain a time you had to learn a new technology quickly.',
        'How do you handle code reviews?',
        'Describe your approach to writing clean, maintainable code.',
        'How do you prioritize tasks when working on multiple projects?',
        'What is your experience with Agile/Scrum methodologies?',
        'How do you handle disagreements with teammates about technical decisions?',
    ],
}

def generate_interview_questions(role, count=5):
    role_lower = role.lower()
    if 'frontend' in role_lower or 'react' in role_lower or 'ui' in role_lower:
        pool = INTERVIEW_BANK['frontend']
    elif 'backend' in role_lower or 'node' in role_lower or 'api' in role_lower:
        pool = INTERVIEW_BANK['backend']
    elif 'data' in role_lower or 'ml' in role_lower or 'machine' in role_lower:
        pool = INTERVIEW_BANK['data']
    else:
        pool = INTERVIEW_BANK['general']

    import random
    selected = random.sample(pool, min(count, len(pool)))
    return [{'id': i+1, 'question': q, 'category': role, 'difficulty': ['Easy','Medium','Hard'][i % 3]} for i, q in enumerate(selected)]

# ── Main ───────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('AI_PORT', 5001))
    server = HTTPServer(('0.0.0.0', port), AIHandler)
    logger.info(f'🤖 AI Engine running on http://localhost:{port}')
    logger.info(f'   Endpoints: /health, /api/ai/skill-gap, /api/ai/career-match,')
    logger.info(f'              /api/ai/extract-skills, /api/ai/readiness,')
    logger.info(f'              /api/ai/parse-resume, /api/ai/interview-questions')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info('AI Engine stopped.')
