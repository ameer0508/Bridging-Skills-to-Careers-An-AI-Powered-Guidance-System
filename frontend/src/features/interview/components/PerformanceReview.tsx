import React, { useState } from 'react';
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Target,
  BookOpen,
  Briefcase,
  Compass,
  FileText,
  ChevronRight,
  ShieldAlert} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';
import { DimensionBars, SourceBadge } from './EvaluationProvenance';
import { RubricNote } from './RubricControls';
import { EvaluationDetails } from './EvaluationDetails';
import { HEURISTIC_NOTICE } from './evaluationLabels';
import { InterviewSession, QuestionItem } from '../../../workspaces/InterviewPrepAgentWorkspace/InterviewPrepAgentWorkspace';

export interface PerformanceReviewProps {
  session: InterviewSession;
  opportunityContext?: {
    id?: string;
    title?: string;
    company?: string;
  } | null;
  onPracticeAgain: () => void;
  onNavigateToRoadmap: () => void;
  onNavigateToReadiness: () => void;
  onReturnToOpportunity?: () => void;
}

export const PerformanceReview: React.FC<PerformanceReviewProps> = ({
  session,
  opportunityContext,
  onPracticeAgain,
  onNavigateToRoadmap,
  onNavigateToReadiness,
  onReturnToOpportunity,
}) => {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);

  const overallScore = session.overallScore || 0;
  const questions = session.questions || [];
  const selectedQuestion: QuestionItem | undefined = questions[selectedQuestionIndex];

  const answeredCount = session.answeredCount ?? questions.filter((q) => q.candidateResponse).length;
  const jobContext = session.opportunityContext?.company
    ? [session.opportunityContext.title, session.opportunityContext.company].filter(Boolean).join(' at ')
    : null;

  return (
    <div className="space-y-6 font-mono">
      {/* Debrief Room Hero Header */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/50 border border-indigo-500/30 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {session.status === 'completed' ? 'INTERVIEW COMPLETED' : 'INTERVIEW IN PROGRESS'}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                {session.mode} Track
              </span>
              <SourceBadge kind="questions" source={session.questionSource} />
              <SourceBadge kind="scoring" source={session.evaluationSource} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {session.targetCareerTitle} Interview Debrief
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              {jobContext ? `Practice for ${jobContext}. ` : ''}Scores come from the answers you gave in this session.
              Unanswered questions count as zero in the overall score.
            </p>
            <RubricNote rubricId={session.rubricId} />
            {session.followUpSummary && (
              <p className="mt-2 text-xs text-slate-400" data-testid="follow-up-summary">
                Follow-ups: {session.followUpSummary.asked} asked, {session.followUpSummary.answered} answered; the missing point was
                recovered in {session.followUpSummary.recovered}. Follow-up answers are not part of the overall score.
              </p>
            )}
          </div>

          {/* Overall Score Dial */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-white/10 shrink-0">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-emerald-400 flex items-center justify-center bg-slate-900">
              <span className="text-xl font-bold text-white">{overallScore}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Overall Performance</span>
              <span className="text-sm font-bold text-emerald-400">
                Practice score
              </span>
              <span className="text-[10px] text-slate-500 block">
                {answeredCount} of {questions.length} questions answered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dimensional Breakdown & Consolidated Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dimensions & Strengths (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Dimensional Readiness Profile */}
          <GlassPanel className="p-6 space-y-4 border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                Dimensional Evaluation Profile
              </span>
              <span className="text-[10px] text-slate-400">Average over answered questions</span>
            </div>

            <DimensionBars dimensions={session.dimensionScores} />
            {(session.evaluationSource === 'heuristic' || session.evaluationSource === 'mixed') && (
              <p className="text-[11px] text-amber-200/90 leading-relaxed border-t border-white/5 pt-3" data-testid="heuristic-notice">
                {HEURISTIC_NOTICE}
              </p>
            )}
          </GlassPanel>

          {/* Consolidated Strengths & Weaknesses */}
          <GlassPanel className="p-6 space-y-4 border-indigo-500/30">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Consolidated Performance Signals
            </span>

            <div className="space-y-4 text-xs">
              {/* Strengths */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Top Demonstrated Strengths
                </span>
                {session.strengths && session.strengths.length > 0 ? (
                  <div className="space-y-1.5">
                    {session.strengths.map((str, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-[11px] leading-relaxed"
                      >
                        ✓ {str}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 text-[11px]">No distinct strengths indexed.</span>
                )}
              </div>

              {/* Weaknesses */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  High-Priority Improvement Areas
                </span>
                {session.weaknesses && session.weaknesses.length > 0 ? (
                  <div className="space-y-1.5">
                    {session.weaknesses.map((weak, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed"
                      >
                        • {weak}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 text-[11px]">No critical weaknesses detected.</span>
                )}
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Right Column: Recommendations & Cross-System Actions (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Actionable Next Steps */}
          <GlassPanel className="p-6 space-y-4 border-indigo-500/30">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              Prescribed Next Action Plan
            </span>

            <div className="space-y-2">
              {session.preparationRecommendations && session.preparationRecommendations.length > 0 ? (
                session.preparationRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-slate-300 text-xs leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0 border border-indigo-500/30 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))
              ) : (
                <span className="text-slate-500 text-xs">No explicit recommendations recorded.</span>
              )}
            </div>
          </GlassPanel>

          {/* Cross-System Navigation Triggers */}
          <GlassPanel className="p-6 space-y-3 border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              SkillBridge Ecosystem Integration
            </span>

            <div className="space-y-2.5">
              {/* Practice Again */}
              <button
                onClick={onPracticeAgain}
                type="button"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-between transition cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Start Another Interview Session</span>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Learning Roadmap */}
              <button
                onClick={onNavigateToRoadmap}
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>Bridge Gaps in Learning Roadmap</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Career Readiness */}
              <button
                onClick={onNavigateToReadiness}
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>Inspect Overall Career Readiness</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Return to Job Opportunity (if applicable) */}
              {opportunityContext && onReturnToOpportunity && (
                <button
                  onClick={onReturnToOpportunity}
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 hover:text-white font-medium text-xs flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-cyan-400" />
                    <span>Return to Opportunity ({opportunityContext.company})</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </button>
              )}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Interactive Question-by-Question Answer Inspector */}
      <GlassPanel className="p-6 sm:p-8 space-y-6 border-indigo-500/40">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Question-by-Question Answer Inspector
            </span>
            <p className="text-[11px] text-slate-400">
              Select any scenario to review your exact submitted response and detailed AI rubric feedback.
            </p>
          </div>

          {/* Scenario Selector Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {questions.map((q, idx) => {
              const isSelected = selectedQuestionIndex === idx;
              const score = q.evaluation?.score || 0;
              const isStar = q.evaluation?.starFormatted;

              return (
                <button
                  key={q.questionId || idx}
                  onClick={() => setSelectedQuestionIndex(idx)}
                  type="button"
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-white/10'
                  }`}
                >
                  <span>Q{idx + 1}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      score >= 80
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : score >= 60
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {q.evaluation?.notScored ? 'not scored' : `${score}%`}
                  </span>
                  {isStar && <span className="text-emerald-400 text-[10px]">★</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Question Detail Card */}
        {selectedQuestion ? (
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-indigo-500/30 space-y-6">
            {/* Scenario Header */}
            <div className="space-y-2 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  SCENARIO 0{selectedQuestionIndex + 1}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  {selectedQuestion.category} Track
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-white/10 uppercase">
                  {selectedQuestion.difficulty}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                {selectedQuestion.question}
                {selectedQuestion.groundedIn && (
                  <span className="block mt-2 text-[11px] font-normal text-slate-400">Based on: {selectedQuestion.groundedIn}</span>
                )}
              </h3>
            </div>

            {/* Candidate Submitted Response */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Your Submitted Answer:
              </span>
              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                {selectedQuestion.candidateResponse || (
                  <span className="text-slate-500 italic">No response submitted for this question.</span>
                )}
              </div>
            </div>

            {/* AI Evaluation Rubric Breakdown */}
            {selectedQuestion.evaluation ? (
              <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-4 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Evaluation
                  </span>
                  <SourceBadge kind="scoring" source={selectedQuestion.evaluation.source} />
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedQuestion.evaluation.starFormatted
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {selectedQuestion.evaluation.starFormatted ? 'STAR structure detected' : 'STAR structure not detected'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-xl bg-slate-900 text-emerald-400 font-bold border border-emerald-500/40">
                      {selectedQuestion.evaluation.notScored ? 'Not scored' : `Score: ${selectedQuestion.evaluation.score}/100`}
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-white/5">
                  {selectedQuestion.evaluation.feedback}
                </p>

                <DimensionBars dimensions={selectedQuestion.evaluation.dimensions} />
                <EvaluationDetails evaluation={selectedQuestion.evaluation} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* What Worked */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      What Worked (Strengths)
                    </span>
                    {selectedQuestion.evaluation.strengths.length > 0 ? (
                      selectedQuestion.evaluation.strengths.map((str, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200"
                        >
                          • {str}
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px]">None identified.</span>
                    )}
                  </div>

                  {/* What to Improve */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      What Could Improve
                    </span>
                    {selectedQuestion.evaluation.improvements.length > 0 ? (
                      selectedQuestion.evaluation.improvements.map((imp, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200"
                        >
                          • {imp}
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px]">No specific improvements needed.</span>
                    )}
                  </div>
                </div>

                {/* Missing Concepts */}
                {selectedQuestion.evaluation.missingConcepts &&
                  selectedQuestion.evaluation.missingConcepts.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Key Engineering Concepts Missed
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedQuestion.evaluation.missingConcepts.map((mc, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px]"
                          >
                            {mc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs">
                No evaluation recorded for this question.
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            Select a question above to inspect its details.
          </div>
        )}
      </GlassPanel>
    </div>
  );
};
