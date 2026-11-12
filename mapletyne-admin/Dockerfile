# ── Stage 1: Build Frontend Assets ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: Hardened Unprivileged NGINX Runtime (CIS 4.1) ─────────────────
FROM nginxinc/nginx-unprivileged:alpine

# Copy built assets to NGINX standard directory
COPY --from=builder --chown=101:101 /app/dist /usr/share/nginx/html

# Copy optimized SPA nginx configuration
# Rendered at container start by the official image entrypoint (envsubst); only defined env vars are substituted
COPY --chown=101:101 nginx.conf /etc/nginx/templates/default.conf.template
ENV NGINX_ENVSUBST_FILTER=PAYLOAD_

# Mapletyne Admin runs on non-root unprivileged port 8080
EXPOSE 8080

HEALTHCHECK --interval=20s --timeout=5s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
