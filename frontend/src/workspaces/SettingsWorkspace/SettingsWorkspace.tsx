import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  User,
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
import { openCommandPalette } from '../../components/composite/CommandPalette';
import { PageSkeleton } from '../../design/aurora/kit';
import { useAuthStore } from '../../store/authStore';
import { CAREER_DOMAINS, SECONDARY_INTEREST_TAGS } from '../../features/onboarding/careerDomains';

// Feature Components
import { SettingsWorkspaceHeader } from '../../features/user/components/SettingsWorkspaceHeader';
import { ProfileEditor } from '../../features/user/components/ProfileEditor';
import { AppearanceSettings } from '../../features/user/components/AppearanceSettings';
import { NotificationPreferences } from '../../features/user/components/NotificationPreferences';
import { SecuritySettings } from '../../features/user/components/SecuritySettings';
import { DangerZoneCard } from '../../features/user/components/DangerZoneCard';
import { DeleteAccountCard } from '../../features/user/components/DeleteAccountCard';

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
    // The bare list is cached under its own key: ['careers', 'matches'] holds { matches }
    queryKey: ['careers', 'matches', 'list'],
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
      color: 'text-aurora-indigo',
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
      color: 'text-aurora-violet',
      onClick: () => navigate('/roadmap'),
    },
    {
      id: 'resume',
      title: 'Manage Resume',
      subtitle: resumeData ? resumeData.originalFileName : 'Upload a resume',
      icon: FileText,
      shortcut: '⌘3',
      color: 'text-amber-700',
      onClick: () => navigate('/resume'),
    },
    {
      id: 'careers',
      title: 'Career Intelligence',
      subtitle: topMatch ? `${topMatch.matchScore}% Match Fit` : 'Target role match fit',
      icon: Compass,
      shortcut: '⌘4',
      color: 'text-emerald-700',
      onClick: () => navigate('/careers'),
    },
    {
      id: 'security',
      title: 'Security Center',
      subtitle: 'Password & session audit',
      icon: Lock,
      shortcut: '⌘5',
      color: 'text-aurora-violet',
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
      color: 'text-rose-700',
      onClick: () => logoutMutation.mutate(),
    },
  ];

  if (isProfileLoading) {
    return <PageSkeleton label="Loading your settings" />;
  }

  if (profileError) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Your settings could not be loaded"
          message={(profileError as Error).message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16 px-4">
      {/* SECTION 1 — WORKSPACE HERO */}
      <WorkspaceHero
        greeting="Your account"
        userName={profile?.fullName || user?.fullName || user?.email?.split('@')[0]}
        title="Profile & Settings"
        description="Manage your details, career preferences, notifications and security."
        aiSummary={`Profile Completeness: ${profileCompleteness}% • Target Role: ${targetRoleTitle} • Email: ${profile?.email}`}
        stats={[
          { label: 'Profile Completion', value: `${profileCompleteness}%`, change: profileCompleteness === 100 ? 'Complete' : 'In Progress', isPositive: profileCompleteness >= 70 },
          { label: 'Target Role Fit', value: topMatch ? `${careerGoalAlignment}%` : 'Not Selected', change: targetRoleTitle, isPositive: careerGoalAlignment >= 50 },
          { label: 'Skills on Profile', value: `${totalSkills} Skills`, change: 'From your records', isPositive: totalSkills > 0 },
          { label: 'Resume', value: resumeData ? 'Uploaded' : 'None', change: resumeData ? resumeData.originalFileName : 'Upload required', isPositive: !!resumeData },
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
        onCommandPaletteOpen={openCommandPalette}
      />

      {/* SECTION 2 — PROFILE OVERVIEW (METRIC CARDS) */}
      <PremiumSection
        title="Account overview"
        subtitle="Figures from your own records. Profile completeness counts name, email, photo, resume, career matches and skills."
        badge="Your account"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PremiumMetricCard title="Profile completeness" value={profileCompleteness} suffix="%" trend={profileCompleteness === 100 ? 'Complete' : 'Add the missing items below'} icon={User} />
          <PremiumMetricCard
            title="Closest career match"
            value={topMatch ? `${careerGoalAlignment}%` : 'None yet'}
            trend={topMatch ? `${targetRoleTitle}; not a hiring prediction` : 'Upload a resume to see matches'}
            icon={Compass}
          />
          <PremiumMetricCard title="Skills on your profile" value={totalSkills} trend={totalSkills > 0 ? 'From your resume and records' : 'None recorded yet'} icon={Sliders} />
          <PremiumMetricCard title="Resume" value={resumeData ? 'Uploaded' : 'None'} trend={resumeData ? resumeData.originalFileName : 'Upload one on the Resume page'} icon={FileText} />
        </div>
      </PremiumSection>

      {/* SECTION 3 — AI PERSONALIZATION SUMMARY BANNER */}
      <AIInsightBanner
        title={profileCompleteness >= 70 ? 'Your guidance uses this profile' : 'Complete your profile for better guidance'}
        description={
          profileCompleteness >= 70
            ? `Recommendations and the assistant use your target role (${targetRoleTitle}) and the ${totalSkills} skills on your profile.`
            : 'Add your details, upload a resume or choose a target role so recommendations can use them.'
        }
        priority={profileCompleteness < 70 ? 'high' : 'medium'}
        evidence={[
          `Profile Completeness: ${profileCompleteness}%`,
          `Target Role: ${targetRoleTitle}`,
          `Skills on Profile: ${totalSkills}`
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
            <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-aurora-ink flex items-center gap-2">
                  <Compass className="w-4 h-4 text-aurora-violet" />
                  Target Career Domain & Specific Role
                </span>
                {!isEditingDomain && (
                  <button
                    type="button"
                    onClick={startEditingDomain}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-aurora-violet hover:text-aurora-violet hover:bg-aurora-violet/[0.06] border border-aurora-violet/25 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Preferences</span>
                  </button>
                )}
              </div>

              {!isEditingDomain ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-3 bg-aurora-canvas/60 rounded-xl border border-aurora-line">
                    <span className="text-aurora-muted">Primary Domain:</span>
                    <strong className="text-aurora-violet">{profile?.primaryCareerDomain || 'Not Selected'}</strong>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-aurora-canvas/60 rounded-xl border border-aurora-line">
                    <span className="text-aurora-muted">Target Role Title:</span>
                    <strong className="text-emerald-700">{profile?.targetRole || 'Not Specified'}</strong>
                  </div>
                  {profile?.secondaryCareerDomains && profile.secondaryCareerDomains.length > 0 && (
                    <div className="p-3 bg-aurora-canvas/60 rounded-xl border border-aurora-line space-y-1">
                      <span className="text-aurora-muted block text-[10px]">Specializations:</span>
                      <div className="flex flex-wrap gap-1">
                        {profile.secondaryCareerDomains.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded bg-purple-500/10 text-aurora-violet text-[10px] font-bold border border-purple-500/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 pt-1 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-aurora-muted block text-[11px]">Primary Career Domain:</label>
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
                      className="w-full bg-aurora-canvas/60 border border-aurora-line rounded-xl p-2.5 text-aurora-ink text-xs focus:outline-none focus:border-cyan-500"
                    >
                      {CAREER_DOMAINS.map(d => (
                        <option key={d.id} value={d.id} className="bg-aurora-canvas text-aurora-ink">
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-aurora-muted block text-[11px]">Target Role Title:</label>
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      placeholder="e.g. Lead Security Architect"
                      className="w-full bg-aurora-canvas/60 border border-aurora-line rounded-xl p-2.5 text-aurora-ink text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-aurora-muted block text-[11px]">Specializations (Select up to 5):</label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-aurora-canvas/60 rounded-xl border border-aurora-line">
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
                                : 'bg-aurora-canvas text-aurora-muted hover:bg-aurora-line'
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
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
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
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-aurora-muted hover:text-aurora-indigo hover:bg-aurora-canvas transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-aurora-muted leading-relaxed pt-2 border-t border-aurora-line">
                Updating your target career domain recalculates taxonomy matches, readiness scores, recommendations, and job search context across your workspaces.
              </p>
            </GlassPanel>

            <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
              <span className="text-sm font-bold text-aurora-ink flex items-center gap-2">
                <Cpu className="w-4 h-4 text-aurora-violet" />
                Target Tech Stack & Skills ({userSkillList.length})
              </span>
              {userSkillList.length === 0 ? (
                <div className="p-4 text-center text-xs text-aurora-muted italic bg-aurora-canvas/60 rounded-lg">
                  No skills recorded yet. Upload a resume or add skills in Skill Intelligence to ground your tech stack.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {userSkillList.slice(0, 10).map((skill: { name: string }, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo text-xs font-semibold"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-aurora-muted leading-relaxed pt-2 border-t border-aurora-line">
                Job listings are ranked against the skills on your profile.
              </p>
            </GlassPanel>

            <GlassPanel className="p-6 space-y-4 border-purple-500/30">
              <span className="text-sm font-bold text-aurora-ink flex items-center gap-2">
                <Bell className="w-4 h-4 text-aurora-violet" />
                Recommendation & Notification Rules
              </span>
              <p className="text-xs text-aurora-muted leading-relaxed">
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
        <DeleteAccountCard />
      </div>

      {/* SECTION 7 — ACCOUNT SPOTLIGHT */}
      <WorkspaceSpotlight
        badge="Highest-Impact Security & Identity Setup"
        title="Upload your resume"
        description="Your skills, career matches and readiness are calculated from it."
        impactScore="+15% Profile Completeness"
        actionLabel="Go to Resume"
        onAction={() => navigate('/resume')}
      />

      {/* SECTION 8 — CONNECTED SERVICES */}
      <PremiumSection
        title="How you sign in and what is stored"
        subtitle="SkillBridge has no external sign-in or storage services"
        badge="Account"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              name: 'Email and password',
              status: 'Active',
              desc: 'Your password is stored as a bcrypt hash.'
            },
            {
              name: 'Resume file',
              status: resumeData ? 'Stored' : 'None',
              desc: resumeData ? `${resumeData.originalFileName}, stored on this SkillBridge server and visible only to your account.` : 'No resume file uploaded yet.'
            },
            {
              name: 'Session',
              status: 'Active',
              desc: 'A signed token keeps you signed in; signing out revokes it.'
            },
          ].map((srv, idx) => (
            <GlassPanel key={idx} className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-aurora-ink">{srv.name}</h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${srv.status === 'Stored' || srv.status === 'Active' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
                  {srv.status}
                </span>
              </div>
              <p className="text-xs text-aurora-muted">{srv.desc}</p>
            </GlassPanel>
          ))}
        </div>
      </PremiumSection>

      {/* SECTION 9 — ACCOUNT ACTIVITY LOG */}
      <PremiumSection
        title="Recent activity"
        subtitle="The latest things recorded on your account"
        badge="Activity"
      >
        <div className="space-y-3">
          {recentEvents.length === 0 ? (
            <GlassPanel className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-bold text-aurora-ink">Nothing recorded yet</span>
              </div>
            </GlassPanel>
          ) : (
            recentEvents.slice(0, 5).map((evt: { _id: string; eventType: string; createdAt: string | number | Date; details?: { fileName?: string; skillName?: string } }) => (
              <GlassPanel key={evt._id} className="p-4 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-bold text-aurora-ink">{evt.eventType.replace(/_/g, ' ')}</span>
                  </div>
                  {evt.details?.fileName && <p className="text-aurora-muted pl-6 text-xs">File: {evt.details.fileName}</p>}
                  {evt.details?.skillName && <p className="text-aurora-muted pl-6 text-xs">Skill: {evt.details.skillName}</p>}
                </div>
                <span className="text-[10px] text-aurora-muted shrink-0 ml-4">
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
        provider="Your profile"
        status={isProfileLoading ? 'thinking' : 'active'}
      />
    </div>
  );
};

export default SettingsWorkspace;
