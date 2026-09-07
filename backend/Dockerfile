FROM node:22-alpine AS builder

WORKDIR /app
# Enable pnpm
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

COPY backend/ backend/

# Build backend
RUN pnpm --filter backend build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/backend/dist ./backend/dist
COPY backend/.env.example ./backend/.env.example

EXPOSE 5000
CMD ["node", "backend/dist/server.js"]
