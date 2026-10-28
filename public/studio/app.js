// Atelier AX · Project Studio — 화면(해시 라우터). 상태 전이는 model.js, 저장은 이 브라우저(localStorage)만.
import * as M from "./model.js";
import * as BD from "./board.js";
import * as BR from "./bridge.js";
import * as SIM from "./sim.js";
import * as FL from "./floor.js";

const KEY = "atelier.studio.v1", PREF = "atelier.studio.prefs";
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const time = (t) => new Date(t).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const date = (t) => new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

// ── 저장 ──
const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v.filter(M.isValidProject) : null; } catch { return null; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(projects)); } catch {} };
const prefs = (() => { try { return JSON.parse(localStorage.getItem(PREF)) || {}; } catch { return {}; } })();
const savePrefs = () => { try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch {} };
let projects = load();
if (!projects) { projects = [seed()]; save(); }
function seed() { // 처음 방문하면 '예시' 프로젝트 하나를 제작 단계 중간까지 진행해 둔다(시연 데이터)
  let p = M.createProject("미국 주식 포트폴리오를 입력하면 수익률과 자산 비중을 보여 주는 투자 분석 사이트를 만들고 싶어요.", "web", Date.now() - 36e5);
  p.title = "투자 분석 플랫폼"; p.example = true;
  let t = p.created;
  for (let i = 0; i < 40; i++) {
    t += 45e3; const r = M.step(p, t); p = r.p;
    if (r.blocked) { const a = M.pendingApproval(p); if (!a || a.gate === "review") break; if (a.gate === "decisions") p.decisions.forEach((d) => (p = M.choose(p, d.id, "A", t))); p = M.approve(p, a.id, t); }
    if (M.STAGES[p.stage].id === "verify" && M.stageTasks(p).filter((x) => x.status === "done").length >= 2) break;
  }
  return p;
}
const find = (id) => projects.find((p) => p.id === id);
const put = (p) => { projects = projects.map((x) => (x.id === p.id ? p : x)); save(); };

// ── 화면 상태(새로고침하면 초기화) ──
const ui = { viewStage: null, open: new Set(), agentOpen: new Set(), proofF: "all", histF: "all", histQ: "", skillView: prefs.skillView || "table", seen: 0 };
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
function toast(msg, kind = "") { // 화면 아래 알림 — 스크린리더에도 읽힌다
  const box = $("#toasts"); if (!box) return;
  const t = document.createElement("div"); t.className = "toast " + kind; t.textContent = msg; box.append(t);
  requestAnimationFrame(() => t.classList.add("in"));
  setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 3200);
  while (box.children.length > 3) box.firstChild.remove();
}
// 도넛 링(SVG) — parts: [{v, cls, label}]
function ring(parts, center, sub) {
  const tot = parts.reduce((a, x) => a + x.v, 0) || 1, R = 42, C = 2 * Math.PI * R; let off = 0;
  const arcs = parts.filter((x) => x.v).map((x) => { const len = (x.v / tot) * C, el = `<circle r="${R}" cx="50" cy="50" class="arc ${x.cls}" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}"><title>${esc(x.label)} ${x.v}</title></circle>`; off += len; return el; }).join("");
  return `<figure class="ring"><svg viewBox="0 0 100 100" role="img" aria-label="${esc(parts.map((x) => `${x.label} ${x.v}`).join(", "))}"><circle r="${R}" cx="50" cy="50" class="track"/>${arcs}</svg><figcaption><b data-count="${center}">${center}</b><span>${esc(sub)}</span></figcaption></figure>`;
}
function countUp(root) { // 숫자 카운트업(움직임 줄이기 설정이면 생략)
  if (reduce) return;
  $$("[data-count]", root).forEach((el) => { const to = Number(el.dataset.count); if (!Number.isFinite(to) || to < 2) return; const t0 = performance.now(), dur = 700;
    const f = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
}
const vt = (fn) => { if (reduce || !document.startViewTransition) return fn(); try { document.startViewTransition(fn); } catch { fn(); } };

// ── 실제 실행(LIVE) — 서버 함수 /api/studio/* 가 있고 키·접근 코드가 설정된 경우에만 ──
const LIVE = { info: null, run: null, auto: null };
async function health() {
  try { const r = await fetch("/api/studio/health/", { cache: "no-store" }); LIVE.info = r.ok ? await r.json() : { live: false, reason: r.status === 404 ? "이 주소에는 서버 함수가 없습니다(정적 사본)" : `상태 확인 실패 (${r.status})` }; }
  catch { LIVE.info = { live: false, reason: "서버에 연결할 수 없습니다" }; }
  const [, a, id] = location.hash.split("/"); if (a !== "p") route(); else rerender(id);
}
const liveOk = () => !!LIVE.info?.live;
const rerender = (id) => { const [, a, pid, tab] = location.hash.split("/"); if (a === "p" && pid === id && find(id)) project(find(id), tab || "flow"); };
// SSE 한 줄씩 읽기
async function sse(res, on) {
  const rd = res.body.getReader(), dec = new TextDecoder(); let buf = "";
  for (;;) { const { value, done } = await rd.read(); if (done) break; buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf("\n\n")) >= 0) { const chunk = buf.slice(0, i); buf = buf.slice(i + 2); const line = chunk.split("\n").find((l) => l.startsWith("data: ")); if (line) { try { on(JSON.parse(line.slice(6))); } catch {} } } }
}
// 작업 하나를 실제 AI 로 실행 → 결과를 모델에 기록. 실패·중단은 완료로 적지 않는다.
async function liveOnce(id) {
  const p0 = find(id); if (!p0) return { blocked: "프로젝트 없음" };
  const r = M.step(p0); if (!r.needs) { put(r.p); rerender(id); return r; }
  const t = r.needs, ctl = new AbortController();
  LIVE.run = { pid: id, task: t.id, agent: t.agent, title: t.title, text: "", t0: Date.now(), ctl };
  rerender(id); tickConsole();
  const prior = p0.tasks.filter((x) => x.status === "done" && x.run).map((x) => ({ title: x.title, output: p0.runs.find((y) => y.id === x.run)?.output || "" })).filter((x) => x.output).slice(-6);
  let result = null;
  try {
    const res = await fetch("/api/studio/run/", { method: "POST", signal: ctl.signal, headers: { "content-type": "application/json", "x-studio-code": prefs.code || "" },
      body: JSON.stringify({ title: p0.title, goal: p0.goal, task: { title: t.title, accept: t.accept, skills: t.skills.map((k) => M.SKILLS[k].name), check: t.check || null, agentName: M.AGENTS[t.agent].name }, prior }) });
    if (!res.ok) result = { outcome: "error", note: (await res.json().catch(() => ({}))).error || `HTTP ${res.status}` };
    else await sse(res, (ev) => {
      if (ev.t === "delta") { LIVE.run.text += ev.text; paintConsole(); }
      else if (ev.t === "start") LIVE.run.model = ev.model;
      else if (ev.t === "done") result = { outcome: ev.outcome, summary: ev.summary, note: ev.note || (ev.truncated ? "출력이 길어 잘렸습니다" : ""), output: LIVE.run.text, model: ev.model, usage: ev.usage, start: LIVE.run.t0, end: Date.now() };
      else if (ev.t === "error") result = { outcome: "error", note: ev.error };
    });
  } catch { result = { outcome: "error", note: ctl.signal.aborted ? "사용자가 중단했습니다" : "네트워크 오류" }; }
  if (!result) result = { outcome: "error", note: "응답이 중간에 끊겼습니다" };
  LIVE.run = null;
  if (result.outcome === "error" && /접근 코드/.test(result.note)) { prefs.code = ""; savePrefs(); }
  const r2 = M.step(find(id) || p0, Date.now(), result); if (find(id)) put(r2.p);
  rerender(id);
  if (ctl.signal.aborted) { toast("작업을 중단했습니다 — 완료로 적지 않았습니다", "warn"); return { ...r2, blocked: r2.blocked || "중단" }; }
  toast(r2.blocked ? `실행 실패 — ${r2.blocked}` : `${M.AGENTS[t.agent].name} · ${t.title} — ${{ pass: "통과", fail: "실패", unknown: "판정 없음(미검증)" }[result.outcome] || "완료"}`, r2.blocked || result.outcome === "fail" ? "warn" : "");
  return r2;
}
async function liveAuto(id) { // 승인 관문·오류에서 반드시 멈춘다
  LIVE.auto = id; rerender(id);
  while (LIVE.auto === id) {
    const r = await liveOnce(id), p = find(id);
    if (!p || r.blocked || M.pendingApproval(p) || p.status !== "active") { const a = p && M.pendingApproval(p); if (a) toast(`결정이 필요합니다 — ${a.title}`, "warn"); break; }
  }
  if (LIVE.auto === id) LIVE.auto = null; rerender(id);
}
let ctick = null;
function tickConsole() { clearInterval(ctick); ctick = setInterval(() => { if (!LIVE.run) return clearInterval(ctick); paintConsole(); }, 1000); }
function paintConsole() {
  const el = $("#console"); if (!el || !LIVE.run) return;
  const r = LIVE.run, out = $(".stream", el), sec = Math.round((Date.now() - r.t0) / 1000);
  if (out) { out.textContent = r.text.slice(-900) || "응답을 기다리는 중…"; out.scrollTop = out.scrollHeight; }
  const m = $(".cmeta", el); if (m) m.textContent = `${sec}초 · ${r.text.length.toLocaleString()}자${r.model ? " · " + r.model : ""}`;
}

// ── 라우터 ──
const app = $("#app");
let timer = null;
function route() {
  clearInterval(timer); timer = null; clearInterval(btimer); btimer = null;
  const [, a, id, tab] = location.hash.split("/");
  if (a === "p" && find(id)) project(find(id), tab || "flow");
  else if (a === "live") live();
  else if (a === "bridge") bridge();
  else home();
  $("#expert")?.setAttribute("aria-pressed", String(!!prefs.expert));
}
let lastProj = null;
addEventListener("hashchange", () => {
  const [, a, id] = location.hash.split("/"), same = a === "p" && id === lastProj;
  if (!same) { ui.viewStage = null; ui.open.clear(); ui.agentOpen.clear(); ui.seen = 0; LIVE.auto = null; scrollTo({ top: 0 }); }
  lastProj = a === "p" ? id : null;
  same ? vt(route) : route();
});

// ── 공통 조각 ──
const chip = (t, k = "") => `<span class="chip ${k}">${esc(t)}</span>`;
const demoChip = (p) => (p.mode === "demo" ? chip("시연 · 가상 실행", "warn") : chip("실제 AI 실행", "good"));
const T = (plain, tech) => (prefs.expert ? `${esc(plain)} <span class="tech">${esc(tech)}</span>` : esc(plain));
const agentDot = (k) => `<span class="dot ${M.AGENTS[k].color}" aria-hidden="true"></span>`;
const EV = { pass: ["통과", "good"], fail: ["실패", "bad"], unverified: ["미검증", "idle"], skipped: ["실행 안 함", "idle"] };

// ── 홈: 프로젝트 시작 ──
function home() {
  document.title = "프로젝트 스튜디오 · Atelier AX";
  const cat = prefs.cat || "web", mode = prefs.mode === "live" && liveOk() ? "live" : "demo";
  app.innerHTML = `<section class="hero">
    <p class="eyebrow">프로젝트 스튜디오 ${chip("NEW", "accent")}</p>
    <h1>생각을 현실로 만드는<br>당신만의 AI 전문가 팀.</h1>
    <p class="lede">아이디어만 설명하세요. 기획부터 제작, 검증까지 AI 팀이 함께합니다.<br>무엇을 하고 있는지는 쉬운 말로, 중요한 결정은 당신에게.</p>
    <form id="start" class="prompt card">
      <label for="idea" class="sr">무엇을 만들어 보고 싶으신가요?</label>
      <textarea id="idea" rows="3" maxlength="400" placeholder="무엇을 만들어 보고 싶으신가요?\n${esc(M.CATEGORIES[cat].hint)}" required></textarea>
      <div class="prompt-row"><div class="seg" role="radiogroup" aria-label="종류">${Object.entries(M.CATEGORIES).map(([k, c]) => `<button type="button" role="radio" aria-checked="${k === cat}" data-cat="${k}">${esc(c.name)}</button>`).join("")}</div>
      <button class="btn primary" id="startBtn">프로젝트 시작 →</button></div>
      <div class="moderow"><div class="toggle" role="radiogroup" aria-label="실행 방식"><button type="button" role="radio" data-mode="demo" aria-checked="${mode === "demo"}">시연 · 가상</button><button type="button" role="radio" data-mode="live" aria-checked="${mode === "live"}" ${liveOk() ? "" : "disabled"}>실제 AI</button></div>
        ${mode === "live" ? `<label class="code"><span class="sr">접근 코드</span><input id="code" type="password" autocomplete="off" placeholder="접근 코드" value="${esc(prefs.code || "")}"></label>` : ""}
        <span class="lstate ${liveOk() ? "on" : ""}">${LIVE.info ? (liveOk() ? `실제 AI 연결됨 · ${esc(LIVE.info.model)}` : `실제 AI 연결 안 됨 — ${esc(LIVE.info.reason)}`) : "연결 확인 중…"}</span></div>
      <p class="fine">${mode === "live" ? "실제 AI 실행 — 기획·설계·제작 산출물과 검사 판정을 Claude가 실제로 씁니다. 다만 코드 실행·배포는 연결돼 있지 않아, 검사는 <b>AI 검토</b>(실행 아님)로 표시하고 공개는 하지 않습니다. 개인정보는 입력하지 마세요." : "공개 시연입니다 — 설계도는 <b>키워드 규칙으로 만든 초안</b>이고, 이후 단계는 이 브라우저 안에서 <b>가상으로</b> 진행됩니다. 실제 AI 호출·코드 실행·배포는 일어나지 않습니다. 개인정보는 입력하지 마세요."}</p>
    </form>
    <a class="bridge-cta" href="#/bridge"><span class="live-dot on" aria-hidden="true"></span><b>AI 작업 모델하우스</b><span>API 키 없이 더미 각본으로 — AI들이 어떻게 일하는지 시뮬레이션으로 봅니다</span><i aria-hidden="true">→</i></a>
  </section>
  <section class="wrap"><h2 class="h2">어떤 일을 시작하시겠습니까?</h2>
    <div class="grid3">${Object.entries(M.CATEGORIES).map(([k, c], i) => `<button class="card pick" data-ex="${k}"><span class="ico ${["blue", "yellow", "green"][i]}" aria-hidden="true">${["◧", "✎", "⟳"][i]}</span><b>${esc(c.name)}</b><span>${esc(c.hint.replace(/^예: /, ""))}</span></button>`).join("")}</div>
  </section>
  <section class="wrap how"><h2 class="h2">어떻게 진행되나요? <small>단계를 눌러 보세요</small></h2>
    <div class="card stepper"><div class="steps" role="tablist" aria-label="진행 단계">${M.STAGES.map((st, i) => `<button role="tab" id="st-${i}" aria-controls="sp" aria-selected="${i === 0}" data-step="${i}"><span class="n">${st.n}</span>${esc(st.name)}</button>`).join("")}<span class="track" aria-hidden="true"><span></span></span></div>
      <div id="sp" role="tabpanel" class="sp"></div>
      <button class="btn sm ghost play" id="play" aria-pressed="true">자동 넘김 멈추기</button></div>
  </section>
  <section class="wrap"><div class="stats">
    ${[["프로젝트", projects.length, "이 브라우저"], ["완료한 작업", projects.reduce((a, p) => a + p.tasks.filter((t) => t.status === "done").length, 0), "전체 프로젝트 합계"], ["검사 기록", projects.reduce((a, p) => a + p.evidence.reduce((b, e) => b + e.runs.length, 0), 0), "통과·실패 모두(가상)"], ["처리한 결정", projects.reduce((a, p) => a + p.approvals.filter((x) => x.status !== "pending").length, 0), "승인·반려"]].map(([k, v, d]) => `<div class="card stat"><span>${k}</span><b data-count="${v}">${v}</b><small>${d}</small></div>`).join("")}
  </div></section>
  <section class="wrap"><h2 class="h2">진행 중인 프로젝트 <small>${projects.length}개 · 이 브라우저에만 저장</small></h2>
    <div class="plist">${projects.length ? projects.slice().sort((a, b) => b.updated - a.updated).map(card).join("") : '<p class="muted">아직 프로젝트가 없습니다.</p>'}</div>
  </section>
  <section class="wrap"><h2 class="h2">Atelier AX가 지키는 세 가지</h2>
    <div class="grid3 principles">
      <div class="card"><b>이해할 수 있게</b><p>AI가 지금 무엇을, 왜 하는지 개발 용어 대신 쉬운 말로 보여 줍니다. 필요할 때만 ‘전문가 보기’로 기술 정보를 펼칩니다.</p></div>
      <div class="card"><b>통제할 수 있게</b><p>범위·설계·공개는 당신의 승인 없이 넘어가지 않습니다. 언제든 멈추고, 반려하면 그 단계부터 다시 합니다.</p></div>
      <div class="card"><b>검증할 수 있게</b><p>‘완성했다’는 말 대신 검사 결과로 보여 줍니다. 실행하지 않은 검사는 ‘미검증’, 시연 결과는 ‘가상’이라고 적습니다.</p></div>
    </div>
    <p class="fine center"><a href="#/bridge">AI 작업 모델하우스(시뮬레이션) →</a> · <a href="#/live">실제 AI 실행 연결 계획 보기 →</a> · <a href="/">기존 AI 인력 관제(라이브) →</a></p>
  </section>`;
  // 작동 방식 스테퍼 — 3.6초마다 자동 넘김(멈춤 가능, 움직임 줄이기 설정이면 꺼짐)
  const STEP_ROLE = [["기획 담당 AI가 설명에서 필요한 기능과 완료 기준을 뽑습니다.", "정리된 기능 목록이 맞는지 확인하고 승인합니다.", "기능마다 ‘완료 기준’이 적힌 설계도"],
    ["디자인·기획 담당 AI가 화면 흐름과 데이터 구조를 설계합니다.", "회원가입·데이터 보관 같은 선택지를 이점·비용·위험을 보고 고릅니다.", "화면 목록 · 디자인 규칙 · 데이터 표"],
    ["개발 담당 AI가 기능을 하나씩 만들고 스스로 1차 테스트를 씁니다.", "지켜보다가 언제든 멈출 수 있습니다.", "기능별 실행 기록(누가·언제·어떤 스킬)"],
    ["만든 쪽과 분리된 품질 검수 AI가 독립적으로 검사합니다. 실패하면 숨기지 않고 수정 → 재검사합니다.", "결과표에서 통과·실패·미검증을 확인합니다.", "검사별 실행 기록 — 안 한 검사는 ‘미검증’"],
    ["미리보기 판을 준비합니다.", "실제 화면과 검사 결과를 보고 승인하거나 반려합니다.", "미리보기 주소 · 검사 요약"],
    ["승인된 판만 공개합니다.", "공개 승인 — 이 승인 없이는 아무것도 공개되지 않습니다.", "공개 기록(시연에서는 ‘실행 안 함’)"]];
  let si = 0, play = !reduce, stimer = null;
  const showStep = (i) => { si = i; const st = M.STAGES[i];
    $$("[data-step]").forEach((b, j) => { b.setAttribute("aria-selected", String(j === i)); b.classList.toggle("past", j < i); b.tabIndex = j === i ? 0 : -1; });
    $(".steps .track span").style.width = `${(i / (M.STAGES.length - 1)) * 100}%`;
    $("#sp").setAttribute("aria-labelledby", "st-" + i);
    $("#sp").innerHTML = `<div class="sp-in"><p class="eyebrow">${st.n} · ${esc(st.say)}</p><h3>${esc(st.name)} ${prefs.expert ? `<span class="tech">${esc(st.tech)}</span>` : ""}</h3>
      <div class="roles"><div><span>AI 팀이 하는 일</span><p>${esc(STEP_ROLE[i][0])}</p></div><div><span>당신이 하는 일</span><p>${esc(STEP_ROLE[i][1])}</p></div><div><span>남는 증거</span><p>${esc(STEP_ROLE[i][2])}</p></div></div>
      <p class="fine">${esc(st.why)}${st.gate ? " · <b>승인 지점</b>" : ""}</p></div>`; };
  const setPlay = (on) => { play = on; clearInterval(stimer); stimer = on ? setInterval(() => { if (!$("#sp")) return clearInterval(stimer); showStep((si + 1) % M.STAGES.length); }, 3600) : null; const b = $("#play"); b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "자동 넘김 멈추기" : "자동 넘김 켜기"; };
  $$("[data-step]").forEach((b) => (b.onclick = () => { setPlay(false); showStep(Number(b.dataset.step)); }));
  $(".steps").onkeydown = (e) => { if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return; e.preventDefault(); setPlay(false); const n = (si + (e.key === "ArrowRight" ? 1 : M.STAGES.length - 1)) % M.STAGES.length; showStep(n); $(`[data-step="${n}"]`).focus(); };
  $("#play").onclick = () => setPlay(!play);
  showStep(0); setPlay(play); countUp(app);
  const ta = $("#idea");
  $$("[data-cat]").forEach((b) => (b.onclick = () => { prefs.cat = b.dataset.cat; savePrefs(); $$("[data-cat]").forEach((x) => x.setAttribute("aria-checked", String(x === b))); ta.placeholder = "무엇을 만들어 보고 싶으신가요?\n" + M.CATEGORIES[b.dataset.cat].hint; }));
  $$("[data-ex]").forEach((b) => (b.onclick = () => { prefs.cat = b.dataset.ex; savePrefs(); ta.value = M.CATEGORIES[b.dataset.ex].hint.replace(/^예: /, ""); $$("[data-cat]").forEach((x) => x.setAttribute("aria-checked", String(x.dataset.cat === b.dataset.ex))); ta.focus(); scrollTo({ top: 0, behavior: "smooth" }); }));
  $$("[data-mode]").forEach((b) => (b.onclick = () => { prefs.mode = b.dataset.mode; savePrefs(); const v = ta.value; home(); $("#idea").value = v; }));
  $("#code")?.addEventListener("change", (e) => { prefs.code = e.target.value.trim(); savePrefs(); });
  $("#start").onsubmit = async (e) => {
    e.preventDefault(); const text = ta.value.trim(); if (text.length < 6) { ta.setCustomValidity("조금 더 자세히 적어 주세요(6자 이상)."); ta.reportValidity(); return; }
    const category = prefs.cat || M.detectCategory(text);
    if (mode === "live") {
      const code = ($("#code")?.value || "").trim(); if (!code) { $("#code").focus(); toast("접근 코드를 입력해 주세요", "warn"); return; }
      prefs.code = code; savePrefs();
      const btn = $("#startBtn"); btn.disabled = true; btn.innerHTML = '<span class="spin" aria-hidden="true"></span>기획 담당 AI가 설계도를 쓰는 중…'; $("#start").classList.add("busy");
      try {
        const res = await fetch("/api/studio/plan/", { method: "POST", headers: { "content-type": "application/json", "x-studio-code": code }, body: JSON.stringify({ idea: text, category }) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.plan) throw new Error(j.error || `HTTP ${res.status}`);
        const p = M.createProject(text, category, Date.now(), "live", j.plan); p.planModel = j.model; projects.unshift(p); save();
        location.hash = `#/p/${p.id}/flow`; toast("AI 설계도 완성 — 범위를 확인하고 진행하세요");
      } catch (err) { toast(`설계도 실패 — ${err.message}`, "warn"); if (/접근 코드/.test(err.message)) { prefs.code = ""; savePrefs(); } btn.disabled = false; btn.textContent = "프로젝트 시작 →"; $("#start").classList.remove("busy"); }
      return;
    }
    const p = M.createProject(text, category); projects.unshift(p); save();
    location.hash = `#/p/${p.id}/flow?auto`;
  };
  ta.oninput = () => ta.setCustomValidity("");
  $$("[data-del]").forEach((b) => (b.onclick = (e) => { e.preventDefault(); if (confirm("이 프로젝트를 지울까요? 이 브라우저에서만 지워집니다.")) { projects = projects.filter((p) => p.id !== b.dataset.del); save(); home(); } }));
}
function card(p) {
  const s = M.summary(p), pend = M.pendingApproval(p);
  const label = p.status === "done" ? "완료(시연)" : p.status === "paused" ? "멈춤" : pend ? "승인 대기" : `${s.stage.name} 중`;
  return `<a class="card proj" href="#/p/${p.id}/flow"><div class="proj-h"><b>${esc(p.title)}</b>${p.example ? chip("예시", "idle") : ""}<span class="state ${pend ? "wait" : p.status === "done" ? "good" : "work"}">${esc(label)}</span></div>
    <ol class="mini">${M.STAGES.map((st, i) => `<li class="${i < p.stage || p.status === "done" ? "done" : i === p.stage ? "now" : ""}"><span>${esc(st.name)}</span></li>`).join("")}</ol>
    <div class="proj-f"><span>AI 팀 ${new Set(p.tasks.map((t) => t.agent)).size}명 참여 · 작업 ${s.done}/${s.total}</span><span>${date(p.updated)}</span><button class="link" data-del="${p.id}" aria-label="${esc(p.title)} 삭제">삭제</button></div></a>`;
}

// ── 프로젝트 ──
const TABS = [["flow", "진행"], ["blueprint", "설계도"], ["team", "AI 팀"], ["skills", "스킬"], ["decide", "결정·승인"], ["proof", "결과·검증"], ["history", "이력"]];
function project(p, tab0) {
  const tab = tab0.split("?")[0], auto = location.hash.includes("?auto");
  document.title = `${p.title} · 프로젝트 스튜디오`;
  const s = M.summary(p), pend = M.pendingApproval(p), isLive = p.mode === "live", running = LIVE.run?.pid === p.id, autoOn = isLive ? LIVE.auto === p.id : !!timer;
  const blockedBtn = pend || p.status !== "active" || running || (isLive && !liveOk());
  app.innerHTML = `<div class="wrap wide proj-page"><div class="pgrid"><div class="pmain">
    <nav class="crumb" aria-label="위치"><a href="#/">프로젝트 스튜디오</a> <span aria-hidden="true">›</span> ${esc(p.title)}</nav>
    <header class="ph"><div><h1>${esc(p.title)}</h1><p class="muted">${esc(M.CATEGORIES[p.category].name)} · ${demoChip(p)} ${p.example ? chip("예시 프로젝트", "idle") : ""}</p></div>
      <div class="ctl">
        <button class="btn primary" id="go" ${blockedBtn ? "disabled" : ""}>${running ? '<span class="spin" aria-hidden="true"></span>AI 작업 중' : "다음 작업 진행"}</button>
        <button class="btn" id="auto" aria-pressed="${autoOn}" ${(pend || p.status !== "active" || (isLive && !liveOk())) && !autoOn ? "disabled" : ""}>자동 진행</button>
        ${p.status === "paused" ? '<button class="btn" id="resume">다시 시작</button>' : p.status === "active" ? '<button class="btn ghost" id="pause">멈추기</button>' : ""}
      </div></header>
    ${stageBlock(p)}
    <details class="now card" id="nowBox" ${prefs.nowOpen ? "open" : ""}><summary><span class="nk">지금</span> ${esc(s.now)} <span class="more-t">설명 ${prefs.nowOpen ? "접기" : "펼치기"}</span></summary>
      <dl>
        <div><dt>지금 AI가 하는 일</dt><dd>${esc(s.now)}</dd></div>
        <div><dt>왜 필요한가요</dt><dd>${esc(s.why)}</dd></div>
        <div class="${pend ? "hot" : ""}"><dt>내가 결정할 것</dt><dd>${pend ? `<a href="#/p/${p.id}/decide">${esc(pend.title)}</a> — ${esc(pend.text)}` : esc(s.decide)}</dd></div>
        <div><dt>완료된 것</dt><dd>${esc(s.completed)} <span class="bar" style="--w:${s.pct}%" aria-hidden="true"></span></dd></div>
        <div><dt>작동한다는 근거</dt><dd><a href="#/p/${p.id}/proof">${esc(s.proof)}</a></dd></div>
      </dl></details>
    <div class="tabs" role="tablist">${TABS.map(([k, t]) => `<a role="tab" href="#/p/${p.id}/${k}" aria-selected="${k === tab}">${t}${k === "decide" && pend ? ' <span class="badge">1</span>' : ""}</a>`).join("")}</div>
    <div id="tab"></div>
    <p class="fine">${p.mode === "demo" ? "시연 모드 — 에이전트 실행·검사 결과는 이 브라우저 안의 가상 기록입니다. 실제 코드·배포는 만들어지지 않습니다." : `실제 AI 실행 — 산출물은 Claude(${esc(p.planModel || LIVE.info?.model || "")})가 실제로 쓴 글입니다. 검사는 AI 검토(코드 실행 아님)이며 배포는 연결돼 있지 않습니다.${liveOk() ? "" : " 지금은 서버 연결이 없어 진행할 수 없습니다."}`} <button class="link" id="delP">프로젝트 삭제</button> · <button class="link" data-help>단축키</button></p>
  </div><aside class="side" aria-label="실시간 현황">${side(p)}</aside></div></div>`;
  const pane = $("#tab");
  ({ flow, blueprint: bp, team, skills, decide, proof, history: histTab }[tab] || flow)(p, pane);
  const act = (fn) => { const np = fn(find(p.id)); put(np); project(np, tab); };
  bindStage(p);
  $("#nowBox")?.addEventListener("toggle", (e) => { prefs.nowOpen = e.target.open; savePrefs(); const m = $(".more-t", e.target); if (m) m.textContent = `설명 ${e.target.open ? "접기" : "펼치기"}`; });
  if (isLive) {
    $("#go")?.addEventListener("click", () => liveOnce(p.id));
    $("#auto")?.addEventListener("click", () => { if (LIVE.auto === p.id) { LIVE.auto = null; rerender(p.id); toast("자동 진행 끔 — 지금 작업이 끝나면 멈춥니다"); } else liveAuto(p.id); });
    $("#pause")?.addEventListener("click", () => { LIVE.auto = null; if (LIVE.run?.pid === p.id) LIVE.run.ctl.abort(); act(M.pause); });
    $("#resume")?.addEventListener("click", () => act(M.resume));
    $("#delP").onclick = () => { if (confirm("이 프로젝트를 지울까요?")) { if (LIVE.run?.pid === p.id) LIVE.run.ctl.abort(); LIVE.auto = null; projects = projects.filter((x) => x.id !== p.id); save(); location.hash = "#/"; } };
    countUp(app); paintConsole(); return;
  }
  $("#go")?.addEventListener("click", () => { const r = M.step(find(p.id)); put(r.p); ui.viewStage = null; project(r.p, tab); toast(r.blocked || (/^승인 요청|시작$|^완료$/.test(r.did) ? r.did : `실행 기록 추가 — ${r.did}${r.p.mode === "demo" ? " (가상)" : ""}`), r.blocked ? "warn" : ""); });
  countUp(app);
  $("#auto")?.addEventListener("click", () => { if (timer) { clearInterval(timer); timer = null; project(find(p.id), tab); } else autoRun(p.id, tab); });
  $("#pause")?.addEventListener("click", () => act(M.pause));
  $("#resume")?.addEventListener("click", () => act(M.resume));
  $("#delP").onclick = () => { if (confirm("이 프로젝트를 지울까요?")) { projects = projects.filter((x) => x.id !== p.id); save(); location.hash = "#/"; } };
  if (auto && !timer && !pend && p.status === "active") { history.replaceState(null, "", `#/p/${p.id}/${tab}`); autoRun(p.id, tab); }
  else if (timer) $("#auto")?.setAttribute("aria-pressed", "true");
}
function autoRun(id, tab) { // 승인 게이트에서 반드시 멈춘다
  ui.viewStage = null;
  const tick = () => { const r = M.step(find(id)); put(r.p); const stop = r.blocked || M.pendingApproval(r.p) || r.p.status !== "active";
    if (stop) { clearInterval(timer); timer = null; const a = M.pendingApproval(r.p); toast(a ? `결정이 필요합니다 — ${a.title}` : r.blocked || "자동 진행을 멈췄습니다", "warn"); }
    project(r.p, tab); };
  timer = setInterval(tick, 900); tick();
}

// ── 진행 보드(게임 화면) — 글 대신 위치·색·모양으로 상황을 보여 준다 ──
const OUT = { pass: ["통과", "good"], fail: ["실패", "bad"], unknown: ["판정 없음", "idle"], done: ["완료", "good"] };
function stageBlock(p) {
  const view = prefs.board === "iso" ? "iso" : "linear", pend = M.pendingApproval(p), lr = LIVE.run?.pid === p.id ? LIVE.run : null;
  return `<section class="stage card" aria-label="진행 보드">
    ${BD.hud(p)}
    <div class="bscroll ${view}" tabindex="-1">${view === "iso" ? BD.cubes(p, lr) : BD.linear(p, lr)}</div>
    <div class="bfoot"><div class="toggle" role="group" aria-label="보드 보기"><button type="button" data-bv="linear" aria-pressed="${view === "linear"}">선형</button><button type="button" data-bv="iso" aria-pressed="${view === "iso"}">입체</button></div>
      <ul class="key" aria-label="범례"><li><i class="k-done"></i>완료(담당 AI 색)</li><li><i class="k-now"></i>지금</li><li><i class="k-todo"></i>대기</li><li><i class="k-fail"></i>실패</li><li><i class="k-gate"></i>관문</li></ul>
      ${pend ? `<a class="btn sm primary cta" href="#/p/${p.id}/decide">관문 — ${esc(pend.title)} 결정하기</a>` : ""}</div>
    ${consoleBlock(p, lr)}</section>`;
}
function consoleBlock(p, lr) {
  if (lr) return `<div class="console live" id="console" aria-live="off"><div class="ch"><span class="tokm ${M.AGENTS[lr.agent].color}" aria-hidden="true">${BD.INITIAL[lr.agent]}</span><b>${esc(M.AGENTS[lr.agent].name)}</b><span class="what">${esc(lr.title)}</span><span class="cmeta">0초</span></div><pre class="stream" tabindex="0" aria-label="AI가 지금 쓰는 내용">응답을 기다리는 중…</pre></div>`;
  const recent = p.runs.slice(-3).reverse();
  if (!recent.length) return `<div class="console" id="console"><p class="idle-t">${p.mode === "live" ? "‘다음 작업 진행’을 누르면 AI가 실제로 작업하고, 쓰는 내용이 여기 실시간으로 흐릅니다." : "시연 — ‘다음 작업 진행’을 누르면 가상 실행 기록이 쌓입니다."}</p></div>`;
  return `<div class="console" id="console"><ol class="last">${recent.map((r) => { const t = p.tasks.find((x) => x.id === r.task), o = OUT[r.outcome] || OUT.done;
    return `<li><span class="tokm ${M.AGENTS[r.agent].color}" aria-hidden="true">${BD.INITIAL[r.agent]}</span><span class="state ${o[1]}">${o[0]}</span><b>${esc(t?.title || "")}</b><span class="sum">${esc(r.summary || (r.demo ? "가상 기록" : ""))}</span>${r.review ? chip("AI 검토", "idle") : r.demo ? chip("가상", "warn") : ""}</li>`; }).join("")}</ol></div>`;
}
function bindStage(p) {
  $$("[data-bv]").forEach((b) => (b.onclick = () => { prefs.board = b.dataset.bv; savePrefs(); vt(() => rerenderAny(p.id)); }));
  const goTask = (id) => { const pp = find(p.id), t = pp.tasks.find((x) => x.id === id); if (!t) return; const si = M.STAGES.findIndex((s) => s.id === t.stage);
    ui.viewStage = si === pp.stage ? null : si; ui.open.add(id); ui.focusTask = id;
    if (!location.hash.endsWith("/flow")) location.hash = `#/p/${p.id}/flow`; else vt(() => project(find(p.id), "flow")); };
  $$("[data-node]").forEach((n) => { n.addEventListener("click", (e) => { e.stopPropagation(); goTask(n.dataset.node); }); n.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goTask(n.dataset.node); } }); });
  $$(".stage [data-stage]").forEach((z) => z.addEventListener("click", () => { const i = Number(z.dataset.stage); ui.viewStage = i === find(p.id).stage ? null : i; if (!location.hash.includes("/flow")) location.hash = `#/p/${p.id}/flow`; else vt(() => project(find(p.id), "flow")); }));
  // 말 이동 애니메이션 — 이전 위치에서 새 위치로
  const prev = ui.tok || {}; ui.tok = {};
  $$(".tok, .pawn").forEach((g) => { const k = [...g.classList].find((c) => M.AGENTS[c] || Object.values(M.AGENTS).some((a) => a.color === c)), key = (prefs.board || "linear") + k, nx = g.style.getPropertyValue("--tx"), ny = g.style.getPropertyValue("--ty");
    ui.tok[key] = [nx, ny]; const o = prev[key]; if (reduce || !o || (o[0] === nx && o[1] === ny)) return;
    g.style.transition = "none"; g.style.setProperty("--tx", o[0]); g.style.setProperty("--ty", o[1]); g.getBoundingClientRect(); g.style.transition = ""; g.style.setProperty("--tx", nx); g.style.setProperty("--ty", ny); });
  // 지금 칸이 보이도록(가로 스크롤)
  const sc = $(".bscroll"), cur = $(".nd.now, .cube.now"); if (sc && cur && sc.scrollWidth > sc.clientWidth) { const b = cur.getBoundingClientRect(), a = sc.getBoundingClientRect(); sc.scrollLeft += b.left - a.left - a.width / 2; }
  if (ui.focusTask) { const el = $(`[data-task="${ui.focusTask}"]`); ui.focusTask = null; el?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); el?.focus({ preventScroll: true }); }
}
const rerenderAny = (id) => { const tab = (location.hash.split("/")[3] || "flow").split("?")[0]; project(find(id), tab); };

// 사이드: 실시간 활동 · 검증 링 · 다음 결정 · 남은 작업
function side(p) {
  const pend = M.pendingApproval(p), ev = p.evidence, c = (k) => ev.filter((e) => e.status === k).length;
  const feed = p.history.slice(-14).reverse(), newest = p.history.at(-1)?.at || 0;
  const fresh = (h) => h.at > ui.seen && ui.seen !== 0;
  const html = `<section class="card sbox"><h2 class="sh">검증 현황</h2>
      ${ring([{ v: c("pass"), cls: "good", label: "통과" }, { v: c("fail"), cls: "bad", label: "실패" }, { v: c("unverified") + c("skipped"), cls: "idle", label: "미검증·미실행" }], c("pass"), `/ ${ev.length} 통과`)}
      <ul class="legend"><li><i class="good"></i>통과 ${c("pass")}</li><li><i class="bad"></i>실패 ${c("fail")}</li><li><i class="idle"></i>미검증 ${c("unverified") + c("skipped")}</li></ul>
      <p class="fine">${p.mode === "demo" ? "시연 결과 — 실제 검사 아님" : "AI 검토 — 코드 실행 아님"}</p></section>
    <section class="card sbox ${pend ? "hot" : ""}"><h2 class="sh">다음 결정</h2>${pend ? `<p><b>${esc(pend.title)}</b></p><p class="fine">${esc(pend.text)}</p><a class="btn sm primary" href="#/p/${p.id}/decide">결정하러 가기</a>` : `<p class="fine">${p.status === "done" ? "모든 결정을 마쳤습니다." : `다음 승인 지점: ${esc(nextGate(p))}`}</p>`}</section>
    <section class="card sbox feed"><h2 class="sh">실시간 활동 <span class="live-dot ${timer ? "on" : ""}" aria-hidden="true"></span><small>${timer ? "자동 진행 중" : "최근 14건"}</small></h2>
      <ol tabindex="0" aria-label="최근 활동">${feed.map((h) => `<li class="${h.kind} ${fresh(h) ? "fresh" : ""}"><time>${time(h.at)}</time><span>${esc(h.text)}</span></li>`).join("")}</ol>
      <a class="fine" href="#/p/${p.id}/history">전체 이력 →</a></section>`;
  ui.seen = newest;
  return html;
}
function nextGate(p) { const G = { scope: "범위 확인", decisions: "설계 결정", review: "최종 검토", launch: "공개 승인" };
  for (let i = p.stage; i < M.STAGES.length; i++) { const g = M.STAGES[i].gate; if (g && !p.approvals.some((a) => a.gate === g && a.status === "approved")) return `${G[g]} (${M.STAGES[i].n} ${M.STAGES[i].name} 끝)`; } return "없음"; }

// 진행: 에이전트 카드 + (선택한) 단계 작업
function flow(p, el) {
  const pend = M.pendingApproval(p), vi = ui.viewStage ?? p.stage, stage = M.STAGES[vi], other = vi !== p.stage;
  const nextT = M.stageTasks(p).find((t) => t.status === "todo");
  const agents = Object.keys(M.AGENTS).map((k) => {
    const mine = p.tasks.filter((t) => t.agent === k), done = mine.filter((t) => t.status === "done"), runs = p.runs.filter((r) => r.agent === k), last = runs.at(-1);
    const state = nextT?.agent === k && !pend && p.status === "active" ? "now" : done.length === mine.length && mine.length ? "done" : "wait";
    const lastTask = last && p.tasks.find((t) => t.id === last.task), open = ui.agentOpen.has(k);
    const skillsUsed = [...new Set((state === "now" ? nextT.skills : lastTask?.skills) || [])];
    return `<article class="card agent ${state}"><header>${agentDot(k)}${state === "now" ? '<span class="pulse" aria-hidden="true"></span>' : ""}<b>${T(M.AGENTS[k].name, M.AGENTS[k].tech)}</b><span class="state ${state === "now" ? "work" : state === "done" ? "good" : "idle"}">${{ now: "다음 차례", done: "완료", wait: "대기" }[state]}</span></header>
      <p>${state === "now" ? `‘${esc(nextT.title)}’ 작업을 할 차례입니다.` : lastTask ? `${esc(lastTask.title)}${last.outcome === "fail" ? " — <b class='bad'>실패를 발견해 보고했습니다</b>" : last.outcome === "pass" ? " — 통과" : "를 마쳤습니다."}` : esc(M.AGENTS[k].does)}</p>
      ${skillsUsed.length ? `<p class="lbl">${state === "now" ? "사용할 스킬" : "사용한 스킬"}</p><div class="chips">${skillsUsed.map((s) => chip(prefs.expert ? `${M.SKILLS[s].name} · ${M.SKILLS[s].tech}` : M.SKILLS[s].name, "skill")).join("")}</div>` : ""}
      <div class="meter" aria-hidden="true"><span style="--w:${mine.length ? (done.length / mine.length) * 100 : 0}%"></span></div>
      <button class="more" type="button" data-agent="${k}" aria-expanded="${open}" ${runs.length ? "" : "disabled"}><span>작업 ${done.length}/${mine.length} · 실행 ${runs.length}회${last?.demo ? " (가상)" : ""}</span><i aria-hidden="true">⌄</i></button>
      <div class="fold ${open ? "open" : ""}"><div><ol class="runs" tabindex="0" aria-label="실행 기록">${runs.slice().reverse().map((r) => { const t = p.tasks.find((x) => x.id === r.task); return `<li class="${r.outcome}"><time>${time(r.end)}</time>${esc(t?.title || "")}${r.outcome === "fail" ? " — 실패" : r.outcome === "pass" ? " — 통과" : ""}</li>`; }).join("")}</ol></div></div></article>`;
  }).join("");
  const tasks = p.tasks.filter((t) => t.stage === stage.id), dn = tasks.filter((t) => t.status === "done").length;
  el.innerHTML = `${pend && !other ? approvalCard(p, pend) : ""}
    <div class="sec-h"><h2 class="h3">${stage.n} ${esc(stage.name)} <small>${esc(stage.say)}</small></h2>${other ? `<button class="btn sm" data-stage-reset>현재 단계로 돌아가기</button>` : ""}</div>
    ${other ? `<p class="explain"><b>${vi < p.stage ? "지난 단계" : "앞으로 할 단계"}를 보고 있습니다.</b> ${esc(stage.why)}</p>` : `<p class="explain"><b>왜 이 단계가 필요한가요?</b> ${esc(stage.why)}</p>`}
    <div class="agents">${agents}</div>
    <div class="sec-h"><h3 class="h4">이 단계의 작업 ${dn}/${tasks.length}</h3><button class="link" data-expand-all>${tasks.every((t) => ui.open.has(t.id)) ? "모두 접기" : "모두 펼치기"}</button></div>
    <ul class="tasks">${tasks.map((t) => taskRow(p, t, t === nextT && !pend)).join("") || '<li class="muted">작업이 없습니다.</li>'}</ul>
    <details class="gloss"><summary>용어 풀이 — 개발 용어를 쉬운 말로</summary><dl>${M.GLOSSARY.map(([a, b, c]) => `<div><dt>${esc(a)} <span class="tech">${esc(b)}</span></dt><dd>${esc(c)}</dd></div>`).join("")}</dl></details>`;
  bindApproval(p, el);
  $$("[data-agent]", el).forEach((b) => (b.onclick = () => { const k = b.dataset.agent; ui.agentOpen.has(k) ? ui.agentOpen.delete(k) : ui.agentOpen.add(k); b.setAttribute("aria-expanded", String(ui.agentOpen.has(k))); b.nextElementSibling.classList.toggle("open"); }));
  $$("[data-task]", el).forEach((b) => (b.onclick = () => { const id = b.dataset.task; ui.open.has(id) ? ui.open.delete(id) : ui.open.add(id); b.setAttribute("aria-expanded", String(ui.open.has(id))); b.closest(".task").querySelector(".fold").classList.toggle("open"); }));
  $("[data-expand-all]", el)?.addEventListener("click", () => { const all = tasks.every((t) => ui.open.has(t.id)); tasks.forEach((t) => (all ? ui.open.delete(t.id) : ui.open.add(t.id))); flow(find(p.id), el); });
  $("[data-stage-reset]", el)?.addEventListener("click", () => { ui.viewStage = null; vt(() => project(find(p.id), "flow")); });
}
function taskRow(p, t, isNext) {
  const r = t.run && p.runs.find((x) => x.id === t.run), open = ui.open.has(t.id);
  const st = t.status === "done" ? (r?.outcome === "fail" ? ["실패", "bad"] : r?.outcome === "pass" ? ["통과", "good"] : r?.outcome === "unknown" ? ["판정 없음", "idle"] : ["완료", "good"]) : isNext ? ["다음", "work"] : ["대기", "idle"];
  return `<li class="task ${isNext ? "next" : ""}"><span class="state ${st[1]}">${st[0]}</span><div>
    <button class="trow" type="button" data-task="${t.id}" aria-expanded="${open}"><b>${esc(t.title)}</b>${t.fix ? chip("수정 작업", "warn") : ""}<i aria-hidden="true">⌄</i></button>
    <span class="who">${agentDot(t.agent)}${esc(M.AGENTS[t.agent].name)} · ${t.skills.map((s) => esc(M.SKILLS[s].name)).join(", ")}</span>
    <div class="fold ${open ? "open" : ""}"><div><dl class="tdet">
      <div><dt>완료 기준</dt><dd>${esc(t.accept)}</dd></div>
      <div><dt>쉬운 설명</dt><dd>${t.skills.map((s) => esc(M.SKILLS[s].plain)).join(" ")}</dd></div>
      ${r ? `<div><dt>실행 기록</dt><dd>${time(r.start)} → ${time(r.end)} · ${Math.round((r.end - r.start) / 1000)}초${r.demo ? " · 가상" : r.review ? " · AI 검토(실행 아님)" : " · 실제 AI"}${r.note && r.note !== `완료 기준: ${t.accept}` ? `<br><span class="${r.outcome === "fail" ? "bad" : ""}">${esc(r.note)}</span>` : ""}</dd></div>` : `<div><dt>실행 기록</dt><dd class="muted">아직 실행하지 않았습니다 — 결과를 미리 적지 않습니다.</dd></div>`}
      ${r?.output ? `<div><dt>AI 산출물</dt><dd><pre class="aout">${esc(r.output)}</pre>${r.model ? `<span class="tech">${esc(r.model)}${r.usage ? ` · 입력 ${r.usage.in} · 출력 ${r.usage.out} 토큰` : ""}</span>` : ""}</dd></div>` : ""}
      ${prefs.expert && p.mode === "demo" ? `<div><dt>도구 호출</dt><dd><span class="tech">${toolCalls(t).join(" · ")}${r ? ` · run ${r.id}` : ""}</span></dd></div>` : ""}
    </dl></div></div></div></li>`;
}
// 전문가 보기: 스킬에서 예상되는 도구 호출(시연 기록임을 표시)
function toolCalls(t) {
  const m = { "req-analysis": "문서 작성 01_requirements.md", prioritize: "문서 수정 01_requirements.md", "ux-flow": "문서 작성 02_flow.md", "design-system": "파일 저장 tokens.css", "mobile-layout": "파일 수정 layout.css", "data-model": "문서 작성 03_data.md", "feature-impl": `파일 수정 src/${M.slug(t.title.replace(/ 만들기|수정/g, ""))}`, "finance-calc": "코드 실행 calc.test", "auth-impl": "파일 수정 auth", "test-writing": "명령 실행 npm test", "ui-check": "브라우저 검사 390px·1440px", "a11y-check": "접근성 검사 axe", "build-check": "명령 실행 build", "content-write": "문서 작성 draft.md", "source-check": "웹 검색 · 원문 대조", "channel-format": "문서 수정 channels.md", "automation-design": "문서 작성 rules.md", integration: "연결 설정 확인" };
  return t.skills.map((s) => m[s]).filter(Boolean);
}
function approvalCard(p, a) {
  const needs = a.gate === "decisions" && p.decisions.some((d) => !d.choice);
  return `<section class="card approve" aria-labelledby="ap-h"><p class="eyebrow">AI 개발팀이 결정을 요청합니다</p><h2 id="ap-h">${esc(a.title)}</h2><p>${esc(a.text)}</p>
    ${a.gate === "scope" ? `<ul class="scope">${p.features.map((f) => `<li>${f.must ? chip("필수", "accent") : chip("권장", "idle")} <b>${esc(f.name)}</b> — ${esc(f.why)}</li>`).join("")}</ul>` : ""}
    ${a.gate === "decisions" ? p.decisions.map(decisionBlock).join("") : ""}
    ${a.gate === "review" ? `<p class="explain">검사 결과: ${esc(M.summary(p).proof)}. <a href="#/p/${p.id}/proof">자세히 보기</a>${p.mode === "demo" ? " · 시연에서는 실제 미리보기 주소가 만들어지지 않습니다." : ""}</p>` : ""}
    ${a.gate === "launch" && p.mode === "demo" ? '<p class="explain">시연 모드에서는 승인해도 실제로 공개되지 않으며, ‘운영환경 배포’ 검사는 ‘실행 안 함’으로 남습니다.</p>' : ""}
    <div class="ap-row"><button class="btn primary" data-approve="${a.id}" ${needs ? "disabled" : ""}>승인</button>
      <input id="rsn" placeholder="반려 사유(선택)" maxlength="80" aria-label="반려 사유"><button class="btn" data-reject="${a.id}">반려 — 이 단계부터 다시</button></div>
    ${needs ? '<p class="fine">모든 선택지를 고르면 승인할 수 있습니다.</p>' : ""}</section>`;
}
function decisionBlock(d) {
  return `<fieldset class="dec"><legend>${esc(d.q)}</legend><div class="opts">${d.opts.map((o) => `<label class="opt ${d.choice === o.k ? "on" : ""}"><input type="radio" name="d-${d.id}" value="${o.k}" data-dec="${d.id}" ${d.choice === o.k ? "checked" : ""}><b>${o.k}. ${esc(o.label)}</b>
    <span><i>이점</i>${esc(o.pro)}</span><span><i>비용</i>${esc(o.cost)}</span><span><i>위험</i>${esc(o.risk)}</span></label>`).join("")}</div></fieldset>`;
}
function bindApproval(p, el) {
  const tab = location.hash.split("/")[3] || "flow";
  $$("[data-dec]", el).forEach((r) => (r.onchange = () => { const np = M.choose(find(p.id), r.dataset.dec, r.value); put(np); project(np, tab); }));
  $$("[data-approve]", el).forEach((b) => (b.onclick = () => { const np = M.approve(find(p.id), b.dataset.approve); put(np); project(np, tab); }));
  $$("[data-reject]", el).forEach((b) => (b.onclick = () => { const np = M.reject(find(p.id), b.dataset.reject, $("#rsn", el)?.value || ""); put(np); project(np, tab); }));
}

// 설계도
function bp(p, el) {
  el.innerHTML = `<section class="card"><p class="eyebrow">프로젝트 목표</p><p class="goal">${esc(p.goal)}</p>
    <p class="fine">처음 설명: “${esc(p.idea)}”</p>
    <p class="fine">이 설계도는 <b>키워드 규칙으로 만든 초안</b>입니다(${esc(p.confidence)}). 실제 AI 분석 결과가 아니며, 범위 확인 단계에서 반려하면 다시 정리합니다.</p></section>
    <h2 class="h3">핵심 기능 <small>${p.features.length}개 · 기능마다 완료 기준</small></h2>
    <div class="tbl" role="region" aria-label="핵심 기능 표" tabindex="0"><table><thead><tr><th>구분</th><th>기능</th><th>왜 필요한가</th><th>완료 기준</th></tr></thead><tbody>
    ${p.features.map((f) => `<tr><td>${f.must ? chip("필수", "accent") : chip("권장", "idle")}</td><td><b>${esc(f.name)}</b></td><td>${esc(f.why)}</td><td>${esc(f.accept)}</td></tr>`).join("")}</tbody></table></div>
    <h2 class="h3">결정이 필요한 것</h2><ul class="plain">${p.decisions.map((d) => `<li>${esc(d.q)} — ${d.choice ? `<b>${d.choice}. ${esc(d.opts.find((o) => o.k === d.choice).label)}</b>` : "아직 고르지 않음"}</li>`).join("")}</ul>
    <h2 class="h3">작업 순서 <small>${p.tasks.length}개</small></h2>
    <ol class="plain">${M.STAGES.map((s) => `<li><b>${s.n} ${esc(s.name)}</b> ${prefs.expert ? `<span class="tech">${esc(s.tech)}</span>` : ""} — ${p.tasks.filter((t) => t.stage === s.id).map((t) => esc(t.title)).join(", ") || "—"}</li>`).join("")}</ol>`;
}
// AI 팀
function team(p, el) {
  el.innerHTML = `<p class="explain"><b>에이전트</b>는 일을 하는 AI 직원이고, <b>스킬</b>은 그 직원이 쓰는 업무 절차입니다. 한 직원이 여러 스킬을 쓰고, 같은 스킬을 여러 직원이 함께 쓰기도 합니다.</p>
  <div class="agents">${Object.entries(M.AGENTS).map(([k, a]) => { const mine = p.tasks.filter((t) => t.agent === k), sk = [...new Set(mine.flatMap((t) => t.skills))], runs = p.runs.filter((r) => r.agent === k);
    return `<article class="card agent"><header>${agentDot(k)}<b>${T(a.name, a.tech)}</b></header><p>${esc(a.does)}</p><p class="lbl">보유 스킬</p><div class="chips">${sk.map((s) => chip(M.SKILLS[s].name, "skill")).join("")}</div>
    <div class="meter" aria-hidden="true"><span style="--w:${mine.length ? (mine.filter((t) => t.status === "done").length / mine.length) * 100 : 0}%"></span></div>
    <p class="meta">맡은 작업 ${mine.length} · 완료 ${mine.filter((t) => t.status === "done").length} · 실행 ${runs.length}회${runs.some((r) => r.demo) ? " (가상)" : ""}${k === "qa" ? " · 만든 쪽과 분리된 독립 검수" : ""}</p></article>`; }).join("")}</div>
  <h2 class="h3">단계별 담당 <small>누가 어느 단계에서 일하는지</small></h2>
  <div class="tbl" role="region" aria-label="단계별 담당" tabindex="0"><table class="matrix"><thead><tr><th>에이전트</th>${M.STAGES.map((s) => `<th>${s.n} ${esc(s.name)}</th>`).join("")}</tr></thead><tbody>
  ${Object.keys(M.AGENTS).map((k) => `<tr><td>${agentDot(k)} <b>${esc(M.AGENTS[k].name)}</b></td>${M.STAGES.map((s) => { const n = p.tasks.filter((t) => t.agent === k && t.stage === s.id).length; return `<td class="mx">${n ? `<span class="mdot ${M.AGENTS[k].color} full">${n}</span>` : ""}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
}
// 스킬 인스펙터 — 표 / 에이전트×스킬 매트릭스
function skills(p, el) {
  const u = M.skillUsage(p), ag = Object.keys(M.AGENTS), view = ui.skillView;
  const table = `<div class="tbl" role="region" aria-label="스킬 표" tabindex="0"><table><thead><tr><th>스킬</th><th>하는 일</th><th>쓰는 에이전트</th><th>진행</th></tr></thead><tbody>
  ${Object.entries(u).map(([k, v]) => `<tr><td><b>${esc(M.SKILLS[k].name)}</b>${prefs.expert ? `<br><span class="tech">${esc(M.SKILLS[k].tech)}</span>` : ""}</td><td>${esc(M.SKILLS[k].plain)}</td><td>${v.agents.map((a) => `<span class="who">${agentDot(a)}${esc(M.AGENTS[a].name)}</span>`).join("")}${v.agents.length > 1 ? chip("공유", "accent") : ""}</td><td class="num"><span class="minibar" style="--w:${(v.done / v.tasks) * 100}%"></span>${v.done}/${v.tasks}</td></tr>`).join("")}</tbody></table></div>`;
  const cell = (k, a) => { const ts = p.tasks.filter((t) => t.agent === a && t.skills.includes(k)); if (!ts.length) return `<td class="mx"><span class="sr">없음</span></td>`; const d = ts.filter((t) => t.status === "done").length;
    return `<td class="mx"><span class="mdot ${M.AGENTS[a].color} ${d === ts.length ? "full" : d ? "half" : ""}" title="${esc(M.AGENTS[a].name)} · ${esc(M.SKILLS[k].name)} — ${d}/${ts.length}">${ts.length}</span></td>`; };
  const matrix = `<div class="tbl" role="region" aria-label="에이전트와 스킬 매트릭스" tabindex="0"><table class="matrix"><thead><tr><th>스킬 \\ 에이전트</th>${ag.map((a) => `<th>${agentDot(a)} ${esc(M.AGENTS[a].name.replace(" AI", ""))}</th>`).join("")}</tr></thead><tbody>
    ${Object.keys(u).map((k) => `<tr><td><b>${esc(M.SKILLS[k].name)}</b></td>${ag.map((a) => cell(k, a)).join("")}</tr>`).join("")}</tbody></table></div>
    <p class="fine">숫자 = 그 에이전트가 그 스킬을 쓰는 작업 수 · 꽉 찬 점 = 모두 완료, 테두리 = 일부 완료, 점선 = 아직</p>`;
  el.innerHTML = `<div class="sec-h"><p class="explain grow">각 스킬을 누가, 몇 번 쓰는지 봅니다. 한 줄에 여러 에이전트가 있으면 같은 기준(스킬)을 공유한다는 뜻입니다.</p>
    <div class="toggle" role="group" aria-label="보기 방식"><button type="button" data-sv="table" aria-pressed="${view === "table"}">표</button><button type="button" data-sv="matrix" aria-pressed="${view === "matrix"}">매트릭스</button></div></div>
    ${view === "matrix" ? matrix : table}`;
  $$("[data-sv]", el).forEach((b) => (b.onclick = () => { ui.skillView = prefs.skillView = b.dataset.sv; savePrefs(); vt(() => skills(p, el)); }));
}
// 결정·승인
function decide(p, el) {
  const pend = M.pendingApproval(p);
  el.innerHTML = `${pend ? approvalCard(p, pend) : '<p class="explain">지금 기다리는 승인 요청이 없습니다. AI 팀은 범위 확인 · 설계 결정 · 최종 검토 · 공개 승인 네 지점에서만 멈추고 결정을 요청합니다.</p>'}
    ${!pend || pend.gate !== "decisions" ? `<h2 class="h3">설계 결정 <small>미리 골라 둘 수 있습니다</small></h2>${p.decisions.map(decisionBlock).join("")}` : ""}
    <h2 class="h3">승인 기록</h2>
    <ul class="tasks">${p.approvals.length ? p.approvals.slice().reverse().map((a) => `<li class="task"><span class="state ${a.status === "approved" ? "good" : a.status === "rejected" ? "bad" : "wait"}">${{ approved: "승인", rejected: "반려", pending: "대기" }[a.status]}</span><div><b>${esc(a.title)}</b><span class="who">요청 ${date(a.asked)}${a.at ? ` · 처리 ${date(a.at)}` : ""}${a.reason ? ` · 사유: ${esc(a.reason)}` : ""}</span></div></li>`).join("") : '<li class="muted">아직 없습니다.</li>'}</ul>`;
  bindApproval(p, el);
}
// 결과·검증 — 요약 링 + 필터
function proof(p, el) {
  const arts = p.tasks.filter((t) => t.status === "done" && !t.check).map((t) => ({ t, name: (toolCalls(t)[0] || "산출물").replace(/^[^ ]+ [^ ]+ /, "") }));
  const c = (k) => p.evidence.filter((e) => e.status === k).length, F = [["all", "전체", p.evidence.length], ["pass", "통과", c("pass")], ["fail", "실패", c("fail")], ["unverified", "미검증", c("unverified") + c("skipped")]];
  const list = p.evidence.filter((e) => ui.proofF === "all" || e.status === ui.proofF || (ui.proofF === "unverified" && e.status === "skipped"));
  el.innerHTML = `<div class="proof-top"><div class="card">${ring([{ v: c("pass"), cls: "good", label: "통과" }, { v: c("fail"), cls: "bad", label: "실패" }, { v: c("unverified") + c("skipped"), cls: "idle", label: "미검증" }], c("pass"), `/ ${p.evidence.length} 통과`)}</div>
    <p class="explain">AI가 ‘완성했다’고 말하는 것과 실제로 작동하는 것은 다릅니다. 아래 표는 검사 기록만으로 채웁니다. 검사를 실행하지 않은 항목은 <b>미검증</b>입니다.${p.mode === "demo" ? " 이 프로젝트는 시연이므로 모든 결과가 <b>가상</b>입니다." : " 이 프로젝트의 판정은 품질 검수 AI가 산출물을 읽고 내린 <b>AI 검토</b>이며, 코드를 실행한 검사가 아닙니다."}</p></div>
  <div class="toggle filters" role="group" aria-label="결과 필터">${F.map(([k, t, n]) => `<button type="button" data-pf="${k}" aria-pressed="${ui.proofF === k}">${t} <span>${n}</span></button>`).join("")}</div>
  <div class="tbl" role="region" aria-label="검증 결과 표" tabindex="0"><table class="ev"><thead><tr><th>확인 항목</th><th>결과</th><th>근거</th></tr></thead><tbody>
  ${list.map((e) => { const [t, k] = EV[e.status]; const runs = e.runs.map((r) => { const run = p.runs.find((x) => x.id === r.run); return `<li>${time(r.at)} · ${{ pass: "통과", fail: "실패" }[r.result] || "판정 없음"} · ${esc(M.AGENTS[run.agent].name)}${r.demo ? " · 가상" : r.review ? " · AI 검토" : ""}${run.note ? ` — ${esc(run.note)}` : ""}</li>`; }).join("");
    return `<tr><td><b>${esc(e.name)}</b></td><td><span class="state ${k}">${t}</span>${e.status === "pass" && p.mode === "demo" ? chip("가상", "warn") : e.kind === "ai-review" && e.status !== "unverified" ? chip("AI 검토", "idle") : ""}</td><td>${runs ? `<details><summary>실행 ${e.runs.length}회</summary><ul>${runs}</ul></details>` : `<span class="muted">${esc(e.note || "실행 기록 없음")}</span>`}</td></tr>`; }).join("") || '<tr><td colspan="3" class="muted">해당 항목이 없습니다.</td></tr>'}
  </tbody></table></div>
  <h2 class="h3">산출물 <small>${arts.length}개${p.mode === "demo" ? " · 시연 기록(실제 파일 없음)" : ""}</small></h2>
  <div class="arts">${arts.length ? arts.map(({ t, name }) => `<div class="card art"><span class="ficon" aria-hidden="true">${/\.md|문서/.test(name) ? "¶" : /css|tokens/.test(name) ? "◐" : "{ }"}</span><div><b>${esc(t.title)}</b><span class="who">${agentDot(t.agent)}${esc(M.AGENTS[t.agent].name)}</span>${prefs.expert ? `<span class="tech">${esc(name)}</span>` : ""}</div></div>`).join("") : '<p class="muted">아직 없습니다.</p>'}</div>`;
  $$("[data-pf]", el).forEach((b) => (b.onclick = () => { ui.proofF = b.dataset.pf; proof(p, el); countUp(el); }));
}
// 이력 — 종류 필터 + 검색
function histTab(p, el) {
  const K = [["all", "전체"], ["run", "실행"], ["approval", "승인 요청"], ["decide", "결정·승인"], ["stage", "단계"]];
  const match = (h) => (ui.histF === "all" || h.kind === ui.histF || (ui.histF === "decide" && ["decision", "approve", "reject"].includes(h.kind)) || (ui.histF === "stage" && ["stage", "create", "done", "pause", "resume"].includes(h.kind))) && (!ui.histQ || h.text.includes(ui.histQ));
  const draw = () => { const L = p.history.filter(match).reverse();
    $("#hl", el).innerHTML = L.length ? L.map((h) => `<li class="${h.kind}"><time>${date(h.at)}</time><span>${esc(h.text)}${h.demo && ["run", "done"].includes(h.kind) ? ' <span class="muted">(가상)</span>' : ""}${prefs.expert && h.run ? ` <span class="tech">${h.run}</span>` : ""}</span></li>`).join("") : '<li class="muted">조건에 맞는 기록이 없습니다.</li>';
    $("#hc", el).textContent = `${L.length} / ${p.history.length}건`; };
  el.innerHTML = `<div class="sec-h"><div class="toggle filters" role="group" aria-label="이력 종류">${K.map(([k, t]) => `<button type="button" data-hf="${k}" aria-pressed="${ui.histF === k}">${t}</button>`).join("")}</div>
    <label class="search"><span class="sr">이력 검색</span><input id="hq" type="search" placeholder="이력 검색 (예: 실패)" value="${esc(ui.histQ)}"></label><small id="hc" class="muted"></small></div>
    <ol class="hist" id="hl"></ol>`;
  draw();
  $$("[data-hf]", el).forEach((b) => (b.onclick = () => { ui.histF = b.dataset.hf; $$("[data-hf]", el).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); }));
  $("#hq", el).oninput = (e) => { ui.histQ = e.target.value.trim(); draw(); };
}

// ── 실제 실행(LIVE) — 연결 상태를 있는 그대로 ──
function live() {
  document.title = "실제 실행 연결 · Atelier AX";
  app.innerHTML = `<div class="wrap proj-page"><nav class="crumb"><a href="#/">프로젝트 스튜디오</a> › 실제 실행</nav>
    <h1>실제 AI 실행 연결</h1>
    <section class="card status">${liveOk() ? `<span class="state good">AI 연결됨</span><p><b>Claude API(${esc(LIVE.info.model)})</b>가 서버 함수로 연결돼 있습니다. 홈에서 ‘실제 AI’를 고르고 접근 코드를 넣으면 설계도·작업 산출물·검사 판정을 AI가 실제로 씁니다. <b>코드 실행 환경 · GitHub · 배포</b>는 아직 연결돼 있지 않아, 검사는 ‘AI 검토(실행 아님)’, 공개는 ‘실행 안 함’으로 남습니다.</p>` : `<span class="state idle">연결 안 됨</span><p>${esc(LIVE.info?.reason || "확인 중…")}. 서버 함수에 <code>ANTHROPIC_API_KEY</code>와 <code>STUDIO_ACCESS_CODE</code>가 모두 설정되면 켜집니다. 그 전까지는 시연(가상)만 가능하며, 연결된 것처럼 표시하지 않습니다.</p>`}</section>
    <h2 class="h3">연결되면 이렇게 흐릅니다</h2>
    <ol class="pipe">${[["프로젝트 스튜디오", "사용자 화면"], ["프로젝트 오케스트레이터", "요구사항 · 작업 상태 · 실행 순서"], ["기획 · 디자인 · 개발 · 검수 에이전트", "에이전트별 스킬과 권한"], ["격리된 실행 환경", "사용자 명령을 일반 서버에서 바로 실행하지 않음 · 자원 제한 · 비밀정보 분리"], ["GitHub", "코드 · 변경 이력 · 리뷰"], ["자동 검증", "테스트 · 빌드 · 화면 검사"], ["미리보기(Preview)", "공개 전 확인용 주소"], ["사용자 승인", "최종 검토 · 공개 승인"], ["서비스 공개(Production)", "승인된 판만"]].map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join("")}</ol>
    <h2 class="h3">개발 순서</h2>
    <div class="tbl" tabindex="0" role="region" aria-label="개발 순서"><table><thead><tr><th>단계</th><th>범위</th><th>상태</th></tr></thead><tbody>
      ${[["1차", "비개발자용 프로젝트 제작 화면 · 시연", "완료"], ["2차", "AI 요구사항 분석 · 작업 설계(실제 모델 호출)", "이번 판"], ["3차", "에이전트별 작업 실행 · 실시간 스트리밍 · AI 검토", "이번 판"], ["4차", "GitHub · 격리 실행 · 자동 테스트", "예정"], ["5차", "승인 · Preview · 배포", "예정"]].map(([a, b, c]) => `<tr><td>${a}</td><td>${esc(b)}</td><td>${c === "이번 판" ? chip(c, "accent") : c === "완료" ? chip(c, "good") : chip(c, "idle")}</td></tr>`).join("")}</tbody></table></div>
    <p class="fine">외부 사용자에게 Claude 기반 기능을 제공할 때는 개인 구독이 아니라 API 인증(Claude Agent SDK · API 키)을 써야 하며, 비용·권한·비밀정보 관리는 서버에서만 다룹니다.</p></div>`;
}

// ── AI 작업 모델하우스 / 브리지 — 기본은 더미 각본 시뮬레이션, 서버가 준비되면 실제 연결도 같은 화면으로 ──
let btimer = null;
const clock = (t) => { const d = new Date(t), p = (n) => String(n).padStart(2, "0"); return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };
const BUI = { open: new Set(), data: null, err: "", sim: null, speed: Number(prefs.simSpeed) || 1, playing: !reduce, mode: prefs.bmode === "real" ? "real" : "sim", prevSt: {} };
async function bridgeFetch() {
  try {
    const r = await fetch("/api/bridge/feed/", { cache: "no-store", headers: { "x-studio-code": prefs.code || "" } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { BUI.err = r.status === 404 ? "이 주소에는 서버 함수가 없습니다(정적 사본)" : j.error || `HTTP ${r.status}`; if (r.status === 401 || j.bridge === false) BUI.data = null; }
    else { BUI.err = ""; BUI.data = j; }
  } catch { BUI.err = "서버에 연결할 수 없습니다"; }
}
const realOk = () => !!LIVE.info?.bridge;
function bridge() {
  document.title = "AI 작업 모델하우스 · Atelier AX";
  if (BUI.mode === "real" && !realOk()) BUI.mode = "sim";
  if (!BUI.sim) { BUI.sim = SIM.createSim({ seed: 20261028 }); SIM.tick(BUI.sim, 9000); } // 처음 열면 몇 걸음 진행된 상태로
  drawShell(); clearInterval(btimer);
  if (BUI.mode === "sim") {
    let last = performance.now();
    btimer = setInterval(() => { const now = performance.now(), dt = now - last; last = now; if (!BUI.playing || document.hidden) return; SIM.tick(BUI.sim, Math.min(dt, 1000) * BUI.speed); bupdate(); }, 250);
    bupdate();
  } else {
    const pull = async () => { if (document.hidden || /접근 코드/.test(BUI.err)) return; await bridgeFetch(); if (location.hash.split("/")[1] === "bridge") bupdate(); };
    pull(); btimer = setInterval(pull, 3000);
  }
}
const bsource = () => BUI.mode === "sim" ? { events: BUI.sim.events, now: SIM.simNow(BUI.sim) } : { events: BUI.data?.events || [], now: Date.now() };
function drawShell() {
  const sim = BUI.mode === "sim", host = location.origin;
  app.innerHTML = `<div class="wrap wide proj-page bridge ${sim ? "is-sim" : ""}"><nav class="crumb" aria-label="위치"><a href="#/">프로젝트 스튜디오</a> <span aria-hidden="true">›</span> AI 작업 모델하우스</nav>
    <header class="ph"><div><h1>AI 작업 모델하우스</h1><p class="muted">${sim ? "실제 AI·API 키 없이 <b>더미 각본</b>으로 움직이는 시뮬레이션입니다. 화면의 작업은 실제로 일어나지 않았습니다." : "연결한 AI 도구가 보내는 실제 작업 기록 · 보기 전용 · 최근 24시간"}</p></div>
      <div class="toggle" role="radiogroup" aria-label="보기 방식"><button type="button" role="radio" data-bm="sim" aria-checked="${sim}">모델하우스</button><button type="button" role="radio" data-bm="real" aria-checked="${!sim}" ${realOk() ? "" : 'disabled title="서버 연결이 없어 실제 연결은 꺼져 있습니다"'}>실제 연결</button></div></header>
    ${sim ? `<div class="simbar card"><span class="chip warn">시뮬레이션 · 가상</span>
      <button class="btn sm" id="sPlay" aria-pressed="${BUI.playing}">${BUI.playing ? "일시정지" : "재생"}</button>
      <div class="toggle" role="radiogroup" aria-label="속도">${[1, 2, 4].map((v) => `<button type="button" role="radio" data-sp="${v}" aria-checked="${BUI.speed === v}">${v}×</button>`).join("")}</div>
      <button class="btn sm" id="sFail" title="일하는 AI 하나의 다음 검사를 실패시킵니다">사고 넣기</button><button class="btn sm ghost" id="sReset">처음부터</button>
      <span class="simclock" id="sClock" aria-live="off"></span></div>`
    : `<div class="simbar card"><span class="lstate ${BUI.data ? "on" : ""}" id="rState">${BUI.data ? "연결됨 · 3초마다 갱신" : esc(BUI.err || "확인 중…")}</span>
      ${/접근 코드/.test(BUI.err) || !prefs.code ? `<form id="bcode" class="inline"><label class="sr" for="bc">접근 코드</label><input id="bc" type="password" autocomplete="off" placeholder="접근 코드"><button class="btn sm primary">보기</button></form>` : ""}</div>`}
    <div class="bhud" id="bhud"></div>
    <div class="mh"><section class="card floorbox" aria-label="모델하우스 평면">${FL.scene()}</section>
      <aside class="card ticker" aria-label="방금 일어난 일"><h2 class="sh">방금 일어난 일</h2><ol id="tick"></ol></aside></div>
    <ul class="key bkey" aria-label="범례">${[["edit", "수정·산출물"], ["run", "실행·도구"], ["test", "검사"], ["read", "읽기·찾기·웹"], ["prompt", "지시·시작"], ["done", "완료"], ["fail", "실패"]].map(([k, t]) => `<li><svg viewBox="-9 -9 18 18" class="lane-svg" aria-hidden="true"><g class="ev ${k} ${BR.KIND[k][1]}">${BR.shape(k)}</g></svg>${t}</li>`).join("")}
      ${Object.entries(FL.SRC_STYLE).map(([k, [c, i]]) => `<li><span class="srcdot ${c}" aria-hidden="true">${i}</span>${esc(BR.srcName(k))}</li>`).join("")}</ul>
    <h2 class="h3">작업 줄기 <small>AI 하나의 일 한 건이 한 줄 · 눌러서 기록 보기</small></h2><div class="lanes" id="lanes"></div>
    <details class="card setup"><summary>실제 AI 도구 연결 방법 (나중에 — 지금은 필요 없음)</summary>
      <p class="fine">모델하우스는 서버·키 없이 이 브라우저 안에서만 돕니다. 실제로 연결하려면 Vercel 환경변수 <code>SUPABASE_URL</code> · <code>SUPABASE_SERVICE_ROLE_KEY</code> · <code>BRIDGE_TOKEN</code> · <code>STUDIO_ACCESS_CODE</code> 와 Supabase 표(<code>supabase/atelier_bridge.sql</code>)가 필요합니다. Claude Code 는 <code>connectors/claude-code/atelier-hook.mjs</code> 를 훅으로 등록하고, 다른 도구는 같은 형식으로 POST 합니다.</p>
      <pre class="aout">curl -X POST ${esc(host)}/api/bridge/events/ \\
  -H "Authorization: Bearer $ATELIER_BRIDGE_TOKEN" -H "content-type: application/json" \\
  -d '{"session":"작업-1","source":"gemini","agent":"Gemini","project":"리포트","kind":"output","title":"요약 초안 작성"}'</pre></details></div>`;
  const fb = $(".floorbox"); if (fb && fb.scrollWidth > fb.clientWidth) fb.scrollLeft = (fb.scrollWidth - fb.clientWidth) / 2;
  $$("[data-bm]").forEach((b) => (b.onclick = () => { if (b.disabled) return; BUI.mode = prefs.bmode = b.dataset.bm; savePrefs(); bridge(); }));
  $("#sPlay")?.addEventListener("click", (e) => { BUI.playing = !BUI.playing; e.currentTarget.setAttribute("aria-pressed", String(BUI.playing)); e.currentTarget.textContent = BUI.playing ? "일시정지" : "재생"; });
  $$("[data-sp]").forEach((b) => (b.onclick = () => { BUI.speed = prefs.simSpeed = Number(b.dataset.sp); savePrefs(); $$("[data-sp]").forEach((x) => x.setAttribute("aria-checked", String(x === b))); }));
  $("#sFail")?.addEventListener("click", () => { const who = SIM.injectFailure(BUI.sim); toast(who ? `${who}의 다음 검사가 실패합니다 — 복구 과정을 지켜보세요 (가상)` : "지금 실패시킬 작업이 없습니다", "warn"); });
  $("#sReset")?.addEventListener("click", () => { BUI.sim = SIM.createSim({ seed: (Date.now() % 1e6) + 1 }); BUI.prevSt = {}; $(".pawns").innerHTML = ""; bupdate(); });
  $("#bcode")?.addEventListener("submit", async (e) => { e.preventDefault(); prefs.code = $("#bc").value.trim(); savePrefs(); await bridgeFetch(); bridge(); });
}
function bupdate() {
  if (location.hash.split("/")[1] !== "bridge" || !$("#bhud")) return;
  if (!$(".pawns")?.children.length) BUI.sig = "";
  const { events, now } = bsource(), sim = BUI.mode === "sim", ses = BR.sessions(events, now);
  const recent = (x) => now - Date.parse(x.last) < (x.state === "done" ? 5000 : 12e4);
  const onFloor = ses.filter(recent), dayEv = events.filter((e) => now - Date.parse(e.at) < 864e5), cnt = (k) => dayEv.filter((e) => k.includes(e.kind)).length;
  const st = sim ? BUI.sim.stats : null, perMin = events.filter((e) => now - Date.parse(e.at) < 6e4).length;
  $("#bhud").innerHTML = [["일하는 AI", onFloor.filter((x) => x.state !== "done").length], ["완료한 일", sim ? st.done : ses.filter((x) => x.state === "done").length], ["실패 → 복구", sim ? `${st.fails} → ${st.recovered}` : cnt(["fail"]), sim && st.fails > st.recovered ? "bad" : ""], ["분당 처리", perMin], ["오늘 기록", dayEv.length]]
    .map(([k, v, c]) => `<div class="${c || ""}"><span>${k}</span><b>${v}</b></div>`).join("");
  if (sim) $("#sClock").textContent = `시뮬 시각 ${clock(now)} · ${BUI.speed}×`;
  else { const r = $("#rState"); if (r) { r.textContent = BUI.data ? "연결됨 · 3초마다 갱신" : BUI.err || "확인 중…"; r.classList.toggle("on", !!BUI.data); } }
  // 평면 위 말 — 자리별로 칸을 나눠 세운다
  const layer = $(".pawns"), seenKeys = new Set(), per = {};
  for (const x of onFloor.slice().reverse()) {
    const mine = events.filter((e) => e.session === x.session), last = mine.at(-1), prev = BUI.prevSt[x.session];
    const stn = FL.stationFor(last.kind, prev); BUI.prevSt[x.session] = stn;
    const slot = (per[stn] = (per[stn] || 0) + 1) - 1, [px, py] = FL.spot(stn, slot), label = (BR.KIND[last.kind] || BR.KIND.note)[0];
    let g = layer.querySelector(`[data-pawn="${CSS.escape(x.session)}"]`);
    if (!g) { const sp = FL.spot("desk", 3); layer.insertAdjacentHTML("beforeend", FL.pawnHTML(esc(x.session), x.source, label)); g = layer.lastElementChild; g.style.transform = `translate(${sp[0]}px, ${sp[1] - 30}px)`; g.style.opacity = "0"; g.getBoundingClientRect(); }
    g.style.opacity = ""; g.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
    g.setAttribute("class", `fp ${FL.srcStyle(x.source)[0]} ${x.state} k-${last.kind}`);
    g.querySelector(".tag text").textContent = label;
    g.querySelector("title")?.remove(); g.insertAdjacentHTML("afterbegin", `<title>${esc(BR.srcName(x.source))} · ${esc(x.project || "")} — ${esc(last.title)}</title>`);
    seenKeys.add(x.session);
  }
  layer.querySelectorAll("[data-pawn]").forEach((g) => { if (!seenKeys.has(g.dataset.pawn)) { g.style.opacity = "0"; setTimeout(() => !seenKeys.has(g.dataset.pawn) && g.remove(), 600); } });
  // 사람이 하는 일이 단순해지도록: 누군가 있는 자리만 밝게
  $$(".floor .st").forEach((g) => { const n = per[g.dataset.st] || 0; g.classList.toggle("busy", n > 0); g.querySelector(".st-c").textContent = n ? `· ${n}` : ""; });
  // 아래는 기록이 바뀔 때만 다시 그린다(애니메이션·펼침 상태 유지)
  const sig = `${events.at(-1)?.id || 0}:${events.length}:${BUI.mode}`;
  if (BUI.sig === sig && $("#tick").children.length) return;
  const fresh = BUI.sig ? Number(BUI.sig.split(":")[0]) : Infinity; BUI.sig = sig;
  // 방금 일어난 일
  $("#tick").innerHTML = events.slice(-9).reverse().map((e) => { const [lb, col] = BR.KIND[e.kind] || BR.KIND.note, [sc, si] = FL.srcStyle(e.source);
    return `<li class="${e.kind} ${e.id > fresh ? "new" : ""}"><i class="srcdot ${sc}" aria-hidden="true">${si}</i><span class="kd ${col}">${lb}</span><span class="tt">${esc(e.title.replace(/^[^·]+ · /, ""))}</span><time>${clock(e.at)}</time></li>`; }).join("") || '<li class="muted">아직 기록이 없습니다.</li>';
  // 작업 줄기 — 최근 6건
  const show = ses.slice(0, 6);
  $("#lanes").innerHTML = show.map((x) => { const mine = events.filter((e) => e.session === x.session), open = BUI.open.has(x.session), [stt, sc] = BR.STATE[x.state];
    return `<article class="lane card ${x.state}"><button class="lane-h" type="button" data-lane="${esc(x.session)}" aria-expanded="${open}">
        <i class="srcdot ${FL.srcStyle(x.source)[0]}" aria-hidden="true">${FL.srcStyle(x.source)[1]}</i><b>${esc(x.project || x.agent)}</b><span class="state ${sc}">${stt}</span>
        <span class="now-t">${esc(x.lastTitle)}</span><time>${clock(x.last)}</time><i class="chev" aria-hidden="true">⌄</i></button>
      ${BR.lane(x, mine, 0)}
      <div class="fold ${open ? "open" : ""}"><div><ol class="evlist">${mine.slice(-40).reverse().map((e) => { const [lb, col] = BR.KIND[e.kind] || BR.KIND.note;
        return `<li class="${e.kind}"><time>${clock(e.at)}</time><span class="kd ${col}">${lb}</span><span>${esc(e.title)}${e.detail ? `<small>${esc(e.detail)}</small>` : ""}</span></li>`; }).join("")}</ol></div></div></article>`; }).join("")
    || `<div class="card empty"><b>아직 받은 기록이 없습니다.</b><p>${sim ? "잠시 뒤 AI들이 움직이기 시작합니다." : "AI 도구를 연결하면 작업할 때마다 여기에 줄이 생깁니다."}</p></div>`;
  $$(".lane-scroll").forEach((x) => (x.scrollLeft = x.scrollWidth));
  $$("[data-lane]").forEach((b) => (b.onclick = () => { const k = b.dataset.lane; BUI.open.has(k) ? BUI.open.delete(k) : BUI.open.add(k); b.setAttribute("aria-expanded", String(BUI.open.has(k))); b.parentElement.querySelector(".fold").classList.toggle("open"); }));
}

// ── 키보드 단축키 ──
addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  const [, a, id] = location.hash.split("/"), inP = a === "p" && find(id);
  const k = e.key.toLowerCase();
  if (k === "?") { e.preventDefault(); $("#help").showModal(); return; }
  if (k === "e") { $("#expert").click(); return; }
  if (k === "g") { location.hash = "#/"; return; }
  if (!inP) return;
  if (k === "n") $("#go:not(:disabled)")?.click();
  else if (k === "a") $("#auto:not(:disabled)")?.click();
  else if (k === "p") ($("#pause") || $("#resume"))?.click();
  else if (/^[1-7]$/.test(k)) location.hash = `#/p/${id}/${TABS[Number(k) - 1][0]}`;
});
document.addEventListener("click", (e) => { if (e.target.closest("[data-help]")) $("#help").showModal(); });

// ── 헤더: 전문가 보기 토글 ──
$("#expert").onclick = () => { prefs.expert = !prefs.expert; savePrefs(); vt(route); toast(prefs.expert ? "전문가 보기 — 기술 용어·도구 호출을 함께 봅니다" : "초보자 보기 — 쉬운 말로만 봅니다"); };
route(); health();
