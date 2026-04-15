/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { webui } from '@/common/adapter/ipcBridge';
import { WebuiService } from './services/WebuiService';
import { generateQRLoginUrlDirect, verifyQRTokenDirect } from './webuiQR';

export { generateQRLoginUrlDirect, verifyQRTokenDirect };

let webServerInstance: {
  server: import('http').Server;
  wss: import('ws').WebSocketServer;
  port: number;
  allowRemote: boolean;
} | null = null;

export function setWebServerInstance(instance: typeof webServerInstance): void {
  webServerInstance = instance;
}

export function getWebServerInstance(): typeof webServerInstance {
  return webServerInstance;
}

export function initWebuiBridge(): void {
  webui.getStatus.provider(async () => {
    return WebuiService.handleAsync(async () => {
      const status = await WebuiService.getStatus(webServerInstance);
      return { success: true, data: status };
    }, 'Get status');
  });

  webui.changePassword.provider(async ({ newPassword }) => {
    return WebuiService.handleAsync(async () => {
      await WebuiService.changePassword(newPassword);
      return { success: true };
    }, 'Change password');
  });

  webui.changeUsername.provider(async ({ newUsername }) => {
    return WebuiService.handleAsync(async () => {
      const username = await WebuiService.changeUsername(newUsername);
      return { success: true, data: { username } };
    }, 'Change username');
  });

  webui.resetPassword.provider(async () => {
    const result = await WebuiService.handleAsync(async () => {
      const newPassword = await WebuiService.resetPassword();
      return { success: true, data: { newPassword } };
    }, 'Reset password');

    if (result.success && result.data) {
      webui.resetPasswordResult.emit({ success: true, newPassword: result.data.newPassword });
    } else {
      webui.resetPasswordResult.emit({ success: false, msg: result.msg });
    }

    return result;
  });

  webui.generateQRToken.provider(async () => {
    if (!webServerInstance) {
      return {
        success: false,
        msg: 'WebUI server is not ready yet.',
      };
    }

    try {
      const { port, allowRemote } = webServerInstance;
      const { qrUrl, expiresAt } = generateQRLoginUrlDirect(port, allowRemote);
      const token = new URL(qrUrl).searchParams.get('token') ?? '';
      return {
        success: true,
        data: {
          token,
          expiresAt,
          qrUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        msg: error instanceof Error ? error.message : 'Failed to generate QR token',
      };
    }
  });

  webui.verifyQRToken.provider(async ({ qrToken }) => {
    return verifyQRTokenDirect(qrToken);
  });
}
