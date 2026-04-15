import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const mockSystemInfo = vi.fn();
const mockUpdateSystemInfo = vi.fn();
const mockGetNotificationEnabled = vi.fn();
const mockGetCronNotificationEnabled = vi.fn();
const mockGetSaveUploadToWorkspace = vi.fn();
const mockGetAutoPreviewOfficeFiles = vi.fn();
const mockGetCommandQueueEnabled = vi.fn();
const mockSetNotificationEnabled = vi.fn();
const mockSetCronNotificationEnabled = vi.fn();
const mockSetSaveUploadToWorkspace = vi.fn();
const mockSetAutoPreviewOfficeFiles = vi.fn();
const mockSetCommandQueueEnabled = vi.fn();
const mockConfigGet = vi.fn();
const mockConfigSet = vi.fn();
const mockModalConfirm = vi.fn();
const mockMessageSuccess = vi.fn();
const mockMessageError = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    i18n: { language: 'en-US' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-react')>();
  return {
    ...actual,
    Message: {
      success: (...args: unknown[]) => mockMessageSuccess(...args),
      error: (...args: unknown[]) => mockMessageError(...args),
      loading: vi.fn(() => vi.fn()),
    },
    Modal: Object.assign(actual.Modal, {
      useModal: () => [{ confirm: (...args: unknown[]) => mockModalConfirm(...args) }, <div key='modal-holder' />],
    }),
  };
});

vi.mock('@/renderer/components/settings/LanguageSwitcher', () => ({
  default: () => <div data-testid='language-switcher' />,
}));

vi.mock('@/renderer/components/base/AionScrollArea', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid='scroll-area'>{children}</div>,
}));

vi.mock('@/renderer/components/settings/SettingsModal/settingsViewContext', () => ({
  useSettingsViewMode: () => 'modal',
}));

vi.mock('@/common/config/storage', () => ({
  ConfigStorage: {
    get: (...args: unknown[]) => mockConfigGet(...args),
    set: (...args: unknown[]) => mockConfigSet(...args),
  },
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    application: {
      systemInfo: { invoke: (...args: unknown[]) => mockSystemInfo(...args) },
      updateSystemInfo: { invoke: (...args: unknown[]) => mockUpdateSystemInfo(...args) },
    },
    systemSettings: {
      getNotificationEnabled: { invoke: (...args: unknown[]) => mockGetNotificationEnabled(...args) },
      getCronNotificationEnabled: { invoke: (...args: unknown[]) => mockGetCronNotificationEnabled(...args) },
      getSaveUploadToWorkspace: { invoke: (...args: unknown[]) => mockGetSaveUploadToWorkspace(...args) },
      getAutoPreviewOfficeFiles: { invoke: (...args: unknown[]) => mockGetAutoPreviewOfficeFiles(...args) },
      getCommandQueueEnabled: { invoke: (...args: unknown[]) => mockGetCommandQueueEnabled(...args) },
      setNotificationEnabled: { invoke: (...args: unknown[]) => mockSetNotificationEnabled(...args) },
      setCronNotificationEnabled: { invoke: (...args: unknown[]) => mockSetCronNotificationEnabled(...args) },
      setSaveUploadToWorkspace: { invoke: (...args: unknown[]) => mockSetSaveUploadToWorkspace(...args) },
      setAutoPreviewOfficeFiles: { invoke: (...args: unknown[]) => mockSetAutoPreviewOfficeFiles(...args) },
      setCommandQueueEnabled: { invoke: (...args: unknown[]) => mockSetCommandQueueEnabled(...args) },
    },
  },
}));

import SystemModalContent from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent';

describe('SystemModalContent', () => {
  beforeEach(() => {
    mockSystemInfo.mockResolvedValue({ cacheDir: '/tmp/cache', workDir: '/tmp/work' });
    mockUpdateSystemInfo.mockResolvedValue({ success: true });
    mockGetNotificationEnabled.mockResolvedValue(true);
    mockGetCronNotificationEnabled.mockResolvedValue(false);
    mockGetSaveUploadToWorkspace.mockResolvedValue(false);
    mockGetAutoPreviewOfficeFiles.mockResolvedValue(true);
    mockGetCommandQueueEnabled.mockResolvedValue(true);
    mockSetNotificationEnabled.mockResolvedValue(undefined);
    mockSetCronNotificationEnabled.mockResolvedValue(undefined);
    mockSetSaveUploadToWorkspace.mockResolvedValue(undefined);
    mockSetAutoPreviewOfficeFiles.mockResolvedValue(undefined);
    mockSetCommandQueueEnabled.mockResolvedValue(undefined);
    mockConfigGet.mockImplementation((key: string) => {
      if (key === 'acp.promptTimeout') return Promise.resolve(300);
      if (key === 'acp.agentIdleTimeout') return Promise.resolve(5);
      return Promise.resolve(undefined);
    });
    mockConfigSet.mockResolvedValue(undefined);
    mockModalConfirm.mockImplementation(({ onOk }: { onOk?: () => void }) => onOk?.());
    mockMessageSuccess.mockReset();
    mockMessageError.mockReset();
  });

  it('renders only WebUI-safe system settings controls', async () => {
    render(<SystemModalContent />);

    await waitFor(() => {
      expect(screen.getByText('settings.language')).toBeInTheDocument();
    });

    expect(screen.queryByText('settings.startOnBoot')).not.toBeInTheDocument();
    expect(screen.queryByText('settings.openDevTools')).not.toBeInTheDocument();
    expect(screen.getByText('settings.promptTimeout')).toBeInTheDocument();
    expect(screen.getByText('settings.agentIdleTimeout')).toBeInTheDocument();
    expect(screen.getByText('settings.saveUploadToWorkspace')).toBeInTheDocument();
    expect(screen.getByText('settings.autoPreviewOfficeFiles')).toBeInTheDocument();
    expect(screen.getByText('settings.commandQueueEnabled')).toBeInTheDocument();
  });

  it('persists command queue toggle changes through the standalone bridge', async () => {
    render(<SystemModalContent />);

    await waitFor(() => {
      expect(screen.getByText('settings.commandQueueEnabled')).toBeInTheDocument();
    });

    const commandQueueRow = screen.getByText('settings.commandQueueEnabled').closest('.flex-1')?.parentElement;
    const commandQueueSwitch = commandQueueRow?.querySelector('button[role="switch"]');
    expect(commandQueueSwitch).toBeTruthy();

    fireEvent.click(commandQueueSwitch!);

    await waitFor(() => {
      expect(mockSetCommandQueueEnabled).toHaveBeenCalledWith({ enabled: false });
    });
  });

  it('reverts the command queue toggle when the standalone bridge update fails', async () => {
    mockSetCommandQueueEnabled.mockRejectedValueOnce(new Error('boom'));
    render(<SystemModalContent />);

    await waitFor(() => {
      expect(screen.getByText('settings.commandQueueEnabled')).toBeInTheDocument();
    });

    const commandQueueRow = screen.getByText('settings.commandQueueEnabled').closest('.flex-1')?.parentElement;
    const commandQueueSwitch = commandQueueRow?.querySelector('button[role="switch"]');
    expect(commandQueueSwitch).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(commandQueueSwitch!);

    await waitFor(() => {
      expect(commandQueueSwitch).toHaveAttribute('aria-checked', 'true');
    });
  });
});
