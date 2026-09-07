FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/

RUN pnpm install --frozen-lockfile

COPY frontend/ frontend/

RUN pnpm --filter frontend build

# Serve with nginx
FROM nginx:alpine

# Copy custom nginx config if you have one, or just use default
# COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
