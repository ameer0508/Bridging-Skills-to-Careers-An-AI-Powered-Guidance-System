import React, { useState } from 'react';
import {
  Activity,
  Zap,
  BarChart3,
  Terminal,
  FlaskConical,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export const AIOperationsCenterWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    enable_gemini_2_5_flash: true,
    enable_external_intelligence_gateway: true,
    enable_knowledge_graph_inference: true,
    emergency_kill_switch: false,
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'traces' | 'flags' | 'experiments'>('overview');

  // Datasets
  const latencyHistory = [
    { time: '20:15', latencyMs: 135, costUsd: 0.0003 },
    { time: '20:17', latencyMs: 142, costUsd: 0.0004 },
    { time: '20:19', latencyMs: 138, costUsd: 0.0003 },
    { time: '20:21', latencyMs: 155, costUsd: 0.0005 },
    { time: '20:23', latencyMs: 140, costUsd: 0.0004 },
  ];

  const traceSpans = [
    { traceId: 'trace-d26060a9', component: 'Gateway', operation: 'ParseResume', durationMs: 12.4, status: 'OK' },
    { traceId: 'trace-d26060a9', component: 'FeatureStore', operation: 'ReadOnlineFeatures', durationMs: 0.8, status: 'OK' },
    { traceId: 'trace-d26060a9', component: 'KnowledgeGraph', operation: 'BFSShortestPath', durationMs: 0.29, status: 'OK' },
    { traceId: 'trace-d26060a9', component: 'EventBus', operation: 'DispatchResumeParsed', durationMs: 0.33, status: 'OK' },
  ];

  const pipelineStatus = [
    { name: 'Resume Pipeline', status: 'Healthy', latency: '12.4 ms', successRate: '99.98%' },
    { name: 'Skill Extraction', status: 'Healthy', latency: '18.2 ms', successRate: '99.95%' },
    { name: 'Career Matching', status: 'Healthy', latency: '24.0 ms', successRate: '99.99%' },
    { name: 'Recommendation Engine', status: 'Healthy', latency: '15.5 ms', successRate: '99.90%' },
    { name: 'Adaptive Roadmap Builder', status: 'Healthy', latency: '32.1 ms', successRate: '99.88%' },
    { name: 'Predictive Analytics', status: 'Healthy', latency: '28.4 ms', successRate: '99.92%' },
  ];

  const handleToggleFlag = (key: string) => {
    const nextState = !featureFlags[key];
    setFeatureFlags((prev) => ({ ...prev, [key]: nextState }));
    addToast({
      type: nextState ? 'success' : 'warning',
      message: `Toggled feature flag [${key}] to ${nextState ? 'ENABLED' : 'DISABLED'}`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* HERO SECTION */}
      <WorkspaceHero
        title="SkillBridge AI Operations & Observability Center"
        subtitle="CENTRALIZED GOVERNANCE, REAL-TIME DISTRIBUTED TRACING, SLO TRACKING, & A/B EXPERIMENTATION"
        badge="AI Operations"
        badgeColor="indigo"
        metrics={[
          { label: 'SLO Attainment', value: '99.95%', change: '99.9% Target', trend: 'up' },
          { label: 'Avg AI Latency', value: '140.0 ms', change: 'Sub-300ms SLA', trend: 'up' },
          { label: 'Model Confidence', value: '98.4%', change: 'Stable Threshold', trend: 'up' },
          { label: 'Error Budget Left', value: '95.2%', change: 'Low Risk', trend: 'up' },
        ]}
      />

      {/* NAVIGATION TAB STRIP */}
      <GlassPanel className="p-2 flex items-center gap-2 overflow-x-auto custom-scrollbar border-indigo-500/30">
        {[
          { id: 'overview', label: 'Executive Operations Overview', icon: Activity },
          { id: 'traces', label: 'Distributed Trace Spans', icon: Terminal },
          { id: 'flags', label: 'Feature Flag Console', icon: Zap },
          { id: 'experiments', label: 'A/B Experiments Manager', icon: FlaskConical },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'traces' | 'flags' | 'experiments')}
              className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </GlassPanel>

      {/* TAB 1 — OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* PIPELINE STATUS BOARD */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelineStatus.map((pipe, i) => (
              <GlassPanel key={i} className="p-4 space-y-3 border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{pipe.name}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                    ● {pipe.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950 border border-white/5 space-y-0.5">
                    <span className="text-[9px] text-slate-500 block">LATENCY</span>
                    <span className="text-slate-200 font-bold">{pipe.latency}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-white/5 space-y-0.5">
                    <span className="text-[9px] text-slate-500 block">SUCCESS RATE</span>
                    <span className="text-emerald-400 font-bold">{pipe.successRate}</span>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>

          {/* LATENCY & COST TELEMETRY CHART */}
          <GlassPanel className="p-6 space-y-4 border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                AI Inference Latency & Cost Telemetry
              </span>
              <span className="text-[10px] font-mono text-slate-400">Live Telemetry</span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="opsLatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="latencyMs" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#opsLatGrad)" name="Latency (ms)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* TAB 2 — DISTRIBUTED TRACING */}
      {activeTab === 'traces' && (
        <GlassPanel className="p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              OpenTelemetry Distributed Spans (Trace ID: trace-d26060a9)
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {traceSpans.map((span, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                      {span.component}
                    </span>
                    <span className="text-white font-bold">{span.operation}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Trace: {span.traceId}</span>
                </div>

                <div className="text-right">
                  <span className="text-emerald-400 font-bold block">{span.durationMs} ms</span>
                  <span className="text-[10px] text-emerald-300 font-bold">● {span.status}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* TAB 3 — FEATURE FLAGS */}
      {activeTab === 'flags' && (
        <GlassPanel className="p-6 space-y-4 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Canary Feature Flags & Kill Switch Console
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(featureFlags).map(([key, enabled]) => (
              <div key={key} className="p-4 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white font-mono block">{key}</span>
                  <span className="text-xs text-slate-400">
                    {key === 'emergency_kill_switch' ? 'CRITICAL: Instantly disables all AI inference' : 'Canary feature flag rollout'}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleFlag(key)}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    enabled
                      ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-900 border-white/10 text-slate-400'
                  }`}
                >
                  {enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
                  <span>{enabled ? 'ENABLED' : 'DISABLED'}</span>
                </button>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* TAB 4 — EXPERIMENTS */}
      {activeTab === 'experiments' && (
        <GlassPanel className="p-6 space-y-4 border-purple-500/30">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-400" />
            Live A/B Model Experiments (exp-career-matching-v2)
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-2">
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Variant A (50% Traffic)</span>
              <h4 className="text-sm font-bold text-white">Gemini-2.5-Flash</h4>
              <div className="text-xs font-mono text-slate-400 space-y-1">
                <div>Avg Latency: <span className="text-white font-bold">135 ms</span></div>
                <div>Match Acceptance: <span className="text-emerald-400 font-bold">96.4%</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-white/10 space-y-2">
              <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">Variant B (50% Traffic)</span>
              <h4 className="text-sm font-bold text-white">Gemini-1.5-Pro</h4>
              <div className="text-xs font-mono text-slate-400 space-y-1">
                <div>Avg Latency: <span className="text-white font-bold">240 ms</span></div>
                <div>Match Acceptance: <span className="text-emerald-400 font-bold">97.8%</span></div>
              </div>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={99.95}
        lastUpdated="Operations Live"
      />
    </div>
  );
};

export default AIOperationsCenterWorkspace;
