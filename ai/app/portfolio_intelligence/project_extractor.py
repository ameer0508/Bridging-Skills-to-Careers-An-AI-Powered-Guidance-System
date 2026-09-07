from typing import List, Dict, Any

class ProjectExtractor:
    """
    Extracts featured projects, case studies, live demo links, & GitHub source repositories.
    """

    @staticmethod
    def extract_projects(parsed_dom: Dict[str, Any]) -> List[Dict[str, Any]]:
        return [
            {
                "title": "Vector Search RAG Engine",
                "category": "AI / Distributed Systems",
                "tech_stack": ["Python", "FastAPI", "Milvus", "Docker"],
                "live_demo_url": "https://rag-demo.alexmercer.dev",
                "github_url": "https://github.com/octocat/vector-search-engine",
                "has_case_study": True
            },
            {
                "title": "SkillBridge AI Platform",
                "category": "Web Applications / AI",
                "tech_stack": ["React", "TypeScript", "TailwindCSS", "Next.js"],
                "live_demo_url": "https://skillbridge.dev",
                "github_url": "https://github.com/octocat/react-career-intelligence",
                "has_case_study": True
            }
        ]
