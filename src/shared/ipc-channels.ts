// IPC channel names used between main and renderer

export const IPC = {
  // Auth
  AUTH_SAVE_TOKEN: 'auth:save-token',
  AUTH_LOAD_TOKEN: 'auth:load-token',
  AUTH_DELETE_TOKEN: 'auth:delete-token',
  AUTH_VALIDATE: 'auth:validate',

  // Deploy
  DEPLOY_START: 'deploy:start',
  DEPLOY_POLL: 'deploy:poll',

  // Config
  CONFIG_LOAD: 'config:load',
  CONFIG_SAVE: 'config:save',

  // History
  HISTORY_LOAD: 'history:load',
  HISTORY_SAVE: 'history:save',

  // Dialog
  DIALOG_OPEN_FILES: 'dialog:open-files',
  DIALOG_OPEN_SOUNDS: 'dialog:open-sounds',

  // File read (for thumbnails)
  FILE_READ_PREVIEW: 'file:read-preview',

  // External
  SHELL_OPEN: 'shell:open-external',

  // App
  APP_VERSION: 'app:version',
  APP_CHECK_UPDATE: 'app:check-update',

  // Events (main -> renderer)
  EVENT_DEPLOY_PROGRESS: 'deploy:progress',
  EVENT_DEPLOY_COMPLETE: 'deploy:complete',
  EVENT_UPDATE_AVAILABLE: 'update:available',
  EVENT_UPDATE_DOWNLOADED: 'update:downloaded',
} as const;
