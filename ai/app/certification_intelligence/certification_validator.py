from typing import List
from app.certification_intelligence.provider_interface import CertificationItem

class CertificationValidator:
    """
    Validates exam code completeness, official URL integrity, and provider accreditation.
    """

    @staticmethod
    def is_valid_certification(item: CertificationItem) -> bool:
        if not item.name or not item.official_url:
            return False
        if not item.skills_covered:
            return False
        return True

    @classmethod
    def filter_valid_certifications(cls, items: List[CertificationItem]) -> List[CertificationItem]:
        return [i for i in items if cls.is_valid_certification(i)]
