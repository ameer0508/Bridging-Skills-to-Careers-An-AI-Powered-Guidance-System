import React, { useState } from 'react';
import { Bot, Sparkles, RefreshCw, Lightbulb, ArrowRight } from 'lucide-react';
import { LightingSurface } from '../lighting/LightingSurface';
import { TypingHeadline } from '../typography/TypingHeadline';
import { SessionMemoryLayer } from './SessionMemoryLayer';

export interface AIConversationLayerProps {
  userName?: string;
  currentReadiness?: number;
  conversationalSummary?: string;
  onExploreAction?: () => void;
  className?: string;
}

export const AIConversationLayer: React.FC<AIConversationLayerProps> = ({
  userName,
  currentReadiness,
  conversationalSummary,
  onExploreAction,
  className = '',
}) => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const returningContext = SessionMemoryLayer.getReturningContextMessage(userName, currentReadiness);

  const mainNarrative =
    conversationalSummary ||
    'I am continuously monitoring your career telemetry. Complete your upcoming roadmap items to unlock advanced skill graph visualizations.';

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <LightingSurface
      profile="glassReflection"
      className={`p-6 rounded-2xl border border-aurora-violet/25 bg-aurora-canvas/60 ${className}`}
    >
      <div className="space-y-4">
        {/* Mentor Header */}
        <div className="flex items-center justify-between pb-3 border-b border-aurora-line">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-sky-500 text-white shadow-lg shadow-indigo-500/20">

              <Bot className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-aurora-ink">AI Career Mentor</h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
                  Active Agent
                </span>
              </div>
              <span className="text-xs text-aurora-muted">Contextual Telemetry Engine</span>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg text-aurora-muted hover:text-aurora-indigo hover:bg-aurora-canvas transition-colors outline-none cursor-pointer"
            title="Refresh AI Mentor Context"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Conversational Narrative Bubble */}
        <div className="space-y-2 p-4 rounded-xl bg-aurora-canvas/60 border border-aurora-line">
          <div className="flex items-center gap-2 text-xs font-semibold text-aurora-indigo">
            <Lightbulb className="w-4 h-4 text-amber-700" />
            <span>Mentor Observation:</span>
          </div>
          <p className="text-sm text-aurora-ink font-medium leading-relaxed">
            <TypingHeadline phrases={[returningContext, mainNarrative]} typingSpeed={25} pauseDuration={8000} />
          </p>
        </div>

        {/* Action Prompt */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-aurora-muted flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-aurora-violet" />
            Advice derived from real readiness & match models
          </span>
          {onExploreAction && (
            <button
              onClick={onExploreAction}
              className="inline-flex items-center gap-1 font-semibold text-aurora-indigo hover:text-aurora-indigo transition-colors outline-none cursor-pointer"
            >
              <span>Explore Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </LightingSurface>
  );
};

export default AIConversationLayer;
