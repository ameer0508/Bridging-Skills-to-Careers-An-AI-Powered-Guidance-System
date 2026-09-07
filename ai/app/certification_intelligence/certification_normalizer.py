from typing import List
from app.certification_intelligence.provider_interface import CertificationItem

class CertificationNormalizer:
    """
    Normalizes level mappings, exam codes, skills covered, and deduplicates equivalent certifications.
    """

    @staticmethod
    def normalize_level(raw_level: str) -> str:
        lvl = raw_level.lower()
        if "expert" in lvl or "master" in lvl:
            return "Expert"
        if "professional" in lvl or "pro" in lvl:
            return "Professional"
        if "specialty" in lvl or "specialist" in lvl:
            return "Specialty"
        return "Associate"

    @classmethod
    def normalize_item(cls, item: CertificationItem) -> CertificationItem:
        item.level = cls.normalize_level(item.level)
        item.skills_covered = [s.strip().title() for s in item.skills_covered]
        item.exam_cost_usd = round(max(0.0, item.exam_cost_usd), 2)
        return item

    @classmethod
    def deduplicate(cls, items: List[CertificationItem]) -> List[CertificationItem]:
        seen = set()
        deduped = []
        for item in items:
            norm_item = cls.normalize_item(item)
            key = (norm_item.name.lower(), norm_item.provider.lower(), norm_item.exam_code.lower())
            if key not in seen:
                seen.add(key)
                deduped.append(norm_item)
        return deduped
