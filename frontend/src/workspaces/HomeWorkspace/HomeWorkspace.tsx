import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { SessionMemoryLayer } from '../../components/experience';
import { Reveal, RevealItem } from '../../design/aurora/primitives';
import { NextStepsPanel } from '../../features/home/NextSteps';
import { CommandHero } from '../../features/home/aurora/CommandHero';
import {
  AssistantCard,
  CareerPathway,
  InterviewCard,
  JobsCard,
  RecentActivityCard,
  ResumeCard,
  SkillGapCard,
  StudyPlanCard,
} from '../../features/home/aurora/Panels';
import type { ActivityOverview, SkillsSummary, UnifiedCareerSnapshot } from '../../features/home/aurora/types';

export type { UnifiedCareerSnapshot } from '../../features/home/aurora/types';

const Skeleton: React.FC<{ className: string }> = ({ className }) => (
  <div className={`animate-pulse rounded-[28px] border border-aurora-line bg-white/70 motion-reduce:animate-none ${className}`} />
);

/** The Command Center: every figure comes from the student's stored records. */
export const HomeWorkspace: React.FC = () => {
  const user = useAuthStore(state => state.user);

  const snapshotQuery = useQuery<UnifiedCareerSnapshot>({
    queryKey: ['career-snapshot'],
    queryFn: async () => (await apiClient.get('/users/me/career-snapshot')).data.data,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
  const skillsQuery = useQuery<SkillsSummary>({
    queryKey: ['skills', 'me'],
    queryFn: async () => (await apiClient.get('/skills/me')).data.data,
    staleTime: 30_000,
  });
  // Shared with the next-steps panel, which reads the streak from the same response
  const activityQuery = useQuery<ActivityOverview>({
    queryKey: ['activity'],
    queryFn: async () => (await apiClient.get('/activity')).data.data,
  });

  const snapshot = snapshotQuery.data;

  useEffect(() => {
    if (snapshot) SessionMemoryLayer.updateMemory(snapshot.readinessScore || 0, snapshot.roadmapProgress, snapshot.targetCareer);
  }, [snapshot]);

  if (snapshotQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6" aria-busy="true">
        <p role="status" className="sr-only">
          Loading your Command Center
        </p>
        <Skeleton className="h-[340px]" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" aria-hidden="true" /> Your Command Center could not be loaded.
          </span>
          <button type="button" onClick={() => snapshotQuery.refetch()} className="rounded-full bg-white px-4 py-2 font-semibold shadow-aurora-sm hover:bg-amber-100">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const name = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const schedule = snapshot.roadmap?.isInitialized ? snapshot.roadmap.schedule : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <CommandHero name={name} snapshot={snapshot} skillsCount={snapshot.totalSkills} />

      <Reveal className="grid gap-6 lg:grid-cols-3" stagger={0.07}>
        <RevealItem className="space-y-6 lg:col-span-2">
          <NextStepsPanel />
          {schedule && <StudyPlanCard schedule={schedule} />}
          <CareerPathway snapshot={snapshot} />
        </RevealItem>
        <RevealItem className="space-y-6">
          <SkillGapCard snapshot={snapshot} skills={skillsQuery.data} />
          <AssistantCard snapshot={snapshot} />
          <RecentActivityCard activity={activityQuery.data} loading={activityQuery.isLoading} />
        </RevealItem>
      </Reveal>

      <Reveal className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" stagger={0.07}>
        <RevealItem className="xl:col-span-2">
          <JobsCard snapshot={snapshot} />
        </RevealItem>
        <RevealItem>
          <InterviewCard snapshot={snapshot} />
        </RevealItem>
        <RevealItem>
          <ResumeCard snapshot={snapshot} />
        </RevealItem>
      </Reveal>
    </div>
  );
};

export default HomeWorkspace;
