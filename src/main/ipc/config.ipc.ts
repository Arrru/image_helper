import { app, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { IPC } from '../../shared/ipc-channels';
import {
  DEFAULT_CONFIG,
  type AppConfig,
  type DeploymentRecord,
  PAGES_URL,
} from '../../shared/types';

function userDataDir(): string {
  // Use Electron's userData path; matches description of ~/.config/godot-deployer
  return app.getPath('userData');
}

function configPath(): string {
  return path.join(userDataDir(), 'config.json');
}

function historyPath(): string {
  return path.join(userDataDir(), 'history.json');
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(userDataDir(), { recursive: true });
}

function defaultConfig(): AppConfig {
  return {
    ...DEFAULT_CONFIG,
    lastDeployment: null,
    pagesUrl: PAGES_URL,
  };
}

export async function loadConfig(): Promise<AppConfig> {
  try {
    await ensureDir();
    const raw = await fs.readFile(configPath(), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      ...defaultConfig(),
      ...parsed,
      // Always use hardcoded repo metadata in MVP
      owner: DEFAULT_CONFIG.owner,
      repo: DEFAULT_CONFIG.repo,
      branch: DEFAULT_CONFIG.branch,
      imagePath: DEFAULT_CONFIG.imagePath,
      pagesUrl: PAGES_URL,
    };
  } catch {
    return defaultConfig();
  }
}

export async function saveConfig(cfg: Partial<AppConfig>): Promise<void> {
  await ensureDir();
  const current = await loadConfig();
  const merged: AppConfig = { ...current, ...cfg };
  await fs.writeFile(configPath(), JSON.stringify(merged, null, 2), 'utf-8');
}

const HISTORY_LIMIT = 5;

export async function loadHistory(): Promise<DeploymentRecord[]> {
  try {
    await ensureDir();
    const raw = await fs.readFile(historyPath(), 'utf-8');
    const parsed = JSON.parse(raw) as DeploymentRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export async function saveHistory(record: DeploymentRecord): Promise<DeploymentRecord[]> {
  await ensureDir();
  const existing = await loadHistory();
  // Remove any existing record with same id
  const filtered = existing.filter((r) => r.id !== record.id);
  const next = [record, ...filtered].slice(0, HISTORY_LIMIT);
  await fs.writeFile(historyPath(), JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

export function registerConfigIpc(): void {
  ipcMain.handle(IPC.CONFIG_LOAD, async () => {
    return loadConfig();
  });

  ipcMain.handle(IPC.CONFIG_SAVE, async (_evt, cfg: Partial<AppConfig>) => {
    await saveConfig(cfg);
    return { success: true };
  });

  ipcMain.handle(IPC.HISTORY_LOAD, async () => {
    return loadHistory();
  });

  ipcMain.handle(IPC.HISTORY_SAVE, async (_evt, record: DeploymentRecord) => {
    return saveHistory(record);
  });
}
