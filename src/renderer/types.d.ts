declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*?raw' {
  const content: string;
  export default content;
}

declare module 'unocss';

declare namespace Electron {
  interface ConsoleMessageEvent extends Event {
    message: string;
  }

  interface WebviewTag extends HTMLElement {
    src: string;
    reload(): void;
    executeJavaScript(script: string): Promise<unknown>;
    setZoomFactor?(factor: number): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  }
}
