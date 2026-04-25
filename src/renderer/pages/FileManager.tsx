import React, { useCallback, useEffect, useState } from 'react';
import type { RemoteFile } from '../../shared/types';

interface Props {
  onClose: () => void;
}

type Tab = 'images' | 'sounds';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileManager({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('images');
  const [images, setImages] = useState<RemoteFile[]>([]);
  const [sounds, setSounds] = useState<RemoteFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'info' | 'error' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected(new Set());
    try {
      const result = await window.electronAPI.files.list();
      if (result.error) {
        setError(result.error);
      } else {
        setImages(result.images);
        setSounds(result.sounds);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  // Reset selection when switching tabs
  useEffect(() => {
    setSelected(new Set());
  }, [tab]);

  const currentFiles = tab === 'images' ? images : sounds;

  const toggleSelect = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === currentFiles.length && currentFiles.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(currentFiles.map((f) => f.path)));
    }
  };

  const allSelected = currentFiles.length > 0 && selected.size === currentFiles.length;

  const handleDelete = async () => {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      `선택한 ${selected.size}개 파일을 GitHub에서 삭제할까요? 이 작업은 되돌릴 수 없어요.`,
    );
    if (!confirmed) return;

    const items = currentFiles
      .filter((f) => selected.has(f.path))
      .map((f) => ({ path: f.path, sha: f.sha }));

    setDeleting(true);
    try {
      const result = await window.electronAPI.files.delete(items);
      if (result.error && !result.success) {
        showToast(result.error, 'error');
      } else if (result.error) {
        showToast(
          `${result.deletedCount}개 삭제 완료, 일부 오류: ${result.error}`,
          'error',
        );
      } else {
        showToast(`${result.deletedCount}개 파일을 삭제했어요.`);
      }
      await fetchFiles();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg card p-8 fade-in flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">파일 관리</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost w-8 h-8"
            aria-label="닫기"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-4 bg-background rounded-button p-1">
          <button
            type="button"
            onClick={() => setTab('images')}
            className={[
              'flex-1 py-1.5 text-sm rounded-button transition-colors',
              tab === 'images'
                ? 'bg-white shadow-soft text-primary font-medium'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            이미지 파일
            {images.length > 0 && (
              <span className="ml-1.5 text-xs opacity-60">({images.length})</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('sounds')}
            className={[
              'flex-1 py-1.5 text-sm rounded-button transition-colors',
              tab === 'sounds'
                ? 'bg-white shadow-soft text-primary font-medium'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            사운드 파일
            {sounds.length > 0 && (
              <span className="ml-1.5 text-xs opacity-60">({sounds.length})</span>
            )}
          </button>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <svg
                  className="w-8 h-8 text-primary animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span className="text-sm text-text-secondary">파일 목록을 불러오는 중…</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-error text-center">{error}</p>
              <button
                type="button"
                onClick={() => void fetchFiles()}
                className="text-xs text-primary hover:underline"
              >
                다시 시도
              </button>
            </div>
          ) : currentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-10 h-10 text-text-secondary/40"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                />
              </svg>
              <p className="text-sm text-text-secondary">
                {tab === 'images' ? '이미지 파일이 없어요.' : '사운드 파일이 없어요.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {currentFiles.map((file) => (
                <li key={file.path}>
                  <label className="flex items-center gap-3 px-3 py-2.5 rounded-button hover:bg-background cursor-pointer transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{file.name}</p>
                      <p className="text-xs text-text-secondary">{formatSize(file.size)}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selected.has(file.path)}
                      onChange={() => toggleSelect(file.path)}
                      className="w-4 h-4 accent-primary cursor-pointer shrink-0"
                    />
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && currentFiles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {allSelected ? '전체 해제' : '전체 선택'}
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={selected.size === 0 || deleting}
              className={[
                'px-4 py-2 rounded-button text-sm font-medium transition-colors',
                selected.size === 0 || deleting
                  ? 'bg-background text-text-secondary cursor-not-allowed'
                  : 'bg-error/10 text-error hover:bg-error/20',
              ].join(' ')}
            >
              {deleting
                ? '삭제 중…'
                : selected.size > 0
                  ? `선택 삭제 (${selected.size}개)`
                  : '선택 삭제'}
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in pointer-events-none">
          <div
            className={[
              'px-4 py-3 rounded-button shadow-soft-lg text-sm border',
              toast.type === 'error'
                ? 'bg-error/10 border-error/40 text-error'
                : 'bg-white border-border text-text-primary',
            ].join(' ')}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileManager;
