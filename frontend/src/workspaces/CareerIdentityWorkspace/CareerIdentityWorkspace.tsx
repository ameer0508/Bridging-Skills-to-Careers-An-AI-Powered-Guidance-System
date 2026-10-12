import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/composite/Toast';
import { AIThinkingAnimation } from '../../components/experience';
import {
  CareerIdentityHero,
  CareerIdentityCompleteness,
  CareerDirectionDeck,
  ProfessionalStorySection,
  ProfessionalEvidenceLedger,
  CareerPreferencesEditor,
  ExperiencePreferencesDeck,
  AccountSecurityPrivacyCard,
} from '../../features/profile/components';

export const CareerIdentityWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { user, clearSession, updateUser, refreshToken } = useAuthStore();

  const [isDirectionEditorOpen, setIsDirectionEditorOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'identity' | 'direction' | 'evidence' | 'preferences' | 'security'>('all');

  // Query 1: Real Profile Data from /users/me
  const {
    data: profileData,
    isLoading: isProfileLoading,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await apiClient.get('/users/me');
      return res.data.data;
    },
  });

  // Query 2: Real Active Resume Metadata from /resumes/me
  const {
    data: resumeData,
  } = useQuery({
    queryKey: ['activeResume'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/resumes/me');
        return res.data.data.resume;
      } catch {
        return null;
      }
    },
  });

  // Query 3: Real Verified Skills from /skills/me
  const {
    data: skillsData,
  } = useQuery({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/skills/me');
        return res.data.data;
      } catch {
        return { totalSkills: 0, categories: {} };
      }
    },
  });

  // Query 4: Real Career Match Fits from /careers/matches
  const { data: matchesData } = useQuery({
    queryKey: ['careers', 'matches'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/careers/matches');
        return res.data.data.matches || [];
      } catch {
        return [];
      }
    },
  });

  // Query 5: Real Interview Simulation Telemetry from /interview/history
  const { data: interviewData } = useQuery({
    queryKey: ['interview', 'history'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/interviews/history');
        return res.data.data;
      } catch {
        return { sessions: [], averageScore: null };
      }
    },
  });

  const profile = profileData || user;
  const matches = matchesData || [];
  const topMatch = matches[0] || null;
  const totalSkills = skillsData?.totalSkills || 0;
  const interviewsCount = interviewData?.sessions?.length || 0;
  const interviewsAvgScore = interviewData?.averageScore || null;

  // Mutation 1: Update Identity (Name, Avatar, Location)
  const identityMutation = useMutation({
    mutationFn: async (payload: { fullName: string; avatar: string; location: string }) => {
      const res = await apiClient.put('/users/me', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      updateUser({
        fullName: data.fullName,
        avatar: data.avatar,
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      addToast({
        type: 'success',
        message: 'Personal identity updated successfully.',
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Identity update failed';
      addToast({ type: 'error', message: msg });
    },
  });

  // Mutation 2: Update Bio / Professional Narrative
  const bioMutation = useMutation({
    mutationFn: async (newBio: string) => {
      const res = await apiClient.put('/users/me', { bio: newBio });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      addToast({
        type: 'success',
        message: 'Professional narrative saved.',
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to save narrative';
      addToast({ type: 'error', message: msg });
    },
  });

  // Mutation 3: Update Career Direction & Preferences
  const careerPreferencesMutation = useMutation({
    mutationFn: async (payload: {
      primaryCareerDomain: string;
      secondaryCareerDomains: string[];
      targetRole: string;
      experienceLevel: string;
    }) => {
      const res = await apiClient.put('/users/me', {
        ...payload,
        onboardingCompleted: true,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      updateUser({
        primaryCareerDomain: data.primaryCareerDomain,
        secondaryCareerDomains: data.secondaryCareerDomains,
        targetRole: data.targetRole,
        targetCareerId: data.targetCareerId,
        onboardingCompleted: true,
      });
      // Invalidate all downstream intelligence queries
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['career-snapshot'] });
      queryClient.invalidateQueries({ queryKey: ['careers'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
      queryClient.invalidateQueries({ queryKey: ['orchestrator'] });
      addToast({
        type: 'success',
        message: 'Career direction recalibrated across SkillBridge.',
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to save career preferences';
      addToast({ type: 'error', message: msg });
    },
  });

  // Mutation 4: Secure Logout via /auth/logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    },
    onSuccess: () => {
      clearSession();
      navigate('/login');
    },
    onError: () => {
      clearSession();
      navigate('/login');
    },
  });

  if (isProfileLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 px-4 font-mono">
        <div className="p-12 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[300px]">
          <AIThinkingAnimation statusText="Connecting to Career Identity Center..." />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 px-4 font-mono">
      {/* LOCAL STICKY SECTION NAVIGATOR */}
      <div className="sticky top-2 z-30 p-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-between gap-2 overflow-x-auto text-xs">
        <div className="flex items-center gap-1">
          {[
            { id: 'all', label: 'Complete Profile' },
            { id: 'identity', label: 'Identity & Story' },
            { id: 'direction', label: 'Career Direction' },
            { id: 'evidence', label: 'Evidence Ledger' },
            { id: 'preferences', label: 'Preferences' },
            { id: 'security', label: 'Security & Privacy' },
          ].map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                activeSection === sec.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        <span className="hidden sm:inline-block text-[10px] text-slate-500 pr-3 uppercase">
          SkillBridge Career Identity Center
        </span>
      </div>

      {/* LAYER 01 — EDITORIAL CAREER IDENTITY HERO */}
      {(activeSection === 'all' || activeSection === 'identity') && (
        <section id="section-identity">
          <CareerIdentityHero
            fullName={profile?.fullName || ''}
            email={profile?.email || ''}
            avatarUrl={profile?.avatar || ''}
            targetRole={profile?.targetRole || ''}
            primaryCareerDomain={profile?.primaryCareerDomain || ''}
            location={profile?.location || ''}
            experienceLevel={profile?.experienceLevel || 'entry'}
            bio={profile?.bio || ''}
            onUpdateIdentity={async (data) => {
              await identityMutation.mutateAsync(data);
            }}
            isUpdating={identityMutation.isPending}
          />
        </section>
      )}

      {/* LAYER 02 — CAREER IDENTITY COMPLETENESS (5 PILLARS) */}
      {(activeSection === 'all' || activeSection === 'identity') && (
        <section id="section-completeness">
          <CareerIdentityCompleteness
            hasName={Boolean(profile?.fullName)}
            hasLocation={Boolean(profile?.location)}
            hasBio={Boolean(profile?.bio)}
            hasTargetRole={Boolean(profile?.targetRole)}
            hasDomain={Boolean(profile?.primaryCareerDomain)}
            hasResume={Boolean(resumeData?.originalFileName)}
            totalSkills={totalSkills}
            atsScore={resumeData?.atsScore}
            onNavigate={(route) => navigate(route)}
            onOpenStoryEditor={() => {
              const storySec = document.getElementById('section-story');
              storySec?.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenDirectionEditor={() => setIsDirectionEditorOpen(true)}
          />
        </section>
      )}

      {/* LAYER 03 — WHERE I'M HEADED • CAREER DIRECTION DECK */}
      {(activeSection === 'all' || activeSection === 'direction') && (
        <section id="section-direction">
          <CareerDirectionDeck
            targetRole={profile?.targetRole || ''}
            primaryCareerDomain={profile?.primaryCareerDomain || ''}
            secondaryCareerDomains={profile?.secondaryCareerDomains || []}
            topMatchScore={topMatch ? topMatch.matchScore : null}
            onNavigate={(route) => navigate(route)}
            onEditDirection={() => setIsDirectionEditorOpen(true)}
          />
        </section>
      )}

      {/* LAYER 04 — PROFESSIONAL STORY & NARRATIVE */}
      {(activeSection === 'all' || activeSection === 'identity') && (
        <section id="section-story">
          <ProfessionalStorySection
            bio={profile?.bio || ''}
            extractedResumeSummary={resumeData?.personalInfo?.summary || ''}
            onSaveBio={async (newBio) => {
              await bioMutation.mutateAsync(newBio);
            }}
            isSaving={bioMutation.isPending}
          />
        </section>
      )}

      {/* LAYER 05 — PROFESSIONAL EVIDENCE LEDGER */}
      {(activeSection === 'all' || activeSection === 'evidence') && (
        <section id="section-evidence">
          <ProfessionalEvidenceLedger
            resumeData={resumeData}
            totalSkills={totalSkills}
            skillCategories={skillsData?.categories}
            interviewsCount={interviewsCount}
            interviewsAvgScore={interviewsAvgScore}
            onNavigate={(route) => navigate(route)}
          />
        </section>
      )}

      {/* LAYER 06 — WORKSPACE & ENVIRONMENT PREFERENCES */}
      {(activeSection === 'all' || activeSection === 'preferences') && (
        <section id="section-preferences">
          <ExperiencePreferencesDeck />
        </section>
      )}

      {/* LAYER 07 — ACCOUNT SECURITY, PRIVACY & SESSION */}
      {(activeSection === 'all' || activeSection === 'security') && (
        <section id="section-security">
          <AccountSecurityPrivacyCard
            userId={profile?.id || profile?._id || ''}
            email={profile?.email || ''}
            role={profile?.role || 'User'}
            accountStatus={profile?.accountStatus || profile?.status || 'Active'}
            createdAt={profile?.createdAt}
            onLogout={() => logoutMutation.mutate()}
            isLoggingOut={logoutMutation.isPending}
          />
        </section>
      )}

      {/* MODAL: CAREER DIRECTION & DOMAIN PREFERENCES EDITOR */}
      <CareerPreferencesEditor
        isOpen={isDirectionEditorOpen}
        onClose={() => setIsDirectionEditorOpen(false)}
        currentPrimaryDomain={profile?.primaryCareerDomain || ''}
        currentSecondaryDomains={profile?.secondaryCareerDomains || []}
        currentTargetRole={profile?.targetRole || ''}
        currentExperienceLevel={profile?.experienceLevel || 'entry'}
        onSave={async (data) => {
          await careerPreferencesMutation.mutateAsync(data);
        }}
        isSaving={careerPreferencesMutation.isPending}
      />
    </div>
  );
};

export default CareerIdentityWorkspace;
