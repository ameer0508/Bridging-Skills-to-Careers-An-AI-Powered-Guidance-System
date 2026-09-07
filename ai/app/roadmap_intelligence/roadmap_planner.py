"""
Roadmap Planner Module for Adaptive AI Learning Roadmap Engine.
Plans adaptive phase strategy tailored to user level, target role, and career background.
"""

from typing import List, Dict, Any


class RoadmapPlanner:
    """
    Formulates baseline roadmap phase structures based on target role domain requirements.
    """

    def plan_baseline_phases(self, current_level: str, target_role: str, target_months: int = 6) -> List[Dict[str, Any]]:
        """
        Generates domain-aware baseline phases for a target role.
        """
        role_norm = target_role.lower()

        if "ai" in role_norm or "machine learning" in role_norm:
            return [
                {
                    "phase": 1,
                    "title": "Foundational Python, Math & Data Engineering",
                    "duration_weeks": 4,
                    "focus_skills": ["Python", "Data Structures", "Linear Algebra", "Async FastAPI"],
                    "why_included": "Establishes core programming, mathematical logic, and API backend foundations.",
                    "prerequisites": ["Programming Fundamentals"],
                    "career_benefit": "Enables creation of robust API services and mathematical data manipulation.",
                    "estimated_effort": "15 hrs/week for 4 weeks",
                    "expected_outcome": "Functional Python API service with automated test coverage.",
                    "confidence": 0.98
                },
                {
                    "phase": 2,
                    "title": "Machine Learning Algorithms & Model Architecture",
                    "duration_weeks": 6,
                    "focus_skills": ["Machine Learning", "Scikit-Learn", "PyTorch", "Deep Learning"],
                    "why_included": "Core machine learning algorithms and deep neural network training techniques.",
                    "prerequisites": ["Python", "Linear Algebra"],
                    "career_benefit": "Unlocks ability to train, evaluate, and fine-tune machine learning models.",
                    "estimated_effort": "15 hrs/week for 6 weeks",
                    "expected_outcome": "Trained PyTorch model achieving benchmark accuracy on test datasets.",
                    "confidence": 0.96
                },
                {
                    "phase": 3,
                    "title": "LLMs, RAG Pipelines & Vector Databases",
                    "duration_weeks": 6,
                    "focus_skills": ["LLMs", "RAG Pipelines", "Vector Databases", "Milvus"],
                    "why_included": "Production Generative AI stack including vector similarity search and RAG.",
                    "prerequisites": ["Deep Learning", "Async FastAPI"],
                    "career_benefit": "Prepares candidate for high-demand AI Engineer and LLM Architect roles.",
                    "estimated_effort": "15 hrs/week for 6 weeks",
                    "expected_outcome": "Production RAG knowledge retrieval backend with vector similarity index.",
                    "confidence": 0.97
                },
                {
                    "phase": 4,
                    "title": "Microservices, Agentic AI & Cloud Deployment",
                    "duration_weeks": 4,
                    "focus_skills": ["Docker", "Kubernetes", "Agentic AI", "Microservices"],
                    "why_included": "Container orchestration and autonomous agentic workflow deployment.",
                    "prerequisites": ["RAG Pipelines", "Docker"],
                    "career_benefit": "Demonstrates enterprise-grade AI system architecture and cloud scaling.",
                    "estimated_effort": "15 hrs/week for 4 weeks",
                    "expected_outcome": "Deployed multi-agent microservice architecture on Kubernetes.",
                    "confidence": 0.95
                }
            ]
        elif "backend" in role_norm or "software" in role_norm:
            return [
                {
                    "phase": 1,
                    "title": "Core Languages & Data Structures",
                    "duration_weeks": 4,
                    "focus_skills": ["Python", "Data Structures", "Algorithms", "Git"],
                    "why_included": "Builds algorithmic efficiency and clean software engineering practices.",
                    "prerequisites": ["Computer Science Fundamentals"],
                    "career_benefit": "Pass technical coding interviews and write memory-efficient code.",
                    "estimated_effort": "15 hrs/week for 4 weeks",
                    "expected_outcome": "Solved 50+ LeetCode style algorithm challenges.",
                    "confidence": 0.98
                },
                {
                    "phase": 2,
                    "title": "API Systems & Database Architecture",
                    "duration_weeks": 6,
                    "focus_skills": ["Async FastAPI", "PostgreSQL", "Redis", "REST APIs"],
                    "why_included": "High-concurrency backend API development and relational data design.",
                    "prerequisites": ["Python", "Data Structures"],
                    "career_benefit": "Enables building scalable backend web services with fast query response.",
                    "estimated_effort": "15 hrs/week for 6 weeks",
                    "expected_outcome": "Fully tested RESTful API with PostgreSQL & Redis caching layer.",
                    "confidence": 0.97
                },
                {
                    "phase": 3,
                    "title": "Microservices & DevOps Infrastructure",
                    "duration_weeks": 6,
                    "focus_skills": ["Docker", "Kubernetes", "Microservices", "CI/CD"],
                    "why_included": "Distributed system orchestration and continuous integration pipelines.",
                    "prerequisites": ["Async FastAPI", "PostgreSQL"],
                    "career_benefit": "Prepares candidate for Senior Backend Engineer roles.",
                    "estimated_effort": "15 hrs/week for 6 weeks",
                    "expected_outcome": "Containerized microservice cluster deployed via CI/CD.",
                    "confidence": 0.96
                }
            ]
        else:
            return [
                {
                    "phase": 1,
                    "title": "Technical Foundation & Core Tools",
                    "duration_weeks": 4,
                    "focus_skills": ["Python", "Git", "Linux", "Data Structures"],
                    "why_included": "Universal technical baseline required for modern tech careers.",
                    "prerequisites": ["Basic Computer Literacy"],
                    "career_benefit": "Establishes confident command-line and scripting capabilities.",
                    "estimated_effort": "15 hrs/week for 4 weeks",
                    "expected_outcome": "Automated workflow scripts published to GitHub.",
                    "confidence": 0.95
                },
                {
                    "phase": 2,
                    "title": "Domain Specialization & Hands-on Projects",
                    "duration_weeks": 6,
                    "focus_skills": ["Async FastAPI", "Docker", "Cloud Infrastructure"],
                    "why_included": "Core domain technical skills for production deployment.",
                    "prerequisites": ["Python", "Linux"],
                    "career_benefit": "Demonstrates capability to build and deploy real-world applications.",
                    "estimated_effort": "15 hrs/week for 6 weeks",
                    "expected_outcome": "Live deployed portfolio web application.",
                    "confidence": 0.94
                }
            ]
