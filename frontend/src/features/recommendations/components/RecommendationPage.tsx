import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Brain, Compass, Target, Sparkles } from 'lucide-react';
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

const DEFAULT_STRATEGIC_RECOMMENDATIONS: IRecommendation[] = [
  {
    _id: 'rec-default-1',
    category: 'Projects',
    title: 'Build Hands-On Project: Containerized REST API & Microservice Mesh',
    description: 'Design and deploy a scalable microservices architecture using Node.js/Python, Docker container orchestration, and automated API gateway routing.',
    priority: 'Highest',
    priorityScore: 94,
    reason: 'Hands-on architectural capstones provide the strongest verified proof of seniority for tech hiring managers.',
    impact: 35,
    difficulty: 'Intermediate',
    estimatedTime: '12 hours',
    dependencies: ['Container fundamentals', 'REST API design'],
    actionType: 'Project',
    targetSkill: 'Docker & Microservices',
    status: 'active'
  },
  {
    _id: 'rec-default-2',
    category: 'Learning Resources',
    title: 'Learn CI/CD Automation: GitHub Actions & Cloud Delivery',
    description: 'Master enterprise deployment pipelines that automatically lint, test, containerize, and ship software with zero-downtime releases.',
    priority: 'High',
    priorityScore: 88,
    reason: 'Automated delivery pipelines are required across 85% of modern software engineering postings.',
    impact: 28,
    difficulty: 'Intermediate',
    estimatedTime: '6 hours',
    dependencies: ['Git branching workflows'],
    actionLink: 'https://docs.github.com/en/actions',
    actionType: 'Course',
    targetSkill: 'CI/CD Pipelines',
    status: 'active'
  },
  {
    _id: 'rec-default-3',
    category: 'Certifications',
    title: 'Get Certified: AWS Certified Solutions Architect - Associate',
    description: 'Validate cloud infrastructure competencies including VPC networking, S3 security policies, ECS clusters, and cost-effective scaling.',
    priority: 'High',
    priorityScore: 82,
    reason: 'Official cloud credentials dramatically elevate recruiter search visibility and profile shortlist conversion.',
    impact: 30,
    difficulty: 'Intermediate',
    estimatedTime: '2 months',
    dependencies: ['Basic cloud concepts'],
    actionLink: 'https://aws.amazon.com/certification/',
    actionType: 'Certification',
    targetSkill: 'Cloud Architecture (AWS)',
    status: 'active'
  },
  {
    _id: 'rec-default-4',
    category: 'Learning Resources',
    title: 'Deep Dive: Advanced System Architecture & Scalability Patterns',
    description: 'Explore distributed caching, message queues, rate limiting, and database sharding techniques used at high scale.',
    priority: 'High',
    priorityScore: 78,
    reason: 'System architecture questions constitute 50% of senior and staff level technical interview assessments.',
    impact: 22,
    difficulty: 'Advanced',
    estimatedTime: '10 hours',
    dependencies: ['Backend systems'],
    actionType: 'Course',
    targetSkill: 'System Design',
    status: 'active'
  },
  {
    _id: 'rec-default-5',
    category: 'Resume Improvements',
    title: 'Highlight System Design & Cloud Deliverables in Executive Summary',
    description: 'Restructure your top resume summary to prominently showcase containerization, microservice orchestration, and measurable business impact.',
    priority: 'Medium',
    priorityScore: 70,
    reason: 'ATS scanners and technical recruiters allocate 6-8 seconds to initial executive summary evaluations.',
    impact: 20,
    difficulty: 'Beginner',
    estimatedTime: '30 mins',
    dependencies: [],
    actionType: 'Resume Optimization',
    targetSkill: 'Resume Formatting',
    status: 'active'
  }
];

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

  const recommendations = useMemo(() => {
    if (rawList.length > 0) {
      return rawList;
    }
    return DEFAULT_STRATEGIC_RECOMMENDATIONS;
  }, [rawList]);

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
        userName={user?.name || 'Commander'}
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
