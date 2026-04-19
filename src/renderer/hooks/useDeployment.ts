import { useCallback, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import type { AppError, FileInputPayload } from '../../shared/types';

/**
 * Central hook that wires up deploy progress/completion events to the store
 * and exposes a startDeploy function.
 */
export function useDeployment() {
  const {
    selectedFiles,
    setDeployState,
    setProgress,
    setError,
    setLastDeployment,
    setHistory,
  } = useAppStore();

  // Subscribe to progress + complete events
  useEffect(() => {
    const offProgress = window.electronAPI.deploy.onProgress((p) => {
      setProgress(p);
      if (p.step === 'uploading') setDeployState('uploading');
      else if (p.step === 'building' || p.step === 'deploying')
        setDeployState('building');
      else if (p.step === 'complete') setDeployState('success');
      else if (p.step === 'failed') setDeployState('failed');
    });

    const offComplete = window.electronAPI.deploy.onComplete(async (r) => {
      if (r.status === 'success') {
        setDeployState('success');
        setProgress({ step: 'complete', percent: 100, message: '완료!' });
        setLastDeployment({
          timestamp: r.timestamp,
          status: 'success',
          pagesUrl: r.pagesUrl,
          commitSha: '',
        });
      } else {
        setDeployState('failed');
        const hint = r.timeoutReached
          ? 'GitHub Actions 상태를 확인해 주세요.'
          : '잠시 후 다시 시도해 주세요.';
        setError({
          title: r.timeoutReached
            ? '시간이 너무 오래 걸리고 있어요'
            : '배포에 실패했어요',
          message: r.timeoutReached
            ? '빌드가 아직 완료되지 않았어요. GitHub Actions에서 진행 상황을 확인해 주세요.'
            : '게임 빌드에 실패했어요. 이전 버전은 그대로 유지됩니다.',
          hint,
        });
      }

      // Refresh history
      try {
        const h = await window.electronAPI.history.load();
        setHistory(h);
      } catch {
        // ignore
      }
    });

    return () => {
      offProgress();
      offComplete();
    };
  }, [setProgress, setDeployState, setError, setLastDeployment, setHistory]);

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
