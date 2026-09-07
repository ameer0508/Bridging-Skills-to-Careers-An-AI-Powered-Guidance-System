import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, ChevronDown, ChevronUp, Copy, Check, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Avatar } from '../../../components/base/Avatar';

export interface ChatMessage {
  _id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  contextSnapshotId?: string;
  metadata?: {
    provider?: string;
    model?: string;
    latency?: number;
    confidence?: number;
  };
}

export interface MessageBubbleProps {
  message: ChatMessage;
  userName?: string;
  onFeedback?: (messageId: string, isHelpful: boolean) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  userName = 'User',
  onFeedback,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<'yes' | 'no' | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="w-full text-center my-3">
        <span className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-slate-400 bg-slate-900 border border-white/10 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (helpful: boolean) => {
    setFeedbackSent(helpful ? 'yes' : 'no');
    onFeedback?.(message._id, helpful);
  };

  // Detect Actionable Platform References in Message Content
  const text = message.content.toLowerCase();
  const showSkillAction = text.includes('skill') || text.includes('gap');
  const showRoadmapAction = text.includes('roadmap') || text.includes('phase') || text.includes('week');
  const showReadinessAction = text.includes('readiness') || text.includes('score');
  const showResumeAction = text.includes('resume') || text.includes('ats');

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-600 to-cyan-400 p-[1px] shrink-0 mt-1 shadow-md">
          <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-cyan-300">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      )}

      <div
        className={`max-w-[88%] md:max-w-[78%] rounded-2xl p-4 space-y-3 shadow-lg ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-none font-medium'
            : 'bg-slate-900/90 border border-white/10 text-slate-100 rounded-bl-none backdrop-blur-xl'
        }`}
      >
        {!isUser && (
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10 text-xs font-bold text-cyan-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Architect Advisory</span>
            </div>
            {message.contextSnapshotId && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                Grounded Context
              </span>
            )}
          </div>
        )}

        <div className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>

        {/* Actionable Feature Shortcuts */}
        {!isUser && (showSkillAction || showRoadmapAction || showReadinessAction || showResumeAction) && (
          <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-white/5">
            {showSkillAction && (
              <button
                onClick={() => navigate('/skills')}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View Skill Matrix</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {showRoadmapAction && (
              <button
                onClick={() => navigate('/roadmap')}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Open Roadmap</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {showReadinessAction && (
              <button
                onClick={() => navigate('/readiness')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Check Readiness</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {showResumeAction && (
              <button
                onClick={() => navigate('/resume')}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Upload Resume</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Intelligence Trace Toggle & Expandable Drawer */}
        {!isUser && message.metadata && (
          <div className="pt-2 border-t border-white/5 space-y-2">
            <button
              onClick={() => setShowTrace(!showTrace)}
              className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Intelligence Trace</span>
              {showTrace ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showTrace && (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-[10px] font-mono space-y-1 text-slate-300">
                {message.metadata.provider && <div>Provider: <span className="text-cyan-300">{message.metadata.provider}</span></div>}
                {message.metadata.model && <div>Model: <span className="text-indigo-300">{message.metadata.model}</span></div>}
                {message.metadata.latency && <div>Latency: <span className="text-emerald-300">{message.metadata.latency}ms</span></div>}
                {message.metadata.confidence && <div>Confidence: <span className="text-amber-300">{message.metadata.confidence}</span></div>}
              </div>
            )}
          </div>
        )}

        {/* Action Controls for Assistant */}
        {!isUser && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400 font-mono">
            <button
              type="button"
              onClick={handleCopy}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            {onFeedback && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleFeedback(true)}
                  className={`hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer ${
                    feedbackSent === 'yes' ? 'text-emerald-400 font-bold' : ''
                  }`}
                  aria-label="Mark helpful"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Helpful</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback(false)}
                  className={`hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer ${
                    feedbackSent === 'no' ? 'text-rose-400 font-bold' : ''
                  }`}
                  aria-label="Mark unhelpful"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <Avatar
          name={userName}
          size="sm"
          className="mt-1 shrink-0"
        />
      )}
    </div>
  );
};

MessageBubble.displayName = 'MessageBubble';
