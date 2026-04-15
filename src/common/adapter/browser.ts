/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { bridge } from '@office-ai/platform';
import { WEBUI_DEFAULT_PORT } from '@/common/config/constants';

type QueuedMessage = { name: string; data: unknown };

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const defaultHost = `${window.location.hostname}:${WEBUI_DEFAULT_PORT}`;
const socketUrl = `${protocol}//${window.location.host || defaultHost}`;

let socket: WebSocket | null = null;
let emitterRef: { emit: (name: string, data: unknown) => void } | null = null;
let reconnectTimer: number | null = null;
let reconnectDelay = 500;
let shouldReconnect = true;

const messageQueue: QueuedMessage[] = [];

const flushQueue = () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  while (messageQueue.length > 0) {
    const queued = messageQueue.shift();
    if (queued) socket.send(JSON.stringify(queued));
  }
};

const scheduleReconnect = () => {
  if (reconnectTimer !== null || !shouldReconnect) return;
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 2, 8000);
    connect();
  }, reconnectDelay);
};

const redirectToLogin = (delayMs: number) => {
  if (window.location.pathname === '/login' || window.location.hash.includes('/login')) return;
  setTimeout(() => {
    window.location.hash = '/login';
  }, delayMs);
};

const connect = () => {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  try {
    socket = new WebSocket(socketUrl);
  } catch {
    scheduleReconnect();
    return;
  }

  const currentSocket = socket;

  currentSocket.addEventListener('open', () => {
    reconnectDelay = 500;
    flushQueue();
  });

  currentSocket.addEventListener('message', (event: MessageEvent) => {
    if (!emitterRef) return;
    try {
      const payload = JSON.parse(event.data as string) as { name: string; data: unknown };
      if (payload.name === 'ping') {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ name: 'pong', data: { timestamp: Date.now() } }));
        }
        return;
      }
      if (payload.name === 'auth-expired') {
        shouldReconnect = false;
        if (reconnectTimer !== null) {
          window.clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        socket?.close();
        redirectToLogin(1000);
        return;
      }
      emitterRef.emit(payload.name, payload.data);
    } catch {
      // Ignore malformed payloads
    }
  });

  currentSocket.addEventListener('close', (event: CloseEvent) => {
    if (socket === currentSocket) socket = null;
    if (event.code === 1008 && !shouldReconnect) return;
    if (event.code === 1008) {
      shouldReconnect = false;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      redirectToLogin(500);
      return;
    }
    scheduleReconnect();
  });

  currentSocket.addEventListener('error', () => {
    currentSocket.close();
  });
};

const ensureSocket = () => {
  if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) connect();
};

bridge.adapter({
  emit(name, data) {
    const message: QueuedMessage = { name, data };
    ensureSocket();
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(message));
        return;
      } catch {
        // fall through to queue
      }
    }
    messageQueue.push(message);
  },
  on(emitter) {
    emitterRef = emitter;
    ensureSocket();
  },
});
