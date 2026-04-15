# Architecture

## Runtime model

AionUi is now a **WebUI-only server product**.

Supported runtime surfaces:

- **Server runtime** (`src/server.ts`, `src/process/`) — Bun/Node entrypoint, business logic, bridge handlers, DB, channels, workers
- **Renderer runtime** (`src/renderer/`) — React WebUI served by the server
- **Worker runtime** (`src/process/worker/`) — background AI / protocol workers

There is no Electron main process, preload bridge, tray runtime, or desktop packaging path.

Supported UI languages are intentionally limited to `zh-CN`, `en-US`, and `ja-JP`.

## Communication model

- Renderer ↔ server uses the standalone bridge over HTTP/WebSocket
- Server ↔ workers uses the fork protocol in `src/process/worker/WorkerProtocol.ts`
- Authentication for browser sessions is handled by the webserver auth layer (JWT + cookies + CSRF)

## Web server

Located in `src/process/webserver/`.

- Express + WebSocket
- JWT authentication and QR login helpers
- Static asset serving for `out/renderer/`
- Channel / extension routes mounted in the same server runtime

## Product entrypoint

`src/server.ts` is the **only** application entrypoint.

Canonical production flow:

```bash
bun run build:renderer:web
bun run build:server
NODE_ENV=production ALLOW_REMOTE=true bun dist-server/server.mjs
```
