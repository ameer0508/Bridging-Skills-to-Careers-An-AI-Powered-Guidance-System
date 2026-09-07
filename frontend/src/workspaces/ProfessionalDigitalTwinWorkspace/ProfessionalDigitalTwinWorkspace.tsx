import React, { useState, useMemo } from 'react';
import {
  Network,
  Search,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export const ProfessionalDigitalTwinWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [userId, setUserId] = useState<string>('usr-dt-888');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<string>('usr_usr-dt-888');

  // Simulated Datasets
  const digitalTwinMetrics = useMemo(
    () => ({
      version: 'v1.2.0',
      healthScore: 98.5,
      nodesCount: 7,
      edgesCount: 6,
      inferredSkills: [
        { name: 'ASGI / AsyncIO Concurrency', confidence: 95.0, source: 'FastAPI & Python' },
        { name: 'Cloud-Native Infrastructure', confidence: 96.0, source: 'Docker & Kubernetes' },
      ],
      contradictions: [
        { item: 'Milvus', severity: 'HIGH_EVIDENCE_GAP', reason: 'Claimed on resume but 0 codebase artifacts found' },
        { item: 'Golang', severity: 'HIGH_EVIDENCE_GAP', reason: 'Claimed on profile but no commit evidence detected' },
      ],
      nodes: [
        { id: 'usr_usr-dt-888', label: 'User Node', name: 'Digital Twin User', type: 'User' },
        { id: 'sk_python', label: 'Skill', name: 'Python', type: 'Skill', verified: true, confidence: 98 },
        { id: 'sk_fastapi', label: 'Skill', name: 'FastAPI', type: 'Skill', verified: true, confidence: 98 },
        { id: 'sk_docker', label: 'Skill', name: 'Docker', type: 'Skill', verified: true, confidence: 98 },
        { id: 'sk_kubernetes', label: 'Skill', name: 'Kubernetes', type: 'Skill', verified: true, confidence: 95 },
        { id: 'sk_react', label: 'Skill', name: 'React', type: 'Skill', verified: true, confidence: 94 },
      ],
    }),
    []
  );

  const handleGenerateTwin = () => {
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      message: `Synthesizing Professional Digital Twin & building graph topology for [${userId}]...`,
    });
    setTimeout(() => {
      setIsAnalyzing(false);
      addToast({
        type: 'success',
        message: `Digital Twin Graph Generated! Topology: 7 Nodes / 6 Edges (Version v1.2.0)`,
      });
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        title="SkillBridge Professional Digital Twin & Connected Knowledge Graph"
        subtitle="EXPLAINABLE AI DIGITAL TWIN CONNECTING SKILLS, PROJECTS, REPOSITORIES, & EVIDENCE PROVENANCE"
        badge="Professional Digital Twin"
        badgeColor="indigo"
        metrics={[
          { label: 'Graph Topology', value: '7 Nodes / 6 Edges', change: 'Version v1.2.0', trend: 'up' },
          { label: 'Graph Health Score', value: '98.5 / 100', change: 'Harmonized Topology', trend: 'up' },
          { label: 'Inferred Hidden Skills', value: '2 Inferred', change: '96.0% Confidence', trend: 'up' },
          { label: 'Evidence Corroboration', value: 'Multi-Channel', change: 'GitHub + Portfolio', trend: 'up' },
        ]}
      />

      {/* TOP USER ID SEARCH BAR */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Network className="w-5 h-5" />
          </span>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter User ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleGenerateTwin}
            disabled={isAnalyzing}
            className="w-full sm:w-auto py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Synthesizing Twin...' : 'Generate Digital Twin Graph'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* GRAPH TOPOLOGY & INFERRED REASONING (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INTERACTIVE GRAPH NODE EXPLORER (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              Digital Twin Topology Explorer (Nodes & Edges)
            </span>
            <span className="text-[10px] font-mono text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">
              Snapshot {digitalTwinMetrics.version}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
            {digitalTwinMetrics.nodes.map((node) => (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                  selectedNode === node.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950/80 border-white/10 text-slate-300 hover:border-indigo-500/50'
                }`}
              >
                <span className="text-[10px] text-slate-400 uppercase block">{node.type}</span>
                <span className="font-bold text-xs block truncate">{node.name}</span>
                {node.verified && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {node.confidence}% Confidence
                  </span>
                )}
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* AI REASONING & INFERRED SKILLS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-purple-400" />
                AI Graph Reasoning & Inferred Skills
              </span>
            </div>

            <div className="space-y-3">
              {digitalTwinMetrics.inferredSkills.map((inf) => (
                <div key={inf.name} className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300">{inf.name}</span>
                    <span className="text-emerald-400 font-bold text-[11px]">{inf.confidence}%</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Inferred from: <strong className="text-white">{inf.source}</strong>
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* CONTRADICTION CENTER */}
          <GlassPanel className="p-6 space-y-4 border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Contradiction & Evidence Gap Center
              </span>
            </div>

            <div className="space-y-2.5">
              {digitalTwinMetrics.contradictions.map((c) => (
                <div key={c.item} className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">{c.item}</span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded">
                      {c.severity}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">{c.reason}</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={98.5}
        lastUpdated="Digital Twin Active"
      />
    </div>
  );
};

export default ProfessionalDigitalTwinWorkspace;
