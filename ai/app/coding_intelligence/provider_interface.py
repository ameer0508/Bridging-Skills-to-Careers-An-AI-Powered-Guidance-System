from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseCodingAdapter(ABC):
    """
    Abstract Base Class for Coding Platform Adapters (LeetCode, HackerRank, Codeforces, etc.).
    """

    @abstractmethod
    def fetch_profile(self, username: str) -> Dict[str, Any]:
        pass
