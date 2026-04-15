/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Platform-agnostic application bridge handlers.
 * Safe to use in standalone server mode.
 */
import os from 'os';
import path from 'path';
import { ipcBridge } from '@/common';
import { ProcessConfig, getSystemDir, ProcessEnv } from '@process/utils/initStorage';
import { copyDirectoryRecursively, getConfigPath, getDataPath, resolveCliSafePath } from '@process/utils';

const DEFAULT_ZOOM_FACTOR = 1;
const MIN_ZOOM_FACTOR = 0.8;
const MAX_ZOOM_FACTOR = 1.3;

const clampZoomFactor = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return DEFAULT_ZOOM_FACTOR;
  }
  return Math.min(MAX_ZOOM_FACTOR, Math.max(MIN_ZOOM_FACTOR, Number(value.toFixed(2))));
};

export function initApplicationBridgeCore(): void {
  ipcBridge.application.systemInfo.provider(() => {
    return Promise.resolve(getSystemDir());
  });

  ipcBridge.application.updateSystemInfo.provider(async ({ cacheDir, workDir }) => {
    try {
      const safeCacheDir = resolveCliSafePath(cacheDir, getConfigPath());
      const safeWorkDir = resolveCliSafePath(workDir, getDataPath());

      const oldDir = getSystemDir();
      if (oldDir.cacheDir !== safeCacheDir) {
        await copyDirectoryRecursively(oldDir.cacheDir, safeCacheDir);
      }
      await ProcessEnv.set('aionui.dir', { cacheDir: safeCacheDir, workDir: safeWorkDir });
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, msg };
    }
  });

  ipcBridge.application.getPath.provider(({ name }) => {
    const home = os.homedir();
    const map: Record<string, string> = {
      home,
      desktop: path.join(home, 'Desktop'),
      downloads: path.join(home, 'Downloads'),
    };
    return Promise.resolve(map[name] ?? home);
  });

  ipcBridge.application.getZoomFactor.provider(async () => {
    const persisted = await ProcessConfig.get('ui.zoomFactor');
    return clampZoomFactor(persisted ?? DEFAULT_ZOOM_FACTOR);
  });

  ipcBridge.application.setZoomFactor.provider(async ({ factor }) => {
    const nextFactor = clampZoomFactor(factor);
    await ProcessConfig.set('ui.zoomFactor', nextFactor);
    return nextFactor;
  });
}
