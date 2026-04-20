import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import { IPC } from '../shared/ipc-channels';
import { registerAuthIpc } from './ipc/auth.ipc';
import { registerConfigIpc } from './ipc/config.ipc';
import { registerDeployIpc, registerFileReadIpc } from './ipc/deploy.ipc';
import { cancelAllPolling } from './services/poller.service';

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  try {
    dialog.showErrorBox('오류 발생', `예기치 않은 오류가 발생했습니다.\n\n${error.message}`);
  } catch {
    // dialog unavailable before app ready
  }
  app.quit();
});

// Avoid multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 760,
    minHeight: 600,
    backgroundColor: '#FAF7F2',
    title: 'Godot 배포 도우미',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    show: false,
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
    void win.loadURL(devUrl);
  } else {
    void win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Open external links in OS browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

function registerGlobalIpc(): void {
  ipcMain.handle(
    IPC.DIALOG_OPEN_FILES,
    async (): Promise<{ paths: string[]; canceled: boolean }> => {
      if (!mainWindow) return { paths: [], canceled: true };
      const result = await dialog.showOpenDialog(mainWindow, {
        title: '이미지 파일 선택',
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: '이미지', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'] },
        ],
      });
      return { paths: result.filePaths, canceled: result.canceled };
    },
  );

  ipcMain.handle(IPC.SHELL_OPEN, async (_evt, url: string) => {
    await shell.openExternal(url);
    return { success: true };
  });

  ipcMain.handle(IPC.APP_VERSION, async () => app.getVersion());

  ipcMain.handle(IPC.APP_CHECK_UPDATE, async () => {
    try {
      // Lazy require so dev without the module still works
      const { autoUpdater } = await import('electron-updater');
      autoUpdater.autoDownload = true;
      autoUpdater.on('update-available', (info) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC.EVENT_UPDATE_AVAILABLE, {
            version: info.version,
          });
        }
      });
      autoUpdater.on('update-downloaded', (info) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC.EVENT_UPDATE_DOWNLOADED, {
            version: info.version,
          });
        }
      });
      if (!isDev) {
        await autoUpdater.checkForUpdatesAndNotify();
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Godot 배포 도우미',
      submenu: [
        { role: 'about', label: '정보' },
        { type: 'separator' },
        { role: 'quit', label: '종료' },
      ],
    },
    {
      label: '편집',
      submenu: [
        { role: 'undo', label: '실행 취소' },
        { role: 'redo', label: '다시 실행' },
        { type: 'separator' },
        { role: 'cut', label: '잘라내기' },
        { role: 'copy', label: '복사' },
        { role: 'paste', label: '붙여넣기' },
        { role: 'selectAll', label: '모두 선택' },
      ],
    },
    {
      label: '보기',
      submenu: [
        { role: 'reload', label: '새로 고침' },
        { role: 'toggleDevTools', label: '개발자 도구' },
        { type: 'separator' },
        { role: 'resetZoom', label: '실제 크기' },
        { role: 'zoomIn', label: '확대' },
        { role: 'zoomOut', label: '축소' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  registerAuthIpc();
  registerConfigIpc();
  registerDeployIpc();
  registerFileReadIpc();
  registerGlobalIpc();

  buildMenu();
  mainWindow = createMainWindow();

  // Check for updates in production after a small delay
  if (!isDev) {
    setTimeout(() => {
      void (async () => {
        try {
          const { autoUpdater } = await import('electron-updater');
          autoUpdater.autoDownload = true;
          autoUpdater.on('update-available', (info) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send(IPC.EVENT_UPDATE_AVAILABLE, {
                version: info.version,
              });
            }
          });
          autoUpdater.on('update-downloaded', (info) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send(IPC.EVENT_UPDATE_DOWNLOADED, {
                version: info.version,
              });
            }
          });
          await autoUpdater.checkForUpdatesAndNotify();
        } catch {
          // non-fatal
        }
      })();
    }, 3000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  cancelAllPolling();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cancelAllPolling();
});

// Security: prevent new windows and arbitrary navigation
app.on('web-contents-created', (_evt, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
  contents.on('will-navigate', (event, navigationUrl) => {
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (devUrl && navigationUrl.startsWith(devUrl)) return;
    if (navigationUrl.startsWith('file://')) return;
    event.preventDefault();
    void shell.openExternal(navigationUrl);
  });
});
