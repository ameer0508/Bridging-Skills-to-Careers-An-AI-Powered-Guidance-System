import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, RefreshCw, MessageSquarePlus, History, MessageSquare } from 'lucide-react';
import { MessageBubble, ChatMessage } from '../MessageBubble';

interface ConversationItem {
  _id: string;
  title: string;
  createdAt: string;
  careerId?: {
    title: string;
  };
}

interface NeuralConversationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  conversations: ConversationItem[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  isLoadingHistory: boolean;
  userName: string;
  onFeedback: (messageId: string, isHelpful: boolean) => void;
  /** True while a question is waiting for its reply. */
  isSending?: boolean;
  /** Why the last question could not be sent at all (network or server error). */
  sendError?: string | null;
  onRetrySend?: () => void;
  /** Asks again for the last question when its reply was a fallback. */
  onRetryReply?: () => void;
  isRetryingReply?: boolean;
}

export const NeuralConversationDrawer: React.FC<NeuralConversationDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  isLoadingHistory,
  userName,
  onFeedback,
  isSending = false,
  sendError = null,
  onRetrySend,
  onRetryReply,
  isRetryingReply = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isSending, sendError]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex justify-end"
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-2xl h-full bg-slate-950/95 border-l border-white/10 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between gap-4 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display text-white">AI Advisory Stream</h2>
              <span className="text-[11px] font-mono text-slate-400">Grounded Multi-Agent History</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] border border-white/10 hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Stream</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thread History Quick Bar */}
        {conversations.length > 1 && (
          <div className="px-6 py-2.5 border-b border-white/5 bg-black/20 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
            <History className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            {conversations.slice(0, 5).map((c) => {
              const isSelected = c._id === activeConversationId;
              return (
                <button
                  key={c._id}
                  onClick={() => onSelectConversation(c._id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {c.title.length > 20 ? c.title.slice(0, 18) + '...' : c.title}
                </button>
              );
            })}
          </div>
        )}

        {/* Message Thread Scrollable List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {isLoadingHistory ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs font-mono">Loading conversation...</span>
            </div>
          ) : messages.length === 0 && !isSending && !sendError ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-cyan-300">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No messages yet</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Ask a question about your skills, readiness or roadmap to start this conversation.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  userName={userName}
                  onFeedback={onFeedback}
                  // Only the latest reply can be asked again
                  onRetry={index === messages.length - 1 && !isSending ? onRetryReply : undefined}
                  isRetrying={isRetryingReply}
                />
              ))}
              {(isSending || isRetryingReply) && (
                <div className="flex items-center gap-2 text-xs text-slate-300" role="status" aria-live="polite" data-testid="chat-pending">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Waiting for the assistant. This can take up to 40 seconds.</span>
                </div>
              )}
              {sendError && !isSending && (
                <div role="alert" className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex flex-wrap items-center justify-between gap-2" data-testid="chat-send-error">
                  <span className="text-xs text-rose-100">Your message was not sent: {sendError}</span>
                  {onRetrySend && (
                    <button type="button" onClick={onRetrySend} className="py-1.5 px-3 rounded-lg bg-slate-900 border border-white/10 text-slate-100 text-xs font-bold cursor-pointer">
                      Send again
                    </button>
                  )}
                </div>
              )}
              <div ref={scrollRef} />
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NeuralConversationDrawer;
