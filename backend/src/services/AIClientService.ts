import axios from 'axios';
import FormData from 'form-data';
import logger from '../config/logger.js';

export interface IUnifiedAIResponse<T = unknown> {
  success: boolean;
  confidence: number;
  provider: string;
  latency: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost_usd: number;
  };
  response: T;
  data: T;
  errors: string[];
  metadata: Record<string, unknown>;
}

class AIClientService {
  private aiServiceUrl: string;

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Sends a file to the AI service for extraction and returns the structured JSON.
   */
  async extractResume(fileBuffer: Buffer, fileName: string): Promise<unknown> {
    try {
      const form = new FormData();
      form.append('file', fileBuffer, { filename: fileName });

      const response = await axios.post(`${this.aiServiceUrl}/api/v1/extract`, form, {
        headers: {
          ...form.getHeaders()
        }
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
   * Generates conversational AI content based on a structured prompt.
   * Includes circuit-breaker-like retries and timeouts for hardening.
   */
  async generateContent(prompt: string): Promise<string> {
    const maxRetries = 2;
    const timeoutMs = 15000; // 15 second timeout for AI responses

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(`${this.aiServiceUrl}/api/v1/chat`, { prompt }, {
          timeout: timeoutMs
        });

        if (response.data && response.data.success) {
          return typeof response.data.data === 'string' ? response.data.data : response.data.response;
        } else {
           throw new Error(response.data?.error || response.data?.errors?.[0] || 'AI generation failed');
        }
      } catch (error: unknown) {
        const err = error as Error;
        logger.warn(`AI generation attempt ${attempt} failed: ${err.message}`);
        if (attempt === maxRetries) {
          logger.error('All AI generation attempts failed', err.message);
          return "I'm currently experiencing high latency or downtime. Please try your request again in a few moments.";
        }
        await new Promise(res => setTimeout(res, 1000 * attempt));
      }
    }
    return "I'm currently experiencing high latency or downtime. Please try your request again in a few moments.";
  }

  /**
   * Invokes Career Matching AI Service.
   */
  async matchCareer(userSkills: string[], targetRole: string, experienceYears: number = 0): Promise<IUnifiedAIResponse> {
    const response = await axios.post(`${this.aiServiceUrl}/api/v1/career/match`, {
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
    const response = await axios.post(`${this.aiServiceUrl}/api/v1/readiness/score`, {
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
    const response = await axios.post(`${this.aiServiceUrl}/api/v1/recommendations/generate`, {
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
    const response = await axios.post(`${this.aiServiceUrl}/api/v1/roadmap/generate`, {
      current_level: currentLevel,
      target_role: targetRole,
      target_months: targetMonths
    });
    return response.data;
  }

  /**
   * Invokes Analytics Engine AI Service.
   */
  async generateAnalytics(userId: string, skillsTrend: Array<Record<string, unknown>> = []): Promise<IUnifiedAIResponse> {
    const response = await axios.post(`${this.aiServiceUrl}/api/v1/analytics/insights`, {
      user_id: userId,
      skills_trend: skillsTrend
    });
    return response.data;
  }

  /**
   * Invokes Resume Intelligence AI Service.
   */
  async analyzeResumeIntelligence(resumeText: string, targetRole?: string): Promise<IUnifiedAIResponse> {
    const response = await axios.post(`${this.aiServiceUrl}/api/v1/resume/intelligence`, {
      resume_text: resumeText,
      target_role: targetRole
    });
    return response.data;
  }
}

export default new AIClientService();
