import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

// Neural Command Center Spatial Styles & Components
import '../../features/ai/styles/neural_command_center.css';
import {
  NeuralCommandCenterCanvas,
  NeuralCommandDeck,
  NeuralConversationDrawer,
  NeuralStrategyHorizon,
  AICoreState,
} from '../../features/ai/components/neural';

// Experience Systems & Flagship Architect Components
import {
  CareerArchitectEngine,
  AIThinkingAnimation,
  SkeletonShimmer,
} from '../../components/experience';
import { ChatMessage } from '../../features/ai/components/MessageBubble';

export const AICareerArchitectWorkspace: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isConversationDrawerOpen, setIsConversationDrawerOpen] = useState(false);

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
  const { data: conversationsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiClient.get('/ai');
      return response.data.data || [];
    },
  });

  // 6. Fetch Active Resume ATS telemetry
  const { data: resumeData } = useQuery({
    queryKey: ['activeResume'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/resumes/me');
        return response.data.data.resume;
      } catch {
        return null;
      }
    },
  });

  // 7. Fetch Live Opportunity Pipeline Count
  const { data: opportunitiesData } = useQuery({
    queryKey: ['opportunities-count'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/opportunities?limit=10');
        return response.data.data.opportunities || [];
      } catch {
        return [];
      }
    },
  });

  const matches = careersData || [];
  const readiness = readinessData || [];
  const totalSkills = skillsData?.totalSkills || 0;
  const recommendations = Array.isArray(recommendationsData)
    ? recommendationsData
    : (recommendationsData as any)?.recommendations && Array.isArray((recommendationsData as any).recommendations)
      ? (recommendationsData as any).recommendations
      : [];
  const conversations = conversationsData || [];
  const opportunities = opportunitiesData || [];

  const topMatch = matches[0];
  const topReadiness = readiness[0];

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
      const response = await apiClient.post('/ai', { careerId, title: 'Neural Advisory Stream' });
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
      setIsConversationDrawerOpen(true);
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

  const isLoading = matchesLoading || readinessLoading || skillsLoading || recsLoading;

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

  // Derive Dynamic Neural AI Core State
  const aiState: AICoreState = useMemo(() => {
    if (sendMessageMutation.isPending) return 'GENERATING';
    if (sendMessageMutation.isError) return 'ERROR';
    if (loadingHistory || roadmapLoading) return 'RETRIEVING';
    if (isLoading) return 'ANALYZING';
    if (sendMessageMutation.isSuccess) return 'COMPLETED';
    return 'IDLE';
  }, [sendMessageMutation.isPending, sendMessageMutation.isError, sendMessageMutation.isSuccess, loadingHistory, roadmapLoading, isLoading]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;
    const msg = inputMessage.trim();
    if (!activeConversationId) {
      createConversationMutation.mutate(undefined, {
        onSuccess: () => {
          sendMessageMutation.mutate(msg);
          setInputMessage('');
        },
      });
    } else {
      sendMessageMutation.mutate(msg);
      setInputMessage('');
    }
  };

  const handleStartNewChat = () => {
    createConversationMutation.mutate(undefined, {
      onSuccess: () => {
        setIsConversationDrawerOpen(true);
      },
    });
  };

  const suggestedPrompts = [
    'What are my biggest skill gaps for my target career role?',
    'How can I improve my readiness score over the next 30 days?',
    'Explain why specific roadmap tasks are recommended for me.',
    'Suggest a high-impact portfolio project that validates my core proficiencies.',
  ];

  const currentMessages: ChatMessage[] = activeHistory?.messages || [];
  const activePhase = roadmapData?.phases?.[0];
  const targetRoleTitle = topMatch?.careerId?.title || user?.targetRole || user?.primaryCareerDomain || 'Target Career Summit';
  const readinessRating = topReadiness?.overallScore ?? 0;
  const matchFitScore = topMatch?.matchScore ?? 0;
  const atsIndex = resumeData?.atsScore ?? 0;
  const liveOpportunityCount = opportunities.length;

  if (isLoading) {
    return (
      <div className="neural-command-center min-h-screen p-6 sm:p-12 flex flex-col items-center justify-center space-y-6">
        <div className="neural-glass-blade p-12 flex flex-col items-center justify-center space-y-4 max-w-md w-full text-center">
          <AIThinkingAnimation statusText="Connecting to Neural AI Orchestrator..." />
          <span className="text-xs font-mono text-cyan-300">Synchronizing Grounded Telemetry Stream...</span>
        </div>
        <div className="w-full max-w-4xl space-y-4">
          <SkeletonShimmer height={340} />
          <SkeletonShimmer height={120} />
        </div>
      </div>
    );
  }

  return (
    <div className="neural-command-center min-h-screen py-6 px-3 sm:px-8 max-w-7xl mx-auto space-y-8">
      {/* 1. MASTER SPATIAL NEURAL STAGE */}
      <NeuralCommandCenterCanvas
        aiState={aiState}
        targetRole={targetRoleTitle}
        activeDomain={user?.primaryCareerDomain}
        careers={matches}
        selectedCareerId={activeHistory?.conversation?.careerId}
        onSelectCareerContext={(careerId) => switchCareerMutation.mutate(careerId)}
        onNewChat={handleStartNewChat}
        telemetry={{
          totalSkills,
          readinessScore: readinessRating,
          atsScore: atsIndex,
          roadmapProgress: roadmapData?.progressPercentage ?? null,
          activePhaseTitle: activePhase?.title,
          opportunityCount: liveOpportunityCount,
          userDomain: user?.primaryCareerDomain || 'Technology',
        }}
        matchScore={matchFitScore}
        readinessScore={readinessRating}
        atsScore={atsIndex}
        opportunityCount={liveOpportunityCount}
        onOpenConversationDrawer={() => setIsConversationDrawerOpen(true)}
      />

      {/* 2. FLOATING NEURAL COMMAND DECK */}
      <NeuralCommandDeck
        inputMessage={inputMessage}
        onInputChange={setInputMessage}
        onSend={handleSend}
        isSending={sendMessageMutation.isPending}
        suggestedPrompts={suggestedPrompts}
        onSelectPrompt={(p) => {
          setInputMessage(p);
        }}
      />

      {/* 3. EXPLAINABLE AI STRATEGY HORIZON & SCENARIO SIMULATOR */}
      <NeuralStrategyHorizon
        strategy={architectStrategy}
        targetRole={targetRoleTitle}
        readinessScore={readinessRating}
      />

      {/* 4. SLIDE-OVER CONVERSATION ADVISORY DRAWER */}
      <NeuralConversationDrawer
        isOpen={isConversationDrawerOpen}
        onClose={() => setIsConversationDrawerOpen(false)}
        messages={currentMessages}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={handleStartNewChat}
        isLoadingHistory={loadingHistory}
        userName={user?.fullName || user?.email?.split('@')[0] || 'User'}
        onFeedback={(msgId, isHelpful) => feedbackMutation.mutate({ messageId: msgId, isHelpful })}
      />
    </div>
  );
};

export default AICareerArchitectWorkspace;
