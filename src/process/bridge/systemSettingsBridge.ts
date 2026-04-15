/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { getPlatformServices } from '@/common/platform';
import { ProcessConfig } from '@process/utils/initStorage';
import { changeLanguage } from '@process/services/i18n';

let keepAwakeBlockerId: number | null = null;

type LanguageChangeListener = () => void;
let languageChangeListener: LanguageChangeListener | null = null;

export function onLanguageChanged(listener: LanguageChangeListener): void {
  languageChangeListener = listener;
}

export function initSystemSettingsBridge(): void {
  ipcBridge.systemSettings.getNotificationEnabled.provider(async () => {
    const value = await ProcessConfig.get('system.notificationEnabled');
    return value ?? true;
  });

  ipcBridge.systemSettings.setNotificationEnabled.provider(async ({ enabled }) => {
    await ProcessConfig.set('system.notificationEnabled', enabled);
  });

  ipcBridge.systemSettings.getCronNotificationEnabled.provider(async () => {
    const value = await ProcessConfig.get('system.cronNotificationEnabled');
    return value ?? false;
  });

  ipcBridge.systemSettings.setCronNotificationEnabled.provider(async ({ enabled }) => {
    await ProcessConfig.set('system.cronNotificationEnabled', enabled);
  });

  ipcBridge.systemSettings.getKeepAwake.provider(async () => {
    const value = await ProcessConfig.get('system.keepAwake');
    return value ?? false;
  });

  ipcBridge.systemSettings.setKeepAwake.provider(async ({ enabled }) => {
    await ProcessConfig.set('system.keepAwake', enabled);
    const power = getPlatformServices().power;
    if (enabled && keepAwakeBlockerId === null) {
      keepAwakeBlockerId = power.preventDisplaySleep();
    } else if (!enabled && keepAwakeBlockerId !== null) {
      power.allowSleep(keepAwakeBlockerId);
      keepAwakeBlockerId = null;
    }
  });

  ipcBridge.systemSettings.changeLanguage.provider(async ({ language }) => {
    ipcBridge.systemSettings.languageChanged.emit({ language });
    languageChangeListener?.();
    changeLanguage(language).catch((error) => {
      console.error('[SystemSettings] Main process changeLanguage failed:', error);
    });
  });

  ProcessConfig.get('system.keepAwake')
    .then((enabled) => {
      if (enabled) {
        keepAwakeBlockerId = getPlatformServices().power.preventDisplaySleep();
      }
    })
    .catch((err) => {
      console.warn('[SystemSettings] Failed to restore keep-awake:', err);
    });

  ipcBridge.systemSettings.getSaveUploadToWorkspace.provider(async () => {
    const value = await ProcessConfig.get('upload.saveToWorkspace');
    return value ?? true;
  });

  ipcBridge.systemSettings.setSaveUploadToWorkspace.provider(async ({ enabled }) => {
    await ProcessConfig.set('upload.saveToWorkspace', enabled);
  });

  ipcBridge.systemSettings.getAutoPreviewOfficeFiles.provider(async () => {
    const value = await ProcessConfig.get('system.autoPreviewOfficeFiles');
    return value ?? true;
  });

  ipcBridge.systemSettings.setAutoPreviewOfficeFiles.provider(async ({ enabled }) => {
    await ProcessConfig.set('system.autoPreviewOfficeFiles', enabled);
  });

  ipcBridge.systemSettings.getCommandQueueEnabled.provider(async () => {
    const value = await ProcessConfig.get('system.commandQueueEnabled');
    return value ?? true;
  });

  ipcBridge.systemSettings.setCommandQueueEnabled.provider(async ({ enabled }) => {
    await ProcessConfig.set('system.commandQueueEnabled', enabled);
  });
}
