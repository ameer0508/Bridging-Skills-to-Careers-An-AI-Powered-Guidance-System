import logging
from typing import List, Dict
from app.course_intelligence.provider_interface import (
    BaseCourseProvider,
    CourseFilter,
    CourseItem,
    CourseraAdapter,
    EdXAdapter,
    UdemyAdapter,
    MicrosoftLearnAdapter,
    AWSSkillBuilderAdapter,
    GoogleCloudSkillsBoostAdapter,
    CiscoSkillsForAllAdapter,
    OracleUniversityAdapter,
    FreeCodeCampAdapter,
    KhanAcademyAdapter,
    YouTubeCuratedAdapter,
    MockCourseProvider,
)

logger = logging.getLogger("skillbridge-ai")

class CourseProviderManager:
    """
    Manages registration, discovery, fallback, and query execution across all active Course Providers.
    """

    def __init__(self):
        self._providers: Dict[str, BaseCourseProvider] = {}
        self._register_defaults()

    def _register_defaults(self):
        defaults = [
            CourseraAdapter(),
            EdXAdapter(),
            UdemyAdapter(),
            MicrosoftLearnAdapter(),
            AWSSkillBuilderAdapter(),
            GoogleCloudSkillsBoostAdapter(),
            CiscoSkillsForAllAdapter(),
            OracleUniversityAdapter(),
            FreeCodeCampAdapter(),
            KhanAcademyAdapter(),
            YouTubeCuratedAdapter(),
            MockCourseProvider(),
        ]
        for provider in defaults:
            self.register_provider(provider)

    def register_provider(self, provider: BaseCourseProvider):
        self._providers[provider.provider_name] = provider
        logger.info(f"Registered Course Provider: {provider.provider_name}")

    def search_all_providers(self, filter_params: CourseFilter) -> List[CourseItem]:
        all_courses: List[CourseItem] = []
        for name, provider in self._providers.items():
            try:
                if provider.is_healthy():
                    courses = provider.search_courses(filter_params)
                    all_courses.extend(courses)
            except Exception as e:
                logger.error(f"Error fetching courses from provider {name}: {e}")
        return all_courses
