import React, { useEffect, useState } from 'react';
import SetupWizard from './pages/SetupWizard';
import Main from './pages/Main';
import Deploying from './pages/Deploying';
import Result from './pages/Result';
import Settings from './pages/Settings';
import { useAppStore } from './store/appStore';

export default function App() {
  const {
    isAuthenticated,
    deployState,
    setAuthenticated,
    setHistory,
    setLastDeployment,
    setAppVersion,
    reset,
    setDeployState,
    setProgress,
    setError,
  } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [bootChecked, setBootChecked] = useState(false);

  // Deploy event subscriptions live here so they survive screen transitions.
  // (useDeployment is only mounted on <Main>, which unmounts when deploying starts.)
  useEffect(() => {
    const offProgress = window.electronAPI.deploy.onProgress((p) => {
      setProgress(p);
      if (p.step === 'uploading') setDeployState('uploading');
      else if (p.step === 'building' || p.step === 'deploying') setDeployState('building');
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
        setError({
          title: r.timeoutReached ? '시간이 너무 오래 걸리고 있어요' : '배포에 실패했어요',
          message: r.timeoutReached
            ? '빌드가 아직 완료되지 않았어요. GitHub Actions에서 진행 상황을 확인해 주세요.'
            : '게임 빌드에 실패했어요. 이전 버전은 그대로 유지됩니다.',
          hint: r.timeoutReached
            ? 'GitHub Actions 상태를 확인해 주세요.'
            : '잠시 후 다시 시도해 주세요.',
        });
      }
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

  // Boot: check token, load config + history
  useEffect(() => {
    (async () => {
      try {
        const tokenRes = await window.electronAPI.auth.loadToken();
        if (tokenRes.token) {
          setAuthenticated(true, tokenRes.username);
        } else {
          setAuthenticated(false, null);
        }

        const cfg = await window.electronAPI.config.load();
        if (cfg.lastDeployment) {
          setLastDeployment({
            timestamp: cfg.lastDeployment.timestamp,
            status: cfg.lastDeployment.status,
            pagesUrl: cfg.lastDeployment.pagesUrl,
            commitSha: cfg.lastDeployment.commitSha,
          });
        }

        const h = await window.electronAPI.history.load();
        setHistory(h);

        const v = await window.electronAPI.app.version();
        setAppVersion(v);

        // Kick off update check (no-op in dev)
        void window.electronAPI.app.checkUpdate();
      } catch {
        // non-fatal
      } finally {
        setBootChecked(true);
      }
    })();
  }, [setAuthenticated, setHistory, setLastDeployment, setAppVersion]);

  if (!bootChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary text-sm">불러오는 중…</div>
      </div>
    );
  }

  if (!isAuthenticated || deployState === 'not_configured') {
    return <SetupWizard />;
  }

  let screen: React.ReactNode;
  if (deployState === 'uploading' || deployState === 'building') {
    screen = <Deploying />;
  } else if (deployState === 'success' || deployState === 'failed') {
    screen = <Result onBack={reset} onRetry={reset} />;
  } else {
    screen = <Main onOpenSettings={() => setShowSettings(true)} />;
  }

  return (
    <>
      {screen}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </>
  );
}
