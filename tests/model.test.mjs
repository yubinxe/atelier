import { test } from "node:test";
import assert from "node:assert/strict";
import * as M from "../public/studio/model.js";

const drive = (p, choose = "A", stopAt = null) => { // 승인 게이트마다 결정·승인하며 끝까지
  let t = 1e12;
  for (let i = 0; i < 300 && p.status === "active"; i++) {
    t += 1000; const r = M.step(p, t); p = r.p;
    if (r.blocked) { const a = M.pendingApproval(p); if (!a || a.gate === stopAt) return p; if (a.gate === "decisions") p.decisions.forEach((d) => (p = M.choose(p, d.id, choose, t))); p = M.approve(p, a.id, t); }
  }
  return p;
};

test("설계도: 키워드 규칙으로 기능·결정·스킬 도출, 분야 자동 판별", () => {
  const p = M.createProject("미국 주식 포트폴리오 분석 사이트를 만들고 싶어요.", "web", 1);
  assert.equal(p.title, "미국 주식 포트폴리오 분석 사이트");
  assert.ok(["보유 종목 입력", "수익률 계산", "자산 비중 차트"].every((n) => p.features.some((f) => f.name === n)));
  assert.ok(p.features.every((f) => f.accept && f.why), "모든 기능에 완료 기준");
  assert.deepEqual(p.decisions.map((d) => d.id), ["auth", "store"]);
  assert.ok(p.tasks.some((t) => t.skills.includes("finance-calc")));
  assert.equal(M.createProject("상가임대차 주의사항 블로그 카드뉴스", undefined, 1).category, "content");
  assert.equal(M.createProject("매주 엑셀 매출을 정리해 메일로 보내기", undefined, 1).category, "automation");
});

test("통제: 승인 없이는 다음 단계로 넘어가지 않고, 설계 결정은 모두 골라야 승인된다", () => {
  let p = M.createProject("예약 사이트를 만들고 싶어요", "web", 1);
  for (let i = 0; i < 10; i++) p = M.step(p, 10 + i).p;
  assert.equal(p.stage, 0, "범위 확인 전 아이디어 단계에 머문다");
  const a = M.pendingApproval(p); assert.equal(a.gate, "scope");
  assert.match(M.step(p, 99).blocked, /범위 확인/);
  p = M.approve(p, a.id, 100);
  for (let i = 0; i < 20; i++) p = M.step(p, 200 + i).p;
  const d = M.pendingApproval(p); assert.equal(d.gate, "decisions");
  assert.equal(M.canApprove(p, d), false);
  assert.equal(M.pendingApproval(M.approve(p, d.id, 300)).id, d.id, "선택 전 승인 무효");
  p = M.choose(p, "auth", "B", 301); p = M.choose(p, "store", "A", 302);
  assert.equal(M.canApprove(p, d), true);
  assert.equal(M.pendingApproval(M.approve(p, d.id, 303)), null);
});

test("검증: 실행 전엔 미검증, 실패는 숨기지 않고 수정·재검사 뒤 통과, 시연 배포는 실행 안 함", () => {
  let p = M.createProject("투자 대시보드를 만들고 싶어요", "web", 1);
  assert.ok(p.evidence.every((e) => e.status === "unverified"));
  p = drive(p, "A", "review");
  assert.equal(M.STAGES[p.stage].id, "review");
  const mob = p.evidence.find((e) => e.id === "e-mobile");
  assert.deepEqual(mob.runs.map((r) => r.result), ["fail", "pass"], "실패 후 재검사 통과 기록");
  assert.ok(p.tasks.some((t) => t.fix && t.status === "done"), "수정 작업 실행됨");
  assert.ok(p.runs.every((r) => r.demo), "시연 실행은 모두 가상 표시");
  assert.equal(p.evidence.find((e) => e.id === "e-deploy").status, "unverified");
  p = drive(p);
  assert.equal(p.status, "done");
  assert.equal(p.evidence.find((e) => e.id === "e-deploy").status, "skipped", "시연은 실제 배포를 통과로 적지 않는다");
  assert.match(p.history.at(-1).text, /실제로 공개된 서비스는 없습니다/);
});

test("반려: 최종 검토를 반려하면 제작 단계로 돌아가 검사가 미검증으로 초기화", () => {
  let p = drive(M.createProject("쇼핑몰을 만들고 싶어요", "web", 1), "A", "review");
  const a = M.pendingApproval(p); p = M.reject(p, a.id, "디자인 수정", 5);
  assert.equal(M.STAGES[p.stage].id, "build");
  assert.ok(p.evidence.every((e) => e.status === "unverified"));
  assert.ok(M.stageTasks(p).every((t) => t.status === "todo"));
  assert.match(p.history.at(-1).text, /반려 — 최종 검토 \(디자인 수정\)/);
});

test("멈춤·재개, 스킬은 여러 에이전트가 공유(다대다)", () => {
  let p = M.pause(M.createProject("블로그 홍보 콘텐츠", "content", 1), 2);
  assert.match(M.step(p, 3).blocked, /중단/); p = M.resume(p, 4); assert.ok(M.step(p, 5).did);
  const u = M.skillUsage(M.createProject("투자 사이트", "web", 1));
  assert.ok(Object.values(u).some((v) => v.agents.length > 1));
  assert.ok(M.isValidProject(p)); assert.equal(M.isValidProject({ v: 1 }), false);
});

test("요약: 다섯 질문(지금·왜·결정·완료·근거)에 항상 답한다", () => {
  let p = M.createProject("예약 사이트", "web", 1);
  for (const q of [p, M.step(p, 2).p, drive(p, "A", "decisions"), drive(p)]) {
    const s = M.summary(q); for (const k of ["now", "why", "decide", "completed", "proof"]) assert.ok(s[k] && s[k].length > 3, k);
  }
});
