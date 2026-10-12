import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  ArrowRight,
  RefreshCw,
  Mic,
  MicOff,
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

/** The parts of the browser Web Speech API this component uses. */
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export interface LiveInterviewRoomProps {
  session: InterviewSession;
  currentQuestion: QuestionItem | null;
  candidateAnswer: string;
  onAnswerChange: (ans: string) => void;
  isEvaluating: boolean;
  onEvaluate: () => void;
  onNextQuestion: () => void;
  onCompleteSession: () => void;
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
}) => {
  // Voice Dictation (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showExpectedConcepts, setShowExpectedConcepts] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

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

  // The dictation handler is created once, so it reads the current answer through a ref
  const answerRef = useRef(candidateAnswer);
  useEffect(() => {
    answerRef.current = candidateAnswer;
  }, [candidateAnswer]);

  // Initialize Speech Recognition if available in browser
  useEffect(() => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      // Final phrases only: interim results would be appended again as they are revised
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          const current = answerRef.current;
          onAnswerChange(current ? `${current} ${transcript.trim()}` : transcript.trim());
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onAnswerChange]);

  const toggleSpeech = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
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
    <div className="space-y-6 font-mono">
      {/* Focused Studio Chamber Container */}
      <div className="relative rounded-3xl bg-slate-950 border border-indigo-500/30 overflow-hidden shadow-2xl">
        {/* Ambient Top Studio Lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-indigo-500/15 via-indigo-600/5 to-transparent blur-2xl pointer-events-none" />

        {/* Minimal Session Top Bar */}
        <div className="relative z-10 px-6 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-4 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                LIVE INTERVIEW ROOM
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-indigo-300 font-semibold">{session.targetCareerTitle}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                {session.mode} Track
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatTimer(secondsElapsed)}</span>
            </div>

            {/* Question Progress Pill */}
            <div className="px-3 py-1 rounded-xl bg-indigo-600/20 border border-indigo-400/40 text-xs text-indigo-200 font-bold">
              QUESTION {qIndex + 1} OF {totalQuestions}
            </div>

            {/* Conclude Session Emergency Exit */}
            <button
              onClick={onCompleteSession}
              type="button"
              className="py-1 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
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
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/30 border border-indigo-500/40 space-y-3 relative shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                      PROMPTER 0{qIndex + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                      {currentQuestion.category} Track
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        currentQuestion.difficulty === 'hard'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : currentQuestion.difficulty === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {currentQuestion.difficulty} Difficulty
                    </span>
                  </div>

                  {currentQuestion.expectedConcepts.length > 0 && (
                    <button
                      onClick={() => setShowExpectedConcepts((prev) => !prev)}
                      type="button"
                      className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showExpectedConcepts ? 'Hide Expected Concepts' : 'Peek Expected Concepts'}</span>
                      {showExpectedConcepts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Question Typography */}
                <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed tracking-wide">
                  {currentQuestion.question}
                  {currentQuestion.groundedIn && (
                    <span className="block mt-3 text-xs font-normal text-slate-400" data-testid="question-grounding">
                      Based on: {currentQuestion.groundedIn}
                      {currentQuestion.source === 'ai' ? ' · written by AI' : currentQuestion.source === 'question_bank' ? ' · from the question bank' : ''}
                    </span>
                  )}
                </h2>

                {/* Expected Concepts Peek (Collapsible) */}
                {showExpectedConcepts && currentQuestion.expectedConcepts.length > 0 && (
                  <div className="pt-3 border-t border-white/10 flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="text-slate-400 font-semibold">Evaluation Rubric Targets:</span>
                    {currentQuestion.expectedConcepts.map((concept) => (
                      <span
                        key={concept}
                        className="px-2 py-0.5 rounded-lg bg-slate-950 text-indigo-300 border border-indigo-500/30 font-medium text-[10px]"
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
                  <span className="font-bold text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Your Response (Target STAR Architecture)
                  </span>

                  {/* Live STAR Heuristic Chips */}
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${
                        hasActionVerbs
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-900 text-slate-500 border border-white/10'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Action Verbs {hasActionVerbs ? '✓' : '(e.g. Architected)'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 ${
                        hasQuantifiedMetrics
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-900 text-slate-500 border border-white/10'
                      }`}
                    >
                      <BarChart2 className="w-3 h-3" />
                      Metrics {hasQuantifiedMetrics ? '✓' : '(e.g. 40% latency)'}
                    </span>

                    <span className="text-slate-500 font-mono">
                      {wordCount} words
                    </span>
                  </div>
                </div>

                {/* Text Response Area */}
                <div className="relative">
                  <textarea
                    value={candidateAnswer}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    disabled={isEvaluating}
                    placeholder="Structure your answer using the STAR method: Situation (Context), Task (Objective), Action (Specific engineering decisions you spearheaded), and Result (Quantified impact and technical trade-offs)..."
                    rows={6}
                    className="w-full p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-white/10 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed transition resize-y"
                  />

                  {/* Dictation Button inside response area */}
                  {speechSupported && (
                    <button
                      onClick={toggleSpeech}
                      type="button"
                      title={isListening ? 'Stop dictation' : 'Start voice dictation'}
                      className={`absolute bottom-4 right-4 p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                        isListening
                          ? 'bg-rose-600/30 border-rose-500 text-rose-300 animate-pulse'
                          : 'bg-slate-800/80 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <Mic className="w-4 h-4 text-rose-400" />
                          <span className="text-[10px]">Listening...</span>
                        </>
                      ) : (
                        <>
                          <MicOff className="w-4 h-4" />
                          <span className="text-[10px]">Voice Dictate</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Actions & Next Flow */}
                <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    {hasEvaluation && (
                      <button
                        onClick={isLastQuestion ? onCompleteSession : onNextQuestion}
                        type="button"
                        className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-400/40 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-lg"
                      >
                        <span>{isLastQuestion ? 'Finalize Round & Open Report' : 'Next Scenario'}</span>
                        <ArrowRight className="w-4 h-4 text-indigo-400" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={onEvaluate}
                    disabled={isEvaluating || !candidateAnswer.trim()}
                    type="button"
                    className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Evaluating Response via STAR Rubric...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>
                          {hasEvaluation ? 'Re-Evaluate Updated Response' : 'Submit for AI Evaluation'}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Real Evaluation Feedback Reveal */}
                {currentQuestion.evaluation && (
                  <div className="mt-4 p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-4 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-indigo-500/20">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-white">AI Evaluation Score & Assessment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            currentQuestion.evaluation.starFormatted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {currentQuestion.evaluation.starFormatted ? 'STAR Formatted' : 'Action / Metrics Required'}
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-slate-900 text-emerald-400 font-bold text-sm border border-emerald-500/40">
                          {currentQuestion.evaluation.score} / 100
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-200 leading-relaxed italic bg-slate-950/60 p-3 rounded-xl border border-white/5">
                      "{currentQuestion.evaluation.feedback}"
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Strengths */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Demonstrated Strengths
                        </span>
                        {currentQuestion.evaluation.strengths.length > 0 ? (
                          <div className="space-y-1">
                            {currentQuestion.evaluation.strengths.map((str, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200"
                              >
                                • {str}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">None detected.</span>
                        )}
                      </div>

                      {/* Improvements */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Recommended Polish & Missing Concepts
                        </span>
                        {currentQuestion.evaluation.improvements.length > 0 ? (
                          <div className="space-y-1">
                            {currentQuestion.evaluation.improvements.map((imp, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200"
                              >
                                • {imp}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">No major gaps identified.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              No active question found in this session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
