// Atelier AX · AI 작업 브리지 — 어떤 AI 도구든 작업 이벤트를 보내면 스튜디오가 실시간으로 보여 준다(보기 전용).
// 저장: Supabase(PostgREST) 표 atelier_events. 서버 함수만 service role 키로 접근하고, 브라우저는 /api/bridge/feed 로만 읽는다.

export const KINDS = ["session", "prompt", "read", "search", "web", "edit", "run", "test", "tool", "agent", "output", "wait", "done", "fail", "note"];
const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

export function bridgeStatus(env = process.env) {
  const miss = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "BRIDGE_TOKEN", "STUDIO_ACCESS_CODE"].filter((k) => !env[k]);
  return miss.length ? { bridge: false, bridgeReason: `서버 환경변수 없음: ${miss.join(", ")}` } : { bridge: true };
}
const same = (a, b) => { if (!b || a.length !== b.length) return false; let d = 0; for (let i = 0; i < b.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
export const senderOk = (req, env = process.env) => same((req.headers.get("authorization") || "").replace(/^Bearer\s+/i, ""), env.BRIDGE_TOKEN || "");
export const viewerOk = (req, env = process.env) => same(req.headers.get("x-studio-code") || "", env.STUDIO_ACCESS_CODE || "");

// 흔한 비밀값 모양은 저장 전에 가린다(완벽하지 않음 — 보내는 쪽에서도 조심)
const SECRET = [/\b(?:sk|rk|pk)-[A-Za-z0-9_-]{12,}/g, /\bgh[pousr]_[A-Za-z0-9]{20,}/g, /\bxox[abprs]-[A-Za-z0-9-]{10,}/g, /\bAKIA[0-9A-Z]{16}\b/g, /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}/g,
  /(bearer\s+)[A-Za-z0-9._-]{12,}/gi, /((?:password|passwd|secret|token|api[_-]?key)\s*[=:]\s*)("[^"]*"|'[^']*'|\S+)/gi];
export function redact(s) { let t = String(s ?? ""); for (const re of SECRET) t = t.replace(re, (m, a) => (typeof a === "string" && a && m.startsWith(a) ? a + "[가림]" : "[가림]")); return t; }

export function normEvent(e, now = Date.now()) {
  if (!e || typeof e !== "object") return null;
  const session = clip(e.session, 80), kind = KINDS.includes(e.kind) ? e.kind : "note";
  if (!session) return null;
  const at = Date.parse(e.at); const ok = Number.isFinite(at) && Math.abs(at - now) < 864e5;
  return {
    session, kind, at: new Date(ok ? at : now).toISOString(),
    source: clip(e.source, 30) || "unknown", agent: clip(e.agent, 40) || "AI", project: clip(e.project, 60) || null,
    title: redact(clip(e.title, 160)) || kind, detail: e.detail ? redact(String(e.detail).slice(0, 2000)) : null,
  };
}

// 세션 요약은 화면(시뮬레이션)과 같이 쓴다
export { sessions } from "../../public/studio/bridge.js";

// ── Supabase REST ──
const rest = (env, path, init = {}) => fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, { ...init,
  headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "content-type": "application/json", ...(init.headers || {}) } });
export async function insertEvents(rows, env = process.env) {
  const r = await rest(env, "atelier_events", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify(rows) });
  if (!r.ok) throw new Error(`저장 실패 (${r.status})`);
}
export async function recentEvents(env = process.env, hours = 24, limit = 600) {
  const since = new Date(Date.now() - hours * 36e5).toISOString();
  const r = await rest(env, `atelier_events?select=id,at,session,source,agent,project,kind,title,detail&at=gte.${encodeURIComponent(since)}&order=id.desc&limit=${limit}`);
  if (!r.ok) throw new Error(`읽기 실패 (${r.status})`);
  return (await r.json()).reverse();
}
