import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import apiClient from '../../lib/axios';
import { useToast } from '../../components/composite/Toast';
import { AIThinkingAnimation } from '../../components/experience';
import { PremiumErrorState } from '../../components/experience/workspace';

// Feature Components
import {
  JobSearchCommandCenter,
  OpportunityStreamFeed,
  OpportunityInspector,
  PersonalRelevanceMatrix,
  JobSearchAgentStatusBar,
  OpportunityActivationHub,
  OpportunityItem,
} from '../../features/jobSearch/components';

export const JobSearchAgentWorkspace: React.FC = () => {
  const { addToast } = useToast();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Incoming Opportunity Context Handoff
  const statePayload = location.state as {
    opportunity?: OpportunityItem;
    selectedOpportunity?: OpportunityItem;
    selectedOpportunityId?: string;
    roleTitle?: string;
  } | null;

  const handoffOpp = statePayload?.opportunity || statePayload?.selectedOpportunity || null;
  const handoffId = statePayload?.selectedOpportunityId || handoffOpp?.externalId || null;
  const handoffRole = statePayload?.roleTitle || handoffOpp?.title || null;

  // Search & Filter State
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SAVED'>('LIVE');
  const [searchKeyword, setSearchKeyword] = useState<string>(() => handoffRole || '');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [employmentType, setEmploymentType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'date' | 'salary' | 'relevance'>('match');
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(() => handoffOpp || null);
  const [isCycleRunning, setIsCycleRunning] = useState<boolean>(false);

  // Query 1: Candidate Career Target Roles
  const { data: matchesData } = useQuery({
    queryKey: ['careers', 'matches'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
    },
  });

  const matches = matchesData || [];
  const topMatch = matches[0] || null;
  const targetRoleTitle = topMatch?.careerId?.title || 'Target Career Role';

  // Auto-seed search keyword with target role if blank and no handoff role
  useEffect(() => {
    if (!searchKeyword && targetRoleTitle && targetRoleTitle !== 'Target Career Role') {
      setSearchKeyword(targetRoleTitle);
    }
  }, [targetRoleTitle]);

  // Query 2: Verified User Skills
  const { data: skillsData } = useQuery({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
  });

  const totalSkills =
    skillsData?.totalSkills ??
    (Array.isArray(skillsData?.skills) ? skillsData.skills.length : 0);

  // Query 3: Candidate Career Readiness
  const { data: readinessData } = useQuery({
    queryKey: ['readiness'],
    queryFn: async () => {
      const response = await apiClient.get('/readiness');
      return response.data.data;
    },
  });

  const readinessScore = readinessData?.overallScore || 0;

  // Query 4: Active Resume
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

  // Query 5: Live External Opportunities via OpportunityService & JSearch Provider
  const {
    data: opportunitiesData,
    isLoading: isOpportunitiesLoading,
    error: opportunitiesError,
    refetch: refetchOpportunities,
  } = useQuery({
    queryKey: [
      'opportunities',
      searchKeyword,
      searchLocation,
      remoteOnly,
      employmentType,
      sortBy,
    ],
    queryFn: async () => {
      const response = await apiClient.get('/opportunities', {
        params: {
          search: searchKeyword || undefined,
          location: searchLocation || undefined,
          remote: remoteOnly ? 'true' : undefined,
          employmentType: employmentType !== 'ALL' ? employmentType : undefined,
          sortBy,
          limit: 15,
        },
      });
      return response.data.data;
    },
  });

  // Query 6: Persisted Saved Opportunities
  const { data: savedData, refetch: refetchSaved } = useQuery({
    queryKey: ['opportunities', 'saved'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/opportunities/saved');
        return response.data.data.savedOpportunities || [];
      } catch {
        return [];
      }
    },
  });

  const liveOpportunities: OpportunityItem[] = opportunitiesData?.opportunities || [];
  const providerHealth = opportunitiesData?.providerHealth || { status: 'ONLINE', provider: 'JSearch API' };
  const savedOpportunities: OpportunityItem[] = savedData || [];

  const savedExternalIds = useMemo(() => {
    return new Set(savedOpportunities.map((s) => s.externalId));
  }, [savedOpportunities]);

  // Set initial selected opportunity if none selected or if handoffId is provided
  useEffect(() => {
    const currentList = activeTab === 'LIVE' ? liveOpportunities : savedOpportunities;
    if (handoffId) {
      const match = currentList.find((opp) => opp.externalId === handoffId);
      if (match) {
        setSelectedOpportunity(match);
        return;
      }
    }
    if (currentList.length > 0 && !selectedOpportunity) {
      setSelectedOpportunity(currentList[0]);
    }
  }, [liveOpportunities, savedOpportunities, activeTab, selectedOpportunity, handoffId]);

  // Handle Save / Unsave Mutation
  const handleToggleSave = async (opp: OpportunityItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlySaved = savedExternalIds.has(opp.externalId);

    try {
      if (isCurrentlySaved) {
        await apiClient.delete(`/opportunities/${opp.externalId}/save`);
        addToast({
          type: 'info',
          message: `Removed "${opp.title}" from saved opportunities.`,
        });
      } else {
        await apiClient.post('/opportunities/save', {
          externalId: opp.externalId,
          provider: opp.provider || 'JSearch',
          title: opp.title,
          company: opp.company,
          location: opp.location,
          salary: typeof opp.salary === 'string' ? opp.salary : 'Competitive',
          applicationUrl: opp.applicationUrl,
          postedAt: opp.postedAt,
          skillbridgeMatchScore: opp.skillbridgeMatchScore,
          matchedSkills: opp.matchedSkills || [],
          missingSkills: opp.missingSkills || [],
          description: opp.description,
          employmentType: opp.employmentType,
        });
        addToast({
          type: 'success',
          message: `Saved "${opp.title}" at ${opp.company} to application tracker.`,
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['opportunities', 'saved'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities', 'telemetry'] }),
      ]);
      await refetchSaved();
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to update saved status. Please try again.',
      });
    }
  };

  // Handle Application Pipeline Status Update
  const handleUpdateStatus = async (status: string) => {
    if (!selectedOpportunity) return;
    try {
      await apiClient.patch(`/opportunities/saved/${selectedOpportunity.externalId}/status`, {
        status,
      });
      addToast({
        type: 'success',
        message: `Application funnel updated to "${status.toUpperCase()}".`,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['opportunities', 'saved'] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities', 'telemetry'] }),
      ]);
      await refetchSaved();
      // Update local state
      setSelectedOpportunity((prev) => (prev ? { ...prev, status } : null));
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to update application status.',
      });
    }
  };

  // Execute Agent Search Cycle
  const handleExecuteSearch = async () => {
    setIsCycleRunning(true);
    try {
      await refetchOpportunities();
      addToast({
        type: 'success',
        message: 'Job Search Agent cycle completed. Fresh opportunities indexed.',
      });
    } catch {
      addToast({
        type: 'error',
        message: 'Failed to refresh opportunities.',
      });
    } finally {
      setIsCycleRunning(false);
    }
  };

  // Reset Filters to Target Role
  const handleResetFilters = () => {
    setSearchKeyword(targetRoleTitle);
    setSearchLocation('');
    setRemoteOnly(false);
    setEmploymentType('ALL');
    setSortBy('match');
  };

  if (isOpportunitiesLoading && liveOpportunities.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-16 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[320px]">
          <AIThinkingAnimation statusText="Autonomous Job Search Agent Querying Live Employer Feeds..." />
        </div>
      </div>
    );
  }

  if (opportunitiesError) {
    return (
      <div className="max-w-7xl mx-auto pb-12 px-4">
        <PremiumErrorState
          title="Job Search Provider Connection Failed"
          message={`Unable to retrieve opportunities: ${(opportunitiesError as Error).message}`}
          onRetry={() => refetchOpportunities()}
        />
      </div>
    );
  }

  const currentList = activeTab === 'LIVE' ? liveOpportunities : savedOpportunities;

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16 px-4">
      {/* 1. HERO / SEARCH COMMAND CENTER */}
      <JobSearchCommandCenter
        searchKeyword={searchKeyword}
        onSearchKeywordChange={setSearchKeyword}
        searchLocation={searchLocation}
        onSearchLocationChange={setSearchLocation}
        remoteOnly={remoteOnly}
        onRemoteOnlyToggle={() => setRemoteOnly(!remoteOnly)}
        employmentType={employmentType}
        onEmploymentTypeChange={setEmploymentType}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        targetRoleTitle={targetRoleTitle}
        totalSkills={totalSkills}
        readinessScore={readinessScore}
        providerStatus={providerHealth.status}
        isSearching={isCycleRunning || isOpportunitiesLoading}
        onExecuteSearch={handleExecuteSearch}
      />

      {/* 2. AGENT EXECUTION STATUS BAR */}
      <JobSearchAgentStatusBar
        isSearching={isCycleRunning || isOpportunitiesLoading}
        providerStatus={providerHealth.status}
        totalFound={currentList.length}
      />

      {/* 3. PRIMARY OPPORTUNITY CANVAS (3-COLUMN LAYOUT) */}
      {currentList.length === 0 ? (
        <OpportunityActivationHub
          onResetFilters={handleResetFilters}
          targetRoleTitle={targetRoleTitle}
          hasResume={!!resumeData}
          totalSkills={totalSkills}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Opportunity Stream (4 Cols) */}
          <div className="lg:col-span-4">
            <OpportunityStreamFeed
              activeTab={activeTab}
              onTabChange={setActiveTab}
              liveOpportunities={liveOpportunities}
              savedOpportunities={savedOpportunities}
              selectedId={selectedOpportunity?.externalId}
              onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
              savedExternalIds={savedExternalIds}
              onToggleSave={handleToggleSave}
              isLoading={isOpportunitiesLoading}
            />
          </div>

          {/* Column 2: Selected Opportunity Inspector (5 Cols) */}
          <div className="lg:col-span-5">
            <OpportunityInspector
              opportunity={selectedOpportunity}
              isSaved={selectedOpportunity ? savedExternalIds.has(selectedOpportunity.externalId) : false}
              onToggleSave={handleToggleSave}
              onUpdateStatus={handleUpdateStatus}
              status={selectedOpportunity?.status || 'saved'}
            />
          </div>

          {/* Column 3: Personal Relevance Matrix (3 Cols) */}
          <div className="lg:col-span-3">
            <PersonalRelevanceMatrix
              opportunity={selectedOpportunity}
              targetRoleTitle={targetRoleTitle}
              userSkillsCount={totalSkills}
            />
          </div>
        </div>
      )}
    </div>
  );
};

JobSearchAgentWorkspace.displayName = 'JobSearchAgentWorkspace';
export default JobSearchAgentWorkspace;
