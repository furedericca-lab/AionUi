# 2026-04-10 WebUI-only convergence design

> Status: implemented and retained as a historical design/decision record.
>
> This document explains the intent, scope, sequencing, and acceptance criteria for converging AionUi from a dual-track Electron + WebUI repository into a single-product **WebUI-only server**. It is kept for traceability after the migration landed.

## Goal

Converge AionUi from a dual-track **Electron desktop + WebUI** repository into a single-product **Linux / Docker / WebUI-only server**.

The end state is:

- `src/server.ts` is the **only** product entrypoint
- `src/renderer/` is the only frontend runtime surface
- `src/process/` remains as the backend / workers / channels / services layer
- supported UI languages are reduced to `zh-CN`, `en-US`, and `ja-JP`
- Docker / Linux deployment is the only supported product shape
- Electron runtime, preload bridge, tray/updater flows, packaging pipeline, and desktop-only UX are removed rather than left as dormant legacy code

## Product decision

This convergence is intentionally **not** a "keep desktop support but stop using it" cleanup.
It is a product simplification:

- one runtime path
- one deployment story
- one supported platform shape
- one build/test/CI story

Any future desktop reintroduction should be treated as a **new product decision** with explicit ownership, tests, packaging, and release support.

## Scope

### Kept layers

- `src/server.ts` as the sole runtime entrypoint
- `src/renderer/` as the only frontend runtime
- `src/process/` as backend/runtime services
- standalone bridge / webserver / workers / channels / services
- Linux / Docker runtime artifacts and documentation

### Removed product surface

- Electron main entry (`src/index.ts`) and desktop boot path (`src/process/index.ts`)
- `src/preload/`
- BrowserWindow / tray / dock / updater / installer / builder paths
- desktop-only settings, pet UI, update UI, and browser-exclusion copy
- Electron packaging / release scripts, configs, CI lanes, and dependencies
- Electron-specific E2E harness and desktop-only test fixtures/assets

## Non-goals

- preserving dormant desktop code for future convenience
- keeping Electron-oriented CI or release assets "just in case"
- maintaining compatibility with desktop-only behaviors that have no WebUI-only owner
- building a new browser E2E framework as part of this convergence itself

## Architectural decisions

### 1. Single entrypoint

`src/server.ts` is the only product entrypoint.
All supported run modes must eventually flow through the built server bundle:

```bash
bun run build:renderer:web
bun run build:server
NODE_ENV=production ALLOW_REMOTE=true bun dist-server/server.mjs
```

### 2. WebUI-first renderer

The renderer must not depend on:

- `window.electronAPI`
- preload shims
- Electron-only window controls
- BrowserWindow lifecycle assumptions

The supported renderer bridge is the standalone browser / HTTP / WebSocket path.

### 3. Server-safe process layer

`src/process/` remains, but only for standalone-safe backend responsibilities.
Electron-only bridges/services/utils must be deleted or replaced with WebUI-safe equivalents.

### 4. Docker/Linux as the canonical runtime

The canonical deployment contract is:

- runtime image contains only files required to run the server
- listens on port `3000`
- `ALLOW_REMOTE=true`
- persistent state mounted at `/data`
- non-root runtime where practical
- health check against server auth/status endpoint

## Cleanup plan

### 1. Behavior lock / baseline verification

- install dependencies
- run targeted standalone/web regression checks first
- keep the pass scoped to WebUI-only convergence

### 2. Entrypoint + build convergence

- make `src/server.ts` the sole runtime entrypoint
- remove Electron scripts / configs / dependencies
- keep only server/web build and start scripts

### 3. Bridge + renderer unification

- remove `window.electronAPI` / `isElectronDesktop` forks from supported runtime paths
- make browser/WebSocket/HTTP adapter the only renderer bridge
- remove desktop-only tabs, settings, unsupported messaging, tray/update/pet UI

### 4. Process cleanup

- remove Electron-only bridges/services/utils
- keep or reshape only standalone-safe process services
- eliminate retained codepaths that require `from 'electron'` for supported runtime

### 5. Productization

- ship Linux/Docker-only Dockerfile and runtime docs
- add health check, non-root runtime, graceful shutdown, `/data` volume contract

### 6. Final cleanup + verification

- remove stale tests/docs/CI/release assets for desktop packaging
- run lint, typecheck, tests, renderer build, server build, and startup smoke checks

## Execution order

1. lock baseline
2. remove build/runtime dual-entry surface
3. unify renderer bridge + UI
4. delete Electron-only process code
5. productize Docker/Linux docs and container path
6. remove stale desktop CI/tests/assets
7. verify end-to-end

## Risk hotspots identified up front

- renderer contained Electron-only branches and copy that were easy to miss
- some process services implicitly depended on Electron lifecycle or BrowserWindow behavior
- CI/docs/release assets still assumed cross-platform packaged binaries
- deleting Electron safely required eliminating remaining supported-path imports from `electron`
- Docker behavior could differ from desktop if agent/worker flows assumed GUI or terminal affordances

## Acceptance criteria

The convergence is considered complete when all of the following are true:

### Runtime

- `src/server.ts` is the only application entrypoint
- production startup works via `bun dist-server/server.mjs`
- default runtime port is `3000`
- `ALLOW_REMOTE=true` is supported and documented
- persistent data contract is `/data`

### Repository shape

- no supported product path depends on Electron runtime, preload bridge, tray, updater, or desktop packaging
- desktop-only assets/tests/docs/CI lanes are removed or explicitly archived as historical notes
- Dockerfile and deployment docs describe the WebUI-only server truthfully

### Verification

At minimum:

- `bunx tsc --noEmit`
- `bun run test`
- `bun run build`
- `bun run lint` (warnings may remain, errors must not)
- `bun run i18n:types`
- `node scripts/check-i18n.js`
- production startup smoke on `PORT=3100 NODE_ENV=production ALLOW_REMOTE=true bun dist-server/server.mjs`

## Implemented end state

This convergence has been applied in the repository state corresponding to the WebUI-only branch history.
The resulting shape is:

- WebUI-only runtime documented in `readme.md`, `docs/development.md`, and `docs/tech/architecture.md`
- simplified CI centered on typecheck / test / build / i18n validation for the server product
- Dockerfile aligned with WebUI-only runtime and patch-aware bun install
- desktop pet, updater, preload, builder, and Electron packaging artifacts removed
- Electron Playwright E2E harness removed from the supported product path
- i18n cleanup completed for the removed desktop/update surfaces so validation passes cleanly

## 2026-04-16 convergence tail completion

After the main migration landed, a final cleanup tail pass was completed on **April 16, 2026** to remove the last supported-path desktop residue that still made the product look partially dual-mode.

That tail pass included:

- replacing the former URL preview / extension external-page `<webview>` path with a browser-safe iframe host while retaining the existing component surface for compatibility
- converting HTML preview to a true iframe-based implementation with inline-resource handling, postMessage-based inspect events, and iframe scroll sync
- converting PDF preview away from Electron-only load events to a WebUI-safe blob/iframe path
- removing the desktop-only feedback modal path (`@sentry/electron/renderer`, `window.electronAPI` assumptions) and replacing it with a prefilled GitHub bug-report draft flow
- deleting dead desktop helper scripts and obsolete root config left over from packaging-era workflows
- removing the remaining front-end/test-path `electronAPI`, `ElectronBridgeAPI`, and `isElectronDesktop` residue so the supported renderer path now reflects the WebUI-only product truth more directly

These changes do not alter the product decision; they simply finish the repository-shape cleanup needed for the codebase to tell the same WebUI-only story all the way through runtime, preview UX, test scaffolding, and contributor-facing guidance.

## Residual follow-ups kept out of scope

These do **not** block the WebUI-only convergence, but may still be worth future cleanup:

- lint warnings that pre-existed or are unrelated to runtime convergence
- replacing removed desktop E2E coverage with browser-native WebUI automation if needed later
- further slimming of historical docs/research notes that still discuss old Electron architecture for archival reasons
- optional fresh-container Docker build/run verification in CI or release workflow
- optional follow-up hardening for iframe-based external previews, since some third-party pages may refuse embedding via `X-Frame-Options` or CSP and that is now a browser/runtime limitation rather than an Electron integration concern

## Final note

This document exists to record that the migration was a deliberate product convergence, not an accidental drift.
The important invariant after this work is simple:

**AionUi is a WebUI-only server product, and the repository should tell the same story in runtime, code, CI, docs, and packaging.**
