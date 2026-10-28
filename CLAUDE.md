# Atelier AX — 작업 규칙
- 배포 루트 = `public/`. 기존 관제 화면(`public/_next`, 각 라우트 index.html/txt)은 빌드 산출물 — 손대지 않는다(메뉴 링크는 `ax-nav.js`).
- 스튜디오 = `public/studio/` (model.js 순수 로직 · board.js 진행 보드 SVG · app.js 화면 · studio.css). 실제 AI = `api/studio/*` · 작업 브리지 = `api/bridge/*` + `public/studio/bridge.js` + `connectors/` · 모델하우스(키 없는 시뮬) = `public/studio/sim.js` + `floor.js`(키는 서버 환경변수만). 바꾸면 `npm test` 통과 + index.html 의 `?v=` 올리기.
- 시연 결과는 반드시 ‘가상’ 표기, 미실행 검사는 ‘미검증’. 연결 안 된 외부 서비스를 연결된 것처럼 쓰지 않는다.
- 프로덕션 직접 배포 금지 — Preview 확인 후 승인받아 promote.
- 기존 관제 원본 소스(Next.js, roster.json, Hermes 백엔드)는 이 저장소에 없음. 원본이 생기면 이 정적 사본을 대체.
- 응답은 짧게: 결론 먼저, 바뀐 부분만, 설명은 요청 시(전체 규칙 `tools/token-kit/RULES.md`, Hermes 도 이 파일을 읽는다).
