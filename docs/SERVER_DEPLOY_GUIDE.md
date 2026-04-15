# Server Deploy Guide

AionUi is now a **WebUI-only server product**.

## Canonical runtime

```bash
bun run build:renderer:web
bun run build:server
NODE_ENV=production ALLOW_REMOTE=true bun dist-server/server.mjs
```

Supported deployment targets:

- Docker
- docker compose
- systemd-managed Bun process
- reverse-proxied Linux service

## Runtime contract

Environment variables:

- `PORT` — server port, default `3000`
- `ALLOW_REMOTE` — `true` to bind on `0.0.0.0`, otherwise localhost-only
- `DATA_DIR` — persistent data directory, default `/data` in container examples
- `NODE_ENV` — `production` in production deployments

The server already supports:

- graceful `SIGINT` / `SIGTERM` shutdown
- WebSocket cleanup on shutdown
- DB close/checkpoint on exit
- health probing via `GET /api/auth/status`

## Docker

Build the image from the repo root:

```bash
docker build -t aionui-webui:latest .
```

Run it directly:

```bash
docker run -d \
  --name aionui-webui \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e ALLOW_REMOTE=true \
  -e PORT=3000 \
  -e DATA_DIR=/data \
  -v $(pwd)/data:/data \
  --restart unless-stopped \
  aionui-webui:latest
```

## docker compose

```yaml
services:
  aionui:
    build: .
    image: aionui-webui:latest
    container_name: aionui-webui
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      ALLOW_REMOTE: 'true'
      DATA_DIR: /data
    ports:
      - '3000:3000'
    volumes:
      - ./data:/data
```

Start it:

```bash
docker compose up -d --build
```

## systemd

Example unit:

```ini
[Unit]
Description=AionUi WebUI Server
After=network.target

[Service]
Type=simple
User=%i
WorkingDirectory=/opt/aionui
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=ALLOW_REMOTE=true
Environment=DATA_DIR=/var/lib/aionui
ExecStart=/home/%i/.bun/bin/bun /opt/aionui/dist-server/server.mjs
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Install flow:

```bash
sudo mkdir -p /opt/aionui /var/lib/aionui
sudo cp -r dist-server out package.json bun.lock /opt/aionui/
sudo cp docs/SERVER_DEPLOY_GUIDE.md /opt/aionui/
sudo cp /path/to/aionui-webui.service /etc/systemd/system/aionui-webui.service
sudo systemctl daemon-reload
sudo systemctl enable --now aionui-webui.service
```

## Smoke checks

```bash
curl -f http://127.0.0.1:3000/api/auth/status
curl -I http://127.0.0.1:3000/
```

## Admin password reset

```bash
bun run resetpass
# or specify a username
NODE_ENV=production bun dist-server/server.mjs --resetpass admin
```
