import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../lib/axios';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';
import { AIThinkingAnimation } from '../../components/experience';
import {
  StudioLobby,
  LiveInterviewRoom,
  PerformanceReview,
  InterviewJourneyHistory,
} from '../../features/interview/components';
import { primaryReadiness, dimensionScore, readinessStrengths, readinessGaps } from '../../lib/readiness';

export interface QuestionItem {
  questionId: string;
  question: string;
  category: 'technical' | 'behavioral' | 'project' | 'resume' | 'general';
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
    evaluatedAt?: string;
  };
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
  dimensionScores?: {
    technical?: number;
    behavioral?: number;
    communication?: number;
    project?: number;
  };
  questions: QuestionItem[];
  strengths: string[];
  weaknesses: string[];
  preparationRecommendations: string[];
}

export const InterviewPrepAgentWorkspace: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Opportunity Context handoff from Job Search Agent if present in route state
  const locationOpportunity = (location.state as any)?.opportunity;
  const [opportunityContext, setOpportunityContext] = useState<{
    id?: string;
    title?: string;
    company?: string;
    location?: string;
  } | null>(
    locationOpportunity
      ? {
          id: locationOpportunity.id,
          title: locationOpportunity.title,
          company: locationOpportunity.company,
          location: locationOpportunity.location,
        }
      : null
  );

  // Studio Mode State: LOBBY | LIVE | REVIEW | HISTORY
  const [studioMode, setStudioMode] = useState<'LOBBY' | 'LIVE' | 'REVIEW' | 'HISTORY'>('LOBBY');
  const [targetCompany, setTargetCompany] = useState<string>(
    locationOpportunity?.company || 'OpenScale AI Systems'
  );
  const [selectedMode, setSelectedMode] = useState<
    'technical' | 'behavioral' | 'project' | 'resume' | 'career' | 'mixed'
  >('technical');
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [candidateAnswer, setCandidateAnswer] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);

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
    opportunityContext?.title || topMatch?.careerId?.title || 'Full Stack Software Engineer';

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
        targetCareerTitle: targetRoleTitle,
        mode: selectedMode,
        questionCount: 5,
        opportunityContext: {
          title: targetRoleTitle,
          company: targetCompany,
        },
      });

      const session = response.data.data;
      setActiveSession(session);
      setCandidateAnswer('');
      setStudioMode('LIVE');
      refetchHistory();

      addToast({
        type: 'success',
        message: `Adaptive ${selectedMode.toUpperCase()} Interview Studio Initialized!`,
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
      });

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

  if (isReadinessLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4 font-mono">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Connecting to Grounded AI Interview Studio..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4 font-mono">
      {/* WORKSPACE HERO */}
      <WorkspaceHero
        greeting="Adaptive AI Interview Studio & STAR Evaluator"
        userName={targetRoleTitle}
        title="AI Interview Studio"
        description="Immersive mock interviews grounded in candidate verified skills, STAR response evaluation, and private debrief coaching."
        aiSummary={`Career readiness: ${readinessScore}% • ${confidenceRating}`}
        stats={[
          {
            label: 'Career Readiness',
            value: `${readinessScore} / 100`,
            change: confidenceRating,
            isPositive: readinessScore >= 70,
          },
          {
            label: 'Technical Skills Evidence',
            value: `${technicalDepth}%`,
            change: 'From your readiness breakdown',
            isPositive: technicalDepth >= 70,
          },
          {
            label: 'Experience Evidence',
            value: `${behavioralScore}%`,
            change: 'From your readiness breakdown',
            isPositive: behavioralScore >= 70,
          },
        ]}
      />

      {/* AI STATUS & PROVENANCE BAR */}
      <AIStatusBar status="idle" provider="Answers are scored by an AI rubric when a provider is available, otherwise by a rule-based rubric" />

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
        <InterviewJourneyHistory
          history={historyData || []}
          onSelectSession={handleSelectHistorySession}
          onClose={() => setStudioMode('LOBBY')}
        />
      )}
    </div>
  );
};

export default InterviewPrepAgentWorkspace;
