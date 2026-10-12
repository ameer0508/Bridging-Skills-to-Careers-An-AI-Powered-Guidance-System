import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';

/** Mirrors backend/src/services/interview/InterviewRubrics.ts (D5). */
export interface InterviewRubric {
  id: string;
  version: number;
  label: string;
  roles: string[];
  emphasis: string;
  heuristic: { relevance: number; completeness: number; specificity: number; structure: number };
  ai: { relevance: number; completeness: number; specificity: number; structure: number; technicalAccuracy: number };
}

/** The rubrics, and which one a session for `role` would use when none is chosen (resolved by the server). */
export function useInterviewRubrics(role = '') {
  return useQuery({
    queryKey: ['interview-rubrics', role.trim()],
    queryFn: async () => {
      const res = await apiClient.get('/interviews/rubrics', { params: role.trim() ? { role: role.trim().slice(0, 160) } : {} });
      return res.data.data as { rubrics: InterviewRubric[]; resolved: string };
    },
    staleTime: Infinity,
    retry: false,
  });
}
