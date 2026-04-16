/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Input } from '@arco-design/web-react';
import React from 'react';

type WorkspaceFolderSelectProps = {
  value?: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder: string;
  inputPlaceholder?: string;
  recentLabel: string;
  chooseDifferentLabel: string;
  recentStorageKey?: string;
  triggerTestId?: string;
  menuTestId?: string;
  menuZIndex?: number;
};

const WorkspaceFolderSelect: React.FC<WorkspaceFolderSelectProps> = ({
  value,
  onChange,
  placeholder,
  inputPlaceholder,
  onClear: _onClear,
  recentLabel: _recentLabel,
  chooseDifferentLabel: _chooseDifferentLabel,
  recentStorageKey: _recentStorageKey,
  triggerTestId: _triggerTestId,
  menuTestId: _menuTestId,
  menuZIndex: _menuZIndex,
}) => {
  return <Input placeholder={inputPlaceholder ?? placeholder} value={value ?? ''} onChange={onChange} />;
};

export default WorkspaceFolderSelect;
