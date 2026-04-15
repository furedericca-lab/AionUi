import { describe, expect, it } from 'vitest';
import { getBuiltinSettingsNavItems } from '@/renderer/pages/settings/components/SettingsPageWrapper';

const t = (key: string, options?: { defaultValue?: string }) => {
  const labels: Record<string, string> = {
    'settings.gemini': 'Gemini',
    'settings.model': 'Models',
    'settings.assistants': 'Assistants',
    'settings.agents': 'Agents',
    'settings.capabilities': 'Capabilities',
    'settings.display': 'Display',
    'settings.webui': 'WebUI',
    'settings.system': 'System',
    'settings.about': 'About',
  };

  return labels[key] ?? options?.defaultValue ?? key;
};

describe('getBuiltinSettingsNavItems', () => {
  it('returns the WebUI-only settings tabs in stable order', () => {
    const items = getBuiltinSettingsNavItems(t);

    expect(items.map((item) => item.id)).toEqual([
      'gemini',
      'agent',
      'model',
      'assistants',
      'capabilities',
      'display',
      'webui',
      'system',
      'about',
    ]);

    expect(items.map((item) => item.label)).toEqual([
      'Gemini',
      'Agents',
      'Models',
      'Assistants',
      'Capabilities',
      'Display',
      'WebUI',
      'System',
      'About',
    ]);
  });

  it('keeps the webui route stable in the converged WebUI-only product', () => {
    expect(getBuiltinSettingsNavItems(t).find((item) => item.id === 'webui')?.path).toBe('webui');
  });
});
