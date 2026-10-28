// Atelier AX · 모델하우스 평면 — 작업 종류마다 '자리'가 있고, AI 말이 하는 일에 따라 자리를 옮겨 다닌다(아이소메트릭 SVG).
import { iso, box } from "./board.js";
import { SRC_STYLE, srcStyle } from "./bridge.js";
export { SRC_STYLE, srcStyle };

// 3×3 배치. kinds = 그 자리로 보내는 이벤트 종류
export const STATIONS = [
  { id: "desk", name: "지시 데스크", gx: 0, gy: 0, kinds: ["prompt", "session"] },
  { id: "library", name: "자료실", gx: 4, gy: 0, kinds: ["read", "search"] },
  { id: "web", name: "웹 창구", gx: 8, gy: 0, kinds: ["web"] },
  { id: "bench", name: "작업대", gx: 0, gy: 4, kinds: ["edit", "output"] },
  { id: "terminal", name: "실행실", gx: 4, gy: 4, kinds: ["run", "tool", "agent"] },
  { id: "lab", name: "검사대", gx: 8, gy: 4, kinds: ["test"] },
  { id: "lounge", name: "대기석", gx: 0, gy: 8, kinds: ["wait", "note"] },
  { id: "gate", name: "완료 게이트", gx: 8, gy: 8, kinds: ["done"] },
];
const BY = Object.fromEntries(STATIONS.map((s) => [s.id, s]));
// 실패는 하던 자리에서 붉게 표시(자리를 옮기지 않음)
export const stationFor = (kind, prev = "desk") => kind === "fail" ? prev : (STATIONS.find((s) => s.kinds.includes(kind)) || BY.desk).id;


const W = 2.6, D = 2.6; // 자리 크기(격자)
// 같은 자리에 여럿이면 네 귀퉁이에 나눠 선다
const SLOTS = [[0.4, 1.8], [1.8, 0.4], [0.75, 0.75], [1.9, 1.9]];
export function spot(stationId, slot = 0) { const s = BY[stationId] || BY.desk, [a, b] = SLOTS[slot % 4]; return iso(s.gx + a, s.gy + b, 0.35); }

export function scene() {
  const floorPts = [iso(-1, -1, 0), iso(11.6, -1, 0), iso(11.6, 11.6, 0), iso(-1, 11.6, 0)].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  // 통로(자리 사이 점선) — 일의 대략적인 흐름
  const walk = [["desk", "library"], ["library", "web"], ["library", "bench"], ["bench", "terminal"], ["terminal", "lab"], ["lab", "gate"], ["bench", "lounge"]]
    .map(([a, b]) => { const p = iso(BY[a].gx + W / 2, BY[a].gy + D / 2, 0), q = iso(BY[b].gx + W / 2, BY[b].gy + D / 2, 0); return `<path class="walk" d="M${p[0].toFixed(1)} ${p[1].toFixed(1)} L${q[0].toFixed(1)} ${q[1].toFixed(1)}"/>`; }).join("");
  // 앞(아래)에 있는 자리를 나중에 그려야 겹침이 맞는다. 이름은 자리 윗면 앞쪽에.
  const sts = STATIONS.slice().sort((a, b) => a.gx + a.gy - (b.gx + b.gy)).map((s) => { const lab = iso(s.gx + W - 0.45, s.gy + D - 0.45, 0.35);
    return `<g class="st ${s.id}" data-st="${s.id}">${box(s.gx, s.gy, 0, W, D, 0.35, "pad")}<text class="st-n" x="${lab[0].toFixed(1)}" y="${(lab[1] - 2).toFixed(1)}">${s.name}<tspan class="st-c" dx="5"></tspan></text></g>`; }).join("");
  const xs = [iso(-1, 11.6, 0)[0], iso(11.6, -1, 0)[0]], ys = [iso(-1, -1, 0)[1], iso(11.6, 11.6, 0)[1]];
  return `<svg class="floor" viewBox="${(xs[0] - 20).toFixed(0)} ${(ys[0] - 46).toFixed(0)} ${(xs[1] - xs[0] + 40).toFixed(0)} ${(ys[1] - ys[0] + 70).toFixed(0)}" role="img" aria-label="AI 작업 모델하우스 평면 — 자리마다 하는 일이 다르고, AI가 지금 하는 일의 자리에 서 있습니다">
    <polygon class="ground" points="${floorPts}"/>${walk}${sts}<g class="pawns"></g></svg>`;
}
export function pawnHTML(key, source, label) {
  const [col, ini] = srcStyle(source);
  return `<g class="fp ${col}" data-pawn="${key}"><ellipse class="sh" rx="10" ry="5"/><path class="body" d="M-7 0 L0 -22 L7 0 Z"/><circle class="head" cy="-28" r="11"/><text class="ini" y="-24.5">${ini}</text>
    <g class="tag"><rect x="-24" y="-57" width="48" height="16" rx="8"/><text y="-45.5">${label}</text></g></g>`;
}
