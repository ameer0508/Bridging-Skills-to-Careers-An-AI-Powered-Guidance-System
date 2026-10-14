import React, { useState, useMemo } from 'react';
import {
  Award,
  Sparkles,
  Zap,
  CheckCircle2,
  Eye,
  ShieldCheck,
  Search,
  RefreshCw,
  FileText,
  Briefcase,
  Globe,
  Code2,
  TrendingUp,
} from 'lucide-react';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';

export const ProfessionalBrandWorkspace: React.FC = () => {
  const { addToast } = useToast();

  // State Management
  const [userId, setUserId] = useState<string>('usr-brand-909');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Simulated Datasets
  const brandMetrics = useMemo(
    () => ({
      brandScore: 97.1,
      recruiterVisibility: 98.0,
      searchPercentile: 99.2,
      atsCompatibility: 96.0,
      consistencyScore: 98.0,
      technicalAuthority: 96.0,
      positioningTitle: 'Senior AI Infrastructure & Distributed Systems Architect',
      recruiterKeywords: ['Vector Indexing', 'RAG Architecture', 'FastAPI Microservices', 'Kubernetes'],
      missingKeywords: ['Terraform', 'Helm Chart', 'OpenTelemetry'],
    }),
    []
  );

  const crossPlatformStatus = [
    { channel: 'Resume', status: 'Harmonized (sample)', icon: FileText, score: 98 },
    { channel: 'LinkedIn Profile', status: 'Harmonized (sample)', icon: Briefcase, score: 96 },
    { channel: 'GitHub Activity', status: 'Code evidence (sample)', icon: Code2, score: 99 },
    { channel: 'Portfolio Website', status: 'Live showcases (sample)', icon: Globe, score: 95 },
  ];

  const handleAnalyzeBrand = () => {
    setIsAnalyzing(true);
    addToast({
      type: 'info',
      message: `Analyzing cross-platform brand identity & ATS keyword coverage for [${userId}]...`,
    });
    setTimeout(() => {
      setIsAnalyzing(false);
      addToast({
        type: 'success',
        message: `Analyzed Brand Profile! Professional Brand Score 97.1/100 (Top 1% Thought Leader)`,
      });
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        title="SkillBridge Professional Brand Intelligence & Positioning"
        subtitle="EVALUATE COMPLETE PROFESSIONAL IDENTITY, RECRUITER VISIBILITY, ATS OPTIMIZATION, & CROSS-PLATFORM CONSISTENCY"
        badge="Brand Intelligence"
        badgeColor="indigo"
        metrics={[
          { label: 'Overall Brand Score', value: '97.1 / 100', change: 'Top 1% Thought Leader', trend: 'up' },
          { label: 'Recruiter Visibility', value: '98.0 / 100', change: '99.2% Search Rank', trend: 'up' },
          { label: 'ATS Compatibility', value: '96.0%', change: '100% Parseable', trend: 'up' },
          { label: 'Platform Consistency', value: '98.0%', change: 'Fully Harmonized', trend: 'up' },
        ]}
      />

      {/* TOP USER ID SEARCH BAR */}
      <GlassPanel className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-aurora-violet/25">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="p-2 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo">
            <Award className="w-5 h-5" />
          </span>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter User ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-xs text-aurora-ink placeholder-slate-500 focus:outline-none focus:border-indigo-500 tabular-nums"
            />
            <Search className="w-4 h-4 text-aurora-muted absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleAnalyzeBrand}
            disabled={isAnalyzing}
            className="w-full sm:w-auto py-2 px-4 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Evaluating Brand...' : 'Analyze Professional Brand'}</span>
          </button>
        </div>
      </GlassPanel>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 space-y-2 border-aurora-violet/25">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-aurora-muted uppercase">Recruiter Visibility</span>
            <Eye className="w-4 h-4 text-aurora-indigo" />
          </div>
          <span className="text-xl font-bold text-aurora-ink block">98.0 / 100</span>
          <span className="text-xs text-aurora-indigo">99.2 Percentile Rank</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-aurora-muted uppercase">Cross-Platform Consistency</span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <span className="text-xl font-bold text-emerald-700 block">98.0 / 100</span>
          <span className="text-xs text-emerald-700">Fully Harmonized</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-aurora-muted uppercase">ATS Compatibility</span>
            <Zap className="w-4 h-4 text-aurora-violet" />
          </div>
          <span className="text-xl font-bold text-aurora-ink block">96.0 / 100</span>
          <span className="text-xs text-aurora-violet">100% Parseable</span>
        </GlassPanel>

        <GlassPanel className="p-4 space-y-2 border-purple-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-aurora-muted uppercase">Technical Authority</span>
            <TrendingUp className="w-4 h-4 text-aurora-violet" />
          </div>
          <span className="text-xl font-bold text-aurora-ink block">96.0 / 100</span>
          <span className="text-xs text-aurora-violet">Principal Industry Leader</span>
        </GlassPanel>
      </div>

      {/* CROSS-PLATFORM HARMONIZATION & KEYWORDS (2 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CROSS-PLATFORM CONSISTENCY (6 COLS) */}
        <GlassPanel className="lg:col-span-6 p-6 space-y-4 border-aurora-violet/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-aurora-indigo" />
              Cross-Platform Ecosystem Consistency
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              0 Contradictions
            </span>
          </div>

          <div className="space-y-3">
            {crossPlatformStatus.map((chan) => {
              const Icon = chan.icon;
              return (
                <div key={chan.channel} className="p-3.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between text-xs tabular-nums">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-aurora-indigo" />
                    <span className="font-bold text-aurora-ink">{chan.channel}</span>
                  </div>
                  <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {chan.status} ({chan.score}%)
                  </span>
                </div>
              );
            })}
          </div>
        </GlassPanel>

        {/* ATS KEYWORD COVERAGE (6 COLS) */}
        <GlassPanel className="lg:col-span-6 p-6 space-y-4 border-aurora-violet/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-aurora-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-aurora-violet" />
              Recruiter & ATS Keyword Optimization
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-aurora-muted text-[11px] block mb-1.5">Matched High-Demand Keywords:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {brandMetrics.recruiterKeywords.map((kw) => (
                  <span key={kw} className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px]">
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-aurora-muted text-[11px] block mb-1.5">Recommended Keywords to Include:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {brandMetrics.missingKeywords.map((kw) => (
                  <span key={kw} className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[10px]">
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar status="idle" provider="Built-in sample content" />
    </div>
  );
};

export default ProfessionalBrandWorkspace;
