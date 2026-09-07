import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  RefreshCw,
  Sparkles,
  Building,
  Target,
  Send,
  History,
  ChevronRight,
  ArrowRight,
  X,
} from 'lucide-react';
import apiClient from '../../lib/axios';
import { GlassPanel } from '../../components/experience/workspace';
import { WorkspaceHero, AIStatusBar } from '../../components/experience/workspace';
import { useToast } from '../../components/composite/Toast';
import { AIThinkingAnimation } from '../../components/experience';

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

  // State Management
  const [activeTab, setActiveTab] = useState<'SESSION' | 'REPORT' | 'HISTORY'>('SESSION');
  const [targetCompany, setTargetCompany] = useState<string>('OpenScale AI Systems');
  const [selectedMode, setSelectedMode] = useState<'technical' | 'behavioral' | 'project' | 'resume' | 'career' | 'mixed'>('technical');
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [candidateAnswer, setCandidateAnswer] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [viewingReportSession, setViewingReportSession] = useState<InterviewSession | null>(null);

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
  const targetRoleTitle = topMatch?.careerId?.title || 'Full Stack Software Engineer';

  // Dynamic Telemetry Calculations
  const readinessScore = readinessData?.overallScore || 0;
  const technicalDepth = readinessData?.dimensions?.technical?.score || readinessScore;
  const behavioralScore = readinessData?.dimensions?.experience?.score || Math.max(0, readinessScore - 5);
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
  const verifiedStrengths = useMemo(() => {
    if (readinessData?.strengths?.length > 0) {
      return readinessData.strengths.slice(0, 3).map((s: { skillName: string }) => s.skillName);
    }
    if (skillsData?.categories) {
      const allSkills = Object.values(skillsData.categories).flatMap((items: unknown) => items as Array<{ name: string }>);
      return allSkills.slice(0, 3).map((s) => s.name);
    }
    return ['STAR Structured Response', 'Quantified Metrics Emphasis'];
  }, [readinessData, skillsData]);

  // Real Gap Improvements
  const gapImprovements = useMemo(() => {
    if (readinessData?.gaps?.length > 0) {
      return readinessData.gaps.slice(0, 3).map((g: { skillName: string; gapSeverity: number }) => `Strengthen ${g.skillName} (Impact: -${g.gapSeverity}%)`);
    }
    return ['Upload resume to identify gap priorities', 'Select a target role in Career Intelligence'];
  }, [readinessData]);

  // Current active question item
  const currentQuestion = useMemo(() => {
    if (!activeSession || !activeSession.questions || activeSession.questions.length === 0) return null;
    const idx = Math.min(activeSession.currentQuestionIndex, activeSession.questions.length - 1);
    return activeSession.questions[idx];
  }, [activeSession]);

  // Keyboard accessibility: Dismiss modal / report drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewingReportSession) {
        setViewingReportSession(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingReportSession]);

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
      setActiveTab('SESSION');
      refetchHistory();

      addToast({
        type: 'success',
        message: `Grounded AI ${selectedMode.toUpperCase()} Interview Session Started!`,
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
        message: 'Please enter a response before submitting.',
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
        message: `Response Evaluated! Score: ${score}/100 (${evaluatedQ?.evaluation?.starFormatted ? 'STAR Compliant' : 'Needs Metrics'})`,
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
      setViewingReportSession(completed);
      refetchHistory();

      addToast({
        type: 'success',
        message: `Interview Session Completed! Final Score: ${completed.overallScore}%`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete session';
      addToast({
        type: 'error',
        message: msg,
      });
    }
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
        greeting="AI Mock Interview Studio & STAR Evaluator"
        userName={targetRoleTitle}
        title="Interview Preparation Agent"
        description="Grounded technical mock interviews, STAR response evaluation, architecture challenges, and persistent performance reports."
        aiSummary={`Readiness: ${readinessScore}% • Rating: ${confidenceRating} • Offer Prob: ${offerProbability}%`}
        stats={[
          { label: 'Interview Readiness', value: `${readinessScore} / 100`, change: confidenceRating, isPositive: readinessScore >= 70 },
          { label: 'Offer Probability', value: `${offerProbability}%`, change: 'ATS Grounded', isPositive: offerProbability >= 70 },
          { label: 'Technical Depth', value: `${technicalDepth}%`, change: 'Competency Evaluated', isPositive: technicalDepth >= 70 },
          { label: 'Behavioral Score', value: `${behavioralScore}%`, change: 'STAR Structured', isPositive: behavioralScore >= 70 },
        ]}
      />

      {/* TOP CONTROLS & NAVIGATION TABS */}
      <GlassPanel className="p-4 space-y-4 border-indigo-500/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* TAB BUTTONS */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('SESSION')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'SESSION'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>ACTIVE COCKPIT</span>
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'HISTORY'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <History className="w-4 h-4" />
              <span>SESSION HISTORY ({historyData?.length || 0})</span>
            </button>
          </div>

          {/* TARGET ROLE & COMPANY DISPLAY */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap w-full md:w-auto justify-end">
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="Target Company..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <Building className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-indigo-300 font-mono flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate max-w-[180px]">{targetRoleTitle}</span>
            </div>

            <button
              onClick={() => navigate('/careers')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-bold px-2 py-1"
            >
              Change Role →
            </button>
          </div>
        </div>

        {/* DATA PROVENANCE BADGES */}
        <div className="flex items-center gap-2 flex-wrap text-[10px] pt-2 border-t border-white/10">
          <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
            CANDIDATE TELEMETRY • SOURCE: SKILLBRIDGE DATABASE
          </span>
          <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-bold">
            AI INTERVIEW GUIDANCE • SOURCE: SKILLBRIDGE AI
          </span>
        </div>
      </GlassPanel>

      {/* ACTIVE SESSION TAB */}
      {activeTab === 'SESSION' && (
        <div className="space-y-6">
          {/* MODE SELECTOR & START SESSION BANNER */}
          {!activeSession || activeSession.status === 'completed' ? (
            <GlassPanel className="p-6 space-y-6 border-indigo-500/40 relative overflow-hidden">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">Initialize Grounded AI Interview Studio</h3>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed max-w-3xl">
                  Questions are dynamically generated using your verified skills (
                  <strong className="text-indigo-300">{verifiedStrengths.join(', ')}</strong>
                  ), parsed resume evidence, and target role requirements (
                  <strong className="text-emerald-300">{targetRoleTitle}</strong>).
                </p>
              </div>

              {/* MODE SELECTION GRID */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold block">Select Interview Mode:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { id: 'technical', label: 'Technical', desc: 'Architecture & code' },
                    { id: 'behavioral', label: 'Behavioral', desc: 'STAR format situations' },
                    { id: 'project', label: 'Project', desc: 'System design trade-offs' },
                    { id: 'resume', label: 'Resume', desc: 'Career accomplishments' },
                    { id: 'career', label: 'Career Role', desc: 'Role specific depth' },
                    { id: 'mixed', label: 'Mixed Suite', desc: 'Full interview round' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMode(m.id as 'technical' | 'behavioral' | 'project' | 'resume' | 'career' | 'mixed')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                        selectedMode === m.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <strong className="block text-xs text-indigo-300">{m.label}</strong>
                      <span className="text-[10px] text-slate-400 block">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* START BUTTON */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleStartSession}
                  disabled={isStarting}
                  className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all"
                >
                  {isStarting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                  <span>{isStarting ? 'Generating Contextual Questions...' : 'START MOCK INTERVIEW SESSION'}</span>
                </button>
              </div>
            </GlassPanel>
          ) : (
            /* ACTIVE INTERVIEW COCKPIT (12 COLS) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* CANDIDATE TELEMETRY HUD (4 COLS) */}
              <div className="lg:col-span-4 space-y-4">
                <GlassPanel className="p-4 space-y-3 border-indigo-500/30 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-indigo-400" /> Candidate Telemetry
                    </span>
                    <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                      {activeSession.mode.toUpperCase()} MODE
                    </span>
                  </div>

                  <div className="space-y-2 p-3 rounded-xl bg-slate-950/80 border border-white/10">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Target Role:</span>
                      <strong className="text-white">{activeSession.targetCareerTitle}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Readiness Score:</span>
                      <strong className="text-emerald-400">{readinessScore}%</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Question Progress:</span>
                      <strong className="text-indigo-300">
                        {activeSession.currentQuestionIndex + 1} / {activeSession.questions.length}
                      </strong>
                    </div>
                  </div>

                  {/* VERIFIED STRENGTHS */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold block">VERIFIED SKILLS:</span>
                    <div className="flex flex-wrap gap-1">
                      {verifiedStrengths.map((st) => (
                        <span key={st} className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                          ✓ {st}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CRITICAL SKILL GAPS */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-amber-400 font-bold block">FOCUS GAPS:</span>
                    <div className="space-y-1">
                      {gapImprovements.map((gap) => (
                        <div key={gap} className="text-[10px] text-amber-300/80 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 truncate">
                          + {gap}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassPanel>
              </div>

              {/* ACTIVE QUESTION & RESPONSE COMPOSER (8 COLS) */}
              <GlassPanel className="lg:col-span-8 p-6 space-y-6 border-indigo-500/30 relative">
                {/* SESSION HEADER */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      QUESTION {activeSession.currentQuestionIndex + 1} OF {activeSession.questions.length}
                    </span>
                    {currentQuestion && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase">
                        {currentQuestion.category} • {currentQuestion.difficulty}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleCompleteSession}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold px-3 py-1 rounded bg-rose-500/10 border border-rose-500/30 cursor-pointer"
                  >
                    End Interview & Get Report
                  </button>
                </div>

                {/* ACTIVE QUESTION PANEL */}
                {currentQuestion && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/40 space-y-2">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase block">ACTIVE INTERVIEW SCENARIO</span>
                      <h4 className="text-sm font-bold text-white leading-relaxed">{currentQuestion.question}</h4>
                      {currentQuestion.expectedConcepts.length > 0 && (
                        <div className="pt-2 flex items-center gap-1.5 flex-wrap text-[10px]">
                          <span className="text-slate-400">EXPECTED CONCEPTS:</span>
                          {currentQuestion.expectedConcepts.map((c) => (
                            <span key={c} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-white/10 font-bold">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RESPONSE COMPOSER */}
                    <div className="space-y-2">
                      <label className="text-xs text-slate-300 font-bold block flex items-center justify-between">
                        <span>Your Response (STAR Format: Situation, Task, Action, Result & Metrics):</span>
                        <span className="text-[10px] text-indigo-400 font-normal">Use metrics (e.g. 35% latency reduction)</span>
                      </label>
                      <textarea
                        value={candidateAnswer}
                        onChange={(e) => setCandidateAnswer(e.target.value)}
                        placeholder="Example: I architected a microservice handling 50k RPS, using vector indexing to reduce P99 latency by 45%..."
                        rows={4}
                        className="w-full p-3.5 rounded-xl bg-slate-950/90 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                      />
                    </div>

                    {/* SUBMIT RESPONSE BUTTON */}
                    <div className="flex justify-between items-center pt-2">
                      {currentQuestion.evaluation ? (
                        <button
                          onClick={handleNextQuestion}
                          disabled={activeSession.currentQuestionIndex >= activeSession.questions.length - 1}
                          className="py-2 px-4 rounded-xl bg-slate-900 border border-white/20 text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                        >
                          <span>Next Question</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <div />
                      )}

                      <button
                        onClick={handleEvaluateAnswer}
                        disabled={isEvaluating || !candidateAnswer.trim()}
                        className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        {isEvaluating ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>{isEvaluating ? 'Evaluating Response...' : 'EVALUATE RESPONSE WITH AI'}</span>
                      </button>
                    </div>

                    {/* AI EVALUATION FEEDBACK DISPLAY */}
                    {currentQuestion.evaluation && (
                      <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            AI Evaluation Report (Score: {currentQuestion.evaluation.score}/100)
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              currentQuestion.evaluation.starFormatted
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {currentQuestion.evaluation.starFormatted ? 'STAR Format Compliant' : 'Needs Metrics'}
                          </span>
                        </div>

                        {currentQuestion.evaluation.strengths.length > 0 && (
                          <div className="space-y-1 text-[11px]">
                            <span className="text-emerald-400 font-bold block">Key Strengths:</span>
                            {currentQuestion.evaluation.strengths.map((s, idx) => (
                              <p key={idx} className="text-slate-300 pl-3">• {s}</p>
                            ))}
                          </div>
                        )}

                        {currentQuestion.evaluation.improvements.length > 0 && (
                          <div className="space-y-1 text-[11px] border-t border-white/5 pt-2">
                            <span className="text-purple-300 font-bold block">Recommended Focus:</span>
                            {currentQuestion.evaluation.improvements.map((imp, idx) => (
                              <p key={idx} className="text-slate-300 pl-3">• {imp}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </GlassPanel>
            </div>
          )}
        </div>
      )}

      {/* SESSION HISTORY TAB */}
      {activeTab === 'HISTORY' && (
        <GlassPanel className="p-6 space-y-4 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              Persistent Interview Session History
            </span>
          </div>

          {(!historyData || historyData.length === 0) ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-white/10 rounded-xl">
              No interview sessions recorded yet. Start a new session in the Active Cockpit!
            </div>
          ) : (
            <div className="space-y-3">
              {historyData.map((sess: InterviewSession) => (
                <div key={sess._id} className="p-4 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between flex-wrap gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{sess.targetCareerTitle}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase">
                        {sess.mode}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Started: {new Date(sess.startedAt).toLocaleString()} • Questions: {sess.questionCount}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/30">
                      Score: {sess.overallScore ? `${sess.overallScore}%` : 'In Progress'}
                    </span>

                    <button
                      onClick={() => setViewingReportSession(sess)}
                      className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/20 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Report</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      )}

      {/* POST-INTERVIEW PERFORMANCE REPORT MODAL DRAWER */}
      {viewingReportSession && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Interview Performance Report Modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <GlassPanel className="max-w-3xl w-full p-6 space-y-6 border-indigo-500/50 relative max-h-[90vh] overflow-y-auto font-mono text-xs shadow-2xl">
            <button
              onClick={() => setViewingReportSession(null)}
              aria-label="Close interview report modal"
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* REPORT HEADER */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  PERFORMANCE REPORT • {viewingReportSession.mode.toUpperCase()} MODE
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{viewingReportSession.targetCareerTitle}</h2>
              <p className="text-slate-400 text-xs">
                Completed: {viewingReportSession.completedAt ? new Date(viewingReportSession.completedAt).toLocaleString() : 'Recent'}
              </p>
            </div>

            {/* OVERALL SCORE & DIMENSIONS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/80 border border-white/10">
              <div>
                <span className="text-slate-500 block text-[10px]">OVERALL SCORE</span>
                <strong className="text-emerald-400 text-lg">{viewingReportSession.overallScore || 0}%</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TECHNICAL</span>
                <strong className="text-white text-sm">{viewingReportSession.dimensionScores?.technical || 0}%</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">BEHAVIORAL</span>
                <strong className="text-purple-300 text-sm">{viewingReportSession.dimensionScores?.behavioral || 0}%</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">PROJECT</span>
                <strong className="text-cyan-300 text-sm">{viewingReportSession.dimensionScores?.project || 0}%</strong>
              </div>
            </div>

            {/* STRENGTHS & WEAKNESSES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
                <span className="font-bold text-emerald-400 text-xs block">Key Demonstrated Strengths</span>
                <div className="space-y-1">
                  {(viewingReportSession.strengths.length > 0 ? viewingReportSession.strengths : ['STAR Structured Responses', 'Quantified Impact']).map((st, idx) => (
                    <p key={idx} className="text-slate-300 text-[11px]">• {st}</p>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-2">
                <span className="font-bold text-purple-300 text-xs block">Areas for Focus</span>
                <div className="space-y-1">
                  {(viewingReportSession.weaknesses.length > 0 ? viewingReportSession.weaknesses : ['Include explicit metric quantifications']).map((wk, idx) => (
                    <p key={idx} className="text-slate-300 text-[11px]">• {wk}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* PREPARATION RECOMMENDATIONS */}
            <div className="space-y-2 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40">
              <span className="font-bold text-white text-xs block">Grounded Preparation Recommendations</span>
              <div className="space-y-1">
                {(viewingReportSession.preparationRecommendations || []).map((rec, idx) => (
                  <p key={idx} className="text-indigo-200 text-xs">• {rec}</p>
                ))}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setViewingReportSession(null)}
                className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* BOTTOM STATUS BAR */}
      <AIStatusBar
        status={isEvaluating || isStarting ? 'thinking' : 'active'}
        confidence={readinessScore || 90}
        lastUpdated="Interview Agent Active"
      />
    </div>
  );
};

export default InterviewPrepAgentWorkspace;
