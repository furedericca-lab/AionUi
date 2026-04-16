/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@icon-park/react', () => ({
  Left: () => <span data-testid='left-icon' />,
  Right: () => <span data-testid='right-icon' />,
  Refresh: () => <span data-testid='refresh-icon' />,
  Loading: () => <span data-testid='loading-icon' />,
}));

import WebviewHost from '../../src/renderer/components/media/WebviewHost';

describe('WebviewHost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a browser-safe iframe for the provided URL', () => {
    render(<WebviewHost url='https://example.com' />);

    const iframe = screen.getByTitle('https://example.com');
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe).toHaveAttribute('src', 'https://example.com');
  });

  it('supports navigating to a new URL from the navigation bar', () => {
    render(<WebviewHost url='https://example.com' showNavBar />);

    fireEvent.change(screen.getByPlaceholderText('Enter URL...'), {
      target: { value: 'openai.com/docs' },
    });
    fireEvent.submit(screen.getByPlaceholderText('Enter URL...').closest('form')!);

    expect(screen.getByTitle('https://openai.com/docs')).toHaveAttribute('src', 'https://openai.com/docs');
  });

  it('tracks back and forward history for host-driven navigations', () => {
    render(<WebviewHost url='https://example.com' showNavBar />);

    const addressBar = screen.getByPlaceholderText('Enter URL...');
    fireEvent.change(addressBar, { target: { value: 'openai.com/docs' } });
    fireEvent.submit(addressBar.closest('form')!);
    fireEvent.change(addressBar, { target: { value: 'github.com/iOfficeAI/AionUi' } });
    fireEvent.submit(addressBar.closest('form')!);

    fireEvent.click(screen.getByTitle('Back'));
    expect(screen.getByTitle('https://openai.com/docs')).toHaveAttribute('src', 'https://openai.com/docs');

    fireEvent.click(screen.getByTitle('Forward'));
    expect(screen.getByTitle('https://github.com/iOfficeAI/AionUi')).toHaveAttribute(
      'src',
      'https://github.com/iOfficeAI/AionUi'
    );
  });

  it('reloads the iframe when refresh is clicked', () => {
    render(<WebviewHost url='https://example.com' showNavBar />);

    const firstFrame = screen.getByTitle('https://example.com');
    fireEvent.click(screen.getByTitle('Refresh'));
    const refreshedFrame = screen.getByTitle('https://example.com');

    expect(refreshedFrame).not.toBe(firstFrame);
  });
});
