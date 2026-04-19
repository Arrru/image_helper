import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';

type Step = 'token' | 'confirm';

export function SetupWizard() {
  const { setAuthenticated } = useAppStore();
  const [step, setStep] = useState<Step>('token');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const onValidate = async () => {
    if (!token.trim()) {
      setError('토큰을 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await window.electronAPI.auth.saveToken(token.trim());
      if (res.success) {
        setUsername(res.username);
        setStep('confirm');
      } else {
        setError(res.error ?? '토큰을 확인할 수 없어요.');
      }
    } catch {
      setError('토큰을 확인하는 중에 오류가 발생했어요. 인터넷 연결을 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const onStart = () => {
    setAuthenticated(true, username);
  };

  const openTokenPage = () => {
    void window.electronAPI.shell.openExternal(
      'https://github.com/settings/tokens/new?scopes=repo,workflow&description=Godot%20Deployer',
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-xl card p-8 fade-in">
        {step === 'token' ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex w-14 h-14 rounded-full bg-primary/10 text-primary items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-7 h-7" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-3 2-5 5-5s5 2 5 5-2 5-5 5h-1v2h-1v-2h-3v-5zM8 21h8M12 16v5" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-text-primary">
                처음 오셨군요!
              </h1>
              <p className="text-text-secondary mt-2 text-sm">
                한 번만 설정하면 됩니다.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-text-primary">
                  GitHub 개인 액세스 토큰 (PAT)
                </span>
                <div className="relative mt-2">
                  <input
                    type={showToken ? 'text' : 'password'}
                    className="input pr-12"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void onValidate();
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    aria-label="토큰 보기 전환"
                  >
                    {showToken ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.58a3 3 0 004.24 4.24M9.88 5.09A10.49 10.49 0 0112 5c7 0 10 7 10 7a17.75 17.75 0 01-3.06 4.24M6.61 6.61A17.74 17.74 0 002 12s3 7 10 7a9.75 9.75 0 005.39-1.61" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </label>

              <button
                type="button"
                onClick={openTokenPage}
                className="text-sm text-primary hover:text-primary-hover"
              >
                토큰 만들기 →
              </button>

              {error && (
                <div className="bg-error/10 border border-error/30 rounded-button px-4 py-3 text-sm text-error">
                  {error}
                </div>
              )}

              <button
                type="button"
                className="btn-primary w-full py-3"
                onClick={onValidate}
                disabled={loading}
              >
                {loading ? '확인 중…' : '확인하기'}
              </button>

              <p className="text-xs text-text-secondary leading-relaxed">
                토큰은 이 기기의 OS 키체인(Keychain/Credential Manager)에 안전하게 저장돼요.
                GitHub에 이미지 파일을 올리고, 배포 상태를 확인하는 데만 사용합니다.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex w-16 h-16 rounded-full bg-success/15 text-success items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-text-primary">
                GitHub 연결 완료
              </h1>
              <p className="text-text-secondary mt-2 text-sm">
                반가워요, <span className="text-text-primary font-medium">@{username ?? '사용자'}</span> 님!
              </p>
            </div>

            <div className="bg-background rounded-card p-4 mb-6 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">저장소</span>
                <span className="text-text-primary font-medium">Arrru/dosa</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">브랜치</span>
                <span className="text-text-primary font-medium">main</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">업로드 경로</span>
                <span className="text-text-primary font-medium">assets/images</span>
              </div>
            </div>

            <button type="button" className="btn-primary w-full py-3" onClick={onStart}>
              시작하기 →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default SetupWizard;
