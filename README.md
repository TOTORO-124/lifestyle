# 원카드 (OneCard) - React + Firebase

이 프로젝트는 React, Tailwind CSS, Firebase를 사용하여 구현된 웹 기반 **원카드(OneCard)** 게임입니다. 로컬에서 컴퓨터와 대결하거나 온라인 방을 만들어 친구들과 함께 즐길 수 있습니다.

## 주요 기능

* **로컬 모드 (혼자 하기)**: 사람 1명과 컴퓨터 1~4명이 함께 플레이할 수 있습니다.
* **온라인 모드 (같이 하기)**: 초대 코드를 통해 방을 만들고 여러 사람이 접속하여 플레이할 수 있습니다. 인원이 부족하면 빈 자리를 컴퓨터로 채울 수 있습니다.
* **원카드 선언 및 벌칙**: 손패가 1장이 되었을 때 선언하지 않으면 2장의 벌칙 카드를 받습니다.
* **공격 방어 시스템**: 공격 카드(A, 2, 조커)는 더 강하거나 같은 무늬의 공격 카드로 방어할 수 있습니다.
* **J 스킵, Q 방향 전환**: 특수 카드를 통해 다채로운 전략 구사가 가능합니다.

## 게임 규칙

* 각자 7장의 카드를 가지고 시작하며, 모든 카드를 먼저 내는 사람이 승리합니다.
* 낼 수 있는 카드는 바닥에 있는 가장 위 카드와 무늬(♠, ♥, ♦, ♣)가 같거나 숫자/알파벳이 같은 카드입니다.
* 조커는 언제든지 낼 수 있습니다. (컬러 조커는 가장 강력한 공격카드, 흑백 조커는 그 다음 강력한 공격카드입니다.)
* **특수 카드 규칙**:
  * **A, 2, 조커**: 다음 사람에게 각각 3장, 2장, 공격 누적에 따라 카드를 먹이는 공격 카드입니다.
  * **7**: 내면서 다음에 낼 무늬를 지정할 수 있습니다.
  * **J**: 다음 사람의 턴을 건너뜁니다 (Skip).
  * **Q**: 게임 진행 방향을 반대로 바꿉니다 (Reverse).
  * **K**: 카드를 낸 사람이 한 번 더 카드를 냅니다 (One more).

## 설치 및 실행 방법

1. 의존성 설치
   ```bash
   npm install
   ```

2. 환경 변수 설정
   `.env.example` 파일을 복사하여 `.env.local` (또는 `.env`)로 이름을 변경한 후, Firebase 프로젝트 정보를 입력합니다.
   ```bash
   cp .env.example .env.local
   ```

3. 로컬 개발 서버 실행
   ```bash
   npm run dev
   ```

## Firebase 설정 방법

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트를 생성합니다.
2. Firestore Database를 활성화하고, 규칙을 설정합니다 (firestore.rules 참조).
3. Authentication에서 익명 로그인(Anonymous) 제공업체를 활성화합니다.
4. 프로젝트 설정 > 내 앱에서 웹 앱을 추가하고 발급받은 구성 키를 환경 변수에 등록합니다.

## 배포 방법

Firebase Hosting을 통해 정적 파일을 배포할 수 있습니다.

1. 배포 빌드 생성
   ```bash
   npm run build
   ```

2. Firebase CLI 로그인 및 초기화
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   ```

3. 배포 실행
   ```bash
   firebase deploy --only hosting
   ```
