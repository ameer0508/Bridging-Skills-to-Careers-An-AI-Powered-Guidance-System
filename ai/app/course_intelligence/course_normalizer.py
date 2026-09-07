from typing import List
from app.course_intelligence.provider_interface import CourseItem

class CourseNormalizer:
    """
    Normalizes skill names, difficulty levels, duration formats, and removes duplicate courses across providers.
    """

    @staticmethod
    def normalize_difficulty(raw_diff: str) -> str:
        d = raw_diff.lower()
        if "expert" in d or "master" in d:
            return "Expert"
        if "advanced" in d or "hard" in d:
            return "Advanced"
        if "beginner" in d or "intro" in d or "basic" in d:
            return "Beginner"
        return "Intermediate"

    @classmethod
    def normalize_item(cls, item: CourseItem) -> CourseItem:
        item.difficulty = cls.normalize_difficulty(item.difficulty)
        item.duration_hours = max(1.0, round(item.duration_hours, 1))
        item.skills_taught = [s.strip().title() for s in item.skills_taught]
        return item

    @classmethod
    def deduplicate(cls, items: List[CourseItem]) -> List[CourseItem]:
        seen = set()
        deduped = []
        for item in items:
            norm_item = cls.normalize_item(item)
            key = (norm_item.title.lower(), norm_item.provider.lower())
            if key not in seen:
                seen.add(key)
                deduped.append(norm_item)
        return deduped
