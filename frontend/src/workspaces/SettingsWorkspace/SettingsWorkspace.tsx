import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Sparkles,
  Award,
  Lock,
  Compass,
  Layers,
  FileText,
  CheckCircle2,
  Sliders,
  LogOut,
  Bell,
  Cpu,
  Edit3,
  Check,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { CAREER_DOMAINS, SECONDARY_INTEREST_TAGS } from '../../features/onboarding/careerDomains';

// Feature Components
import { SettingsWorkspaceHeader } from '../../features/user/components/SettingsWorkspaceHeader';
import { ProfileEditor } from '../../features/user/components/ProfileEditor';
import { AppearanceSettings } from '../../features/user/components/AppearanceSettings';
import { NotificationPreferences } from '../../features/user/components/NotificationPreferences';
import { SecuritySettings } from '../../features/user/components/SecuritySettings';
import { DangerZoneCard } from '../../features/user/components/DangerZoneCard';

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
} from '../../components/experience/workspace';
import { AIThinkingAnimation } from '../../components/experience';

export const SettingsWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, clearSession, updateUser, refreshToken } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Query 1: Fetch profile from /users/me
  const {
    data: dbProfile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me');
      return response.data.data;
    },
  });

  // Query 2: Active Resume Metadata
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

  // Query 3: Verified User Skills
  const { data: skillsData } = useQuery({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
  });

  // Query 4: Target Career Matches
  const { data: matchesData } = useQuery({
    queryKey: ['careers', 'matches'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
    },
  });

  // Query 5: Analytics & Recent Events
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', 'monthly'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics?period=monthly');
      return response.data.data;
    },
  });

  // Mutation: Update profile via PUT /users/me
  const updateMutation = useMutation({
    mutationFn: async (data: { fullName: string; avatar: string }) => {
      const response = await apiClient.put('/users/me', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      updateUser({
        fullName: data.fullName,
        avatar: data.avatar,
        profileCompleted: data.profileCompleted,
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  // Mutation: Logout via POST /auth/logout
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

  const profile = dbProfile || user;

  // Career Preferences Editing State
  const [isEditingDomain, setIsEditingDomain] = useState(false);
  const [editDomainId, setEditDomainId] = useState('software-engineering');
  const [editRole, setEditRole] = useState('');
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [domainSaveSuccess, setDomainSaveSuccess] = useState(false);

  const startEditingDomain = () => {
    const currentDomainName = profile?.primaryCareerDomain || '';
    const matchDomain = CAREER_DOMAINS.find(
      (d) => d.name.toLowerCase() === currentDomainName.toLowerCase() || d.id === currentDomainName
    );
    const domainId = matchDomain ? matchDomain.id : 'software-engineering';
    setEditDomainId(domainId);
    setEditRole(profile?.targetRole || (matchDomain ? matchDomain.name : 'Software Engineering'));
    setEditInterests(profile?.secondaryCareerDomains || []);
    setIsEditingDomain(true);
    setDomainSaveSuccess(false);
  };

  const domainMutation = useMutation({
    mutationFn: async (payload: {
      primaryCareerDomain: string;
      secondaryCareerDomains: string[];
      targetRole: string;
    }) => {
      const response = await apiClient.put('/users/me', {
        ...payload,
        onboardingCompleted: true,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      updateUser({
        primaryCareerDomain: data.primaryCareerDomain,
        secondaryCareerDomains: data.secondaryCareerDomains,
        targetRole: data.targetRole,
        targetCareerId: data.targetCareerId,
        onboardingCompleted: true,
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['career-snapshot'] });
      queryClient.invalidateQueries({ queryKey: ['careers'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setDomainSaveSuccess(true);
      setTimeout(() => {
        setIsEditingDomain(false);
        setDomainSaveSuccess(false);
      }, 1000);
    },
  });

  const matches = useMemo(() => matchesData || [], [matchesData]);
  const topMatch = matches[0] || null;
  const totalSkills = skillsData?.totalSkills || 0;
  const recentEvents = analyticsData?.recentEvents || [];

  // Extract user skills
  const userSkillList = useMemo(() => {
    if (!skillsData?.categories) return [];
    return Object.values(skillsData.categories).flatMap((items: unknown) => items as Array<{ name: string }>);
  }, [skillsData]);

  // Dynamic Profile Completeness calculation
  const profileCompleteness = useMemo(() => {
    let score = 0;
    if (profile?.fullName) score += 20;
    if (profile?.email) score += 20;
    if (profile?.avatar) score += 15;
    if (resumeData) score += 15;
    if (matches.length > 0) score += 15;
    if (totalSkills > 0) score += 15;
    return Math.min(100, score);
  }, [profile, resumeData, matches, totalSkills]);

  const targetRoleTitle = topMatch?.careerId?.title || 'Target Role';
  const careerGoalAlignment = topMatch ? topMatch.matchScore : 0;

  // Quick Action Grid Items
  const quickActions = [
    {
      id: 'profile',
      title: 'Edit Profile',
      subtitle: 'Update identity & details',
      icon: User,
      shortcut: '⌘1',
      color: 'text-indigo-400',
      onClick: () => {
        const el = document.getElementById('profile-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'roadmap',
      title: 'Continue Roadmap',
      subtitle: 'Execute milestone tasks',
      icon: Layers,
      shortcut: '⌘2',
      color: 'text-purple-400',
      onClick: () => navigate('/roadmap'),
    },
    {
      id: 'resume',
      title: 'Manage Resume',
      subtitle: resumeData ? `ATS Score: ${resumeData.atsScore || 85}/100` : 'Upload resume for ATS audit',
      icon: FileText,
      shortcut: '⌘3',
      color: 'text-amber-400',
      onClick: () => navigate('/resume'),
    },
    {
      id: 'careers',
      title: 'Career Intelligence',
      subtitle: topMatch ? `${topMatch.matchScore}% Match Fit` : 'Target role match fit',
      icon: Compass,
      shortcut: '⌘4',
      color: 'text-emerald-400',
      onClick: () => navigate('/careers'),
    },
    {
      id: 'security',
      title: 'Security Center',
      subtitle: 'Password & session audit',
      icon: Lock,
      shortcut: '⌘5',
      color: 'text-cyan-400',
      onClick: () => {
        const el = document.getElementById('security-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'logout',
      title: 'Sign Out',
      subtitle: 'Terminate current session',
      icon: LogOut,
      shortcut: '⌘6',
      color: 'text-rose-400',
      onClick: () => logoutMutation.mutate(),
    },
  ];

  if (isProfileLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Connecting to Personal AI Control Center..." />
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Profile Connection Error"
          message={`Failed to retrieve profile data: ${(profileError as Error).message}`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4">
      {/* SECTION 1 — WORKSPACE HERO */}
      <WorkspaceHero
        greeting="Personal AI Headquarters"
        userName={profile?.fullName || user?.fullName || user?.email?.split('@')[0]}
        title="Profile & Settings"
        description="Manage your identity, career preferences, AI personalization, privacy, and workspace experience from one intelligent control center."
        aiSummary={`Profile Completeness: ${profileCompleteness}% • Target Role: ${targetRoleTitle} • Email: ${profile?.email}`}
        stats={[
          { label: 'Profile Completion', value: `${profileCompleteness}%`, change: profileCompleteness === 100 ? 'Fully Verified' : 'In Progress', isPositive: profileCompleteness >= 70 },
          { label: 'Target Role Fit', value: topMatch ? `${careerGoalAlignment}%` : 'Not Selected', change: targetRoleTitle, isPositive: careerGoalAlignment >= 50 },
          { label: 'Verified Skills', value: `${totalSkills} Skills`, change: 'Taxonomy Indexed', isPositive: totalSkills > 0 },
          { label: 'Resume Vault', value: resumeData ? 'Active' : 'Missing', change: resumeData ? resumeData.originalFileName : 'Upload Required', isPositive: !!resumeData },
        ]}
        primaryAction={{
          label: 'Edit Profile Information',
          onClick: () => {
            const el = document.getElementById('profile-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          },
        }}
      />

      {/* SECTION 11 — COMMAND TOOLBAR */}
      <WorkspaceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search profile details, preferences, or security settings..."
        filterOptions={[
          { id: 'all', label: 'All Settings' },
          { id: 'profile', label: 'Profile' },
          { id: 'personalization', label: 'Personalization' },
          { id: 'security', label: 'Security' },
        ]}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onCommandPaletteOpen={() => alert('Command Palette triggered (⌘K).')}
      />

      {/* SECTION 2 — PROFILE OVERVIEW (METRIC CARDS) */}
      <PremiumSection
        title="Account Telemetry Overview"
        subtitle="Identity completeness, security protection, and AI personalization status"
        badge="Account Status"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PremiumMetricCard
            title="Profile Completeness"
            value={profileCompleteness}
            suffix="%"
            trend={profileCompleteness === 100 ? 'Fully Verified' : 'Completion Active'}
            isPositive={profileCompleteness >= 70}
            confidence={99.1}
            icon={User}
            sparklineData={[Math.max(0, profileCompleteness - 30), Math.max(0, profileCompleteness - 15), profileCompleteness]}
          />
          <PremiumMetricCard
            title="Target Role Alignment"
            value={careerGoalAlignment}
            suffix="%"
            trend={targetRoleTitle}
            isPositive={careerGoalAlignment >= 50}
            confidence={98.6}
            icon={Compass}
            sparklineData={[Math.max(0, careerGoalAlignment - 20), careerGoalAlignment]}
          />
          <PremiumMetricCard
            title="Connected Vault & SSO"
            value={resumeData ? 2 : 1}
            suffix=" Services"
            trend="Password & Vault"
            isPositive={true}
            confidence={99.5}
            icon={Award}
            sparklineData={[1, resumeData ? 2 : 1]}
          />
          <PremiumMetricCard
            title="Verified Skill Index"
            value={totalSkills}
            suffix=" Skills"
            trend={totalSkills > 0 ? 'Taxonomy Synced' : 'No Skills Indexed'}
            isPositive={totalSkills > 0}
            confidence={97.8}
            icon={Sliders}
            sparklineData={[Math.max(0, totalSkills - 5), totalSkills]}
          />
          <PremiumMetricCard
            title="Security & Safety Index"
            value={100}
            suffix="%"
            trend="JWT Session Active"
            isPositive={true}
            confidence={99.2}
            icon={ShieldCheck}
            sparklineData={[90, 95, 100]}
          />
          <PremiumMetricCard
            title="AI Advisor Personalization"
            value={profileCompleteness >= 70 ? 98 : 60}
            suffix="%"
            trend="Grounded Engine"
            isPositive={profileCompleteness >= 70}
            confidence={98.6}
            icon={Sparkles}
            sparklineData={[60, 80, profileCompleteness >= 70 ? 98 : 60]}
          />
        </div>
      </PremiumSection>

      {/* SECTION 3 — AI PERSONALIZATION SUMMARY BANNER */}
      <AIInsightBanner
        title={`Personal AI Advisor Profile: ${profileCompleteness >= 70 ? 'Active & Grounded' : 'Onboarding Initialized'}`}
        description={
          profileCompleteness >= 70
            ? `Your personal telemetry grounds AI career guidance specifically for ${targetRoleTitle} with ${totalSkills} verified skills.`
            : 'Complete your profile details, upload your ATS resume, or select a target career role to activate personalized AI recommendations.'
        }
        confidence={98.6}
        priority={profileCompleteness < 70 ? 'high' : 'medium'}
        evidence={[
          `Profile Completeness: ${profileCompleteness}%`,
          `Target Role: ${targetRoleTitle}`,
          `Verified Skills: ${totalSkills}`
        ]}
        actionLabel="Manage Preferences"
        onAction={() => {
          const el = document.getElementById('personalization-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <WorkspaceDivider label="Identity & Personalization" />

      {/* SECTION 4 — PERSONAL PROFILE EDITOR */}
      <div id="profile-section" className="space-y-6">
        <SettingsWorkspaceHeader />

        <ProfileEditor
          fullName={profile?.fullName || ''}
          avatarUrl={profile?.avatar || ''}
          email={profile?.email || ''}
          onSave={(data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isPending}
          isSuccess={updateMutation.isSuccess}
          error={
            profileError
              ? (profileError as Error).message
              : updateMutation.isError
              ? (updateMutation.error as Error).message
              : undefined
          }
        />
      </div>

      {/* SECTION 5 — AI PERSONALIZATION & PREFERENCES */}
      <div id="personalization-section" className="space-y-6">
        <PremiumSection
          title="AI Personalization & Preference Engine"
          subtitle="Configure how AI algorithms adapt recommendations, notifications, and visual UI"
          badge="AI Preferences"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassPanel className="p-6 space-y-4 border-indigo-500/30">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Target Career Domain & Specific Role
                </span>
                {!isEditingDomain && (
                  <button
                    type="button"
                    onClick={startEditingDomain}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Preferences</span>
                  </button>
                )}
              </div>

              {!isEditingDomain ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center p-3 bg-slate-950/80 rounded-xl border border-white/10">
                    <span className="text-slate-400">Primary Domain:</span>
                    <strong className="text-cyan-300">{profile?.primaryCareerDomain || 'Not Selected'}</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950/80 rounded-xl border border-white/10">
                    <span className="text-slate-400">Target Role Title:</span>
                    <strong className="text-emerald-300">{profile?.targetRole || 'Not Specified'}</strong>
                  </div>
                  {profile?.secondaryCareerDomains && profile.secondaryCareerDomains.length > 0 && (
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-white/10 space-y-1">
                      <span className="text-slate-400 block text-[10px]">Specializations:</span>
                      <div className="flex flex-wrap gap-1">
                        {profile.secondaryCareerDomains.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 pt-1 font-mono text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[11px]">Primary Career Domain:</label>
                    <select
                      aria-label="Career domain"
                      value={editDomainId}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setEditDomainId(newId);
                        const found = CAREER_DOMAINS.find(d => d.id === newId);
                        if (found) setEditRole(found.name);
                        setEditInterests([]);
                      }}
                      className="w-full bg-slate-900/90 border border-white/20 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      {CAREER_DOMAINS.map(d => (
                        <option key={d.id} value={d.id} className="bg-slate-950 text-white">
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[11px]">Target Role Title:</label>
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      placeholder="e.g. Lead Security Architect"
                      className="w-full bg-slate-900/90 border border-white/20 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 block text-[11px]">Specializations (Select up to 5):</label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-900/40 rounded-xl border border-white/5">
                      {(SECONDARY_INTEREST_TAGS[editDomainId] || SECONDARY_INTEREST_TAGS['software-engineering'] || []).map(tag => {
                        const isSelected = editInterests.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setEditInterests(editInterests.filter(t => t !== tag));
                              } else {
                                if (editInterests.length < 5) setEditInterests([...editInterests, tag]);
                              }
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-500 text-black font-bold'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={domainMutation.isPending || !editRole.trim()}
                      onClick={() => {
                        const domainObj = CAREER_DOMAINS.find(d => d.id === editDomainId) || CAREER_DOMAINS[0];
                        domainMutation.mutate({
                          primaryCareerDomain: domainObj.name,
                          secondaryCareerDomains: editInterests,
                          targetRole: editRole.trim(),
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-linear-to-r from-indigo-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {domainSaveSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Saved!</span>
                        </>
                      ) : domainMutation.isPending ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingDomain(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-white/5">
                Updating your target career domain recalculates taxonomy matches, readiness scores, recommendations, and live job search context across all 12 workspaces.
              </p>
            </GlassPanel>

            <GlassPanel className="p-6 space-y-4 border-indigo-500/30">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Target Tech Stack & Verified Skills ({userSkillList.length})
              </span>
              {userSkillList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-950/60 rounded-lg">
                  No verified skills recorded yet. Upload a resume or add skills in Skill Intelligence to ground your tech stack.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userSkillList.slice(0, 10).map((skill: { name: string }, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-semibold"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-white/5">
                AI continuously weights job market postings using your verified tech stack.
              </p>
            </GlassPanel>

            <GlassPanel className="p-6 space-y-4 border-purple-500/30">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-400" />
                Recommendation & Notification Rules
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prioritize high-ROI action items, milestone roadmaps, and instant ATS resume optimization alerts.
              </p>
              <div className="pt-2">
                <NotificationPreferences />
              </div>
            </GlassPanel>
          </div>

          <div className="pt-4">
            <AppearanceSettings />
          </div>
        </PremiumSection>
      </div>

      <WorkspaceDivider label="Security & Governance" />

      {/* SECTION 6 — SECURITY CENTER */}
      <div id="security-section" className="space-y-6">
        <PremiumSection
          title="Security & Account Governance"
          subtitle="Password, active sessions, role permissions, and account status"
          badge="Security Center"
        >
          <SecuritySettings
            userId={profile?.id || profile?._id}
            email={profile?.email}
            role={profile?.role || 'User'}
            accountStatus={profile?.accountStatus || 'Active'}
            authProvider={profile?.authProvider || 'local'}
            onLogout={() => logoutMutation.mutate()}
            isLoggingOut={logoutMutation.isPending}
          />
        </PremiumSection>

        <DangerZoneCard onConfirmLogout={() => logoutMutation.mutate()} />
      </div>

      {/* SECTION 7 — ACCOUNT SPOTLIGHT */}
      <WorkspaceSpotlight
        badge="Highest-Impact Security & Identity Setup"
        title="Complete Resume Vault Upload & Identity Verification"
        description="Uploading your ATS resume file unlocks instant skill vector parsing, career readiness scoring, and automated recruiter matching."
        impactScore="+15% Profile Completeness"
        actionLabel="Manage Resume Vault"
        onAction={() => navigate('/resume')}
      />

      {/* SECTION 8 — CONNECTED SERVICES */}
      <PremiumSection
        title="Connected Authentication & Storage Services"
        subtitle="Active identity providers and secure document vaults"
        badge="Integrations"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'Local Password Auth',
              status: 'Connected',
              desc: 'Single sign-on authentication service.'
            },
            {
              name: 'Resume Document Vault',
              status: resumeData ? 'Connected' : 'Missing',
              desc: resumeData ? `Encrypted file: ${resumeData.originalFileName}` : 'No resume file uploaded yet.'
            },
            {
              name: 'Encrypted Session Token',
              status: 'Active',
              desc: 'Secure JWT token authentication session.'
            },
          ].map((srv, idx) => (
            <GlassPanel key={idx} className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">{srv.name}</h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${srv.status === 'Connected' || srv.status === 'Active' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'}`}>
                  {srv.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">{srv.desc}</p>
            </GlassPanel>
          ))}
        </div>
      </PremiumSection>

      {/* SECTION 9 — ACCOUNT ACTIVITY LOG */}
      <PremiumSection
        title="Recent Account Activity Log"
        subtitle="Audit trail of security events, profile updates, and settings changes"
        badge="Audit Trail"
      >
        <div className="space-y-3">
          {recentEvents.length === 0 ? (
            <GlassPanel className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white">Authenticated Session Established</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Active</span>
            </GlassPanel>
          ) : (
            recentEvents.slice(0, 5).map((evt: { _id: string; eventType: string; createdAt: string | number | Date; details?: { fileName?: string; skillName?: string } }) => (
              <GlassPanel key={evt._id} className="p-4 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-white">{evt.eventType.replace(/_/g, ' ')}</span>
                  </div>
                  {evt.details?.fileName && <p className="text-slate-400 pl-6 text-xs">File: {evt.details.fileName}</p>}
                  {evt.details?.skillName && <p className="text-slate-400 pl-6 text-xs">Skill: {evt.details.skillName}</p>}
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-4">
                  {new Date(evt.createdAt).toLocaleString()}
                </span>
              </GlassPanel>
            ))
          )}
        </div>
      </PremiumSection>

      {/* SECTION 10 — QUICK ACTIONS GRID */}
      <PremiumSection
        title="Profile Operations Shortcuts"
        subtitle="Quick access to account tools and career engines"
        badge="Shortcuts"
      >
        <QuickActionGrid actions={quickActions} columns={3} />
      </PremiumSection>

      {/* SECTION 12 — AI STATUS BAR */}
      <AIStatusBar
        status={isProfileLoading ? 'thinking' : 'active'}
        confidence={98.6}
        lastUpdated="Just now"
      />
    </div>
  );
};

export default SettingsWorkspace;
