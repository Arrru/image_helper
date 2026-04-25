import React, { useState } from 'react';
import DeployButton from '../components/DeployButton';
import FileDropZone from '../components/FileDropZone';
import FileList from '../components/FileList';
import HistoryPanel from '../components/HistoryPanel';
import StatusBadge from '../components/StatusBadge';
import { useDeployment } from '../hooks/useDeployment';
import { useAppStore } from '../store/appStore';
import type { SelectedFile } from '../../shared/types';
import { MAX_FILES, MAX_SOUND_FILES } from '../../shared/types';

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
  return `${y}-${mo}-${da} ${ap} ${h12}:${mi} (KST)`;
}

interface Props {
  onOpenSettings: () => void;
}

export function Main({ onOpenSettings }: Props) {
  const {
    selectedFiles,
    addFiles,
    removeFile,
    clearFiles,
    selectedSoundFiles,
    addSoundFiles,
    removeSoundFile,
    clearSoundFiles,
    lastDeployment,
    history,
    deployState,
  } = useAppStore();
  const { startDeploy } = useDeployment();
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'error' | 'warning'>('info');

  const showToast = (msg: string, type: 'info' | 'error' | 'warning' = 'info') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 4000);
  };

  const handleFiles = (incoming: SelectedFile[]) => {
    if (selectedFiles.length + incoming.length > MAX_FILES) {
      showToast(`한 번에 최대 ${MAX_FILES}개 파일까지 올릴 수 있어요.`, 'warning');
      return;
    }
    const invalidNames = incoming.filter((f) => !/^[A-Za-z0-9._-]+$/.test(f.name));
    if (invalidNames.length > 0) {
      showToast(
        '파일 이름에는 영문, 숫자, 하이픈(-), 밑줄(_)만 사용해 주세요.',
        'error',
      );
      return;
    }
    const { added, skippedDupes } = addFiles(incoming);
    if (skippedDupes.length > 0) {
      showToast(
        `이미 같은 이름의 파일이 있어서 건너뛰었어요: ${skippedDupes.join(', ')}`,
        'warning',
      );
    } else if (added > 0) {
      showToast(`${added}개 파일을 추가했어요.`);
    }
  };

  const handleSoundFiles = (incoming: SelectedFile[]) => {
    if (selectedSoundFiles.length + incoming.length > MAX_SOUND_FILES) {
      showToast(`한 번에 최대 ${MAX_SOUND_FILES}개 사운드 파일까지 올릴 수 있어요.`, 'warning');
      return;
    }
    const invalidNames = incoming.filter((f) => !/^[A-Za-z0-9._-]+$/.test(f.name));
    if (invalidNames.length > 0) {
      showToast('파일 이름에는 영문, 숫자, 하이픈(-), 밑줄(_)만 사용해 주세요.', 'error');
      return;
    }
    const { added, skippedDupes } = addSoundFiles(incoming);
    if (skippedDupes.length > 0) {
      showToast(`이미 같은 이름의 파일이 있어서 건너뛰었어요: ${skippedDupes.join(', ')}`, 'warning');
    } else if (added > 0) {
      showToast(`${added}개 사운드 파일을 추가했어요.`);
    }
  };

  const onDeployClick = async () => {
    await startDeploy();
  };

  const pagesUrl = lastDeployment?.pagesUrl || 'https://arrru.github.io/dosa/';

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-4 border-b border-border bg-surface/70 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-text-primary">배포 도우미</h1>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="btn-ghost"
            aria-label="설정"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06A2 2 0 114.22 16.97l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 min-h-0 flex flex-col px-6">
        {/* Scrollable file sections */}
        <div className="flex-1 overflow-auto py-6">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Image section */}
            <div>
              <h2 className="text-sm font-medium text-text-secondary mb-2">이미지 파일</h2>
              <FileDropZone onFiles={handleFiles} onError={(m) => showToast(m, 'error')} compact fileType="image" />
              {selectedFiles.length > 0 && (
                <div className="space-y-3 mt-3">
                  <FileList files={selectedFiles} onRemove={removeFile} />
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={clearFiles} className="text-sm text-text-secondary hover:text-error">
                      전체 지우기
                    </button>
                    <span className="text-xs text-text-secondary">
                      최대 {MAX_FILES}개 · 총 {(selectedFiles.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sound section */}
            <div>
              <h2 className="text-sm font-medium text-text-secondary mb-2">사운드 파일</h2>
              <FileDropZone onFiles={handleSoundFiles} onError={(m) => showToast(m, 'error')} compact fileType="sound" />
              {selectedSoundFiles.length > 0 && (
                <div className="space-y-3 mt-3">
                  <FileList files={selectedSoundFiles} onRemove={removeSoundFile} />
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={clearSoundFiles} className="text-sm text-text-secondary hover:text-error">
                      전체 지우기
                    </button>
                    <span className="text-xs text-text-secondary">
                      최대 {MAX_SOUND_FILES}개 · 총 {(selectedSoundFiles.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                </div>
              )}
            </div>

            <HistoryPanel history={history} />
          </div>
        </div>

        {/* Always-visible deploy button */}
        <div className="py-3 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <DeployButton
              onClick={onDeployClick}
              disabled={selectedFiles.length === 0 && selectedSoundFiles.length === 0}
              loading={deployState === 'uploading' || deployState === 'building'}
            />
          </div>
        </div>
      </main>

      {/* Status bar */}
      <footer className="px-6 py-3 border-t border-border bg-surface/70">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {lastDeployment ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">마지막 배포:</span>
              <span className="text-text-primary">
                {fmtKST(lastDeployment.timestamp)}
              </span>
              <span className="text-text-secondary">·</span>
              <StatusBadge status={lastDeployment.status} />
            </div>
          ) : (
            <span className="text-sm text-text-secondary">
              아직 배포 기록이 없어요.
            </span>
          )}
          <button
            type="button"
            onClick={() => void window.electronAPI.shell.openExternal(pagesUrl)}
            className="text-sm text-primary hover:text-primary-hover truncate"
            title={pagesUrl}
          >
            {pagesUrl} →
          </button>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in">
          <div
            className={[
              'px-4 py-3 rounded-button shadow-soft-lg text-sm border',
              toastType === 'error'
                ? 'bg-error/10 border-error/40 text-error'
                : toastType === 'warning'
                  ? 'bg-warning/10 border-warning/40 text-warning'
                  : 'bg-white border-border text-text-primary',
            ].join(' ')}
          >
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

export default Main;
