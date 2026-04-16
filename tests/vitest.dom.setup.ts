/**
 * Vitest DOM Test Setup
 * Configuration for React component and hook tests using jsdom
 */

import '@testing-library/jest-dom/vitest';

// Make this a module

// Mock ResizeObserver for Virtuoso
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = IntersectionObserverMock as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(() => callback(Date.now()), 0) as unknown as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock scrollTo
Element.prototype.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

// Mock localStorage (not always available in jsdom)
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage?.clear !== 'function') {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  }
}
