import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Brain, FileText, Target, ChevronRight } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

import { ReadinessTelemetryHUD } from './ReadinessTelemetryHUD';
import { ReadinessDimensionGrid } from './ReadinessDimensionGrid';
import { CriticalGapActionDrawer } from './CriticalGapActionDrawer';

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

interface IGapItem {
  skillName: string;
  impactScore: number;
  reason: string;
}

interface IDimension {
  name: string;
  score: number;
  weight: number;
}

interface ICareerReadiness {
  _id: string;
  careerId: {
    _id: string;
    title: string;
    category: string;
    description?: string;
  };
  overallScore: number;
  readinessTier: string;
  dimensions: IDimension[];
  gaps: {
    criticalGaps: IGapItem[];
    weakAreas: IGapItem[];
    strengthAreas: IGapItem[];
  };
}

export const CareerReadinessPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery<{ readiness: ICareerReadiness[] }>({
    queryKey: ['readiness'],
    queryFn: async () => {
      const response = await apiClient.get('/readiness');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Calculating 4-Dimension Capability Scores..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Career Readiness Connection Error"
          message={`Failed to load readiness data: ${(error as Error).message}`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const items = data?.readiness || [];
  const activeItem = items.find((i) => i.careerId._id === selectedCareerId) || items[0];

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <PremiumEmptyState
          title="No Readiness Profiles Generated"
          description="Readiness scoring requires evidence parsing from your experience. Upload your resume to extract dimensional readiness metrics."
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
      subtitle: 'Dimensional gap advisory',
      icon: Brain,
      shortcut: '⌘1',
      color: 'text-cyan-400',
      onClick: () => navigate('/ai'),
    },
    {
      id: 'careers',
      title: 'Career Observatory',
      subtitle: 'Leaderboard match scores',
      icon: Target,
      shortcut: '⌘2',
      color: 'text-indigo-400',
      onClick: () => navigate('/careers'),
    },
    {
      id: 'resume',
      title: 'Resume Studio',
      subtitle: 'Upload updated resume',
      icon: FileText,
      shortcut: '⌘3',
      color: 'text-emerald-400',
      onClick: () => navigate('/resume'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4">
      {/* SECTION 1 — HERO TELEMETRY HUD */}
      <ReadinessTelemetryHUD
        careerTitle={activeItem?.careerId?.title}
        overallScore={activeItem?.overallScore}
        readinessTier={activeItem?.readinessTier}
      />

      {/* SECTION 2 — ROLE SELECTOR & MAIN STUDIO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ROLE SELECTOR SIDEBAR */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
            Analyzed Career Profiles ({items.length})
          </span>

          <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            {items.map((item) => {
              const isSelected = activeItem._id === item._id;

              return (
                <div
                  key={item._id}
                  onClick={() => setSelectedCareerId(item.careerId._id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/50 shadow-lg'
                      : 'bg-slate-950/70 border-white/10 hover:border-white/20 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="space-y-1 truncate">
                    <span className="text-[9px] font-mono text-indigo-300 font-bold uppercase block">
                      {item.careerId.category}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate">
                      {item.careerId.title}
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-mono block">
                      {item.readinessTier}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-display text-xl font-extrabold text-cyan-400">
                      {item.overallScore}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4-DIMENSION BREAKDOWN GRID */}
        <div className="lg:col-span-8 space-y-6">
          <PremiumSection
            title="4-Dimension Capability Breakdown"
            subtitle="Weighted readiness analysis across technical, experience, portfolio, and education"
            badge="Dimensions"
          >
            <ReadinessDimensionGrid dimensions={activeItem.dimensions} />
          </PremiumSection>
        </div>
      </div>

      <WorkspaceDivider label="Gap Prioritization & Action Strategy" />

      {/* SECTION 3 — CRITICAL GAPS & STRENGTHS */}
      <PremiumSection
        title="Skill Gap & Capability Analysis"
        subtitle="Critical missing requirements and verified core strengths"
        badge="Gaps & Strengths"
      >
        <CriticalGapActionDrawer
          criticalGaps={activeItem.gaps?.criticalGaps}
          weakAreas={activeItem.gaps?.weakAreas}
          strengthAreas={activeItem.gaps?.strengthAreas}
        />
      </PremiumSection>

      {/* SECTION 4 — COMMAND CENTER SHORTCUTS */}
      <PremiumSection
        title="Intelligence Shortcuts"
        subtitle="Execute downstream career analysis"
        badge="Actions"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      {/* SECTION 5 — LIVE AI STATUS FOOTER */}
      <AIStatusBar status="active" confidence={96.2} lastUpdated="Just now" />
    </div>
  );
};

export default CareerReadinessPage;
