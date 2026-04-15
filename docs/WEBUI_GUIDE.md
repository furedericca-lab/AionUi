# WebUI-only Deployment Guide

AionUi is now deployed only as a **Linux / Docker / WebUI-only server**.

## Direct server run

```bash
bun run build
NODE_ENV=production ALLOW_REMOTE=true bun dist-server/server.mjs
```

Environment variables:

- `PORT` — listening port, default `3000`
- `ALLOW_REMOTE` — `true` to bind for remote access
- `DATA_DIR` — persistent data directory
- `NODE_ENV` — usually `production`

## Docker

Build:

```bash
docker build -t aionui:webui .
```

Run:

```bash
docker run -d \
  --name aionui \
  -p 3000:3000 \
  -e PORT=3000 \
  -e ALLOW_REMOTE=true \
  -e DATA_DIR=/data \
  -v $(pwd)/data:/data \
  aionui:webui
```

## docker-compose example

```yaml
services:
  aionui:
    build: .
    image: aionui:webui
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: production
      PORT: 3000
      ALLOW_REMOTE: 'true'
      DATA_DIR: /data
    volumes:
      - ./data:/data
    restart: unless-stopped
```

## systemd example

```ini
[Unit]
Description=AionUi WebUI server
After=network.target

[Service]
WorkingDirectory=/opt/aionui
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=ALLOW_REMOTE=true
Environment=DATA_DIR=/var/lib/aionui
ExecStart=/usr/bin/bun /opt/aionui/dist-server/server.mjs
Restart=on-failure
User=aionui
Group=aionui

[Install]
WantedBy=multi-user.target
```

## Health check

A healthy instance responds on:

```text
GET /api/auth/status
```

## Notes

- Persistent data should live under `DATA_DIR`.
- For production, prefer running behind a reverse proxy.
- Desktop packaging is no longer supported.
