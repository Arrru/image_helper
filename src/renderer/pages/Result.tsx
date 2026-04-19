import React from 'react';
import { useAppStore } from '../store/appStore';

interface Props {
  onBack: () => void;
  onRetry: () => void;
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
  return `${y}-${mo}-${da} ${ap} ${h12}:${mi} (KST)`;
}

export function Result({ onBack, onRetry }: Props) {
  const { deployState, lastDeployment, errorDetail } = useAppStore();
  const success = deployState === 'success';

  const url = lastDeployment?.pagesUrl || 'https://arrru.github.io/dosa/';

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-xl card p-8 fade-in">
        {success ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex w-20 h-20 rounded-full bg-success/15 text-success items-center justify-center mb-4">
                <span className="text-4xl" aria-hidden>🎉</span>
              </div>
              <h1 className="text-3xl font-semibold text-text-primary">
                배포 완료!
              </h1>
              <p className="text-text-secondary mt-2">
                {lastDeployment ? fmtKST(lastDeployment.timestamp) : '방금 전'}
              </p>
            </div>

            <div className="bg-background rounded-card p-4 mb-6">
              <p className="text-xs text-text-secondary mb-1">배포된 URL</p>
              <div className="flex items-center justify-between gap-3">
                <a
                  className="text-sm text-primary truncate font-medium hover:text-primary-hover"
                  href={url}
                  onClick={(e) => {
                    e.preventDefault();
                    void window.electronAPI.shell.openExternal(url);
                  }}
                  title={url}
                >
                  {url}
                </a>
                <button
                  type="button"
                  onClick={() => void window.electronAPI.shell.openExternal(url)}
                  className="px-3 py-1.5 bg-white border border-border rounded-button text-xs text-text-primary hover:bg-background flex-shrink-0"
                >
                  브라우저에서 열기 →
                </button>
              </div>
            </div>

            <button type="button" className="btn-primary w-full py-3" onClick={onBack}>
              다음 배포하기
            </button>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex w-20 h-20 rounded-full bg-error/15 text-error items-center justify-center mb-4">
                <span className="text-4xl" aria-hidden>😞</span>
              </div>
              <h1 className="text-2xl font-semibold text-text-primary">
                {errorDetail?.title ?? '배포에 실패했어요'}
              </h1>
            </div>

            <div className="bg-error/5 border border-error/20 rounded-card p-4 mb-4">
              <p className="text-sm text-text-primary leading-relaxed">
                {errorDetail?.message ??
                  '배포 중에 문제가 발생했어요. 이전 버전은 그대로 유지됩니다.'}
              </p>
              {errorDetail?.hint && (
                <p className="text-xs text-text-secondary mt-2">
                  힌트: {errorDetail.hint}
                </p>
              )}
            </div>

            <p className="text-xs text-text-secondary text-center mb-6">
              문제가 계속되면 스크린샷을 찍어 개발팀에게 보내주세요.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                className="btn-secondary flex-1 py-3"
                onClick={onBack}
              >
                돌아가기
              </button>
              <button
                type="button"
                className="btn-primary flex-1 py-3"
                onClick={onRetry}
              >
                다시 시도하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Result;
