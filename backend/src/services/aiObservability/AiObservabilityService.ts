import aiHttp from '../aiHttp.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * X11: reads the AI gateway's audit log (decisions, failure categories, latency, policy status)
 * from the internal AI service for administrators. The AI service records codes and timings only,
 * never prompts, resume text, error messages or credentials, so nothing sensitive passes through.
 */
export type ObservabilitySection = 'summary' | 'events' | 'providers';

const fetchSection = async (section: ObservabilitySection, params: Record<string, number>) => {
  try {
    const res = await aiHttp.get(`/api/v1/observability/${section}`, { params, timeout: 5000 });
    return res.data?.data;
  } catch {
    throw new AppError('AI observability data is unavailable because the AI service cannot be reached.', 503, 'AI_UNAVAILABLE');
  }
};

const AiObservabilityService = {
  summary: (windowHours: number) => fetchSection('summary', { window_hours: windowHours }),
  events: (limit: number, windowHours: number) => fetchSection('events', { limit, window_hours: windowHours }),
  providers: () => fetchSection('providers', {}),
};

export default AiObservabilityService;
