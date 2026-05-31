"""
Job Role Skill Database
Comprehensive skill requirements for different job roles
"""

JOB_ROLES = {
    "Frontend Developer": {
        "required_skills": [
            "HTML", "CSS", "JavaScript", "React", "Vue.js", "Angular",
            "TypeScript", "Responsive Design", "Git", "REST API"
        ],
        "preferred_skills": [
            "Redux", "Webpack", "Sass", "Bootstrap", "Tailwind CSS",
            "Jest", "Testing Library", "Next.js", "GraphQL", "Figma"
        ],
        "beginner_skills": [
            "HTML", "CSS", "JavaScript", "Git", "Responsive Design"
        ],
        "advanced_skills": [
            "React", "TypeScript", "Redux", "Webpack", "Performance Optimization",
            "Accessibility", "PWA", "Micro-frontends"
        ]
    },
    
    "Backend Developer": {
        "required_skills": [
            "Python", "Node.js", "Java", "SQL", "REST API", "Git",
            "Database Design", "Authentication", "API Development"
        ],
        "preferred_skills": [
            "Django", "Flask", "Express.js", "Spring Boot", "PostgreSQL",
            "MongoDB", "Redis", "Docker", "Microservices", "GraphQL"
        ],
        "beginner_skills": [
            "Python", "SQL", "Git", "REST API", "Basic Database"
        ],
        "advanced_skills": [
            "Microservices", "Docker", "Kubernetes", "Message Queues",
            "Caching", "Load Balancing", "System Design", "Security"
        ]
    },
    
    "Full Stack Developer": {
        "required_skills": [
            "HTML", "CSS", "JavaScript", "React", "Node.js", "Python",
            "SQL", "MongoDB", "REST API", "Git", "Docker"
        ],
        "preferred_skills": [
            "TypeScript", "Express.js", "Django", "PostgreSQL", "Redis",
            "AWS", "CI/CD", "Testing", "GraphQL", "Kubernetes"
        ],
        "beginner_skills": [
            "HTML", "CSS", "JavaScript", "Python", "SQL", "Git"
        ],
        "advanced_skills": [
            "Microservices", "System Design", "DevOps", "Cloud Architecture",
            "Performance Optimization", "Security", "Scalability"
        ]
    },
    
    "Data Analyst": {
        "required_skills": [
            "Python", "SQL", "Excel", "Data Visualization", "Statistics",
            "Pandas", "NumPy", "Tableau", "Power BI", "Data Cleaning"
        ],
        "preferred_skills": [
            "R", "Matplotlib", "Seaborn", "Jupyter", "ETL", "BigQuery",
            "Google Analytics", "A/B Testing", "Business Intelligence"
        ],
        "beginner_skills": [
            "Excel", "SQL", "Python", "Statistics", "Data Visualization"
        ],
        "advanced_skills": [
            "Advanced SQL", "Statistical Modeling", "Predictive Analytics",
            "Data Warehousing", "ETL Pipelines", "Big Data"
        ]
    },
    
    "Data Scientist": {
        "required_skills": [
            "Python", "R", "Machine Learning", "Statistics", "SQL",
            "Pandas", "NumPy", "Scikit-learn", "Data Visualization",
            "Deep Learning", "TensorFlow", "PyTorch"
        ],
        "preferred_skills": [
            "NLP", "Computer Vision", "Keras", "XGBoost", "Feature Engineering",
            "Model Deployment", "MLOps", "Spark", "Big Data", "Cloud ML"
        ],
        "beginner_skills": [
            "Python", "Statistics", "SQL", "Pandas", "NumPy", "Basic ML"
        ],
        "advanced_skills": [
            "Deep Learning", "Neural Networks", "NLP", "Computer Vision",
            "Model Optimization", "Production ML", "MLOps", "Research"
        ]
    },
    
    "Cybersecurity Analyst": {
        "required_skills": [
            "Network Security", "Penetration Testing", "SIEM", "Firewall",
            "IDS/IPS", "Vulnerability Assessment", "Incident Response",
            "Security Protocols", "Linux", "Windows Security"
        ],
        "preferred_skills": [
            "Python", "Wireshark", "Metasploit", "Nmap", "Burp Suite",
            "OWASP", "Cryptography", "Cloud Security", "Compliance",
            "Threat Intelligence", "SOC", "Forensics"
        ],
        "beginner_skills": [
            "Network Basics", "Security Fundamentals", "Linux", "Firewall",
            "Basic Cryptography"
        ],
        "advanced_skills": [
            "Advanced Penetration Testing", "Malware Analysis", "Reverse Engineering",
            "Threat Hunting", "Security Architecture", "Zero Trust", "Red Team"
        ]
    },
    
    "Machine Learning Engineer": {
        "required_skills": [
            "Python", "Machine Learning", "Deep Learning", "TensorFlow",
            "PyTorch", "Scikit-learn", "Neural Networks", "Model Deployment",
            "Git", "Docker", "MLOps"
        ],
        "preferred_skills": [
            "Kubernetes", "AWS SageMaker", "Azure ML", "Spark", "Airflow",
            "Feature Engineering", "Model Optimization", "A/B Testing",
            "CI/CD", "Monitoring", "NLP", "Computer Vision"
        ],
        "beginner_skills": [
            "Python", "Machine Learning", "Scikit-learn", "Statistics",
            "Data Processing"
        ],
        "advanced_skills": [
            "Deep Learning", "Model Optimization", "Distributed Training",
            "Production ML", "MLOps", "AutoML", "Research", "System Design"
        ]
    },
    
    "DevOps Engineer": {
        "required_skills": [
            "Linux", "Docker", "Kubernetes", "CI/CD", "Git", "AWS",
            "Terraform", "Ansible", "Jenkins", "Monitoring", "Scripting"
        ],
        "preferred_skills": [
            "Python", "Bash", "Azure", "GCP", "Prometheus", "Grafana",
            "ELK Stack", "GitLab CI", "GitHub Actions", "Helm",
            "Infrastructure as Code", "Security"
        ],
        "beginner_skills": [
            "Linux", "Git", "Docker", "Bash", "CI/CD Basics"
        ],
        "advanced_skills": [
            "Kubernetes", "Infrastructure as Code", "Cloud Architecture",
            "Security", "Monitoring", "Automation", "Scalability", "SRE"
        ]
    }
}


def get_job_skills(role: str) -> dict:
    """
    Get skill requirements for a specific job role
    
    Args:
        role (str): Job role name
        
    Returns:
        dict: Skill requirements or empty dict if role not found
    """
    return JOB_ROLES.get(role, {})


def get_all_roles() -> list:
    """
    Get list of all available job roles
    
    Returns:
        list: List of job role names
    """
    return list(JOB_ROLES.keys())
