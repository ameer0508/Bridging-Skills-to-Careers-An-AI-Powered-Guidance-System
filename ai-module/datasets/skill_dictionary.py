"""
Comprehensive Skill Dictionary
Contains categorized technical skills for extraction
"""

SKILL_DICTIONARY = {
    "programming_languages": [
        "Python", "JavaScript", "Java", "C++", "C#", "C", "Go", "Rust",
        "Ruby", "PHP", "Swift", "Kotlin", "TypeScript", "Scala", "R",
        "Perl", "Dart", "Objective-C", "Shell", "Bash", "PowerShell"
    ],
    
    "web_frameworks": [
        "React", "Angular", "Vue.js", "Next.js", "Nuxt.js", "Svelte",
        "Django", "Flask", "FastAPI", "Express.js", "Node.js", "Spring Boot",
        "ASP.NET", "Laravel", "Ruby on Rails", "Gatsby", "Ember.js"
    ],
    
    "databases": [
        "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle",
        "SQL Server", "MariaDB", "Cassandra", "DynamoDB", "Elasticsearch",
        "Neo4j", "CouchDB", "Firebase", "Supabase", "SQL", "NoSQL"
    ],
    
    "cloud_platforms": [
        "AWS", "Azure", "GCP", "Google Cloud", "Heroku", "DigitalOcean",
        "Linode", "IBM Cloud", "Oracle Cloud", "Alibaba Cloud",
        "AWS Lambda", "EC2", "S3", "CloudFront", "Azure Functions"
    ],
    
    "devops_tools": [
        "Docker", "Kubernetes", "Jenkins", "GitLab CI", "GitHub Actions",
        "CircleCI", "Travis CI", "Terraform", "Ansible", "Chef", "Puppet",
        "Vagrant", "Helm", "ArgoCD", "Prometheus", "Grafana", "ELK Stack"
    ],
    
    "version_control": [
        "Git", "GitHub", "GitLab", "Bitbucket", "SVN", "Mercurial"
    ],
    
    "data_science": [
        "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch", "Keras",
        "Matplotlib", "Seaborn", "Plotly", "Jupyter", "Tableau", "Power BI",
        "Apache Spark", "Hadoop", "Airflow", "MLflow", "XGBoost", "LightGBM"
    ],
    
    "ai_ml": [
        "Machine Learning", "Deep Learning", "Neural Networks", "NLP",
        "Computer Vision", "Natural Language Processing", "CNN", "RNN",
        "LSTM", "Transformer", "BERT", "GPT", "Reinforcement Learning",
        "Feature Engineering", "Model Deployment", "MLOps", "AutoML"
    ],
    
    "cybersecurity": [
        "Penetration Testing", "Ethical Hacking", "Network Security",
        "SIEM", "Firewall", "IDS", "IPS", "Wireshark", "Metasploit",
        "Nmap", "Burp Suite", "OWASP", "Cryptography", "SSL", "TLS",
        "Vulnerability Assessment", "Incident Response", "SOC", "Forensics"
    ],
    
    "mobile_development": [
        "React Native", "Flutter", "Swift", "Kotlin", "Android", "iOS",
        "Xamarin", "Ionic", "Cordova", "Mobile UI", "App Development"
    ],
    
    "testing": [
        "Jest", "Mocha", "Pytest", "JUnit", "Selenium", "Cypress",
        "Testing Library", "Unit Testing", "Integration Testing",
        "E2E Testing", "TDD", "BDD", "Test Automation"
    ],
    
    "design_tools": [
        "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator",
        "InVision", "Zeplin", "UI/UX", "Wireframing", "Prototyping"
    ],
    
    "methodologies": [
        "Agile", "Scrum", "Kanban", "DevOps", "CI/CD", "TDD", "BDD",
        "Microservices", "REST API", "GraphQL", "SOAP", "Waterfall"
    ],
    
    "certifications": [
        "AWS Certified", "Azure Certified", "GCP Certified", "CISSP",
        "CEH", "CompTIA Security+", "CCNA", "CCNP", "PMP", "Scrum Master",
        "Kubernetes Certified", "Docker Certified", "Oracle Certified"
    ],
    
    "soft_skills": [
        "Leadership", "Communication", "Team Collaboration", "Problem Solving",
        "Critical Thinking", "Project Management", "Time Management",
        "Analytical Skills", "Creativity", "Adaptability"
    ]
}


def get_all_skills() -> list:
    """
    Get flat list of all skills from dictionary
    
    Returns:
        list: All skills combined
    """
    all_skills = []
    for category, skills in SKILL_DICTIONARY.items():
        all_skills.extend(skills)
    return list(set(all_skills))  # Remove duplicates


def get_skills_by_category(category: str) -> list:
    """
    Get skills for a specific category
    
    Args:
        category (str): Category name
        
    Returns:
        list: Skills in that category
    """
    return SKILL_DICTIONARY.get(category, [])
