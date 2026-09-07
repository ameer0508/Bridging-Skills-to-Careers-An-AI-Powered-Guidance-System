import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Award,
  Briefcase,
  Video,
  ArrowRight,
  Target,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import {
  QuickActionGrid,
  AIStatusBar,
  WorkspaceDivider,
  PremiumSection,
  GlassPanel,
} from '../../components/experience/workspace';
import {
  AIThinkingAnimation,
  SkeletonShimmer,
  SessionMemoryLayer,
} from '../../components/experience';

import { CareerOSOrbitalField } from '../../features/home/components/CareerOSOrbitalField';
import { CareerOSTelemetryHUD } from '../../features/home/components/CareerOSTelemetryHUD';
import { CareerOSPriorityBanner } from '../../features/home/components/CareerOSPriorityBanner';
import { CareerOSMetricGrid } from '../../features/home/components/CareerOSMetricGrid';
import { CareerJourneyProgressionTimeline } from '../../features/telemetry/components/CareerJourneyProgressionTimeline';

export interface UnifiedCareerSnapshot {
  targetCareer: string;
  matchScore: number;
  readinessScore: number;
  totalSkills: number;
  criticalGaps: string[];
  roadmapProgress: number;
  activeRecommendationsCount: number;
  opportunities: {
    saved: number;
    applied: number;
    interviewing: number;
    offer: number;
    rejected?: number;
    withdrawn?: number;
  };
  interviews: {
    total: number;
    completed: number;
    averageScore: number;
    latestScore: number;
    latestWeaknesses?: string[];
  };
  resumeInfo?: {
    hasResume: boolean;
    updatedAt?: string | null;
  };
}

export const HomeWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Hook 1: Unified Canonical Server-Side Career Snapshot
  const { data: snapshotData, isLoading: snapshotLoading } = useQuery<UnifiedCareerSnapshot>({
    queryKey: ['career-snapshot'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me/career-snapshot');
      return response.data.data;
    },
  });

  // Hook 2: User Extracted Skills List for Orbital Canvas
  const { data: skillsData, isLoading: skillsLoading } = useQuery<{
    categories?: Record<string, Array<{ name: string; category?: string }>>;
    totalSkills: number;
  }>({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
  });

  // Hook 3: Recommendations
  const { data: recommendationsData, isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await apiClient.get('/recommendations');
      return response.data.data.recommendations || [];
    },
  });

  const snapshot: UnifiedCareerSnapshot = useMemo(
    () =>
      snapshotData || {
        targetCareer: user?.targetRole || user?.primaryCareerDomain || 'Target Career Role',
        matchScore: 0,
        readinessScore: 0,
        totalSkills: 0,
        criticalGaps: [],
        roadmapProgress: 0,
        activeRecommendationsCount: 0,
        opportunities: { saved: 0, applied: 0, interviewing: 0, offer: 0 },
        interviews: { total: 0, completed: 0, averageScore: 0, latestScore: 0 },
      },
    [snapshotData, user]
  );

  const userSkillsList = useMemo(() => {
    if (!skillsData?.categories) return [];
    return Object.values(skillsData.categories).flatMap((catItems) =>
      catItems.map((item) => ({ name: item.name, category: item.category }))
    );
  }, [skillsData]);

  const topRec = recommendationsData?.[0] || null;
  const isLoading = snapshotLoading || skillsLoading || recsLoading;

  useEffect(() => {
    if (!isLoading && snapshot) {
      SessionMemoryLayer.updateMemory(
        snapshot.readinessScore,
        snapshot.roadmapProgress,
        snapshot.targetCareer
      );
    }
  }, [isLoading, snapshot]);

  // Dynamic Next Best Action calculation from candidate database state
  const nextBestAction = useMemo(() => {
    if (!snapshot.resumeInfo?.hasResume) {
      return {
        title: 'Upload Resume File to Activate ATS Intelligence',
        subtitle: 'Uploading your PDF/DOCX resume file parses contact details, skills, and projects.',
        route: '/resume',
        icon: FileText,
        actionLabel: 'Upload Resume File',
        badge: 'Priority Action: Resume Upload',
      };
    }
    if (snapshot.totalSkills === 0) {
      return {
        title: 'Verify Your Core Skills & Competencies',
        subtitle: 'Extracted skills ground career matching, readiness calculation, and opportunity search.',
        route: '/skills',
        icon: ShieldCheck,
        actionLabel: 'Manage Verified Skills',
        badge: 'Priority Action: Skill Verification',
      };
    }
    if (snapshot.criticalGaps && snapshot.criticalGaps.length > 0) {
      return {
        title: `Close Highest-Priority Skill Gap: [${snapshot.criticalGaps[0]}]`,
        subtitle: `Closing ${snapshot.criticalGaps[0]} will directly increase your readiness score for ${snapshot.targetCareer}.`,
        route: '/roadmap',
        icon: Target,
        actionLabel: 'Execute Roadmap Module',
        badge: 'Priority Action: Skill Gap Closure',
      };
    }
    if (snapshot.opportunities && snapshot.opportunities.saved > 0) {
      return {
        title: 'Prepare STAR Interview Sessions for Saved Opportunities',
        subtitle: `You have ${snapshot.opportunities.saved} saved opportunities. Conduct mock technical interviews to boost offer probability.`,
        route: '/interview-agent',
        icon: Video,
        actionLabel: 'Start Mock Interview Studio',
        badge: 'Priority Action: Interview Prep',
      };
    }
    return {
      title: `Discover Live JSearch Opportunities for ${snapshot.targetCareer}`,
      subtitle: 'Query live market job postings matched to your verified tech stack.',
      route: '/job-agent',
      icon: Briefcase,
      actionLabel: 'Discover Live Jobs',
      badge: 'Priority Action: Job Discovery',
    };
  }, [snapshot]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4 font-mono">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Orchestrating Unified SkillBridge CareerOS Telemetry..." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <SkeletonShimmer height={120} />
          <SkeletonShimmer height={120} />
          <SkeletonShimmer height={120} />
          <SkeletonShimmer height={120} />
        </div>
      </div>
    );
  }

  // Command Center 12 System Shortcuts
  const quickActions = [
    {
      id: 'resume',
      title: 'Resume Studio',
      subtitle: 'Parsed ATS evidence',
      icon: FileText,
      shortcut: '⌘1',
      color: 'text-indigo-400',
      onClick: () => navigate('/resume'),
    },
    {
      id: 'skills',
      title: 'Skill Intelligence',
      subtitle: 'Verified competency mesh',
      icon: ShieldCheck,
      shortcut: '⌘2',
      color: 'text-emerald-400',
      onClick: () => navigate('/skills'),
    },
    {
      id: 'careers',
      title: 'Career Intelligence',
      subtitle: 'Taxonomy & matching',
      icon: Target,
      shortcut: '⌘3',
      color: 'text-cyan-400',
      onClick: () => navigate('/careers'),
    },
    {
      id: 'readiness',
      title: 'Career Readiness',
      subtitle: 'Dimensional scores',
      icon: Award,
      shortcut: '⌘4',
      color: 'text-purple-400',
      onClick: () => navigate('/readiness'),
    },
    {
      id: 'opportunities',
      title: 'Live Opportunities',
      subtitle: 'JSearch live discovery',
      icon: Briefcase,
      shortcut: '⌘5',
      color: 'text-amber-400',
      onClick: () => navigate('/opportunities'),
    },
    {
      id: 'interviews',
      title: 'Interview Agent',
      subtitle: 'STAR AI evaluator',
      icon: Video,
      shortcut: '⌘6',
      color: 'text-rose-400',
      onClick: () => navigate('/interviews'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4 font-mono">
      {/* SECTION 1 — CAREEROS TELEMETRY HERO HUD */}
      <CareerOSTelemetryHUD
        userName={user?.fullName || user?.email?.split('@')[0]}
        targetRole={snapshot.targetCareer}
        readinessScore={snapshot.readinessScore}
        matchScore={snapshot.matchScore}
        totalSkills={snapshot.totalSkills}
        activePhaseTitle={`Roadmap Progress: ${snapshot.roadmapProgress}%`}
        hasData={snapshot.totalSkills > 0}
        onPrimaryAction={() => navigate(snapshot.totalSkills > 0 ? '/roadmap' : '/resume')}
      />

      {/* DYNAMIC NEXT BEST ACTION CARD */}
      <GlassPanel className="p-5 space-y-3 border-indigo-500/40 bg-indigo-950/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase">
            {nextBestAction.badge}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Derived from candidate database telemetry</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              {nextBestAction.title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              {nextBestAction.subtitle}
            </p>
          </div>

          <button
            onClick={() => navigate(nextBestAction.route)}
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 shrink-0 transition-all"
          >
            <span>{nextBestAction.actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </GlassPanel>

      {/* SECTION 2 — UNIFIED CAREER JOURNEY PROGRESSION TIMELINE */}
      <CareerJourneyProgressionTimeline
        hasTargetRole={Boolean(user?.targetRole || user?.primaryCareerDomain)}
        targetRole={snapshot.targetCareer}
        primaryDomain={user?.primaryCareerDomain || ''}
        hasResume={Boolean(snapshot.resumeInfo?.hasResume)}
        totalSkills={snapshot.totalSkills}
        readinessScore={snapshot.readinessScore}
        roadmapProgress={snapshot.roadmapProgress}
        savedOpportunitiesCount={snapshot.opportunities.saved}
        applicationsCount={snapshot.opportunities.applied}
        interviewsCount={snapshot.interviews.total}
        onNavigateNode={(route) => navigate(route)}
      />

      {/* SECTION 3 — ORBITAL SKILL CANVAS & TELEMETRY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <PremiumSection
            title="Orbital Skill Telemetry"
            subtitle="Extracted skill profile orbiting target career core"
            badge="Neural Mesh"
          >
            <CareerOSOrbitalField
              userSkills={userSkillsList}
              targetRole={snapshot.targetCareer}
              onUploadResume={() => navigate('/resume')}
            />
          </PremiumSection>
        </div>

        {/* SUBSYSTEM INTEGRATION METRIC CARDS (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          {/* OPPORTUNITY PIPELINE TELEMETRY CARD */}
          <GlassPanel className="p-4 space-y-3 border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-400" />
                Live Opportunity Pipeline
              </span>
              <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                JSEARCH LIVE
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <button
                onClick={() => navigate('/opportunities?tab=SAVED&status=saved')}
                className="p-2 rounded bg-slate-950/80 border border-white/10 hover:border-amber-500/40 hover:bg-slate-900 transition-all cursor-pointer text-center"
              >
                <span className="text-slate-500 block text-[9px]">SAVED</span>
                <strong className="text-white text-sm">{snapshot.opportunities.saved}</strong>
              </button>
              <button
                onClick={() => navigate('/opportunities?tab=SAVED&status=applied')}
                className="p-2 rounded bg-slate-950/80 border border-white/10 hover:border-amber-500/40 hover:bg-slate-900 transition-all cursor-pointer text-center"
              >
                <span className="text-slate-500 block text-[9px]">APPLIED</span>
                <strong className="text-amber-400 text-sm">{snapshot.opportunities.applied}</strong>
              </button>
              <button
                onClick={() => navigate('/interviews')}
                className="p-2 rounded bg-slate-950/80 border border-white/10 hover:border-purple-500/40 hover:bg-slate-900 transition-all cursor-pointer text-center"
              >
                <span className="text-slate-500 block text-[9px]">INTERVIEW</span>
                <strong className="text-purple-300 text-sm">{snapshot.opportunities.interviewing}</strong>
              </button>
              <button
                onClick={() => navigate('/opportunities?tab=SAVED&status=offer')}
                className="p-2 rounded bg-slate-950/80 border border-white/10 hover:border-emerald-500/40 hover:bg-slate-900 transition-all cursor-pointer text-center"
              >
                <span className="text-slate-500 block text-[9px]">OFFER</span>
                <strong className="text-emerald-400 text-sm">{snapshot.opportunities.offer}</strong>
              </button>
            </div>

            <button
              onClick={() => navigate('/opportunities')}
              className="w-full py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs hover:bg-amber-500/20 cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Explore Live Opportunities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </GlassPanel>

          {/* INTERVIEW INTELLIGENCE TELEMETRY CARD */}
          <GlassPanel className="p-4 space-y-3 border-rose-500/30">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-400" />
                Interview Intelligence Telemetry
              </span>
              <span className="text-[10px] text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 font-bold">
                STAR EVALUATED
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <button
                onClick={() => navigate('/interviews')}
                className="p-2 rounded bg-slate-950/80 border border-white/10 hover:border-rose-500/40 hover:bg-slate-900 transition-all cursor-pointer text-center"
              >
                <span className="text-slate-500 block text-[9px]">TOTAL SESSIONS</span>
                <strong className="text-white text-sm">{snapshot.interviews.total}</strong>
              </button>
              <button
                onClick={() => navigate('/interviews')}
                className="p-2 rounded bg-slate-950/80 border border-white/10 hover:border-rose-500/40 hover:bg-slate-900 transition-all cursor-pointer text-center"
              >
                <span className="text-slate-500 block text-[9px]">AVG SCORE</span>
                <strong className="text-emerald-400 text-sm">{snapshot.interviews.averageScore}%</strong>
              </button>
              <button
                onClick={() => navigate('/interviews')}
                className="p-2 rounded bg-slate-950/80 border border-white/10 hover:border-rose-500/40 hover:bg-slate-900 transition-all cursor-pointer text-center"
              >
                <span className="text-slate-500 block text-[9px]">LATEST SCORE</span>
                <strong className="text-indigo-300 text-sm">{snapshot.interviews.latestScore}%</strong>
              </button>
            </div>

            <button
              onClick={() => navigate('/interviews')}
              className="w-full py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold text-xs hover:bg-rose-500/20 cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Launch Interview Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </GlassPanel>
        </div>
      </div>

      {/* SECTION 4 — DYNAMIC PRIORITY BANNER */}
      <CareerOSPriorityBanner
        title={topRec?.title}
        description={topRec?.reason}
        category={topRec?.category}
        priority={topRec?.priority}
        hasRecommendation={!!topRec}
        onAction={() => navigate(topRec ? '/recommendations' : '/resume')}
      />

      {/* SECTION 5 — COMMAND CENTER SHORTCUTS */}
      <PremiumSection
        title="Subsystem Shortucts"
        subtitle="Quick access to production-verified intelligence modules"
        badge="Command Center"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      <WorkspaceDivider label="Subsystem Metric Telemetry" />

      {/* SECTION 6 — TELEMETRY METRIC GRID */}
      <PremiumSection
        title="Career Health Telemetry"
        subtitle="Canonical capability metrics & match coverage"
        badge="Authoritative"
      >
        <CareerOSMetricGrid
          readinessScore={snapshot.readinessScore}
          matchScore={snapshot.matchScore}
          totalSkills={snapshot.totalSkills}
          milestoneProgress={snapshot.roadmapProgress}
          onNavigate={(route) => navigate(route)}
        />
      </PremiumSection>

      {/* SECTION 7 — LIVE AI STATUS FOOTER */}
      <AIStatusBar
        status={isLoading ? 'thinking' : 'active'}
        confidence={98.4}
        lastUpdated="Unified CareerOS Orchestrated"
      />
    </div>
  );
};

export default HomeWorkspace;
