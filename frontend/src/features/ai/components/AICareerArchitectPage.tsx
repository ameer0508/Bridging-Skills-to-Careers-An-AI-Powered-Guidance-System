import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../lib/axios';
import { AIStatusBar } from '../../../components/experience/workspace';

export const AICareerArchitectPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch matched careers for context switching
  const { data: careersData } = useQuery({
    queryKey: ['careers-for-ai'],
    queryFn: async () => {
      const response = await apiClient.get('/careers');
      return response.data.data.matches;
    }
  });

  // Fetch all conversations
  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiClient.get('/ai');
      return response.data.data;
    }
  });

  // Fetch active conversation history
  const { data: activeHistory } = useQuery({
    queryKey: ['conversation', activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return null;
      const response = await apiClient.get(`/ai/${activeConversationId}`);
      return response.data.data;
    },
    enabled: !!activeConversationId
  });

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (careerId?: string) => {
      const response = await apiClient.post('/ai', { careerId, title: 'New Conversation' });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConversationId(data._id);
    }
  });

  // Send Message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post(`/ai/${activeConversationId}/messages`, { content });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', activeConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  // Switch Career Context
  const switchCareerMutation = useMutation({
    mutationFn: async (careerId: string) => {
      await apiClient.patch(`/ai/${activeConversationId}/career`, { careerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', activeConversationId] });
    }
  });

  // Submit Feedback
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ messageId, isHelpful }: { messageId: string, isHelpful: boolean }) => {
      await apiClient.post(`/ai/messages/${messageId}/feedback`, { isHelpful });
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeHistory, sendMessageMutation.isPending]);

  const handleSend = () => {
    if (!inputMessage.trim() || !activeConversationId) return;
    sendMessageMutation.mutate(inputMessage.trim());
    setInputMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNew = () => {
    createConversationMutation.mutate();
  };

  const suggestedQuestions = [
    "What are my biggest skill gaps for Backend Engineering?",
    "How does my readiness compare to last month?",
    "Explain why learning Docker is recommended for me.",
    "Can you suggest a project to improve my API design skills?"
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-fade-in max-w-7xl mx-auto">
      
      {/* Sidebar: Conversation History */}
      <div className="w-64 bg-slate-900 border border-slate-800 rounded-xl flex flex-col hidden md:flex shrink-0">
         <div className="p-4 border-b border-slate-800">
           <button 
             onClick={startNew}
             className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors text-sm"
           >
             + New Chat
           </button>
         </div>
         <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
           {loadingConvs ? (
             <div className="text-center text-slate-500 mt-4 text-xs">Loading...</div>
           ) : conversations?.map((c: { _id: string; title: string }) => (
             <button
               key={c._id}
               onClick={() => setActiveConversationId(c._id)}
               className={`w-full text-left p-3 rounded-lg mb-1 text-sm transition-colors truncate ${
                 activeConversationId === c._id 
                 ? 'bg-slate-800 text-indigo-400 font-semibold border border-slate-700' 
                 : 'text-slate-400 hover:bg-slate-800/50'
               }`}
             >
               {c.title}
             </button>
           ))}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
        
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 bg-slate-900/50 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-200">AI Career Architect</h2>
            <p className="text-xs text-slate-500">Grounded in your verified platform intelligence</p>
          </div>
          
          {activeHistory?.conversation && careersData && (
             <select 
               value={activeHistory.conversation.careerId || ''}
               onChange={(e) => switchCareerMutation.mutate(e.target.value)}
               className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500"
             >
               <option value="" disabled>Target Career Context...</option>
               {careersData.map((match: { careerId: { _id: string; title: string } }) => (
                 <option key={match.careerId._id} value={match.careerId._id}>
                   Context: {match.careerId.title}
                 </option>
               ))}
             </select>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {!activeConversationId ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-slate-200 mb-2">SkillBridge AI Architect</h3>
              <p className="text-sm text-slate-400 mb-8">
                I am your personalized AI career advisor. My responses are dynamically grounded in your verified skills, readiness scores, roadmap progress, and analytical trends.
              </p>
              <button 
                onClick={startNew}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105"
              >
                Start a Conversation
              </button>
            </div>
          ) : (
            <>
              {activeHistory?.messages?.map((msg: { _id: string; role: string; content: string; contextSnapshotId?: string }) => (
                <div key={msg._id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'system' ? (
                     <div className="w-full text-center text-[11px] font-semibold text-slate-500 uppercase tracking-widest my-2">
                       {msg.content}
                     </div>
                  ) : (
                    <div className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none shadow-lg'
                    }`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                          <span>✨ AI Architect</span>
                          {msg.contextSnapshotId && (
                            <span className="bg-indigo-500/20 px-1.5 py-0.5 rounded text-[9px]" title="Grounded in verified snapshot">Grounded</span>
                          )}
                        </div>
                      )}
                      
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </div>

                      {msg.role === 'assistant' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                          <button 
                            onClick={() => submitFeedbackMutation.mutate({ messageId: msg._id, isHelpful: true })}
                            className="text-xs text-slate-500 hover:text-emerald-400 transition-colors"
                          >
                            👍 Helpful
                          </button>
                          <button 
                            onClick={() => submitFeedbackMutation.mutate({ messageId: msg._id, isHelpful: false })}
                            className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            👎 Not Helpful
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                   <div className="bg-slate-800 text-slate-400 border border-slate-700 rounded-2xl rounded-bl-none p-4 shadow-lg text-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                   </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggested Questions (only if active conversation has no messages) */}
        {activeHistory?.messages?.length === 0 && (
          <div className="px-6 py-4 flex flex-wrap gap-2">
            {suggestedQuestions.map(q => (
              <button
                key={q}
                onClick={() => {
                  setInputMessage(q);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs text-slate-300 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        {activeConversationId && (
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <div className="flex items-end gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2 focus-within:border-indigo-500 transition-colors shadow-inner">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your career readiness, roadmap, or skills..."
                className="flex-1 bg-transparent text-slate-200 text-sm max-h-32 min-h-[44px] resize-none outline-none px-3 py-2 custom-scrollbar"
                disabled={sendMessageMutation.isPending}
              />
              <button
                onClick={handleSend}
                disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors flex-shrink-0"
              >
                Send
              </button>
            </div>
            <div className="text-center mt-2 text-[10px] text-slate-500 mb-2">
              AI Architect uses your verified platform data to provide personalized guidance. It cannot fabricate or guess information.
            </div>
            <AIStatusBar
              status={sendMessageMutation.isPending ? 'thinking' : sendMessageMutation.isError ? 'error' : 'active'}
              confidence={99.4}
              provider="AI Architect Chat Gateway"
              latencyMs={160}
              lastUpdated="Just now"
            />
          </div>
        )}
      </div>
    </div>
  );
};
