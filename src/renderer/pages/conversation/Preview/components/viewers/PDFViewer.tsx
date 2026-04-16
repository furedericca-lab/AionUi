/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { usePreviewToolbarExtras } from '../../context/PreviewToolbarExtrasContext';
import { Button, Message } from '@arco-design/web-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PDFPreviewProps {
  /**
   * PDF file path (absolute path on disk)
   * PDF 文件路径（磁盘上的绝对路径）
   */
  filePath?: string;
  /**
   * PDF content as base64 or blob URL
   * PDF 内容（base64 或 blob URL）
   */
  content?: string;
  hideToolbar?: boolean;
}

const isDirectPreviewUrl = (value: string): boolean => /^(https?:|data:|blob:|file:)/i.test(value);

const PDFPreview: React.FC<PDFPreviewProps> = ({ filePath, content, hideToolbar = false }) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfSrc, setPdfSrc] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [messageApi, messageContextHolder] = Message.useMessage();
  const toolbarExtrasContext = usePreviewToolbarExtras();
  const usePortalToolbar = Boolean(toolbarExtrasContext) && !hideToolbar;

  const cleanupObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const handleOpenInSystem = useCallback(async () => {
    if (!filePath) {
      messageApi.error(t('preview.errors.openWithoutPath'));
      return;
    }

    try {
      await ipcBridge.shell.openFile.invoke(filePath);
      messageApi.success(t('preview.openInSystemSuccess'));
    } catch (err) {
      messageApi.error(t('preview.openInSystemFailed'));
    }
  }, [filePath, messageApi, t]);

  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      cleanupObjectUrl();
      setLoading(true);
      setError(null);
      setPdfSrc(null);

      if (!filePath && !content) {
        setError(t('preview.pdf.pathMissing'));
        setLoading(false);
        return;
      }

      try {
        if (filePath) {
          const buffer = await ipcBridge.fs.readFileBuffer.invoke({ path: filePath });
          if (!buffer) {
            setError(t('preview.pdf.loadFailed'));
            setLoading(false);
            return;
          }

          const nextUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
          if (cancelled) {
            URL.revokeObjectURL(nextUrl);
            return;
          }

          objectUrlRef.current = nextUrl;
          setPdfSrc(nextUrl);
          setLoading(false);
          return;
        }

        if (content) {
          setPdfSrc(isDirectPreviewUrl(content) ? content : `data:application/pdf;base64,${content}`);
          setLoading(false);
          return;
        }

        setError(t('preview.pdf.pathMissing'));
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(`${t('preview.pdf.loadFailed')}: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };

    void loadPdf();

    return () => {
      cancelled = true;
      cleanupObjectUrl();
    };
  }, [cleanupObjectUrl, content, filePath, t]);

  // 设置工具栏扩展（必须在所有条件返回之前调用）
  // Set toolbar extras (must be called before any conditional returns)
  useEffect(() => {
    if (!usePortalToolbar || !toolbarExtrasContext || loading || error) return;
    toolbarExtrasContext.setExtras({
      left: (
        <div className='flex items-center gap-8px'>
          <span className='text-13px text-t-secondary'>📄 {t('preview.pdf.title')}</span>
          <span className='text-11px text-t-tertiary'>{t('preview.readOnlyLabel')}</span>
        </div>
      ),
      right: null,
    });
    return () => toolbarExtrasContext.setExtras(null);
  }, [usePortalToolbar, toolbarExtrasContext, t, loading, error]);

  if (error) {
    return (
      <div className='flex items-center justify-center h-full'>
        {messageContextHolder}
        <div className='text-center'>
          <div className='text-16px text-t-error mb-8px'>❌ {error}</div>
          <div className='text-12px text-t-secondary'>{t('preview.pdf.unableDisplay')}</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        {messageContextHolder}
        <div className='text-14px text-t-secondary'>{t('preview.loading')}</div>
      </div>
    );
  }

  return (
    <div className='h-full w-full bg-bg-1 flex flex-col'>
      {messageContextHolder}
      {!usePortalToolbar && !hideToolbar && (
        <div className='flex items-center justify-between h-40px px-12px bg-bg-2 flex-shrink-0'>
          <div className='flex items-center gap-8px'>
            <span className='text-13px text-t-secondary'>📄 {t('preview.pdf.title')}</span>
            <span className='text-11px text-t-tertiary'>{t('preview.readOnlyLabel')}</span>
          </div>
          {filePath && (
            <Button size='mini' type='text' onClick={handleOpenInSystem} title={t('preview.openInSystemApp')}>
              <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
                <polyline points='15 3 21 3 21 9' />
                <line x1='10' y1='14' x2='21' y2='3' />
              </svg>
              <span>{t('preview.openInSystemApp')}</span>
            </Button>
          )}
        </div>
      )}
      {/* PDF 内容区域 / PDF content area */}
      <div className='flex-1 overflow-hidden bg-bg-1'>
        <iframe
          key={pdfSrc}
          src={pdfSrc ?? ''}
          title={t('preview.pdf.title')}
          className='w-full h-full'
          style={{ display: 'inline-flex' }}
        />
      </div>
    </div>
  );
};

export default PDFPreview;
