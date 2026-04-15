import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('WebUI-only product manifest', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
  };

  it('keeps only the converged server runtime scripts', () => {
    expect(packageJson.scripts.start).toBe('NODE_ENV=development bun dist-server/server.mjs');
    expect(packageJson.scripts['start:prod']).toBe('NODE_ENV=production bun dist-server/server.mjs');
    expect(packageJson.scripts.resetpass).toBe('NODE_ENV=production bun dist-server/server.mjs --resetpass');
    expect(packageJson.scripts.build).toBe('bun run build:renderer:web && bun run build:server');
    expect(packageJson.scripts).not.toHaveProperty('package');
    expect(packageJson.scripts).not.toHaveProperty('dist');
    expect(packageJson.scripts).not.toHaveProperty('dist:mac');
    expect(packageJson.scripts).not.toHaveProperty('dist:win');
    expect(packageJson.scripts).not.toHaveProperty('dist:linux');
    expect(packageJson.scripts).not.toHaveProperty('webui');
    expect(packageJson.scripts).not.toHaveProperty('start:multi');
  });

  it('removes Electron build/runtime dependencies from every dependency bucket', () => {
    const removed = [
      'electron',
      'electron-builder',
      'electron-vite',
      '@sentry/electron',
      'electron-updater',
      'electron-squirrel-startup',
      '@electron/fuses',
      '@electron/notarize',
      'electron-winstaller',
      'electron-log',
    ];

    for (const dep of removed) {
      expect(packageJson.dependencies?.[dep]).toBeUndefined();
      expect(packageJson.devDependencies?.[dep]).toBeUndefined();
      expect(packageJson.optionalDependencies?.[dep]).toBeUndefined();
    }
  });
});
