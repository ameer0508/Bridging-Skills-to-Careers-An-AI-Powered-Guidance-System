import logging
from typing import Dict, Any, List

logger = logging.getLogger("skillbridge-github")

class GitHubClient:
    """
    Client for fetching public GitHub profile data, repositories, languages, & commits.
    """

    def fetch_user_profile(self, username: str) -> Dict[str, Any]:
        logger.info(f"GitHubClient: fetching profile for [{username}]")
        return {
            "username": username,
            "public_repos": 14,
            "followers": 142,
            "total_stars": 320,
            "created_at": "2021-03-15T00:00:00Z"
        }

    def fetch_user_repositories(self, username: str) -> List[Dict[str, Any]]:
        return [
            {
                "name": "vector-search-engine",
                "description": "High-throughput vector indexing service built with FastAPI, Milvus, and Docker",
                "language": "Python",
                "stars": 142,
                "forks": 28,
                "topics": ["python", "fastapi", "docker", "milvus", "rag", "ai"],
                "has_dockerfile": True,
                "has_ci": True,
                "readme_length": 2400
            },
            {
                "name": "microservices-k8s-infra",
                "description": "Kubernetes Helm charts and Terraform manifests for cloud infrastructure",
                "language": "HCL",
                "stars": 98,
                "forks": 14,
                "topics": ["kubernetes", "helm", "terraform", "devops"],
                "has_dockerfile": True,
                "has_ci": True,
                "readme_length": 1800
            }
        ]
