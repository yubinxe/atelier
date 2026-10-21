// Atelier AX · Project Studio — 게임 보드. 단계 = 구역, 작업 = 칸, 승인 = 관문, 에이전트 = 말.
// 글을 읽지 않고 ‘어디까지 왔고, 누가 무엇을 하고, 어디서 멈추는지’를 한눈에 보게 한다. SVG 만 사용(라이브러리 없음).
import * as M from "./model.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const INITIAL = { planner: "기", designer: "디", developer: "개", qa: "검" };
const GATE = { scope: "범위", decisions: "설계", review: "검토", launch: "공개" };
const GATE_STATE = { closed: "잠김", wait: "결정 대기", open: "통과" };
const nodeLabel = (t) => `${t.title} — ${M.AGENTS[t.agent].name} · ${t.now ? "지금 할 차례" : t.status === "done" ? ({ fail: "실패", pass: "통과", unknown: "판정 없음" }[t.outcome] || "완료") : "대기"}`;

// 에이전트 말의 위치: 지금 할 작업 > 마지막으로 한 작업 > 처음 맡을 작업(흐리게)
function tokenSpots(p, B) {
  const flat = B.flatMap((z) => z.tasks), out = {};
  for (const k of Object.keys(M.AGENTS)) {
    const mine = flat.filter((t) => t.agent === k);
    const now = mine.find((t) => t.now), last = [...mine].reverse().find((t) => t.status === "done");
    out[k] = now ? { id: now.id, mode: "now" } : last ? { id: last.id, mode: "rest" } : mine[0] ? { id: mine[0].id, mode: "bench" } : null;
  }
  return out;
}

// ── 선형: 한 줄 트랙 ──
export function linear(p, live) {
  const B = M.board(p), W = 1000, Y = 112, L = 34, R = W - 30;
  const units = B.map((z) => Math.max(z.tasks.length, 3) + 1.4), per = (R - L) / units.reduce((a, b) => a + b, 0);
  let x = L; const pos = {}, zones = [], gates = [];
  B.forEach((z, i) => {
    const w = units[i] * per, x0 = x, x1 = x + w, n = z.tasks.length, pad = per * 0.7, step = n > 1 ? (w - pad * 2 - per * 0.5) / (n - 1) : 0;
    z.tasks.forEach((t, j) => (pos[t.id] = n > 1 ? x0 + pad + j * step : (x0 + x1) / 2 - per * 0.25));
    zones.push({ ...z, x0, x1 });
    if (z.gate) gates.push({ ...z.gate, x: x1 - per * 0.32, z });
    x = x1;
  });
  const flat = B.flatMap((z) => z.tasks), cur = flat.find((t) => t.now), lastDone = [...flat].reverse().find((t) => t.status === "done");
  const reach = p.status === "done" ? R : cur ? pos[cur.id] : lastDone ? pos[lastDone.id] : L;
  const node = (t) => {
    const cx = pos[t.id], col = M.AGENTS[t.agent].color, st = t.now ? "now" : t.status === "done" ? t.outcome || "done" : "todo";
    const live1 = live && live.task === t.id;
    return `<g class="nd ${st} ${col} ${live1 ? "live" : ""}" tabindex="0" role="button" data-node="${t.id}" aria-label="${esc(nodeLabel(t))}" transform="translate(${cx.toFixed(1)} ${Y})">
      <title>${esc(nodeLabel(t))}</title>${t.now ? '<circle class="halo" r="17"/>' : ""}<circle class="c" r="${t.now ? 10 : t.check ? 7 : 8}"/>
      ${st === "pass" ? '<path class="mk" d="M-3.5 0 L-1 2.6 L3.6 -2.6"/>' : st === "fail" ? '<path class="mk" d="M-3 -3 L3 3 M3 -3 L-3 3"/>' : ""}${t.check ? '<rect class="chk" x="-2" y="13" width="4" height="4" transform="rotate(45 0 15)"/>' : ""}${t.fix ? '<circle class="fixd" r="2.5" cy="-14"/>' : ""}</g>`;
  };
  const spots = tokenSpots(p, B);
  const toks = Object.entries(spots).filter(([, s]) => s).map(([k, s], i) => {
    const big = s.mode === "now", tx = pos[s.id], ty = big ? Y - 44 : Y - 38 - (i % 2) * 6;
    return `<g class="tok ${M.AGENTS[k].color} ${s.mode} ${live && live.agent === k ? "working" : ""}" data-tok="${k}" style="--tx:${tx.toFixed(1)}px;--ty:${ty}px" aria-hidden="true">
      <line x1="0" y1="${big ? 16 : 12}" x2="0" y2="${Y - ty - (big ? 12 : 10)}" class="stem"/><circle r="${big ? 16 : 12}"/><text dy="${big ? 5 : 4}" font-size="${big ? 14 : 11}">${INITIAL[k]}</text></g>`;
  }).join("");
  const svg = `<svg class="lin" viewBox="0 0 ${W} 206" role="group" aria-label="진행 트랙 — 칸을 누르면 그 작업으로 이동">
    ${zones.map((z) => `<g class="zone ${z.state}" data-stage="${z.i}"><rect x="${(z.x0 + 3).toFixed(1)}" y="16" width="${(z.x1 - z.x0 - 6).toFixed(1)}" height="182" rx="12"/>
      <text class="zn" x="${(z.x0 + 14).toFixed(1)}" y="164">${z.n}</text><text class="zt" x="${(z.x0 + 14).toFixed(1)}" y="164" dx="22">${esc(z.name)}</text>
      <text class="zc" x="${(z.x0 + 14).toFixed(1)}" y="184">${z.tasks.filter((t) => t.status === "done").length}/${z.tasks.length}</text></g>`).join("")}
    <line class="track" x1="${L}" y1="${Y}" x2="${R}" y2="${Y}"/><line class="track done" x1="${L}" y1="${Y}" x2="${reach.toFixed(1)}" y2="${Y}"/>
    ${gates.map((g) => `<g class="gate ${g.state}" transform="translate(${g.x.toFixed(1)} ${Y})"><title>관문 · ${GATE[g.gate]} — ${GATE_STATE[g.state]}</title><rect x="-8" y="-8" width="16" height="16" rx="2" transform="rotate(45)"/><text y="-16">${GATE[g.gate]}</text></g>`).join("")}
    ${flat.map(node).join("")}${toks}</svg>`;
  return svg;
}

// ── 입체: 아이소메트릭 계단 ──
const IX = 21, IY = 10.5, IZ = 22;
const iso = (gx, gy, z) => [(gx - gy) * IX, (gx + gy) * IY - z * IZ];
const pts = (a) => a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
function box(gx, gy, z, w, d, h, cls) { // 바닥 모서리(gx,gy,z), 너비 w(gx) 깊이 d(gy) 높이 h
  const P = (a, b, c) => iso(gx + a, gy + b, z + c);
  const top = [P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)], left = [P(0, d, h), P(w, d, h), P(w, d, 0), P(0, d, 0)], right = [P(w, 0, h), P(w, d, h), P(w, d, 0), P(w, 0, 0)];
  return `<g class="${cls}"><polygon class="l" points="${pts(left)}"/><polygon class="r" points="${pts(right)}"/><polygon class="t" points="${pts(top)}"/></g>`;
}
export function cubes(p, live) {
  const B = M.board(p), COLS = 4, ST = 6.2, RISE = 1.35;
  const plats = B.map((z, i) => ({ z, gx: i * ST, gy: -i * 2.6, h: i * RISE, rows: Math.max(2, Math.ceil(z.tasks.length / COLS)) }));
  const spots = tokenSpots(p, B), where = {};
  let body = "";
  plats.forEach((pl, i) => {
    const { z } = pl, w = COLS + 0.6, d = pl.rows + 0.6;
    if (i) { const a = iso(plats[i - 1].gx + w, plats[i - 1].gy + d / 2, plats[i - 1].h), b = iso(pl.gx, pl.gy + d / 2, pl.h); body += `<path class="link ${z.state === "next" ? "" : "on"}" d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}"/>`; }
    body += `<g class="plat ${z.state}" data-stage="${z.i}">${box(pl.gx, pl.gy, pl.h - 0.45, w, d, 0.45, "slab")}`;
    z.tasks.forEach((t, j) => {
      const cx = pl.gx + 0.4 + (j % COLS), cy = pl.gy + 0.4 + Math.floor(j / COLS), col = M.AGENTS[t.agent].color;
      const st = t.now ? "now" : t.status === "done" ? t.outcome || "done" : "todo", hh = st === "todo" ? 0.12 : t.now ? 0.95 : 0.62;
      where[t.id] = { gx: cx + 0.4, gy: cy + 0.4, z: pl.h + hh };
      body += `<g class="cube ${st} ${col} ${live && live.task === t.id ? "live" : ""}" tabindex="0" role="button" data-node="${t.id}" aria-label="${esc(nodeLabel(t))}"><title>${esc(nodeLabel(t))}</title>${box(cx, cy, pl.h, 0.8, 0.8, hh, "bx")}</g>`;
    });
    const lab = iso(pl.gx + w, pl.gy + d, pl.h - 0.45);
    body += `<text class="pl-n" x="${lab[0].toFixed(1)}" y="${(lab[1] + 20).toFixed(1)}">${z.n} ${esc(z.name)}</text>`;
    if (z.gate) { const f = iso(pl.gx + w - 0.15, pl.gy + 0.15, pl.h); body += `<g class="flag ${z.gate.state}" transform="translate(${f[0].toFixed(1)} ${f[1].toFixed(1)})"><title>관문 · ${GATE[z.gate.gate]} — ${GATE_STATE[z.gate.state]}</title><line x1="0" y1="0" x2="0" y2="-40"/><path d="M0 -40 L17 -34 L0 -28 Z"/></g>`; }
    body += "</g>";
  });
  const toks = Object.entries(spots).filter(([, s]) => s && where[s.id]).map(([k, s]) => {
    const w0 = where[s.id], [x, y] = iso(w0.gx, w0.gy, w0.z), big = s.mode === "now";
    return `<g class="pawn ${M.AGENTS[k].color} ${s.mode} ${live && live.agent === k ? "working" : ""}" style="--tx:${x.toFixed(1)}px;--ty:${y.toFixed(1)}px" aria-hidden="true"><ellipse rx="${big ? 9 : 7}" ry="${big ? 4.5 : 3.5}"/><path d="M${big ? -6 : -5} 0 L0 ${big ? -20 : -15} L${big ? 6 : 5} 0 Z"/><circle cy="${big ? -26 : -20}" r="${big ? 10 : 8}"/><text y="${big ? -22 : -17}" font-size="${big ? 11 : 9}">${INITIAL[k]}</text></g>`;
  }).join("");
  // 보이는 범위에 맞춘 viewBox
  const xs = [], ys = []; plats.forEach((pl) => { for (const [a, b] of [[0, 0], [COLS + 0.6, 0], [0, pl.rows + 0.6], [COLS + 0.6, pl.rows + 0.6]]) { const [x, y] = iso(pl.gx + a, pl.gy + b, pl.h); xs.push(x); ys.push(y); } });
  const x0 = Math.min(...xs) - 30, x1 = Math.max(...xs) + 40, y0 = Math.min(...ys) - 64, y1 = Math.max(...ys) + 34;
  return `<svg class="iso" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${(x1 - x0).toFixed(0)} ${(y1 - y0).toFixed(0)}" role="group" aria-label="입체 보드 — 단계마다 한 층, 블록 하나가 작업 하나">${body}${toks}</svg>`;
}

// ── 상단 HUD: 레벨·경험치·관문·업적·팀 ──
export function hud(p) {
  const g = M.game(p), pend = M.pendingApproval(p), gatesAll = M.STAGES.filter((s) => s.gate);
  return `<div class="hud">
    <div class="lvl"><span class="k">팀 레벨</span><b>${g.lv}</b><span class="xpbar" title="${g.into}/${g.per} XP"><i style="--w:${(g.into / g.per) * 100}%"></i></span><small>${g.xp} XP</small></div>
    <div class="gates" aria-label="관문 ${g.gates}/${gatesAll.length} 통과">${gatesAll.map((s) => { const a = p.approvals.find((x) => x.gate === s.gate && x.status === "approved"), w = pend && pend.gate === s.gate; return `<span class="g ${a ? "open" : w ? "wait" : ""}" title="${GATE[s.gate]} — ${a ? "통과" : w ? "결정 대기" : "잠김"}"><i aria-hidden="true"></i>${GATE[s.gate]}</span>`; }).join("")}</div>
    <div class="crew">${Object.entries(g.agents).map(([k, a]) => `<span class="mate ${M.AGENTS[k].color}" title="${esc(M.AGENTS[k].name)} · Lv ${a.lv} · ${a.xp} XP"><i aria-hidden="true">${INITIAL[k]}</i><b>Lv ${a.lv}</b><span class="xpbar sm"><i style="--w:${(a.into / M.LEVEL_XP) * 100}%"></i></span></span>`).join("")}</div>
    <ul class="badges" aria-label="업적">${g.badges.map((b) => `<li class="${b.got ? "got" : ""}" title="${esc(b.name)}${b.got ? " — 달성" : " — 아직"}">${esc(b.name)}</li>`).join("")}</ul>
  </div>`;
}
