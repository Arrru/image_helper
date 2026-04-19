import React, { useState } from 'react';
import type { DeploymentRecord } from '../../shared/types';
import { StatusBadge } from './StatusBadge';

interface Props {
  history: DeploymentRecord[];
}

function fmtKST(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const mo = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const da = String(kst.getUTCDate()).padStart(2, '0');
  const h = kst.getUTCHours();
  const mi = String(kst.getUTCMinutes()).padStart(2, '0');
  const ap = h < 12 ? '오전' : '오후';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${y}-${mo}-${da} ${ap} ${h12}:${mi}`;
}

function fmtDuration(s: number): string {
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m}분` : `${m}분 ${rem}초`;
}

export function HistoryPanel({ history }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-background/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="w-4 h-4 text-text-secondary"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" />
          </svg>
          <span className="text-sm font-medium">배포 이력</span>
          <span className="text-xs text-text-secondary">· 최근 {history.length}건</span>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`w-4 h-4 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-border">
          {history.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-text-secondary">
              아직 배포 이력이 없어요.
            </div>
          ) : (
            <ul>
              {history.map((h) => (
                <li
                  key={h.id}
                  className="px-5 py-3 border-b border-border/60 last:border-b-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.status} />
                      <span className="text-sm text-text-primary">
                        {fmtKST(h.timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary truncate">
                      {h.files.length}개 파일 · {fmtDuration(h.durationSeconds)} 소요
                    </p>
                  </div>
                  {h.pagesUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        void window.electronAPI.shell.openExternal(h.pagesUrl!)
                      }
                      className="text-xs text-primary hover:text-primary-hover whitespace-nowrap"
                    >
                      열기 →
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;
