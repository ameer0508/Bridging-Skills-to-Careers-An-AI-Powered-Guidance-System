import axios from 'axios';
import env from '../config/env.js';

export const INTERNAL_KEY_HEADER = 'X-Internal-Service-Key';
export const ACTING_USER_HEADER = 'X-Acting-User-Id';

/** Base URL of the internal AI service (resolved per request so it can be re-pointed in tests). */
export const getAiServiceUrl = (): string => process.env.AI_SERVICE_URL || env.AI_SERVICE_URL;

/**
 * The single HTTP client for backend -> AI service calls.
 * Every request carries the shared service credential; the AI service rejects calls without it.
 */
export const aiHttp = axios.create();

aiHttp.interceptors.request.use(config => {
  config.baseURL = getAiServiceUrl();
  config.headers.set(INTERNAL_KEY_HEADER, process.env.INTERNAL_SERVICE_KEY || env.INTERNAL_SERVICE_KEY);
  return config;
});

/**
 * Headers identifying the authenticated end user a request is made on behalf of.
 * The AI service refuses user-scoped routes whose path user id differs from this value.
 */
export const actingUser = (userId: string): Record<string, string> => ({
  [ACTING_USER_HEADER]: userId
});

export default aiHttp;
