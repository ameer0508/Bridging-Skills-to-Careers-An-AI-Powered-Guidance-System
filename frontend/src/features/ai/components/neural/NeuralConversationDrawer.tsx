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
      className="fixed inset-0 z-50 bg-aurora-canvas/60 backdrop-blur-xl flex justify-end"
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-2xl h-full bg-aurora-canvas/60 border-l border-aurora-line shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="h-16 px-6 border-b border-aurora-line flex items-center justify-between gap-4 bg-aurora-canvas/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 flex items-center justify-center text-aurora-violet">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display text-aurora-ink">AI Advisory Stream</h2>
              <span className="text-[11px] text-aurora-muted">Grounded Multi-Agent History</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.05] border border-aurora-line hover:bg-aurora-canvas text-aurora-ink transition-colors cursor-pointer"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-aurora-violet" />
              <span>New Stream</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-aurora-muted hover:text-aurora-indigo hover:bg-aurora-canvas transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thread History Quick Bar */}
        {conversations.length > 1 && (
          <div className="px-6 py-2.5 border-b border-aurora-line bg-aurora-canvas/60 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
            <History className="w-3.5 h-3.5 text-aurora-muted shrink-0" />
            {conversations.slice(0, 5).map((c) => {
              const isSelected = c._id === activeConversationId;
              return (
                <button
                  key={c._id}
                  onClick={() => onSelectConversation(c._id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-aurora-violet/[0.06] text-aurora-violet border border-aurora-violet/25 font-semibold'
                      : 'text-aurora-muted hover:text-aurora-ink hover:bg-aurora-canvas'
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
            <div className="h-full flex flex-col items-center justify-center gap-3 text-aurora-muted">
              <RefreshCw className="w-6 h-6 animate-spin text-aurora-violet" />
              <span className="text-xs font-mono">Loading conversation...</span>
            </div>
          ) : messages.length === 0 && !isSending && !sendError ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-aurora-line text-aurora-violet">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-aurora-ink">No messages yet</h3>
              <p className="text-xs text-aurora-muted max-w-xs">
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
                <div className="flex items-center gap-2 text-xs text-aurora-muted" role="status" aria-live="polite" data-testid="chat-pending">
                  <RefreshCw className="w-4 h-4 animate-spin text-aurora-violet" />
                  <span>Waiting for the assistant. This can take up to 40 seconds.</span>
                </div>
              )}
              {sendError && !isSending && (
                <div role="alert" className="p-3 rounded-xl border border-rose-200 bg-rose-50 flex flex-wrap items-center justify-between gap-2" data-testid="chat-send-error">
                  <span className="text-xs text-rose-700">Your message was not sent: {sendError}</span>
                  {onRetrySend && (
                    <button type="button" onClick={onRetrySend} className="py-1.5 px-3 rounded-lg bg-aurora-canvas border border-aurora-line text-aurora-ink text-xs font-bold cursor-pointer">
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
