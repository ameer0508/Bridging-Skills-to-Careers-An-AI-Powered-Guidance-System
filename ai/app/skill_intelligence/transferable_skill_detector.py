from typing import List, Dict

class TransferableSkillDetector:
    """
    Infers cross-domain transferable capabilities from technical skills.
    """

    TRANSFERABLE_MAP: Dict[str, List[str]] = {
        "python": ["Automation", "Data Analysis", "Machine Learning", "Backend Development"],
        "javascript": ["Web Development", "Frontend Engineering", "Asynchronous Programming"],
        "typescript": ["Software Architecture", "Type Safety", "Frontend & Backend Development"],
        "linux": ["System Administration", "DevOps", "Cloud Operations", "Cybersecurity"],
        "docker": ["Containerization", "DevOps", "Microservices Deployment"],
        "sql": ["Data Querying", "Database Management", "Business Intelligence"],
        "git": ["Version Control", "Collaborative Software Engineering", "CI/CD Workflows"],
        "c++": ["Memory Management", "High Performance Computing", "Systems Programming"],
        "java": ["Object-Oriented Design", "Enterprise Architecture", "Backend Engineering"],
        "aws": ["Cloud Infrastructure", "System Scalability", "DevOps"]
    }

    @classmethod
    def detect_transferable_skills(cls, canonical_name: str) -> List[str]:
        clean = canonical_name.lower()

        for key, skills in cls.TRANSFERABLE_MAP.items():
            if key in clean:
                return skills

        # Default heuristic transferable skills
        return ["Problem Solving", "Software Engineering Best Practices"]
