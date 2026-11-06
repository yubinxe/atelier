import { test } from "node:test";
import assert from "node:assert/strict";
import { normEvent, redact, sessions, bridgeStatus, senderOk } from "../api/_lib/bridge.js";
import { toEvent } from "../connectors/claude-code/atelier-hook.mjs";

test("브리지: 환경변수 4개 모두 있어야 켜짐, 토큰 비교", () => {
  assert.equal(bridgeStatus({}).bridge, false);
  assert.equal(bridgeStatus({ SUPABASE_URL: "u", SUPABASE_SERVICE_ROLE_KEY: "k", BRIDGE_TOKEN: "t", STUDIO_ACCESS_CODE: "c" }).bridge, true);
  const req = (h) => ({ headers: new Headers(h) });
  assert.equal(senderOk(req({ authorization: "Bearer tok" }), { BRIDGE_TOKEN: "tok" }), true);
  assert.equal(senderOk(req({ authorization: "Bearer tok2" }), { BRIDGE_TOKEN: "tok" }), false);
  assert.equal(senderOk(req({}), { BRIDGE_TOKEN: "" }), false);
});

test("브리지: 이벤트 정리 — 세션 필수, 종류 제한, 길이 제한, 비밀값 가림", () => {
  assert.equal(normEvent({ kind: "edit" }), null);
  const e = normEvent({ session: "s1", kind: "weird", title: "x".repeat(500), at: "1999-01-01" }, 1e12);
  assert.equal(e.kind, "note"); assert.equal(e.title.length, 160); assert.equal(e.at, new Date(1e12).toISOString());
  assert.match(redact("export ANTHROPIC_API_KEY=sk-ant-abcdefghijklmnop123"), /\[가림\]/); assert.equal(redact("키 sk-ant-abcdefghijklmnop123 끝"), "키 [가림] 끝");
  assert.doesNotMatch(redact("token: ghp_abcdefghijklmnopqrstuvwxyz0123"), /ghp_/);
  assert.equal(redact("curl -H 'Authorization: Bearer abcdefghijklmnop'"), "curl -H 'Authorization: Bearer [가림]'");
  assert.equal(redact("npm test"), "npm test");
});

test("브리지: 세션 요약 — 마지막 이벤트로 상태 결정", () => {
  const now = Date.parse("2026-10-28T00:10:00Z"), ev = (session, kind, min) => ({ session, kind, title: kind, source: "claude-code", agent: "Claude Code", at: new Date(now - min * 6e4).toISOString() });
  const s = sessions([ev("a", "edit", 5), ev("a", "run", 1), ev("b", "edit", 10), ev("b", "done", 9), ev("c", "edit", 30), ev("d", "fail", 1), ev("e", "wait", 1)], now);
  const st = Object.fromEntries(s.map((x) => [x.session, x.state]));
  assert.deepEqual(st, { a: "live", b: "done", c: "idle", d: "fail", e: "wait" });
  assert.equal(s.find((x) => x.session === "a").count, 2);
});

test("Claude Code 훅: 도구 사용 → 작업 이벤트, 지시 문장은 기본 비공개", () => {
  const b = { session_id: "S", cwd: "/home/u/atelier" };
  assert.deepEqual(toEvent({ ...b, hook_event_name: "PostToolUse", tool_name: "Edit", tool_input: { file_path: "/home/u/atelier/public/a.js" } }, {}).title, "수정 · public/a.js");
  assert.equal(toEvent({ ...b, hook_event_name: "PostToolUse", tool_name: "Bash", tool_input: { command: "npm test" } }, {}).kind, "test");
  assert.equal(toEvent({ ...b, hook_event_name: "PostToolUse", tool_name: "Bash", tool_input: { command: "git status" } }, {}).kind, "run");
  assert.equal(toEvent({ ...b, hook_event_name: "PostToolUseFailure", tool_name: "Bash", tool_input: { command: "x" }, error: "boom" }, {}).kind, "fail");
  assert.equal(toEvent({ ...b, hook_event_name: "UserPromptSubmit", prompt: "비밀 계획" }, {}).title, "새 지시를 받음");
  assert.equal(toEvent({ ...b, hook_event_name: "UserPromptSubmit", prompt: "계획" }, { ATELIER_SEND_PROMPTS: "1" }).title, "계획");
  assert.equal(toEvent({ ...b, hook_event_name: "Stop" }, {}).kind, "done");
  assert.equal(toEvent({ ...b, hook_event_name: "PreToolUse" }, {}), null);
  assert.equal(toEvent({ ...b, hook_event_name: "SessionStart" }, {}).project, "atelier");
});
