import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { type ListRemoteFilesResult, type DeleteRemoteFilesResult } from '../../shared/types';
import { loadToken } from '../services/credential.service';
import { getDefaultConfig, listRemoteFiles, deleteRemoteFile } from '../services/github.service';
import { formatKSTShort } from '../utils/time';

export function registerFilesIpc(): void {
  ipcMain.handle(IPC.FILES_LIST, async (): Promise<ListRemoteFilesResult> => {
    const token = await loadToken();
    if (!token) return { images: [], sounds: [], error: 'GitHub 연결이 끊겼어요.' };
    const cfg = getDefaultConfig();
    try {
      const [images, sounds] = await Promise.all([
        listRemoteFiles(token, cfg, cfg.imagePath),
        listRemoteFiles(token, cfg, cfg.soundPath),
      ]);
      return { images, sounds };
    } catch (err) {
      return { images: [], sounds: [], error: (err as Error).message };
    }
  });

  ipcMain.handle(
    IPC.FILES_DELETE,
    async (_evt, items: { path: string; sha: string }[]): Promise<DeleteRemoteFilesResult> => {
      const token = await loadToken();
      if (!token) return { success: false, deletedCount: 0, error: 'GitHub 연결이 끊겼어요.' };
      const cfg = getDefaultConfig();
      const msg = `[Deploy] 파일 삭제 - ${formatKSTShort(new Date())}`;
      let deleted = 0;
      try {
        for (const item of items) {
          await deleteRemoteFile(token, cfg, item.path, item.sha, msg);
          deleted++;
        }
        return { success: true, deletedCount: deleted };
      } catch (err) {
        const anyErr = err as { status?: number; message?: string };
        let error = anyErr?.message ?? '삭제 중 오류가 발생했어요.';
        if (anyErr?.status === 401) error = 'GitHub 연결이 끊겼어요.';
        if (anyErr?.status === 403) error = '삭제 권한이 없어요.';
        return { success: deleted > 0, deletedCount: deleted, error };
      }
    },
  );
}
