/**
 * AI Gateway Frontend Service & Telemetry Parser
 * Provides standardized response parsing, confidence calculations, latency tracking,
 * provider badges, and error handling for all AI Gateway endpoints.
 */

export interface AITelemetryUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface UnifiedAIResponseEnvelope<T = unknown> {
  success: boolean;
  confidence: number;
  provider: string;
  latency: number;
  model: string;
  usage: AITelemetryUsage;
  data: T;
  response: T;
  errors: string[];
  metadata: Record<string, unknown>;
}

export interface AIGatewayState {
  status: 'active' | 'thinking' | 'synced' | 'idle' | 'retry' | 'unavailable' | 'error';
  confidence: number;
  provider: string;
  latencyMs: number;
  model: string;
  lastUpdated: string;
  errorMessage?: string;
}

export class AIGatewayService {
  /**
   * Extract standardized telemetry state from an AI Gateway API response envelope
   */
  static parseTelemetry<T>(response: unknown): { telemetry: AIGatewayState; data: T } {
    const isEnvelope = response && typeof response === 'object' && ('confidence' in response || 'provider' in response);
    const res = response as Record<string, unknown> | null;

    // No values are assumed: when a response carries no telemetry, zero / "Unknown" is reported
    const rawConfidence = res && typeof res.confidence === 'number' ? res.confidence : 0;
    const confidence = isEnvelope
      ? Math.round(rawConfidence * (rawConfidence <= 1.0 ? 100 : 1) * 10) / 10
      : 0;

    const provider = isEnvelope && res?.provider
      ? String(res.provider).toUpperCase()
      : 'UNKNOWN';

    const latencyMs = isEnvelope && typeof res?.latency === 'number'
      ? Math.round(res.latency)
      : 0;

    const model = isEnvelope && res?.model
      ? String(res.model)
      : 'unknown';

    const rawData = isEnvelope && res
      ? (res.data || res.response || res)
      : response;

    const telemetry: AIGatewayState = {
      status: 'active',
      confidence,
      provider,
      latencyMs,
      model,
      lastUpdated: 'Just now'
    };

    return { telemetry, data: rawData as T };
  }

  /**
   * Format provider string into user-friendly display badge
   */
  static formatProviderBadge(provider: string): string {
    const p = provider.toUpperCase();
    if (p.includes('GEMINI')) return 'Google Gemini';
    if (p.includes('OPENAI')) return 'OpenAI';
    if (p.includes('HUGGINGFACE')) return 'Hugging Face';
    if (p.includes('LOCAL')) return 'Local model';
    if (p.includes('MOCK')) return 'Development mock (not real AI)';
    if (p.includes('SEMANTIC') || p.includes('INTELLIGENCE') || p.includes('RULE')) return 'SkillBridge rule engine';
    return provider || 'AI Gateway';
  }
}
