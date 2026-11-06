// Atelier AX · AI 작업 브리지 화면 조각 — 세션마다 한 줄 레인, 이벤트는 모양·색으로(글 대신).
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const KIND = {
  session: ["시작", "ink"], prompt: ["지시", "ink"], read: ["읽기", "stone"], search: ["찾기", "stone"], web: ["웹", "stone"],
  edit: ["수정", "green"], run: ["명령", "blue"], test: ["테스트", "yellow"], tool: ["도구", "stone"], agent: ["하위 에이전트", "blue"],
  output: ["산출물", "green"], wait: ["대기", "amber"], done: ["완료", "ink"], fail: ["실패", "red"], note: ["메모", "stone"],
};
export const STATE = { live: ["작업 중", "work"], wait: ["입력 대기", "wait"], done: ["완료", "good"], fail: ["실패", "bad"], idle: ["조용함", "idle"] };
const SRC = { "claude-code": "Claude Code", make: "Make", notion: "Notion", gemini: "Gemini", openai: "ChatGPT", cursor: "Cursor" };
export const srcName = (s) => SRC[s] || s;
export const SRC_STYLE = { "claude-code": ["blue", "CC"], gemini: ["yellow", "GE"], make: ["green", "MK"], openai: ["red", "GP"] };
export const srcStyle = (s) => SRC_STYLE[s] || ["ink", String(s || "AI").slice(0, 2).toUpperCase()];

export const shape = (k) => k === "edit" || k === "output" ? '<rect x="-6" y="-6" width="12" height="12" rx="2"/>'
  : k === "test" ? '<rect x="-6" y="-6" width="12" height="12" rx="1" transform="rotate(45)"/>'
  : k === "run" || k === "agent" ? '<circle r="6.5"/>'
  : k === "fail" ? '<path d="M-6 -6 L6 6 M6 -6 L-6 6"/>'
  : k === "done" ? '<path d="M-4 7 L-4 -8 L7 -4 L-4 0"/>'
  : k === "prompt" || k === "session" ? '<circle r="6" class="ring"/>'
  : k === "wait" ? '<circle r="6"/>' : '<circle r="3.5"/>';

// 세션 요약 — 최근 이벤트(시간 오름차순)에서 계산. 2분 넘게 소식 없으면 '조용함'. (서버 api/_lib/bridge.js 도 이것을 쓴다)
export function sessions(events, now = Date.now()) {
  const m = new Map();
  for (const e of events) {
    const s = m.get(e.session) || { session: e.session, source: e.source, agent: e.agent, project: e.project, first: e.at, count: 0, kinds: {} };
    s.last = e.at; s.lastKind = e.kind; s.lastTitle = e.title; s.count++; s.kinds[e.kind] = (s.kinds[e.kind] || 0) + 1; if (e.project) s.project = e.project;
    m.set(e.session, s);
  }
  return [...m.values()].map((s) => ({ ...s, state: s.lastKind === "fail" ? "fail" : s.lastKind === "done" ? "done" : s.lastKind === "wait" ? "wait" : now - Date.parse(s.last) > 12e4 ? "idle" : "live" }))
    .sort((a, b) => Date.parse(b.last) - Date.parse(a.last));
}

// 세션 레인 — 최근 이벤트 최대 60개를 왼쪽→오른쪽으로
export function lane(s, evs, seen) {
  const L = evs.slice(-60), n = L.length, step = 26, x0 = 24, W = Math.max(x0 + (n - 1) * step + 40, 120);
  const nodes = L.map((e, i) => { const [label, col] = KIND[e.kind] || KIND.note;
    return `<g class="ev ${e.kind} ${col} ${e.id > seen && seen ? "fresh" : ""}" transform="translate(${(x0 + i * step).toFixed(1)} 34)"><title>${esc(new Date(e.at).toLocaleTimeString("ko-KR"))} · ${esc(label)} — ${esc(e.title)}</title>${shape(e.kind)}</g>`; }).join("");
  const tx = x0 + Math.max(0, n - 1) * step;
  const live = s.state === "live";
  return `<div class="lane-scroll"><svg class="lane-svg" viewBox="0 0 ${W} 64" width="${W}" height="64" role="img" aria-label="${esc(srcName(s.source))} 작업 ${n}건 — 마지막: ${esc(s.lastTitle)}">
    <line class="rail" x1="${x0}" y1="34" x2="${W - 8}" y2="34"/><line class="rail done" x1="${x0}" y1="34" x2="${tx.toFixed(1)}" y2="34"/>${nodes}
    <g class="pawn2 ${s.state} ${srcStyle(s.source)[0]}" transform="translate(${tx.toFixed(1)} 10)"><circle r="10"/><text dy="3.4">${esc(srcStyle(s.source)[1])}</text></g></svg></div>`;
}
