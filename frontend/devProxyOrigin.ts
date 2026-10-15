/**
 * Origin handling for the Vite dev server's /api proxy.
 *
 * The backend allowlists browser origins (backend/src/app.ts) and rejects any other. A page
 * served by the dev server and opened through an address the allowlist does not name (a LAN IP,
 * since the server listens on every interface) sends its own origin, so its API calls were
 * refused. Rather than removing the Origin header from every request, which also let any other
 * website's requests through, only same-origin requests are re-labelled.
 */

/** The dev frontend's origin as the backend allowlists it. */
export const DEV_FRONTEND_ORIGIN = 'http://localhost:3000';

/**
 * The Origin header to forward for a request that reached the dev server.
 *
 * - No Origin header: forwarded as is (nothing to forward).
 * - Same-origin: the Origin names exactly the host and port the browser addressed (its Host
 *   header), so the page making the call is the dev frontend itself. Forwarded as
 *   DEV_FRONTEND_ORIGIN. Vite's own Host check refuses domain names it does not know, so a DNS
 *   rebinding page cannot pass as same-origin.
 * - Anything else (another website, "null", a malformed value): forwarded unchanged, so the
 *   backend's allowlist decides and refuses it.
 */
export function devProxyOrigin(origin: string | undefined, host: string | undefined): string | undefined {
  if (!origin || !host) return origin;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return origin;
  }
  const sameOrigin = parsed.protocol === 'http:' && parsed.host.toLowerCase() === host.trim().toLowerCase();
  return sameOrigin ? DEV_FRONTEND_ORIGIN : origin;
}
