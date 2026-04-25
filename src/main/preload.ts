import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc-channels';
import type {
  AppConfig,
  DeleteRemoteFilesResult,
  DeploymentRecord,
  DeployPollResult,
  DeployProgress,
  DeployStartResult,
  DialogOpenFilesResult,
  FileInputPayload,
  ListRemoteFilesResult,
  LoadTokenResult,
  SaveTokenResult,
  ValidateTokenResult,
} from '../shared/types';

type Listener<T> = (payload: T) => void;

// ipcRenderer has no direct unsubscribe for a single fn without reference; we pass the
// wrapped listener back so the renderer can remove it.
function on<T>(channel: string, listener: Listener<T>): () => void {
  const handler = (_evt: unknown, payload: T) => listener(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const api = {
  auth: {
    validate: (token: string): Promise<ValidateTokenResult> =>
      ipcRenderer.invoke(IPC.AUTH_VALIDATE, token),
    saveToken: (token: string): Promise<SaveTokenResult> =>
      ipcRenderer.invoke(IPC.AUTH_SAVE_TOKEN, token),
    loadToken: (): Promise<LoadTokenResult> =>
      ipcRenderer.invoke(IPC.AUTH_LOAD_TOKEN),
    deleteToken: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke(IPC.AUTH_DELETE_TOKEN),
  },
  deploy: {
    start: (files: FileInputPayload[], soundFiles?: FileInputPayload[]): Promise<DeployStartResult> =>
      ipcRenderer.invoke(IPC.DEPLOY_START, { files, soundFiles }),
    poll: (runId: number): Promise<DeployPollResult> =>
      ipcRenderer.invoke(IPC.DEPLOY_POLL, runId),
    onProgress: (cb: Listener<DeployProgress>) =>
      on<DeployProgress>(IPC.EVENT_DEPLOY_PROGRESS, cb),
    onComplete: (
      cb: Listener<{
        status: 'success' | 'failed';
        pagesUrl: string;
        timestamp: string;
        timeoutReached?: boolean;
        htmlUrl?: string | null;
      }>,
    ) => on(IPC.EVENT_DEPLOY_COMPLETE, cb),
  },
  config: {
    load: (): Promise<AppConfig> => ipcRenderer.invoke(IPC.CONFIG_LOAD),
    save: (cfg: Partial<AppConfig>): Promise<{ success: boolean }> =>
      ipcRenderer.invoke(IPC.CONFIG_SAVE, cfg),
  },
  history: {
    load: (): Promise<DeploymentRecord[]> =>
      ipcRenderer.invoke(IPC.HISTORY_LOAD),
    save: (rec: DeploymentRecord): Promise<DeploymentRecord[]> =>
      ipcRenderer.invoke(IPC.HISTORY_SAVE, rec),
  },
  dialog: {
    openFiles: (): Promise<DialogOpenFilesResult> =>
      ipcRenderer.invoke(IPC.DIALOG_OPEN_FILES),
    openSoundFiles: (): Promise<DialogOpenFilesResult> =>
      ipcRenderer.invoke(IPC.DIALOG_OPEN_SOUNDS),
  },
  file: {
    readPreview: (
      filePath: string,
    ): Promise<
      { dataUrl: string; size: number; name: string } | { error: string }
    > => ipcRenderer.invoke(IPC.FILE_READ_PREVIEW, filePath),
  },
  files: {
    list: (): Promise<ListRemoteFilesResult> =>
      ipcRenderer.invoke(IPC.FILES_LIST),
    delete: (items: { path: string; sha: string }[]): Promise<DeleteRemoteFilesResult> =>
      ipcRenderer.invoke(IPC.FILES_DELETE, items),
  },
  shell: {
    openExternal: (url: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke(IPC.SHELL_OPEN, url),
  },
  app: {
    version: (): Promise<string> => ipcRenderer.invoke(IPC.APP_VERSION),
    checkUpdate: (): Promise<{ ok: boolean; error?: string }> =>
      ipcRenderer.invoke(IPC.APP_CHECK_UPDATE),
    onUpdateAvailable: (cb: Listener<{ version: string }>) =>
      on(IPC.EVENT_UPDATE_AVAILABLE, cb),
    onUpdateDownloaded: (cb: Listener<{ version: string }>) =>
      on(IPC.EVENT_UPDATE_DOWNLOADED, cb),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
