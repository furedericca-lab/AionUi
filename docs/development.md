# Development

## Product boundary

This repository is **WebUI-only**.

Supported layers:

Supported UI languages: `zh-CN`, `en-US`, `ja-JP`.

- `src/server.ts` — only runtime entrypoint
- `src/renderer/` — web frontend
- `src/process/` — backend / workers / channels / services

Removed:

- Electron main entry
- preload bridges
- BrowserWindow / tray / updater / installer flows
- Electron build and packaging pipeline

## Install

```bash
bun install
```

## Build

```bash
bun run build:renderer:web
bun run build:server
bun run build
```

## Run

Development:

```bash
bun run start
```

Production:

```bash
bun run start:prod
```

Reset admin password:

```bash
bun run resetpass
```

## Quality checks

```bash
bun run lint
bun run format
bun run test
bunx tsc --noEmit
bun run i18n:types
node scripts/check-i18n.js
```

## Verification target

Before merging changes that affect the product surface, verify at least:

- renderer build
- server build
- typecheck
- test suite or focused regression set
- standalone server startup
