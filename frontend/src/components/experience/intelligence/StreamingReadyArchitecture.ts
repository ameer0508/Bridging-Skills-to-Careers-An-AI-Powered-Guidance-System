export type StreamingState = 'idle' | 'loading' | 'streaming_partial' | 'completed' | 'error';

export interface StreamingResponse<T> {
  state: StreamingState;
  data: T | null;
  accumulatedText?: string;
  error?: string | null;
  progressPercentage?: number;
  cancel?: () => void;
  retry?: () => void;
}

export function createStreamingResponse<T>(
  data: T | null,
  state: StreamingState = 'completed',
  accumulatedText?: string
): StreamingResponse<T> {
  return {
    state,
    data,
    accumulatedText: accumulatedText || '',
    error: null,
    progressPercentage: state === 'completed' ? 100 : state === 'loading' ? 30 : 0,
  };
}
