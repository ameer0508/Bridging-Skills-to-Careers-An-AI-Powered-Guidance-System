import re
from typing import List
from app.resume_intelligence.semantic_entities import SemanticCertification, SemanticExtractedEntity

class CertificationParser:
    """
    Parses Certifications section text into structured SemanticCertification objects.
    """

    KNOWN_ISSUERS = [
        "Amazon Web Services", "AWS", "Google", "Microsoft", "Azure", "Cisco", "CompTIA", "Oracle", "PMI", "Scrum Alliance", "Kubernetes", "CNCF"
    ]

    @classmethod
    def parse_certifications_section(cls, text: str) -> List[SemanticCertification]:
        if not text.strip():
            return []

        certs: List[SemanticCertification] = []
        lines = [l.strip('•-*\t ') for l in text.splitlines() if l.strip()]

        for line in lines:
            issuer = cls._extract_issuer(line)
            year = cls._extract_year(line)

            certs.append(SemanticCertification(
                name=SemanticExtractedEntity(
                    value=line,
                    confidence=0.92,
                    source="cert_title",
                    transformer_model="cert-parser-v1",
                    extraction_method="cert-ner"
                ),
                issuer=SemanticExtractedEntity(
                    value=issuer,
                    confidence=0.94,
                    source="cert_issuer",
                    transformer_model="cert-parser-v1",
                    extraction_method="issuer-regex"
                ) if issuer else None,
                year=SemanticExtractedEntity(
                    value=year,
                    confidence=0.90,
                    source="cert_year",
                    transformer_model="cert-parser-v1",
                    extraction_method="year-regex"
                ) if year else None
            ))

        return certs

    @classmethod
    def _extract_issuer(cls, text: str) -> str:
        for issuer in cls.KNOWN_ISSUERS:
            if re.search(r'\b' + re.escape(issuer) + r'\b', text, re.IGNORECASE):
                return issuer
        return ""

    @classmethod
    def _extract_year(cls, text: str) -> str:
        match = re.search(r'\b(20[0-9]{2}|19[0-9]{2})\b', text)
        return match.group(1) if match else ""
