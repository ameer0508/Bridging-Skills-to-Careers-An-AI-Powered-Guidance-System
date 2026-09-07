from typing import List, Dict, Any
from app.course_intelligence.provider_interface import CourseItem

class LearningPathBuilder:
    """
    Automated Learning Path & Specialization Track Builder.
    Structures courses into Beginner, Intermediate, Advanced, and Expert tiers.
    """

    @staticmethod
    def build_structured_path(courses: List[CourseItem]) -> Dict[str, Any]:
        tracks = {
            "Beginner": [],
            "Intermediate": [],
            "Advanced": [],
            "Expert": [],
        }

        for course in courses:
            diff = course.difficulty if course.difficulty in tracks else "Intermediate"
            tracks[diff].append(course.model_dump())

        total_hours = sum(c.duration_hours for c in courses)
        free_count = sum(1 for c in courses if c.is_free)

        return {
            "total_courses": len(courses),
            "estimated_completion_hours": round(total_hours, 1),
            "free_courses_count": free_count,
            "tracks": tracks,
            "specialization_summary": f"Structured {len(courses)}-course learning path with {round(total_hours, 1)} total hours of curriculum."
        }
