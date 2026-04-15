# AionUi

AionUi is now a **WebUI-only server product**.

This repository no longer supports Electron desktop packaging, preload bridges, tray/updater flows, or dual desktop/browser maintenance.
The supported product shape is:

Supported UI languages: `zh-CN`, `en-US`, `ja-JP`.

- **Linux / Docker / WebUI-only server**
- `src/server.ts` as the only runtime entrypoint
- `src/renderer/` as the web frontend
- `src/process/` as the Node backend / workers / channels / services

## Supported run mode

Build:

```bash
bun run build:renderer:web
bun run build:server
```

Run:

```bash
NODE_ENV=production ALLOW_REMOTE=true bun dist-server/server.mjs
```

Reset admin password:

```bash
bun run resetpass
```

## Docker

Build image:

```bash
docker build -t aionui:webui .
```

Run container:

```bash
docker run -d \
  --name aionui \
  -p 3000:3000 \
  -e ALLOW_REMOTE=true \
  -e DATA_DIR=/data \
  -v $(pwd)/data:/data \
  aionui:webui
```

The image:

- runs the standalone server only
- stores persistent data under `/data`
- exposes port `3000`
- runs as a non-root user
- includes a health check against `/api/auth/status`

## Development

Install dependencies:

```bash
bun install
```

Useful commands:

```bash
bun run start
bun run start:prod
bun run lint
bun run format
bun run test
bunx tsc --noEmit
```

## Documentation

- `docs/development.md` — local development workflow
- `docs/WEBUI_GUIDE.md` — Linux / Docker / systemd deployment
- `docs/SERVER_DEPLOY_GUIDE.md` — concise server deployment notes

## Notes

This repo intentionally removed Electron-specific runtime and packaging flows.
If you need desktop support again in the future, it should be reintroduced as a deliberate product decision rather than kept as untested legacy code.
