import React from 'react';
import {
  History,
  X,
  ChevronRight,
  Calendar,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';
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
    <div className="space-y-6 font-mono">
      {/* History Header */}
      <GlassPanel className="p-6 border-indigo-500/30 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Return to Studio Lobby"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Your Interview Journey</h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Every practice session you started, with your answers and scores. Select one to open its report.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </GlassPanel>

      {/* History List */}
      {history.length === 0 ? (
        <GlassPanel className="p-12 text-center text-slate-400 text-xs border-dashed border-white/10 space-y-3">
          <History className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No interview sessions recorded yet.</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Complete your first mock interview in the Studio Lobby to build your historical performance trajectory.
          </p>
          <button
            onClick={onClose}
            type="button"
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition"
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
                data-testid="interview-history-item"
                className="p-5 border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer group"
                onClick={() => onSelectSession(sess)}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                        {sess.targetCareerTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase">
                        {sess.mode} Track
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          sess.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        {sess.answeredCount ?? (sess.questions || []).filter((q) => q.candidateResponse).length} of {sess.questions?.length ?? sess.questionCount} answered
                      </span>
                      {sess.opportunityContext?.company && (
                        <span className="text-slate-300">
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
                      <span className="text-[10px] text-slate-500 uppercase block">Score</span>
                      <span
                        className={`text-base font-bold ${
                          score >= 80
                            ? 'text-emerald-400'
                            : score >= 60
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {sess.status === 'completed' ? `${score}%` : 'Not finished'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="p-2 rounded-xl bg-slate-900 group-hover:bg-indigo-600 border border-white/10 group-hover:border-indigo-400 text-slate-400 group-hover:text-white transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
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
