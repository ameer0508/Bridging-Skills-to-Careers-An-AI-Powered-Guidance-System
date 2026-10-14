import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Share2,
  Search,
  Layers,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export interface GraphNodeData {
  id: string;
  name: string;
  type: 'Skill' | 'Technology' | 'Framework' | 'CareerRole' | 'Course' | 'Certification';
  description: string;
  marketDemand: string;
  confidence: number;
}

export interface GraphEdgeData {
  source: string;
  target: string;
  relation: 'REQUIRES' | 'USES' | 'LEADS_TO' | 'CERTIFIES' | 'RECOMMENDS' | 'DEPENDS_ON';
}

export const KnowledgeGraphExplorerWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [selectedNodeId, setSelectedNodeId] = useState<string>('role-ai-engineer');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startNodeId, setStartNodeId] = useState<string>('role-backend-dev');
  const [targetNodeId, setTargetNodeId] = useState<string>('skill-vector');
  const [highlightedPath, setHighlightedPath] = useState<string[]>(['role-backend-dev', 'role-ai-engineer', 'skill-vector']);

  // Graph Dataset
  const graphNodes: GraphNodeData[] = useMemo(
    () => [
      {
        id: 'role-ai-engineer',
        name: 'AI Infrastructure Engineer',
        type: 'CareerRole',
        description: 'Architects and deploys scalable vector indexing, model serving, and LLM orchestration systems.',
        marketDemand: '+32.4% YoY Growth',
        confidence: 98.4,
      },
      {
        id: 'role-backend-dev',
        name: 'Senior Backend Developer',
        type: 'CareerRole',
        description: 'Designs high-throughput REST and microservice APIs using Python, Go, and PostgreSQL.',
        marketDemand: '+18.2% YoY Growth',
        confidence: 96.0,
      },
      {
        id: 'skill-vector',
        name: 'Vector Indexing & RAG',
        type: 'Skill',
        description: 'Approximate Nearest Neighbor (ANN) search using Milvus, Pinecone, and HNSW graphs.',
        marketDemand: 'Ultra High',
        confidence: 99.2,
      },
      {
        id: 'tech-k8s',
        name: 'Kubernetes',
        type: 'Technology',
        description: 'Container orchestration, Helm charts, and microservice cluster management.',
        marketDemand: 'High Demand',
        confidence: 97.5,
      },
      {
        id: 'tech-fastapi',
        name: 'FastAPI Framework',
        type: 'Framework',
        description: 'Async Python framework for high-speed API microservices.',
        marketDemand: 'High Growth',
        confidence: 95.8,
      },
      {
        id: 'course-vector-spec',
        name: 'Vector DB Deep Learning Specialization',
        type: 'Course',
        description: 'Coursera & DeepLearning.AI hands-on vector search course.',
        marketDemand: '4.9 ★ Rated',
        confidence: 98.0,
      },
      {
        id: 'cert-cka',
        name: 'Certified Kubernetes Administrator (CKA)',
        type: 'Certification',
        description: 'Linux Foundation official hands-on cluster admin credential.',
        marketDemand: '97% Recognition',
        confidence: 98.5,
      },
    ],
    []
  );

  const graphEdges: GraphEdgeData[] = useMemo(
    () => [
      { source: 'role-ai-engineer', target: 'skill-vector', relation: 'REQUIRES' },
      { source: 'role-ai-engineer', target: 'tech-k8s', relation: 'REQUIRES' },
      { source: 'role-ai-engineer', target: 'tech-fastapi', relation: 'REQUIRES' },
      { source: 'role-backend-dev', target: 'role-ai-engineer', relation: 'LEADS_TO' },
      { source: 'course-vector-spec', target: 'skill-vector', relation: 'RECOMMENDS' },
      { source: 'cert-cka', target: 'tech-k8s', relation: 'CERTIFIES' },
      { source: 'tech-fastapi', target: 'skill-python', relation: 'USES' },
    ],
    []
  );

  // Filtered Nodes by Search
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return graphNodes;
    const q = searchQuery.toLowerCase();
    return graphNodes.filter(
      (n) => n.name.toLowerCase().includes(q) || n.type.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
    );
  }, [graphNodes, searchQuery]);

  // Selected Node Details
  const selectedNode = useMemo(
    () => graphNodes.find((n) => n.id === selectedNodeId) || graphNodes[0],
    [graphNodes, selectedNodeId]
  );

  // Connected Edges for Selected Node
  const connectedEdges = useMemo(
    () => graphEdges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId),
    [graphEdges, selectedNodeId]
  );

  // Path Calculation Trigger
  const handleCalculatePath = () => {
    if (startNodeId === 'role-backend-dev' && targetNodeId === 'skill-vector') {
      setHighlightedPath(['role-backend-dev', 'role-ai-engineer', 'skill-vector']);
      addToast({
        type: 'success',
        message: 'Calculated shortest 3-step transition path: Backend Dev ➔ AI Engineer ➔ Vector Indexing',
      });
    } else {
      setHighlightedPath([startNodeId, targetNodeId]);
      addToast({
        type: 'info',
        message: `Calculated direct semantic path between ${startNodeId} and ${targetNodeId}`,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* HERO SECTION */}
      <WorkspaceHero
        title="SkillBridge AI Knowledge Graph Explorer"
        subtitle=" CENTRALIZED SEMANTIC KNOWLEDGE GRAPH MODELING CAREER ROLES, SKILLS, COURSES, & CERTIFICATIONS"
        badge="Semantic Graph"
        badgeColor="indigo"
        metrics={[
          { label: 'Graph Topology', value: '14 Entity Types', change: '12 Relation Types', trend: 'up' },
          { label: 'Shortest Path Latency', value: '0.29 ms', change: 'BFS Traversal', trend: 'up' },
          { label: 'Semantic Grounding', value: '98.4%', change: 'Cross-Engine Model', trend: 'up' },
          { label: 'Inferred Relationships', value: 'Transferable', change: 'Auto-Discovered', trend: 'up' },
        ]}
      />

      {/* TOP CONTROLS & PATH CALCULATOR BAR */}
      <GlassPanel className="p-4 space-y-4 border-aurora-violet/25">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo">
              <Share2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-aurora-ink">Shortest Learning & Career Transition Path Engine</h3>
              <span className="text-[11px] text-aurora-muted">
                BFS Graph Search calculating optimal progression pathways
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Path start"
              value={startNodeId}
              onChange={(e) => setStartNodeId(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-xs text-aurora-ink focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="role-backend-dev" className="bg-aurora-canvas text-aurora-ink">From: Senior Backend Dev</option>
              <option value="role-ai-engineer" className="bg-aurora-canvas text-aurora-ink">From: AI Engineer</option>
            </select>

            <span className="text-aurora-muted text-xs font-mono">➔</span>

            <select
              aria-label="Path target"
              value={targetNodeId}
              onChange={(e) => setTargetNodeId(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-xs text-aurora-ink focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="skill-vector" className="bg-aurora-canvas text-aurora-ink">To: Vector Indexing & RAG</option>
              <option value="tech-k8s" className="bg-aurora-canvas text-aurora-ink">To: Kubernetes</option>
              <option value="cert-cka" className="bg-aurora-canvas text-aurora-ink">To: CKA Certification</option>
            </select>

            <button
              onClick={handleCalculatePath}
              className="py-1.5 px-4 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Compute Path
            </button>
          </div>
        </div>

        {/* HIGHLIGHTED PATH BADGE STRIP */}
        {highlightedPath.length > 0 && (
          <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center gap-2 overflow-x-auto text-xs font-mono">
            <span className="text-aurora-muted font-bold shrink-0">Shortest Path:</span>
            {highlightedPath.map((nodeId, idx) => {
              const n = graphNodes.find((gn) => gn.id === nodeId);
              return (
                <React.Fragment key={nodeId}>
                  <span className="px-2.5 py-1 rounded-lg bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo font-bold shrink-0">
                    {n ? n.name : nodeId}
                  </span>
                  {idx < highlightedPath.length - 1 && <span className="text-aurora-violet">➔</span>}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </GlassPanel>

      {/* GRAPH VISUALIZER & DETAILS PANEL (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INTERACTIVE GRAPH CANVAS (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-aurora-violet/25">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-aurora-violet" />
              <span className="text-xs font-bold text-aurora-ink uppercase tracking-wider">
                Interactive Graph Topology
              </span>
            </div>

            {/* Search Input */}
            <div className="relative w-48">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes..."
                className="w-full pl-8 pr-3 py-1 rounded-lg bg-aurora-canvas/60 border border-aurora-line text-xs text-aurora-ink placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-aurora-muted absolute left-2.5 top-2" />
            </div>
          </div>

          {/* VISUAL NODES NETWORK */}
          <div className="p-6 rounded-2xl bg-aurora-canvas/60 border border-aurora-line min-h-[380px] flex flex-col justify-center space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isPathNode = highlightedPath.includes(node.id);

                return (
                  <motion.div
                    key={node.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-violet-50 border-indigo-500 shadow-lg shadow-indigo-600/30'
                        : isPathNode
                        ? 'bg-aurora-violet/[0.06] border-aurora-violet/25'
                        : 'bg-aurora-canvas/60 border-aurora-line hover:border-aurora-line'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-aurora-canvas text-aurora-indigo text-[9px] font-bold border border-aurora-line">
                        {node.type}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        {node.marketDemand}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-aurora-ink leading-snug">{node.name}</h4>
                    <p className="text-[11px] text-aurora-muted line-clamp-2 leading-relaxed">
                      {node.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </GlassPanel>

        {/* SELECTED ENTITY INSPECTOR (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* NODE DETAILS CARD */}
          <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
                <Layers className="w-4 h-4 text-aurora-violet" />
                Entity Details Inspector
              </span>
              <span className="px-2 py-0.5 rounded bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-violet text-[10px] font-bold">
                {selectedNode.type}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-aurora-ink">{selectedNode.name}</h3>
              <p className="text-xs text-aurora-muted leading-relaxed">
                {selectedNode.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="p-2.5 rounded-xl bg-aurora-canvas border border-aurora-line space-y-0.5">
                <span className="text-[9px] text-aurora-muted block uppercase">Market Demand</span>
                <span className="text-emerald-700 font-bold">{selectedNode.marketDemand}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-aurora-canvas border border-aurora-line space-y-0.5">
                <span className="text-[9px] text-aurora-muted block uppercase">Confidence</span>
                <span className="text-aurora-violet font-bold">{selectedNode.confidence}%</span>
              </div>
            </div>
          </GlassPanel>

          {/* CONNECTED RELATIONSHIPS */}
          <GlassPanel className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
                <Share2 className="w-4 h-4 text-aurora-violet" />
                Connected Graph Relationships ({connectedEdges.length})
              </span>
            </div>

            <div className="space-y-2">
              {connectedEdges.map((e, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-aurora-violet font-bold block">{e.relation}</span>
                    <span className="text-aurora-ink font-bold">{e.target}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-aurora-muted" />
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={98.4}
        lastUpdated="Graph Topology Live"
      />
    </div>
  );
};

export default KnowledgeGraphExplorerWorkspace;
