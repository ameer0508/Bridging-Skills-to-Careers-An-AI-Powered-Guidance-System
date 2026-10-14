import React from 'react';
import {
  History,
  X,
  ChevronRight,
  Calendar,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { Panel as GlassPanel } from '../../../design/aurora/kit';
import { SourceBadge } from './EvaluationProvenance';
import { InterviewSession } from '../../../workspaces/InterviewPrepAgentWorkspace/InterviewPrepAgentWorkspace';

export interface InterviewJourneyHistoryProps {
  history: InterviewSession[];
  onSelectSession: (session: InterviewSession) => void;
  onClose: () => void;
}

export const InterviewJourneyHistory: React.FC<InterviewJourneyHistoryProps> = ({
  history,
  onSelectSession,
  onClose,
}) => {
  return (
    <div className="space-y-6">
      {/* History Header */}
      <GlassPanel className="p-6 border-aurora-violet/25 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-muted hover:text-aurora-indigo transition cursor-pointer"
            title="Return to Studio Lobby"
            aria-label="Back to the studio lobby"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-aurora-indigo" />
              <h2 className="text-base font-bold text-aurora-ink">Your Interview Journey</h2>
            </div>
            <p className="text-[11px] text-aurora-muted">
              Every practice session you started, with your answers and scores. Select one to open its report.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="p-2 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line text-aurora-muted hover:text-aurora-indigo transition cursor-pointer"
          aria-label="Close history"
        >
          <X className="w-4 h-4" />
        </button>
      </GlassPanel>

      {/* History List */}
      {history.length === 0 ? (
        <GlassPanel className="p-12 text-center text-aurora-muted text-xs border-dashed border-aurora-line space-y-3">
          <History className="w-8 h-8 text-aurora-muted mx-auto" />
          <p className="font-semibold text-aurora-muted">No interview sessions recorded yet.</p>
          <p className="text-[11px] text-aurora-muted max-w-sm mx-auto">
            Complete your first mock interview in the Studio Lobby to build your historical performance trajectory.
          </p>
          <button
            onClick={onClose}
            type="button"
            className="py-2 px-4 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white font-bold text-xs cursor-pointer transition"
          >
            Go to Studio Lobby
          </button>
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {history.map((sess) => {
            const score = sess.overallScore || 0;
            const dateStr = new Date(sess.startedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <GlassPanel
                key={sess._id}
                className="p-5 hover:border-aurora-violet/25 transition-all group"
                onClick={() => onSelectSession(sess)}
              >
                <div className="flex items-center justify-between flex-wrap gap-4" data-testid="interview-history-item">
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-aurora-ink group-hover:text-aurora-indigo transition">
                        {sess.targetCareerTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 uppercase">
                        {sess.mode} Track
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          sess.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-aurora-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-aurora-muted" />
                        {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-aurora-muted" />
                        {sess.answeredCount ?? (sess.questions || []).filter((q) => q.candidateResponse).length} of {sess.questions?.length ?? sess.questionCount} answered
                      </span>
                      {sess.opportunityContext?.company && (
                        <span className="text-aurora-muted">
                          For {[sess.opportunityContext.title, sess.opportunityContext.company].filter(Boolean).join(' at ')}
                        </span>
                      )}
                      <SourceBadge kind="questions" source={sess.questionSource} />
                      <SourceBadge kind="scoring" source={sess.evaluationSource} />
                    </div>
                  </div>

                  {/* Score & Review Action */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-aurora-muted uppercase block">Score</span>
                      <span
                        className={`text-base font-bold ${
                          score >= 80
                            ? 'text-emerald-700'
                            : score >= 60
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {sess.status === 'completed' ? `${score}%` : 'Not finished'}
                      </span>
                    </div>

                    <span
                      aria-hidden="true"
                      className="p-2 rounded-xl bg-aurora-canvas group-hover:bg-aurora-violet border border-aurora-line group-hover:border-aurora-violet text-aurora-muted group-hover:text-white transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}
    </div>
  );
};
