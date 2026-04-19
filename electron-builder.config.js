/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'com.arrru.godot-deployer',
  productName: 'Godot 배포 도우미',
  copyright: 'Copyright © 2026 Arrru',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',
    'package.json',
    '!node_modules/**/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!node_modules/**/{test,__tests__,tests,powered-test,example,examples}',
    '!**/*.map',
  ],
  asarUnpack: ['**/node_modules/keytar/**'],
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64'],
      },
    ],
    category: 'public.app-category.developer-tools',
    icon: 'build/icon.icns',
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
    icon: 'build/icon.ico',
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Godot 배포 도우미',
  },
  publish: [
    {
      provider: 'github',
      owner: 'Arrru',
      repo: 'image_helper',
      releaseType: 'release',
    },
  ],
};
