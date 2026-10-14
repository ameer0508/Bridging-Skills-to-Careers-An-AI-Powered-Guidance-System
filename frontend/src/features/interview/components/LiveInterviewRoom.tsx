import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  LogOut,
  HelpCircle,
  BarChart2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { QuestionItem, InterviewSession } from '../../../workspaces/InterviewPrepAgentWorkspace/InterviewPrepAgentWorkspace';
import { DictationControl } from './DictationControl';
import { EvaluationDetails } from './EvaluationDetails';
import { RecordingControl } from './RecordingControl';
import { ReadAloudButton } from './ReadAloudButton';

export interface LiveInterviewRoomProps {
  session: InterviewSession;
  currentQuestion: QuestionItem | null;
  candidateAnswer: string;
  onAnswerChange: (ans: string) => void;
  isEvaluating: boolean;
  onEvaluate: () => void;
  onNextQuestion: () => void;
  onCompleteSession: () => void;
  /** D2: how the current answer was entered so far. */
  onInputMethodChange?: (method: 'typed' | 'dictated' | 'mixed') => void;
}

export const LiveInterviewRoom: React.FC<LiveInterviewRoomProps> = ({
  session,
  currentQuestion,
  candidateAnswer,
  onAnswerChange,
  isEvaluating,
  onEvaluate,
  onNextQuestion,
  onCompleteSession,
  onInputMethodChange,
}) => {
  const [showExpectedConcepts, setShowExpectedConcepts] = useState(false);

  // Elapsed Session Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Dictated text is appended to the current answer, read through a ref
  const answerRef = useRef(candidateAnswer);
  useEffect(() => {
    answerRef.current = candidateAnswer;
  }, [candidateAnswer]);

  // D2: whether this answer was typed, dictated or both; reset for every question
  const methodRef = useRef({ typed: false, dictated: false });
  const questionKey = currentQuestion?.questionId;
  useEffect(() => {
    methodRef.current = { typed: false, dictated: false };
    onInputMethodChange?.('typed');
  }, [questionKey, onInputMethodChange]);
  const noteMethod = (kind: 'typed' | 'dictated') => {
    methodRef.current[kind] = true;
    const { typed, dictated } = methodRef.current;
    onInputMethodChange?.(typed && dictated ? 'mixed' : dictated ? 'dictated' : 'typed');
  };
  const appendDictation = (text: string) => {
    const current = answerRef.current;
    onAnswerChange(current ? `${current} ${text}` : text);
    noteMethod('dictated');
  };

  // Real-time STAR telemetry heuristic
  const hasActionVerbs = /built|architected|implemented|developed|designed|led|spearheaded|engineered|refactored|deployed/i.test(
    candidateAnswer
  );
  const hasQuantifiedMetrics = /\d+%|\$\d+|\d+ms|\d+x|\d+k|\d+ RPS|\d+ users|\d+ queries/i.test(
    candidateAnswer
  );
  const wordCount = candidateAnswer.trim().length > 0 ? candidateAnswer.trim().split(/\s+/).length : 0;

  const qIndex = session.currentQuestionIndex;
  const totalQuestions = session.questions.length;
  const isLastQuestion = qIndex >= totalQuestions - 1;
  const hasEvaluation = Boolean(currentQuestion?.evaluation);

  return (
    <div className="space-y-6">
      {/* Focused Studio Chamber Container */}
      <div className="relative rounded-3xl bg-aurora-canvas border border-aurora-line overflow-hidden shadow-aurora-md">
        {/* Ambient Top Studio Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-indigo-500/15 via-indigo-600/5 to-transparent blur-2xl pointer-events-none" />

        {/* Minimal Session Top Bar */}
        <div className="relative z-10 px-6 py-4 border-b border-aurora-line flex items-center justify-between flex-wrap gap-4 bg-aurora-canvas/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-aurora-ink uppercase tracking-wider">
                Interview in progress
              </span>
              <span className="text-aurora-muted">•</span>
              <span className="text-xs text-aurora-indigo font-semibold">{session.targetCareerTitle}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 uppercase">
                {session.mode} Track
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-xs text-aurora-muted">
              <Clock className="w-3.5 h-3.5 text-aurora-indigo" />
              <span>{formatTimer(secondsElapsed)}</span>
            </div>

            {/* Question Progress Pill */}
            <div className="px-3 py-1 rounded-xl bg-violet-50 border border-indigo-400/40 text-xs text-aurora-indigo font-bold">
              QUESTION {qIndex + 1} OF {totalQuestions}
            </div>

            {/* Conclude Session Emergency Exit */}
            <button
              onClick={onCompleteSession}
              type="button"
              className="py-1 px-3 rounded-xl bg-rose-50 hover:bg-rose-50 border border-rose-200 text-rose-700 hover:text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Conclude Round</span>
            </button>
          </div>
        </div>

        {/* Studio Main Chamber Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Question Stage / Prompter */}
          {currentQuestion ? (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-white [background-image:linear-gradient(135deg,rgb(167_139_250/0.10),transparent_55%)] border border-aurora-violet/25 space-y-3 relative shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 uppercase">
                      PROMPTER 0{qIndex + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-aurora-violet border border-purple-500/40 uppercase">
                      {currentQuestion.category} Track
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        currentQuestion.difficulty === 'hard'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : currentQuestion.difficulty === 'medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {currentQuestion.difficulty} Difficulty
                    </span>
                  </div>

                  {currentQuestion.expectedConcepts.length > 0 && (
                    <button
                      onClick={() => setShowExpectedConcepts((prev) => !prev)}
                      type="button"
                      className="text-[11px] text-aurora-muted hover:text-aurora-indigo flex items-center gap-1 transition cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showExpectedConcepts ? 'Hide expected points' : 'Show expected points'}</span>
                      {showExpectedConcepts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {currentQuestion.source === 'follow_up' && (
                  <span
                    className="inline-block rounded-full border border-amber-400/40 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700"
                    data-testid="follow-up-badge"
                  >
                    FOLLOW-UP · not part of the overall score
                  </span>
                )}
                {/* Question Typography */}
                <h2 className="text-base sm:text-lg font-bold text-aurora-ink leading-relaxed tracking-wide">
                  {currentQuestion.question}
                  {currentQuestion.groundedIn && (
                    <span className="block mt-3 text-xs font-normal text-aurora-muted" data-testid="question-grounding">
                      Based on: {currentQuestion.groundedIn}
                      {currentQuestion.source === 'ai'
                        ? ' · written by AI'
                        : currentQuestion.source === 'question_bank'
                          ? ' · from the question bank'
                          : currentQuestion.source === 'follow_up'
                            ? ' · follow-up to your previous answer'
                            : ''}
                    </span>
                  )}
                </h2>

                {/* Expected Concepts Peek (Collapsible) */}
                {showExpectedConcepts && currentQuestion.expectedConcepts.length > 0 && (
                  <div className="pt-3 border-t border-aurora-line flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="text-aurora-muted font-semibold">Evaluation Rubric Targets:</span>
                    {currentQuestion.expectedConcepts.map((concept) => (
                      <span
                        key={concept}
                        className="px-2 py-0.5 rounded-lg bg-aurora-canvas text-aurora-indigo border border-aurora-violet/25 font-medium text-[10px]"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Candidate Response Console */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="font-bold text-aurora-muted flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Your answer
                  </span>

                  {/* Live STAR Heuristic Chips */}
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${
                        hasActionVerbs
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-aurora-canvas text-aurora-muted border border-aurora-line'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Action Verbs {hasActionVerbs ? '✓' : '(e.g. Architected)'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${
                        hasQuantifiedMetrics
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-aurora-canvas text-aurora-muted border border-aurora-line'
                      }`}
                    >
                      <BarChart2 className="w-3 h-3" />
                      Metrics {hasQuantifiedMetrics ? '✓' : '(e.g. 40% latency)'}
                    </span>

                    <span className="text-aurora-muted font-mono">
                      {wordCount} words
                    </span>
                  </div>
                </div>

                {/* Text Response Area */}
                <div className="relative">
                  <textarea
                    value={candidateAnswer}
                    onChange={(e) => {
                      onAnswerChange(e.target.value);
                      noteMethod('typed');
                    }}
                    aria-label="Your answer"
                    disabled={isEvaluating}
                    placeholder="Structure your answer using the STAR method: Situation (Context), Task (Objective), Action (Specific engineering decisions you spearheaded), and Result (Quantified impact and technical trade-offs)..."
                    rows={6}
                    className="w-full p-4 sm:p-5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line text-xs sm:text-sm text-aurora-ink placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed transition resize-y"
                  />

                </div>

                <DictationControl onTranscript={appendDictation} disabled={isEvaluating} />
                <div className="flex flex-wrap items-start gap-3">
                  <ReadAloudButton text={currentQuestion.question} />
                  <RecordingControl sessionId={session._id} questionIndex={qIndex} questionId={currentQuestion.questionId} disabled={isEvaluating} />
                </div>

                {/* Actions & Next Flow */}
                <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    {hasEvaluation && (
                      <button
                        onClick={isLastQuestion ? onCompleteSession : onNextQuestion}
                        type="button"
                        className="py-2.5 px-5 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-indigo-400/40 text-aurora-ink font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-lg"
                      >
                        <span>{isLastQuestion ? 'Finalize Round & Open Report' : 'Next Scenario'}</span>
                        <ArrowRight className="w-4 h-4 text-aurora-indigo" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={onEvaluate}
                    disabled={isEvaluating || !candidateAnswer.trim()}
                    type="button"
                    className="py-2.5 px-6 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Evaluating your answer...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>
                          {hasEvaluation ? 'Evaluate the updated answer' : 'Submit answer for evaluation'}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Real Evaluation Feedback Reveal */}
                {currentQuestion.evaluation && (
                  <div className="mt-4 p-5 rounded-2xl bg-aurora-violet/[0.05] border border-aurora-violet/25 space-y-4 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-aurora-violet/25">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-aurora-indigo" />
                        <span className="font-bold text-aurora-ink">AI Evaluation Score & Assessment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            currentQuestion.evaluation.starFormatted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {currentQuestion.evaluation.starFormatted ? 'STAR Formatted' : 'Action / Metrics Required'}
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-aurora-canvas text-emerald-700 font-bold text-sm border border-emerald-200">
                          {currentQuestion.evaluation.notScored ? 'Not scored' : `${currentQuestion.evaluation.score} / 100`}
                        </span>
                      </div>
                    </div>

                    <p className="text-aurora-ink leading-relaxed italic bg-aurora-canvas/60 p-3 rounded-xl border border-aurora-line">
                      "{currentQuestion.evaluation.feedback}"
                    </p>
                    <EvaluationDetails evaluation={currentQuestion.evaluation} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Strengths */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Demonstrated Strengths
                        </span>
                        {currentQuestion.evaluation.strengths.length > 0 ? (
                          <div className="space-y-1">
                            {currentQuestion.evaluation.strengths.map((str, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700"
                              >
                                • {str}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-aurora-muted">None detected.</span>
                        )}
                      </div>

                      {/* Improvements */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-aurora-violet tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Recommended Polish & Missing Concepts
                        </span>
                        {currentQuestion.evaluation.improvements.length > 0 ? (
                          <div className="space-y-1">
                            {currentQuestion.evaluation.improvements.map((imp, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-lg bg-aurora-violet/[0.06] border border-aurora-violet/20 text-[11px] text-aurora-indigo"
                              >
                                • {imp}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-aurora-muted">No major gaps identified.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-aurora-muted text-xs">
              No active question found in this session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
