import http from 'http';
import type { AddressInfo } from 'net';
import app from '../../app.js';
import AuthService from '../../services/AuthService.js';

export interface ApiResult<T = any> {
  status: number;
  body: T;
  headers: Headers;
}

export interface ApiOptions {
  token?: string;
  json?: unknown;
  form?: FormData;
}

export interface HttpHarness {
  api: <T = any>(method: string, path: string, options?: ApiOptions) => Promise<ApiResult<T>>;
  /** Sends a body exactly as given (e.g. malformed JSON) with a JSON content type. */
  rawRequest: (method: string, path: string, body: string, token?: string) => Promise<{ status: number; text: string }>;
  /**
   * Creates a synthetic user and returns its access token. The account is created through the
   * auth service rather than POST /auth/register, so suites that are not about sign-up do not
   * spend the real login rate limit (15 attempts per 15 minutes). The HTTP sign-up path is
   * covered by api_integration.test.ts.
   */
  registerUser: (label: string) => Promise<{ token: string; email: string; userId: string }>;
  close: () => Promise<void>;
}

/**
 * Starts the real Express app on a random local port so tests exercise the real middleware
 * (auth, validation, upload, error handling) over HTTP. The caller owns the database connection.
 */
export async function startHttpHarness(): Promise<HttpHarness> {
  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;

  const api: HttpHarness['api'] = async (method, path, options = {}) => {
    const headers: Record<string, string> = {};
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    if (options.json !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: options.form ?? (options.json !== undefined ? JSON.stringify(options.json) : undefined)
    });
    const text = await res.text();
    let body: any = text;
    try {
      body = JSON.parse(text);
    } catch {
      // non-JSON response (e.g. a file download)
    }
    return { status: res.status, body, headers: res.headers };
  };

  const rawRequest: HttpHarness['rawRequest'] = async (method, path, body, token) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${path}`, { method, headers, body });
    return { status: res.status, text: await res.text() };
  };

  let counter = 0;
  const registerUser: HttpHarness['registerUser'] = async label => {
    counter += 1;
    const email = `${label}.${Date.now()}.${counter}@example.com`;
    const created = await new AuthService().register(`${label} Tester`, email, 'Password123!');
    return { token: created.accessToken, email, userId: String(created.user.id) };
  };

  return {
    api,
    rawRequest,
    registerUser,
    close: () => new Promise<void>(resolve => server.close(() => resolve()))
  };
}

/** A PDF-signed payload the upload validator accepts; the fake AI service reads its text. */
export const pdfLikeResume = (text: string) => new Blob([`%PDF-1.4\n${text}\n`], { type: 'application/pdf' });

export function resumeForm(text: string, fileName = 'resume.pdf'): FormData {
  const form = new FormData();
  form.append('resume', pdfLikeResume(text), fileName);
  return form;
}
