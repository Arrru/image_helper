import { BrowserWindow, Notification, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { IPC } from '../../shared/ipc-channels';
import {
  type DeployPollResult,
  type DeployStartResult,
  type DeploymentRecord,
  type FileInputPayload,
  PAGES_URL,
} from '../../shared/types';
import { loadToken } from '../services/credential.service';
import {
  findRunForCommit,
  getDefaultConfig,
  getRunStatus,
  uploadFiles,
} from '../services/github.service';
import { startPolling } from '../services/poller.service';
import { validateBatch } from '../utils/fileValidator';
import { durationSeconds, formatKSTShort } from '../utils/time';
import { loadConfig, saveConfig, saveHistory } from './config.ipc';

function randomId(): string {
  return `dep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getMainWindow(): BrowserWindow | null {
  const wins = BrowserWindow.getAllWindows();
  return wins.length > 0 ? wins[0] : null;
}

export function registerDeployIpc(): void {
  ipcMain.handle(
    IPC.DEPLOY_START,
    async (
      _evt,
      payload: { files: FileInputPayload[]; soundFiles?: FileInputPayload[] },
    ): Promise<DeployStartResult> => {
      const files = payload.files ?? [];
      const soundFiles = payload.soundFiles ?? [];
      if (files.length === 0 && soundFiles.length === 0) {
        return {
          runId: null,
          commitSha: '',
          error: '선택된 파일이 없어요.',
        };
      }

      const token = await loadToken();
      if (!token) {
        return {
          runId: null,
          commitSha: '',
          error: 'GitHub 연결이 끊겼어요. 설정에서 토큰을 다시 확인해 주세요.',
        };
      }

      if (files.length > 0) {
        const validation = await validateBatch(files.map((f) => f.path));
        if (!validation.valid) {
          return {
            runId: null,
            commitSha: '',
            error: validation.errorMessage ?? '파일을 확인해 주세요.',
          };
        }
      }

      if (soundFiles.length > 0) {
        const soundValidation = await validateBatch(soundFiles.map((f) => f.path), 'sound');
        if (!soundValidation.valid) {
          return {
            runId: null,
            commitSha: '',
            error: soundValidation.errorMessage ?? '사운드 파일을 확인해 주세요.',
          };
        }
      }

      const cfg = getDefaultConfig();
      const win = getMainWindow();
      const startedAt = new Date().toISOString();
      const totalFiles = files.length + soundFiles.length;

      const handleUploadError = (err: unknown): DeployStartResult => {
        const anyErr = err as { status?: number; message?: string };
        let msg = '업로드 중 오류가 발생했어요.';
        if (anyErr?.status === 401) {
          msg = 'GitHub 연결이 끊겼어요. 설정에서 토큰을 다시 확인해 주세요.';
        } else if (anyErr?.status === 403) {
          msg = "파일을 올릴 권한이 없어요. 토큰에 'repo'와 'workflow' 권한이 있는지 확인해 주세요.";
        } else if (anyErr?.message?.includes('ENOTFOUND') || anyErr?.message?.includes('ECONN')) {
          msg = '인터넷 연결을 확인해 주세요.';
        } else if (anyErr?.message) {
          msg = anyErr.message;
        }
        return { runId: null, commitSha: '', error: msg };
      };

      // Upload image files
      let commitSha = '';
      if (files.length > 0) {
        try {
          const result = await uploadFiles(
            token,
            cfg,
            files.map((f) => ({ path: f.path, name: path.basename(f.name) })),
            (idx, _total, name) => {
              const pct = Math.round((idx / totalFiles) * 30);
              if (win && !win.isDestroyed()) {
                win.webContents.send(IPC.EVENT_DEPLOY_PROGRESS, {
                  step: 'uploading',
                  percent: pct,
                  message: `이미지 전송 중… (${idx}/${files.length}) ${name}`,
                });
              }
            },
          );
          commitSha = result.commitSha;
        } catch (err) {
          return handleUploadError(err);
        }
      }

      // Upload sound files
      if (soundFiles.length > 0) {
        try {
          const result = await uploadFiles(
            token,
            cfg,
            soundFiles.map((f) => ({ path: f.path, name: path.basename(f.name) })),
            (idx, _total, name) => {
              const pct = Math.round(((files.length + idx) / totalFiles) * 30);
              if (win && !win.isDestroyed()) {
                win.webContents.send(IPC.EVENT_DEPLOY_PROGRESS, {
                  step: 'uploading',
                  percent: pct,
                  message: `사운드 전송 중… (${idx}/${soundFiles.length}) ${name}`,
                });
              }
            },
            cfg.soundPath,
          );
          commitSha = result.commitSha;
        } catch (err) {
          return handleUploadError(err);
        }
      }

      // Signal upload done
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPC.EVENT_DEPLOY_PROGRESS, {
          step: 'uploading',
          percent: 30,
          message: '파일 전송 완료',
        });
      }

      // Try to find the workflow run, then kick off polling
      const runId = await findRunForCommit(token, cfg, commitSha);

      if (win) {
        const key = `deploy-${commitSha}`;
        const recordId = randomId();
        const imageNames = files.map((f) => path.basename(f.name));
        const soundNames = soundFiles.map((f) => path.basename(f.name));
        const allFileNames = [...imageNames, ...soundNames];
        startPolling({
          key,
          window: win,
          token,
          cfg,
          commitSha,
          initialRunId: runId,
          pagesUrl: PAGES_URL,
          onDone: async (result) => {
            const timestamp = new Date().toISOString();
            const status: DeploymentRecord['status'] = result.timeoutReached
              ? 'timeout'
              : result.success
                ? 'success'
                : 'failed';
            const record: DeploymentRecord = {
              id: recordId,
              timestamp,
              files: allFileNames,
              commitSha,
              workflowRunId: result.runId,
              status,
              durationSeconds: durationSeconds(startedAt, timestamp),
              pagesUrl: result.success ? PAGES_URL : undefined,
            };
            try {
              await saveHistory(record);
            } catch {
              // ignore history write error
            }
            try {
              await saveConfig({
                lastDeployment: {
                  timestamp,
                  status,
                  pagesUrl: result.success ? PAGES_URL : '',
                  commitSha,
                },
              });
            } catch {
              // ignore
            }

            // OS notification
            try {
              if (Notification.isSupported()) {
                const parts: string[] = [];
                if (imageNames.length > 0) parts.push(`이미지 ${imageNames.length}개`);
                if (soundNames.length > 0) parts.push(`사운드 ${soundNames.length}개`);
                const n = new Notification({
                  title: result.success ? '배포 완료!' : '배포 실패',
                  body: result.success
                    ? `${formatKSTShort(timestamp)} · ${parts.join(', ')} 업로드 완료`
                    : result.timeoutReached
                      ? '시간이 너무 오래 걸려 확인이 필요해요.'
                      : '게임 빌드에 실패했어요. 이전 버전은 유지됩니다.',
                  silent: false,
                });
                n.show();
              }
            } catch {
              // ignore notification errors
            }
          },
        });
      }

      return { runId, commitSha };
    },
  );

  ipcMain.handle(
    IPC.DEPLOY_POLL,
    async (_evt, runId: number): Promise<DeployPollResult> => {
      const token = await loadToken();
      if (!token || !runId) {
        return {
          status: 'not_found',
          conclusion: null,
          currentStep: '',
        };
      }
      const cfg = getDefaultConfig();
      const run = await getRunStatus(token, cfg, runId);
      return {
        status: run.status,
        conclusion: run.conclusion,
        currentStep: run.currentStep,
        pagesUrl: run.conclusion === 'success' ? PAGES_URL : undefined,
      };
    },
  );
}

/**
 * Read a file from disk and return a base64 data URL suitable for <img src>.
 * Used by renderer for thumbnails (renderer can't access arbitrary FS in sandbox).
 */
export function registerFileReadIpc(): void {
  ipcMain.handle(
    IPC.FILE_READ_PREVIEW,
    async (
      _evt,
      filePath: string,
    ): Promise<{ dataUrl: string; size: number; name: string } | { error: string }> => {
      try {
        const stat = await fs.stat(filePath);
        // Cap preview size to avoid huge base64 strings for huge files; for thumbnails we accept full size up to 10MB.
        const MAX_PREVIEW = 10 * 1024 * 1024;
        if (stat.size > MAX_PREVIEW) {
          // For large files, still return a placeholder-ish (empty) URL so UI shows name/size only
          return { dataUrl: '', size: stat.size, name: path.basename(filePath) };
        }
        const buf = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mime =
          ext === '.png' ? 'image/png'
          : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
          : ext === '.webp' ? 'image/webp'
          : ext === '.svg' ? 'image/svg+xml'
          : ext === '.gif' ? 'image/gif'
          : 'application/octet-stream';
        const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
        return { dataUrl, size: stat.size, name: path.basename(filePath) };
      } catch (err) {
        return { error: (err as Error).message };
      }
    },
  );
}
