import { aiHttp, actingUser } from './aiHttp.js';
import path from 'path';
import FormData from 'form-data';
import logger from '../config/logger.js';

export interface IUnifiedAIResponse<T = unknown> {
  success: boolean;
  /** Null: the AI service does not measure a confidence for its responses. */
  confidence: number | null;
  provider: string;
  latency: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost_usd: number;
    /**
     * 'provider': counts reported by the model runtime. 'unavailable': no counts were reported, so
     * the zeros are not measurements. 'not_applicable': no language model ran (rule-based result).
     */
    source?: 'provider' | 'unavailable' | 'not_applicable';
    /**
     * Why the cost has its value: 'no_charge_local' or 'no_charge_free_tier' (known to be free),
     * 'not_applicable' (no model ran) or 'unpriced' (no price is known; the 0 is not a verified cost).
     */
    cost_basis?: string;
  };
  response: T;
  data: T;
  errors: string[];
  metadata: Record<string, unknown>;
}

/**
 * Raised when no AI reply could be obtained. Callers show their own labelled fallback.
 * 'rejected': the model answered, but the text failed the AI service's checks against the facts.
 */
export class AiUnavailableError extends Error {
  constructor(message: string, public readonly reason: 'unavailable' | 'timeout' | 'error' | 'busy' | 'rejected') {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

export interface ChatReply {
  text: string;
  provider: string;
  model: string;
}

/**
 * Longest the backend waits for one chat reply. Chat carries personal data, so only the local
 * model answers it; on CPU a reply measured 40-115s. The chain is ordered so the innermost timeout
 * fires first: local model (120s, LOCAL_MODEL_TIMEOUT_SECONDS) < this (130s) < nginx (150s)
 * < browser request (160s).
 */
export const chatAiTimeoutMs = (): number => Number(process.env.CHAT_AI_TIMEOUT_MS) || 130000;

/** Same chain as chat: local model 120s < this < nginx 150s < browser 160s. */
export const explanationAiTimeoutMs = (): number => Number(process.env.EXPLANATION_AI_TIMEOUT_MS) || chatAiTimeoutMs();

/** The facts sent for a career-match explanation (built by the backend from the stored match). */
export interface CareerMatchExplanationFacts {
  career_title: string;
  match_score: number;
  evidence_share_percent: number;
  requirements: Array<{ skill: string; importance: 'required' | 'preferred' | 'supporting'; status: 'applied' | 'listed' | 'inferred' | 'missing' }>;
  required: ExplanationStatusCounts;
  preferred: ExplanationStatusCounts;
  supporting: ExplanationStatusCounts;
  top_missing: string[];
}

export interface ExplanationStatusCounts {
  total: number;
  applied: number;
  listed: number;
  inferred: number;
  missing: number;
}

export interface ExplanationReply {
  text: string;
  provider: string;
  model: string;
  promptVersion: string;
  latencyMs: number;
  usage: { promptTokens: number; completionTokens: number; source: string };
}

class AIClientService {
  /**
   * Sends a file to the AI service for extraction and returns the structured JSON.
   */
  async extractResume(fileBuffer: Buffer, fileName: string): Promise<unknown> {
    try {
      const form = new FormData();
      // Only the extension is forwarded; the user's original file name never leaves the backend
      const extension = path.extname(fileName).toLowerCase();
      form.append('file', fileBuffer, { filename: `resume${extension}` });

      const response = await aiHttp.post(`/api/v1/extract`, form, {
        headers: {
          ...form.getHeaders()
        },
        timeout: 60000,
        maxBodyLength: Infinity
      });

      if (response.data && response.data.success) {
        return response.data.data !== undefined ? response.data.data : response.data.response;
      } else {
        throw new Error('AI Service returned an unexpected response structure.');
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to communicate with AI Service', err.message || String(err));
      throw new Error(`AI Extraction failed: ${err.message || 'Unknown error'}`, { cause: error });
    }
  }

  /**
   * Asks the AI service for a chat reply.
   *
   * Returns the provider's text together with the provider and model that produced it, or
   * throws AiUnavailableError. It never returns a made-up reply. A dropped connection is retried
   * once; "no provider" answers and timeouts are not, since repeating them only adds delay.
   */
  async generateChat(prompt: string): Promise<ChatReply> {
    const timeoutMs = chatAiTimeoutMs();
    const startedAt = Date.now();

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await aiHttp.post(`/api/v1/chat`, { prompt }, {
          timeout: Math.max(1000, timeoutMs - (Date.now() - startedAt)),
        });
        const text = typeof response.data?.data === 'string' ? response.data.data : response.data?.response;
        if (response.data?.success && typeof text === 'string' && text.trim()) {
          return {
            text: text.trim(),
            provider: String(response.data.provider || 'unknown'),
            model: String(response.data.model || 'unknown'),
          };
        }
        throw new AiUnavailableError('The AI service returned no reply.', 'error');
      } catch (error: unknown) {
        if (error instanceof AiUnavailableError) throw error;
        const err = error as { code?: string; message?: string; response?: { status?: number; data?: unknown } };
        const status = err.response?.status;
        const timedOut = err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '');
        logger.warn(`AI chat attempt ${attempt} failed: ${status ? `HTTP ${status}` : err.code || err.message}`);

        if (timedOut) throw new AiUnavailableError('The AI service did not answer in time.', 'timeout');
        if (status) {
          // AI_BUSY: the local model is at capacity and refused at once; nothing was generated
          if (status === 503 && (err.response as { data?: { code?: string } } | undefined)?.data?.code === 'AI_BUSY') {
            throw new AiUnavailableError('The AI service is busy with other requests.', 'busy');
          }
          throw new AiUnavailableError('The AI service has no provider available.', status === 503 ? 'unavailable' : 'error');
        }
        // No HTTP response at all: the connection failed. Worth one more try if time remains.
        if (attempt === 2 || Date.now() - startedAt > timeoutMs / 2) {
          throw new AiUnavailableError('The AI service could not be reached.', 'unavailable');
        }
        await new Promise(res => setTimeout(res, 300));
      }
    }
    throw new AiUnavailableError('The AI service could not be reached.', 'unavailable');
  }

  /**
   * Asks the local model to explain a career-match result. The AI service only lets the local
   * model answer and returns the text only after checking it against the facts; otherwise this
   * throws AiUnavailableError ('busy', 'unavailable', 'timeout', 'rejected' or 'error'). Not
   * retried: a repeat would only add a slow generation.
   */
  async explainCareerMatch(facts: CareerMatchExplanationFacts): Promise<ExplanationReply> {
    return this.explainFacts('career-match', facts);
  }

  /**
   * Asks the local model to explain one subject's facts (career-match, readiness, skill-gap,
   * next-action), with the same guarantees as explainCareerMatch.
   */
  async explainFacts(subjectPath: string, facts: object): Promise<ExplanationReply> {
    try {
      const response = await aiHttp.post(`/api/v1/explain/${subjectPath}`, { facts }, { timeout: explanationAiTimeoutMs() });
      const body = response.data ?? {};
      const text = body.data?.text;
      if (!body.success || typeof text !== 'string' || !text.trim()) {
        throw new AiUnavailableError('The AI service returned no explanation.', 'error');
      }
      if (body.provider === 'mock') {
        // The development mock is canned text, never an explanation
        throw new AiUnavailableError('The AI service answered with a test provider.', 'unavailable');
      }
      return {
        text: text.trim(),
        provider: String(body.provider || 'unknown'),
        model: String(body.model || 'unknown'),
        promptVersion: String(body.prompt_version || 'unknown'),
        latencyMs: Number(body.latency) || 0,
        usage: {
          promptTokens: Number(body.usage?.prompt_tokens) || 0,
          completionTokens: Number(body.usage?.completion_tokens) || 0,
          source: String(body.usage?.source || 'unavailable'),
        },
      };
    } catch (error: unknown) {
      if (error instanceof AiUnavailableError) throw error;
      const err = error as { code?: string; message?: string; response?: { status?: number; data?: { code?: string; reasons?: unknown } } };
      const status = err.response?.status;
      const code = err.response?.data?.code;
      if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '') || code === 'AI_TIMEOUT') {
        throw new AiUnavailableError('The local AI model did not answer in time.', 'timeout');
      }
      if (code === 'AI_BUSY') throw new AiUnavailableError('The local AI model is busy with other requests.', 'busy');
      if (code === 'EXPLANATION_REJECTED') {
        logger.info(`Explanation rejected by the AI service's checks: ${JSON.stringify(err.response?.data?.reasons ?? [])}`);
        throw new AiUnavailableError('The explanation did not agree with the verified facts.', 'rejected');
      }
      logger.warn(`Explanation request failed: ${status ? `HTTP ${status}` : err.code || err.message}`);
      throw new AiUnavailableError('The local AI model is unavailable.', !status || status === 503 ? 'unavailable' : 'error');
    }
  }

  /**
   * Invokes Career Matching AI Service.
   */
  async matchCareer(userSkills: string[], targetRole: string, experienceYears: number = 0): Promise<IUnifiedAIResponse> {
    const response = await aiHttp.post(`/api/v1/career/match`, {
      user_skills: userSkills,
      target_role: targetRole,
      experience_years: experienceYears
    });
    return response.data;
  }

  /**
   * Invokes Readiness Score AI Service.
   */
  async calculateReadiness(userSkills: string[], requiredSkills: string[], roleTitle: string): Promise<IUnifiedAIResponse> {
    const response = await aiHttp.post(`/api/v1/readiness/score`, {
      user_skills: userSkills,
      required_skills: requiredSkills,
      role_title: roleTitle
    });
    return response.data;
  }

  /**
   * Invokes Recommendation Engine AI Service.
   */
  async generateRecommendations(userSkills: string[], careerGoal: string, preferredLearningStyle: string = 'hands-on'): Promise<IUnifiedAIResponse> {
    const response = await aiHttp.post(`/api/v1/recommendations/generate`, {
      user_skills: userSkills,
      career_goal: careerGoal,
      preferred_learning_style: preferredLearningStyle
    });
    return response.data;
  }

  /**
   * Invokes Roadmap Generator AI Service.
   */
  async generateRoadmap(currentLevel: string, targetRole: string, targetMonths: number = 6): Promise<IUnifiedAIResponse> {
    const response = await aiHttp.post(`/api/v1/roadmap/generate`, {
      current_level: currentLevel,
      target_role: targetRole,
      target_months: targetMonths
    });
    return response.data;
  }

  /**
   * Asks the AI service for predictive analytics. It answers that they are unavailable
   * (`available: false`, `status: 'insufficient_evidence'`) and produces no forecast, salary or
   * growth figure: no licensed data exists to ground them. Not used by any product screen.
   */
  async generateAnalytics(userId: string, skillsTrend: Array<Record<string, unknown>> = []): Promise<Record<string, unknown>> {
    // userId must be the authenticated user: the AI service refuses a body user_id that differs
    // from the acting user named here
    const response = await aiHttp.post(`/api/v1/analytics/insights`, {
      user_id: userId,
      skills_trend: skillsTrend
    }, { headers: actingUser(userId) });
    return response.data;
  }

  /**
   * Invokes Resume Intelligence AI Service.
   */
  async analyzeResumeIntelligence(resumeText: string, targetRole?: string): Promise<IUnifiedAIResponse> {
    const response = await aiHttp.post(`/api/v1/resume/intelligence`, {
      resume_text: resumeText,
      target_role: targetRole
    });
    return response.data;
  }

  /**
   * Probes the AI service health and returns provider readiness telemetry.
   */
  async getProviderStatus(): Promise<{
    isOnline: boolean;
    isLive: boolean;
    primaryProvider: string;
    model: string;
  }> {
    try {
      const response = await aiHttp.get(`/api/v1/health`, { timeout: 2000 });
      if (response.data && response.data.status === 'healthy') {
        const providers = response.data.providers || {};
        // The AI service reports the local model available only once it is downloaded and allowed.
        // It answers chat and every personal-data feature, so it is named first.
        if (providers.local?.available) {
          const modelName = String(providers.local?.default_model || 'local');
          return {
            isOnline: true,
            isLive: true,
            primaryProvider: `Local Ollama (${modelName})`,
            model: modelName,
          };
        }
        const geminiAvailable = Boolean(providers.gemini?.available);
        const openaiAvailable = Boolean(providers.openai?.available);
        if (geminiAvailable) {
          const modelName = providers.gemini?.default_model || 'gemini-3.6-flash';
          return {
            isOnline: true,
            isLive: true,
            primaryProvider: `Google Gemini (${modelName})`,
            model: modelName,
          };
        }
        if (openaiAvailable) {
          return {
            isOnline: true,
            isLive: true,
            primaryProvider: 'OpenAI GPT-4o Mini',
            model: providers.openai?.default_model || 'gpt-4o-mini',
          };
        }
        return {
          isOnline: true,
          isLive: false,
          primaryProvider: 'Local AI Fallback (Deterministic Mode)',
          model: 'mock-v1',
        };
      }
    } catch {
      // AI service offline or unreachable
    }
    return {
      isOnline: false,
      isLive: false,
      primaryProvider: 'Local Rule Engine (Offline Fallback)',
      model: 'deterministic-v1',
    };
  }
}

export default new AIClientService();

