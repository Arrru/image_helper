import React from 'react';
import ProgressSteps, { type StepKey } from '../components/ProgressSteps';
import { useAppStore } from '../store/appStore';

function mapStep(key: string | undefined): StepKey {
  if (key === 'deploying' || key === 'complete') return 'deploying';
  if (key === 'building') return 'building';
  return 'uploading';
}

export function Deploying() {
  const { progress, deployState } = useAppStore();
  const stepKey: StepKey = mapStep(progress?.step);
  const failed = deployState === 'failed';
  const percent = Math.max(3, Math.min(100, progress?.percent ?? 0));

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-xl card p-8 fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-full bg-primary/10 text-primary items-center justify-center mb-4">
            <svg className="w-7 h-7 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            배포하고 있어요. 잠깐만요!
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            평균 3~5분 소요됩니다.
          </p>
        </div>

        <div className="mb-8">
          <ProgressSteps currentStep={stepKey} failed={failed} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{progress?.message ?? '준비 중…'}</span>
            <span className="text-text-primary font-medium">{percent}%</span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-primary progress-stripes transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <p className="mt-6 text-xs text-text-secondary text-center">
          창을 닫아도 계속 진행됩니다.
        </p>
      </div>
    </div>
  );
}

export default Deploying;
