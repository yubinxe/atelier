# token-kit — 적은 토큰, 큰 레버리지 (Claude Code · claude.ai · Hermes)

규칙 원본은 `RULES.md` 하나. 아래 파일들은 그것을 도구별 자리에 맞게 옮긴 것.

| 대상 | 파일 | 들어가는 곳 |
|---|---|---|
| Claude Code 출력 | `claude-code/output-styles/caveman.md` | `~/.claude/output-styles/` + `settings.json` 의 `"outputStyle": "Caveman"` |
| Claude Code 입력 습관 | `claude-code/CLAUDE.global.md` | `~/.claude/CLAUDE.md` (표시 블록으로 추가) |
| claude.ai | `claude-ai/preferences.md` | 설정 → 프로필 → 개인 선호도 (기존 긴 글 대체) |
| claude.ai 디자인 | `claude-ai/design-standard.md` | 프로젝트 지식 — 디자인 작업 때만 읽힘 |
| Hermes Agent | `hermes/SOUL.section.md`, `hermes/config.patch.yaml` | `~/.hermes/SOUL.md`, `~/.hermes/config.yaml` 의 `personalities.caveman` |

## 설치
- Windows: `powershell -ExecutionPolicy Bypass -File .\install.ps1`
- macOS · Linux · WSL(Hermes 를 WSL 에서 쓰면 여기서): `bash install.sh`
- 다시 실행해도 안전: 표시 블록만 교체, 바꾸기 전 `*.bak-날짜` 백업.
- 끝나면: Claude Code 재시작 → `/output-style` 로 Caveman 확인, Hermes 에서 `/personality caveman`, claude.ai 는 손으로 붙여 넣기.

## 어디서 아끼나 (중요도 순)
1. **매번 들어가는 글** — claude.ai 개인 선호도·CLAUDE.md·SOUL.md 는 모든 요청에 실린다. 기존 선호도 약 2.5만 자 → 1.2천 자. 디자인 기준은 필요할 때만 읽히는 프로젝트 지식으로 분리.
2. **읽는 양** — 검색 먼저, 필요한 범위만, 재독 금지, 긴 로그 자르기, 작업마다 새 세션.
3. **쓰는 양** — Caveman 출력 스타일. 출력 절감은 실측 보고상 10~25% 수준이라 1·2번보다 효과가 작다.

확인 못 한 것: `install.ps1` 은 PowerShell 이 없는 환경에서 만들어 실행해 보지 못했다(`install.sh` 는 임시 홈에서 두 번 실행해 확인).
