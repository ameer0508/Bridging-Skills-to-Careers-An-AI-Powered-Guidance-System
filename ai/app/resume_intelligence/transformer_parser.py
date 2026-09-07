import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("skillbridge-ai")

class TransformerModelManager:
    """
    Singleton Transformer Model Loader & Semantic Engine.
    Supports Sentence Transformers, BERT, RoBERTa, DeBERTa, DistilBERT, spaCy, and Hugging Face pipelines.
    Loads models lazily on first access and reuses instances across requests.
    """
    _instance: Optional["TransformerModelManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TransformerModelManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.active_model_name = os.getenv("TRANSFORMER_MODEL_NAME", "all-MiniLM-L6-v2")
        self.provider_type = os.getenv("TRANSFORMER_PROVIDER", "sentence_transformers")
        self._model = None
        self._nlp_pipeline = None
        self._initialized = True
        logger.info(f"TransformerModelManager configured for model [{self.active_model_name}] via [{self.provider_type}]")

    def load_model(self) -> Any:
        if self._model is not None:
            return self._model

        try:
            if self.provider_type == "sentence_transformers":
                try:
                    from sentence_transformers import SentenceTransformer
                    self._model = SentenceTransformer(self.active_model_name)
                    logger.info(f"Successfully loaded SentenceTransformer model: {self.active_model_name}")
                except ImportError:
                    logger.warning("sentence-transformers package not installed. Operating in lightweight embeddings fallback mode.")
                    self._model = "lightweight_embedding_fallback"

            elif self.provider_type == "spacy":
                try:
                    import spacy
                    self._model = spacy.load("en_core_web_sm")
                    logger.info("Successfully loaded spaCy model: en_core_web_sm")
                except Exception as e:
                    logger.warning(f"Failed to load spaCy model: {e}. Falling back to lightweight mode.")
                    self._model = "lightweight_embedding_fallback"

            elif self.provider_type == "huggingface":
                try:
                    from transformers import pipeline
                    self._nlp_pipeline = pipeline("ner", model=self.active_model_name, aggregation_strategy="simple")
                    self._model = self._nlp_pipeline
                    logger.info(f"Successfully loaded HuggingFace NER pipeline: {self.active_model_name}")
                except Exception as e:
                    logger.warning(f"Failed to load HuggingFace pipeline: {e}. Falling back to lightweight mode.")
                    self._model = "lightweight_embedding_fallback"
            else:
                self._model = "lightweight_embedding_fallback"

        except Exception as e:
            logger.error(f"Error loading transformer model [{self.active_model_name}]: {e}")
            self._model = "lightweight_embedding_fallback"

        return self._model

    def encode_text(self, text: str) -> List[float]:
        model = self.load_model()
        if hasattr(model, "encode"):
            try:
                embeddings = model.encode(text)
                return embeddings.tolist() if hasattr(embeddings, "tolist") else list(embeddings)
            except Exception:
                pass
        
        # Pure Python fallback embedding vector (hash-based normalized vector for semantic similarity)
        import math
        vec = [0.0] * 64
        for idx, char in enumerate(text.lower()):
            vec[ord(char) % 64] += 1.0
        norm = math.sqrt(sum(v*v for v in vec)) or 1.0
        return [v / norm for v in vec]

transformer_manager = TransformerModelManager()
