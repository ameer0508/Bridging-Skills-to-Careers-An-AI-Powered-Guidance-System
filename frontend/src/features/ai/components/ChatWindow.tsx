import React, { useRef, useEffect } from 'react';
import { Sparkles, Send, PanelLeftOpen, PanelRightOpen, RefreshCw } from 'lucide-react';
import { MessageBubble, ChatMessage } from './MessageBubble';

export interface ChatWindowProps {
  messages: ChatMessage[];
  inputMessage: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  isSending?: boolean;
  userName?: string;
  suggestedPrompts?: string[];
  onSelectPrompt?: (prompt: string) => void;
  onFeedback?: (messageId: string, isHelpful: boolean) => void;
  onToggleLeftDrawer?: () => void;
  onToggleRightDrawer?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages = [],
  inputMessage,
  onInputChange,
  onSend,
  isLoading = false,
  isSending = false,
  userName = 'User',
  suggestedPrompts = [],
  onSelectPrompt,
  onFeedback,
  onToggleLeftDrawer,
  onToggleRightDrawer,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-aurora-canvas/60">
      {/* COCKPIT HEADER */}
      <div className="h-14 px-4 border-b border-aurora-line bg-aurora-canvas/60 flex items-center justify-between gap-3 shrink-0 select-none">
        <div className="flex items-center gap-3">
          {onToggleLeftDrawer && (
            <button
              onClick={onToggleLeftDrawer}
              title="Toggle Career Context Drawer"
              className="lg:hidden p-1.5 rounded-lg text-aurora-muted hover:text-aurora-indigo hover:bg-aurora-canvas transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
            <span className="font-display font-bold text-xs text-aurora-ink tracking-tight">
              AI Career Architect
            </span>
            <span className="px-2 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-indigo text-[9px] font-bold border border-aurora-violet/25">
              Grounded Telemetry
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleRightDrawer && (
            <button
              onClick={onToggleRightDrawer}
              title="Toggle Strategy Panel Drawer"
              className="lg:hidden p-1.5 rounded-lg text-aurora-muted hover:text-aurora-indigo hover:bg-aurora-canvas transition-colors cursor-pointer"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SCROLLABLE MESSAGE THREAD */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-aurora-muted">
            <RefreshCw className="w-6 h-6 animate-spin text-aurora-indigo" />
            <span className="text-xs tabular-nums">Retrieving Intelligence History...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 p-6">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1px] shadow-xl">
              <div className="w-full h-full bg-aurora-canvas rounded-[15px] flex items-center justify-center text-aurora-violet">
                <Sparkles className="w-7 h-7" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold font-display text-aurora-ink">
                SkillBridge AI Career Architect
              </h3>
              <p className="text-xs text-aurora-muted leading-relaxed">
                Your AI advisor synthesizes your skill profile, readiness score, and active learning roadmap to deliver empirical career guidance.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              userName={userName}
              onFeedback={onFeedback}
            />
          ))
        )}

        {/* Sending Animation Indicator */}
        {isSending && (
          <div className="flex justify-start">
            <div className="p-3 bg-aurora-canvas border border-aurora-line rounded-2xl rounded-bl-none flex items-center gap-2 text-aurora-muted text-xs tabular-nums">
              <Sparkles className="w-4 h-4 text-aurora-violet animate-spin" />
              <span>AI Architect is analyzing telemetry...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* SMART STARTER PROMPT CHIPS */}
      {messages.length === 0 && suggestedPrompts.length > 0 && onSelectPrompt && (
        <div className="px-4 py-2 border-t border-aurora-line bg-aurora-canvas/60 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-[10px] text-aurora-muted shrink-0 uppercase font-bold">Suggestions:</span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(prompt)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-aurora-canvas hover:bg-aurora-canvas text-aurora-muted hover:text-aurora-indigo border border-aurora-line text-xs transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* COMPOSER INPUT */}
      <div className="p-3 md:p-4 bg-aurora-canvas border-t border-aurora-line">
        <div className="flex items-end gap-2 p-2 bg-aurora-canvas/60 border border-aurora-line rounded-2xl focus-within:border-aurora-violet/25 transition-colors">
          <textarea
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            rows={1}
            placeholder="Ask about skill gaps, roadmap tasks, or target career guidance..."
            className="flex-1 bg-transparent text-xs md:text-sm text-aurora-ink placeholder-slate-500 outline-none resize-none px-2 py-1.5 custom-scrollbar min-h-[38px] max-h-28"
          />
          <button
            onClick={onSend}
            disabled={!inputMessage.trim() || isSending}
            className={`py-2 px-4 rounded-xl font-bold text-xs text-aurora-ink flex items-center gap-1.5 transition-all cursor-pointer ${
              inputMessage.trim() && !isSending
                ? '[background:var(--aurora-gradient-action)] hover:brightness-110 shadow-md shadow-indigo-600/30'
                : 'bg-aurora-canvas text-aurora-muted cursor-not-allowed'
            }`}
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-center text-aurora-muted mt-2 tabular-nums">
          Based on your SkillBridge data • answers can be wrong
        </p>
      </div>
    </div>
  );
};

ChatWindow.displayName = 'ChatWindow';
