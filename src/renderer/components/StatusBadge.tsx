import React from 'react';

type Status = 'success' | 'failed' | 'pending' | 'timeout' | 'in_progress';

interface Props {
  status: Status | string;
  className?: string;
}

const META: Record<Status, { label: string; bg: string; fg: string; icon: string }> = {
  success: { label: '성공', bg: 'bg-success/15', fg: 'text-success', icon: '✅' },
  failed: { label: '실패', bg: 'bg-error/15', fg: 'text-error', icon: '⚠️' },
  pending: { label: '대기 중', bg: 'bg-warning/15', fg: 'text-warning', icon: '⏳' },
  timeout: { label: '시간 초과', bg: 'bg-warning/15', fg: 'text-warning', icon: '⌛' },
  in_progress: { label: '진행 중', bg: 'bg-primary/15', fg: 'text-primary', icon: '⚙️' },
};

export function StatusBadge({ status, className = '' }: Props) {
  const key = (status as Status) in META ? (status as Status) : 'pending';
  const m = META[key];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${m.bg} ${m.fg} ${className}`}
    >
      <span aria-hidden>{m.icon}</span>
      <span>{m.label}</span>
    </span>
  );
}

export default StatusBadge;
