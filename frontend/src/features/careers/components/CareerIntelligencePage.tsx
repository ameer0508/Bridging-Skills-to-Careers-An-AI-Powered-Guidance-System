import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Brain, FileText, Compass, Search } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

import { CareerTelemetryHUD } from './CareerTelemetryHUD';
import { CareerObservatoryGrid } from './CareerObservatoryGrid';
import { CareerDetailModal } from './CareerDetailModal';
import { MarketTrendsPanel } from './MarketTrendsPanel';
import { SalaryIntelligencePanel } from './SalaryIntelligencePanel';
import { JobIntelligenceFeed } from './JobIntelligenceFeed';

// Design System 2.0 Components
import {
  QuickActionGrid,
  AIStatusBar,
  WorkspaceDivider,
  PremiumSection,
  PremiumEmptyState,
  PremiumErrorState,
} from '../../../components/experience/workspace';
import { AIThinkingAnimation } from '../../../components/experience';

interface ICareerMatch {
  id: string;
  careerId: {
    _id: string;
    title: string;
    category: string;
    description: string;
  };
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  confidence: number;
}

export const CareerIntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMatchForModal, setSelectedMatchForModal] = useState<ICareerMatch | null>(null);

  const { data, isLoading, error, refetch } = useQuery<{ matches: ICareerMatch[] }>({
    queryKey: ['careers', 'matches'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data;
    },
  });

  const matches = useMemo(() => data?.matches || [], [data]);

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(matches.map((m) => m.careerId.category)))];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedCategory !== 'all' && m.careerId.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.careerId.title.toLowerCase().includes(q) ||
        m.careerId.description.toLowerCase().includes(q) ||
        m.matchingSkills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [matches, selectedCategory, searchQuery]);

  const topMatch = matches[0];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Evaluating Deterministic Career Match Scores..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Career Intelligence Connection Error"
          message={`Failed to compute career matches: ${(error as Error).message}`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <PremiumEmptyState
          title="Insufficient Skill Evidence"
          description="Career matching requires evidence parsing from your experience. Upload your resume to extract deterministic career vector matches."
          primaryAction={{
            label: 'Upload Resume Now',
            onClick: () => navigate('/resume'),
          }}
          secondaryAction={{
            label: 'Ask AI Architect',
            onClick: () => navigate('/ai'),
          }}
        />
      </div>
    );
  }

  const quickActions = [
    {
      id: 'ai',
      title: 'Ask AI Architect',
      subtitle: 'Target career strategy',
      icon: Brain,
      shortcut: '⌘1',
      color: 'text-cyan-400',
      onClick: () => navigate('/ai'),
    },
    {
      id: 'readiness',
      title: 'Career Readiness',
      subtitle: 'Dimensional gap scoring',
      icon: Compass,
      shortcut: '⌘2',
      color: 'text-emerald-400',
      onClick: () => navigate('/readiness'),
    },
    {
      id: 'resume',
      title: 'Resume Studio',
      subtitle: 'Upload updated resume',
      icon: FileText,
      shortcut: '⌘3',
      color: 'text-indigo-400',
      onClick: () => navigate('/resume'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4">
      {/* SECTION 1 — HERO TELEMETRY HUD */}
      <CareerTelemetryHUD
        totalMatches={matches.length}
        topRoleTitle={topMatch?.careerId?.title}
        topMatchScore={topMatch?.matchScore}
      />

      {/* SECTION 2 — SEARCH & CATEGORY FILTER BAR */}
      <div className="p-4 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search career roles or skills..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto custom-scrollbar pb-1 sm:pb-0">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-colors shrink-0 cursor-pointer ${
                selectedCategory === c
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {c === 'all' ? 'All Roles' : c}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3 — CAREER OBSERVATORY GRID */}
      <PremiumSection
        title="Career Observatory Leaderboard"
        subtitle="Ranked role alignments computed from verified skill requirements"
        badge="Leaderboard"
      >
        <CareerObservatoryGrid
          matches={filteredMatches}
          onSelectMatch={(match) => setSelectedMatchForModal(match)}
        />
      </PremiumSection>

      <WorkspaceDivider label="Market Trends & Job Intelligence" />

      {/* SECTION 4 — MARKET TRENDS & SALARY INTELLIGENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MarketTrendsPanel />
        <SalaryIntelligencePanel />
      </div>

      {/* SECTION 5 — LIVE JOB INTELLIGENCE FEED */}
      <JobIntelligenceFeed />

      {/* SECTION 6 — COMMAND CENTER SHORTCUTS */}
      <PremiumSection
        title="Intelligence Shortcuts"
        subtitle="Execute downstream career analysis"
        badge="Actions"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      {/* SECTION 7 — LIVE AI STATUS FOOTER */}
      <AIStatusBar status="active" confidence={94.8} lastUpdated="Just now" />

      {/* CAREER DETAIL MODAL */}
      <CareerDetailModal
        match={selectedMatchForModal}
        onClose={() => setSelectedMatchForModal(null)}
      />
    </div>
  );
};

export default CareerIntelligencePage;
