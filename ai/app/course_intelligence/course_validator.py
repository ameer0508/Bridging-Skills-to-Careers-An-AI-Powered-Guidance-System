from typing import List
from app.course_intelligence.provider_interface import CourseItem

class CourseValidator:
    """
    Validates quality criteria, minimum rating thresholds, and content completeness for course items.
    """

    @staticmethod
    def is_valid_course(item: CourseItem, min_rating: float = 4.0) -> bool:
        if not item.title or not item.provider_url:
            return False
        if item.rating < min_rating:
            return False
        if not item.skills_taught:
            return False
        return True

    @classmethod
    def filter_valid_courses(cls, items: List[CourseItem]) -> List[CourseItem]:
        return [i for i in items if cls.is_valid_course(i)]
