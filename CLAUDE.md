# Atelier AX — 작업 규칙
- 배포 루트 = `public/`. 기업 사이트(`/`, `/services/` … `/en/…`, 404·sitemap·robots)는 `site/build.mjs`+`site/content.mjs` 로 생성 — 직접 고치지 말고 `npm run build:site` 후 커밋. 디자인 원본 = `site/style.css`(→ `public/assets/site.css` 로 생성).
- 디자인 규칙(v3): 색·간격은 `:root` 토큰만(아이보리 `--paper` · 잉크 `--ink` · 골드 `--gold`), 중단점은 1080/760/480 세 개, 모서리 `--r` 2px. 카드·그라데이션·그림자·알약 버튼을 새로 만들지 않고 헤어라인과 12열 그리드로 구분한다. 제목은 `head()`/`ph()` 로 구 단위 줄바꿈, 인라인 `style=` 금지, 섹션당 CTA 하나. 바꾸면 320~1920 캡처로 확인.
- 초기판 관제 콘솔(`public/_next`, `/console/`·`/missions/` 등)은 Next 빌드 산출물 — 손대지 않는다(보조 스크립트 `ax-nav.js`).
- 실적·고객·가격·후기·인원·자격은 확인된 것만. 개인 프로젝트·재직 기업 업무·회사 실적을 섞지 않는다. 문의 저장 = `api/contact.js` → Supabase `atelier_leads`(`supabase/atelier_leads.sql`).
- 스튜디오 = `public/studio/` (model.js 순수 로직 · board.js 진행 보드 SVG · app.js 화면 · studio.css). 실제 AI = `api/studio/*` · 작업 브리지 = `api/bridge/*` + `public/studio/bridge.js` + `connectors/` · 모델하우스(키 없는 시뮬) = `public/studio/sim.js` + `floor.js`(키는 서버 환경변수만). 바꾸면 `npm test` 통과 + index.html 의 `?v=` 올리기.
- 시연 결과는 반드시 ‘가상’ 표기, 미실행 검사는 ‘미검증’. 연결 안 된 외부 서비스를 연결된 것처럼 쓰지 않는다.
- 프로덕션 직접 배포 금지 — Preview 확인 후 승인받아 promote.
- 기존 관제 원본 소스(Next.js, roster.json, Hermes 백엔드)는 이 저장소에 없음. 원본이 생기면 이 정적 사본을 대체.
- 응답은 짧게: 결론 먼저, 바뀐 부분만, 설명은 요청 시(전체 규칙 `tools/token-kit/RULES.md`, Hermes 도 이 파일을 읽는다).
