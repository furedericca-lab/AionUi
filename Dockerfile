FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY patches/ ./patches/
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .
RUN bun run build:renderer:web && bun run build:server

FROM oven/bun:1 AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    ALLOW_REMOTE=true \
    DATA_DIR=/data

COPY package.json bun.lock ./
COPY patches/ ./patches/
RUN bun install --production --frozen-lockfile --ignore-scripts

COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/out/renderer ./out/renderer

VOLUME ["/data"]
EXPOSE 3000

USER bun

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD bun -e "(async () => { try { const port = process.env.PORT || '3000'; const res = await fetch('http://127.0.0.1:' + port + '/api/auth/status'); process.exit(res.ok ? 0 : 1); } catch { process.exit(1); } })()"

CMD ["bun", "dist-server/server.mjs"]
