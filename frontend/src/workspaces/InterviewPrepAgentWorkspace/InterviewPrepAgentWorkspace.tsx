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

  // Query 4: Active Resume Metadata
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
  const readinessScore = readinessData?.overallScore || 0;
  const technicalDepth = readinessData?.dimensions?.technical?.score || readinessScore;
  const behavioralScore =
    readinessData?.dimensions?.experience?.score || Math.max(0, readinessScore - 5);
  const atsScore = resumeData?.atsScore || 0;

  const offerProbability = useMemo(() => {
    if (!readinessScore) return 0;
    return Math.min(98, Math.round(readinessScore * 0.6 + (atsScore > 0 ? atsScore : 70) * 0.4));
  }, [readinessScore, atsScore]);

  const confidenceRating = useMemo(() => {
    if (readinessScore >= 80) return 'Target Level Ready';
    if (readinessScore >= 60) return 'Competency Aligned';
    return 'Skill Gap Closure Required';
  }, [readinessScore]);

  // Verified Strengths
  const verifiedStrengths: string[] = useMemo(() => {
    if (readinessData?.strengths?.length > 0) {
      return readinessData.strengths.slice(0, 4).map((s: { skillName: string }) => s.skillName);
    }
    if (skillsData?.categories) {
      const allSkills = Object.values(skillsData.categories).flatMap(
        (items: unknown) => items as Array<{ name: string }>
      );
      return allSkills.slice(0, 4).map((s: { name: string }) => s.name);
    }
    return ['STAR Structured Response', 'Quantified Metrics Emphasis', 'Architecture Patterns'];
  }, [readinessData, skillsData]);

  // Real Gap Improvements
  const focusGaps: string[] = useMemo(() => {
    if (readinessData?.gaps?.length > 0) {
      return readinessData.gaps
        .slice(0, 3)
        .map(
          (g: { skillName: string; gapSeverity: number }) =>
            `${g.skillName} (Severity: -${g.gapSeverity}%)`
        );
    }
    return ['System Scalability & Load Balancing', 'Database Sharding Trade-offs'];
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
      const score = evaluatedQ?.evaluation?.score || 75;

      addToast({
        type: 'success',
        message: `Response Evaluated! Score: ${score}/100 (${
          evaluatedQ?.evaluation?.starFormatted ? 'STAR Compliant' : 'Needs Metrics'
        })`,
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
        aiSummary={`Readiness: ${readinessScore}% • Rating: ${confidenceRating} • Estimated Offer Prob: ${offerProbability}%`}
        stats={[
          {
            label: 'Interview Readiness',
            value: `${readinessScore} / 100`,
            change: confidenceRating,
            isPositive: readinessScore >= 70,
          },
          {
            label: 'Estimated Offer Prob.',
            value: `${offerProbability}%`,
            change: 'ATS Grounded',
            isPositive: offerProbability >= 70,
          },
          {
            label: 'Technical Depth',
            value: `${technicalDepth}%`,
            change: 'Competency Evaluated',
            isPositive: technicalDepth >= 70,
          },
          {
            label: 'Behavioral Score',
            value: `${behavioralScore}%`,
            change: 'STAR Structured',
            isPositive: behavioralScore >= 70,
          },
        ]}
      />

      {/* AI STATUS & PROVENANCE BAR */}
      <AIStatusBar
        status={`STUDIO STATUS: ${studioMode} MODE • TARGET: ${targetRoleTitle.toUpperCase()} • SIMULATED EMPLOYER: ${targetCompany.toUpperCase()}`}
        provenance="GROUND TRUTH: SKILLBRIDGE DB (VERIFIED SKILLS, GAPS, RESUME) • AI EVALUATOR: STAR RUBRIC"
      />

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
          offerProbability={offerProbability}
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
