import { useState, useCallback } from 'react';
import { AIGatewayService, AIGatewayState } from '../services/aiGatewayService';

export function useAITelemetry(initialProvider: string = 'Gemini 1.5 Pro', initialConfidence: number = 98.4) {
  const [telemetry, setTelemetry] = useState<AIGatewayState>({
    status: 'active',
    confidence: initialConfidence,
    provider: initialProvider,
    latencyMs: 120,
    model: 'gemini-1.5-pro',
    lastUpdated: 'Just now'
  });

  const updateFromResponse = useCallback((response: unknown) => {
    if (!response) return;
    const { telemetry: newTelemetry } = AIGatewayService.parseTelemetry(response);
    setTelemetry(newTelemetry);
  }, []);

  const setThinking = useCallback(() => {
    setTelemetry(prev => ({ ...prev, status: 'thinking' }));
  }, []);

  const setError = useCallback((errorMsg?: string) => {
    setTelemetry(prev => ({
      ...prev,
      status: 'error',
      errorMessage: errorMsg || 'AI Gateway fallback active'
    }));
  }, []);

  return {
    telemetry,
    updateFromResponse,
    setThinking,
    setError,
    setTelemetry
  };
}
