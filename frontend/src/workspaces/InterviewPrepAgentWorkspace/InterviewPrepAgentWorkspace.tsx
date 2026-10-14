import React, { useState, useMemo, useEffect } from 'react';
import { RubricPicker } from '../../features/interview/components/RubricControls';
import { InterviewProgressPanel } from '../../features/interview/components/InterviewProgressPanel';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../lib/axios';
import { MessageSquare } from 'lucide-react';
import { Notice, PageHeader, PageSkeleton, StatTile } from '../../design/aurora/kit';
import { useToast } from '../../components/composite/Toast';
import {
  StudioLobby,
  LiveInterviewRoom,
  PerformanceReview,
  InterviewJourneyHistory,
} from '../../features/interview/components';
import type { EvaluationDimensions } from '../../features/interview/components/EvaluationProvenance';
import type { EvaluationQuality } from '../../features/interview/components/EvaluationDetails';
import { primaryReadiness, dimensionScore, readinessStrengths, readinessGaps } from '../../lib/readiness';

export interface QuestionItem {
  questionId: string;
  question: string;
  category: 'technical' | 'behavioral' | 'project' | 'resume' | 'career' | 'general';
  /** Who wrote the question: an AI provider, the built-in question bank, or a follow-up to the previous answer (D3). */
  source?: 'ai' | 'question_bank' | 'follow_up';
  /** Set on follow-up questions: the question they follow up. */
  followUpOf?: string;
  /** The fact on record the question is based on. */
  groundedIn?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedConcepts: string[];
  candidateResponse?: string;
  evaluation?: {
    score: number;
    starFormatted: boolean;
    strengths: string[];
    improvements: string[];
    missingConcepts: string[];
    feedback: string;
    /** Which evaluator scored this answer. */
    source?: 'ai' | 'heuristic';
    dimensions?: EvaluationDimensions;
    evaluatedAt?: string;
  } & EvaluationQuality;
}

export interface InterviewSession {
  _id: string;
  targetCareerTitle: string;
  mode: 'technical' | 'behavioral' | 'project' | 'resume' | 'career' | 'mixed';
  status: 'active' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  questionCount: number;
  currentQuestionIndex: number;
  overallScore?: number;
  /** Averages of the rubric dimensions over answered questions; null where never judged. */
  dimensionScores?: EvaluationDimensions;
  answeredCount?: number;
  questionSource?: 'ai' | 'question_bank';
  /** Role rubric the answers are weighted with (D5); absent on older sessions, which used General. */
  rubricId?: string;
  /** D3: follow-ups asked and answered, kept out of the overall score. */
  followUpSummary?: { asked: number; answered: number; recovered: number; averageScore: number | null } | null;
  /** 'ai', 'heuristic' or 'mixed'. */
  evaluationSource?: string;
  /** The job posting this session prepared for, when it was started from one. */
  opportunityContext?: { title?: string; company?: string };
  questions: QuestionItem[];
  strengths: string[];
  weaknesses: string[];
  preparationRecommendations: string[];
}

/**
 * Starting a session and scoring an answer may wait on the AI service (up to 15s and 12s on the
 * server before it falls back), so these requests get more time than the client default.
 */
const AI_BACKED_REQUEST_TIMEOUT_MS = 30000;

export const InterviewPrepAgentWorkspace: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Opportunity Context handoff from Job Search Agent if present in route state
  const locationOpportunity = (
    location.state as { opportunity?: { id?: string; externalId?: string; title?: string; company?: string; location?: string; description?: string } } | null
  )?.opportunity;
  const [opportunityContext, setOpportunityContext] = useState<{
    id?: string;
    title?: string;
    company?: string;
    location?: string;
    description?: string;
  } | null>(
    locationOpportunity
      ? {
          id: locationOpportunity.id || locationOpportunity.externalId,
          description: locationOpportunity.description,
          title: locationOpportunity.title,
          company: locationOpportunity.company,
          location: locationOpportunity.location,
        }
      : null
  );

  // Studio Mode State: LOBBY | LIVE | REVIEW | HISTORY
  const [studioMode, setStudioMode] = useState<'LOBBY' | 'LIVE' | 'REVIEW' | 'HISTORY'>('LOBBY');
  const [targetCompany, setTargetCompany] = useState<string>(
    locationOpportunity?.company || ''
  );
  const [selectedMode, setSelectedMode] = useState<
    'technical' | 'behavioral' | 'project' | 'resume' | 'career' | 'mixed'
  >('technical');
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [candidateAnswer, setCandidateAnswer] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  // '' keeps the rubric matched to the role
  const [rubricChoice, setRubricChoice] = useState<string>('');
  // D3 follow-ups are opt-in
  const [adaptiveFollowUps, setAdaptiveFollowUps] = useState<boolean>(false);
  // D2: typed, dictated or both, for the answer being written
  const [inputMethod, setInputMethod] = useState<'typed' | 'dictated' | 'mixed'>('typed');

  // Query 1: Career Readiness Dimensions
  const {
    data: readinessData,
    isLoading: isReadinessLoading,
  } = useQuery({
    queryKey: ['readiness'],
    queryFn: async () => {
      const response = await apiClient.get('/readiness');
      return response.data.data;
    },
  });

  // Query 2: Target Career Matches
  const { data: matchesData } = useQuery({
    queryKey: ['careers', 'matches'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
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


  // Query 5: Persistent Session History
  const {
    data: historyData,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['interviews', 'history'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/interviews/history');
        return response.data.data.history || [];
      } catch {
        return [];
      }
    },
  });

  const matches = matchesData || [];
  const topMatch = matches[0] || null;
  const targetRoleTitle =
    opportunityContext?.title || topMatch?.careerId?.title || 'your target role';
  // What is sent to the server: undefined lets it use the role saved on the user's profile
  const requestedRoleTitle: string | undefined = opportunityContext?.title || topMatch?.careerId?.title || undefined;

  // Dynamic Telemetry Calculations
  const readinessScore = primaryReadiness(readinessData)?.overallScore ?? 0;
  const technicalDepth = dimensionScore(readinessData, 'Technical Skills') ?? readinessScore;
  const behavioralScore =
    dimensionScore(readinessData, 'Professional Experience') ?? 0;

  const confidenceRating = useMemo(() => {
    if (readinessScore >= 80) return 'Target Level Ready';
    if (readinessScore >= 60) return 'Competency Aligned';
    return 'Skill Gap Closure Required';
  }, [readinessScore]);

  // Verified Strengths
  const verifiedStrengths: string[] = useMemo(() => {
    if (readinessStrengths(readinessData).length > 0) {
      return readinessStrengths(readinessData).slice(0, 4).map((s: { skillName: string }) => s.skillName);
    }
    if (skillsData?.categories) {
      const allSkills = Object.values(skillsData.categories).flatMap(
        (items: unknown) => items as Array<{ name: string }>
      );
      return allSkills.slice(0, 4).map((s: { name: string }) => s.name);
    }
    return [];
  }, [readinessData, skillsData]);

  // Real Gap Improvements
  const focusGaps: string[] = useMemo(() => {
    if (readinessGaps(readinessData).length > 0) {
      return readinessGaps(readinessData)
        .slice(0, 3)
        .map((g) => `${g.skillName} (gap impact ${g.impactScore}/100)`);
    }
    // No gaps on record: show none rather than example topics
    return [];
  }, [readinessData]);

  // Current active question item
  const currentQuestion: QuestionItem | null = useMemo(() => {
    if (!activeSession || !activeSession.questions || activeSession.questions.length === 0)
      return null;
    const idx = Math.min(activeSession.currentQuestionIndex, activeSession.questions.length - 1);
    return activeSession.questions[idx] || null;
  }, [activeSession]);

  // Sync candidateAnswer with active question response if already submitted
  useEffect(() => {
    if (currentQuestion?.candidateResponse) {
      setCandidateAnswer(currentQuestion.candidateResponse);
    } else {
      setCandidateAnswer('');
    }
  }, [currentQuestion]);

  // Handler: Start New Grounded AI Interview Session
  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      const response = await apiClient.post('/interviews', {
        targetCareerTitle: requestedRoleTitle,
        mode: selectedMode,
        questionCount: 5,
        rubricId: rubricChoice || undefined,
        adaptiveFollowUps,
        // Only a real posting or an employer the user typed makes this a job-specific session
        opportunityContext:
          targetCompany.trim() || opportunityContext?.description
            ? {
                title: requestedRoleTitle,
                company: targetCompany.trim() || undefined,
                description: opportunityContext?.description?.slice(0, 20000),
              }
            : undefined,
      }, { timeout: AI_BACKED_REQUEST_TIMEOUT_MS });

      const session = response.data.data;
      setActiveSession(session);
      setCandidateAnswer('');
      setStudioMode('LIVE');
      refetchHistory();

      addToast({
        type: 'success',
        message:
          session.questionSource === 'ai'
            ? 'Interview started with AI-written questions.'
            : 'Interview started. AI question writing is unavailable, so questions come from the built-in question bank.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start interview session';
      addToast({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Handler: Submit Candidate Answer & Evaluate
  const handleEvaluateAnswer = async () => {
    if (!activeSession || !currentQuestion) return;
    if (!candidateAnswer.trim()) {
      addToast({
        type: 'error',
        message: 'Please enter a response before submitting for evaluation.',
      });
      return;
    }

    setIsEvaluating(true);
    try {
      const response = await apiClient.post(`/interviews/${activeSession._id}/respond`, {
        questionIndex: activeSession.currentQuestionIndex,
        candidateResponse: candidateAnswer,
        inputMethod,
      }, { timeout: AI_BACKED_REQUEST_TIMEOUT_MS });

      const updated = response.data.data;
      setActiveSession(updated);

      const evaluatedQ = updated.questions[activeSession.currentQuestionIndex];
      const score = evaluatedQ?.evaluation?.score;

      addToast({
        type: 'success',
        message: typeof score === 'number' ? `Answer scored ${score}/100.` : 'Answer saved.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Evaluation failed';
      addToast({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Handler: Next Question
  const handleNextQuestion = () => {
    if (!activeSession) return;
    const nextIdx = activeSession.currentQuestionIndex + 1;
    if (nextIdx < activeSession.questions.length) {
      setActiveSession({
        ...activeSession,
        currentQuestionIndex: nextIdx,
      });
      setCandidateAnswer('');
    }
  };

  // Handler: Complete Session & Generate Report
  const handleCompleteSession = async () => {
    if (!activeSession) return;
    try {
      const response = await apiClient.post(`/interviews/${activeSession._id}/complete`);
      const completed = response.data.data;
      setActiveSession(completed);
      setStudioMode('REVIEW');
      refetchHistory();
      queryClient.invalidateQueries({ queryKey: ['career-snapshot'] });
      queryClient.invalidateQueries({ queryKey: ['careerSnapshot'] });

      addToast({
        type: 'success',
        message: `Interview Session Completed! Final Performance Score: ${completed.overallScore}%`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete session';
      addToast({
        type: 'error',
        message: msg,
      });
    }
  };

  // Handler: Inspect Historical Session
  const handleSelectHistorySession = (session: InterviewSession) => {
    setActiveSession(session);
    setStudioMode('REVIEW');
  };

  if (isReadinessLoading) return <PageSkeleton label="Loading the interview studio" />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      {(studioMode === 'LOBBY' || studioMode === 'HISTORY') && (
      <>
      <PageHeader
        eyebrow="Interview Studio"
        icon={<MessageSquare className="h-7 w-7" aria-hidden="true" />}
        title={targetRoleTitle ? `Practise for ${targetRoleTitle}` : 'Practise interviews'}
        lead="Questions are drawn from your role and your own evidence. Each answer is scored against a rubric you can see; scores describe the answer, not your chance of being hired."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label="Career readiness" value={`${readinessScore} / 100`} hint={confidenceRating} accent />
          <StatTile label="Technical skills evidence" value={`${technicalDepth}%`} hint="From your readiness breakdown" />
          <StatTile label="Experience evidence" value={`${behavioralScore}%`} hint="From your readiness breakdown" />
        </div>
      </PageHeader>

      <Notice title="How answers are scored">
        By an AI rubric when a language model is reachable, otherwise by the built-in rule-based rubric. Every report says which one scored it.
      </Notice>
      </>
      )}

      {/* MODE 1: STUDIO LOBBY */}
      {studioMode === 'LOBBY' && (
        <StudioLobby
          targetRoleTitle={targetRoleTitle}
          targetCompany={targetCompany}
          onCompanyChange={setTargetCompany}
          selectedMode={selectedMode}
          onModeSelect={setSelectedMode}
          opportunityContext={opportunityContext}
          onClearOpportunityContext={() => setOpportunityContext(null)}
          verifiedStrengths={verifiedStrengths}
          focusGaps={focusGaps}
          readinessScore={readinessScore}
          technicalDepth={technicalDepth}
          behavioralScore={behavioralScore}
          historyCount={historyData?.length || 0}
          onOpenHistory={() => setStudioMode('HISTORY')}
          onStartSession={handleStartSession}
          isStarting={isStarting}
          onChangeRole={() => navigate('/careers')}
          settingsSlot={
            <>
              <RubricPicker roleTitle={targetRoleTitle} value={rubricChoice} onChange={setRubricChoice} />
              <label className="flex items-start gap-2 rounded-2xl border border-aurora-line bg-aurora-canvas/60 p-4 text-xs text-aurora-muted">
                <input type="checkbox" className="mt-0.5" checked={adaptiveFollowUps} onChange={(e) => setAdaptiveFollowUps(e.target.checked)} />
                <span>
                  <span className="font-semibold text-aurora-ink">Ask follow-up questions</span> when an answer misses an expected point or lacks detail
                  (at most one per question, three per round). Follow-ups are reported separately and do not change your overall score.
                </span>
              </label>
              <Link
                to="/interview-agent/assessments"
                className="block rounded-2xl border border-aurora-line bg-aurora-canvas/60 p-4 text-xs text-aurora-muted hover:border-indigo-400/40"
              >
                <span className="font-semibold text-aurora-ink">Technical assessment</span>: read code and answer trace, bug, complexity and SQL
                tasks. Nothing you type is run as code.
              </Link>
            </>
          }
        />
      )}

      {/* MODE 2: LIVE INTERVIEW ROOM */}
      {studioMode === 'LIVE' && activeSession && (
        <LiveInterviewRoom
          session={activeSession}
          currentQuestion={currentQuestion}
          candidateAnswer={candidateAnswer}
          onAnswerChange={setCandidateAnswer}
          isEvaluating={isEvaluating}
          onEvaluate={handleEvaluateAnswer}
          onNextQuestion={handleNextQuestion}
          onCompleteSession={handleCompleteSession}
          onInputMethodChange={setInputMethod}
        />
      )}

      {/* MODE 3: PERFORMANCE REVIEW COACHING */}
      {studioMode === 'REVIEW' && activeSession && (
        <PerformanceReview
          session={activeSession}
          opportunityContext={opportunityContext}
          onPracticeAgain={() => {
            setActiveSession(null);
            setStudioMode('LOBBY');
          }}
          onNavigateToRoadmap={() => navigate('/roadmap')}
          onNavigateToReadiness={() => navigate('/readiness')}
          onReturnToOpportunity={
            opportunityContext
              ? () =>
                  navigate('/job-agent', {
                    state: { selectedOpportunityId: opportunityContext.id },
                  })
              : undefined
          }
        />
      )}

      {/* HISTORICAL JOURNEY DRAWER */}
      {studioMode === 'HISTORY' && (
        <>
          <InterviewJourneyHistory
            history={historyData || []}
            onSelectSession={handleSelectHistorySession}
            onClose={() => setStudioMode('LOBBY')}
          />
          <InterviewProgressPanel />
        </>
      )}
    </div>
  );
};

export default InterviewPrepAgentWorkspace;
