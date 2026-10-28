import { test } from "node:test";
import assert from "node:assert/strict";
import * as SIM from "../public/studio/sim.js";
import { stationFor, STATIONS } from "../public/studio/floor.js";
import { sessions } from "../public/studio/bridge.js";

test("모델하우스: 같은 시드면 같은 흐름, 모든 이벤트는 sim 표시", () => {
  const a = SIM.createSim({ seed: 3, start: 0 }), b = SIM.createSim({ seed: 3, start: 0 });
  const ea = SIM.tick(a, 60000), eb = SIM.tick(b, 60000);
  assert.deepEqual(ea.map((e) => e.kind + e.title), eb.map((e) => e.kind + e.title));
  assert.ok(ea.length > 20 && ea.every((e) => e.sim && e.session && e.source));
  assert.deepEqual([...new Set(ea.map((e) => e.source))].sort(), ["claude-code", "gemini", "make", "openai"]);
});

test("모델하우스: 실패는 숨기지 않고 복구 각본이 이어지며, 끝나면 새 일을 시작", () => {
  const s = SIM.createSim({ seed: 11, start: 0, failRate: 1 });
  const ev = SIM.tick(s, 10 * 60000);
  assert.ok(s.stats.fails > 0 && s.stats.recovered > 0 && s.stats.recovered <= s.stats.fails);
  const cc = ev.filter((e) => e.session === "sim-cc-1").map((e) => e.kind);
  const f = cc.indexOf("fail"); assert.ok(f > 0); assert.deepEqual(cc.slice(f, f + 4), ["fail", "read", "edit", "test"]);
  assert.ok(ev.some((e) => e.session === "sim-cc-2"), "완료 뒤 다음 일");
  assert.ok(s.stats.done >= 4);
});

test("모델하우스: 사고 넣기 → 그 AI의 다음 검사가 실패", () => {
  const s = SIM.createSim({ seed: 5, start: 0, failRate: 0 });
  SIM.tick(s, 3000); const who = SIM.injectFailure(s); assert.ok(who);
  const ev = SIM.tick(s, 120000); assert.ok(ev.some((e) => e.kind === "fail" && e.agent === who));
  assert.ok(ev.filter((e) => e.kind === "fail").every((e) => e.agent === who), "실패율 0 이면 넣은 사고만");
});

test("평면: 이벤트 종류 → 자리, 실패는 하던 자리 유지 / 세션 상태", () => {
  assert.equal(stationFor("edit"), "bench"); assert.equal(stationFor("web"), "web"); assert.equal(stationFor("fail", "lab"), "lab"); assert.equal(stationFor("weird"), "desk");
  assert.equal(new Set(STATIONS.map((x) => x.id)).size, STATIONS.length);
  const s = SIM.createSim({ seed: 2, start: 0 }); SIM.tick(s, 20000);
  const ses = sessions(s.events, SIM.simNow(s)); assert.equal(ses.length, 4); assert.ok(ses.every((x) => ["live", "wait", "fail", "done"].includes(x.state)));
});
