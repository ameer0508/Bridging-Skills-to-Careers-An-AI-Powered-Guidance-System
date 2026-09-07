import React, { useState, useMemo } from 'react';
import {
  Users,
  Share2,
  Calendar,
  Send,
  Search,
  RefreshCw,
  Award,
  Sparkles,
  Building,
  GraduationCap,
  MessageCircle,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export const NetworkingAgentWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [targetCompany, setTargetCompany] = useState<string>('OpenScale AI Systems');
  const [targetSkill, setTargetSkill] = useState<string>('Vector Indexing & Milvus Architecture');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [outreachDraft, setOutreachDraft] = useState<string>(
    'Hi Dr. Sarah Chen,\n\nI noticed your impactful work on Vector Indexing at OpenScale AI Systems. As an AI Infrastructure Architect scaling vector search systems, I would love to connect and learn about your team\'s approach to scale-out indexing.\n\nBest,\nAlex'
  );

  // Simulated Datasets
  const networkingAgentMetrics = useMemo(
    () => ({
      networkingScore: 96.5,
      networkNodes: 142,
      referralBoost: '3.5x Callback Rate',
      activeMentors: 3,
      connections: [
        {
          id: 'conn_01',
          name: 'Dr. Sarah Chen',
          role: 'VP of AI Infrastructure',
          company: 'OpenScale AI Systems',
          matchScore: 96.5,
          path: 'Mutual Alumni (Stanford University)',
        },
      ],
      alumni: [
        { id: 'alum_77', name: 'Marcus Vance', role: 'Staff Engineer', company: 'OpenScale AI Systems', school: 'Stanford University' },
      ],
      mentors: [
        { id: 'ment_09', name: 'Elena Rostova', title: 'Principal Architect & Open Source Maintainer', focus: 'Vector Indexing & Milvus' },
      ],
      events: [
        { title: 'Global Vector Search & Scale-Out Infrastructure Summit 2026', date: '2026-09-15', location: 'San Francisco & Virtual', rating: 98.0 },
      ],
      followups: [
        { name: 'Dr. Sarah Chen', date: '2026-08-10', action: 'Send thank-you message & share updated RAG benchmark paper' },
      ],
    }),
    []
  );

  const handleRunNetworkingCycle = () => {
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      message: `Running autonomous networking engine for [${targetCompany}]...`,
    });
    setTimeout(() => {
      setIsAnalyzing(false);
      addToast({
        type: 'success',
        message: `Found Alumni Referral Path! Dr. Sarah Chen (96.5% Match, 3.5x Callback Rate Boost)`,
      });
    }, 1000);
  };

  const handleSendDraft = () => {
    addToast({
      type: 'success',
      message: `Outreach draft prepared & authorized by candidate for delivery!`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        title="SkillBridge Autonomous AI Networking Agent"
        subtitle="STRATEGIC CONNECTION MATCHING, ALUMNI REFERRAL PATHS, MENTOR DISCOVERY, & OUTREACH DRAFTING"
        badge="Networking Agent"
        badgeColor="indigo"
        metrics={[
          { label: 'Networking Score', value: '96.5 / 100', change: 'Top 5% Networker', trend: 'up' },
          { label: 'Warm Referral Path', value: '3.5x Boost', change: 'Stanford Alumni', trend: 'up' },
          { label: 'Network Nodes', value: '142 Contacts', change: '+12 This Month', trend: 'up' },
          { label: 'Active Mentors', value: '3 Matched', change: '1:1 Session Ready', trend: 'up' },
        ]}
      />

      {/* TOP TARGET COMPANY & SKILL SEARCH BAR */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/30">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Users className="w-5 h-5" />
          </span>
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              placeholder="Target Company..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={targetSkill}
              onChange={(e) => setTargetSkill(e.target.value)}
              placeholder="Target Skill..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleRunNetworkingCycle}
            disabled={isAnalyzing}
            className="w-full sm:w-auto py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Matching Network...' : 'Run Autonomous Networking Cycle'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 space-y-2 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Networking Score</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">96.5 / 100</span>
          <span className="text-xs font-mono text-indigo-300">142 Topology Nodes</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Warm Referral Impact</span>
            <Share2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-400 font-mono block">3.5x Callback</span>
          <span className="text-xs font-mono text-emerald-300">Stanford Alumni Verified</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Alumni Matches</span>
            <GraduationCap className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">Stanford Network</span>
          <span className="text-xs font-mono text-cyan-300">At {targetCompany}</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">1:1 Mentors</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">3 Senior Mentors</span>
          <span className="text-xs font-mono text-purple-300">Vector Indexing Focus</span>
        </GlassPanel>
      </div>

      {/* RECOMMENDED CONNECTIONS & OUTREACH DRAFT STUDIO (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RECOMMENDED CONNECTIONS & ALUMNI (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Recommended High-Value Connections & Alumni
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {networkingAgentMetrics.connections.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{c.name}</span>
                  <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> {c.matchScore}% Match
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{c.role} @ <strong className="text-indigo-300">{c.company}</strong></span>
                  <span className="text-cyan-300 font-bold">{c.path}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* OUTREACH DRAFT STUDIO & FOLLOWUPS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-cyan-400" />
                User-Editable Outreach Draft Studio
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <textarea
                rows={6}
                value={outreachDraft}
                onChange={(e) => setOutreachDraft(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
              />

              <button
                onClick={handleSendDraft}
                className="w-full py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Authorize & Prepare Outreach
              </button>
            </div>
          </GlassPanel>

          {/* UPCOMING EVENTS & MENTORS */}
          <GlassPanel className="p-6 space-y-4 border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Upcoming Tech Conferences & Summits
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {networkingAgentMetrics.events.map((e) => (
                <div key={e.title} className="p-3 rounded-xl bg-slate-950/80 border border-white/10 space-y-1">
                  <span className="font-bold text-white text-[11px] block">{e.title}</span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{e.date} • {e.location}</span>
                    <span className="text-purple-300 font-bold">★ {e.rating}% Match</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={96.5}
        lastUpdated="Networking Agent Active"
      />
    </div>
  );
};

export default NetworkingAgentWorkspace;
