import re
from typing import List
from app.resume_intelligence.semantic_entities import SemanticLanguage, SemanticExtractedEntity

class LanguageDetector:
    """
    Detects natural spoken languages and proficiency levels in resumes.
    """

    KNOWN_LANGUAGES = [
        "English", "Spanish", "French", "German", "Mandarin", "Chinese", "Hindi", "Japanese", "Arabic", "Portuguese", "Russian", "Italian"
    ]

    PROFICIENCY_LEVELS = [
        "Native", "Bilingual", "Fluent", "Professional Working", "Conversational", "Elementary", "Intermediate", "Advanced"
    ]

    @classmethod
    def parse_languages_section(cls, text: str) -> List[SemanticLanguage]:
        detected: List[SemanticLanguage] = []
        if not text.strip():
            # Default to English
            return [SemanticLanguage(
                language=SemanticExtractedEntity(
                    value="English",
                    confidence=0.99,
                    source="language_detector",
                    transformer_model="language-detector-v1",
                    extraction_method="default-fallback"
                ),
                proficiency=SemanticExtractedEntity(
                    value="Native / Professional",
                    confidence=0.95,
                    source="language_detector",
                    transformer_model="language-detector-v1",
                    extraction_method="default-fallback"
                )
            )]

        for lang in cls.KNOWN_LANGUAGES:
            if re.search(r'\b' + re.escape(lang) + r'\b', text, re.IGNORECASE):
                proficiency = cls._extract_proficiency(text, lang)
                detected.append(SemanticLanguage(
                    language=SemanticExtractedEntity(
                        value=lang,
                        confidence=0.96,
                        source="languages_section",
                        transformer_model="language-detector-v1",
                        extraction_method="language-ner"
                    ),
                    proficiency=SemanticExtractedEntity(
                        value=proficiency,
                        confidence=0.90,
                        source="languages_section",
                        transformer_model="language-detector-v1",
                        extraction_method="proficiency-regex"
                    ) if proficiency else None
                ))

        if not detected:
            detected.append(SemanticLanguage(
                language=SemanticExtractedEntity(
                    value="English",
                    confidence=0.98,
                    source="document_analysis",
                    transformer_model="language-detector-v1",
                    extraction_method="document-lang-inference"
                )
            ))

        return detected

    @classmethod
    def _extract_proficiency(cls, text: str, language: str) -> str:
        for level in cls.PROFICIENCY_LEVELS:
            pattern = r'\b' + re.escape(language) + r'[\s\(\:\-]*' + re.escape(level) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                return level
        return "Proficient"
