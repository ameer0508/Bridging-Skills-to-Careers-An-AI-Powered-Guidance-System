import React, { useEffect, useMemo, useState } from 'react';
import { StudyPlanSummary } from '../../features/roadmaps/components/StudyPlan';
import type { RecommendationItem } from '../../types/telemetry';
import { listFrom } from '../../lib/collections';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { SkeletonShimmer, SessionMemoryLayer } from '../../components/experience';

import { motion } from 'framer-motion';
import {
  SpatialCareerObservatory,
  SpatialCareerTrajectory,
  SpatialOpportunityRadar,
  SpatialInterviewChamber,
  SpatialCareerInsights,
  SpatialCareerNetwork,
  AmbientParticleField,
  AmbientIntelligenceDock,
  NextBestActionInfo,
} from '../../features/home/components';

import '../../features/home/styles/spatial_command_center.css';

export interface UnifiedCareerSnapshot {
  targetCareer: string;
  targetRole?: string;
  primaryCareerDomain?: string;
  matchScore: number | null;
  isMatchEvaluated: boolean;
  readinessScore: number | null;
  isReadinessEvaluated: boolean;
  careerHealth: number | null;
  isCareerHealthEvaluated: boolean;
  totalSkills: number;
  criticalGaps: string[];
  roadmapProgress: number;
  isRoadmapInitialized: boolean;
  activePhaseTitle?: string | null;
  roadmap?: {
    isInitialized: boolean;
    progress: number;
    title: string | null;
    currentPhaseTitle: string | null;
    totalMilestones: number;
    completedMilestones: number;
    schedule?: React.ComponentProps<typeof StudyPlanSummary>['schedule'] | null;
    phases: Array<{
      title: string;
      description?: string;
      items?: Array<{ title: string; status: string }>;
    }>;
  };
  activeRecommendationsCount: number;
  topRecommendations?: Array<{
    id?: string;
    title: string;
    reason?: string;
    category?: string;
    priority?: string;
  }>;
  nextBestAction?: NextBestActionInfo;
  opportunities: {
    saved: number;
    applied: number;
    interviewing: number;
    offer: number;
    rejected?: number;
    withdrawn?: number;
    total: number;
  };
  interviews: {
    total: number;
    completed: number;
    averageScore: number | null;
    latestScore: number | null;
    isEvaluated: boolean;
    latestWeaknesses?: string[];
  };
  resumeInfo?: {
    hasResume: boolean;
    fileName?: string | null;
    detectedSkillsCount?: number;
    atsScore?: number | null;
    experienceCount?: number;
    projectsCount?: number;
    educationCount?: number;
    certificationsCount?: number;
    parsingStatus?: string;
    updatedAt?: string | null;
  };
  telemetry?: {
    timestamp: string;
    databaseStatus: string;
    primaryProvider: string;
    aiStatus?: 'LIVE' | 'FALLBACK';
    marketStatus?: 'LIVE' | 'SANDBOX';
  };
}

export const HomeWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isRefreshingManually, setIsRefreshingManually] = useState(false);
  const [trajectoryHoveredDomainId, setTrajectoryHoveredDomainId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 20 });

  // Hook 1: Authoritative Career Snapshot
  const {
    data: snapshotData,
    isLoading: snapshotLoading,
    error: snapshotError,
    refetch: refetchSnapshot,
  } = useQuery<UnifiedCareerSnapshot>({
    queryKey: ['career-snapshot'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me/career-snapshot');
      return response.data.data;
    },
    staleTime: 15000,
    refetchOnWindowFocus: true,
  });

  // Hook 2: User Extracted Skills
  const { data: skillsData, isLoading: skillsLoading } = useQuery<{
    categories?: Record<string, Array<{ name: string; category?: string }>>;
    totalSkills: number;
  }>({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
    staleTime: 30000,
  });

  // Hook 3: Recommendations
  const { data: recommendationsData, isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await apiClient.get('/recommendations');
      return response.data.data.recommendations || [];
    },
    staleTime: 30000,
  });

  // Canonical Snapshot Assembly with Guaranteed Truthful Fallback
  const snapshot: UnifiedCareerSnapshot = useMemo(() => {
    if (snapshotData) return snapshotData;
    return {
      targetCareer: user?.targetRole || user?.primaryCareerDomain || 'Target Career Track',
      targetRole: user?.targetRole || '',
      primaryCareerDomain: user?.primaryCareerDomain || '',
      matchScore: null,
      isMatchEvaluated: false,
      readinessScore: null,
      isReadinessEvaluated: false,
      careerHealth: null,
      isCareerHealthEvaluated: false,
      totalSkills: 0,
      criticalGaps: [],
      roadmapProgress: 0,
      isRoadmapInitialized: false,
      roadmap: {
        isInitialized: false,
        progress: 0,
        title: null,
        currentPhaseTitle: null,
        totalMilestones: 0,
        completedMilestones: 0,
        phases: [],
      },
      activeRecommendationsCount: 0,
      opportunities: { saved: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0, withdrawn: 0, total: 0 },
      interviews: { total: 0, completed: 0, averageScore: null, latestScore: null, isEvaluated: false, latestWeaknesses: [] },
      resumeInfo: {
        hasResume: false,
        fileName: null,
        detectedSkillsCount: 0,
        atsScore: null,
        experienceCount: 0,
        projectsCount: 0,
        educationCount: 0,
        certificationsCount: 0,
        parsingStatus: 'none',
        updatedAt: null,
      },
      telemetry: {
        timestamp: new Date().toISOString(),
        databaseStatus: 'CONNECTED',
        primaryProvider: 'Local AI Fallback (Deterministic Mode)',
        aiStatus: 'FALLBACK',
        marketStatus: 'SANDBOX',
      },
    };
  }, [snapshotData, user]);

  const userSkillsList = useMemo(() => {
    if (!skillsData?.categories) return [];
    return Object.values(skillsData.categories).flatMap((catItems) =>
      catItems.map((item) => ({ name: item.name, category: item.category }))
    );
  }, [skillsData]);

  const safeRecsList = useMemo(() => listFrom<RecommendationItem>(recommendationsData, 'recommendations'), [recommendationsData]);

  const topRec = useMemo(() => {
    // Either source may supply the headline recommendation; only these fields are read from it
    const raw: { title: string; reason?: string; category?: string; type?: string } | null = (snapshot.topRecommendations && snapshot.topRecommendations.length > 0)
      ? snapshot.topRecommendations[0]
      : safeRecsList.length > 0
      ? safeRecsList[0]
      : null;

    if (!raw) return null;

    // Contextual route and action label based on category/type
    let route = '/recommendations';
    let actionLabel = 'Explore Directives';
    const type = (raw.type || '').toLowerCase();
    const cat = (raw.category || '').toLowerCase();

    if (type === 'project' || cat.includes('project')) {
      route = '/roadmap';
      actionLabel = 'Start Hands-On Project';
    } else if (type === 'course' || cat.includes('learning') || cat.includes('course')) {
      route = '/roadmap';
      actionLabel = 'Open Learning Module';
    } else if (type === 'certification' || cat.includes('certification')) {
      route = '/recommendations';
      actionLabel = 'Explore Certification';
    } else if (type === 'resume_improvement' || cat.includes('resume')) {
      route = '/resume';
      actionLabel = 'Review Resume Portfolio';
    } else if (type === 'interview' || cat.includes('interview')) {
      route = '/interview-agent';
      actionLabel = 'Launch Interview Practice';
    }

    return {
      title: raw.title,
      type: raw.type || raw.category || 'Strategic Directive',
      reason: raw.reason,
      route,
      actionLabel,
    };
  }, [snapshot.topRecommendations, safeRecsList]);

  const isLoading = snapshotLoading || skillsLoading || recsLoading;

  useEffect(() => {
    if (!isLoading && snapshot) {
      SessionMemoryLayer.updateMemory(
        snapshot.readinessScore || 0,
        snapshot.roadmapProgress,
        snapshot.targetCareer
      );
    }
  }, [isLoading, snapshot]);

  // Clean, human-centered Next Best Action
  const nextBestAction: NextBestActionInfo = useMemo(() => {
    if (snapshot.nextBestAction) {
      return snapshot.nextBestAction;
    }
    if (!snapshot.resumeInfo?.hasResume) {
      return {
        action: 'upload_resume',
        title: 'Awaken your profile intelligence',
        subtitle: 'Uploading your PDF or DOCX resume extracts verified capabilities, projects, and populates your capability landscape.',
        route: '/resume',
        actionLabel: 'Upload Resume Document',
        badge: 'Priority Activation',
      };
    }
    if (snapshot.totalSkills === 0) {
      return {
        action: 'verify_skills',
        title: 'Review and verify your extracted competencies',
        subtitle: 'Confirmed skills form the foundation of your role match benchmarking, readiness audit, and job discovery.',
        route: '/skills',
        actionLabel: 'Verify Skill Portfolio',
        badge: 'Competency Review',
      };
    }
    if (snapshot.criticalGaps && snapshot.criticalGaps.length > 0) {
      return {
        action: 'close_skill_gap',
        title: `Bridge high-leverage gap: ${snapshot.criticalGaps[0]}`,
        subtitle: `Mastering ${snapshot.criticalGaps[0]} directly elevates your readiness alignment for ${snapshot.targetCareer}.`,
        route: '/roadmap',
        actionLabel: 'Open Learning Module',
        badge: 'Targeted Growth',
      };
    }
    if (snapshot.opportunities && snapshot.opportunities.saved > 0 && snapshot.interviews.total === 0) {
      return {
        action: 'prepare_interview',
        title: 'Conduct interactive mock interview coaching',
        subtitle: `You have ${snapshot.opportunities.saved} saved opportunities. Sharpen your behavioral and architectural responses with AI simulations.`,
        route: '/interview-agent',
        actionLabel: 'Start Mock Interview',
        badge: 'Interview Practice',
      };
    }
    return {
      action: 'explore_opportunities',
      title: `Explore active market opportunities for ${snapshot.targetCareer}`,
      subtitle: 'Browse live openings matched directly to your current skill profile and career goals.',
      route: '/opportunities',
      actionLabel: 'Browse Matched Openings',
      badge: 'Market Radar',
    };
  }, [snapshot]);

  const handleManualRefresh = async () => {
    setIsRefreshingManually(true);
    try {
      await Promise.all([
        refetchSnapshot(),
        queryClient.invalidateQueries({ queryKey: ['skills', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['recommendations'] }),
      ]);
    } finally {
      setTimeout(() => setIsRefreshingManually(false), 500);
    }
  };

  const formattedSyncTime = useMemo(() => {
    if (!snapshot.telemetry?.timestamp) return 'Just now';
    try {
      const date = new Date(snapshot.telemetry.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Real-time';
    }
  }, [snapshot.telemetry?.timestamp]);

  // Clean, quiet loading skeleton
  if (isLoading) {
    return (
      <div className="home-command-center max-w-7xl mx-auto space-y-10 pb-20 px-4 sm:px-6 pt-4">
        <SkeletonShimmer height={260} />
        <SkeletonShimmer height={120} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <SkeletonShimmer height={400} />
          </div>
          <div className="lg:col-span-4 space-y-8">
            <SkeletonShimmer height={400} />
          </div>
        </div>
        <SkeletonShimmer height={220} />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.09,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setCursorPos({
            x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
            y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
          });
        }
      }}
      className="spatial-command-center max-w-7xl mx-auto space-y-10 pb-32 px-4 sm:px-6 pt-4 relative z-10"
    >
      {/* Dynamic Cursor Reactive Ambient Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700 opacity-50 z-0"
        style={{
          background: `radial-gradient(700px circle at ${cursorPos.x}% ${cursorPos.y}%, rgba(226, 179, 87, 0.06), rgba(99, 102, 241, 0.04) 40%, transparent 80%)`,
        }}
      />

      {/* 3D Atmospheric Particle Dust & Perspective Lattice */}
      <AmbientParticleField particleCount={45} />
      <div className="spatial-grid-matrix" />

      {/* Network / Connection Fallback Banner */}
      {snapshotError && (
        <motion.div
          variants={itemVariants}
          className="p-4 rounded-2xl border border-amber-500/25 bg-amber-950/30 text-amber-200 flex items-center justify-between text-xs relative z-10 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Connection momentarily offline. Displaying cached career cartography.</span>
          </div>
          <button
            onClick={() => refetchSnapshot()}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 font-semibold cursor-pointer transition-colors"
          >
            Retry Sync
          </button>
        </motion.div>
      )}

      {/* 01 — THE SPATIAL CAREER OBSERVATORY (Dominant Visual Centerpiece & Interactive Constellation) */}
      <motion.div variants={itemVariants} className="relative z-10">
        <SpatialCareerObservatory
          userName={user?.fullName || user?.email?.split('@')[0] || 'Candidate'}
          targetRole={snapshot.targetCareer || 'Target Career Summit'}
          primaryDomain={user?.primaryCareerDomain || ''}
          readinessScore={snapshot.readinessScore ?? null}
          isReadinessEvaluated={Boolean(snapshot.isReadinessEvaluated)}
          syncTime={formattedSyncTime}
          isRefreshing={isRefreshingManually}
          skills={userSkillsList || []}
          criticalGaps={snapshot.criticalGaps || []}
          nextBestAction={nextBestAction}
          onRefresh={handleManualRefresh}
          onNavigate={(route) => navigate(route)}
          onUploadResume={() => navigate('/resume')}
          onNavigateSkills={() => navigate('/skills')}
          onBridgeGap={() => navigate('/roadmap')}
        />
      </motion.div>

      {/* 02 — CONTINUOUS LUMINOUS CAREER TRAJECTORY (Secondary Connecting River) */}
      <motion.div variants={itemVariants} className="relative z-10">
        <SpatialCareerTrajectory
          hasTargetRole={Boolean(user?.targetRole || user?.primaryCareerDomain)}
          targetRole={snapshot.targetCareer || 'Target Career Summit'}
          hasResume={Boolean(snapshot.resumeInfo?.hasResume)}
          totalSkills={snapshot.totalSkills || 0}
          readinessScore={snapshot.readinessScore ?? null}
          roadmapProgress={snapshot.roadmapProgress || 0}
          savedOpportunitiesCount={snapshot.opportunities?.total || 0}
          interviewsCount={snapshot.interviews?.total || 0}
          onNavigate={(route) => navigate(route)}
          onHoverStage={setTrajectoryHoveredDomainId}
        />
      </motion.div>

      {snapshot.roadmap?.isInitialized && snapshot.roadmap.schedule && (
        <motion.div variants={itemVariants} className="relative z-10">
          <StudyPlanSummary schedule={snapshot.roadmap.schedule} onOpen={() => navigate('/roadmap')} />
        </motion.div>
      )}

      {/* 03 — SUPPORTING SPATIAL ENVIRONMENTS: OPPORTUNITY RADAR & INTERVIEW PREPARATION CHAMBER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <motion.div variants={itemVariants} className="lg:col-span-6">
          <SpatialOpportunityRadar
            opportunities={snapshot.opportunities || { saved: 0, applied: 0, interviewing: 0, offer: 0, total: 0 }}
            onNavigate={(route) => navigate(route)}
            targetRole={snapshot.targetCareer || 'Target Role'}
            marketStatus={snapshot.telemetry?.marketStatus || 'SANDBOX'}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-6">
          <SpatialInterviewChamber
            interviews={snapshot.interviews || { total: 0, completed: 0, averageScore: null, latestScore: null, isEvaluated: false }}
            onNavigate={(route) => navigate(route)}
          />
        </motion.div>
      </div>

      {/* 04 — STRATEGIC CAREER DIRECTIVE BLADE */}
      <motion.div variants={itemVariants} className="relative z-10">
        <SpatialCareerInsights
          topRecommendation={topRec}
          onNavigate={(route) => navigate(route)}
        />
      </motion.div>

      {/* 05 — INTERCONNECTED CAREER INTELLIGENCE SYSTEM MAP */}
      <motion.div variants={itemVariants} className="relative z-10">
        <SpatialCareerNetwork
          onNavigate={(route) => navigate(route)}
          hasResume={Boolean(snapshot.resumeInfo?.hasResume)}
          totalSkills={snapshot.totalSkills || 0}
          readinessScore={snapshot.readinessScore ?? null}
          savedOpportunities={snapshot.opportunities?.saved || 0}
          totalInterviews={snapshot.interviews?.total || 0}
          targetRole={snapshot.targetCareer || 'Career Target'}
          externalHighlightId={trajectoryHoveredDomainId}
        />
      </motion.div>

      {/* 06 — AMBIENT INTELLIGENCE TELEMETRY DOCK */}
      <motion.div variants={itemVariants} className="relative z-10">
        <AmbientIntelligenceDock
          provider={snapshot.telemetry?.primaryProvider || 'Local AI Fallback (Deterministic Mode)'}
          lastUpdated={formattedSyncTime}
          isOnline={!snapshotError}
          aiStatus={snapshot.telemetry?.aiStatus || 'FALLBACK'}
          marketStatus={snapshot.telemetry?.marketStatus || 'SANDBOX'}
        />
      </motion.div>
    </motion.div>
  );
};

export default HomeWorkspace;
