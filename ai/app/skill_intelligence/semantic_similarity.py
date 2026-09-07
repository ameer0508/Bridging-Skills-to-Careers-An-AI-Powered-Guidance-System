import re
from typing import Dict, Optional, Tuple

class SemanticSimilarity:
    """
    Handles abbreviation resolution, alias normalization, and fuzzy string similarity for tech skills.
    """

    ALIAS_MAP: Dict[str, str] = {
        "js": "JavaScript",
        "javascript": "JavaScript",
        "ts": "TypeScript",
        "typescript": "TypeScript",
        "node": "Node.js",
        "nodejs": "Node.js",
        "node.js": "Node.js",
        "react": "React",
        "reactjs": "React",
        "react.js": "React",
        "next": "Next.js",
        "nextjs": "Next.js",
        "next.js": "Next.js",
        "py": "Python",
        "python3": "Python",
        "tf": "TensorFlow",
        "tensorflow": "TensorFlow",
        "tensorflow 2": "TensorFlow",
        "tf2": "TensorFlow",
        "pytorch": "PyTorch",
        "aws": "Amazon Web Services (AWS)",
        "amazon web services": "Amazon Web Services (AWS)",
        "gcp": "Google Cloud Platform (GCP)",
        "google cloud": "Google Cloud Platform (GCP)",
        "k8s": "Kubernetes",
        "kubernetes": "Kubernetes",
        "postgres": "PostgreSQL",
        "postgresql": "PostgreSQL",
        "mongo": "MongoDB",
        "mongodb": "MongoDB",
        "docker": "Docker",
        "fastapi": "FastAPI",
        "express": "Express.js",
        "expressjs": "Express.js"
    }

    @classmethod
    def resolve_canonical_name(cls, raw_skill: str) -> Tuple[str, float]:
        """
        Resolves a raw skill string to its canonical name and similarity confidence.
        Returns (canonical_name, confidence).
        """
        if not raw_skill or not raw_skill.strip():
            return "", 0.0

        clean = raw_skill.strip().lower()

        # 1. Exact Alias Lookup
        if clean in cls.ALIAS_MAP:
            return cls.ALIAS_MAP[clean], 0.99

        # 2. Stripped Punctuation / Version Match
        clean_no_version = re.sub(r'\s+v?[0-9]+(?:\.[0-9]+)*$', '', clean).strip()
        if clean_no_version in cls.ALIAS_MAP:
            return cls.ALIAS_MAP[clean_no_version], 0.96

        # 3. Capitalization Normalization Fallback
        words = raw_skill.strip().split()
        capitalized = " ".join([w.capitalize() if w.lower() not in ["and", "of", "in", "for", "on"] else w for w in words])
        return capitalized, 0.90
