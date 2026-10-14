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
import { Panel as GlassPanel } from '../../../design/aurora/kit';
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
    <div className="space-y-6">
      {/* Debrief Room Hero Header */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white [background-image:linear-gradient(135deg,rgb(167_139_250/0.10),transparent_55%)] border border-aurora-line overflow-hidden shadow-aurora-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-aurora-violet/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                {session.status === 'completed' ? 'INTERVIEW COMPLETED' : 'INTERVIEW IN PROGRESS'}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 uppercase">
                {session.mode} Track
              </span>
              <SourceBadge kind="questions" source={session.questionSource} />
              <SourceBadge kind="scoring" source={session.evaluationSource} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-aurora-ink tracking-tight">
              {session.targetCareerTitle} Interview Debrief
            </h1>

            <p className="text-xs text-aurora-muted leading-relaxed">
              {jobContext ? `Practice for ${jobContext}. ` : ''}Scores come from the answers you gave in this session.
              Unanswered questions count as zero in the overall score.
            </p>
            <RubricNote rubricId={session.rubricId} />
            {session.followUpSummary && (
              <p className="mt-2 text-xs text-aurora-muted" data-testid="follow-up-summary">
                Follow-ups: {session.followUpSummary.asked} asked, {session.followUpSummary.answered} answered; the missing point was
                recovered in {session.followUpSummary.recovered}. Follow-up answers are not part of the overall score.
              </p>
            )}
          </div>

          {/* Overall Score Dial */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line shrink-0">
            <div className="w-16 h-16 rounded-full border-4 border-aurora-violet/25 border-t-emerald-400 flex items-center justify-center bg-aurora-canvas">
              <span className="text-xl font-bold text-aurora-ink">{overallScore}%</span>
            </div>
            <div>
              <span className="text-[10px] text-aurora-muted uppercase tracking-wider block">Overall Performance</span>
              <span className="text-sm font-bold text-emerald-700">
                Practice score
              </span>
              <span className="text-[10px] text-aurora-muted block">
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
          <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-2">
                <Award className="w-4 h-4 text-aurora-indigo" />
                Dimensional Evaluation Profile
              </span>
              <span className="text-[10px] text-aurora-muted">Average over answered questions</span>
            </div>

            <DimensionBars dimensions={session.dimensionScores} />
            {(session.evaluationSource === 'heuristic' || session.evaluationSource === 'mixed') && (
              <p className="text-[11px] text-amber-800 leading-relaxed border-t border-aurora-line pt-3" data-testid="heuristic-notice">
                {HEURISTIC_NOTICE}
              </p>
            )}
          </GlassPanel>

          {/* Consolidated Strengths & Weaknesses */}
          <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-aurora-indigo" />
              Consolidated Performance Signals
            </span>

            <div className="space-y-4 text-xs">
              {/* Strengths */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Top Demonstrated Strengths
                </span>
                {session.strengths && session.strengths.length > 0 ? (
                  <div className="space-y-1.5">
                    {session.strengths.map((str, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] leading-relaxed"
                      >
                        ✓ {str}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-aurora-muted text-[11px]">No distinct strengths indexed.</span>
                )}
              </div>

              {/* Weaknesses */}
              <div className="space-y-2 pt-2 border-t border-aurora-line">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  High-Priority Improvement Areas
                </span>
                {session.weaknesses && session.weaknesses.length > 0 ? (
                  <div className="space-y-1.5">
                    {session.weaknesses.map((weak, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[11px] leading-relaxed"
                      >
                        • {weak}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-aurora-muted text-[11px]">No critical weaknesses detected.</span>
                )}
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Right Column: Recommendations & Cross-System Actions (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Actionable Next Steps */}
          <GlassPanel className="p-6 space-y-4 border-aurora-violet/25">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-2">
              <Compass className="w-4 h-4 text-aurora-violet" />
              Prescribed Next Action Plan
            </span>

            <div className="space-y-2">
              {session.preparationRecommendations && session.preparationRecommendations.length > 0 ? (
                session.preparationRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line text-aurora-muted text-xs leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-aurora-indigo text-[10px] font-bold flex items-center justify-center shrink-0 border border-aurora-violet/25 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))
              ) : (
                <span className="text-aurora-muted text-xs">No explicit recommendations recorded.</span>
              )}
            </div>
          </GlassPanel>

          {/* Cross-System Navigation Triggers */}
          <GlassPanel className="p-6 space-y-3 border-aurora-line">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-muted block">
              SkillBridge Ecosystem Integration
            </span>

            <div className="space-y-2.5">
              {/* Practice Again */}
              <button
                onClick={onPracticeAgain}
                type="button"
                className="w-full py-3 px-4 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white font-bold text-xs flex items-center justify-between transition cursor-pointer shadow-lg shadow-indigo-600/30"
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
                className="w-full py-2.5 px-4 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-ink hover:text-aurora-indigo font-medium text-xs flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-aurora-violet" />
                  <span>Bridge Gaps in Learning Roadmap</span>
                </div>
                <ChevronRight className="w-4 h-4 text-aurora-muted" />
              </button>

              {/* Career Readiness */}
              <button
                onClick={onNavigateToReadiness}
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-ink hover:text-aurora-indigo font-medium text-xs flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-700" />
                  <span>Inspect Overall Career Readiness</span>
                </div>
                <ChevronRight className="w-4 h-4 text-aurora-muted" />
              </button>

              {/* Return to Job Opportunity (if applicable) */}
              {opportunityContext && onReturnToOpportunity && (
                <button
                  onClick={onReturnToOpportunity}
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-50 hover:bg-sky-100 border border-aurora-violet/25 text-aurora-violet hover:text-aurora-indigo font-medium text-xs flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-aurora-violet" />
                    <span>Return to Opportunity ({opportunityContext.company})</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-aurora-violet" />
                </button>
              )}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Interactive Question-by-Question Answer Inspector */}
      <GlassPanel className="p-6 sm:p-8 space-y-6 border-aurora-violet/25">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-2">
              <FileText className="w-4 h-4 text-aurora-indigo" />
              Question-by-Question Answer Inspector
            </span>
            <p className="text-[11px] text-aurora-muted">
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
                      ? 'text-white shadow-aurora-md ring-1 ring-aurora-violet/40 [background:var(--aurora-gradient-action)]'
                      : 'bg-aurora-canvas/60 text-aurora-muted hover:bg-aurora-canvas border border-aurora-line'
                  }`}
                >
                  <span>Q{idx + 1}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      score >= 80
                        ? 'bg-emerald-50 text-emerald-700'
                        : score >= 60
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {q.evaluation?.notScored ? 'not scored' : `${score}%`}
                  </span>
                  {isStar && <span className="text-emerald-700 text-[10px]">★</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Question Detail Card */}
        {selectedQuestion ? (
          <div className="p-6 rounded-2xl bg-aurora-canvas/60 border border-aurora-violet/25 space-y-6">
            {/* Scenario Header */}
            <div className="space-y-2 pb-4 border-b border-aurora-line">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 uppercase">
                  SCENARIO 0{selectedQuestionIndex + 1}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-aurora-violet border border-purple-500/30 uppercase">
                  {selectedQuestion.category} Track
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-aurora-canvas text-aurora-muted border border-aurora-line uppercase">
                  {selectedQuestion.difficulty}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-aurora-ink leading-relaxed">
                {selectedQuestion.question}
                {selectedQuestion.groundedIn && (
                  <span className="block mt-2 text-[11px] font-normal text-aurora-muted">Based on: {selectedQuestion.groundedIn}</span>
                )}
              </h3>
            </div>

            {/* Candidate Submitted Response */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-aurora-muted tracking-wider block">
                Your Submitted Answer:
              </span>
              <div className="p-4 rounded-xl bg-aurora-canvas border border-aurora-line text-xs text-aurora-ink leading-relaxed whitespace-pre-wrap">
                {selectedQuestion.candidateResponse || (
                  <span className="text-aurora-muted italic">No response submitted for this question.</span>
                )}
              </div>
            </div>

            {/* AI Evaluation Rubric Breakdown */}
            {selectedQuestion.evaluation ? (
              <div className="p-5 rounded-2xl bg-aurora-violet/[0.05] border border-aurora-violet/25 space-y-4 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-aurora-ink flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-aurora-indigo" />
                    Evaluation
                  </span>
                  <SourceBadge kind="scoring" source={selectedQuestion.evaluation.source} />
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedQuestion.evaluation.starFormatted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {selectedQuestion.evaluation.starFormatted ? 'STAR structure detected' : 'STAR structure not detected'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-xl bg-aurora-canvas text-emerald-700 font-bold border border-emerald-200">
                      {selectedQuestion.evaluation.notScored ? 'Not scored' : `Score: ${selectedQuestion.evaluation.score}/100`}
                    </span>
                  </div>
                </div>

                <p className="text-aurora-muted bg-aurora-canvas/60 p-3 rounded-xl border border-aurora-line">
                  {selectedQuestion.evaluation.feedback}
                </p>

                <DimensionBars dimensions={selectedQuestion.evaluation.dimensions} />
                <EvaluationDetails evaluation={selectedQuestion.evaluation} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* What Worked */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      What Worked (Strengths)
                    </span>
                    {selectedQuestion.evaluation.strengths.length > 0 ? (
                      selectedQuestion.evaluation.strengths.map((str, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700"
                        >
                          • {str}
                        </div>
                      ))
                    ) : (
                      <span className="text-aurora-muted text-[11px]">None identified.</span>
                    )}
                  </div>

                  {/* What to Improve */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-aurora-violet tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      What Could Improve
                    </span>
                    {selectedQuestion.evaluation.improvements.length > 0 ? (
                      selectedQuestion.evaluation.improvements.map((imp, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-aurora-violet/[0.06] border border-aurora-violet/20 text-[11px] text-aurora-indigo"
                        >
                          • {imp}
                        </div>
                      ))
                    ) : (
                      <span className="text-aurora-muted text-[11px]">No specific improvements needed.</span>
                    )}
                  </div>
                </div>

                {/* Missing Concepts */}
                {selectedQuestion.evaluation.missingConcepts &&
                  selectedQuestion.evaluation.missingConcepts.length > 0 && (
                    <div className="pt-2 border-t border-aurora-line space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Key Engineering Concepts Missed
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedQuestion.evaluation.missingConcepts.map((mc, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px]"
                          >
                            {mc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="p-4 text-center text-aurora-muted text-xs">
                No evaluation recorded for this question.
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-aurora-muted text-xs">
            Select a question above to inspect its details.
          </div>
        )}
      </GlassPanel>
    </div>
  );
};
