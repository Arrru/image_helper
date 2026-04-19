import { Octokit } from '@octokit/rest';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_CONFIG,
  type GitHubConfig,
  type ValidateTokenResult,
} from '../../shared/types';
import { formatKSTShort } from '../utils/time';

/**
 * Thin wrapper around Octokit specialized for this deployer's needs.
 */

export function createClient(token: string): Octokit {
  return new Octokit({
    auth: token,
    userAgent: 'godot-deployer/1.0.0',
  });
}

export async function validateToken(token: string): Promise<ValidateTokenResult> {
  if (!token || token.trim().length === 0) {
    return {
      valid: false,
      username: null,
      scopes: [],
      error: '토큰을 입력해 주세요.',
    };
  }
  try {
    const octokit = createClient(token.trim());
    const res = await octokit.request('GET /user');
    const scopeHeader = res.headers['x-oauth-scopes'] as string | undefined;
    const scopes = (scopeHeader ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Accept fine-grained tokens (empty scope list) OR classic with repo+workflow.
    const hasClassicRepo =
      scopes.length === 0 ||
      (scopes.some((s) => s === 'repo' || s.startsWith('repo:') || s === 'public_repo') &&
        scopes.some((s) => s === 'workflow' || s.startsWith('workflow:')));

    if (scopes.length > 0 && !hasClassicRepo) {
      return {
        valid: false,
        username: (res.data as { login?: string }).login ?? null,
        scopes,
        error:
          "파일을 올릴 권한이 없어요. 토큰에 'repo'와 'workflow' 권한이 있는지 확인해 주세요.",
      };
    }

    return {
      valid: true,
      username: (res.data as { login?: string }).login ?? null,
      scopes,
    };
  } catch (err) {
    return parseAuthError(err);
  }
}

function parseAuthError(err: unknown): ValidateTokenResult {
  const anyErr = err as { status?: number; message?: string; code?: string };
  const status = anyErr?.status;
  if (status === 401) {
    return {
      valid: false,
      username: null,
      scopes: [],
      error:
        'GitHub 연결이 끊겼어요. 설정에서 토큰을 다시 확인해 주세요.',
    };
  }
  if (status === 403) {
    return {
      valid: false,
      username: null,
      scopes: [],
      error:
        "파일을 올릴 권한이 없어요. 토큰에 'repo'와 'workflow' 권한이 있는지 확인해 주세요.",
    };
  }
  if (anyErr?.code === 'ENOTFOUND' || anyErr?.code === 'ECONNREFUSED') {
    return {
      valid: false,
      username: null,
      scopes: [],
      error: '인터넷 연결을 확인해 주세요.',
    };
  }
  return {
    valid: false,
    username: null,
    scopes: [],
    error: anyErr?.message || '토큰을 확인하는 중에 오류가 발생했어요.',
  };
}

/**
 * Upload (create or update) a single file to the GitHub repo using Contents API.
 * Automatically looks up existing SHA if the file exists.
 */
export async function uploadFile(
  octokit: Octokit,
  cfg: GitHubConfig,
  localPath: string,
  remoteName: string,
  message: string,
): Promise<string> {
  const contentBuf = await fs.readFile(localPath);
  const contentB64 = contentBuf.toString('base64');
  const remotePath = `${cfg.imagePath}/${remoteName}`;

  let sha: string | undefined;
  try {
    const existing = await octokit.repos.getContent({
      owner: cfg.owner,
      repo: cfg.repo,
      path: remotePath,
      ref: cfg.branch,
    });
    if (Array.isArray(existing.data)) {
      // path resolved to a dir — unexpected, skip sha
    } else if ('sha' in existing.data) {
      sha = existing.data.sha;
    }
  } catch (err) {
    const anyErr = err as { status?: number };
    if (anyErr?.status !== 404) throw err;
    // 404 — new file, no sha needed
  }

  const res = await octokit.repos.createOrUpdateFileContents({
    owner: cfg.owner,
    repo: cfg.repo,
    path: remotePath,
    message,
    content: contentB64,
    branch: cfg.branch,
    sha,
  });

  return res.data.commit.sha ?? '';
}

export interface UploadBatchResult {
  commitSha: string;
  uploadedCount: number;
}

/**
 * Upload multiple files sequentially. Returns the last commit SHA.
 * Progress callback receives index (1-based) and total.
 */
export async function uploadFiles(
  token: string,
  cfg: GitHubConfig,
  files: Array<{ path: string; name: string }>,
  onProgress: (idx: number, total: number, name: string) => void,
): Promise<UploadBatchResult> {
  const octokit = createClient(token);
  const msg = `[Deploy] 이미지 업데이트 - ${formatKSTShort(new Date())}`;
  let lastSha = '';
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    onProgress(i + 1, files.length, f.name);
    lastSha = await uploadFile(octokit, cfg, f.path, f.name, msg);
  }
  return { commitSha: lastSha, uploadedCount: files.length };
}

/**
 * Find the most recent workflow run associated with a commit SHA.
 */
export async function findRunForCommit(
  token: string,
  cfg: GitHubConfig,
  commitSha: string,
): Promise<number | null> {
  const octokit = createClient(token);
  try {
    const res = await octokit.actions.listWorkflowRunsForRepo({
      owner: cfg.owner,
      repo: cfg.repo,
      per_page: 10,
      head_sha: commitSha,
    });
    const runs = res.data.workflow_runs;
    if (runs.length === 0) return null;
    // Most recent first
    runs.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return runs[0].id;
  } catch {
    return null;
  }
}

export interface RunStatus {
  status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'not_found';
  conclusion: 'success' | 'failure' | 'cancelled' | 'timed_out' | null;
  currentStep: string;
  htmlUrl: string | null;
}

export async function getRunStatus(
  token: string,
  cfg: GitHubConfig,
  runId: number,
): Promise<RunStatus> {
  const octokit = createClient(token);
  try {
    const res = await octokit.actions.getWorkflowRun({
      owner: cfg.owner,
      repo: cfg.repo,
      run_id: runId,
    });
    const status = (res.data.status ?? 'queued') as RunStatus['status'];
    const conclusion = (res.data.conclusion ?? null) as RunStatus['conclusion'];

    // Try to fetch the in-progress job step name
    let currentStep = '';
    try {
      const jobs = await octokit.actions.listJobsForWorkflowRun({
        owner: cfg.owner,
        repo: cfg.repo,
        run_id: runId,
        per_page: 10,
      });
      const job =
        jobs.data.jobs.find((j) => j.status === 'in_progress') ??
        jobs.data.jobs[jobs.data.jobs.length - 1];
      if (job) {
        const step =
          job.steps?.find((s) => s.status === 'in_progress') ??
          job.steps?.slice().reverse().find((s) => s.status === 'completed');
        currentStep = step?.name ?? job.name;
      }
    } catch {
      // non-fatal
    }

    return {
      status,
      conclusion,
      currentStep,
      htmlUrl: res.data.html_url,
    };
  } catch (err) {
    const anyErr = err as { status?: number };
    if (anyErr?.status === 404) {
      return { status: 'not_found', conclusion: null, currentStep: '', htmlUrl: null };
    }
    throw err;
  }
}

export function getDefaultConfig(): GitHubConfig {
  return { ...DEFAULT_CONFIG };
}

/**
 * Utility for callers who already have a file path and want the remote name.
 */
export function remoteNameFor(p: string): string {
  return path.basename(p);
}
