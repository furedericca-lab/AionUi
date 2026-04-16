import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackReportModal from '@renderer/components/settings/SettingsModal/contents/FeedbackReportModal';

const { modalWrapperMock, openExternalUrlMock, messageSuccessMock, messageErrorMock } = vi.hoisted(() => ({
  modalWrapperMock: vi.fn(),
  openExternalUrlMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  messageErrorMock: vi.fn(),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@renderer/utils/platform', () => ({
  openExternalUrl: (...args: unknown[]) => openExternalUrlMock(...args),
}));
function createClipboardEvent(files: File[]): ClipboardEvent {
  const fileList = Object.assign([...files], { item: (index: number) => files[index] ?? null });
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;

  Object.defineProperty(event, 'clipboardData', {
    value: {
      files: fileList,
    },
  });

  return event;
}

// Mock ModalWrapper to render children directly
vi.mock('@renderer/components/base/ModalWrapper', () => ({
  default: ({
    children,
    visible,
    title,
    onCancel,
    onOk,
    confirmLoading,
    okText,
    cancelText,
    okButtonProps,
    alignCenter,
    className,
    autoFocus,
  }: {
    children: React.ReactNode;
    visible: boolean;
    title?: React.ReactNode;
    onCancel?: () => void;
    onOk?: () => void;
    confirmLoading?: boolean;
    okText?: React.ReactNode;
    cancelText?: React.ReactNode;
    okButtonProps?: {
      disabled?: boolean;
    };
    alignCenter?: boolean;
    className?: string;
    autoFocus?: boolean;
  }) => {
    modalWrapperMock({
      visible,
      title,
      onCancel,
      onOk,
      confirmLoading,
      okText,
      cancelText,
      okButtonProps,
      alignCenter,
      className,
      autoFocus,
    });
    if (!visible) return null;
    return (
      <div data-testid='modal-wrapper' className={className}>
        {title && <div data-testid='modal-title'>{title}</div>}
        {children}
        <div data-testid='modal-footer'>
          <button onClick={onCancel}>{cancelText}</button>
          <button onClick={onOk} disabled={okButtonProps?.disabled} data-loading={confirmLoading}>
            {okText}
          </button>
        </div>
      </div>
    );
  },
}));

// Mock Arco Design components
vi.mock('@arco-design/web-react', () => ({
  Input: Object.assign(
    ({
      placeholder,
      value,
      onChange,
      maxLength,
      ...rest
    }: {
      placeholder?: string;
      value?: string;
      onChange?: (val: string) => void;
      maxLength?: number;
      [key: string]: unknown;
    }) => (
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        maxLength={maxLength}
        {...rest}
      />
    ),
    {
      TextArea: ({
        placeholder,
        value,
        onChange,
        maxLength,
      }: {
        placeholder?: string;
        value?: string;
        onChange?: (val: string) => void;
        maxLength?: number;
      }) => (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          maxLength={maxLength}
        />
      ),
    }
  ),
  Select: Object.assign(
    ({
      children,
      placeholder,
      value,
      onChange,
    }: {
      children?: React.ReactNode;
      placeholder?: string;
      value?: string;
      onChange?: (val: string) => void;
    }) => (
      <select value={value ?? ''} onChange={(e) => onChange?.(e.target.value)}>
        <option value='' disabled>
          {placeholder}
        </option>
        {children}
      </select>
    ),
    {
      Option: ({ children, value }: { children: React.ReactNode; value: string }) => (
        <option value={value}>{children}</option>
      ),
    }
  ),
  Message: {
    success: messageSuccessMock,
    error: messageErrorMock,
  },
  Upload: ({
    tip,
    fileList,
    children,
  }: {
    tip?: string;
    fileList?: Array<{ name: string }>;
    children?: React.ReactNode;
  }) => (
    <div data-testid='upload' data-file-count={fileList?.length ?? 0}>
      {children}
      {tip}
      {fileList?.map((file) => (
        <span key={file.name}>{file.name}</span>
      ))}
    </div>
  ),
}));

// Mock icon-park
vi.mock('@icon-park/react', () => ({
  Info: () => <span data-testid='info-icon' />,
  Plus: () => <span data-testid='plus-icon' />,
}));

import React from 'react';

describe('FeedbackReportModal', () => {
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    openExternalUrlMock.mockResolvedValue(undefined);
  });

  it('should render form fields when visible', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    expect(screen.getByText('settings.bugReportModuleLabel')).toBeDefined();
    expect(screen.getByText('settings.bugReportDescriptionLabel')).toBeDefined();
    expect(screen.getByText('settings.bugReportScreenshotDropzoneText')).toBeDefined();
    expect(screen.getByText('settings.bugReportScreenshotFormats')).toBeDefined();
  });

  it('should not render when not visible', () => {
    render(<FeedbackReportModal visible={false} onCancel={onCancel} />);
    expect(screen.queryByText('settings.bugReportModuleLabel')).toBeNull();
  });

  it('should not render a separate title field', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    expect(screen.queryByText('settings.bugReportTitleLabel')).toBeNull();
    expect(screen.queryByPlaceholderText('settings.bugReportTitlePlaceholder')).toBeNull();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('settings.bugReportCancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('should request centered modal layout', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);
    expect(modalWrapperMock).toHaveBeenCalledWith(
      expect.objectContaining({
        visible: true,
        alignCenter: true,
      })
    );
  });

  it('should use the shared modal wrapper title and actions', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    expect(screen.getByTestId('modal-footer')).toBeDefined();
    expect(modalWrapperMock).toHaveBeenCalledWith(
      expect.objectContaining({
        visible: true,
        title: 'settings.bugReportTitle',
        okText: 'settings.bugReportSubmit',
        cancelText: 'settings.bugReportCancel',
      })
    );
  });

  it('should disable submit until the required fields are filled', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    const submitButton = screen.getByRole('button', { name: 'settings.bugReportSubmit' });

    expect(submitButton).toBeDisabled();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'agent-detection' },
    });
    fireEvent.change(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder'), {
      target: { value: 'Agent unavailable after update' },
    });

    expect(submitButton).not.toBeDisabled();
  });

  it('should explain the selected module below the selector', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    expect(screen.queryByText('settings.bugReportModulePermissionDescription')).toBeNull();

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'agent-detection' },
    });

    expect(screen.getByText('settings.bugReportModulePermissionDescription')).toBeDefined();
  });

  it('should constrain body height and keep the form scrollable', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    const scrollBody = screen.getByTestId('feedback-report-scroll-body');
    expect(scrollBody.className).toContain('overflow-y-auto');
    expect(scrollBody.className).toContain('overflow-x-hidden');
    expect(scrollBody.className).toContain('max-h-[min(66vh,520px)]');
  });

  it('should render a compact auto-info banner aligned to the text', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    const autoInfo = screen.getByTestId('feedback-report-auto-info');
    expect(autoInfo.className).toContain('inline-flex');
    expect(autoInfo.className).toContain('items-start');
    expect(autoInfo.className).toContain('leading-18px');
  });

  it('should render the paste hint inside the upload dropzone instead of a separate helper line', () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    const uploadTrigger = screen.getByTestId('feedback-report-upload-trigger');

    expect(uploadTrigger.className).toContain('min-h-180px');
    expect(uploadTrigger.className).toContain('w-full');
    expect(uploadTrigger.className).toContain('box-border');
    expect(screen.queryByText('settings.bugReportScreenshotHelp')).toBeNull();
  });

  it('should open a GitHub draft issue with the selected module and description', async () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'agent-detection' },
    });
    fireEvent.change(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder'), {
      target: { value: 'Agent unavailable after update' },
    });
    fireEvent.click(screen.getByText('settings.bugReportSubmit'));

    await waitFor(() => {
      expect(openExternalUrlMock).toHaveBeenCalledTimes(1);
    });

    const issueUrl = new URL(openExternalUrlMock.mock.calls[0][0]);
    expect(issueUrl.origin + issueUrl.pathname).toBe('https://github.com/iOfficeAI/AionUi/issues/new');
    expect(issueUrl.searchParams.get('title')).toBe(
      '[Bug]: settings.bugReportModulePermission - Agent unavailable after update'
    );
    expect(issueUrl.searchParams.get('body')).toContain('## settings.bugReportModuleLabel');
    expect(issueUrl.searchParams.get('body')).toContain('Agent unavailable after update');
    expect(messageSuccessMock).toHaveBeenCalledWith('settings.bugReportSuccess');
  });

  it('should list pasted screenshot filenames in the draft issue body', async () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    document.dispatchEvent(
      createClipboardEvent([new File([new Uint8Array([1, 2, 3])], 'clipboard.png', { type: 'image/png' })])
    );

    await waitFor(() => {
      expect(screen.getByTestId('upload')).toHaveAttribute('data-file-count', '1');
    });

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'agent-detection' },
    });
    fireEvent.change(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder'), {
      target: { value: 'Agent unavailable after update' },
    });
    fireEvent.click(screen.getByText('settings.bugReportSubmit'));

    await waitFor(() => {
      expect(openExternalUrlMock).toHaveBeenCalledTimes(1);
    });

    const issueUrl = new URL(openExternalUrlMock.mock.calls[0][0]);
    expect(issueUrl.searchParams.get('body')).toContain('- clipboard.png');
  });

  it('should keep only the first three pasted screenshots', async () => {
    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    document.dispatchEvent(
      createClipboardEvent([
        new File([new Uint8Array([1])], 'one.png', { type: 'image/png' }),
        new File([new Uint8Array([2])], 'two.png', { type: 'image/png' }),
        new File([new Uint8Array([3])], 'three.png', { type: 'image/png' }),
        new File([new Uint8Array([4])], 'four.png', { type: 'image/png' }),
      ])
    );

    await waitFor(() => {
      expect(screen.getByTestId('upload')).toHaveAttribute('data-file-count', '3');
    });

    expect(screen.getByText('one.png')).toBeDefined();
    expect(screen.getByText('two.png')).toBeDefined();
    expect(screen.getByText('three.png')).toBeDefined();
    expect(screen.queryByText('four.png')).toBeNull();
  });

  it('should show an error when submitting fails', async () => {
    openExternalUrlMock.mockRejectedValueOnce(new Error('submit failed'));

    render(<FeedbackReportModal visible={true} onCancel={onCancel} />);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'agent-detection' },
    });
    fireEvent.change(screen.getByPlaceholderText('settings.bugReportDescriptionPlaceholder'), {
      target: { value: 'Agent unavailable after update' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'settings.bugReportSubmit' }));

    await waitFor(() => {
      expect(screen.getByText('settings.bugReportError')).toBeDefined();
    });
  });
});
