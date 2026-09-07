from typing import Dict, List, Set, Optional

class SkillNode:
    def __init__(self, name: str, category: str):
        self.name = name
        self.category = category
        self.parents: Set[str] = set()
        self.children: Set[str] = set()
        self.related: Set[str] = set()
        self.prerequisites: Set[str] = set()

class SkillGraph:
    """
    Directed Skill Graph data structure supporting multi-directional traversal.
    """
    def __init__(self):
        self.nodes: Dict[str, SkillNode] = {}
        self._build_default_graph()

    def add_node(self, name: str, category: str) -> SkillNode:
        if name not in self.nodes:
            self.nodes[name] = SkillNode(name, category)
        return self.nodes[name]

    def add_edge(self, source: str, target: str, relationship_type: str):
        s_node = self.nodes.get(source) or self.add_node(source, "Tools")
        t_node = self.nodes.get(target) or self.add_node(target, "Tools")

        if relationship_type == "parent":
            s_node.parents.add(target)
            t_node.children.add(source)
        elif relationship_type == "sub" or relationship_type == "child":
            s_node.children.add(target)
            t_node.parents.add(source)
        elif relationship_type == "prerequisite":
            s_node.prerequisites.add(target)
        elif relationship_type == "related":
            s_node.related.add(target)
            t_node.related.add(source)

    def get_related_skills(self, skill_name: str) -> List[Dict[str, str]]:
        node = self.nodes.get(skill_name)
        if not node:
            return []

        rel_list: List[Dict[str, str]] = []
        for p in node.parents:
            rel_list.append({"related_skill": p, "type": "parent"})
        for c in node.children:
            rel_list.append({"related_skill": c, "type": "sub"})
        for r in node.related:
            rel_list.append({"related_skill": r, "type": "related"})
        for pr in node.prerequisites:
            rel_list.append({"related_skill": pr, "type": "prerequisite"})

        return rel_list

    def _build_default_graph(self):
        # AI / ML Graph
        self.add_edge("TensorFlow", "Machine Learning", "parent")
        self.add_edge("Machine Learning", "Artificial Intelligence", "parent")
        self.add_edge("PyTorch", "Deep Learning", "parent")
        self.add_edge("Deep Learning", "Machine Learning", "parent")
        self.add_edge("LangChain", "LLMs", "prerequisite")
        self.add_edge("LLMs", "Generative AI", "parent")
        self.add_edge("RAG", "Vector Databases", "prerequisite")

        # Cloud & DevOps Graph
        self.add_edge("Docker", "Containers", "parent")
        self.add_edge("Containers", "DevOps", "parent")
        self.add_edge("DevOps", "Cloud Platforms", "parent")
        self.add_edge("Kubernetes", "Docker", "prerequisite")

        # Full Stack & Backend Graph
        self.add_edge("FastAPI", "Python", "prerequisite")
        self.add_edge("FastAPI", "Backend", "parent")
        self.add_edge("Spring Boot", "Java", "prerequisite")
        self.add_edge("Spring Boot", "Backend", "parent")
        self.add_edge("Next.js", "React", "prerequisite")
        self.add_edge("React", "JavaScript", "prerequisite")

skill_graph = SkillGraph()
