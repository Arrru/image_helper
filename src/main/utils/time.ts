// Time utilities — UTC ↔ KST conversion and friendly formatting

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * Convert any Date or ISO string to a KST formatted string.
 * Example: "2026-04-19 오후 2:32 (KST)"
 */
export function formatKST(input: Date | string): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return '-';

  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  const hour24 = kst.getUTCHours();
  const minute = String(kst.getUTCMinutes()).padStart(2, '0');
  const ampm = hour24 < 12 ? '오전' : '오후';
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;

  return `${year}-${month}-${day} ${ampm} ${hour12}:${minute} (KST)`;
}

/**
 * Short KST format for commit messages: "YYYY-MM-DD HH:mm KST"
 */
export function formatKSTShort(input: Date | string = new Date()): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  const hour = String(kst.getUTCHours()).padStart(2, '0');
  const minute = String(kst.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute} KST`;
}

export function durationSeconds(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (isNaN(start) || isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 1000));
}

export function formatDurationSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}분` : `${m}분 ${s}초`;
}
