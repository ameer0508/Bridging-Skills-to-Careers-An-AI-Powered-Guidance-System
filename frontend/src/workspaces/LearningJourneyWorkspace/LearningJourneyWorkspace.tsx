import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Target,
  FileText,
  Layers,
  Award,
  Compass,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

// Feature Components — Adaptive Career Learning Journey
import {
  AdaptiveCareerJourneyHeader,
  AdaptiveMilestoneSpine,
  ActivePhaseSpotlight,
  DependencyTreeEngine,
  TaskJourneyInspector,
  RoadmapActivationHub,
  RoadmapPhaseCard,
  CourseIntelligencePanel,
  CertificationIntelligencePanel,
} from '../../features/roadmaps/components';

import type {
  ActiveRoadmapItem,
  ActivePhaseData,
} from '../../features/roadmaps/components/ActivePhaseSpotlight';
import type { TaskInspectorData } from '../../features/roadmaps/components/TaskJourneyInspector';
import type { DependencyItem } from '../../features/roadmaps/components/DependencyTreeEngine';

// Design System 2.0 Components
import {
  QuickActionGrid,
  AIStatusBar,
  WorkspaceDivider,
  PremiumSection,
  PremiumErrorState,
} from '../../components/experience/workspace';

// Career Planning Engine & Experience Systems
import {
  CareerPlanningEngine,
  DecisionSimulator,
  OpportunityForecast,
  AIThinkingAnimation,
} from '../../components/experience';
import { IllustrativeNotice } from '../../components/common/IllustrativeNotice';
import { StudyPlanPanel } from '../../features/roadmaps/components/StudyPlan';
import { PracticeProjectsPanel } from '../../features/roadmaps/components/PracticeProjects';
import { FreeResourcesPanel } from '../../features/roadmaps/components/FreeResources';

/** A roadmap phase and its items as returned by GET /roadmap/:careerId. */
interface ApiRoadmapItem extends Partial<Omit<ActiveRoadmapItem, 'title'>> {
  _id: string;
  title: string;
}
interface ApiRoadmapPhase {
  _id?: string;
  order: number;
  title: string;
  objective?: string;
  skillsGained?: string[];
  estimatedCompletionTime?: string;
  items?: ApiRoadmapItem[];
}

export const LearningJourneyWorkspace: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);
  const [selectedPhaseOrder, setSelectedPhaseOrder] = useState<number | null>(null);

  // Inspector State
  const [inspectingTask, setInspectingTask] = useState<TaskInspectorData | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ['careers-for-roadmap'] });
    },
  });

  // Mutation 2: Regenerate Roadmap (Adaptive sync with AI engine)
  const regenerateRoadmapMutation = useMutation({
    mutationFn: async () => {
      if (!activeCareerId) return;
      const response = await apiClient.post(`/roadmap/${activeCareerId}/regenerate`);
      return response.data.data.roadmap;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', activeCareerId] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['careers-for-roadmap'] });
    },
  });

  const isLoading = careersLoading || (activeCareerId && roadmapLoading);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[280px]">
          <AIThinkingAnimation statusText="Orchestrating Adaptive Career Learning Journey & Sequenced Dependencies..." />
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

  // Derive target role title from matches or plan
  const matchedCareer = matches.find((m: { careerId?: { _id?: string } }) => m.careerId?._id === activeCareerId);
  const targetRoleTitle =
    matchedCareer?.careerId?.title || plan.aiContext.topMatch?.careerId?.title || null;

  // Process phases
  const phases: ActivePhaseData[] = ((roadmap?.phases || []) as ApiRoadmapPhase[]).map((phase) => ({
    _id: phase._id || `phase-${phase.order}`,
    order: phase.order,
    title: phase.title,
    objective: phase.objective,
    skillsGained: phase.skillsGained || [],
    estimatedCompletionTime: phase.estimatedCompletionTime || '',
    items: (phase.items || []).map((i) => ({
      _id: i._id,
      itemId: i._id,
      title: i.title,
      description: i.description || '',
      category: i.category || 'Skill Task',
      priority: i.priority || 'Medium',
      estimatedDuration: i.estimatedDuration || 'Self-paced',
      difficulty: i.difficulty || 'Intermediate',
      prerequisites: i.prerequisites || [],
      careerRelevance: i.careerRelevance || '',
      expectedOutcome: i.expectedOutcome || '',
      status: i.status || 'not_started',
      targetSkill: i.targetSkill || '',
    })),
  }));

  // Counts & Progress
  let completedTasksCount = 0;
  let totalTasksCount = 0;
  phases.forEach((p) => {
    totalTasksCount += p.items.length;
    completedTasksCount += p.items.filter((i) => i.status === 'completed' || i.status === 'skipped').length;
  });

  const progressPercentage =
    roadmap?.progressPercentage !== undefined
      ? roadmap.progressPercentage
      : totalTasksCount > 0
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0;

  // Find active phase
  const activePhase =
    phases.find((p) => p.items.some((i) => i.status !== 'completed' && i.status !== 'skipped')) ||
    phases[0];

  // Currently focused phase for details (defaults to selectedPhaseOrder or activePhase)
  const focusedPhase =
    (selectedPhaseOrder !== null && phases.find((p) => p.order === selectedPhaseOrder)) ||
    activePhase;

  // Find Next Best Action (first unfinished item)
  let nextBestItem: ActiveRoadmapItem | null = null;
  for (const phase of phases) {
    const unfinished = phase.items.find((i) => i.status === 'in_progress' || i.status === 'not_started');
    if (unfinished) {
      nextBestItem = unfinished;
      break;
    }
  }

  // Dependency items for DependencyTreeEngine
  const dependencyItems: DependencyItem[] = phases.flatMap((phase) =>
    phase.items.map((i) => ({
      id: i._id || i.itemId || '',
      title: i.title,
      targetSkill: i.targetSkill,
      prerequisites: i.prerequisites,
      status: i.status,
      phaseOrder: phase.order,
      category: i.category,
      estimatedDuration: i.estimatedDuration,
      careerRelevance: i.careerRelevance,
    }))
  );

  const handleInspectTask = (item: ActiveRoadmapItem) => {
    setInspectingTask(item);
    setIsInspectorOpen(true);
  };

  const handleStatusChange = (itemId: string, status: string) => {
    updateItemMutation.mutate({ itemId, status });
    if (inspectingTask && (inspectingTask._id === itemId || inspectingTask.itemId === itemId)) {
      setInspectingTask({
        ...inspectingTask,
        status: status as ActiveRoadmapItem['status'],
      });
    }
  };

  // Quick Action Grid Items
  const quickActions = [
    {
      id: 'roadmap',
      title: 'Continue Active Milestone',
      subtitle: 'Advance next learning task',
      icon: Layers,
      shortcut: '⌘1',
      color: 'text-indigo-400',
      onClick: () => {
        if (nextBestItem?._id) {
          handleStatusChange(nextBestItem._id, 'in_progress');
        }
      },
    },
    {
      id: 'recommendations',
      title: 'Action Intelligence',
      subtitle: 'AI prioritized decision items',
      icon: Sparkles,
      shortcut: '⌘2',
      color: 'text-cyan-400',
      onClick: () => navigate('/recommendations'),
    },
    {
      id: 'careers',
      title: 'Career Intelligence',
      subtitle: 'Role match alignment',
      icon: Compass,
      shortcut: '⌘3',
      color: 'text-emerald-400',
      onClick: () => navigate('/careers'),
    },
    {
      id: 'readiness',
      title: 'Career Readiness Diagnostic',
      subtitle: 'Dimensional gap scoring',
      icon: Target,
      shortcut: '⌘4',
      color: 'text-purple-400',
      onClick: () => navigate('/readiness'),
    },
    {
      id: 'resume',
      title: 'Resume Evidence Studio',
      subtitle: 'Update verified skills',
      icon: FileText,
      shortcut: '⌘5',
      color: 'text-amber-400',
      onClick: () => navigate('/resume'),
    },
    {
      id: 'architect',
      title: 'AI Career Architect',
      subtitle: 'Strategic scenario planning',
      icon: Award,
      shortcut: '⌘6',
      color: 'text-rose-400',
      onClick: () => navigate('/ai'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4">
      {/* SECTION 1 — ADAPTIVE CAREER JOURNEY HERO */}
      <AdaptiveCareerJourneyHeader
        userName={user?.fullName || user?.email?.split('@')[0]}
        targetRoleTitle={targetRoleTitle}
        careers={careersData || []}
        activeCareerId={activeCareerId}
        onSelectCareer={setSelectedCareerId}
        activePhaseTitle={activePhase?.title}
        activePhaseOrder={activePhase?.order}
        totalPhasesCount={phases.length}
        progressPercentage={progressPercentage}
        completedTasksCount={completedTasksCount}
        totalTasksCount={totalTasksCount}
        nextBestItem={nextBestItem?._id ? { ...nextBestItem, _id: nextBestItem._id } : null}
        onStartNextTask={(id) => handleStatusChange(id, 'in_progress')}
        onRegenerateRoadmap={() => regenerateRoadmapMutation.mutate()}
        isRegenerating={regenerateRoadmapMutation.isPending}
        lastUpdated={roadmap?.updatedAt}
      />

      {/* If No Roadmap exists or 0 phases, render the RoadmapActivationHub */}
      {!roadmap || phases.length === 0 ? (
        <RoadmapActivationHub
          hasTargetRole={!!activeCareerId}
          targetRoleTitle={targetRoleTitle}
          onSelectCareer={() => navigate('/careers')}
        />
      ) : (
        <>
          {/* Weekly hours and the schedule that follows from them */}
          {activeCareerId && <StudyPlanPanel careerId={activeCareerId} />}
          {activeCareerId && <PracticeProjectsPanel careerId={activeCareerId} />}
          {activeCareerId && <FreeResourcesPanel careerId={activeCareerId} />}

          {/* SECTION 2 — ADAPTIVE MILESTONE SPINE (JOURNEY MAP) */}
          <PremiumSection
            title="Adaptive Career Milestone Spine"
            subtitle="Connected progression pathway from foundational competencies to target role mastery"
            badge="Milestone Trajectory"
          >
            <AdaptiveMilestoneSpine
              phases={phases}
              targetRoleTitle={targetRoleTitle}
              selectedPhaseOrder={focusedPhase?.order || 1}
              onSelectPhase={(order) => setSelectedPhaseOrder(order)}
            />
          </PremiumSection>

          {/* SECTION 3 — ACTIVE CHAPTER SPOTLIGHT ("WHERE YOU ARE RIGHT NOW") */}
          {focusedPhase && (
            <PremiumSection
              title={`Active Chapter Studio: Phase ${focusedPhase.order}`}
              subtitle={focusedPhase.objective || 'Immediate curriculum focus and milestone execution'}
              badge="Active Chapter"
            >
              <ActivePhaseSpotlight
                phase={focusedPhase}
                onStatusChange={handleStatusChange}
                onInspectTask={handleInspectTask}
              />
            </PremiumSection>
          )}

          {/* SECTION 4 — SEQUENCED DEPENDENCY TREE ENGINE ("WHY AM I LEARNING THIS NOW?") */}
          <PremiumSection
            title="Sequenced Skill Acquisition & Dependency Tree"
            subtitle="Strict topological prerequisite graph eliminating your readiness gaps in optimal order"
            badge="Topological Engine"
          >
            <DependencyTreeEngine
              items={dependencyItems}
              targetRoleTitle={targetRoleTitle}
              onSelectTask={(id) => {
                const found = phases.flatMap((p) => p.items).find((i) => i._id === id || i.itemId === id);
                if (found) handleInspectTask(found);
              }}
            />
          </PremiumSection>

          <WorkspaceDivider label="Curriculum Breakdown & Course Discovery" />

          {/* SECTION 5 — ALL PHASES BLUEPRINT (CURRICULUM BREAKDOWN) */}
          <PremiumSection
            title="Complete Roadmap Curriculum Blueprint"
            subtitle="Step-by-step phases ordered by career gap priority"
            badge="Curriculum Blueprint"
          >
            <div className="space-y-4">
              {phases.map((phase) => (
                <RoadmapPhaseCard
                  key={phase._id}
                  phase={{
                    ...phase,
                    objective: phase.objective || '',
                    skillsGained: phase.skillsGained || [],
                    estimatedCompletionTime: phase.estimatedCompletionTime || '',
                    items: phase.items.map((i) => ({
                      itemId: i._id || i.itemId || '',
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
                  onStatusChange={(itemId, newStatus) => handleStatusChange(itemId, newStatus)}
                />
              ))}
            </div>
          </PremiumSection>

          {/* SECTION 6 — LEARNING MOMENTUM & SIMULATOR */}
          <PremiumSection
            title="Learning Velocity & Predictive Decision Simulator"
            subtitle="Plain language momentum analysis and projected readiness outcomes"
            badge="Momentum Telemetry"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <IllustrativeNotice kind="heuristic" className="mb-3" />
                <DecisionSimulator
                  currentScore={plan.aiContext.topReadiness?.overallScore ?? 0}
                  targetRoleTitle={targetRoleTitle || 'Target Role'}
                  availableTasks={
                    ((roadmap?.phases || []) as ApiRoadmapPhase[])
                      .flatMap((p) => p.items || [])
                      .filter((i) => i.status !== 'completed')
                      .slice(0, 4)
                      .map((i) => i.title)
                  }
                  onExecuteSimulatedTask={(taskTitle) => {
                    const targetItem = ((roadmap?.phases || []) as ApiRoadmapPhase[])
                      .flatMap((p) => p.items || [])
                      .find((i) => i.title === taskTitle);
                    if (targetItem?._id) {
                      handleStatusChange(targetItem._id, 'in_progress');
                    }
                  }}
                />
              </div>
              <div className="lg:col-span-5">
                <OpportunityForecast forecast={plan.forecast} />
              </div>
            </div>
          </PremiumSection>

          {/* SECTION 7 — MULTI-PROVIDER COURSE & CERTIFICATION HUBS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IllustrativeNotice className="mb-3" />
            <CourseIntelligencePanel
              skillTarget={targetRoleTitle || 'Target Role'}
              onNavigateToRoadmap={() => navigate('/roadmap')}
            />
            <IllustrativeNotice className="mb-3" />
            <CertificationIntelligencePanel
              technologyTarget={targetRoleTitle || 'Target Role'}
              onExploreRoadmap={() => navigate('/roadmap')}
            />
          </div>
        </>
      )}

      {/* SECTION 8 — QUICK SHORTCUTS GRID */}
      <PremiumSection
        title="Roadmap Operations Shortcuts"
        subtitle="Quick access to learning tools and career engines"
        badge="Operations"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      {/* TASK JOURNEY INSPECTOR (Slide-Over Drawer) */}
      <TaskJourneyInspector
        task={inspectingTask}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onStatusChange={handleStatusChange}
        targetRoleTitle={targetRoleTitle}
      />

      {/* SECTION 9 — AI STATUS BAR */}
      <AIStatusBar
        status={isLoading ? 'thinking' : 'active'}
        confidence={98.4}
        lastUpdated={roadmap?.updatedAt ? new Date(roadmap.updatedAt).toLocaleTimeString() : 'Live'}
      />
    </div>
  );
};

export default LearningJourneyWorkspace;
