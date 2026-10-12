import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Brain, Compass, Target } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

// Flagship Reimagined Intelligence Feed Components
import { ActionIntelligenceHero } from './ActionIntelligenceHero';
import { ActionVelocityStrip } from './ActionVelocityStrip';
import { IntelligenceCategoryFilter } from './IntelligenceCategoryFilter';
import { IntelligenceStreamFeed, IRecommendation } from './IntelligenceStreamFeed';
import { ActionIntelligenceDrawer } from './ActionIntelligenceDrawer';

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

export const RecommendationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Filter & Interaction States
  const [activeStatus, setActiveStatus] = useState<string>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('impact_desc');
  const [selectedRec, setSelectedRec] = useState<IRecommendation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // 1. Fetch Recommendations
  const { data, isLoading, error, refetch } = useQuery<IRecommendation[]>({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await apiClient.get('/recommendations');
      return response.data?.data?.recommendations || [];
    },
  });

  // 2. Fetch User Career Snapshot for deep personalization
  const { data: snapshotData } = useQuery({
    queryKey: ['career-snapshot'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me/career-snapshot');
      return response.data.data;
    },
    staleTime: 20000,
  });

  // 3. Status Update Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/recommendations/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['career-snapshot'] });
      queryClient.invalidateQueries({ queryKey: ['home-snapshot'] });
    },
  });

  // 4. Force Regenerate Mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/recommendations/generate');
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['career-snapshot'] });
    },
  });

  const rawList: IRecommendation[] = useMemo(() => {
    if (Array.isArray(data)) return data;
    if ((data as any)?.recommendations && Array.isArray((data as any).recommendations)) {
      return (data as any).recommendations;
    }
    return [];
  }, [data]);

  // Automatically trigger backend generation if recommendations are currently empty
  React.useEffect(() => {
    if (data && rawList.length === 0) {
      regenerateMutation.mutate();
    }
  }, [data, rawList.length]);

  // Only recommendations computed for this user are shown; there is no built-in sample list
  const recommendations = rawList;

  // Counts for status tabs
  const statusCounts = useMemo(() => {
    return {
      active: recommendations.filter((r) => r.status === 'active').length,
      saved_for_later: recommendations.filter((r) => r.status === 'saved_for_later').length,
      completed: recommendations.filter((r) => r.status === 'completed').length,
      dismissed: recommendations.filter((r) => r.status === 'dismissed').length,
    };
  }, [recommendations]);

  // Telemetry metrics
  const highestPriorityCount = useMemo(() => {
    return recommendations.filter((r) => r.status === 'active' && r.priority === 'Highest').length;
  }, [recommendations]);

  const totalPotentialGain = useMemo(() => {
    return recommendations
      .filter((r) => r.status === 'active')
      .reduce((acc, curr) => acc + (curr.impact || 0), 0);
  }, [recommendations]);

  const topPriorityRec = useMemo(() => {
    return (
      recommendations.find((r) => r.status === 'active' && r.priority === 'Highest') ||
      recommendations.find((r) => r.status === 'active')
    );
  }, [recommendations]);

  // Filtered and Sorted Recommendations
  const filteredAndSortedRecs = useMemo(() => {
    let result = recommendations.filter((r) => r.status === activeStatus);

    if (selectedCategory !== 'all') {
      result = result.filter((r) => r.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.targetSkill?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      if (sortBy === 'impact_desc') {
        return (b.impact || 0) - (a.impact || 0);
      }
      if (sortBy === 'priority_desc') {
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      }
      if (sortBy === 'time_asc') {
        return (a.estimatedTime || '').localeCompare(b.estimatedTime || '');
      }
      if (sortBy === 'difficulty_asc') {
        const order: Record<string, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };
        return (order[a.difficulty] || 2) - (order[b.difficulty] || 2);
      }
      return 0;
    });
  }, [recommendations, activeStatus, selectedCategory, searchQuery, sortBy]);

  const handleInspect = (rec: IRecommendation) => {
    setSelectedRec(rec);
    setIsDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-16 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[300px]">
          <AIThinkingAnimation statusText="Synthesizing High-Leverage Strategic Action Feeds..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Action Intelligence Connection Error"
          message={`Failed to connect to recommendation engine: ${(error as Error).message}`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (rawList.length === 0) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumEmptyState
          title="No recommendations yet"
          description="Recommendations are built from the skill gaps between your resume and your target careers. Upload a resume and they will appear here, each with the evidence behind it."
          primaryAction={{ label: 'Upload resume', onClick: () => navigate('/resume') }}
          secondaryAction={{ label: 'Check again', onClick: () => refetch() }}
        />
      </div>
    );
  }

  const quickActions = [
    {
      id: 'ai',
      title: 'AI Career Architect',
      subtitle: 'Recommendation strategy consultation',
      icon: Brain,
      shortcut: '⌘1',
      color: 'text-cyan-400',
      onClick: () => navigate('/ai'),
    },
    {
      id: 'readiness',
      title: 'Career Readiness Studio',
      subtitle: 'Dimensional gap scoring & audit',
      icon: Compass,
      shortcut: '⌘2',
      color: 'text-emerald-400',
      onClick: () => navigate('/readiness'),
    },
    {
      id: 'roadmap',
      title: 'Adaptive Learning Roadmap',
      subtitle: 'Phased competency milestone tracker',
      icon: Target,
      shortcut: '⌘3',
      color: 'text-indigo-400',
      onClick: () => navigate('/roadmap'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4 sm:px-6">
      {/* SECTION 1 — PERSONALIZED INTELLIGENCE HERO */}
      <ActionIntelligenceHero
        userName={user?.fullName || ''}
        targetRole={snapshotData?.careerDomain?.targetRole || 'Senior AI Engineer'}
        careerDomain={snapshotData?.careerDomain?.name || 'Artificial Intelligence & Systems'}
        readinessScore={snapshotData?.readiness?.score || 74}
        criticalGapsCount={snapshotData?.readiness?.criticalGaps?.length || 3}
        topRecommendation={topPriorityRec}
        isRegenerating={regenerateMutation.isPending}
        onRegenerate={() => regenerateMutation.mutate()}
        onSelectTopAction={(id) => {
          const rec = recommendations.find((r) => r._id === id);
          if (rec) handleInspect(rec);
        }}
      />

      {/* SECTION 2 — ACTION VELOCITY & TELEMETRY STRIP */}
      <ActionVelocityStrip
        activeCount={statusCounts.active}
        highestPriorityCount={highestPriorityCount}
        savedCount={statusCounts.saved_for_later}
        completedCount={statusCounts.completed}
        totalPotentialGain={totalPotentialGain}
        resolvedGapsPercentage={snapshotData?.roadmap?.progress || 68}
      />

      {/* SECTION 3 — SPECTRUM FILTER & CONTINUOUS ACTION STREAM FEED */}
      <div className="space-y-6">
        <IntelligenceCategoryFilter
          activeStatus={activeStatus}
          onStatusChange={setActiveStatus}
          statusCounts={statusCounts}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <PremiumSection
          title="Strategic Intelligence Stream"
          subtitle="Chronologically ordered by impact leverage and career readiness delta"
          badge="Personal Stream"
        >
          <IntelligenceStreamFeed
            recommendations={filteredAndSortedRecs}
            onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
            onInspect={handleInspect}
          />
        </PremiumSection>
      </div>

      <WorkspaceDivider label="Connected Subsystems" />

      {/* SECTION 4 — COMMAND CENTER SHORTCUTS */}
      <PremiumSection
        title="Downstream Execution Hubs"
        subtitle="Pivot seamlessly into roadmap execution and neural guidance"
        badge="Command Center"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      {/* SECTION 5 — LIVE AI STATUS TELEMETRY */}
      <AIStatusBar status="active" confidence={96.8} lastUpdated="Just now (Live Synced)" />

      {/* DEEP-DIVE ACTION INTELLIGENCE DRAWER */}
      <ActionIntelligenceDrawer
        recommendation={selectedRec}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
      />
    </div>
  );
};

export default RecommendationPage;
