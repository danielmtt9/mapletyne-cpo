# ── Stage 1: Build Frontend Assets ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build production assets
COPY . .
RUN npm run build

# ── Stage 2: Hardened Unprivileged NGINX Runtime (CIS 4.1) ─────────────────
FROM nginxinc/nginx-unprivileged:alpine

# Copy built assets to NGINX standard directory
COPY --from=builder --chown=101:101 /app/dist /usr/share/nginx/html

# Copy optimized SPA nginx configuration
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

# Mapletyne Admin runs on non-root unprivileged port 8080
EXPOSE 8080

HEALTHCHECK --interval=20s --timeout=5s --retries=3 \
  CMD wget --spider -q http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

