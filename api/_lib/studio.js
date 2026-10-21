// Atelier AX · 스튜디오 실제 실행(LIVE) — 서버 공용 로직. 키·접근 코드는 서버 환경변수에만 있다.
// _lib 아래 파일은 Vercel 함수로 배포되지 않는다(밑줄 접두).
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5-5";
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

// 실제 실행은 API 키와 접근 코드가 모두 있어야 켜진다(공개 사이트에서 남이 비용을 쓰지 못하게).
export function liveStatus(env = process.env) {
  if (!env.ANTHROPIC_API_KEY) return { live: false, reason: "서버에 ANTHROPIC_API_KEY 가 없습니다" };
  if (!env.STUDIO_ACCESS_CODE) return { live: false, reason: "서버에 STUDIO_ACCESS_CODE 가 없습니다(접근 코드 없이 공개 실행하지 않음)" };
  return { live: true, model: MODEL };
}
export function checkCode(req, env = process.env) {
  const got = req.headers.get("x-studio-code") || "", want = env.STUDIO_ACCESS_CODE || "";
  if (!want || got.length !== want.length) return false;
  let d = 0; for (let i = 0; i < want.length; i++) d |= got.charCodeAt(i) ^ want.charCodeAt(i);
  return d === 0;
}

// 인스턴스당 간이 속도 제한(분당). 인스턴스가 여러 개면 느슨해진다 — 비용 상한은 max_tokens·접근 코드가 맡는다.
const hits = new Map();
export function rateLimited(key, perMin = 30, now = Date.now()) {
  const w = (hits.get(key) || []).filter((t) => now - t < 60e3); w.push(now); hits.set(key, w);
  return w.length > perMin;
}

export const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

// ── 설계도 ──
export const PLAN_SCHEMA = {
  type: "object", additionalProperties: false, required: ["title", "goal", "features", "decisions"],
  properties: {
    title: { type: "string", description: "프로젝트 이름, 28자 이내" },
    goal: { type: "string", description: "한두 문장 목표" },
    features: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "why", "accept", "must"],
      properties: { name: { type: "string" }, why: { type: "string" }, accept: { type: "string", description: "검사로 확인할 수 있는 완료 기준" }, must: { type: "boolean" } } } },
    decisions: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "q", "opts"],
      properties: { id: { type: "string" }, q: { type: "string" }, opts: { type: "array", items: { type: "object", additionalProperties: false, required: ["k", "label", "pro", "cost", "risk"],
        properties: { k: { type: "string", enum: ["A", "B"] }, label: { type: "string" }, pro: { type: "string" }, cost: { type: "string" }, risk: { type: "string" } } } } } } },
  },
};
const CAT = { web: "웹사이트·서비스 제작", content: "콘텐츠·마케팅 제작", automation: "업무 자동화" };
export function planPrompt(idea, category) {
  return {
    system: "너는 비개발자의 아이디어를 제작 설계도로 바꾸는 기획 담당 AI다. 한국어로, 쉬운 말로 쓴다. 기능은 4~7개, 각 기능의 완료 기준(accept)은 검사로 참/거짓을 가릴 수 있는 한 문장이어야 한다. must=true 는 첫 공개에 꼭 필요한 기능만. 결정(decisions)은 사용자가 골라야 범위·비용이 크게 달라지는 것 1~3개, 각 선택지는 A·B 두 개, cost 는 '작음/중간/큼 (이유)' 형식. 개인정보·결제·법령이 관련되면 위험(risk)에 적는다. 과장하지 않는다.",
    user: `분야: ${CAT[category] || CAT.web}\n아이디어: ${idea}`,
  };
}
// 모델 출력 → 화면이 믿고 쓸 수 있는 형태로 정리(길이·개수 제한)
export function cleanPlan(raw) {
  const features = (Array.isArray(raw?.features) ? raw.features : []).slice(0, 8)
    .map((f) => ({ name: clip(f.name, 30), why: clip(f.why, 90), accept: clip(f.accept, 120), must: !!f.must })).filter((f) => f.name && f.accept);
  const decisions = (Array.isArray(raw?.decisions) ? raw.decisions : []).slice(0, 3).map((d, i) => ({
    id: "ai" + (i + 1), q: clip(d.q, 60),
    opts: (Array.isArray(d.opts) ? d.opts : []).slice(0, 2).map((o, j) => ({ k: "AB"[j], label: clip(o.label, 30), pro: clip(o.pro, 90), cost: clip(o.cost, 60), risk: clip(o.risk, 90) })),
  })).filter((d) => d.q && d.opts.length === 2);
  if (features.length < 2) throw new Error("설계도에 기능이 너무 적습니다");
  return { title: clip(raw.title, 28) || "새 프로젝트", goal: clip(raw.goal, 200), features, decisions };
}

// ── 작업 실행 ──
// 결과 첫 줄은 '요약:' 한 줄, 검사 작업은 마지막 줄에 '판정: 통과' 또는 '판정: 실패 — 사유'.
export function runPrompt(b) {
  const t = b.task || {}, check = !!t.check;
  const prior = (Array.isArray(b.prior) ? b.prior : []).slice(-6).map((x) => `### ${clip(x.title, 40)}\n${String(x.output || "").slice(0, 1500)}`).join("\n\n");
  return {
    system: `너는 Atelier AX 스튜디오의 ${clip(t.agentName, 20)}다. 맡은 작업 하나만 한다. 한국어, 간결하게(최대 350단어).
형식: 첫 줄은 반드시 '요약: '으로 시작하는 한 문장. 그다음 산출물을 마크다운으로.
코드를 실제로 실행하거나 배포할 수 없다 — 실행한 척하지 말고, 문서·코드 초안·검토 의견만 쓴다.${check ? `
이 작업은 검사다. 앞 작업 산출물을 완료 기준에 비추어 '검토'한다(실행 아님). 근거가 부족하면 실패로 판정한다.
마지막 줄은 반드시 '판정: 통과' 또는 '판정: 실패 — <사유 한 문장>'.` : ""}`,
    user: `프로젝트: ${clip(b.title, 40)}\n목표: ${clip(b.goal, 200)}\n작업: ${clip(t.title, 60)}\n사용 스킬: ${clip((t.skills || []).join(", "), 120)}\n완료 기준: ${clip(t.accept, 160)}${prior ? `\n\n앞 작업 산출물(최근):\n${prior}` : ""}`,
  };
}
export function parseRun(text, check) {
  const s = String(text || "").trim();
  const summary = clip((s.match(/^요약:\s*(.+)$/m) || [])[1] || s.split("\n")[0], 120);
  if (!check) return { outcome: "done", summary };
  const v = s.match(/판정:\s*(통과|실패)(?:\s*[—–-]\s*(.+))?\s*$/m);
  if (!v) return { outcome: "unknown", summary, note: "판정 줄이 없어 결과를 정하지 않았습니다(미검증)" };
  return { outcome: v[1] === "통과" ? "pass" : "fail", summary, note: clip(v[2] || "", 140) };
}

export const client = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
// 공통 요청 — Opus 5.5 + 서버 측 거절 대체(fallbacks: default)
export const baseReq = (effort, max) => ({ model: MODEL, max_tokens: max, output_config: { effort }, betas: [FALLBACK_BETA], fallbacks: "default" });
