import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive queries refetching on focus
      retry: 1, // Number of retry attempts on query failure
      staleTime: 1000 * 60 * 5, // 5 minutes caching window before data is considered stale
      gcTime: 1000 * 60 * 30 // Keep unused cache for 30 minutes (replaces cacheTime in v5)
    },
    mutations: {
      retry: false // Do not retry mutation commands automatically
    }
  }
});

export default queryClient;
