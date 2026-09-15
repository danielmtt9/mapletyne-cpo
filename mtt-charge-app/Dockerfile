# ── Stage 1: Build Dependencies ─────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: Hardened Runtime Container (CIS 4.1) ───────────────────────────
FROM python:3.12-slim

# Create dedicated unprivileged user and group
RUN groupadd -g 10001 mapletyne && \
    useradd -u 10001 -g mapletyne -s /bin/sh -m appuser

WORKDIR /app

# Copy python dependencies and application assets
COPY --from=builder /install /usr/local
COPY --chown=10001:10001 . .

USER 10001:10001

EXPOSE 8003

ENV HOST=0.0.0.0
ENV PORT=8003
ENV PYTHONUNBUFFERED=1

HEALTHCHECK --interval=20s --timeout=5s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8003/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]

