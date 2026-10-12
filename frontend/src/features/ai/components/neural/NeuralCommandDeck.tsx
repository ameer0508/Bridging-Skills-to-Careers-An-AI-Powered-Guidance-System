import React from 'react';
import { Send, RefreshCw, Terminal, Command } from 'lucide-react';

interface NeuralCommandDeckProps {
  inputMessage: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  isSending: boolean;
  suggestedPrompts: string[];
  onSelectPrompt: (prompt: string) => void;
}

export const NeuralCommandDeck: React.FC<NeuralCommandDeckProps> = ({
  inputMessage,
  onInputChange,
  onSend,
  isSending,
  suggestedPrompts,
  onSelectPrompt,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim() && !isSending) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full neural-glass-blade p-5 sm:p-7 border-cyan-500/20 shadow-2xl space-y-4">
      {/* 1. Header with Terminal & Prompt Catalysts */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
            Neural Command Interface
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <Command className="w-3 h-3 text-cyan-400" />
          <span>Press Enter to dispatch query</span>
        </div>
      </div>

      {/* 2. Instant Prompt Catalysts */}
      <div className="flex flex-wrap gap-2 pt-1">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="text-left px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.04] border border-white/10 hover:border-cyan-400/40 hover:text-white hover:bg-cyan-500/10 transition-all duration-200 cursor-pointer shadow-sm"
          >
            <span className="text-cyan-400 mr-1.5 font-mono">›</span>
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* 3. Command Input Box with Send Button */}
      <div className="relative rounded-2xl bg-slate-950/80 border border-white/10 focus-within:border-cyan-400/60 focus-within:ring-1 focus-within:ring-cyan-400/40 transition-all duration-200 overflow-hidden shadow-inner">
        <textarea
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Ask your AI Career Architect or issue an orchestration directive..."
          disabled={isSending}
          className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-slate-500 resize-none outline-none custom-scrollbar"
        />

        <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-white/5">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Grounded against verified skill & telemetry state</span>
          </div>

          <button
            type="button"
            onClick={onSend}
            disabled={!inputMessage.trim() || isSending}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Orchestrating...</span>
              </>
            ) : (
              <>
                <span>Execute Query</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NeuralCommandDeck;
