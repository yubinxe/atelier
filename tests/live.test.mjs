import { test } from "node:test";
import assert from "node:assert/strict";
import * as M from "../public/studio/model.js";
import { liveStatus, checkCode, cleanPlan, parseRun, runPrompt } from "../api/_lib/studio.js";

const plan = { title: "투자 분석", goal: "보유 종목 수익률을 본다", features: [{ name: "종목 입력", why: "기록", accept: "저장 후 다시 열어도 보인다", must: true }, { name: "수익률", why: "성과", accept: "공식과 같은 값", must: true }], decisions: [{ id: "x", q: "로그인?", opts: [{ k: "A", label: "없이", pro: "", cost: "작음", risk: "" }, { k: "B", label: "추가", pro: "", cost: "큼", risk: "" }] }] };
// 실제 실행 흉내: needs 를 받으면 주어진 결과로 다시 step
const liveDrive = (p, outcomeFor, stopAt) => {
  for (let i = 0, t = 1e12; i < 300 && p.status === "active"; i++) {
    t += 1000; let r = M.step(p, t);
    if (r.needs) r = M.step(r.p, t, { ...outcomeFor(r.needs), output: "요약: 했다", start: t - 500, end: t });
    p = r.p;
    if (r.blocked) { const a = M.pendingApproval(p); if (!a || a.gate === stopAt) return p; if (a.gate === "decisions") p.decisions.forEach((d) => (p = M.choose(p, d.id, "A", t))); p = M.approve(p, a.id, t); }
  }
  return p;
};

test("실제 실행: AI 설계도 사용, 결과 없이는 작업을 완료로 적지 않는다", () => {
  const p = M.createProject("미국 주식 포트폴리오 사이트", "web", 1, "live", plan);
  assert.equal(p.mode, "live"); assert.equal(p.title, "투자 분석"); assert.equal(p.features.length, 2); assert.deepEqual(p.decisions.map((d) => d.id), ["x"]);
  const r = M.step(p, 2);
  assert.ok(r.needs && r.needs.id === "t1"); assert.equal(r.p.tasks[0].status, "todo"); assert.equal(r.p.runs.length, 0);
  const e = M.step(p, 3, { outcome: "error", note: "네트워크" });
  assert.equal(e.p.tasks[0].status, "todo", "오류는 완료가 아님"); assert.match(e.blocked, /네트워크/);
});

test("실제 실행: 검사는 AI 검토로 기록, 판정 없음은 미검증, 실패는 수정·재검사(최대 2회)", () => {
  let p = M.createProject("예약 사이트", "web", 1, "live", plan);
  p = liveDrive(p, (t) => (!t.check ? { outcome: "done" } : t.check === "mobile" ? { outcome: "fail", note: "표 넘침" } : t.check === "a11y" ? { outcome: "unknown" } : { outcome: "pass" }), "review");
  const mob = p.evidence.find((e) => e.id === "e-mobile");
  assert.deepEqual(mob.runs.map((r) => r.result), ["fail", "fail", "fail"], "실패 반복은 2회 수정 뒤 멈춘다");
  assert.equal(p.tasks.filter((t) => t.fixFor === "mobile").length, 2);
  assert.equal(p.evidence.find((e) => e.id === "e-a11y").status, "unverified");
  assert.ok(p.runs.every((r) => r.demo === false));
  assert.match(M.summary(p).proof, /AI 검토/);
  p = liveDrive(p, () => ({ outcome: "done" }));
  assert.equal(p.evidence.find((e) => e.id === "e-deploy").status, "skipped", "배포는 연결 안 됨 → 실행 안 함");
});

test("보드·게임: 기록에서만 계산", () => {
  let p = M.createProject("투자 대시보드", "web", 1);
  let g = M.game(p); assert.equal(g.xp, 0); assert.ok(g.badges.every((b) => !b.got));
  const b = M.board(p); assert.equal(b.length, 6); assert.ok(b[0].tasks[0].now); assert.equal(b[0].gate.state, "closed");
  for (let i = 0; i < 3; i++) p = M.step(p, 10 + i).p;
  assert.equal(M.board(p)[0].gate.state, "wait");
  g = M.game(p); assert.equal(g.agents.planner.xp, 20); assert.ok(g.badges.find((x) => x.id === "first").got);
});

test("서버: 키·접근 코드 둘 다 있어야 실제 실행, 코드 비교, 출력 정리·판정 파싱", () => {
  assert.equal(liveStatus({}).live, false);
  assert.equal(liveStatus({ ANTHROPIC_API_KEY: "k" }).live, false);
  assert.equal(liveStatus({ ANTHROPIC_API_KEY: "k", STUDIO_ACCESS_CODE: "c" }).live, true);
  const req = (c) => ({ headers: new Headers(c ? { "x-studio-code": c } : {}) });
  assert.equal(checkCode(req("abc"), { STUDIO_ACCESS_CODE: "abc" }), true);
  assert.equal(checkCode(req("abd"), { STUDIO_ACCESS_CODE: "abc" }), false);
  assert.equal(checkCode(req(""), { STUDIO_ACCESS_CODE: "" }), false);
  const c = cleanPlan({ ...plan, features: [...plan.features, { name: "", accept: "x" }] });
  assert.equal(c.features.length, 2); assert.equal(c.decisions[0].id, "ai1");
  assert.throws(() => cleanPlan({ features: [] }));
  assert.deepEqual(parseRun("요약: 문서 작성\n본문", false), { outcome: "done", summary: "문서 작성" });
  assert.equal(parseRun("요약: 봄\n...\n판정: 통과", true).outcome, "pass");
  const f = parseRun("요약: 봄\n판정: 실패 — 기준 근거 없음", true); assert.equal(f.outcome, "fail"); assert.equal(f.note, "기준 근거 없음");
  assert.equal(parseRun("요약: 봄", true).outcome, "unknown");
  assert.match(runPrompt({ task: { title: "검사", check: "a11y", agentName: "품질 검수 AI" } }).system, /판정: 통과/);
});
