/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const readFileBufferMock = vi.fn();
const openFileMock = vi.fn();
const messageErrorMock = vi.fn();
const messageSuccessMock = vi.fn();
const createObjectUrlMock = vi.fn();
const revokeObjectUrlMock = vi.fn();

vi.mock('../../src/common', () => ({
  ipcBridge: {
    fs: {
      readFileBuffer: {
        invoke: (...args: unknown[]) => readFileBufferMock(...args),
      },
    },
    shell: {
      openFile: {
        invoke: (...args: unknown[]) => openFileMock(...args),
      },
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../src/renderer/pages/conversation/Preview/context/PreviewToolbarExtrasContext', () => ({
  usePreviewToolbarExtras: () => null,
}));

vi.mock('@arco-design/web-react', () => ({
  Button: ({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) => (
    <button type='button' onClick={onClick} title={title}>
      {children}
    </button>
  ),
  Message: {
    useMessage: () => [
      {
        error: messageErrorMock,
        success: messageSuccessMock,
      },
      <div key='message-holder' data-testid='message-holder' />,
    ],
  },
}));

import PDFViewer from '../../src/renderer/pages/conversation/Preview/components/viewers/PDFViewer';

describe('PDFViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createObjectUrlMock.mockReturnValue('blob:pdf-preview');
    openFileMock.mockResolvedValue(undefined);
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectUrlMock,
    });
  });

  it('shows an error when no file path or inline content is provided', () => {
    render(<PDFViewer />);

    expect(screen.getByText('❌ preview.pdf.pathMissing')).toBeInTheDocument();
    expect(screen.getByText('preview.pdf.unableDisplay')).toBeInTheDocument();
  });

  it('renders a browser-safe iframe after loading the PDF bytes from the bridge', async () => {
    readFileBufferMock.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

    render(<PDFViewer filePath='/tmp/report.pdf' />);

    await waitFor(() => {
      expect(readFileBufferMock).toHaveBeenCalledWith({ path: '/tmp/report.pdf' });
      expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
      expect(screen.getByTitle('preview.pdf.title')).toHaveAttribute('src', 'blob:pdf-preview');
    });
  });

  it('uses direct PDF content URLs without reading from the filesystem bridge', async () => {
    render(<PDFViewer content='data:application/pdf;base64,ZmFrZQ==' />);

    await waitFor(() => {
      expect(readFileBufferMock).not.toHaveBeenCalled();
      expect(screen.getByTitle('preview.pdf.title')).toHaveAttribute('src', 'data:application/pdf;base64,ZmFrZQ==');
    });
  });

  it('shows a load error when the PDF bytes cannot be read', async () => {
    readFileBufferMock.mockResolvedValue(null);

    render(<PDFViewer filePath='/tmp/missing.pdf' />);

    await waitFor(() => {
      expect(screen.getByText('❌ preview.pdf.loadFailed')).toBeInTheDocument();
    });
  });

  it('opens the PDF in the system app when requested', async () => {
    readFileBufferMock.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

    render(<PDFViewer filePath='/tmp/report.pdf' />);

    await waitFor(() => {
      expect(screen.getByTitle('preview.pdf.title')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('preview.openInSystemApp'));

    await waitFor(() => {
      expect(openFileMock).toHaveBeenCalledWith('/tmp/report.pdf');
      expect(messageSuccessMock).toHaveBeenCalledWith('preview.openInSystemSuccess');
    });
  });

  it('revokes generated object URLs when the component unmounts', async () => {
    readFileBufferMock.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

    const { unmount } = render(<PDFViewer filePath='/tmp/report.pdf' />);

    await waitFor(() => {
      expect(screen.getByTitle('preview.pdf.title')).toBeInTheDocument();
    });

    unmount();

    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:pdf-preview');
  });
});
