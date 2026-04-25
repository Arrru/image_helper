import { create } from 'zustand';
import type {
  AppError,
  DeploymentRecord,
  DeployProgress,
  DeployState,
  SelectedFile,
} from '../../shared/types';

export interface LastDeployment {
  timestamp: string;
  status: string;
  pagesUrl: string;
  commitSha: string;
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  githubUsername: string | null;

  // Deploy flow
  deployState: DeployState;
  selectedFiles: SelectedFile[];
  selectedSoundFiles: SelectedFile[];
  progress: DeployProgress | null;
  lastDeployment: LastDeployment | null;
  history: DeploymentRecord[];
  errorDetail: AppError | null;

  // App info
  appVersion: string;

  // Actions
  setAuthenticated: (v: boolean, username?: string | null) => void;
  setDeployState: (s: DeployState) => void;
  setProgress: (p: DeployProgress | null) => void;
  setLastDeployment: (d: LastDeployment | null) => void;
  setHistory: (h: DeploymentRecord[]) => void;
  setError: (e: AppError | null) => void;
  setAppVersion: (v: string) => void;

  addFiles: (files: SelectedFile[]) => { added: number; skippedDupes: string[] };
  removeFile: (path: string) => void;
  clearFiles: () => void;

  addSoundFiles: (files: SelectedFile[]) => { added: number; skippedDupes: string[] };
  removeSoundFile: (path: string) => void;
  clearSoundFiles: () => void;

  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  githubUsername: null,
  deployState: 'not_configured',
  selectedFiles: [],
  selectedSoundFiles: [],
  progress: null,
  lastDeployment: null,
  history: [],
  errorDetail: null,
  appVersion: '',

  setAuthenticated: (v, username = null) =>
    set({
      isAuthenticated: v,
      githubUsername: username,
      deployState: v
        ? (get().selectedFiles.length > 0 || get().selectedSoundFiles.length > 0 ? 'ready' : 'idle')
        : 'not_configured',
    }),

  setDeployState: (s) => set({ deployState: s }),
  setProgress: (p) => set({ progress: p }),
  setLastDeployment: (d) => set({ lastDeployment: d }),
  setHistory: (h) => set({ history: h }),
  setError: (e) => set({ errorDetail: e }),
  setAppVersion: (v) => set({ appVersion: v }),

  addFiles: (files) => {
    const existing = get().selectedFiles;
    const existingNames = new Set(existing.map((f) => f.name.toLowerCase()));
    const skipped: string[] = [];
    const fresh: SelectedFile[] = [];
    for (const f of files) {
      if (existingNames.has(f.name.toLowerCase())) {
        skipped.push(f.name);
      } else {
        fresh.push(f);
        existingNames.add(f.name.toLowerCase());
      }
    }
    const next = [...existing, ...fresh];
    set({
      selectedFiles: next,
      deployState: get().isAuthenticated && next.length > 0 ? 'ready' : get().deployState,
    });
    return { added: fresh.length, skippedDupes: skipped };
  },

  removeFile: (path) => {
    const next = get().selectedFiles.filter((f) => f.path !== path);
    const hasSounds = get().selectedSoundFiles.length > 0;
    set({
      selectedFiles: next,
      deployState: get().isAuthenticated
        ? next.length > 0 || hasSounds ? 'ready' : 'idle'
        : 'not_configured',
    });
  },

  clearFiles: () => {
    const hasSounds = get().selectedSoundFiles.length > 0;
    set({
      selectedFiles: [],
      deployState: get().isAuthenticated
        ? hasSounds ? 'ready' : 'idle'
        : 'not_configured',
    });
  },

  addSoundFiles: (files) => {
    const existing = get().selectedSoundFiles;
    const existingNames = new Set(existing.map((f) => f.name.toLowerCase()));
    const skipped: string[] = [];
    const fresh: SelectedFile[] = [];
    for (const f of files) {
      if (existingNames.has(f.name.toLowerCase())) {
        skipped.push(f.name);
      } else {
        fresh.push(f);
        existingNames.add(f.name.toLowerCase());
      }
    }
    const next = [...existing, ...fresh];
    set({
      selectedSoundFiles: next,
      deployState: get().isAuthenticated && next.length > 0 ? 'ready' : get().deployState,
    });
    return { added: fresh.length, skippedDupes: skipped };
  },

  removeSoundFile: (path) => {
    const next = get().selectedSoundFiles.filter((f) => f.path !== path);
    const hasImages = get().selectedFiles.length > 0;
    set({
      selectedSoundFiles: next,
      deployState: get().isAuthenticated
        ? hasImages || next.length > 0 ? 'ready' : 'idle'
        : 'not_configured',
    });
  },

  clearSoundFiles: () => {
    const hasImages = get().selectedFiles.length > 0;
    set({
      selectedSoundFiles: [],
      deployState: get().isAuthenticated
        ? hasImages ? 'ready' : 'idle'
        : 'not_configured',
    });
  },

  reset: () =>
    set({
      selectedFiles: [],
      selectedSoundFiles: [],
      progress: null,
      errorDetail: null,
      deployState: get().isAuthenticated ? 'idle' : 'not_configured',
    }),
}));
