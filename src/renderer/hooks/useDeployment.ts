import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import type { AppError, FileInputPayload } from '../../shared/types';

// Event subscriptions (onProgress / onComplete) are intentionally kept in App.tsx
// so they survive when this hook's host component (<Main>) unmounts during deployment.
export function useDeployment() {
  const { selectedFiles, setDeployState, setProgress, setError } = useAppStore();

  const startDeploy = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setError({
        title: '선택된 파일이 없어요',
        message: '업로드할 이미지를 먼저 추가해 주세요.',
        hint: '파일 선택 버튼으로 이미지를 골라주세요.',
      });
      return;
    }
    setError(null);
    setDeployState('uploading');
    setProgress({
      step: 'uploading',
      percent: 5,
      message: '업로드 준비 중…',
    });

    const payload: FileInputPayload[] = selectedFiles.map((f) => ({
      name: f.name,
      path: f.path,
    }));

    const result = await window.electronAPI.deploy.start(payload);
    if (result.error) {
      setDeployState('failed');
      const err: AppError = {
        title: '업로드에 실패했어요',
        message: result.error,
        hint: '잠시 후 다시 시도해 주세요. 문제가 계속되면 스크린샷을 찍어 개발팀에 보내주세요.',
      };
      setError(err);
    }
    // success path is handled via events
  }, [selectedFiles, setDeployState, setError, setProgress]);

  return { startDeploy };
}
