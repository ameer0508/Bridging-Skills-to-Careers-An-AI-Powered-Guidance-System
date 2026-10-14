import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import apiClient from '../../lib/axios';
import { useToast } from '../../components/composite/Toast';
import { Notice, PageSkeleton } from '../../design/aurora/kit';
import { auroraButtonClass } from '../../design/aurora/buttonStyles';

// Feature Components
import {
  JobSearchCommandCenter,
  OpportunityStreamFeed,
  OpportunityInspector,
  PersonalRelevanceMatrix,
  JobSearchAgentStatusBar,
  OpportunityActivationHub,
  SearchResultsNotice,
  ApplicationTrackerPanel,
  OpportunityItem,
  type OpportunitySearchMeta,
} from '../../features/jobSearch/components';
import { primaryReadiness } from '../../lib/readiness';

type SortKey = 'match' | 'date' | 'salary' | 'relevance';

interface OpportunitySearchResult {
  opportunities: OpportunityItem[];
  providerHealth: { status: string; provider: string; message?: string };
  meta?: OpportunitySearchMeta;
}

const PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

const errorMessage = (error: unknown, fallback: string): string =>
  typeof (error as { message?: unknown })?.message === 'string' ? (error as { message: string }).message : fallback;

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

  // Search & Filter State. Text fields are applied when the user runs the search, so typing
  // does not send a request (and spend provider quota) on every keystroke.
  const [activeTab, setActiveTab] = useState<'LIVE' | 'SAVED'>('LIVE');
  const [searchKeyword, setSearchKeyword] = useState<string>(() => handoffRole || '');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [applied, setApplied] = useState<{ keyword: string; location: string; salaryMin: string }>(() => ({
    keyword: handoffRole || '',
    location: '',
    salaryMin: '',
  }));
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [employmentType, setEmploymentType] = useState<string>('ALL');
  const [datePosted, setDatePosted] = useState<string>('all');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortKey>('match');
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(() => handoffId);
  const [isCycleRunning, setIsCycleRunning] = useState<boolean>(false);
  const [isTrackerSaving, setIsTrackerSaving] = useState<boolean>(false);

  // Query 1: Candidate Career Target Roles
  const { data: matchesData } = useQuery({
    queryKey: ['careers', 'matches'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
    },
  });

  const topMatch = (matchesData || [])[0] || null;
  const targetRoleTitle: string = topMatch?.careerId?.title || '';

  // Query 2: User Skills
  const { data: skillsData } = useQuery({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
  });

  const totalSkills: number = skillsData?.totalSkills ?? 0;

  // Query 3: Candidate Career Readiness
  const { data: readinessData } = useQuery({
    queryKey: ['readiness'],
    queryFn: async () => {
      const response = await apiClient.get('/readiness');
      return response.data.data;
    },
  });

  const readinessScore = primaryReadiness(readinessData)?.overallScore ?? 0;

  // Query 4: Active Resume
  const { data: resumeData } = useQuery({
    queryKey: ['activeResume'],
    queryFn: async () => {
      const response = await apiClient.get('/resumes/me');
      return response.data.data.resume;
    },
  });

  // Query 5: Job postings. With no keyword the server searches for the user's best-matching career.
  const {
    data: opportunitiesData,
    isLoading: isOpportunitiesLoading,
    isFetching: isOpportunitiesFetching,
    error: opportunitiesError,
    refetch: refetchOpportunities,
  } = useQuery<OpportunitySearchResult>({
    queryKey: ['opportunities', applied.keyword, applied.location, applied.salaryMin, remoteOnly, employmentType, datePosted, sortBy, pageSize],
    queryFn: async () => {
      const response = await apiClient.get('/opportunities', {
        params: {
          search: applied.keyword || undefined,
          location: applied.location || undefined,
          remote: remoteOnly ? 'true' : undefined,
          employmentType: employmentType !== 'ALL' ? employmentType : undefined,
          datePosted: datePosted !== 'all' ? datePosted : undefined,
          salaryMin: applied.salaryMin || undefined,
          sortBy,
          limit: pageSize,
        },
      });
      return response.data.data;
    },
    placeholderData: (previous) => previous,
  });

  // Query 6: Saved jobs. A failure is shown, not turned into an empty list.
  const {
    data: savedData,
    error: savedError,
    refetch: refetchSaved,
  } = useQuery<OpportunityItem[]>({
    queryKey: ['opportunities', 'saved'],
    queryFn: async () => {
      const response = await apiClient.get('/opportunities/saved');
      return response.data.data.savedOpportunities || [];
    },
  });

  const liveOpportunities = useMemo(() => opportunitiesData?.opportunities || [], [opportunitiesData]);
  const savedOpportunities = useMemo(() => savedData || [], [savedData]);
  const meta = opportunitiesData?.meta;
  const providerHealth = opportunitiesData?.providerHealth;
  const sourceLabel =
    meta?.source === 'live' ? 'Live listings' : meta?.source === 'sample' ? 'Demo listings' : meta?.source === 'unavailable' ? 'Provider unavailable' : 'Loading';

  const savedByExternalId = useMemo(() => new Map(savedOpportunities.map((s) => [s.externalId, s])), [savedOpportunities]);
  const savedExternalIds = useMemo(() => new Set(savedByExternalId.keys()), [savedByExternalId]);

  const currentList = activeTab === 'LIVE' ? liveOpportunities : savedOpportunities;

  // The selected posting is derived from the lists, so it always reflects the latest saved state
  const selectedOpportunity: OpportunityItem | null = useMemo(() => {
    const fromList = currentList.find((o) => o.externalId === selectedId) || (selectedId === handoffId ? handoffOpp : null) || currentList[0] || null;
    if (!fromList) return null;
    const saved = savedByExternalId.get(fromList.externalId);
    // Live fields (description, requirements) from the posting; tracking fields from the saved record
    return saved ? { ...fromList, ...saved, description: fromList.description || saved.description, skills: fromList.skills ?? saved.skills } : fromList;
  }, [currentList, selectedId, handoffId, handoffOpp, savedByExternalId]);

  const invalidateTracking = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'saved'] }),
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'telemetry'] }),
      // Home and the Command Center count tracked jobs and due reminders
      queryClient.invalidateQueries({ queryKey: ['careerSnapshot'] }),
      queryClient.invalidateQueries({ queryKey: ['career-snapshot'] }),
    ]);
  };

  // Save / remove
  const handleToggleSave = async (opp: OpportunityItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlySaved = savedExternalIds.has(opp.externalId);

    try {
      if (isCurrentlySaved) {
        await apiClient.delete(`/opportunities/saved/${encodeURIComponent(opp.externalId)}`);
        addToast({ type: 'info', message: `Removed "${opp.title}" from tracked jobs.` });
      } else {
        const response = await apiClient.post('/opportunities/save', {
          externalId: opp.externalId,
          provider: opp.provider,
          title: opp.title,
          company: opp.company,
          location: opp.location,
          // The posting's own salary object; the server stores "not disclosed" when there is none
          salary: typeof opp.salary === 'object' ? opp.salary : null,
          applicationUrl: opp.applicationUrl,
          postedAt: opp.postedAt,
          skillbridgeMatchScore: opp.skillbridgeMatchScore,
          matchedSkills: opp.matchedSkills || [],
          missingSkills: opp.missingSkills || [],
          matchExplanation: opp.matchExplanation,
          description: opp.description,
          employmentType: opp.employmentType,
          remote: opp.remote,
          isSample: Boolean(opp.isSample),
        });
        // The same job found under another id or from another source is not tracked twice
        if (response.data?.data?.alreadyTracked) addToast({ type: 'info', message: 'You are already tracking this job; it was not added a second time.' });
        else addToast({ type: 'success', message: `Saved "${opp.title}" at ${opp.company}.` });
      }
      await invalidateTracking();
    } catch (error) {
      addToast({ type: 'error', message: errorMessage(error, 'The saved job could not be updated. Please try again.') });
    }
  };

  // Application status
  const handleUpdateStatus = async (status: string) => {
    if (!selectedOpportunity) return;
    try {
      await apiClient.patch(`/opportunities/saved/${encodeURIComponent(selectedOpportunity.externalId)}/status`, { status });
      addToast({ type: 'success', message: `Status changed to ${status}.` });
      await invalidateTracking();
    } catch (error) {
      addToast({ type: 'error', message: errorMessage(error, 'The status could not be changed.') });
    }
  };

  // Notes and reminder
  const handleUpdateDetails = async (body: { notes?: string; reminderAt?: string | null; reminderNote?: string }, done: string) => {
    if (!selectedOpportunity) return;
    setIsTrackerSaving(true);
    try {
      await apiClient.patch(`/opportunities/saved/${encodeURIComponent(selectedOpportunity.externalId)}`, body);
      addToast({ type: 'success', message: done });
      await invalidateTracking();
    } catch (error) {
      addToast({ type: 'error', message: errorMessage(error, 'Your changes could not be saved.') });
    } finally {
      setIsTrackerSaving(false);
    }
  };

  // Run the search with the text currently in the form
  const handleExecuteSearch = async () => {
    const next = { keyword: searchKeyword.trim(), location: searchLocation.trim(), salaryMin: salaryMin.trim() };
    setPageSize(PAGE_SIZE);
    setActiveTab('LIVE');
    if (next.keyword === applied.keyword && next.location === applied.location && next.salaryMin === applied.salaryMin) {
      setIsCycleRunning(true);
      try {
        await refetchOpportunities();
      } finally {
        setIsCycleRunning(false);
      }
      return;
    }
    setApplied(next);
  };

  const handleResetFilters = () => {
    setSearchKeyword('');
    setSearchLocation('');
    setSalaryMin('');
    setApplied({ keyword: '', location: '', salaryMin: '' });
    setRemoteOnly(false);
    setEmploymentType('ALL');
    setDatePosted('all');
    setSortBy('match');
    setPageSize(PAGE_SIZE);
  };

  // Keep the selection valid when the visible list changes
  useEffect(() => {
    if (selectedId && currentList.some((o) => o.externalId === selectedId)) return;
    if (selectedId === handoffId && handoffOpp) return;
    setSelectedId(currentList[0]?.externalId ?? null);
  }, [currentList, selectedId, handoffId, handoffOpp]);

  if (isOpportunitiesLoading && liveOpportunities.length === 0) return <PageSkeleton label="Loading job listings" />;

  if (opportunitiesError && !opportunitiesData) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <Notice tone="error" title="Job listings could not be loaded" action={<button type="button" className={auroraButtonClass('secondary', 'md')} onClick={() => refetchOpportunities()}>Try again</button>}>
          {errorMessage(opportunitiesError, 'The request failed.')}
        </Notice>
      </div>
    );
  }

  const isSearching = isCycleRunning || isOpportunitiesFetching;
  const fieldClass = 'rounded-xl bg-aurora-canvas/60 border border-aurora-line px-3 py-2 text-xs text-aurora-ink placeholder:text-aurora-muted focus:outline-none focus:border-aurora-violet/25';

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16 px-4">
      {/* 1. SEARCH */}
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
        targetRoleTitle={targetRoleTitle || 'Not set yet'}
        totalSkills={totalSkills}
        readinessScore={readinessScore}
        providerStatus={sourceLabel}
        isSearching={isSearching}
        onExecuteSearch={handleExecuteSearch}
      />

      {/* 1b. MORE FILTERS */}
      <form
        className="rounded-2xl border border-aurora-line bg-aurora-canvas/60 p-4 flex flex-wrap items-end gap-4"
        aria-label="More filters"
        onSubmit={(e) => {
          e.preventDefault();
          void handleExecuteSearch();
        }}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="job-date-posted" className="text-[10px] font-bold uppercase tracking-wider text-aurora-muted">Date posted</label>
          <select id="job-date-posted" value={datePosted} onChange={(e) => { setDatePosted(e.target.value); setPageSize(PAGE_SIZE); }} className={fieldClass}>
            <option value="all">Any time</option>
            <option value="today">Last 24 hours</option>
            <option value="3days">Last 3 days</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="job-salary-min" className="text-[10px] font-bold uppercase tracking-wider text-aurora-muted">Minimum yearly salary</label>
          <input
            id="job-salary-min"
            type="number"
            min={0}
            step={10000}
            inputMode="numeric"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="e.g. 800000"
            aria-describedby="job-salary-hint"
            className={`${fieldClass} w-44`}
          />
        </div>
        <button type="submit" className="py-2 px-4 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-ink text-xs font-bold cursor-pointer">
          Apply
        </button>
        <button type="button" onClick={handleResetFilters} className="py-2 px-3 text-xs font-bold text-aurora-muted hover:text-aurora-indigo cursor-pointer">
          Reset all filters
        </button>
        <p id="job-salary-hint" className="text-[11px] text-aurora-muted basis-full">
          The salary filter only keeps postings that state a yearly salary, in the posting&apos;s own currency. Many postings do not state one.
        </p>
      </form>

      {/* 2. WHERE THE RESULTS CAME FROM */}
      <SearchResultsNotice
        meta={meta}
        providerMessage={providerHealth?.message}
        shown={liveOpportunities.length}
        sortBy={sortBy}
        onRetry={() => refetchOpportunities()}
      />

      {savedError && (
        <div role="alert" className="p-4 rounded-2xl border border-rose-200 bg-rose-50 flex items-center justify-between gap-3">
          <p className="text-xs text-rose-700">Your tracked jobs could not be loaded: {errorMessage(savedError, 'the request failed')}.</p>
          <button type="button" onClick={() => refetchSaved()} className="py-1.5 px-3 rounded-lg bg-aurora-canvas border border-aurora-line text-aurora-ink text-xs font-bold cursor-pointer">
            Try again
          </button>
        </div>
      )}

      <JobSearchAgentStatusBar isSearching={isSearching} providerStatus={sourceLabel} totalFound={currentList.length} />

      {/* 3. LISTINGS, DETAILS, MATCH */}
      {liveOpportunities.length === 0 && savedOpportunities.length === 0 ? (
        <OpportunityActivationHub
          onResetFilters={handleResetFilters}
          targetRoleTitle={targetRoleTitle || 'your target role'}
          hasResume={!!resumeData}
          totalSkills={totalSkills}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            <OpportunityStreamFeed
              activeTab={activeTab}
              onTabChange={setActiveTab}
              liveOpportunities={liveOpportunities}
              savedOpportunities={savedOpportunities}
              selectedId={selectedOpportunity?.externalId}
              onSelectOpportunity={(opp) => setSelectedId(opp.externalId)}
              savedExternalIds={savedExternalIds}
              onToggleSave={handleToggleSave}
              isLoading={isOpportunitiesFetching}
            />
            {currentList.length === 0 && (
              <p className="text-xs text-aurora-muted px-1" data-testid="job-list-empty">
                {activeTab === 'SAVED'
                  ? 'You are not tracking any jobs yet. Save a listing to track your application here.'
                  : 'No listings match these filters. Change or reset the filters to see more.'}
              </p>
            )}
            {activeTab === 'LIVE' && meta?.hasMore && pageSize < MAX_PAGE_SIZE && (
              <button
                type="button"
                onClick={() => setPageSize((size) => Math.min(MAX_PAGE_SIZE, size + PAGE_SIZE))}
                disabled={isOpportunitiesFetching}
                className="w-full py-2 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-ink text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isOpportunitiesFetching ? 'Loading...' : 'Show more listings'}
              </button>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <OpportunityInspector
              opportunity={selectedOpportunity}
              isSaved={selectedOpportunity ? savedExternalIds.has(selectedOpportunity.externalId) : false}
              onToggleSave={handleToggleSave}
              onUpdateStatus={handleUpdateStatus}
              status={selectedOpportunity?.status || 'saved'}
            />
            {selectedOpportunity && savedExternalIds.has(selectedOpportunity.externalId) && (
              <ApplicationTrackerPanel
                key={[selectedOpportunity.externalId, selectedOpportunity.notes, selectedOpportunity.reminderAt, selectedOpportunity.reminderNote].join('|')}
                opportunity={selectedOpportunity}
                isSaving={isTrackerSaving}
                onSaveNotes={(notes) => handleUpdateDetails({ notes }, 'Notes saved.')}
                onSetReminder={(reminderAt, reminderNote) =>
                  handleUpdateDetails(
                    reminderAt === null ? { reminderAt: null } : { reminderAt, reminderNote },
                    reminderAt === null ? 'Reminder cleared.' : 'Reminder set.'
                  )
                }
                onRemove={() => handleToggleSave(selectedOpportunity)}
              />
            )}
          </div>

          <div className="lg:col-span-3">
            <PersonalRelevanceMatrix
              opportunity={selectedOpportunity}
              targetRoleTitle={targetRoleTitle || 'your target role'}
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
