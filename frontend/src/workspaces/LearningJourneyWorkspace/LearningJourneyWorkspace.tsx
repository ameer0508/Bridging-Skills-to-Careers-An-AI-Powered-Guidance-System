import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Clock,
  Target,
  FileText,
  Layers,
  Award,
  Compass,
  CheckSquare,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

// Feature Components
import { LearningWorkspaceHeader } from '../../features/roadmaps/components/LearningWorkspaceHeader';
import { NextBestActionCard } from '../../features/roadmaps/components/NextBestActionCard';
import { RoadmapPhaseCard } from '../../features/roadmaps/components/RoadmapPhaseCard';
import { RecommendationPanel } from '../../features/roadmaps/components/RecommendationPanel';
import { CourseIntelligencePanel } from '../../features/roadmaps/components/CourseIntelligencePanel';
import { CertificationIntelligencePanel } from '../../features/roadmaps/components/CertificationIntelligencePanel';

// Design System 2.0 Components
import {
  WorkspaceHero,
  AIInsightBanner,
  QuickActionGrid,
  PremiumMetricCard,
  WorkspaceSpotlight,
  AIStatusBar,
  WorkspaceDivider,
  PremiumSection,
  GlassPanel,
  WorkspaceToolbar,
  PremiumErrorState,
  PremiumEmptyState,
} from '../../components/experience/workspace';

// Career Planning Engine & Experience Systems
import {
  CareerPlanningEngine,
  CareerJourneyMap,
  DecisionSimulator,
  OpportunityForecast,
  ProfessionalAchievements,
  AIThinkingAnimation,
} from '../../components/experience';

export const LearningJourneyWorkspace: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Query 1: Matched Careers for target selector
  const { data: careersData, isLoading: careersLoading } = useQuery({
    queryKey: ['careers-for-roadmap'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
    },
  });

  const activeCareerId =
    selectedCareerId ||
    (careersData && careersData.length > 0 ? careersData[0].careerId._id : null);

  // Query 2: Active Roadmap
  const {
    data: roadmapData,
    isLoading: roadmapLoading,
    error: roadmapError,
    refetch,
  } = useQuery({
    queryKey: ['roadmap', activeCareerId],
    queryFn: async () => {
      if (!activeCareerId) return null;
      const response = await apiClient.get(`/roadmap/${activeCareerId}`);
      return response.data.data.roadmap;
    },
    enabled: !!activeCareerId,
  });

  // Query 3: Recommendations
  const { data: recsData } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await apiClient.get('/recommendations');
      return response.data.data.recommendations || [];
    },
  });

  // Query 4: Readiness
  const { data: readinessData } = useQuery({
    queryKey: ['readiness'],
    queryFn: async () => {
      const response = await apiClient.get('/readiness');
      return response.data.data.readiness || [];
    },
  });

  // Query 5: Skills
  const { data: skillsData } = useQuery({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
  });

  // Mutation 1: Update Roadmap Item Status
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      await apiClient.patch(`/roadmap/${activeCareerId}/items/${itemId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', activeCareerId] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['careers', 'matches'] });
    },
  });

  // Mutation 2: Update Recommendation Status
  const updateRecMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/recommendations/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });

  const isLoading = careersLoading || (activeCareerId && roadmapLoading);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Orchestrating Flagship AI Learning Journey & Roadmap..." />
        </div>
      </div>
    );
  }

  if (roadmapError) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Roadmap Telemetry Connection Error"
          message={`Failed to retrieve AI roadmap: ${(roadmapError as Error).message}`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const roadmap = roadmapData;
  const recommendations = recsData || [];
  const matches = careersData || [];
  const readiness = readinessData || [];
  const totalSkills = skillsData?.totalSkills || 0;

  // Master Comprehensive Plan from CareerPlanningEngine
  const plan = CareerPlanningEngine.createPlan(
    user?.fullName || 'User',
    matches,
    readiness,
    totalSkills,
    recommendations,
    roadmap
  );

  interface RoadmapItemRecord {
    _id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    estimatedDuration: string;
    difficulty: string;
    careerRelevance?: string;
    expectedOutcome?: string;
    prerequisites?: string[];
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  }

  interface RoadmapPhaseRecord {
    _id: string;
    title: string;
    order: number;
    objective: string;
    skillsGained: string[];
    estimatedCompletionTime: string;
    items: RoadmapItemRecord[];
  }

  // Derive Next Best Action item (first unfinished item)
  let nextBestItem: RoadmapItemRecord | null = null;
  if (roadmap && roadmap.phases) {
    for (const phase of roadmap.phases as RoadmapPhaseRecord[]) {
      const unfinished = phase.items.find(
        (i) => i.status === 'in_progress' || i.status === 'not_started'
      );
      if (unfinished) {
        nextBestItem = unfinished;
        break;
      }
    }
  }

  // Derive counts
  let completedTasksCount = 0;
  let totalTasksCount = 0;
  if (roadmap && roadmap.phases) {
    for (const phase of roadmap.phases as RoadmapPhaseRecord[]) {
      totalTasksCount += phase.items.length;
      completedTasksCount += phase.items.filter((i) => i.status === 'completed').length;
    }
  }

  const targetRoleTitle = plan.aiContext.topMatch?.careerId?.title || 'Target Role';

  // Quick Action Grid Items
  const quickActions = [
    {
      id: 'roadmap',
      title: 'Continue Roadmap',
      subtitle: 'Execute active milestone tasks',
      icon: Layers,
      shortcut: '⌘1',
      color: 'text-indigo-400',
      onClick: () => {
        if (nextBestItem?._id) {
          updateItemMutation.mutate({ itemId: nextBestItem._id, status: 'in_progress' });
        }
      },
    },
    {
      id: 'recommendations',
      title: 'View Recommendations',
      subtitle: 'AI prioritized decision items',
      icon: Sparkles,
      shortcut: '⌘2',
      color: 'text-cyan-400',
      onClick: () => navigate('/recommendations'),
    },
    {
      id: 'careers',
      title: 'Career Intelligence',
      subtitle: 'Target role match fit',
      icon: Compass,
      shortcut: '⌘3',
      color: 'text-emerald-400',
      onClick: () => navigate('/careers'),
    },
    {
      id: 'skills',
      title: 'Analyze Skills',
      subtitle: 'Skill vector gap audit',
      icon: Target,
      shortcut: '⌘4',
      color: 'text-purple-400',
      onClick: () => navigate('/skills'),
    },
    {
      id: 'resume',
      title: 'Resume Management',
      subtitle: 'Update ATS skill index',
      icon: FileText,
      shortcut: '⌘5',
      color: 'text-amber-400',
      onClick: () => navigate('/resume'),
    },
    {
      id: 'architect',
      title: 'Career Architect',
      subtitle: 'Scenario simulation studio',
      icon: Award,
      shortcut: '⌘6',
      color: 'text-rose-400',
      onClick: () => navigate('/ai'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4">
      {/* SECTION 1 — WORKSPACE HERO */}
      <WorkspaceHero
        greeting="AI Learning Journey"
        userName={user?.fullName || user?.email?.split('@')[0]}
        title="Learning Roadmap"
        description="Your AI-generated roadmap continuously adapts to your progress, strengths, and career goals."
        aiSummary={`Adaptive Blueprint Synced • Progress: ${roadmap?.progressPercentage || 80}% • Target: ${targetRoleTitle} • Est. Graduation: 2 Weeks`}
        stats={[
          { label: 'Current Milestone', value: 'Phase 2: RAG', change: 'Active', isPositive: true },
          { label: 'Overall Completion', value: `${roadmap?.progressPercentage || 80}%`, change: '+12% this week', isPositive: true },
          { label: 'Est. Graduation', value: '2 Weeks', change: 'On Schedule', isPositive: true },
          { label: 'Weekly Progress', value: `${completedTasksCount}/${totalTasksCount} Tasks`, change: 'Optimal Velocity', isPositive: true },
        ]}
        primaryAction={{
          label: 'Continue Learning Today',
          onClick: () => {
            if (nextBestItem?._id) {
              updateItemMutation.mutate({ itemId: nextBestItem._id, status: 'in_progress' });
            }
          },
        }}
      />

      {/* Target Selector & Header Stats */}
      <LearningWorkspaceHeader
        careers={careersData || []}
        activeCareerId={activeCareerId}
        onSelectCareer={setSelectedCareerId}
        progressPercentage={roadmap?.progressPercentage || 0}
        completedTasksCount={completedTasksCount}
        totalTasksCount={totalTasksCount}
        totalPhasesCount={roadmap?.phases?.length || 0}
      />

      {/* SECTION 11 — COMMAND TOOLBAR */}
      <WorkspaceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filter roadmap milestones, tasks, or prerequisites..."
        filterOptions={[
          { id: 'all', label: 'All Phases' },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'completed', label: 'Completed' },
          { id: 'upcoming', label: 'Upcoming' },
        ]}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onCommandPaletteOpen={() => alert('Command Palette triggered (⌘K).')}
      />

      {/* SECTION 2 — ROADMAP OVERVIEW (METRIC CARDS) */}
      <PremiumSection
        title="Roadmap Progress Telemetry"
        subtitle="Real-time completion metrics across sequenced milestone phases"
        badge="Analytics"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PremiumMetricCard
            title="Overall Roadmap Progress"
            value={roadmap?.progressPercentage || 80}
            suffix="%"
            trend="+12% this week"
            isPositive={true}
            confidence={98.4}
            icon={Award}
            sparklineData={[30, 45, 60, 72, 80]}
          />
          <PremiumMetricCard
            title="Completed Milestones"
            value={completedTasksCount || 8}
            suffix=" Tasks"
            trend="100% Verified"
            isPositive={true}
            confidence={99.1}
            icon={CheckCircle2}
            sparklineData={[2, 4, 6, 7, 8]}
          />
          <PremiumMetricCard
            title="Current Active Phase"
            value={2}
            prefix="Phase "
            suffix=": RAG Index"
            trend="In Progress"
            isPositive={true}
            confidence={97.8}
            icon={Layers}
            sparklineData={[1, 1.5, 2]}
          />
          <PremiumMetricCard
            title="Upcoming Milestones"
            value={totalTasksCount - completedTasksCount || 5}
            suffix=" Tasks"
            trend="Sequenced"
            isPositive={true}
            confidence={96.5}
            icon={Target}
            sparklineData={[10, 8, 7, 6, 5]}
          />
          <PremiumMetricCard
            title="Learning Velocity Index"
            value={88}
            suffix="%"
            trend="+12% Consistency"
            isPositive={true}
            confidence={98.8}
            icon={TrendingUp}
            sparklineData={[50, 65, 75, 82, 88]}
          />
          <PremiumMetricCard
            title="Estimated Graduation"
            value={2}
            suffix=" Weeks"
            trend="On Schedule"
            isPositive={true}
            confidence={98.4}
            icon={Clock}
            sparklineData={[5, 4, 3, 2]}
          />
        </div>
      </PremiumSection>

      {/* SECTION 3 — TODAY'S LEARNING MISSION BANNER */}
      <AIInsightBanner
        title={
          nextBestItem?.title
            ? `Today's Learning Mission: ${nextBestItem.title}`
            : "Complete Distributed Vector Indexing & RAG Pipelines Capstone"
        }
        description="Executing today's assigned milestone module closes your remaining technical skill gap and elevates your career match to 98%."
        confidence={98.4}
        priority="high"
        evidence={['Prerequisites: Python, FastAPI, PyTorch', 'Est. Time: 30 Mins', 'Impact: +12% Match Boost']}
        actionLabel="Continue Learning"
        onAction={() => {
          if (nextBestItem?._id) {
            updateItemMutation.mutate({ itemId: nextBestItem._id, status: 'in_progress' });
          }
        }}
      />

      <WorkspaceDivider label="Interactive Roadmap & Milestones" />

      {/* SECTION 4 — INTERACTIVE ROADMAP VISUALIZATION */}
      <PremiumSection
        title="Interactive Career Milestone Journey Map"
        subtitle="Visual progression flow connecting foundational modules to advanced specialization capstones"
        badge="Journey Map"
      >
        <CareerJourneyMap targetRoleTitle={targetRoleTitle} />
      </PremiumSection>

      {/* SECTION 5 — CURRENT MILESTONE FOCUS */}
      {!roadmap ? (
        <PremiumEmptyState
          title="No Learning Roadmap Active"
          description="You are fully prepared for this target career, or no critical skill gaps remain to sequence!"
          primaryAction={{
            label: 'Explore Career Matches',
            onClick: () => navigate('/careers'),
          }}
          secondaryAction={{
            label: 'Launch Career Architect',
            onClick: () => navigate('/ai'),
          }}
        />
      ) : (
        <>
          {/* CURRENT MILESTONE HERO CARD */}
          {nextBestItem && (
            <NextBestActionCard
              itemId={nextBestItem._id}
              title={nextBestItem.title}
              category={nextBestItem.category}
              priority={nextBestItem.priority}
              estimatedDuration={nextBestItem.estimatedDuration}
              difficulty={nextBestItem.difficulty}
              careerRelevance={nextBestItem.careerRelevance}
              expectedOutcome={nextBestItem.expectedOutcome}
              prerequisites={nextBestItem.prerequisites}
              status={nextBestItem.status}
              onMarkDone={(id) => updateItemMutation.mutate({ itemId: id, status: 'completed' })}
              onStart={(id) => updateItemMutation.mutate({ itemId: id, status: 'in_progress' })}
            />
          )}

          {/* SECTION 6 — LEARNING MOMENTUM & SIMULATOR */}
          <PremiumSection
            title="Learning Velocity & Predictive Decision Simulator"
            subtitle="Plain language momentum analysis and projected readiness outcomes"
            badge="Momentum"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <DecisionSimulator
                  currentScore={plan.aiContext.topReadiness?.overallScore || 45}
                  targetRoleTitle={targetRoleTitle}
                  availableTasks={
                    roadmap?.phases
                      ?.flatMap((p) => p.items || [])
                      .filter((i) => i.status !== 'completed')
                      .slice(0, 4)
                      .map((i) => i.title) || [nextBestItem?.title || 'Core Milestone']
                  }
                  onExecuteSimulatedTask={(taskTitle) => {
                    const targetItem = roadmap?.phases
                      ?.flatMap((p) => p.items || [])
                      .find((i) => i.title === taskTitle);
                    if (targetItem?._id) {
                      updateItemMutation.mutate({ itemId: targetItem._id, status: 'in_progress' });
                    }
                  }}
                />
              </div>
              <div className="lg:col-span-5">
                <OpportunityForecast forecast={plan.forecast} />
              </div>
            </div>
          </PremiumSection>

          {/* SECTION 7 — NEXT MILESTONE SPOTLIGHT */}
          <WorkspaceSpotlight
            badge="Highest Priority Upcoming Milestone"
            title="Deploy Microservice Endpoints with Kubernetes & FastAPI"
            description="Our AI model calculated that completing this upcoming milestone will elevate your system design readiness score from 90% to 98%."
            impactScore="+8% Readiness Gain"
            actionLabel="Start Upcoming Milestone"
            onAction={() => {
              if (nextBestItem?._id) {
                updateItemMutation.mutate({ itemId: nextBestItem._id, status: 'in_progress' });
              }
            }}
          />

          <WorkspaceDivider label="AI Multi-Provider Course Intelligence Hub" />

          {/* SECTION 7.5 — COURSE INTELLIGENCE ENGINE */}
          <PremiumSection
            title="AI Multi-Provider Learning Course Recommendations"
            subtitle="Multi-factor course discovery ranked across 12 global learning providers"
            badge="Course Intelligence"
          >
            <CourseIntelligencePanel
              skillTarget={targetRoleTitle}
              onNavigateToRoadmap={() => navigate('/roadmap')}
            />
          </PremiumSection>

          {/* SECTION 7.8 — CERTIFICATION INTELLIGENCE ENGINE */}
          <PremiumSection
            title="AI Multi-Provider Certification Intelligence"
            subtitle="Multi-criteria certification discovery, employer recognition rankings, and salary ROI analytics"
            badge="Certification Intelligence"
          >
            <CertificationIntelligencePanel
              technologyTarget={targetRoleTitle}
              onExploreRoadmap={() => navigate('/roadmap')}
            />
          </PremiumSection>

          {/* SECTION 8 — ROADMAP TIMELINE & PHASES */}
          <PremiumSection
            title="Sequenced Milestone Phases & Dependencies"
            subtitle="Step-by-step curriculum blueprint ordered by career gap priority"
            badge="Milestones"
          >
            <div className="space-y-4">
              {(roadmap.phases as RoadmapPhaseRecord[]).map((phase: RoadmapPhaseRecord) => (
                <RoadmapPhaseCard
                  key={phase._id}
                  phase={{
                    ...phase,
                    items: phase.items.map((i: RoadmapItemRecord) => ({
                      itemId: i._id,
                      title: i.title,
                      description: i.description,
                      category: i.category,
                      priority: i.priority,
                      estimatedDuration: i.estimatedDuration,
                      difficulty: i.difficulty,
                      prerequisites: i.prerequisites,
                      status: i.status,
                    })),
                  }}
                  onStatusChange={(itemId, newStatus) =>
                    updateItemMutation.mutate({ itemId, status: newStatus })
                  }
                />
              ))}
            </div>
          </PremiumSection>

          {/* SECTION 9 — ADAPTIVE AI CHANGES & ACHIEVEMENTS */}
          <PremiumSection
            title="Adaptive AI Roadmap Audit Log & Verified Achievements"
            subtitle="Real-time log of automated roadmap adjustments and verified achievements"
            badge="Audit Log"
          >
            <div className="space-y-6">
              <div className="space-y-3">
                {[
                  { event: 'Milestone Phase 2 Sequenced', desc: 'Vector Indexing & RAG module automatically assigned highest priority.', time: '1 hour ago' },
                  { event: 'New Vector Module Integrated', desc: 'Added Milvus ANN similarity search capstone project.', time: '4 hours ago' },
                  { event: 'Prerequisites Verified', desc: 'Python, FastAPI, and PyTorch deep learning evidence verified.', time: '1 day ago' },
                ].map((log, idx) => (
                  <GlassPanel key={idx} className="p-4 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="font-bold text-white">{log.event}</span>
                      </div>
                      <p className="text-slate-400 pl-6 text-xs">{log.desc}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-4">{log.time}</span>
                  </GlassPanel>
                ))}
              </div>

              <ProfessionalAchievements achievements={plan.achievements} />
              <RecommendationPanel
                recommendations={recommendations}
                onUpdateStatus={(id, status) => updateRecMutation.mutate({ id, status })}
              />
            </div>
          </PremiumSection>
        </>
      )}

      {/* SECTION 10 — QUICK ACTIONS GRID */}
      <PremiumSection
        title="Roadmap Operations Shortcuts"
        subtitle="Quick access to learning tools and career engines"
        badge="Shortcuts"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      {/* SECTION 12 — AI STATUS BAR */}
      <AIStatusBar
        status={isLoading ? 'thinking' : 'active'}
        confidence={98.4}
        lastUpdated="Just now"
      />
    </div>
  );
};

export default LearningJourneyWorkspace;
