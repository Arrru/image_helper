import React from 'react';
import type { SelectedFile } from '../../shared/types';

interface Props {
  files: SelectedFile[];
  onRemove: (path: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function FileList({ files, onRemove }: Props) {
  if (files.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-text-primary">
          선택된 파일 · {files.length}개
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {files.map((f) => (
          <div
            key={f.path}
            className="group relative bg-white rounded-card border border-border p-3 flex items-center gap-3 hover:shadow-soft transition-shadow"
          >
            <div className="w-14 h-14 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {f.preview ? (
                <img
                  src={f.preview}
                  alt={f.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-6 h-6 text-text-secondary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7a2 2 0 012-2h3l2-2h4l2 2h3a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                  />
                  <circle cx="12" cy="12" r="3.5" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm text-text-primary truncate"
                title={f.name}
              >
                {f.name}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {formatSize(f.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(f.path)}
              className="w-7 h-7 rounded-full text-text-secondary hover:bg-error/10 hover:text-error transition-colors flex-shrink-0 flex items-center justify-center"
              aria-label="제거"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FileList;
