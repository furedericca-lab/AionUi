/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NavigateFunction } from 'react-router-dom';
import { MemoryRouter } from 'react-router-dom';
import { useConversationShortcuts } from '../../../src/renderer/hooks/ui/useConversationShortcuts';
import { useVisibleConversationIds } from '../../../src/renderer/pages/conversation/GroupedHistory/hooks/useVisibleConversationIds';

vi.mock('../../../src/renderer/pages/conversation/GroupedHistory/hooks/useVisibleConversationIds', () => ({
  useVisibleConversationIds: vi.fn(),
}));

const mockedUseVisibleConversationIds = vi.mocked(useVisibleConversationIds);

const createCancelableKeydown = (init: KeyboardEventInit): KeyboardEvent => {
  return new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...init,
  });
};

const createWrapper = (initialEntry: string): React.FC<React.PropsWithChildren> => {
  return ({ children }) => <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
};

describe('useConversationShortcuts', () => {
  beforeEach(() => {
    mockedUseVisibleConversationIds.mockReset();
  });

  it('navigates to the next visible conversation on Ctrl+Tab in WebUI', () => {
    mockedUseVisibleConversationIds.mockReturnValue(['1', '2', '3']);
    const navigate = vi.fn() as unknown as NavigateFunction;
    renderHook(() => useConversationShortcuts({ navigate }), {
      wrapper: createWrapper('/conversation/3'),
    });

    const event = createCancelableKeydown({ key: 'Tab', ctrlKey: true });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/conversation/1');
  });

  it('opens the guid page on Cmd/Ctrl+T and prevents the browser default', () => {
    mockedUseVisibleConversationIds.mockReturnValue(['1', '2', '3']);
    const navigate = vi.fn() as unknown as NavigateFunction;
    renderHook(() => useConversationShortcuts({ navigate }), {
      wrapper: createWrapper('/conversation/2'),
    });

    const ctrlEvent = createCancelableKeydown({ key: 't', ctrlKey: true });
    act(() => {
      window.dispatchEvent(ctrlEvent);
    });

    expect(ctrlEvent.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/guid');
  });

  it('does not navigate when there is no next conversation to cycle to', () => {
    mockedUseVisibleConversationIds.mockReturnValue(['1']);
    const navigate = vi.fn() as unknown as NavigateFunction;
    renderHook(() => useConversationShortcuts({ navigate }), {
      wrapper: createWrapper('/conversation/1'),
    });

    const event = createCancelableKeydown({ key: 'Tab', ctrlKey: true });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
