from typing import Dict, List, Any, Optional

class OntologyManager:
    """
    Enterprise Hierarchical Skill Taxonomy Manager covering 16 core technical and professional domains.
    """

    TAXONOMY: Dict[str, Dict[str, Any]] = {
        "Programming Languages": {
            "description": "Core software development programming languages",
            "skills": ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "SQL", "HTML", "CSS"]
        },
        "Cloud Platforms": {
            "description": "Cloud infrastructure, serverless, and cloud provider services",
            "skills": ["Amazon Web Services (AWS)", "Microsoft Azure", "Google Cloud Platform (GCP)", "Serverless", "Cloudflare"]
        },
        "AI / ML": {
            "description": "Artificial Intelligence, Machine Learning, Deep Learning, and Generative AI",
            "skills": ["TensorFlow", "PyTorch", "Transformers", "scikit-learn", "Generative AI", "LLMs", "LangChain", "RAG", "Prompt Engineering", "MLOps", "OpenCV", "NLP"]
        },
        "Cybersecurity": {
            "description": "Security engineering, penetration testing, and information defense",
            "skills": ["Penetration Testing", "Network Security", "Cryptography", "SIEM", "SOC Analysis", "Vulnerability Assessment", "Identity & Access Management (IAM)"]
        },
        "Data Science": {
            "description": "Data analysis, data engineering, visualization, and big data processing",
            "skills": ["pandas", "NumPy", "Apache Spark", "Hadoop", "Tableau", "Power BI", "Data Wrangling", "Feature Engineering"]
        },
        "DevOps": {
            "description": "Continuous integration, containerization, orchestration, and infrastructure as code",
            "skills": ["Docker", "Kubernetes", "Terraform", "Jenkins", "Ansible", "GitLab CI/CD", "GitHub Actions", "Helm", "Prometheus"]
        },
        "Databases": {
            "description": "Relational, NoSQL, in-memory, and vector database management systems",
            "skills": ["PostgreSQL", "MongoDB", "MySQL", "Redis", "Vector Databases", "Pinecone", "ChromaDB", "Elasticsearch", "Neo4j"]
        },
        "Frontend": {
            "description": "User interface, client-side frameworks, and web design technologies",
            "skills": ["React", "Next.js", "Vue.js", "Angular", "Tailwind CSS", "Redux", "HTML5", "CSS3", "Webpack", "Vite"]
        },
        "Backend": {
            "description": "Server-side web development, API architecture, and microservices",
            "skills": ["Node.js", "FastAPI", "Express.js", "Django", "Spring Boot", "Flask", "gRPC", "GraphQL", "REST APIs", "Microservices"]
        },
        "Mobile": {
            "description": "Mobile application development for iOS and Android",
            "skills": ["React Native", "Flutter", "iOS Development", "Android Development", "SwiftUI", "Jetpack Compose"]
        },
        "Testing": {
            "description": "Software quality assurance, unit testing, and end-to-end automation",
            "skills": ["PyTest", "Jest", "Selenium", "Cypress", "Postman", "JUnit", "Unit Testing", "E2E Testing"]
        },
        "Networking": {
            "description": "Computer networking protocols, architecture, and web communication",
            "skills": ["TCP/IP", "DNS", "HTTP/HTTPS", "WebSockets", "Load Balancing", "VPN", "Firewalls"]
        },
        "Operating Systems": {
            "description": "System administration, shell scripting, and OS environments",
            "skills": ["Linux", "Ubuntu", "Bash", "Shell Scripting", "Windows Server", "macOS"]
        },
        "Soft Skills": {
            "description": "Interpersonal, cognitive, and collaborative human capabilities",
            "skills": ["Leadership", "Communication", "Problem Solving", "Teamwork", "Critical Thinking", "Adaptability", "Time Management"]
        },
        "Business Skills": {
            "description": "Project management, agile methodologies, and product strategy",
            "skills": ["Project Management", "Agile", "Scrum", "Product Management", "Business Analysis", "Strategic Planning"]
        },
        "Research Skills": {
            "description": "Academic research, technical publication, and empirical analysis",
            "skills": ["Technical Writing", "Literature Review", "Experimental Design", "Statistical Analysis", "Data Mining"]
        }
    }

    @classmethod
    def get_category_for_skill(cls, canonical_name: str) -> str:
        clean = canonical_name.lower()
        for category, data in cls.TAXONOMY.items():
            for s in data["skills"]:
                if s.lower() == clean:
                    return category

        # Heuristic rules
        if any(kw in clean for kw in ["api", "backend", "service", "framework"]):
            return "Backend"
        elif any(kw in clean for kw in ["cloud", "aws", "azure"]):
            return "Cloud Platforms"
        elif any(kw in clean for kw in ["ai", "ml", "model", "learning"]):
            return "AI / ML"
        elif any(kw in clean for kw in ["db", "sql", "data"]):
            return "Databases"
        return "Tools"

    @classmethod
    def get_all_categories(cls) -> List[str]:
        return list(cls.TAXONOMY.keys())
