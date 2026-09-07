import React, { useState, useMemo } from 'react';
import {
  Brain,
  Search,
  Shield,
  Trash2,
  Sparkles,
  Award,
  Target,
  Layers,
  Lightbulb,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export const PersonalMemoryWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [consentState, setConsentState] = useState({
    episodic: true,
    semantic: true,
    preference: true,
    conversation: true,
  });

  // Simulated Datasets
  const memoryMetrics = useMemo(
    () => ({
      totalMemories: 142,
      activeGoalsCount: 1,
      targetCompensation: '$240,000 USD',
      consentHealth: '100% Compliant (GDPR Ready)',
      memories: [
        {
          id: 'mem_01',
          category: 'GOAL',
          title: 'Become Principal AI Infrastructure Architect',
          timestamp: '2026-08-01',
          confidence: 0.985,
          agents: ['Career Agent', 'Orchestrator'],
          details: 'Target completion date set for 2026-12-31 with 85% current milestone progress.',
        },
        {
          id: 'mem_02',
          category: 'PREFERENCE',
          title: 'Accelerated Pace & $240,000 USD Target Salary',
          timestamp: '2026-07-28',
          confidence: 0.960,
          agents: ['Job Agent', 'Learning Agent'],
          details: 'Preferences set for Hybrid/Remote work and concise technical communication style.',
        },
        {
          id: 'mem_03',
          category: 'ACHIEVEMENT',
          title: 'Global AI Infrastructure Hackathon Winner 2026',
          timestamp: '2026-07-15',
          confidence: 0.990,
          agents: ['Opportunity Agent', 'Resume Agent'],
          details: 'Verified milestone accomplishment for High-Throughput Vector Indexing.',
        },
      ],
      reasoning:
        'Memory context is continuously weighted by Recency (30%), Importance (40%), and Goal Relevance (30%) to personalize agent recommendations while respecting your GDPR privacy settings.',
    }),
    []
  );

  const filteredMemories = useMemo(() => {
    return memoryMetrics.memories.filter((m) => {
      const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
      const matchesQuery =
        searchQuery === '' ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.details.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery, memoryMetrics]);

  const handleToggleConsent = (key: keyof typeof consentState) => {
    const updated = !consentState[key];
    setConsentState((prev) => ({ ...prev, [key]: updated }));
    addToast({
      type: 'info',
      message: `Consent setting for [${key.toUpperCase()}] updated to [${updated ? 'ENABLED' : 'DISABLED'}]`,
    });
  };

  const handlePurgeCategory = () => {
    addToast({
      type: 'warning',
      message: `Purged selected memory category permanently (GDPR Right-to-be-Forgotten enforced)`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        title="SkillBridge Personal Memory & Context Control Center"
        subtitle="USER-CONTROLLED LONG-TERM MEMORY ENGINE, PRIVACY SETTINGS, & GDPR RIGHT-TO-BE-FORGOTTEN"
        badge="Memory Engine"
        badgeColor="indigo"
        metrics={[
          { label: 'Total Memory Nodes', value: '142 Memories', change: 'Across 7 Agents', trend: 'up' },
          { label: 'Target Compensation', value: '$240,000 USD', change: 'Preference Memory', trend: 'up' },
          { label: 'Consent Status', value: 'GDPR Compliant', change: 'User Controlled', trend: 'up' },
          { label: 'Retention Policy', value: 'Active Archiving', change: 'TTL Enforced', trend: 'up' },
        ]}
      />

      {/* TOP CONTROLS & SEARCH BAR */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Brain className="w-5 h-5" />
          </span>
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Memory Nodes..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto justify-end">
          {['ALL', 'GOAL', 'PREFERENCE', 'ACHIEVEMENT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-1.5 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950/80 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </GlassPanel>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 space-y-2 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Memory Nodes</span>
            <Brain className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">142 Items</span>
          <span className="text-xs font-mono text-indigo-300">Retrieved by 7 Agents</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Consent Status</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-400 font-mono block">100% Compliant</span>
          <span className="text-xs font-mono text-emerald-300">GDPR Ready</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Active Target Goal</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">AI Architect</span>
          <span className="text-xs font-mono text-cyan-300">85% Milestone Complete</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Verified Achievement</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">Hackathon Winner</span>
          <span className="text-xs font-mono text-purple-300">Global AI Infrastructure</span>
        </GlassPanel>
      </div>

      {/* MEMORY TIMELINE & CONSENT MANAGER (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TIMELINE EXPLORER (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Persistent Memory Timeline Nodes ({filteredMemories.length})
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {filteredMemories.map((m) => (
              <div key={m.id} className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{m.title}</span>
                  <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {(m.confidence * 100).toFixed(1)}% Confidence
                  </span>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">{m.details}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-white/5 pt-2">
                  <span>Category: <strong className="text-indigo-300">{m.category}</strong></span>
                  <span>Accessed By: <strong className="text-cyan-300">{m.agents.join(', ')}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* CONSENT MANAGER & PRIVACY PURGE (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Granular Privacy Consent Manager
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {(Object.keys(consentState) as Array<keyof typeof consentState>).map((key) => (
                <div key={key} className="p-3 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between">
                  <span className="font-bold text-white capitalize">{key} Memory Consent</span>
                  <button
                    onClick={() => handleToggleConsent(key)}
                    className={`py-1 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      consentState[key]
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {consentState[key] ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              ))}

              <button
                onClick={handlePurgeCategory}
                className="w-full mt-2 py-2 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-xs font-bold text-rose-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Purge Memory Category (GDPR Right-to-be-Forgotten)
              </button>
            </div>
          </GlassPanel>

          {/* EXPLAINABLE MEMORY AI REASONING */}
          <GlassPanel className="p-6 space-y-4 border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-cyan-400" />
                Explainable Memory Context Rationale
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px] font-mono">
              {memoryMetrics.reasoning}
            </p>
          </GlassPanel>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={98.5}
        lastUpdated="Long-Term Memory Engine Active"
      />
    </div>
  );
};

export default PersonalMemoryWorkspace;
