# Atelier AX

AI 인력 운영 관제 + **프로젝트 스튜디오(2.0, 공개 시연판)** — https://atelier-ax.vercel.app

## 구성
| 경로 | 내용 | 출처 |
|---|---|---|
| `/` `/missions/` `/approvals/` `/agents/` `/performance/` | 기존 AI 인력 관제(라이브·업무·승인·인력·성과) | 기존 Next.js 정적 빌드(2026-10-18 배포본) 그대로 보존. 원본 소스는 이 저장소에 없음 |
| `/studio/` | 프로젝트 스튜디오 — 아이디어 → 설계도 → AI 팀 → 단계별 진행 → 결정·승인 → 결과·검증 → 이력 | `public/studio/*` (빌드 없는 ES 모듈) |
| `/ax-nav.js` | 기존 화면 상단 메뉴에 ‘스튜디오’ 링크 추가(하이드레이션 뒤 삽입) | |
| `/api/studio/health` `plan` `run` | 실제 AI 실행 — Claude API(Opus 5.5) 서버 함수. 설계도(구조화 출력) · 작업 실행(SSE 스트리밍) | `api/` (Vercel 함수, `api/_lib` 는 공용) |

## 개념
- **Agent** 일을 하는 AI(기획·디자인·개발·검수) · **Skill** 에이전트가 쓰는 재사용 절차(여러 에이전트가 공유) · **Workflow** 6단계(아이디어 정리 → 제작 설계 → 실제 제작 → 작동 확인 → 최종 검토 → 서비스 공개)
- **Task**(완료 기준) · **Run**(실행 기록) · **Approval**(범위 확인·설계 결정·최종 검토·공개 승인 4게이트) · **Evidence**(검사 기록)

## 진행 보드(게임 화면)
글을 읽지 않고 상황을 보게 한다 — 단계 = 구역, 작업 = 칸/블록(담당 AI 색), 승인 = 관문(잠김·대기·통과), 에이전트 = 말(지금 할 칸으로 이동).
- **선형**: 한 줄 트랙 · **입체**: 아이소메트릭 계단(단계마다 한 층). 칸을 누르면 그 작업 상세로 이동.
- HUD: 팀 레벨·XP, 관문 4개, 에이전트별 레벨, 업적 — 모두 기록(runs·approvals·evidence)에서 계산(`M.game`), 꾸며 낸 점수 없음.
- 실시간 콘솔: 실제 실행 중이면 AI가 쓰는 글이 스트리밍으로 흐르고(경과 시간·글자 수), 끝나면 한 줄 요약만 남는다. 전문은 작업 행의 ‘AI 산출물’.

## 실제 AI 실행(LIVE)
- 켜지는 조건: Vercel 환경변수 `ANTHROPIC_API_KEY` **와** `STUDIO_ACCESS_CODE` 둘 다. 하나라도 없으면 `/api/studio/health` 가 `live:false` — 화면은 시연만 허용.
- 홈에서 ‘실제 AI’ + 접근 코드 → 기획 담당 AI가 설계도 작성 → 작업마다 담당 에이전트로 실행(effort low, 출력 4000토큰 상한). 승인 관문·오류·중단에서 멈춘다.
- 검사 작업은 품질 검수 AI가 산출물을 읽고 내리는 **AI 검토(코드 실행 아님)** — 판정 줄이 없으면 미검증. 실패 시 수정·재검사 최대 2회.
- 코드 실행 환경·GitHub·배포는 미연결 → 공개 단계는 ‘실행 안 함’.
- 거절(refusal)은 서버 측 `fallbacks: "default"`(beta `server-side-fallback-2026-07-01`)로 대체 모델이 이어 받는다.

## AI 작업 모델하우스(`/studio/#/bridge`, 기본) — API 키 없이 더미 각본으로 도는 시뮬레이션
- `public/studio/sim.js`: 4개 AI(Claude Code·Gemini·Make·ChatGPT)가 각본대로 일한다 — 지시 → 읽기·웹 → 수정·산출물 → 실행 → 검사 → 완료, 일정 확률로 실패 → 복구 각본. 시드 고정(재현 가능), 모든 이벤트 `sim:true`.
- `public/studio/floor.js`: 아이소메트릭 평면 — 자리 8곳(지시 데스크·자료실·웹 창구·작업대·실행실·검사대·대기석·완료 게이트). 말이 하는 일의 자리로 이동, 실패는 붉게.
- 조작: 재생/일시정지 · 1×/2×/4× · 사고 넣기(다음 검사 강제 실패) · 처음부터. 화면에 ‘시뮬레이션 · 가상’ 표기.
- 서버·키가 준비되면 같은 화면에서 ‘실제 연결’로 전환(아래 브리지).

## AI 작업 브리지 — 지금 일하는 AI 실시간 보기(`/studio/#/bridge`, 보기 전용)
어떤 AI 도구든 작업할 때마다 이벤트를 보내면, 세션마다 한 줄 레인으로 모양·색만 보고 상황을 읽게 한다(수정 ■ · 명령 ● · 테스트 ◆ · 읽기 · · 실패 ✕ · 완료 ⚑).
- 받기: `POST /api/bridge/events/` (`Authorization: Bearer BRIDGE_TOKEN`, 한 건 또는 50건 배열) · 보기: `GET /api/bridge/feed/` (`x-studio-code`), 화면은 3초마다 갱신.
- 저장: Supabase 표 `atelier_events` — `supabase/atelier_bridge.sql` 로 만든다. RLS 켬·공개 정책 없음, 서버 함수만 service role 키로 접근.
- 서버 환경변수: `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` · `BRIDGE_TOKEN` · `STUDIO_ACCESS_CODE`.
- Claude Code 연결: `connectors/claude-code/atelier-hook.mjs` 를 훅으로 등록(설정 예시는 화면의 ‘AI 도구 연결하기’). 지시 문장은 `ATELIER_SEND_PROMPTS=1` 일 때만 보냄, 실패해도 Claude Code 를 막지 않음(2초 제한·조용히 종료).
- 그 밖의 도구(Gemini·ChatGPT 스크립트, Make HTTP 모듈, Cursor 등): 같은 형식으로 POST. API 키·토큰 모양 문자열은 저장 전에 가린다.

## 정직성 규칙
- 시연(DEMO): 설계도는 키워드 규칙 초안, 실행·검사는 이 브라우저 안 가상 기록(`demo:true`) — 화면에 ‘시연 · 가상’ 표기.
- 실행하지 않은 검사는 **미검증**, 시연에서 공개 승인해도 배포는 **실행 안 함**. 실패는 숨기지 않고 수정·재검사로 남긴다.
- LIVE 는 서버가 키·접근 코드를 확인해 준 경우에만 ‘연결됨’ 표시(`/studio/#/live`). 그 외에는 연결된 것처럼 표시하지 않는다.

## 명령
- `npm test` — 모델(상태 전이·게이트·검증·실제 실행 기록·보드/게임 계산) + 서버 공용 로직 테스트
- `npm run serve` — http://localhost:8910 (Vercel 의 `__PAGE__.txt` rewrite 는 로컬에서 404 — 무시 가능)

## 배포
Vercel 프로젝트 `atelier-ax`, 출력 디렉터리 `public`, 빌드 없음, 함수 의존성은 `npm install`(`vercel.json`, 함수 최대 60초). 프로덕션 반영 전 Preview 확인.
