import { KEYTAR_ACCOUNT, KEYTAR_SERVICE } from '../../shared/types';

// Lazy-load keytar so that failures on unusual platforms don't crash startup.
type KeytarModule = typeof import('keytar');
let keytarCache: KeytarModule | null = null;
function getKeytar(): KeytarModule {
  if (!keytarCache) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    keytarCache = require('keytar');
  }
  return keytarCache!;
}

export async function saveToken(token: string): Promise<void> {
  const keytar = getKeytar();
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, token);
}

export async function loadToken(): Promise<string | null> {
  try {
    const keytar = getKeytar();
    return await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
  } catch {
    return null;
  }
}

export async function deleteToken(): Promise<boolean> {
  try {
    const keytar = getKeytar();
    return await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
  } catch {
    return false;
  }
}
