import React from 'react';

export type StepKey = 'uploading' | 'building' | 'deploying';

interface Props {
  currentStep: StepKey;
  failed?: boolean;
}

const STEPS: Array<{ key: StepKey; label: string }> = [
  { key: 'uploading', label: '파일 전송' },
  { key: 'building', label: '게임 빌드' },
  { key: 'deploying', label: '웹사이트 배포' },
];

export function ProgressSteps({ currentStep, failed = false }: Props) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <ol className="flex items-center w-full">
      {STEPS.map((s, i) => {
        const state: 'done' | 'active' | 'todo' =
          i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'todo';
        const isLast = i === STEPS.length - 1;
        return (
          <li key={s.key} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-colors',
                  state === 'done' && !failed
                    ? 'bg-primary border-primary text-white'
                    : state === 'active' && !failed
                      ? 'bg-white border-primary text-primary'
                      : state === 'active' && failed
                        ? 'bg-white border-error text-error'
                        : 'bg-white border-border text-text-secondary',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {state === 'done' && !failed ? '✓' : String(i + 1)}
              </div>
              <span
                className={[
                  'mt-2 text-xs whitespace-nowrap',
                  state === 'active'
                    ? failed
                      ? 'text-error font-medium'
                      : 'text-primary font-medium'
                    : state === 'done'
                      ? 'text-text-primary'
                      : 'text-text-secondary',
                ].join(' ')}
              >
                {s.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={[
                  'flex-1 h-0.5 mx-3 -mt-6',
                  state === 'done' && !failed ? 'bg-primary' : 'bg-border',
                ].join(' ')}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default ProgressSteps;
