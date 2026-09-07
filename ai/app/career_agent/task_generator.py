from typing import List, Dict, Any

class TaskGenerator:
    """
    Decomposes monthly career goals into daily/weekly actionable engineering tasks.
    """

    @staticmethod
    def generate_tasks(goal_name: str) -> List[Dict[str, Any]]:
        return [
            {
                "task_id": "tsk_01",
                "title": f"Study Advanced {goal_name} Architecture Patterns",
                "category": "System Design",
                "estimated_hours": 4.0,
                "status": "Pending"
            },
            {
                "task_id": "tsk_02",
                "title": "Build Production Benchmark & Open-Source Pull Request",
                "category": "Coding & Open Source",
                "estimated_hours": 6.0,
                "status": "Pending"
            }
        ]
