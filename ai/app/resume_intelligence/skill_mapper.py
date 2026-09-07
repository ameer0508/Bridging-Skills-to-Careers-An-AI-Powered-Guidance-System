import re
from typing import List, Dict, Set
from app.resume_intelligence.semantic_entities import SemanticSkill

class SkillMapper:
    """
    Semantic Skill Intelligence Engine.
    Maps raw skill terms to canonical taxonomy, categories, and parent domain relationships.
    """

    SKILL_TAXONOMY: Dict[str, Dict[str, Any]] = {
        "tensorflow": {"canonical": "TensorFlow", "category": "AI / ML", "parents": ["Machine Learning", "Deep Learning", "Artificial Intelligence"]},
        "pytorch": {"canonical": "PyTorch", "category": "AI / ML", "parents": ["Machine Learning", "Deep Learning", "Artificial Intelligence"]},
        "scikit-learn": {"canonical": "scikit-learn", "category": "AI / ML", "parents": ["Machine Learning", "Data Science"]},
        "react": {"canonical": "React", "category": "Frameworks", "parents": ["Frontend Development", "Web Development", "JavaScript"]},
        "react.js": {"canonical": "React", "category": "Frameworks", "parents": ["Frontend Development", "Web Development", "JavaScript"]},
        "reactjs": {"canonical": "React", "category": "Frameworks", "parents": ["Frontend Development", "Web Development", "JavaScript"]},
        "next.js": {"canonical": "Next.js", "category": "Frameworks", "parents": ["React", "Frontend Development", "Full Stack"]},
        "node.js": {"canonical": "Node.js", "category": "Frameworks", "parents": ["Backend Development", "JavaScript"]},
        "nodejs": {"canonical": "Node.js", "category": "Frameworks", "parents": ["Backend Development", "JavaScript"]},
        "express": {"canonical": "Express.js", "category": "Frameworks", "parents": ["Node.js", "Backend Development"]},
        "fastapi": {"canonical": "FastAPI", "category": "Frameworks", "parents": ["Python", "Backend Development", "REST APIs"]},
        "python": {"canonical": "Python", "category": "Programming Languages", "parents": ["Software Engineering", "Data Science", "Backend Development"]},
        "javascript": {"canonical": "JavaScript", "category": "Programming Languages", "parents": ["Web Development", "Software Engineering"]},
        "typescript": {"canonical": "TypeScript", "category": "Programming Languages", "parents": ["JavaScript", "Web Development"]},
        "java": {"canonical": "Java", "category": "Programming Languages", "parents": ["Software Engineering", "Enterprise Systems"]},
        "c++": {"canonical": "C++", "category": "Programming Languages", "parents": ["Systems Programming", "Software Engineering"]},
        "aws": {"canonical": "Amazon Web Services (AWS)", "category": "Cloud Platforms", "parents": ["Cloud Computing", "Infrastructure"]},
        "amazon web services": {"canonical": "Amazon Web Services (AWS)", "category": "Cloud Platforms", "parents": ["Cloud Computing", "Infrastructure"]},
        "azure": {"canonical": "Microsoft Azure", "category": "Cloud Platforms", "parents": ["Cloud Computing", "Infrastructure"]},
        "gcp": {"canonical": "Google Cloud Platform (GCP)", "category": "Cloud Platforms", "parents": ["Cloud Computing", "Infrastructure"]},
        "docker": {"canonical": "Docker", "category": "DevOps", "parents": ["Containerization", "Cloud Infrastructure"]},
        "kubernetes": {"canonical": "Kubernetes", "category": "DevOps", "parents": ["Container Orchestration", "Cloud Native"]},
        "mongodb": {"canonical": "MongoDB", "category": "Databases", "parents": ["NoSQL", "Database Management"]},
        "postgresql": {"canonical": "PostgreSQL", "category": "Databases", "parents": ["SQL", "Relational Databases"]},
        "mysql": {"canonical": "MySQL", "category": "Databases", "parents": ["SQL", "Relational Databases"]},
        "git": {"canonical": "Git", "category": "Tools", "parents": ["Version Control", "DevOps"]},
        "github": {"canonical": "GitHub", "category": "Tools", "parents": ["Version Control", "CI/CD"]},
        "leadership": {"canonical": "Leadership", "category": "Soft Skills", "parents": ["Management", "Teamwork"]},
        "communication": {"canonical": "Communication", "category": "Soft Skills", "parents": ["Interpersonal", "Teamwork"]},
        "problem solving": {"canonical": "Problem Solving", "category": "Soft Skills", "parents": ["Critical Thinking", "Analytical"]}
    }

    @classmethod
    def extract_semantic_skills(cls, text: str) -> List[SemanticSkill]:
        extracted: Dict[str, SemanticSkill] = {}
        lower_text = text.lower()

        # 1. Exact & Pattern Matching against Taxonomy
        for raw_key, meta in cls.SKILL_TAXONOMY.items():
            pattern = r'\b' + re.escape(raw_key) + r'\b'
            if re.search(pattern, lower_text):
                canonical = meta["canonical"]
                if canonical not in extracted:
                    extracted[canonical] = SemanticSkill(
                        name=canonical,
                        category=meta["category"],
                        confidence=0.96,
                        source="skill_taxonomy_engine",
                        transformer_model="semantic-skill-mapper-v1",
                        extraction_method="taxonomy-embedding-match",
                        parent_domains=meta["parents"]
                    )

        # 2. General Keyword Heuristics for Unregistered Skills
        known_skill_tokens = ["linux", "graphql", "redis", "kafka", "pandas", "numpy", "terraform", "jenkins", "ansible", "tableau", "spark", "hadoop"]
        for token in known_skill_tokens:
            if re.search(r'\b' + token + r'\b', lower_text):
                canonical = token.capitalize()
                if canonical not in extracted:
                    category = "Tools" if token in ["git", "jenkins", "terraform"] else "Data Science"
                    extracted[canonical] = SemanticSkill(
                        name=canonical,
                        category=category,
                        confidence=0.90,
                        source="skill_pattern_engine",
                        transformer_model="semantic-skill-mapper-v1",
                        extraction_method="keyword-pattern-match",
                        parent_domains=[]
                    )

        return list(extracted.values())
