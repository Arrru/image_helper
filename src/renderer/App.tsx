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
  } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [bootChecked, setBootChecked] = useState(false);

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
