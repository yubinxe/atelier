# Atelier AX — 작업 규칙
- 배포 루트 = `public/`. 기존 관제 화면(`public/_next`, 각 라우트 index.html/txt)은 빌드 산출물 — 손대지 않는다(메뉴 링크는 `ax-nav.js`).
- 스튜디오 = `public/studio/` (model.js 순수 로직 · app.js 화면 · studio.css). 바꾸면 `npm test` 통과 + index.html 의 `?v=` 올리기.
- 시연 결과는 반드시 ‘가상’ 표기, 미실행 검사는 ‘미검증’. 연결 안 된 외부 서비스를 연결된 것처럼 쓰지 않는다.
- 프로덕션 직접 배포 금지 — Preview 확인 후 승인받아 promote.
- 기존 관제 원본 소스(Next.js, roster.json, Hermes 백엔드)는 이 저장소에 없음. 원본이 생기면 이 정적 사본을 대체.
