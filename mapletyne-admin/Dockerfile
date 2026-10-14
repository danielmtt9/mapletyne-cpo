# ── Hardened Unprivileged NGINX Runtime (CIS 4.1) ─────────────────
FROM nginxinc/nginx-unprivileged:alpine

# Copy built assets to NGINX standard directory
COPY --chown=101:101 dist /usr/share/nginx/html

# Copy optimized SPA nginx configuration
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

# Mapletyne Admin runs on non-root unprivileged port 8080
EXPOSE 8080

HEALTHCHECK --interval=20s --timeout=5s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

