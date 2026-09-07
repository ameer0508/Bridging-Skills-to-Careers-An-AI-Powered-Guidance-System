from typing import List, Dict, Any

class RecommendationEngine:
    """
    Candidate Generator across 10 Recommendation Categories.
    """

    @classmethod
    def generate_candidates(
        cls,
        user_skills: List[str],
        career_goal: str,
        learning_style: str = "hands-on"
    ) -> List[Dict[str, Any]]:

        candidates: List[Dict[str, Any]] = []
        user_skills_lower = [s.lower().strip() for s in user_skills]

        # 1. Projects
        candidates.append({
            "title": f"Build an Enterprise {career_goal} Microservices Project",
            "type": "project",
            "reason": f"Hands-on portfolio demonstration directly aligned with {career_goal}",
            "priority": "high",
            "skills_improved": ["System Design", "Microservices", "FastAPI/Node.js"]
        })

        # 2. Courses
        candidates.append({
            "title": f"Advanced {career_goal} Systems Architecture & Scaling",
            "type": "course",
            "reason": "Deepens architectural knowledge for senior role competency",
            "priority": "high",
            "skills_improved": ["System Architecture", "Scalability", "API Design"]
        })

        # 3. Certifications
        if "aws" not in user_skills_lower:
            candidates.append({
                "title": "AWS Certified Solutions Architect - Associate",
                "type": "certification",
                "reason": "Top industry certification demonstrating cloud infrastructure mastery",
                "priority": "high",
                "skills_improved": ["Amazon Web Services (AWS)", "Cloud Computing"]
            })

        # 4. Skills & Technologies
        if "docker" not in user_skills_lower and "kubernetes" not in user_skills_lower:
            candidates.append({
                "title": "Master Containerization with Docker & Kubernetes",
                "type": "technology",
                "reason": "Essential DevOps dependency for modern deployment pipelines",
                "priority": "high",
                "skills_improved": ["Docker", "Kubernetes", "DevOps"]
            })

        # 5. Interview Preparation
        candidates.append({
            "title": f"Mock Technical Interview Suite for {career_goal}",
            "type": "interview_prep",
            "reason": "Practice System Design & Coding Algorithms under realistic interview conditions",
            "priority": "high",
            "skills_improved": ["Data Structures", "System Design", "Technical Communication"]
        })

        # 6. Resume Improvements
        candidates.append({
            "title": "Quantify Resume Achievements with High-Impact Metrics",
            "type": "resume_improvement",
            "reason": "Recruiters favor bullet points with measurable impact (e.g. +35% latency reduction)",
            "priority": "medium",
            "skills_improved": ["Resume Optimization", "Executive Communication"]
        })

        # 7. Portfolio Improvements
        candidates.append({
            "title": "Publish Live Interactive Demos on Your Personal Site",
            "type": "portfolio_improvement",
            "reason": "Live web apps increase hiring manager engagement by 3x",
            "priority": "medium",
            "skills_improved": ["Portfolio Design", "Web Deployment"]
        })

        # 8. GitHub Improvements
        candidates.append({
            "title": "Clean Up Public GitHub Repositories & Add Comprehensive READMEs",
            "type": "github_improvement",
            "reason": "Well-documented open-source repos demonstrate production-grade coding habits",
            "priority": "medium",
            "skills_improved": ["Git", "Open Source", "Documentation"]
        })

        # 9. Networking Suggestions
        candidates.append({
            "title": f"Connect with 5 Lead {career_goal} Engineers on LinkedIn",
            "type": "networking",
            "reason": "Informational interviews increase employee referral odds significantly",
            "priority": "medium",
            "skills_improved": ["Professional Networking", "Career Strategy"]
        })

        return candidates
