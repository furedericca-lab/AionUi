/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGUAGES, normalizeLanguageCode } from '@/common/config/i18n';

describe('common i18n config module', () => {
  it('should only support zh-CN, en-US, and ja-JP', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['zh-CN', 'en-US', 'ja-JP']);
  });

  it('should normalize Japanese correctly', () => {
    expect(normalizeLanguageCode('ja')).toBe('ja-JP');
    expect(normalizeLanguageCode('ja-JP')).toBe('ja-JP');
    expect(normalizeLanguageCode('JA_JP')).toBe('ja-JP');
  });

  it('should fall back to en-US for removed locales', () => {
    expect(normalizeLanguageCode('uk-UA')).toBe('en-US');
    expect(normalizeLanguageCode('ko')).toBe('en-US');
    expect(normalizeLanguageCode('tr')).toBe('en-US');
  });
});
