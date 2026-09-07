import { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  careersMatches: ['careers', 'matches'] as const,
  readiness: ['readiness'] as const,
  skillsMe: ['skills', 'me'] as const,
  recommendations: ['recommendations'] as const,
  roadmap: (careerId?: string) => ['roadmap', careerId] as const,
  conversations: ['conversations'] as const,
  conversation: (id?: string | null) => ['conversation', id] as const,
  analytics: (period?: string) => ['analytics', period] as const,
};

export const invalidateTelemetryQueries = (queryClient: QueryClient, careerId?: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.careersMatches });
  queryClient.invalidateQueries({ queryKey: queryKeys.readiness });
  queryClient.invalidateQueries({ queryKey: queryKeys.skillsMe });
  queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
  queryClient.invalidateQueries({ queryKey: ['analytics'] });
  if (careerId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.roadmap(careerId) });
  }
};
