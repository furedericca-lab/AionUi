# Scripts Overview

This repository is now **WebUI-only**.

Primary build/runtime scripts:

- `scripts/build-server.mjs` — bundle `src/server.ts` and worker entrypoints to `dist-server/`
- `scripts/check-i18n.js` — validate i18n assets
- `scripts/generate-i18n-types.js` — regenerate renderer i18n key types
- `scripts/postinstall.js` — no-op postinstall for the WebUI-only server product

Removed from the repository:

- Electron packaging / installer hooks
- `build-with-builder.js`
- notarization / afterPack / afterSign flows
- desktop release asset normalization scripts
