# Godot 배포 도우미

디자이너 친화적인 이미지 배포 데스크탑 앱. 이미지를 업로드하면 GitHub 저장소에
커밋/푸시하고 GitHub Actions 빌드를 감시해 자동으로 GitHub Pages에 배포합니다.

## 스택
- Electron 28 + React 18 + TypeScript
- Tailwind CSS
- @octokit/rest, keytar, zustand
- vite-plugin-electron, electron-builder

## 시작하기

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build        # 타입체크 + 번들
npm run dist         # 현재 OS용 패키징
npm run dist:win     # Windows NSIS
npm run dist:mac     # macOS DMG
```

## 저장소 설정 (MVP 기본값)
- owner: `Arrru`
- repo: `image_helper`
- branch: `main`
- image path: `assets/images`
- pages URL: https://arrru.github.io/image_helper

## 토큰 권한
GitHub Personal Access Token (classic)에 `repo`와 `workflow` 스코프가 필요합니다.
Fine-grained 토큰의 경우 Contents: Read/Write, Actions: Read 권한이 필요합니다.

토큰은 OS 키체인(`godot-deployer` 서비스)에 저장됩니다.
