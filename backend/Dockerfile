FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/

# Install dependencies (including dev dependencies needed to compile)
RUN pnpm install --frozen-lockfile --filter backend...

COPY backend/ backend/

# Build backend
RUN pnpm --filter backend build

# Production image
FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile --filter backend...

COPY --from=builder /app/backend/dist ./backend/dist

# Writable location for uploads and logs, owned by the unprivileged runtime user
RUN mkdir -p /app/storage/uploads /app/storage/logs && chown -R node:node /app/storage
USER node

EXPOSE 5000
CMD ["node", "backend/dist/server.js"]
