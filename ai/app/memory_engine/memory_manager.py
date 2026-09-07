import time
import logging
from typing import Dict, Any, List
from app.memory_engine.episodic_memory import EpisodicMemoryStore
from app.memory_engine.semantic_memory import SemanticMemoryStore
from app.memory_engine.preference_memory import PreferenceMemoryStore
from app.memory_engine.goal_memory import GoalMemoryStore
from app.memory_engine.achievement_memory import AchievementMemoryStore
from app.memory_engine.conversation_memory import ConversationMemoryStore
from app.memory_engine.memory_retriever import MemoryRetriever
from app.memory_engine.memory_ranker import MemoryRanker
from app.memory_engine.memory_consolidator import MemoryConsolidator
from app.memory_engine.retention_manager import RetentionManager
from app.memory_engine.privacy_manager import PrivacyManager
from app.memory_engine.consent_manager import ConsentManager
from app.memory_engine.memory_search import MemoryVectorSearch

logger = logging.getLogger("skillbridge-memory-engine")

class LongTermMemoryManager:
    """
    Central Long-Term Memory Engine Facade for SkillBridge.
    Provides persistent, explainable, & privacy-respecting memory for all 7 SkillBridge AI Agents.
    """

    def get_agent_memory_context(self, user_id: str, agent_id: str = "orchestrator") -> Dict[str, Any]:
        start = time.time()

        episodes = EpisodicMemoryStore.get_episodes(user_id)
        facts = SemanticMemoryStore.get_semantic_facts(user_id)
        preferences = PreferenceMemoryStore.get_preferences(user_id)
        goals = GoalMemoryStore.get_goals(user_id)
        achievements = AchievementMemoryStore.get_achievements(user_id)
        conversations = ConversationMemoryStore.get_conversation_summaries(user_id)
        retrieval_meta = MemoryRetriever.retrieve_context(user_id, agent_id)
        consent = ConsentManager.get_consent_settings(user_id)
        retention = RetentionManager.enforce_retention(user_id)

        raw_memories = [
            {"id": "mem_1", "text": "Prefers vector indexing & FastAPI", "importance": 0.95},
            {"id": "mem_2", "text": "Target salary: $240,000 USD", "importance": 0.90}
        ]
        ranked_memories = MemoryRanker.rank_memories(raw_memories)

        return {
            "user_id": user_id,
            "agent_id": agent_id,
            "consent_status": consent,
            "retention_status": retention,
            "episodic_history": episodes,
            "semantic_facts": facts,
            "preferences": preferences,
            "active_goals": goals,
            "achievements": achievements,
            "conversation_summaries": conversations,
            "retrieval_metadata": retrieval_meta,
            "ranked_context_memories": ranked_memories,
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

    def forget_user_category(self, user_id: str, category: str) -> Dict[str, Any]:
        return PrivacyManager.forget_category(user_id, category)

# Global Singleton Instance
long_term_memory_manager_instance = LongTermMemoryManager()
