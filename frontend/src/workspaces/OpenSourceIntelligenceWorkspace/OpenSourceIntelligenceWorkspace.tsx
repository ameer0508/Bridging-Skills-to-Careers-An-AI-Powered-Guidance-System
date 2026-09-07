import React, { useState, useMemo } from 'react';
import {
  GitPullRequest,
  Star,
  ShieldCheck,
  Award,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export const OpenSourceIntelligenceWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [username, setUsername] = useState<string>('tiangolo');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Simulated Datasets
  const openSourceMetrics = useMemo(
    () => ({
      influenceScore: 98.8,
      communityTrust: 98.5,
      totalCommits: 940,
      mergedPRs: 64,
      starsEarned: 1420,
      forksEarned: 310,
      codeReviews: 84,
      isMaintainer: true,
      releasesPublished: 14,
      organizations: ['fastapi', 'milvus-io', 'pydantic', 'huggingface'],
    }),
    []
  );

  const verifiedSkills = [
    { skill: 'Python', verified: true, org: 'fastapi / milvus-io', confidence: 98.0 },
    { skill: 'FastAPI', verified: true, org: 'fastapi / milvus-io', confidence: 98.0 },
    { skill: 'Docker', verified: true, org: 'fastapi / milvus-io', confidence: 98.0 },
    { skill: 'Kubernetes', verified: true, org: 'milvus-io', confidence: 95.0 },
  ];

  const handleAnalyzeContributor = () => {
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      message: `Fetching open-source contributions & maintainer metrics for @${username}...`,
    });
    setTimeout(() => {
      setIsAnalyzing(false);
      addToast({
        type: 'success',
        message: `Analyzed @${username}! Open Source Influence Score 98.8/100 (Principal Ecosystem Architect)`,
      });
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        title="SkillBridge Open Source Intelligence & Ecosystem Leadership"
        subtitle="EVALUATE OPEN-SOURCE CONTRIBUTIONS, COMMUNITY TRUST, CODE REVIEWS, & MAINTAINER INFLUENCE"
        badge="Open Source Intelligence"
        badgeColor="indigo"
        metrics={[
          { label: 'Open Source Influence', value: '98.8 / 100', change: 'Top 1% Global', trend: 'up' },
          { label: 'Community Trust', value: '98.5 / 100', change: 'Community Pillar', trend: 'up' },
          { label: 'Merged Pull Requests', value: '64 Merged', change: '82% Success Rate', trend: 'up' },
          { label: 'Total Stars Earned', value: '1,420 Stars', change: '310 Forks', trend: 'up' },
        ]}
      />

      {/* TOP USERNAME SEARCH BAR */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-indigo-500/30">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <GitPullRequest className="w-5 h-5" />
          </span>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter open-source handle..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleAnalyzeContributor}
            disabled={isAnalyzing}
            className="w-full sm:w-auto py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing Ecosystem...' : 'Analyze Open Source Profile'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 space-y-2 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Commits Past Year</span>
            <GitPullRequest className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">940 Commits</span>
          <span className="text-xs font-mono text-indigo-300">64 Merged PRs</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Repository Impact</span>
            <Star className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-emerald-400 font-mono block">1,420 Stars</span>
          <span className="text-xs font-mono text-emerald-300">310 Forks Earned</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Code Reviews</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">84 Reviews</span>
          <span className="text-xs font-mono text-cyan-300">Senior Reviewer</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Core Maintainer Status</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xl font-bold text-white font-mono block">Core Maintainer</span>
          <span className="text-xs font-mono text-purple-300">14 Releases Published</span>
        </GlassPanel>
      </div>

      {/* ORGANIZATIONS & SKILL EVIDENCE (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SKILL EVIDENCE VERIFICATION (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassPanel className="p-6 space-y-4 border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Open Source Skill Evidence Verification
              </span>
            </div>

            <div className="space-y-3">
              {verifiedSkills.map((sk) => (
                <div key={sk.skill} className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white">{sk.skill}</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px]">
                      {sk.confidence}% Confidence
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Org: <strong className="text-indigo-300">{sk.org}</strong> (Merged PRs)
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* ORGANIZATIONS & REPOSITORY IMPACT (7 COLS) */}
        <GlassPanel className="lg:col-span-7 p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              Contributed Open Source Organizations ({openSourceMetrics.organizations.length})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            {openSourceMetrics.organizations.map((org) => (
              <div key={org} className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-1">
                <span className="text-indigo-300 font-bold text-sm block">@{org}</span>
                <span className="text-[10px] text-slate-400">Active Contributor / Maintainer</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status="active"
        confidence={98.8}
        lastUpdated="Open Source Intelligence Live"
      />
    </div>
  );
};

export default OpenSourceIntelligenceWorkspace;
