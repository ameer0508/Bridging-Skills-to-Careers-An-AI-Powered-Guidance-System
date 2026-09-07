import React, { useState } from 'react';
import { Bot, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';

import { LightingSurface } from '../lighting/LightingSurface';

export interface AIAdvisorPanelProps {
  recommendedRoleTitle?: string;
  className?: string;
}

export const AIAdvisorPanel: React.FC<AIAdvisorPanelProps> = ({
  recommendedRoleTitle = 'Target Role',
  className = '',
}) => {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const presetQuestions = [
    'What should I focus on this month?',
    'What is currently slowing down my readiness score?',
    'Should I switch to Cloud Architect instead?',
    'What is my highest-impact next learning step?',
  ];

  const getAnswerForQuestion = (q: string) => {
    if (q.includes('focus on this month')) {
      return `Your highest-impact focus for this month is completing your active database indexing and REST API architecture roadmap milestones. This will add +12% to your overall readiness score.`;
    }
    if (q.includes('slowing down')) {
      return `Your readiness model indicates 2 missing skill gaps in production system scalability. Completing your upcoming milestone addresses both gaps.`;
    }
    if (q.includes('switch to Cloud Architect')) {
      return `Switching to Cloud Architect is feasible because you share 60% transferable skills. However, it requires an estimated 45 additional learning hours compared to ${recommendedRoleTitle}.`;
    }
    return `Your highest-impact next step is executing Today's Priority Mission in your Learning Roadmap.`;
  };

  return (
    <LightingSurface
      profile="heroSpotlight"
      className={`p-6 rounded-2xl border border-indigo-500/30 bg-neutral-900/90 backdrop-blur-xl space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">

            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI Strategy Advisor</h3>
            <span className="text-xs text-neutral-400">Contextual Telemetry Q&A Engine</span>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-purple-400" />
      </div>

      {/* Preset Strategic Questions */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-neutral-300">Ask your AI Strategic Advisor:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedQuestion(q)}
              className={`p-2.5 rounded-lg text-xs font-medium text-left transition-all cursor-pointer outline-none flex items-center justify-between ${
                selectedQuestion === q
                  ? 'bg-indigo-600 text-white shadow border border-indigo-400'
                  : 'bg-black/40 text-neutral-300 border border-white/10 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="truncate">{q}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1 opacity-70" />
            </button>
          ))}
        </div>
      </div>

      {/* Answer Output Bubble */}
      {selectedQuestion && (
        <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2 animate-fade-in text-xs">
          <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>Strategic Response:</span>
          </div>
          <p className="text-neutral-200 leading-relaxed font-medium">
            {getAnswerForQuestion(selectedQuestion)}
          </p>
        </div>
      )}
    </LightingSurface>
  );
};

export default AIAdvisorPanel;
