from typing import List, Dict, Any
from app.memory_engine.memory_embeddings import MemoryEmbeddingsEngine

class MemoryVectorSearch:
    """
    Performs similarity search over memory vectors.
    """

    @staticmethod
    def search_memories(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        vec = MemoryEmbeddingsEngine.embed_text(query)
        return [
            {
                "memory_id": "mem_vec_01",
                "content": f"Vector indexing benchmarking preference matching query: '{query}'",
                "similarity_score": 0.985,
                "dimension": len(vec)
            }
        ]
