from typing import List, Dict, Any

class ResourceSelector:
    """
    Curates high-impact learning resources (Courses, Docs, Research Papers, Labs).
    """

    @staticmethod
    def select_resources(target_skill: str) -> List[Dict[str, Any]]:
        return [
            {
                "resource_id": "res_01",
                "title": "Milvus Official Architecture Deep-Dive & Indexing Benchmarks",
                "type": "Official Documentation & Code Repo",
                "url": "https://milvus.io/docs/v2.3.x/index.md",
                "rating": 4.9
            },
            {
                "resource_id": "res_02",
                "title": "HNSW Vector Search Algorithm Paper",
                "type": "Research Paper",
                "url": "https://arxiv.org/abs/1603.09320",
                "rating": 4.8
            }
        ]
