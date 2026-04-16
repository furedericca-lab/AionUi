/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { useTypingAnimation } from '@/renderer/hooks/chat/useTypingAnimation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useScrollSyncTarget } from '../../hooks/useScrollSyncHelpers';
import { generateInspectScript } from './htmlInspectScript';

/** 选中元素的数据结构 / Selected element data structure */
export interface InspectedElement {
  /** 完整 HTML / Full HTML */
  html: string;
  /** 简化标签名 / Simplified tag name */
  tag: string;
}

interface HTMLRendererProps {
  content: string;
  filePath?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  inspectMode?: boolean;
  copySuccessMessage?: string;
  onElementSelected?: (element: InspectedElement) => void;
}

const HTML_SCROLL_EVENT = 'aion:html-scroll';
const HTML_HEIGHT_EVENT = 'aion:html-height';
const HTML_INSPECT_EVENT = 'aion:inspect-element';

function resolveRelativePath(basePath: string, relativePath: string): string {
  const cleanBasePath = basePath.replace(/^file:\/\//, '');
  const baseDir =
    cleanBasePath.substring(0, cleanBasePath.lastIndexOf('/') + 1) ||
    cleanBasePath.substring(0, cleanBasePath.lastIndexOf('\\') + 1);

  if (relativePath.startsWith('/') || /^[a-zA-Z]:/.test(relativePath)) {
    return relativePath;
  }

  const parts = baseDir.replace(/\\/g, '/').split('/').filter(Boolean);
  const relParts = relativePath.replace(/\\/g, '/').split('/');

  for (const part of relParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.') {
      parts.push(part);
    }
  }

  if (/^[a-zA-Z]:/.test(baseDir)) {
    return parts.join('/');
  }
  return '/' + parts.join('/');
}

function ensureBaseTag(html: string, filePath?: string): string {
  if (!filePath || html.match(/<base\s+href=/i)) {
    return html;
  }

  const fileDir = filePath.substring(0, filePath.lastIndexOf('/') + 1);
  const baseUrl = `file://${fileDir}`;

  if (html.match(/<head>/i)) {
    return html.replace(/<head>/i, `<head><base href="${baseUrl}">`);
  }
  if (html.match(/<html>/i)) {
    return html.replace(/<html>/i, `<html><head><base href="${baseUrl}"></head>`);
  }
  return `<head><base href="${baseUrl}"></head>${html}`;
}

function appendScriptToHtml(html: string, scriptContent: string): string {
  const scriptTag = `<script>${scriptContent}</script>`;
  if (html.match(/<\/body>/i)) {
    return html.replace(/<\/body>/i, `${scriptTag}</body>`);
  }
  return `${html}${scriptTag}`;
}

async function inlineRelativeResources(html: string, basePath: string): Promise<string> {
  let result = html;

  const imgRegex = /<img([^>]*)\ssrc=["'](?!https?:\/\/|data:|\/\/)([^"']+)["']([^>]*)>/gi;
  const imgMatches = [...result.matchAll(imgRegex)];
  for (const match of imgMatches) {
    const [fullMatch, before, src, after] = match;
    try {
      const absolutePath = resolveRelativePath(basePath, src);
      const dataUrl = await ipcBridge.fs.getImageBase64.invoke({ path: absolutePath });
      if (dataUrl) {
        result = result.replace(fullMatch, `<img${before} src="${dataUrl}"${after}>`);
      }
    } catch (error) {
      console.warn('[HTMLRenderer] Failed to inline image:', src, error);
    }
  }

  const linkRegex = /<link([^>]*)\shref=["'](?!https?:\/\/|data:|\/\/)([^"']+)["']([^>]*)>/gi;
  const linkMatches = [...result.matchAll(linkRegex)];
  for (const match of linkMatches) {
    const [fullMatch, _before, href] = match;
    const isStylesheet = /rel=["']stylesheet["']/i.test(fullMatch) || href.endsWith('.css');
    if (!isStylesheet) continue;

    try {
      const absolutePath = resolveRelativePath(basePath, href);
      const cssContent = await ipcBridge.fs.readFile.invoke({ path: absolutePath });
      if (!cssContent) continue;

      let processedCss = cssContent;
      const cssUrlRegex = /url\(["']?(?!https?:\/\/|data:|\/\/)([^"')]+)["']?\)/gi;
      const cssUrlMatches = [...processedCss.matchAll(cssUrlRegex)];

      for (const urlMatch of cssUrlMatches) {
        const [urlFullMatch, urlPath] = urlMatch;
        try {
          const resourcePath = resolveRelativePath(absolutePath, urlPath);
          const dataUrl = await ipcBridge.fs.getImageBase64.invoke({ path: resourcePath });
          if (dataUrl) {
            processedCss = processedCss.replace(urlFullMatch, `url("${dataUrl}")`);
          }
        } catch (error) {
          console.warn('[HTMLRenderer] Failed to inline CSS resource:', urlPath, error);
        }
      }

      result = result.replace(fullMatch, `<style>${processedCss}</style>`);
    } catch (error) {
      console.warn('[HTMLRenderer] Failed to inline CSS:', href, error);
    }
  }

  const scriptRegex = /<script([^>]*)\ssrc=["'](?!https?:\/\/|data:|\/\/)([^"']+)["']([^>]*)><\/script>/gi;
  const scriptMatches = [...result.matchAll(scriptRegex)];
  for (const match of scriptMatches) {
    const [fullMatch, before, src, after] = match;
    try {
      const absolutePath = resolveRelativePath(basePath, src);
      const scriptContent = await ipcBridge.fs.readFile.invoke({ path: absolutePath });
      if (!scriptContent) continue;

      const attrsToKeep = (before + after).replace(/\s*(defer|async)\s*/gi, '');
      result = result.replace(fullMatch, `<script${attrsToKeep}>${scriptContent}</script>`);
    } catch (error) {
      console.warn('[HTMLRenderer] Failed to inline script:', src, error);
    }
  }

  return result;
}

const HTMLRenderer: React.FC<HTMLRendererProps> = ({
  content,
  filePath,
  containerRef,
  onScroll,
  inspectMode = false,
  copySuccessMessage,
  onElementSelected,
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isSyncingScrollRef = useRef(false);
  const [inlinedHtmlContent, setInlinedHtmlContent] = useState<string>('');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const updateTheme = () => {
      const theme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
      setCurrentTheme(theme);
    };

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const hasRelativeResources = useMemo(() => {
    return (
      /<link[^>]+href=["'](?!https?:\/\/|data:|\/\/)[^"']+["']/i.test(content) ||
      /<script[^>]+src=["'](?!https?:\/\/|data:|\/\/)[^"']+["']/i.test(content) ||
      /<img[^>]+src=["'](?!https?:\/\/|data:|\/\/)[^"']+["']/i.test(content)
    );
  }, [content]);

  const { displayedContent } = useTypingAnimation({
    content,
    enabled: !hasRelativeResources,
    speed: 40,
  });

  useEffect(() => {
    if (!hasRelativeResources || !filePath) {
      setInlinedHtmlContent(content);
      return;
    }

    let cancelled = false;
    inlineRelativeResources(content, filePath)
      .then((inlined) => {
        if (!cancelled) {
          setInlinedHtmlContent(inlined);
        }
      })
      .catch((error) => {
        console.warn('[HTMLRenderer] Failed to inline resources:', error);
        if (!cancelled) {
          setInlinedHtmlContent(content);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [content, filePath, hasRelativeResources]);

  const copySuccessText = useMemo(() => copySuccessMessage ?? '✓ Copied HTML snippet', [copySuccessMessage]);
  const inspectScript = useMemo(
    () => generateInspectScript(inspectMode, { copySuccess: copySuccessText }),
    [copySuccessText, inspectMode]
  );

  const scrollScript = useMemo(
    () => `
      (function() {
        const post = (type, data) => {
          window.parent.postMessage({ type, data }, '*');
        };

        const sendContentHeight = () => {
          const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
          post('${HTML_HEIGHT_EVENT}', { height: scrollHeight });
        };

        sendContentHeight();

        if (!window.__aionHtmlResizeObserver) {
          window.__aionHtmlResizeObserver = new ResizeObserver(sendContentHeight);
          window.__aionHtmlResizeObserver.observe(document.body);
        }

        if (!window.__aionHtmlScrollHandler) {
          let scrollTimeout;
          window.__aionHtmlScrollHandler = function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
              const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
              const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
              const clientHeight = window.innerHeight || document.documentElement.clientHeight;
              post('${HTML_SCROLL_EVENT}', { scrollTop, scrollHeight, clientHeight });
            }, 16);
          };
          window.addEventListener('scroll', window.__aionHtmlScrollHandler, { passive: true });
        }
      })();
    `,
    []
  );

  const browserHtmlContent = useMemo(() => {
    const rawHtml = hasRelativeResources && filePath ? inlinedHtmlContent || content : displayedContent;
    const htmlWithBase = ensureBaseTag(rawHtml, filePath);
    return appendScriptToHtml(appendScriptToHtml(htmlWithBase, scrollScript), inspectScript);
  }, [content, displayedContent, filePath, hasRelativeResources, inlinedHtmlContent, inspectScript, scrollScript]);

  useEffect(() => {
    const iframeWindow = iframeRef.current?.contentWindow;

    const handleMessage = (event: MessageEvent) => {
      if (iframeWindow && event.source !== iframeWindow) return;

      if (event.data?.type === HTML_INSPECT_EVENT && onElementSelected) {
        onElementSelected(event.data.data as InspectedElement);
        return;
      }

      if (event.data?.type === HTML_SCROLL_EVENT && onScroll) {
        if (isSyncingScrollRef.current) return;
        const data = event.data.data as { scrollTop: number; scrollHeight: number; clientHeight: number };
        onScroll(data.scrollTop, data.scrollHeight, data.clientHeight);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementSelected, onScroll, browserHtmlContent]);

  const handleTargetScroll = useCallback((targetPercent: number) => {
    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow) return;

    try {
      const frameDocument = frameWindow.document;
      const scrollHeight = Math.max(frameDocument.documentElement.scrollHeight, frameDocument.body.scrollHeight);
      const clientHeight = frameWindow.innerHeight || frameDocument.documentElement.clientHeight;
      const targetScroll = targetPercent * (scrollHeight - clientHeight);
      frameWindow.scrollTo({ top: targetScroll, behavior: 'auto' });
    } catch {
      // Ignore transient iframe access errors during reload
    }
  }, []);

  const effectiveContainerRef = containerRef || divRef;
  useScrollSyncTarget(effectiveContainerRef, handleTargetScroll);

  return (
    <div
      ref={containerRef || divRef}
      className={`h-full w-full overflow-hidden relative ${currentTheme === 'dark' ? 'bg-bg-1' : 'bg-white'}`}
    >
      <iframe
        ref={iframeRef}
        srcDoc={browserHtmlContent}
        className='w-full h-full border-0'
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
        sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
      />
    </div>
  );
};

export default HTMLRenderer;
