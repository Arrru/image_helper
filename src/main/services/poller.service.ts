import { BrowserWindow } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import type { GitHubConfig } from '../../shared/types';
import { findRunForCommit, getRunStatus, type RunStatus } from './github.service';

const POLL_INTERVAL_MS = 10_000;
const MAX_ATTEMPTS = 60; // 10 minutes

interface PollerTask {
  timer: NodeJS.Timeout | null;
  cancelled: boolean;
}

const activeTasks = new Map<string, PollerTask>();

function stepFromRun(run: RunStatus): {
  step: 'uploading' | 'building' | 'deploying' | 'complete' | 'failed';
  percent: number;
  message: string;
} {
  if (run.status === 'completed') {
    if (run.conclusion === 'success') {
      return { step: 'complete', percent: 100, message: '완료!' };
    }
    return { step: 'failed', percent: 100, message: '배포에 실패했어요.' };
  }
  if (run.status === 'queued' || run.status === 'waiting') {
    return { step: 'building', percent: 40, message: '빌드를 준비하고 있어요…' };
  }
  // in_progress
  const lowered = (run.currentStep ?? '').toLowerCase();
  if (lowered.includes('deploy') || lowered.includes('pages')) {
    return { step: 'deploying', percent: 85, message: '웹사이트 배포 중…' };
  }
  if (lowered.includes('export') || lowered.includes('godot')) {
    return { step: 'building', percent: 65, message: '게임 빌드 중…' };
  }
  return { step: 'building', percent: 50, message: '게임 빌드 중…' };
}

/**
 * Start polling the given workflow run. Sends progress events via webContents.
 * Returns a handle (key) that can be used to cancel.
 */
export function startPolling(options: {
  key: string;
  window: BrowserWindow;
  token: string;
  cfg: GitHubConfig;
  commitSha: string;
  initialRunId: number | null;
  pagesUrl: string;
  onDone: (result: {
    success: boolean;
    runId: number | null;
    conclusion: RunStatus['conclusion'];
    timeoutReached: boolean;
    htmlUrl: string | null;
  }) => void;
}): string {
  const {
    key,
    window: win,
    token,
    cfg,
    commitSha,
    initialRunId,
    pagesUrl,
    onDone,
  } = options;

  // Cancel any existing task with the same key
  cancelPolling(key);

  let runId = initialRunId;
  let attempt = 0;
  const task: PollerTask = { timer: null, cancelled: false };
  activeTasks.set(key, task);

  const send = (channel: string, payload: unknown) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  };

  const tick = async () => {
    if (task.cancelled) return;
    attempt += 1;

    try {
      if (!runId) {
        runId = await findRunForCommit(token, cfg, commitSha);
        if (!runId) {
          send(IPC.EVENT_DEPLOY_PROGRESS, {
            step: 'building',
            percent: 30,
            message: '빌드 시작을 기다리는 중…',
          });
          if (attempt >= MAX_ATTEMPTS) {
            finalize(false, null, null, true);
            return;
          }
          return;
        }
      }

      const run = await getRunStatus(token, cfg, runId);
      const p = stepFromRun(run);
      send(IPC.EVENT_DEPLOY_PROGRESS, p);

      if (run.status === 'completed') {
        finalize(run.conclusion === 'success', run.conclusion, run.htmlUrl, false);
        return;
      }

      if (attempt >= MAX_ATTEMPTS) {
        finalize(false, null, run.htmlUrl, true);
      }
    } catch (err) {
      // Transient errors: keep polling until max attempts.
      if (attempt >= MAX_ATTEMPTS) {
        finalize(false, null, null, true);
      }
    }
  };

  const finalize = (
    success: boolean,
    conclusion: RunStatus['conclusion'],
    htmlUrl: string | null,
    timeoutReached: boolean,
  ) => {
    if (task.cancelled) return;
    task.cancelled = true;
    if (task.timer) clearInterval(task.timer);
    activeTasks.delete(key);

    send(IPC.EVENT_DEPLOY_COMPLETE, {
      status: success ? 'success' : 'failed',
      pagesUrl: success ? pagesUrl : '',
      timestamp: new Date().toISOString(),
      timeoutReached,
      htmlUrl,
    });

    onDone({
      success,
      runId,
      conclusion,
      timeoutReached,
      htmlUrl,
    });
  };

  // Fire once immediately for snappy UI, then interval
  void tick();
  task.timer = setInterval(tick, POLL_INTERVAL_MS);
  return key;
}

export function cancelPolling(key: string): void {
  const t = activeTasks.get(key);
  if (!t) return;
  t.cancelled = true;
  if (t.timer) clearInterval(t.timer);
  activeTasks.delete(key);
}

export function cancelAllPolling(): void {
  for (const key of Array.from(activeTasks.keys())) cancelPolling(key);
}
