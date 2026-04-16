/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const readFileMock = vi.fn();
const getImageBase64Mock = vi.fn();

vi.mock('../../src/common', () => ({
  ipcBridge: {
    fs: {
      readFile: {
        invoke: (...args: unknown[]) => readFileMock(...args),
      },
      getImageBase64: {
        invoke: (...args: unknown[]) => getImageBase64Mock(...args),
      },
    },
  },
}));

vi.mock('../../src/renderer/hooks/chat/useTypingAnimation', () => ({
  useTypingAnimation: ({ content }: { content: string }) => ({
    displayedContent: content,
  }),
}));

import HTMLRenderer from '../../src/renderer/pages/conversation/Preview/components/renderers/HTMLRenderer';

describe('HTMLRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the browser iframe preview with srcDoc content', () => {
    const { container } = render(<HTMLRenderer content='<html><body><h1>Hello</h1></body></html>' />);

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('srcdoc')).toContain('<h1>Hello</h1>');
  });

  it('injects a base tag when a file path is provided', () => {
    const { container } = render(
      <HTMLRenderer content='<html><body>Hi</body></html>' filePath='/tmp/demo/index.html' />
    );

    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('srcdoc')).toContain('<base href="file:///tmp/demo/">');
  });

  it('forwards inspect messages from the iframe to the parent callback', () => {
    const onElementSelected = vi.fn();
    const { container } = render(
      <HTMLRenderer
        content='<html><body><div>Hi</div></body></html>'
        inspectMode
        onElementSelected={onElementSelected}
      />
    );

    const iframe = container.querySelector('iframe')!;
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'aion:inspect-element',
          data: {
            html: '<div>Hi</div>',
            tag: 'div',
          },
        },
        source: iframe.contentWindow,
      })
    );

    expect(onElementSelected).toHaveBeenCalledWith({
      html: '<div>Hi</div>',
      tag: 'div',
    });
  });
});
