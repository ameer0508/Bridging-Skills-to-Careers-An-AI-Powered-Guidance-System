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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/80 backdrop-blur-xl">
      {/* COCKPIT HEADER */}
      <div className="h-14 px-4 border-b border-white/10 bg-slate-900/40 flex items-center justify-between gap-3 shrink-0 select-none">
        <div className="flex items-center gap-3">
          {onToggleLeftDrawer && (
            <button
              onClick={onToggleLeftDrawer}
              title="Toggle Career Context Drawer"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="font-display font-bold text-xs text-white tracking-tight">
              AI Career Architect
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/30">
              Grounded Telemetry
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleRightDrawer && (
            <button
              onClick={onToggleRightDrawer}
              title="Toggle Strategy Panel Drawer"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SCROLLABLE MESSAGE THREAD */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs font-mono">Retrieving Intelligence History...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 p-6">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1px] shadow-xl">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-cyan-300">
                <Sparkles className="w-7 h-7" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold font-display text-white">
                SkillBridge AI Career Architect
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your AI advisor synthesizes your verified skill profile, readiness score, and active learning roadmap to deliver empirical career guidance.
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
            <div className="p-3 bg-slate-900 border border-white/10 rounded-2xl rounded-bl-none flex items-center gap-2 text-slate-400 text-xs font-mono">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>AI Architect is analyzing telemetry...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* SMART STARTER PROMPT CHIPS */}
      {messages.length === 0 && suggestedPrompts.length > 0 && onSelectPrompt && (
        <div className="px-4 py-2 border-t border-white/5 bg-slate-900/30 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-[10px] font-mono text-slate-500 shrink-0 uppercase font-bold">Suggestions:</span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(prompt)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* COMPOSER INPUT */}
      <div className="p-3 md:p-4 bg-slate-950 border-t border-white/10">
        <div className="flex items-end gap-2 p-2 bg-slate-900/90 border border-white/10 rounded-2xl focus-within:border-indigo-500/50 transition-colors">
          <textarea
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            rows={1}
            placeholder="Ask about skill gaps, roadmap tasks, or target career guidance..."
            className="flex-1 bg-transparent text-xs md:text-sm text-white placeholder-slate-500 outline-none resize-none px-2 py-1.5 custom-scrollbar min-h-[38px] max-h-28"
          />
          <button
            onClick={onSend}
            disabled={!inputMessage.trim() || isSending}
            className={`py-2 px-4 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 transition-all cursor-pointer ${
              inputMessage.trim() && !isSending
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-500 mt-2 font-mono">
          Grounded strictly in verified platform data • Powered by SkillBridge AI Engine
        </p>
      </div>
    </div>
  );
};

ChatWindow.displayName = 'ChatWindow';
