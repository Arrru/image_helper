// Shared types between main and renderer processes

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  imagePath: string;
  soundPath: string;
}

export interface SelectedFile {
  name: string;
  path: string;
  size: number;
  preview: string; // base64 data URL
}

export interface DeployProgress {
  step: 'uploading' | 'building' | 'deploying' | 'complete' | 'failed';
  percent: number;
  message: string;
}

export interface DeploymentRecord {
  id: string;
  timestamp: string; // ISO string
  files: string[];
  commitSha: string;
  workflowRunId: number | null;
  status: 'success' | 'failed' | 'timeout' | 'in_progress';
  durationSeconds: number;
  pagesUrl?: string;
}

export interface AppConfig extends GitHubConfig {
  lastDeployment: {
    timestamp: string;
    status: string;
    pagesUrl: string;
    commitSha: string;
  } | null;
  pagesUrl: string;
}

export interface ValidateTokenResult {
  valid: boolean;
  username: string | null;
  scopes: string[];
  error?: string;
}

export interface SaveTokenResult {
  success: boolean;
  username: string | null;
  error?: string;
}

export interface LoadTokenResult {
  token: string | null;
  username: string | null;
}

export interface DeployStartResult {
  runId: number | null;
  commitSha: string;
  error?: string;
}

export interface DeployPollResult {
  status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'not_found';
  conclusion: 'success' | 'failure' | 'cancelled' | 'timed_out' | null;
  currentStep: string;
  pagesUrl?: string;
}

export interface DialogOpenFilesResult {
  paths: string[];
  canceled: boolean;
}

export interface FileInputPayload {
  name: string;
  path: string;
}

export type DeployState =
  | 'not_configured'
  | 'idle'
  | 'ready'
  | 'uploading'
  | 'building'
  | 'success'
  | 'failed';

export interface AppError {
  title: string;
  message: string;
  hint: string;
}

export interface RemoteFile {
  name: string;
  path: string; // full repo path e.g. assets/images/foo.png
  sha: string;
  size: number;
}

export interface ListRemoteFilesResult {
  images: RemoteFile[];
  sounds: RemoteFile[];
  error?: string;
}

export interface DeleteRemoteFilesResult {
  success: boolean;
  deletedCount: number;
  error?: string;
}

export const DEFAULT_CONFIG: GitHubConfig = {
  owner: 'Arrru',
  repo: 'dosa',
  branch: 'main',
  imagePath: 'assets/images',
  soundPath: 'assets/sounds',
};

export const PAGES_URL = 'https://arrru.github.io/dosa/';

export const KEYTAR_SERVICE = 'godot-deployer';
export const KEYTAR_ACCOUNT = 'github-pat';

export const MAX_FILES = 20;
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB
export const ALLOWED_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];
export const ALLOWED_SOUND_EXT = ['.mp3', '.ogg', '.wav', '.flac', '.opus', '.aac'];
export const MAX_SOUND_FILES = 20;
