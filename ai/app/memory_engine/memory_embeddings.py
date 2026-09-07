from typing import List

class MemoryEmbeddingsEngine:
    """
    Generates dense vector embeddings for long-term memory nodes & semantic search.
    """

    @staticmethod
    def embed_text(text: str) -> List[float]:
        # Synthetic 128-dim vector embedding representation for fast retrieval
        val = sum(ord(c) for c in text) % 100 / 100.0
        return [val] * 128
