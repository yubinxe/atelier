#!/usr/bin/env node
// Claude Code 훅 → Atelier AX 작업 브리지. Claude Code 가 훅 입력(JSON)을 stdin 으로 넘기면 작업 이벤트 하나로 바꿔 보낸다.
// 환경변수: ATELIER_URL(예: https://atelier-ax.vercel.app) · ATELIER_BRIDGE_TOKEN · ATELIER_SEND_PROMPTS=1(지시 문장까지 보낼 때)
// 원칙: 절대 Claude Code 를 막지 않는다 — 실패해도 조용히 exit 0, 2초 제한, 출력 없음.
import path from "node:path";
import { pathToFileURL } from "node:url";

const short = (s, n = 120) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const file = (p, cwd) => (p ? (cwd && String(p).startsWith(cwd) ? path.relative(cwd, p) : path.basename(String(p))) : "");

export function toEvent(h, env = process.env) {
  const ev = h.hook_event_name, ti = h.tool_input || {}, cwd = h.cwd || "";
  const base = { session: h.session_id, source: "claude-code", agent: "Claude Code", project: cwd ? path.basename(cwd) : null };
  if (ev === "SessionStart") return { ...base, kind: "session", title: `세션 시작${h.source ? ` (${h.source})` : ""}` };
  if (ev === "SessionEnd") return { ...base, kind: "done", title: "세션 종료" };
  if (ev === "UserPromptSubmit") return { ...base, kind: "prompt", title: env.ATELIER_SEND_PROMPTS === "1" ? short(h.prompt) : "새 지시를 받음" };
  if (ev === "Notification") return { ...base, kind: "wait", title: short(h.message) || "사용자 입력 대기" };
  if (ev === "Stop") return { ...base, kind: "done", title: "응답 완료" };
  if (ev === "SubagentStop") return { ...base, kind: "agent", title: "하위 에이전트 완료" };
  if (ev !== "PostToolUse" && ev !== "PostToolUseFailure") return null;
  const t = h.tool_name || "", r = h.tool_response, failed = ev === "PostToolUseFailure" || !!(r && typeof r === "object" && (r.is_error || r.error || r.interrupted));
  let kind = "tool", title = t;
  if (/^(Read|NotebookRead)$/.test(t)) { kind = "read"; title = `읽기 · ${file(ti.file_path || ti.notebook_path, cwd)}`; }
  else if (/^(Edit|MultiEdit|Write|NotebookEdit)$/.test(t)) { kind = "edit"; title = `${t === "Write" ? "작성" : "수정"} · ${file(ti.file_path || ti.notebook_path, cwd)}`; }
  else if (t === "Bash") { const c = short(ti.command, 100); kind = /\b(test|pytest|jest|vitest|mocha|go test|cargo test|npm (run )?test)\b/.test(c) ? "test" : "run"; title = `${kind === "test" ? "테스트" : "명령"} · ${c}`; }
  else if (/^(Grep|Glob|LS)$/.test(t)) { kind = "search"; title = `찾기 · ${short(ti.pattern || ti.path, 60)}`; }
  else if (/^(WebFetch|WebSearch)$/.test(t)) { kind = "web"; title = `웹 · ${short(ti.query || ti.url, 80)}`; }
  else if (/^(Task|Agent)$/.test(t)) { kind = "agent"; title = `하위 에이전트 · ${short(ti.description || ti.subagent_type, 60)}`; }
  else if (/^mcp__/.test(t)) { title = `연결 도구 · ${t.split("__").slice(1).join(" · ")}`; }
  return { ...base, kind: failed ? "fail" : kind, title: failed ? `실패 · ${title}` : title, detail: failed ? short(typeof r === "string" ? r : r?.error || h.error || "", 400) : null };
}

async function main() {
  const url = process.env.ATELIER_URL, token = process.env.ATELIER_BRIDGE_TOKEN;
  if (!url || !token) return;
  let raw = ""; for await (const c of process.stdin) raw += c;
  const e = toEvent(JSON.parse(raw)); if (!e || !e.session) return;
  e.at = new Date().toISOString();
  await fetch(`${url.replace(/\/$/, "")}/api/bridge/events/`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(e), signal: AbortSignal.timeout(2000) });
}
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) main().catch(() => {}).finally(() => process.exit(0));
