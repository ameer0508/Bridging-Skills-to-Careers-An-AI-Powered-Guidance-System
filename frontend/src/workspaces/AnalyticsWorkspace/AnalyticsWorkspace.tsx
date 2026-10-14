import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/axios';
import { listFrom } from '../../lib/collections';
import type { RecommendationItem } from '../../types/telemetry';
import { useAuthStore } from '../../store/authStore';

// Feature Components
import {
  PeriodType,
  ProgressObservatoryHero,
  CurrentTrajectoryVector,
  MultiLayerTrajectoryObservatory,
  ProgressMomentsStream,
  EmpiricalInsightsObservatory,
  ProgressStoryActivationHub,
} from '../../features/analytics/components';

// Experience Systems & Design System 2.0 Components
import {
  AIStatusBar,
  WorkspaceDivider,
  PremiumErrorState,
} from '../../components/experience/workspace';

import {
  WorkspaceInsightsHub,
  MomentumScoreBreakdown,
  CareerHealthRadar,
  VelocityTrendsWidget,
  GrowthStoryPanel,
  PlateauCoachingCard,
  AIThinkingAnimation,
} from '../../components/experience';
import { IllustrativeNotice } from '../../components/common/IllustrativeNotice';

export const AnalyticsWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [period, setPeriod] = useState<PeriodType>('monthly');

  // Query 1: Analytics Endpoint
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics', period],
    queryFn: async () => {
      const response = await apiClient.get(`/analytics?period=${period}`);
      return response.data.data;
    },
  });

  // Query 2: Career Matches
  const { data: matchesData } = useQuery({
    // The bare list is cached under its own key: ['careers', 'matches'] holds { matches }
    queryKey: ['careers', 'matches', 'list'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
    },
  });

  // Query 3: Career Readiness
  const { data: readinessData } = useQuery({
    // The bare list is cached under its own key: ['readiness'] holds { readiness }
    queryKey: ['readiness', 'list'],
    queryFn: async () => {
      const response = await apiClient.get('/readiness');
      return response.data.data.readiness || [];
    },
  });

  // Query 4: Skills
  const { data: skillsData } = useQuery({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
  });

  // Query 5: Recommendations
  const { data: recommendationsData } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await apiClient.get('/recommendations');
      return response.data.data.recommendations || [];
    },
  });

  // Query 6: User Active Resume
  const { data: resumeData } = useQuery({
    queryKey: ['activeResume'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/resumes/me');
        return response.data.data.resume;
      } catch {
        return null;
      }
    },
  });

  const matches = useMemo(() => matchesData || [], [matchesData]);
  const readiness = useMemo(() => readinessData || [], [readinessData]);
  const recommendations = useMemo(() => listFrom<RecommendationItem>(recommendationsData, 'recommendations'), [recommendationsData]);

  // Active Roadmap Query
  const activeCareerId = matches[0]?.careerId?._id;
  const { data: roadmapData } = useQuery({
    queryKey: ['roadmap', activeCareerId],
    queryFn: async () => {
      if (!activeCareerId) return null;
      const response = await apiClient.get(`/roadmap/${activeCareerId}`);
      return response.data.data.roadmap;
    },
    enabled: !!activeCareerId,
  });

  // Core Capability & Context Derivations
  const totalSkills =
    skillsData?.totalSkills ??
    (Array.isArray(skillsData?.skills) ? skillsData.skills.length : 0);

  const topReadiness = readiness[0] || null;
  const topMatch = matches[0] || null;
  const targetRoleTitle =
    topMatch?.careerId?.title || topReadiness?.careerTitle || 'Target Career Role';

  const overallReadiness =
    topReadiness?.overallScore ??
    analyticsData?.currentMetrics?.averageReadinessScore ??
    0;

  const roadmapProgress = roadmapData?.progressPercentage || 0;

  // Normalized Current Metrics & Trends from authentic backend
  const currentMetrics = useMemo(() => {
    return (
      analyticsData?.currentMetrics || {
        totalSkills: totalSkills,
        averageReadinessScore: overallReadiness,
        totalGaps: 0,
        completedRecommendations: 0,
        completedRoadmapItems: 0,
      }
    );
  }, [analyticsData, totalSkills, overallReadiness]);

  const trends = useMemo(() => {
    return (
      analyticsData?.trends || {
        readinessGrowth: 0,
        skillsAdded: 0,
        gapsClosed: 0,
        itemsCompleted: 0,
      }
    );
  }, [analyticsData]);

  const historicalSnapshots = analyticsData?.historicalSnapshots || [];
  const insights = analyticsData?.insights || [];
  const recentEvents = analyticsData?.recentEvents || [];

  // Aggregate Workspace Insights via authentic Momentum Engine
  const workspaceInsights = useMemo(() => {
    return WorkspaceInsightsHub.getWorkspaceInsights(
      user?.fullName || 'User',
      matches,
      readiness,
      totalSkills,
      recommendations,
      roadmapData || null
    );
  }, [user, matches, readiness, totalSkills, recommendations, roadmapData]);

  const { momentum } = workspaceInsights;

  if (analyticsLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-16 rounded-3xl border border-aurora-line bg-aurora-canvas/60 flex flex-col items-center justify-center space-y-4 min-h-[320px]">
          <AIThinkingAnimation statusText="Connecting to Career Progress Observatory & Telemetry Vectors..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Progress analytics could not be loaded"
          message={(error as Error).message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4">
      <IllustrativeNotice kind="heuristic">
        Readiness, skills and roadmap totals on this page come from your stored data. Momentum, velocity,
        health and forecast figures are rough estimates calculated in your browser from those totals; they
        are not measured trends or predictions.
      </IllustrativeNotice>
      {/* 1. PROGRESS OBSERVATORY HERO */}
      <ProgressObservatoryHero
        userName={user?.fullName || user?.email?.split('@')[0]}
        targetRoleTitle={targetRoleTitle}
        period={period}
        onPeriodChange={setPeriod}
        snapshotCount={historicalSnapshots.length}
        overallReadiness={overallReadiness}
        readinessGrowth={trends.readinessGrowth}
        totalSkills={totalSkills}
      />

      {/* 2. CURRENT TRAJECTORY VECTOR (AUTHENTIC TELEMETRY HUD) */}
      <CurrentTrajectoryVector
        currentMetrics={currentMetrics}
        trends={trends}
        periodName={period}
        roadmapProgress={roadmapProgress}
      />

      {/* 3. MULTI-LAYER TRAJECTORY OBSERVATORY (HERO VISUALIZATION) */}
      <MultiLayerTrajectoryObservatory
        snapshots={historicalSnapshots}
        targetRoleTitle={targetRoleTitle}
        periodName={period}
        activeReadiness={overallReadiness}
        activeSkills={totalSkills}
        activeRoadmapItems={currentMetrics.completedRoadmapItems}
      />

      {/* 4. TEMPORAL CORRELATION: MOMENTS VS EMPIRICAL INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Moments That Moved Your Profile (Events Stream) */}
        <div className="lg:col-span-7">
          <ProgressMomentsStream events={recentEvents} />
        </div>

        {/* Right: What The Data Is Telling You (Empirical Insights) */}
        <div className="lg:col-span-5 space-y-6">
          <EmpiricalInsightsObservatory
            insights={insights}
            targetRoleTitle={targetRoleTitle}
            snapshotCount={historicalSnapshots.length}
          />

          <VelocityTrendsWidget
            velocity={momentum.velocity}
            trend={momentum.trend}
          />
        </div>
      </div>

      {/* 5. MOMENTUM TELEMETRY & GROWTH STORY */}
      <WorkspaceDivider label="Momentum Telemetry & Trajectory Analysis" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <MomentumScoreBreakdown momentumScoreData={momentum.momentumScore} />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <CareerHealthRadar careerHealthData={momentum.careerHealth} />
        </div>
      </div>

      <GrowthStoryPanel growthStory={momentum.growthStory} />

      {momentum.plateau.isPlateauDetected && (
        <PlateauCoachingCard
          plateau={momentum.plateau}
          onTakeAction={() => navigate('/roadmap')}
        />
      )}

      {/* 6. PROGRESS STORY ACTIVATION HUB */}
      <ProgressStoryActivationHub
        hasResume={!!resumeData}
        totalSkills={totalSkills}
        hasTargetRole={!!topMatch}
        targetRoleTitle={targetRoleTitle}
        roadmapProgress={roadmapProgress}
        hasRoadmap={!!roadmapData}
      />

      {/* 7. AI TELEMETRY STATUS BAR */}
      <AIStatusBar
        status={analyticsLoading ? 'thinking' : 'active'}
        provider="Your progress records"
      />
    </div>
  );
};

AnalyticsWorkspace.displayName = 'AnalyticsWorkspace';
export default AnalyticsWorkspace;
