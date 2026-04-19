// Global type declarations for the renderer.
// The full ElectronAPI shape is declared inline here (rather than imported from
// the main process source) to keep the renderer tsconfig self-contained.

import type {
  AppConfig,
  DeploymentRecord,
  DeployPollResult,
  DeployProgress,
  DeployStartResult,
  DialogOpenFilesResult,
  FileInputPayload,
  LoadTokenResult,
  SaveTokenResult,
  ValidateTokenResult,
} from '../shared/types';

type Unsubscribe = () => void;

export interface ElectronAPI {
  auth: {
    validate: (token: string) => Promise<ValidateTokenResult>;
    saveToken: (token: string) => Promise<SaveTokenResult>;
    loadToken: () => Promise<LoadTokenResult>;
    deleteToken: () => Promise<{ success: boolean }>;
  };
  deploy: {
    start: (files: FileInputPayload[]) => Promise<DeployStartResult>;
    poll: (runId: number) => Promise<DeployPollResult>;
    onProgress: (cb: (p: DeployProgress) => void) => Unsubscribe;
    onComplete: (
      cb: (r: {
        status: 'success' | 'failed';
        pagesUrl: string;
        timestamp: string;
        timeoutReached?: boolean;
        htmlUrl?: string | null;
      }) => void,
    ) => Unsubscribe;
  };
  config: {
    load: () => Promise<AppConfig>;
    save: (cfg: Partial<AppConfig>) => Promise<{ success: boolean }>;
  };
  history: {
    load: () => Promise<DeploymentRecord[]>;
    save: (rec: DeploymentRecord) => Promise<DeploymentRecord[]>;
  };
  dialog: {
    openFiles: () => Promise<DialogOpenFilesResult>;
  };
  file: {
    readPreview: (
      filePath: string,
    ) => Promise<
      { dataUrl: string; size: number; name: string } | { error: string }
    >;
  };
  shell: {
    openExternal: (url: string) => Promise<{ success: boolean }>;
  };
  app: {
    version: () => Promise<string>;
    checkUpdate: () => Promise<{ ok: boolean; error?: string }>;
    onUpdateAvailable: (cb: (p: { version: string }) => void) => Unsubscribe;
    onUpdateDownloaded: (cb: (p: { version: string }) => void) => Unsubscribe;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
