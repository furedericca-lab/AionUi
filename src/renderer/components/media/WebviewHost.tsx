/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Left, Right, Refresh, Loading } from '@icon-park/react';

export interface WebviewHostProps {
  /** URL to display */
  url: string;
  /** Unique key for session persistence (legacy prop retained for API stability) */
  id?: string;
  /** Whether to show the navigation bar (back/forward/refresh/URL) */
  showNavBar?: boolean;
  /** Legacy desktop cache partition prop — ignored in WebUI/browser mode */
  partition?: string;
  /** Extra class names for root container */
  className?: string;
  /** Extra styles for root container */
  style?: React.CSSProperties;
  /** Called when the page finishes loading */
  onDidFinishLoad?: () => void;
  /** Called when the page fails to load */
  onDidFailLoad?: (errorCode: number, errorDescription: string) => void;
}

/**
 * Browser-safe embedded page host.
 *
 * The historical `WebviewHost` name is retained to minimize call-site churn
 * after the WebUI-only convergence, but the implementation now uses a normal
 * iframe instead of Electron's `<webview>`.
 */
const WebviewHost: React.FC<WebviewHostProps> = ({
  url,
  id: _id,
  showNavBar = false,
  partition: _partition,
  className,
  style,
  onDidFinishLoad,
  onDidFailLoad,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [inputUrl, setInputUrl] = useState(url);
  const [isLoading, setIsLoading] = useState(true);
  const [frameKey, setFrameKey] = useState(0);

  const historyBackRef = useRef<string[]>([]);
  const historyForwardRef = useRef<string[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    historyBackRef.current = [];
    historyForwardRef.current = [];
    setCanGoBack(false);
    setCanGoForward(false);
    setCurrentUrl(url);
    setInputUrl(url);
    setIsLoading(true);
    setFrameKey(0);
  }, [url]);

  const pushHistoryAndNavigate = useCallback(
    (targetUrl: string) => {
      if (!targetUrl || targetUrl === currentUrl) return;

      if (currentUrl) {
        historyBackRef.current.push(currentUrl);
      }
      historyForwardRef.current = [];
      setCanGoBack(historyBackRef.current.length > 0);
      setCanGoForward(false);
      setCurrentUrl(targetUrl);
      setInputUrl(targetUrl);
      setIsLoading(true);
    },
    [currentUrl]
  );

  const handleGoBack = useCallback(() => {
    const prevUrl = historyBackRef.current.pop();
    if (!prevUrl) return;

    historyForwardRef.current.push(currentUrl);
    setCanGoBack(historyBackRef.current.length > 0);
    setCanGoForward(true);
    setCurrentUrl(prevUrl);
    setInputUrl(prevUrl);
    setIsLoading(true);
  }, [currentUrl]);

  const handleGoForward = useCallback(() => {
    const nextUrl = historyForwardRef.current.pop();
    if (!nextUrl) return;

    historyBackRef.current.push(currentUrl);
    setCanGoBack(true);
    setCanGoForward(historyForwardRef.current.length > 0);
    setCurrentUrl(nextUrl);
    setInputUrl(nextUrl);
    setIsLoading(true);
  }, [currentUrl]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setFrameKey((prev) => prev + 1);
  }, []);

  const normalizeUrlInput = useCallback((rawUrl: string): string => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }, []);

  const handleUrlSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const nextUrl = normalizeUrlInput(inputUrl);
      if (!nextUrl) return;
      pushHistoryAndNavigate(nextUrl);
    },
    [inputUrl, normalizeUrlInput, pushHistoryAndNavigate]
  );

  const handleUrlKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        setInputUrl(currentUrl);
        (event.target as HTMLInputElement).blur();
      }
    },
    [currentUrl]
  );

  const handleFrameLoad = useCallback(() => {
    setIsLoading(false);

    try {
      const nextUrl = iframeRef.current?.contentWindow?.location.href;
      if (nextUrl && nextUrl !== 'about:blank' && nextUrl !== currentUrl) {
        setCurrentUrl(nextUrl);
        setInputUrl(nextUrl);
      }
    } catch {
      // Cross-origin iframe navigation is expected in browser mode.
    }

    onDidFinishLoad?.();
  }, [currentUrl, onDidFinishLoad]);

  const handleFrameError = useCallback(() => {
    setIsLoading(false);
    onDidFailLoad?.(-1, 'Failed to load iframe content');
  }, [onDidFailLoad]);

  return (
    <div className={`h-full w-full flex flex-col ${className ?? ''}`} style={style}>
      {showNavBar && (
        <style>
          {`
            .aion-url-viewer-toolbar {
              --viewer-border: var(--color-border-2);
              --viewer-border-hover: var(--color-border-3);
              --viewer-bg: var(--color-bg-3);
              --viewer-bg-hover: var(--color-fill-2);
              --viewer-text: var(--color-text-2);
              --viewer-text-muted: var(--color-text-3);
            }
            .aion-url-viewer-toolbar .toolbar-btn {
              -webkit-appearance: none;
              appearance: none;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              height: 30px;
              min-width: 30px;
              padding: 0 10px;
              border-radius: 10px;
              border: 1px solid var(--viewer-border);
              background: var(--viewer-bg);
              color: var(--viewer-text);
              line-height: 1;
              font-size: 12px;
              transition: all 150ms ease;
              cursor: pointer;
            }
            .aion-url-viewer-toolbar .toolbar-btn.icon-btn {
              width: 30px;
              min-width: 30px;
              padding: 0;
            }
            .aion-url-viewer-toolbar .toolbar-btn:hover:not(:disabled) {
              background: var(--viewer-bg-hover);
              border-color: var(--viewer-border-hover);
            }
            .aion-url-viewer-toolbar .toolbar-btn:active:not(:disabled) {
              transform: translateY(0.5px);
            }
            .aion-url-viewer-toolbar .toolbar-btn:focus-visible {
              outline: none;
              border-color: rgb(var(--primary-6));
              box-shadow: 0 0 0 2px rgba(var(--primary-6), 0.12);
            }
            .aion-url-viewer-toolbar .toolbar-btn:disabled {
              opacity: 0.55;
              cursor: not-allowed;
              color: var(--viewer-text-muted);
              background: var(--color-bg-2);
            }
            .aion-url-viewer-toolbar .toolbar-input {
              -webkit-appearance: none;
              appearance: none;
              width: 100%;
              height: 30px;
              padding: 0 12px;
              border-radius: 10px;
              border: 1px solid var(--viewer-border);
              background: var(--viewer-bg);
              color: var(--color-text-1);
              font-size: 12px;
              line-height: 30px;
              transition: all 150ms ease;
            }
            .aion-url-viewer-toolbar .toolbar-input:hover {
              border-color: var(--viewer-border-hover);
            }
            .aion-url-viewer-toolbar .toolbar-input:focus {
              outline: none;
              border-color: rgb(var(--primary-6));
              box-shadow: 0 0 0 2px rgba(var(--primary-6), 0.12);
            }
          `}
        </style>
      )}

      {showNavBar && (
        <div className='aion-url-viewer-toolbar flex items-center gap-6px h-40px px-10px bg-bg-2 border-b border-border-1 flex-shrink-0'>
          <button onClick={handleGoBack} disabled={!canGoBack} className='toolbar-btn icon-btn' title='Back'>
            <Left theme='outline' size={16} />
          </button>
          <button onClick={handleGoForward} disabled={!canGoForward} className='toolbar-btn icon-btn' title='Forward'>
            <Right theme='outline' size={16} />
          </button>
          <button onClick={handleRefresh} className='toolbar-btn icon-btn' title='Refresh'>
            {isLoading ? (
              <Loading theme='outline' size={16} className='animate-spin' />
            ) : (
              <Refresh theme='outline' size={16} />
            )}
          </button>
          <form onSubmit={handleUrlSubmit} className='flex-1 ml-2px'>
            <input
              type='text'
              value={inputUrl}
              onChange={(event) => setInputUrl(event.target.value)}
              onKeyDown={handleUrlKeyDown}
              onFocus={(event) => event.target.select()}
              className='toolbar-input'
              placeholder='Enter URL...'
            />
          </form>
        </div>
      )}

      {!showNavBar && isLoading && (
        <div className='absolute inset-0 flex items-center justify-center text-t-secondary text-14px z-10 pointer-events-none'>
          <span className='animate-pulse'>Loading…</span>
        </div>
      )}

      <div className='flex-1 overflow-hidden relative' style={{ minHeight: 0 }}>
        <iframe
          key={`${currentUrl}:${frameKey}`}
          ref={iframeRef}
          src={currentUrl}
          title={currentUrl}
          className='w-full h-full border-0'
          sandbox='allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals'
          referrerPolicy='no-referrer'
          onLoad={handleFrameLoad}
          onError={handleFrameError}
        />
      </div>
    </div>
  );
};

export default WebviewHost;
