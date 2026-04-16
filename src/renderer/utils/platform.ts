/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export const isMacOS = (): boolean => {
  return typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent);
};

export const isWindows = (): boolean => {
  return typeof navigator !== 'undefined' && /win/i.test(navigator.userAgent);
};

export const isLinux = (): boolean => {
  return typeof navigator !== 'undefined' && /linux/i.test(navigator.userAgent);
};

const ASSET_PROTOCOL_PREFIX = 'aion-asset://asset/';

const getAssetAbsolutePath = (url: string): string | undefined => {
  if (!url.startsWith(ASSET_PROTOCOL_PREFIX)) return undefined;

  let absPath = decodeURIComponent(url.slice(ASSET_PROTOCOL_PREFIX.length));
  if (/^\/[A-Za-z]:/.test(absPath)) {
    absPath = absPath.slice(1);
  }
  return absPath;
};

export const resolveExtensionAssetUrl = (url: string | undefined): string | undefined => {
  if (!url) return url;

  const absPath = getAssetAbsolutePath(url);
  if (absPath) {
    return `/api/ext-asset?path=${encodeURIComponent(absPath)}`;
  }

  if (url.startsWith('file://')) {
    let filePath = decodeURIComponent(url.replace(/^file:\/\/\/?/, ''));
    if (/^\/[A-Za-z]:/.test(filePath)) {
      filePath = filePath.slice(1);
    }
    return `/api/ext-asset?path=${encodeURIComponent(filePath)}`;
  }

  return url;
};

export const openExternalUrl = async (url: string): Promise<void> => {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};
