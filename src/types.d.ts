declare module '@xterm/headless/lib-headless/xterm-headless.js';
declare module 'diff';

declare module 'cookie' {
  export type CookieParseOptions = {
    decode?: (value: string) => string;
  };

  export function parse(cookieHeader: string, options?: CookieParseOptions): Record<string, string>;
}

declare global {
  namespace NodeJS {
    interface Process {
      resourcesPath?: string;
      parentPort?: {
        on(event: 'message', listener: (event: { data: unknown }) => void): void;
        postMessage?: (message: unknown) => void;
      };
    }
  }
}
