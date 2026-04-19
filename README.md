# Godot 배포 도우미

디자이너 친화적인 이미지 배포 데스크탑 앱. 이미지를 업로드하면 GitHub 저장소에
커밋/푸시하고 GitHub Actions 빌드를 감시해 자동으로 GitHub Pages에 배포합니다.

## 스택
- Electron 28 + React 18 + TypeScript
- Tailwind CSS
- @octokit/rest, keytar, zustand
- vite-plugin-electron, electron-builder

## 시작하기

`build_for_program.bat` 파일을 더블클릭하면 자동으로 빌드가 진행됩니다.

> 명령어를 직접 실행하려는 경우:
> ```bash
> npm install
> npm run dev
> ```

## 빌드

`build_for_program.bat` 파일을 더블클릭하면 Windows 설치 파일(`.exe`)이 생성됩니다.
빌드 완료 후 `release` 폴더가 자동으로 열립니다.

> 명령어를 직접 실행하려는 경우:
> ```bash
> npm run dist:win
> ```

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
