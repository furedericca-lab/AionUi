import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@arco-design/web-react', () => ({
  Input: ({
    placeholder,
    value,
    onChange,
  }: {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
  }) => (
    <input
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
      readOnly={typeof onChange !== 'function'}
    />
  ),
}));

import WorkspaceFolderSelect from '@/renderer/components/workspace/WorkspaceFolderSelect';

describe('WorkspaceFolderSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders a plain Input with the explicit input placeholder', () => {
    render(
      <WorkspaceFolderSelect
        value='/some/path'
        onChange={vi.fn()}
        placeholder='Select folder'
        inputPlaceholder='Enter workspace path'
        recentLabel='Recent'
        chooseDifferentLabel='Browse'
      />
    );

    expect(screen.getByPlaceholderText('Enter workspace path')).toHaveValue('/some/path');
  });

  it('falls back to the base placeholder when inputPlaceholder is absent', () => {
    render(
      <WorkspaceFolderSelect
        value=''
        onChange={vi.fn()}
        placeholder='Fallback placeholder'
        recentLabel='Recent'
        chooseDifferentLabel='Browse'
      />
    );

    expect(screen.getByPlaceholderText('Fallback placeholder')).toBeInTheDocument();
  });
});
