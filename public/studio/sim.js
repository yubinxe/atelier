// Atelier AX · 모델하우스 — 실제 AI·API 키 없이, 더미 각본으로 'AI 들이 일하는 모습'을 흉내 낸다(순수 로직, DOM 없음).
// 만들어 내는 이벤트는 실제 브리지와 같은 형식이라 같은 화면이 그대로 그린다. 모든 이벤트에 sim:true.

// 각본 한 걸음: [kind, 제목, 기본 초]. "?test" 는 일정 확률로 실패 → 수정 → 재검사로 갈라진다.
export const CAST = [
  { key: "cc", source: "claude-code", agent: "Claude Code", projects: ["포트폴리오 사이트", "아뜰리에 스튜디오"], script: [
    ["prompt", "새 지시를 받음", 2], ["read", "읽기 · src/pages/index.astro", 2], ["read", "읽기 · src/styles/tokens.css", 2], ["search", "찾기 · Hero", 2],
    ["edit", "수정 · src/components/Hero.astro", 4], ["edit", "수정 · src/styles/tokens.css", 3], ["run", "명령 · npm run build", 5], ["?test", "테스트 · npm test", 5],
    ["run", "명령 · git commit -m \"히어로 개편\"", 2], ["done", "응답 완료", 2]] },
  { key: "ge", source: "gemini", agent: "Gemini", projects: ["감정평가 리포트 · 성수동 상가", "감정평가 리포트 · 판교 오피스"], script: [
    ["prompt", "새 지시를 받음", 2], ["web", "웹 · 국토부 실거래가 조회", 4], ["web", "웹 · 개별공시지가 조회", 3], ["web", "웹 · 비교 거래사례 수집", 4],
    ["read", "읽기 · 건축물대장", 3], ["output", "산출물 · 거래사례비교법 초안", 6], ["output", "산출물 · 원가법 시산가액", 5], ["?test", "검토 · 시산가액 조정 대조", 4], ["done", "응답 완료", 2]] },
  { key: "mk", source: "make", agent: "Make", projects: ["주간 매출 보고 자동화"], script: [
    ["session", "시나리오 시작 · 매주 월요일 09:00", 2], ["tool", "도구 · 스프레드시트 불러오기", 3], ["run", "명령 · 지점별 매출 집계", 4],
    ["output", "산출물 · 주간 보고서 PDF", 4], ["?run", "도구 · 팀 메일 발송", 3], ["done", "시나리오 완료", 2]] },
  { key: "gp", source: "openai", agent: "ChatGPT", projects: ["미국 주식 리서치 · NVDA", "미국 주식 리서치 · MSFT"], script: [
    ["prompt", "새 지시를 받음", 2], ["web", "웹 · 분기 실적 발표문", 4], ["read", "읽기 · 10-Q 재무제표", 4], ["output", "산출물 · 실적 요약", 5],
    ["?test", "검토 · 수치 원문 대조", 4], ["wait", "사용자 확인 대기", 5], ["done", "응답 완료", 2]] },
];
// 실패했을 때 붙는 복구 각본
const RECOVER = {
  test: (t) => [["fail", `실패 · ${t}`, 2], ["read", "읽기 · 오류 기록", 2], ["edit", "수정 · 원인 고침", 4], ["test", `재검사 · ${t.replace(/^(테스트|검토) · /, "")}`, 4]],
  run: (t) => [["fail", `실패 · ${t}`, 2], ["wait", "연결 재시도 대기", 4], ["run", `재시도 · ${t.replace(/^도구 · /, "")}`, 3]],
};

// 재현 가능한 난수(시드 고정)
export function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function createSim({ seed = 7, start = Date.now(), failRate = 0.35, cast = CAST } = {}) {
  const r = rng(seed);
  const sim = { r, t: 0, start, failRate, nextId: 1, events: [], stats: { done: 0, fails: 0, recovered: 0 }, actors: [] };
  cast.forEach((c, i) => sim.actors.push(newRun(sim, c, 0, 400 + i * 1300)));
  return sim;
}
function newRun(sim, c, run, at) {
  return { c, run, session: `sim-${c.key}-${run + 1}`, project: c.projects[run % c.projects.length], queue: c.script.map((s) => [...s]), nextAt: at, failing: false };
}
const jitter = (sim, sec) => Math.round(sec * 1000 * (0.65 + sim.r() * 0.7));

// 사고 넣기 — 지금 일하는 AI 하나의 다음 검사를 반드시 실패하게
export function injectFailure(sim) {
  const live = sim.actors.filter((a) => a.queue.length > 1);
  if (!live.length) return null;
  const a = live[Math.floor(sim.r() * live.length)];
  a.forceFail = true;
  if (!a.queue.some(([k]) => k === "?test" || k === "?run")) a.queue.splice(1, 0, ["?test", "검토 · 긴급 점검", 3]);
  return a.c.agent;
}

// dt(ms)만큼 시간을 흘리고 새로 생긴 이벤트를 돌려준다
export function tick(sim, dt) {
  sim.t += dt; const out = [];
  for (let i = 0; i < sim.actors.length; i++) {
    let a = sim.actors[i], guard = 0;
    while (a.nextAt <= sim.t && guard++ < 500) {
      if (!a.queue.length) { a = sim.actors[i] = newRun(sim, a.c, a.run + 1, a.nextAt + jitter(sim, 7)); continue; }
      let [kind, title, sec] = a.queue.shift();
      if (kind[0] === "?") {
        kind = kind.slice(1);
        const fail = a.forceFail || (!a.failing && sim.r() < sim.failRate);
        a.forceFail = false;
        if (fail) { a.failing = true; sim.stats.fails++; a.queue.unshift(...RECOVER[kind](title).slice(1)); kind = "fail"; title = `실패 · ${title}`; sec = 2; }
      } else if (a.failing && (kind === "test" || kind === "run") && /^(재검사|재시도)/.test(title)) { a.failing = false; sim.stats.recovered++; }
      if (kind === "done") sim.stats.done++;
      const e = { id: 0, at: new Date(sim.start + a.nextAt).toISOString(), session: a.session, source: a.c.source, agent: a.c.agent, project: a.project, kind, title, detail: kind === "fail" ? "시뮬레이션에서 일부러 낸 실패입니다" : null, sim: true };
      out.push(e);
      a.nextAt += jitter(sim, sec);
    }
  }
  out.sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : 0)).forEach((e) => { e.id = sim.nextId++; sim.events.push(e); }); // 시간 순으로 번호
  if (sim.events.length > 600) sim.events.splice(0, sim.events.length - 600);
  return out;
}
export const simNow = (sim) => sim.start + sim.t;
