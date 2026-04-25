import path from 'node:path';
import fs from 'node:fs/promises';
import {
  ALLOWED_EXT,
  ALLOWED_SOUND_EXT,
  MAX_FILE_SIZE,
  MAX_FILES,
  MAX_SOUND_FILES,
  MAX_TOTAL_SIZE,
} from '../../shared/types';

export interface FileValidationResult {
  valid: boolean;
  errorCode?:
    | 'TOO_MANY'
    | 'TOO_LARGE'
    | 'TOTAL_TOO_LARGE'
    | 'BAD_EXT'
    | 'BAD_NAME'
    | 'NOT_FOUND';
  errorMessage?: string;
  file?: string;
}

// Filename allowed chars: alphanumeric + hyphen + underscore + dot
const FILENAME_REGEX = /^[A-Za-z0-9._-]+$/;

export function isValidFilename(name: string): boolean {
  return FILENAME_REGEX.test(name);
}

export function hasAllowedExtension(name: string): boolean {
  const ext = path.extname(name).toLowerCase();
  return ALLOWED_EXT.includes(ext);
}

export function hasAllowedSoundExtension(name: string): boolean {
  const ext = path.extname(name).toLowerCase();
  return ALLOWED_SOUND_EXT.includes(ext);
}

/**
 * Validate a single file (by path).
 */
export async function validateFile(
  filePath: string,
  type: 'image' | 'sound' = 'image',
): Promise<FileValidationResult> {
  const base = path.basename(filePath);

  if (!isValidFilename(base)) {
    return {
      valid: false,
      errorCode: 'BAD_NAME',
      errorMessage:
        '파일 이름에는 영문, 숫자, 하이픈(-), 밑줄(_)만 사용해 주세요.',
      file: base,
    };
  }

  const extOk = type === 'sound' ? hasAllowedSoundExtension(base) : hasAllowedExtension(base);
  if (!extOk) {
    return {
      valid: false,
      errorCode: 'BAD_EXT',
      errorMessage:
        type === 'sound'
          ? '지원하지 않는 파일 형식이에요. MP3, OGG, WAV, FLAC, OPUS, AAC만 올릴 수 있어요.'
          : '지원하지 않는 파일 형식이에요. PNG, JPG, WEBP, SVG, GIF만 올릴 수 있어요.',
      file: base,
    };
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    return {
      valid: false,
      errorCode: 'NOT_FOUND',
      errorMessage: '파일을 찾을 수 없어요.',
      file: base,
    };
  }

  if (stat.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      errorCode: 'TOO_LARGE',
      errorMessage: '파일이 너무 커요. 50MB 이하 파일만 올릴 수 있어요.',
      file: base,
    };
  }

  return { valid: true, file: base };
}

/**
 * Validate a batch of files (count + total size).
 */
export async function validateBatch(
  filePaths: string[],
  type: 'image' | 'sound' = 'image',
): Promise<FileValidationResult> {
  const maxFiles = type === 'sound' ? MAX_SOUND_FILES : MAX_FILES;
  if (filePaths.length > maxFiles) {
    return {
      valid: false,
      errorCode: 'TOO_MANY',
      errorMessage: `한 번에 최대 ${maxFiles}개 파일까지 올릴 수 있어요.`,
    };
  }

  let total = 0;
  for (const p of filePaths) {
    const v = await validateFile(p, type);
    if (!v.valid) return v;
    try {
      const st = await fs.stat(p);
      total += st.size;
    } catch {
      // already handled in validateFile
    }
  }
  if (total > MAX_TOTAL_SIZE) {
    return {
      valid: false,
      errorCode: 'TOTAL_TOO_LARGE',
      errorMessage: '전체 용량이 너무 커요. 합쳐서 200MB 이하로 올려주세요.',
    };
  }

  // Duplicate filenames
  const names = filePaths.map((p) => path.basename(p).toLowerCase());
  const uniq = new Set(names);
  if (uniq.size !== names.length) {
    return {
      valid: false,
      errorCode: 'BAD_NAME',
      errorMessage: '같은 이름의 파일이 두 번 선택되었어요. 한 번씩만 선택해 주세요.',
    };
  }

  return { valid: true };
}

export function mimeFromExt(name: string): string {
  const ext = path.extname(name).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}
