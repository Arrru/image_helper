import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';

interface Props {
  onClose: () => void;
}

export function Settings({ onClose }: Props) {
  const { githubUsername, appVersion, setAuthenticated } = useAppStore();
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const offAvail = window.electronAPI.app.onUpdateAvailable(({ version }) => {
      setUpdateInfo(`새 버전 ${version}이(가) 있어요. 자동으로 다운로드 중입니다.`);
    });
    const offDown = window.electronAPI.app.onUpdateDownloaded(({ version }) => {
      setUpdateInfo(`버전 ${version} 다운로드 완료. 재시작하면 적용됩니다.`);
    });
    return () => {
      offAvail();
      offDown();
    };
  }, []);

  const onResetToken = async () => {
    const ok = window.confirm(
      '토큰을 다시 설정하시겠어요? 현재 연결이 해제됩니다.',
    );
    if (!ok) return;
    await window.electronAPI.auth.deleteToken();
    setAuthenticated(false, null);
    onClose();
  };

  const onCheckUpdate = async () => {
    setChecking(true);
    setError(null);
    setUpdateInfo(null);
    try {
      const r = await window.electronAPI.app.checkUpdate();
      if (!r.ok) {
        setError(r.error ?? '업데이트를 확인할 수 없어요.');
      } else if (!updateInfo) {
        setUpdateInfo('최신 버전을 사용 중이에요.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-8 bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg card p-8 fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">설정</h2>
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

        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-text-primary mb-2">GitHub 계정</h3>
            <div className="bg-background rounded-button p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-text-primary">
                  @{githubUsername ?? '연결됨'}
                </span>
              </div>
              <button
                type="button"
                onClick={onResetToken}
                className="text-xs text-error hover:underline"
              >
                토큰 재설정
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-text-primary mb-2">저장소</h3>
            <div className="bg-background rounded-button p-3 text-sm text-text-primary">
              Arrru/dosa <span className="text-text-secondary">(main)</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-text-primary">앱 버전</h3>
              <button
                type="button"
                onClick={onCheckUpdate}
                disabled={checking}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {checking ? '확인 중…' : '업데이트 확인'}
              </button>
            </div>
            <div className="bg-background rounded-button p-3 text-sm text-text-primary">
              v{appVersion || '1.0.0'}
            </div>
            {updateInfo && (
              <p className="mt-2 text-xs text-primary">{updateInfo}</p>
            )}
            {error && (
              <p className="mt-2 text-xs text-error">{error}</p>
            )}
          </div>
        </section>

        <div className="mt-8 text-right">
          <button type="button" className="btn-secondary px-4 py-2" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
