import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

// Feature Components
import { AIWorkspaceHeader } from '../../features/ai/components/AIWorkspaceHeader';
import { ConversationSidebar } from '../../features/ai/components/ConversationSidebar';
import { ChatWindow } from '../../features/ai/components/ChatWindow';
import { AICareerContextPanel } from '../../features/ai/components/AICareerContextPanel';

// Experience Systems & Flagship Architect Components
import {
  CareerArchitectEngine,
  ExplainableStrategyPanel,
  AIThinkingAnimation,
  SkeletonShimmer,
} from '../../components/experience';

export interface ChatMessage {
  _id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  contextSnapshotId?: string;
}

export const AICareerArchitectWorkspace: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [showLeftDrawer, setShowLeftDrawer] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(false);

  // 1. Fetch matched careers for context switching
  const { data: careersData, isLoading: matchesLoading } = useQuery({
    queryKey: ['careers-for-ai'],
    queryFn: async () => {
      const response = await apiClient.get('/careers/matches');
      return response.data.data.matches || [];
    },
  });

  // 2. Fetch Readiness
  const { data: readinessData, isLoading: readinessLoading } = useQuery({
    queryKey: ['readiness'],
    queryFn: async () => {
      const response = await apiClient.get('/readiness');
      return response.data.data.readiness || [];
    },
  });

  // 3. Fetch User Skills
  const { data: skillsData, isLoading: skillsLoading } = useQuery({
    queryKey: ['skills', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/skills/me');
      return response.data.data;
    },
  });

  // 4. Fetch Recommendations
  const { data: recommendationsData, isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await apiClient.get('/recommendations');
      return response.data.data.recommendations || [];
    },
  });

  // 5. Fetch all conversations list
  const { data: conversationsData, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiClient.get('/ai');
      return response.data.data || [];
    },
  });

  const matches = careersData || [];
  const readiness = readinessData || [];
  const totalSkills = skillsData?.totalSkills || 0;
  const recommendations = recommendationsData || [];
  const conversations = conversationsData || [];

  const topMatch = matches[0];
  const topReadiness = readiness[0];
  const topRec = recommendations[0];

  // Active Roadmap Query
  const activeCareerId = topMatch?.careerId?._id;
  const { data: roadmapData, isLoading: roadmapLoading } = useQuery({
    queryKey: ['roadmap', activeCareerId],
    queryFn: async () => {
      if (!activeCareerId) return null;
      const response = await apiClient.get(`/roadmap/${activeCareerId}`);
      return response.data.data.roadmap;
    },
    enabled: !!activeCareerId,
  });

  const firstId = conversations[0]?._id;

  // Auto-select first conversation if available
  useEffect(() => {
    if (!activeConversationId && firstId) {
      setActiveConversationId(firstId);
    }
  }, [activeConversationId, firstId]);

  // Fetch active conversation history
  const { data: activeHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['conversation', activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return null;
      const response = await apiClient.get(`/ai/${activeConversationId}`);
      return response.data.data;
    },
    enabled: !!activeConversationId,
  });

  // Mutation 1: Create New Conversation
  const createConversationMutation = useMutation({
    mutationFn: async (careerId?: string) => {
      const response = await apiClient.post('/ai', { careerId, title: 'New Career Advisory Chat' });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setActiveConversationId(data._id);
    },
  });

  // Mutation 2: Send Message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConversationId) return;
      const response = await apiClient.post(`/ai/${activeConversationId}/messages`, { content });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', activeConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Mutation 3: Switch Target Career Context
  const switchCareerMutation = useMutation({
    mutationFn: async (careerId: string) => {
      if (!activeConversationId) return;
      await apiClient.patch(`/ai/${activeConversationId}/career`, { careerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', activeConversationId] });
      queryClient.invalidateQueries({ queryKey: ['careers-for-ai'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
    },
  });

  // Mutation 4: Feedback
  const feedbackMutation = useMutation({
    mutationFn: async ({ messageId, isHelpful }: { messageId: string; isHelpful: boolean }) => {
      await apiClient.post(`/ai/messages/${messageId}/feedback`, { isHelpful });
    },
  });

  const isLoading = matchesLoading || readinessLoading || skillsLoading || recsLoading || roadmapLoading;

  // Master Comprehensive Architect Strategy
  const architectStrategy = useMemo(() => {
    return CareerArchitectEngine.orchestrateStrategy(
      user?.fullName || 'User',
      matches,
      readiness,
      totalSkills,
      recommendations,
      roadmapData || null
    );
  }, [user, matches, readiness, totalSkills, recommendations, roadmapData]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 px-4">
        <div className="p-12 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center space-y-4 min-h-[260px]">
          <AIThinkingAnimation statusText="Orchestrating Flagship AI Command Center Hub..." />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonShimmer height={180} />
          <SkeletonShimmer height={180} />
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    if (!activeConversationId) {
      createConversationMutation.mutate(undefined, {
        onSuccess: () => {
          sendMessageMutation.mutate(inputMessage.trim());
          setInputMessage('');
        },
      });
    } else {
      sendMessageMutation.mutate(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleStartNewChat = () => {
    createConversationMutation.mutate();
  };

  const suggestedPrompts = [
    'What are my biggest skill gaps for my target career role?',
    'How can I improve my readiness score over the next 30 days?',
    'Explain why specific roadmap tasks are recommended for me.',
    'Suggest a project that demonstrates my core technical strengths.',
  ];

  const currentMessages: ChatMessage[] = activeHistory?.messages || [];
  const activePhase = roadmapData?.phases?.[0];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-7xl mx-auto px-2 sm:px-4 pb-4">
      {/* TOP AI WORKSPACE HEADER */}
      <AIWorkspaceHeader
        careers={matches}
        selectedCareerId={activeHistory?.conversation?.careerId}
        onSelectCareerContext={(careerId) => switchCareerMutation.mutate(careerId)}
        onNewChat={handleStartNewChat}
      />

      {/* 3-ZONE AI INTELLIGENCE COCKPIT */}
      <div className="flex-1 flex overflow-hidden border border-white/10 rounded-b-2xl bg-slate-950/70 backdrop-blur-xl shadow-2xl">
        {/* LEFT ZONE: YOUR CAREER CONTEXT (DESKTOP) */}
        <div className="hidden lg:block shrink-0">
          <AICareerContextPanel
            userName={user?.fullName || user?.email?.split('@')[0]}
            targetRole={topMatch?.careerId?.title || user?.targetRole || user?.primaryCareerDomain || 'Target Career Path'}
            readinessScore={topReadiness?.overallScore}
            totalSkills={totalSkills}
            criticalGaps={topMatch?.missingSkills || []}
            activePhaseTitle={activePhase?.title}
            topRecommendationTitle={topRec?.title}
          />
        </div>

        {/* THREAD CONVERSATION SIDEBAR */}
        <div className="hidden md:block shrink-0">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={(id) => setActiveConversationId(id)}
            onNewChat={handleStartNewChat}
            isLoading={loadingConvs}
          />
        </div>

        {/* CENTRAL CONVERSATION COCKPIT */}
        <ChatWindow
          messages={currentMessages}
          inputMessage={inputMessage}
          onInputChange={setInputMessage}
          onSend={handleSend}
          isLoading={loadingHistory}
          isSending={sendMessageMutation.isPending}
          userName={user?.fullName || 'User'}
          suggestedPrompts={suggestedPrompts}
          onSelectPrompt={(p) => setInputMessage(p)}
          onFeedback={(msgId, isHelpful) => feedbackMutation.mutate({ messageId: msgId, isHelpful })}
          onToggleLeftDrawer={() => setShowLeftDrawer(!showLeftDrawer)}
          onToggleRightDrawer={() => setShowRightDrawer(!showRightDrawer)}
        />

        {/* RIGHT ZONE: EXPLAINABLE STRATEGY PANEL (DESKTOP) */}
        <div className="hidden xl:block w-96 border-l border-white/10 bg-slate-950/80 p-4 overflow-y-auto custom-scrollbar shrink-0">
          <ExplainableStrategyPanel
            strategy={architectStrategy}
            onExecuteMilestone={() => navigate('/roadmap')}
          />
        </div>
      </div>
    </div>
  );
};

export default AICareerArchitectWorkspace;
