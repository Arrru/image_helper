import React, { useCallback, useRef, useState } from 'react';
import type { SelectedFile } from '../../shared/types';

interface Props {
  onFiles: (files: SelectedFile[]) => void;
  onError?: (msg: string) => void;
  compact?: boolean;
  fileType?: 'image' | 'sound';
}

export function FileDropZone({ onFiles, onError, compact = false, fileType = 'image' }: Props) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const dragDepth = useRef(0);

  const processPaths = useCallback(
    async (paths: string[]) => {
      if (paths.length === 0) return;
      setBusy(true);
      try {
        const results = await Promise.all(
          paths.map(async (p) => {
            const r = await window.electronAPI.file.readPreview(p);
            if ('error' in r) return null;
            return {
              name: r.name,
              path: p,
              size: r.size,
              preview: r.dataUrl,
            } as SelectedFile;
          }),
        );
        const valid = results.filter((r): r is SelectedFile => r !== null);
        if (valid.length === 0) {
          onError?.('파일을 불러오지 못했어요.');
          return;
        }
        onFiles(valid);
      } catch (err) {
        onError?.((err as Error).message ?? '파일을 불러오지 못했어요.');
      } finally {
        setBusy(false);
      }
    },
    [onFiles, onError],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      dragDepth.current = 0;
      const paths: string[] = [];
      for (const f of Array.from(e.dataTransfer.files)) {
        // Electron exposes file path on the File object
        const p = (f as File & { path?: string }).path;
        if (p) paths.push(p);
      }
      void processPaths(paths);
    },
    [processPaths],
  );

  const handleOpenDialog = useCallback(async () => {
    const res = fileType === 'sound'
      ? await window.electronAPI.dialog.openSoundFiles()
      : await window.electronAPI.dialog.openFiles();
    if (res.canceled || res.paths.length === 0) return;
    await processPaths(res.paths);
  }, [processPaths, fileType]);

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setDragging(false);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={handleDrop}
      className={[
        'border-2 border-dashed rounded-card bg-white/60 transition-all',
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/60',
        compact ? 'p-6' : 'p-10',
      ].join(' ')}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className={[
            'w-14 h-14 rounded-full flex items-center justify-center',
            dragging ? 'bg-primary text-white' : 'bg-background text-primary',
            'transition-colors',
          ].join(' ')}
        >
          {fileType === 'sound' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-7 h-7" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-7 h-7" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4-4 4M12 4v12" />
            </svg>
          )}
        </div>
        <p className="text-text-primary font-medium">
          {dragging
            ? '여기에 놓으면 추가돼요'
            : fileType === 'sound'
              ? '사운드 파일을 여기에 끌어다 놓으세요'
              : '이미지 파일을 여기에 끌어다 놓으세요'}
        </p>
        <p className="text-text-secondary text-sm">
          {fileType === 'sound'
            ? 'MP3, OGG, WAV, FLAC, OPUS, AAC · 최대 20개, 파일당 50MB'
            : 'PNG, JPG, WEBP, SVG, GIF · 최대 20개, 파일당 50MB'}
        </p>
        <button
          type="button"
          onClick={handleOpenDialog}
          disabled={busy}
          className="mt-2 px-4 py-2 bg-white border border-border rounded-button text-sm text-text-primary hover:bg-background transition-colors disabled:opacity-50"
        >
          {busy ? '불러오는 중…' : '또는 파일 선택하기'}
        </button>
      </div>
    </div>
  );
}

export default FileDropZone;
