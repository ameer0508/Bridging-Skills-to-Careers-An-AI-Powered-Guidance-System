# Security Posture & Hardening

SkillBridge applies Defense in Depth across its stack.

## Authentication & Authorization
- **JWT**: Stateless JWT tokens are used for authentication. Secrets must be securely managed via environment variables.
- **Ownership Validation**: Every route validates that `userId` in the JWT matches the target resource being requested.

## API Protection
- **Rate Limiting**: `express-rate-limit` is applied to the API (1000 requests / 15 min / IP) and, more tightly, to sign-in and registration (15 attempts / 15 min / IP).
- **Request validation**: Every write endpoint checks the type and size of its input; a test sends 40 malformed requests and requires a 4xx for each.
- **Internal service key**: The AI service accepts requests only with the shared `X-Internal-Service-Key`; it is not published outside the container network.
- **CORS**: Strictly checks origins in production against `FRONTEND_URL`.
- **Helmet**: Adds security headers (HSTS, CSP, XSS Filters).
- **Payload Limits**: `express.json` is capped at `10mb` to prevent memory exhaustion and buffer overflows.

## AI Security
- **Prompt Injection**: System prompts are isolated and immutable. User inputs are injected clearly into distinct variables rather than concatenated unsafely into the base prompt.
- **Fail-Safes**: Ordered timeouts (provider 20 s, backend chat wait 25 s, browser 40 s) and labelled fallbacks prevent endless loading. Provider error text is never returned to the browser.
- **No mock output presented as AI**: Chat, interview questions and interview scoring return "unavailable" when no real provider answers.
- **Secret Isolation**: `GEMINI_API_KEY` is completely hidden within the backend/AI network boundary. Frontend never contacts AI providers directly.

## Data Persistence
- **Sanitization**: Mongoose models provide structured typing to defend against NoSQL injection.
- **Indexing**: High-cardinality fields (`userId`, `careerId`) are indexed to prevent DoS via slow database scans.
