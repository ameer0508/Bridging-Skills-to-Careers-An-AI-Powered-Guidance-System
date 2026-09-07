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
      className={`p-6 rounded-2xl border border-indigo-500/30 bg-neutral-900/80 backdrop-blur-xl ${className}`}
    >
      <div className="space-y-4">
        {/* Mentor Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-sky-500 text-white shadow-lg shadow-indigo-500/20">

              <Bot className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">AI Career Mentor</h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Active Agent
                </span>
              </div>
              <span className="text-xs text-neutral-400">Contextual Telemetry Engine</span>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors outline-none cursor-pointer"
            title="Refresh AI Mentor Context"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Conversational Narrative Bubble */}
        <div className="space-y-2 p-4 rounded-xl bg-black/40 border border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Mentor Observation:</span>
          </div>
          <p className="text-sm text-neutral-200 font-medium leading-relaxed">
            <TypingHeadline phrases={[returningContext, mainNarrative]} typingSpeed={25} pauseDuration={8000} />
          </p>
        </div>

        {/* Action Prompt */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-neutral-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Advice derived from real readiness & match models
          </span>
          {onExploreAction && (
            <button
              onClick={onExploreAction}
              className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors outline-none cursor-pointer"
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
