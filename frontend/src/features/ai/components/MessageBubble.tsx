import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Copy, Check, ThumbsUp, ThumbsDown, ExternalLink, AlertTriangle, RotateCw } from 'lucide-react';
import { Avatar } from '../../../components/base/Avatar';

export interface ChatMessage {
  _id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  contextSnapshotId?: string;
  /** True when the AI was unavailable and a labelled summary of stored data was shown instead. */
  isFallback?: boolean;
  source?: 'ai' | 'fallback';
  fallbackReason?: 'unavailable' | 'timeout' | 'error' | 'busy';
  /** Set when older history was left out so the prompt fit the model's context window. */
  contextTrimmed?: { droppedMessages: number; keptMessages: number };
  /** Provider and model that wrote an AI reply, as recorded by the server. */
  aiProvider?: string;
  aiModel?: string;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  userName?: string;
  onFeedback?: (messageId: string, isHelpful: boolean) => void;
  /** Shown on a fallback reply that can be asked again. */
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  userName = 'User',
  onFeedback,
  onRetry,
  isRetrying = false,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<'yes' | 'no' | null>(null);

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isFallback = message.role === 'assistant' && (message.isFallback === true || message.source === 'fallback');

  if (isSystem) {
    return (
      <div className="w-full text-center my-3">
        <span className="px-3 py-1 text-[10px] uppercase tracking-widest text-aurora-muted bg-aurora-canvas border border-aurora-line rounded-full">
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

  // Shortcuts to the pages a reply talks about. Not offered on fallback notices.
  const text = message.content.toLowerCase();
  const showSkillAction = !isFallback && (text.includes('skill') || text.includes('gap'));
  const showRoadmapAction = !isFallback && (text.includes('roadmap') || text.includes('phase') || text.includes('week'));
  const showReadinessAction = !isFallback && (text.includes('readiness') || text.includes('score'));
  const showResumeAction = !isFallback && (text.includes('resume') || text.includes('ats'));

  return (
    <div
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
      data-testid="chat-message"
      data-role={message.role}
      data-source={isUser ? 'user' : isFallback ? 'fallback' : message.source || 'ai'}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-600 to-cyan-400 p-[1px] shrink-0 mt-1 shadow-md">
          <div className="w-full h-full bg-aurora-canvas rounded-[11px] flex items-center justify-center text-aurora-violet">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      )}

      <div
        className={`max-w-[88%] md:max-w-[78%] rounded-2xl p-4 space-y-3 shadow-lg ${
          isUser
            ? 'text-white [background:var(--aurora-gradient-action)] rounded-br-none font-medium'
            : isFallback
              ? 'bg-amber-50 border border-amber-200 text-aurora-ink rounded-bl-none'
              : 'bg-aurora-canvas/60 border border-aurora-line text-aurora-ink rounded-bl-none'
        }`}
      >
        {!isUser && isFallback && (
          <div className="flex items-center gap-1.5 pb-2 border-b border-amber-200 text-xs font-bold text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Not an AI reply: the assistant {message.fallbackReason === 'timeout' ? 'timed out' : message.fallbackReason === 'busy' ? 'is busy' : 'is unavailable'}</span>
          </div>
        )}
        {!isUser && !isFallback && (
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-aurora-line text-xs font-bold text-aurora-violet">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI reply</span>
            </div>
            {message.contextSnapshotId && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 text-[10px] tabular-nums" title="The assistant was given your stored skills, readiness and roadmap data">
                <ShieldCheck className="w-3 h-3 text-aurora-violet" />
                Uses your saved data
              </span>
            )}
          </div>
        )}

        <div className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>

        {/* Actionable Feature Shortcuts */}
        {!isUser && (showSkillAction || showRoadmapAction || showReadinessAction || showResumeAction) && (
          <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-aurora-line">
            {showSkillAction && (
              <button
                onClick={() => navigate('/skills')}
                className="px-2.5 py-1 rounded-lg bg-aurora-violet/[0.06] hover:bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View Skill Matrix</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {showRoadmapAction && (
              <button
                onClick={() => navigate('/roadmap')}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-violet-50 text-aurora-violet border border-purple-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Open Roadmap</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {showReadinessAction && (
              <button
                onClick={() => navigate('/readiness')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Check Readiness</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {showResumeAction && (
              <button
                onClick={() => navigate('/resume')}
                className="px-2.5 py-1 rounded-lg bg-aurora-violet/[0.06] hover:bg-aurora-violet/[0.06] text-aurora-violet border border-aurora-violet/25 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Upload Resume</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Where the reply came from, as recorded by the server */}
        {!isUser && !isFallback && (message.aiProvider || message.aiModel) && (
          <p className="pt-2 border-t border-aurora-line text-[10px] text-aurora-muted" data-testid="chat-reply-source">
            Written by {[message.aiProvider, message.aiModel].filter(Boolean).join(' / ')}
          </p>
        )}

        {/* Older history was left out of this reply's prompt; the stored conversation is unchanged */}
        {!isUser && message.contextTrimmed && message.contextTrimmed.droppedMessages > 0 && (
          <p className="text-[10px] text-aurora-muted" data-testid="chat-context-trimmed">
            Based on your profile and the latest {message.contextTrimmed.keptMessages} message{message.contextTrimmed.keptMessages === 1 ? '' : 's'}; {message.contextTrimmed.droppedMessages} earlier message{message.contextTrimmed.droppedMessages === 1 ? ' was' : 's were'} left out to fit the model.
          </p>
        )}

        {isFallback && onRetry && (
          <div className="pt-2 border-t border-amber-200">
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-500/25 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Asking again...' : 'Retry'}</span>
            </button>
          </div>
        )}

        {/* Action Controls for Assistant */}
        {!isUser && !isFallback && (
          <div className="flex items-center justify-between pt-2 border-t border-aurora-line text-xs text-aurora-muted tabular-nums">
            <button
              type="button"
              onClick={handleCopy}
              className="hover:text-aurora-indigo transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            {onFeedback && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleFeedback(true)}
                  className={`hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer ${
                    feedbackSent === 'yes' ? 'text-emerald-700 font-bold' : ''
                  }`}
                  aria-label="Mark helpful"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Helpful</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback(false)}
                  className={`hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer ${
                    feedbackSent === 'no' ? 'text-rose-700 font-bold' : ''
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
