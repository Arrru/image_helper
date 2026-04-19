import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import type {
  LoadTokenResult,
  SaveTokenResult,
  ValidateTokenResult,
} from '../../shared/types';
import {
  deleteToken,
  loadToken,
  saveToken,
} from '../services/credential.service';
import { validateToken } from '../services/github.service';

export function registerAuthIpc(): void {
  ipcMain.handle(
    IPC.AUTH_VALIDATE,
    async (_evt, token: string): Promise<ValidateTokenResult> => {
      return validateToken(token);
    },
  );

  ipcMain.handle(
    IPC.AUTH_SAVE_TOKEN,
    async (_evt, token: string): Promise<SaveTokenResult> => {
      const validation = await validateToken(token);
      if (!validation.valid) {
        return {
          success: false,
          username: null,
          error: validation.error ?? '토큰이 올바르지 않아요.',
        };
      }
      await saveToken(token.trim());
      return { success: true, username: validation.username };
    },
  );

  ipcMain.handle(
    IPC.AUTH_LOAD_TOKEN,
    async (): Promise<LoadTokenResult> => {
      const token = await loadToken();
      if (!token) return { token: null, username: null };
      // Best-effort username check; do not fail the call if it errors
      try {
        const v = await validateToken(token);
        return { token, username: v.username };
      } catch {
        return { token, username: null };
      }
    },
  );

  ipcMain.handle(IPC.AUTH_DELETE_TOKEN, async (): Promise<{ success: boolean }> => {
    const ok = await deleteToken();
    return { success: ok };
  });
}
