import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Brain, FileText, Compass, Target } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

import { BlueprintTelemetryHUD } from './BlueprintTelemetryHUD';
import { PhasedBlueprintTimeline } from './PhasedBlueprintTimeline';
import { GoalCompletionPredictor } from './GoalCompletionPredictor';
import { RoadmapInsightsPanel } from './RoadmapInsightsPanel';
import { LearningCalendar } from './LearningCalendar';

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

interface IRoadmapItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  estimatedDuration: string;
  difficulty: string;
  prerequisites: string[];
  careerRelevance: string;
  expectedOutcome: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  targetSkill?: string;
}

interface IRoadmapPhase {
  _id: string;
  title: string;
  order: number;
  objective: string;
  skillsGained: string[];
  estimatedCompletionTime: string;
  items: IRoadmapItem[];
}

interface ILearningRoadmap {
  _id: string;
  progressPercentage: number;
  status: string;
  phases: IRoadmapPhase[];
  careerId: string;
}

export const LearningRoadmapPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);

  // 1. Fetch user matched careers for roadmap selection
  const { data: careersData, isLoading: careersLoading } = useQuery({
    queryKey: ['careers-for-roadmap'],
    queryFn: async () => {
      const response = await apiClient.get('/careers');
      return response.data.data.matches;
    },
  });

  const activeCareerId =
    selectedCareerId ||
    (careersData && careersData.length > 0 ? careersData[0].careerId._id : null);

  const activeCareerMatch = careersData?.find(
    (c: { careerId: { _id: string; title: string } }) => c.careerId._id === activeCareerId
  );

  // 2. Fetch active roadmap for selected career
  const {
    data: roadmapData,
    isLoading: roadmapLoading,
    error,
    refetch,
  } = useQuery<{ roadmap: ILearningRoadmap }>({
    queryKey: ['roadmap', activeCareerId],
    queryFn: async () => {
      if (!activeCareerId) return null;
      const response = await apiClient.get(`/roadmap/${activeCareerId}`);
      return response.data.data;
    },
    enabled: !!activeCareerId,
  });

  // 3. Update task status mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      await apiClient.patch(`/roadmap/${activeCareerId}/items/${itemId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', activeCareerId] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
    },
  });

  if (careersLoading || (activeCareerId && roadmapLoading)) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Resolving Dependency Tiers & Roadmap Phases..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Learning Roadmap Connection Error"
          message={`Failed to load adaptive roadmap: ${(error as Error).message}`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const roadmap = roadmapData?.roadmap;
  const activePhase = roadmap?.phases?.[0];

  if (!roadmap || !roadmap.phases || roadmap.phases.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <PremiumEmptyState
          title="Fully Prepared for Target Career"
          description="No pending milestone tasks or skill gaps detected for this career role! Explore other career paths or consult the AI Architect."
          primaryAction={{
            label: 'Explore Other Roles',
            onClick: () => navigate('/careers'),
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
      subtitle: 'Milestone task guidance',
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
      id: 'recommendations',
      title: 'Action Intelligence',
      subtitle: 'Ranked learning priorities',
      icon: Target,
      shortcut: '⌘3',
      color: 'text-indigo-400',
      onClick: () => navigate('/recommendations'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4">
      {/* SECTION 1 — HERO TELEMETRY HUD */}
      <BlueprintTelemetryHUD
        careerTitle={activeCareerMatch?.careerId?.title}
        progressPercentage={roadmap.progressPercentage}
        activePhaseTitle={activePhase?.title}
      />

      {/* SECTION 2 — TARGET CAREER SELECTOR BAR */}
      {careersData && careersData.length > 0 && (
        <div className="p-4 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest shrink-0">
            Target Career Blueprint Selector:
          </span>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto custom-scrollbar pb-1 sm:pb-0">
            {careersData.map((match: { careerId: { _id: string; title: string } }) => {
              const isSelected = activeCareerId === match.careerId._id;

              return (
                <button
                  key={match.careerId._id}
                  onClick={() => setSelectedCareerId(match.careerId._id)}
                  className={`px-4 py-2 rounded-xl font-mono text-xs transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {match.careerId.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3 — GOAL PREDICTOR & ROADMAP INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-6">
          <GoalCompletionPredictor
            totalEstimatedWeeks={16}
            readinessDate="2027-01-14"
          />
        </div>
        <div className="lg:col-span-6 space-y-6">
          <RoadmapInsightsPanel />
        </div>
      </div>

      <WorkspaceDivider label="Phased Execution Timeline & Task Milestones" />

      {/* SECTION 4 — PHASED BLUEPRINT TIMELINE */}
      <PremiumSection
        title="Adaptive Phased Timeline"
        subtitle="Ordered execution stages resolving dependency tiers and building verified skill evidence"
        badge="Execution Timeline"
      >
        <PhasedBlueprintTimeline
          phases={roadmap.phases}
          onUpdateStatus={(itemId, status) => updateItemMutation.mutate({ itemId, status })}
        />
      </PremiumSection>

      {/* SECTION 5 — LEARNING CALENDAR */}
      <LearningCalendar />

      {/* SECTION 6 — COMMAND CENTER SHORTCUTS */}
      <PremiumSection
        title="Intelligence Shortcuts"
        subtitle="Execute downstream career analysis"
        badge="Actions"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      {/* SECTION 7 — LIVE AI STATUS FOOTER */}
      <AIStatusBar status="active" confidence={96.8} lastUpdated="Just now" />
    </div>
  );
};

export default LearningRoadmapPage;
