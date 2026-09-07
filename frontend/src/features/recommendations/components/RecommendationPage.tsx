import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Brain, Compass, FileText, Target } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

import { RecommendationTelemetryHUD } from './RecommendationTelemetryHUD';
import { ActionRecommendationGrid } from './ActionRecommendationGrid';
import { PriorityMatrix } from './PriorityMatrix';
import { ImpactPredictionCard } from './ImpactPredictionCard';

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

interface IRecommendation {
  _id: string;
  careerId: {
    title: string;
    category: string;
  };
  category: string;
  title: string;
  description: string;
  priority: string;
  priorityScore: number;
  reason: string;
  impact: number;
  difficulty: string;
  estimatedTime: string;
  dependencies: string[];
  actionLink?: string;
  actionType?: string;
  targetSkill?: string;
  status: string;
}

export const RecommendationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<string>('active');

  const { data, isLoading, error, refetch } = useQuery<{ recommendations: IRecommendation[] }>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await apiClient.get('/recommendations');
      return response.data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/recommendations/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });

  const recommendations = useMemo(() => data?.recommendations || [], [data]);
  const filteredRecs = useMemo(() => {
    return recommendations.filter((r) => r.status === activeTab);
  }, [recommendations, activeTab]);

  const activeCount = useMemo(() => {
    return recommendations.filter((r) => r.status === 'active').length;
  }, [recommendations]);

  const topPriorityRec = recommendations.find((r) => r.status === 'active');

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Ranking Action Priorities & Gap Impact Scores..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Action Intelligence Connection Error"
          message={`Failed to load recommendations: ${(error as Error).message}`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <PremiumEmptyState
          title="No Action Items Generated Yet"
          description="Action intelligence requires evidence parsing from your experience. Upload your resume to extract gap-closing recommendations."
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

  const tabs = [
    { id: 'active', label: 'Active Actions' },
    { id: 'saved_for_later', label: 'Saved for Later' },
    { id: 'completed', label: 'Completed' },
    { id: 'dismissed', label: 'Dismissed' },
  ];

  const quickActions = [
    {
      id: 'ai',
      title: 'Ask AI Architect',
      subtitle: 'Recommendation strategy',
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
      id: 'roadmap',
      title: 'Adaptive Roadmap',
      subtitle: 'Phased learning milestones',
      icon: Target,
      shortcut: '⌘3',
      color: 'text-indigo-400',
      onClick: () => navigate('/roadmap'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4">
      {/* SECTION 1 — HERO TELEMETRY HUD */}
      <RecommendationTelemetryHUD
        totalActive={activeCount}
        topPriorityTitle={topPriorityRec?.title}
        peakImpact={topPriorityRec?.impact}
      />

      {/* SECTION 2 — IMPACT FORECAST & PRIORITY MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-6">
          <ImpactPredictionCard
            readinessGain={18.0}
            matchGain={22.0}
            competitiveness="High (+35% Recruiter Callback Rate)"
            salaryPotential="+$8,000 - $15,000 / year"
          />
        </div>
        <div className="lg:col-span-6 space-y-6">
          <PriorityMatrix />
        </div>
      </div>

      {/* SECTION 3 — TAB FILTER BAR & ACTION GRID */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => {
            const count = recommendations.filter((r) => r.status === tab.id).length;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950/70 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[9px]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <PremiumSection
          title="Recommended Career Actions"
          subtitle="Ranked items targeting critical skill gaps and weak readiness areas"
          badge="Actions"
        >
          <ActionRecommendationGrid
            recommendations={filteredRecs}
            onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
          />
        </PremiumSection>
      </div>

      <WorkspaceDivider label="Command Center Shortcuts" />

      {/* SECTION 4 — COMMAND CENTER SHORTCUTS */}
      <PremiumSection
        title="Intelligence Shortcuts"
        subtitle="Execute downstream career analysis"
        badge="Actions"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      {/* SECTION 5 — LIVE AI STATUS FOOTER */}
      <AIStatusBar status="active" confidence={95.4} lastUpdated="Just now" />
    </div>
  );
};

export default RecommendationPage;
