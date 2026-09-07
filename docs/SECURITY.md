# Security Posture & Hardening

SkillBridge applies Defense in Depth across its stack.

## Authentication & Authorization
- **JWT**: Stateless JWT tokens are used for authentication. Secrets must be securely managed via environment variables.
- **Ownership Validation**: Every route validates that `userId` in the JWT matches the target resource being requested.

## API Protection
- **Rate Limiting**: `express-rate-limit` is globally applied (1000 requests / 15 min / IP).
- **CORS**: Strictly checks origins in production against `FRONTEND_URL`.
- **Helmet**: Adds security headers (HSTS, CSP, XSS Filters).
- **Payload Limits**: `express.json` is capped at `10mb` to prevent memory exhaustion and buffer overflows.

## AI Security
- **Prompt Injection**: System prompts are isolated and immutable. User inputs are injected clearly into distinct variables rather than concatenated unsafely into the base prompt.
- **Fail-Safes**: API timeouts (15 seconds) and standard fallback messages prevent infinite loading and exposed backend errors.
- **Secret Isolation**: `GEMINI_API_KEY` is completely hidden within the backend/AI network boundary. Frontend never contacts AI providers directly.

## Data Persistence
- **Sanitization**: Mongoose models provide structured typing to defend against NoSQL injection.
- **Indexing**: High-cardinality fields (`userId`, `careerId`) are indexed to prevent DoS via slow database scans.
