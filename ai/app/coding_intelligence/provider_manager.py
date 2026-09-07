from typing import Dict, Any, List
from app.coding_intelligence.leetcode_adapter import LeetCodeAdapter
from app.coding_intelligence.hackerrank_adapter import HackerRankAdapter
from app.coding_intelligence.codeforces_adapter import CodeforcesAdapter
from app.coding_intelligence.codechef_adapter import CodeChefAdapter
from app.coding_intelligence.gfg_adapter import GFGAdapter

class CodingProviderManager:
    """
    Registry & orchestrator for competitive coding platform adapters.
    """

    def __init__(self):
        self.adapters = {
            "leetcode": LeetCodeAdapter(),
            "hackerrank": HackerRankAdapter(),
            "codeforces": CodeforcesAdapter(),
            "codechef": CodeChefAdapter(),
            "gfg": GFGAdapter()
        }

    def fetch_all_platforms(self, username: str) -> List[Dict[str, Any]]:
        profiles = []
        for name, adapter in self.adapters.items():
            try:
                profiles.append(adapter.fetch_profile(username))
            except Exception:
                pass
        return profiles
