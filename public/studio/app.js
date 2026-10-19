// Atelier AX · Project Studio — 화면(해시 라우터). 상태 전이는 model.js, 저장은 이 브라우저(localStorage)만.
import * as M from "./model.js";

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

// ── 라우터 ──
const app = $("#app");
let timer = null;
function route() {
  clearInterval(timer); timer = null;
  const [, a, id, tab] = location.hash.split("/");
  if (a === "p" && find(id)) project(find(id), tab || "flow");
  else if (a === "live") live();
  else home();
  $("#expert")?.setAttribute("aria-pressed", String(!!prefs.expert));
}
addEventListener("hashchange", () => { route(); scrollTo({ top: 0 }); });

// ── 공통 조각 ──
const chip = (t, k = "") => `<span class="chip ${k}">${esc(t)}</span>`;
const demoChip = (p) => (p.mode === "demo" ? chip("시연 · 가상 실행", "warn") : chip("실제 실행", "good"));
const T = (plain, tech) => (prefs.expert ? `${esc(plain)} <span class="tech">${esc(tech)}</span>` : esc(plain));
const agentDot = (k) => `<span class="dot ${M.AGENTS[k].color}" aria-hidden="true"></span>`;
function rail(p) {
  return `<ol class="rail" aria-label="진행 단계">${M.STAGES.map((s, i) => { const st = i < p.stage || p.status === "done" ? "done" : i === p.stage ? "now" : "next";
    return `<li class="${st}" ${st === "now" ? 'aria-current="step"' : ""}><span class="n">${s.n}</span><b>${esc(s.name)}</b>${prefs.expert ? `<span class="tech">${esc(s.tech)}</span>` : ""}<i>${st === "done" ? "완료" : st === "now" ? (p.status === "done" ? "완료" : "진행 중") : "대기"}</i></li>`; }).join("")}</ol>`;
}
const EV = { pass: ["통과", "good"], fail: ["실패", "bad"], unverified: ["미검증", "idle"], skipped: ["실행 안 함", "idle"] };

// ── 홈: 프로젝트 시작 ──
function home() {
  document.title = "프로젝트 스튜디오 · Atelier AX";
  const cat = prefs.cat || "web";
  app.innerHTML = `<section class="hero">
    <p class="eyebrow">프로젝트 스튜디오 ${chip("NEW", "accent")}</p>
    <h1>생각을 현실로 만드는<br>당신만의 AI 전문가 팀.</h1>
    <p class="lede">아이디어만 설명하세요. 기획부터 제작, 검증까지 AI 팀이 함께합니다.<br>무엇을 하고 있는지는 쉬운 말로, 중요한 결정은 당신에게.</p>
    <form id="start" class="prompt card">
      <label for="idea" class="sr">무엇을 만들어 보고 싶으신가요?</label>
      <textarea id="idea" rows="3" maxlength="400" placeholder="무엇을 만들어 보고 싶으신가요?\n${esc(M.CATEGORIES[cat].hint)}" required></textarea>
      <div class="prompt-row"><div class="seg" role="radiogroup" aria-label="종류">${Object.entries(M.CATEGORIES).map(([k, c]) => `<button type="button" role="radio" aria-checked="${k === cat}" data-cat="${k}">${esc(c.name)}</button>`).join("")}</div>
      <button class="btn primary">프로젝트 시작 →</button></div>
      <p class="fine">공개 시연입니다 — 설계도는 <b>키워드 규칙으로 만든 초안</b>이고, 이후 단계는 이 브라우저 안에서 <b>가상으로</b> 진행됩니다. 실제 AI 호출·코드 실행·배포는 일어나지 않습니다. 개인정보는 입력하지 마세요.</p>
    </form>
  </section>
  <section class="wrap"><h2 class="h2">어떤 일을 시작하시겠습니까?</h2>
    <div class="grid3">${Object.entries(M.CATEGORIES).map(([k, c], i) => `<button class="card pick" data-ex="${k}"><span class="ico ${["blue", "yellow", "green"][i]}" aria-hidden="true">${["◧", "✎", "⟳"][i]}</span><b>${esc(c.name)}</b><span>${esc(c.hint.replace(/^예: /, ""))}</span></button>`).join("")}</div>
  </section>
  <section class="wrap"><h2 class="h2">진행 중인 프로젝트 <small>${projects.length}개 · 이 브라우저에만 저장</small></h2>
    <div class="plist">${projects.length ? projects.slice().sort((a, b) => b.updated - a.updated).map(card).join("") : '<p class="muted">아직 프로젝트가 없습니다.</p>'}</div>
  </section>
  <section class="wrap"><h2 class="h2">Atelier AX가 지키는 세 가지</h2>
    <div class="grid3 principles">
      <div class="card"><b>이해할 수 있게</b><p>AI가 지금 무엇을, 왜 하는지 개발 용어 대신 쉬운 말로 보여 줍니다. 필요할 때만 ‘전문가 보기’로 기술 정보를 펼칩니다.</p></div>
      <div class="card"><b>통제할 수 있게</b><p>범위·설계·공개는 당신의 승인 없이 넘어가지 않습니다. 언제든 멈추고, 반려하면 그 단계부터 다시 합니다.</p></div>
      <div class="card"><b>검증할 수 있게</b><p>‘완성했다’는 말 대신 검사 결과로 보여 줍니다. 실행하지 않은 검사는 ‘미검증’, 시연 결과는 ‘가상’이라고 적습니다.</p></div>
    </div>
    <p class="fine center"><a href="#/live">실제 AI 실행 연결 계획 보기 →</a> · <a href="/">기존 AI 인력 관제(라이브) →</a></p>
  </section>`;
  const ta = $("#idea");
  $$("[data-cat]").forEach((b) => (b.onclick = () => { prefs.cat = b.dataset.cat; savePrefs(); $$("[data-cat]").forEach((x) => x.setAttribute("aria-checked", String(x === b))); ta.placeholder = "무엇을 만들어 보고 싶으신가요?\n" + M.CATEGORIES[b.dataset.cat].hint; }));
  $$("[data-ex]").forEach((b) => (b.onclick = () => { prefs.cat = b.dataset.ex; savePrefs(); ta.value = M.CATEGORIES[b.dataset.ex].hint.replace(/^예: /, ""); $$("[data-cat]").forEach((x) => x.setAttribute("aria-checked", String(x.dataset.cat === b.dataset.ex))); ta.focus(); scrollTo({ top: 0, behavior: "smooth" }); }));
  $("#start").onsubmit = (e) => {
    e.preventDefault(); const text = ta.value.trim(); if (text.length < 6) { ta.setCustomValidity("조금 더 자세히 적어 주세요(6자 이상)."); ta.reportValidity(); return; }
    const p = M.createProject(text, prefs.cat || M.detectCategory(text)); projects.unshift(p); save();
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
  const s = M.summary(p), pend = M.pendingApproval(p);
  app.innerHTML = `<div class="wrap proj-page">
    <nav class="crumb" aria-label="위치"><a href="#/">프로젝트 스튜디오</a> <span aria-hidden="true">›</span> ${esc(p.title)}</nav>
    <header class="ph"><div><h1>${esc(p.title)}</h1><p class="muted">${esc(M.CATEGORIES[p.category].name)} · ${demoChip(p)} ${p.example ? chip("예시 프로젝트", "idle") : ""}</p></div>
      <div class="ctl">
        <button class="btn primary" id="go" ${pend || p.status !== "active" ? "disabled" : ""}>다음 작업 진행</button>
        <button class="btn" id="auto" aria-pressed="${!!timer}" ${pend || p.status !== "active" ? "disabled" : ""}>자동 진행</button>
        ${p.status === "paused" ? '<button class="btn" id="resume">다시 시작</button>' : p.status === "active" ? '<button class="btn ghost" id="pause">멈추기</button>' : ""}
      </div></header>
    ${rail(p)}
    <section class="now card" aria-live="polite"><h2 class="sr">지금 상황 한눈에</h2>
      <dl>
        <div><dt>지금 AI가 하는 일</dt><dd>${esc(s.now)}</dd></div>
        <div><dt>왜 필요한가요</dt><dd>${esc(s.why)}</dd></div>
        <div class="${pend ? "hot" : ""}"><dt>내가 결정할 것</dt><dd>${pend ? `<a href="#/p/${p.id}/decide">${esc(pend.title)}</a> — ${esc(pend.text)}` : esc(s.decide)}</dd></div>
        <div><dt>완료된 것</dt><dd>${esc(s.completed)} <span class="bar" style="--w:${s.pct}%" aria-hidden="true"></span></dd></div>
        <div><dt>작동한다는 근거</dt><dd><a href="#/p/${p.id}/proof">${esc(s.proof)}</a></dd></div>
      </dl></section>
    <div class="tabs" role="tablist">${TABS.map(([k, t]) => `<a role="tab" href="#/p/${p.id}/${k}" aria-selected="${k === tab}">${t}${k === "decide" && pend ? ' <span class="badge">1</span>' : ""}</a>`).join("")}</div>
    <div id="tab"></div>
    <p class="fine">${p.mode === "demo" ? "시연 모드 — 에이전트 실행·검사 결과는 이 브라우저 안의 가상 기록입니다. 실제 코드·배포는 만들어지지 않습니다." : ""} <button class="link" id="delP">프로젝트 삭제</button></p>
  </div>`;
  const pane = $("#tab");
  ({ flow, blueprint: bp, team, skills, decide, proof, history: histTab }[tab] || flow)(p, pane);
  const act = (fn) => { const np = fn(find(p.id)); put(np); project(np, tab); };
  $("#go")?.addEventListener("click", () => act((x) => M.step(x).p));
  $("#auto")?.addEventListener("click", () => { if (timer) { clearInterval(timer); timer = null; project(find(p.id), tab); } else autoRun(p.id, tab); });
  $("#pause")?.addEventListener("click", () => act(M.pause));
  $("#resume")?.addEventListener("click", () => act(M.resume));
  $("#delP").onclick = () => { if (confirm("이 프로젝트를 지울까요?")) { projects = projects.filter((x) => x.id !== p.id); save(); location.hash = "#/"; } };
  if (auto && !timer && !pend && p.status === "active") { history.replaceState(null, "", `#/p/${p.id}/${tab}`); autoRun(p.id, tab); }
  else if (timer) $("#auto")?.setAttribute("aria-pressed", "true");
}
function autoRun(id, tab) { // 승인 게이트에서 반드시 멈춘다
  const tick = () => { const r = M.step(find(id)); put(r.p); if (r.blocked || M.pendingApproval(r.p) || r.p.status !== "active") { clearInterval(timer); timer = null; } project(r.p, tab); };
  timer = setInterval(tick, 900); tick();
}

// 진행: 에이전트 카드 + 현재 단계 작업
function flow(p, el) {
  const pend = M.pendingApproval(p), stage = M.STAGES[p.stage];
  const agents = Object.keys(M.AGENTS).map((k) => {
    const mine = p.tasks.filter((t) => t.agent === k), done = mine.filter((t) => t.status === "done"), last = p.runs.filter((r) => r.agent === k).at(-1);
    const nextT = M.stageTasks(p).find((t) => t.status === "todo");
    const state = nextT?.agent === k && !pend && p.status === "active" ? "now" : done.length === mine.length && mine.length ? "done" : done.length ? "rest" : "wait";
    const lastTask = last && p.tasks.find((t) => t.id === last.task);
    const skillsUsed = [...new Set((state === "now" ? nextT.skills : lastTask?.skills) || [])];
    return `<article class="card agent ${state}"><header>${agentDot(k)}<b>${T(M.AGENTS[k].name, M.AGENTS[k].tech)}</b><span class="state ${state === "now" ? "work" : state === "done" ? "good" : "idle"}">${{ now: "다음 차례", done: "완료", rest: "대기", wait: "대기" }[state]}</span></header>
      <p>${state === "now" ? `‘${esc(nextT.title)}’ 작업을 할 차례입니다.` : lastTask ? `${esc(lastTask.title)}${last.outcome === "fail" ? " — <b class='bad'>실패를 발견해 보고했습니다</b>" : last.outcome === "pass" ? " — 통과" : "를 마쳤습니다."}` : esc(M.AGENTS[k].does)}</p>
      ${skillsUsed.length ? `<p class="lbl">${state === "now" ? "사용할 스킬" : "사용한 스킬"}</p><div class="chips">${skillsUsed.map((s) => chip(prefs.expert ? `${M.SKILLS[s].name} · ${M.SKILLS[s].tech}` : M.SKILLS[s].name, "skill")).join("")}</div>` : ""}
      <p class="meta">작업 ${done.length}/${mine.length}${last ? ` · 마지막 실행 ${time(last.end)}${last.demo ? " (가상)" : ""}` : ""}</p></article>`;
  }).join("");
  const tasks = M.stageTasks(p);
  el.innerHTML = `${pend ? approvalCard(p, pend) : ""}
    <h2 class="h3">${stage.n} ${esc(stage.name)} <small>${esc(stage.say)}</small></h2>
    <p class="explain"><b>왜 이 단계가 필요한가요?</b> ${esc(stage.why)}</p>
    <div class="agents">${agents}</div>
    <h3 class="h4">이 단계의 작업 ${tasks.filter((t) => t.status === "done").length}/${tasks.length}</h3>
    <ul class="tasks">${tasks.map((t) => taskRow(p, t)).join("")}</ul>
    <details class="gloss"><summary>용어 풀이 — 개발 용어를 쉬운 말로</summary><dl>${M.GLOSSARY.map(([a, b, c]) => `<div><dt>${esc(a)} <span class="tech">${esc(b)}</span></dt><dd>${esc(c)}</dd></div>`).join("")}</dl></details>`;
  bindApproval(p, el);
}
function taskRow(p, t) {
  const r = t.run && p.runs.find((x) => x.id === t.run);
  const st = t.status === "done" ? (r?.outcome === "fail" ? ["실패", "bad"] : ["완료", "good"]) : ["대기", "idle"];
  return `<li class="task"><span class="state ${st[1]}">${st[0]}</span><div><b>${esc(t.title)}</b>${t.fix ? chip("수정 작업", "warn") : ""}<span class="who">${agentDot(t.agent)}${esc(M.AGENTS[t.agent].name)} · ${t.skills.map((s) => esc(M.SKILLS[s].name)).join(", ")}</span>
    <span class="acc">완료 기준 — ${esc(t.accept)}</span>${r?.note && r.note !== `완료 기준: ${t.accept}` ? `<span class="note ${r.outcome === "fail" ? "bad" : ""}">${esc(r.note)}</span>` : ""}
    ${prefs.expert && r ? `<span class="tech block">run ${r.id} · ${time(r.start)}–${time(r.end)} · ${toolCalls(t).join(" · ")}${r.demo ? " · 가상 기록" : ""}</span>` : ""}</div></li>`;
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
    <p class="meta">맡은 작업 ${mine.length} · 완료 ${mine.filter((t) => t.status === "done").length} · 실행 ${runs.length}회${runs.some((r) => r.demo) ? " (가상)" : ""}${k === "qa" ? " · 만든 쪽과 분리된 독립 검수" : ""}</p></article>`; }).join("")}</div>`;
}
// 스킬 인스펙터
function skills(p, el) {
  const u = M.skillUsage(p);
  el.innerHTML = `<p class="explain">각 스킬을 누가, 몇 번 썼는지 봅니다. 여러 에이전트가 같은 스킬을 쓰면 같은 기준으로 일한다는 뜻입니다.</p>
  <div class="tbl" role="region" aria-label="스킬 표" tabindex="0"><table><thead><tr><th>스킬</th><th>하는 일</th><th>쓰는 에이전트</th><th>작업</th></tr></thead><tbody>
  ${Object.entries(u).map(([k, v]) => `<tr><td><b>${esc(M.SKILLS[k].name)}</b>${prefs.expert ? `<br><span class="tech">${esc(M.SKILLS[k].tech)}</span>` : ""}</td><td>${esc(M.SKILLS[k].plain)}</td><td>${v.agents.map((a) => `<span class="who">${agentDot(a)}${esc(M.AGENTS[a].name)}</span>`).join("")}${v.agents.length > 1 ? chip("공유", "accent") : ""}</td><td class="num">${v.done}/${v.tasks}</td></tr>`).join("")}</tbody></table></div>`;
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
// 결과·검증
function proof(p, el) {
  const arts = p.tasks.filter((t) => t.status === "done" && !t.check).map((t) => ({ t, name: (toolCalls(t)[0] || "산출물").replace(/^[^ ]+ [^ ]+ /, "") }));
  el.innerHTML = `<p class="explain">AI가 ‘완성했다’고 말하는 것과 실제로 작동하는 것은 다릅니다. 아래 표는 검사 기록만으로 채웁니다. 검사를 실행하지 않은 항목은 <b>미검증</b>입니다.${p.mode === "demo" ? " 이 프로젝트는 시연이므로 모든 결과가 <b>가상</b>입니다." : ""}</p>
  <div class="tbl" role="region" aria-label="검증 결과 표" tabindex="0"><table class="ev"><thead><tr><th>확인 항목</th><th>결과</th><th>근거</th></tr></thead><tbody>
  ${p.evidence.map((e) => { const [t, k] = EV[e.status]; const runs = e.runs.map((r) => { const run = p.runs.find((x) => x.id === r.run); return `<li>${time(r.at)} · ${r.result === "pass" ? "통과" : "실패"} · ${esc(M.AGENTS[run.agent].name)}${r.demo ? " · 가상" : ""}${run.note ? ` — ${esc(run.note)}` : ""}</li>`; }).join("");
    return `<tr><td><b>${esc(e.name)}</b></td><td><span class="state ${k}">${t}</span>${e.status === "pass" && p.mode === "demo" ? chip("가상", "warn") : ""}</td><td>${runs ? `<details><summary>실행 ${e.runs.length}회</summary><ul>${runs}</ul></details>` : `<span class="muted">${esc(e.note || "실행 기록 없음")}</span>`}</td></tr>`; }).join("")}
  </tbody></table></div>
  <h2 class="h3">산출물 <small>${arts.length}개${p.mode === "demo" ? " · 시연 기록(실제 파일 없음)" : ""}</small></h2>
  <ul class="tasks">${arts.length ? arts.map(({ t, name }) => `<li class="task"><span class="state good">완료</span><div><b>${esc(t.title)}</b><span class="who">${agentDot(t.agent)}${esc(M.AGENTS[t.agent].name)}${prefs.expert ? ` · <span class="tech">${esc(name)}</span>` : ""}</span></div></li>`).join("") : '<li class="muted">아직 없습니다.</li>'}</ul>`;
}
// 이력
function histTab(p, el) {
  el.innerHTML = `<ol class="hist">${p.history.slice().reverse().map((h) => `<li class="${h.kind}"><time>${date(h.at)}</time><span>${esc(h.text)}${h.demo && ["run", "done"].includes(h.kind) ? ' <span class="muted">(가상)</span>' : ""}${prefs.expert && h.run ? ` <span class="tech">${h.run}</span>` : ""}</span></li>`).join("")}</ol>`;
}

// ── 실제 실행(LIVE) — 연결 상태를 있는 그대로 ──
function live() {
  document.title = "실제 실행 연결 · Atelier AX";
  app.innerHTML = `<div class="wrap proj-page"><nav class="crumb"><a href="#/">프로젝트 스튜디오</a> › 실제 실행</nav>
    <h1>실제 AI 실행 연결</h1>
    <section class="card status"><span class="state idle">연결 안 됨</span><p>이 공개 사이트는 <b>시연 전용</b>입니다. 외부 AI 호출, 코드 실행 환경, GitHub, 배포 서비스 어느 것도 연결돼 있지 않으며, 연결된 것처럼 표시하지 않습니다.</p></section>
    <h2 class="h3">연결되면 이렇게 흐릅니다</h2>
    <ol class="pipe">${[["프로젝트 스튜디오", "사용자 화면"], ["프로젝트 오케스트레이터", "요구사항 · 작업 상태 · 실행 순서"], ["기획 · 디자인 · 개발 · 검수 에이전트", "에이전트별 스킬과 권한"], ["격리된 실행 환경", "사용자 명령을 일반 서버에서 바로 실행하지 않음 · 자원 제한 · 비밀정보 분리"], ["GitHub", "코드 · 변경 이력 · 리뷰"], ["자동 검증", "테스트 · 빌드 · 화면 검사"], ["미리보기(Preview)", "공개 전 확인용 주소"], ["사용자 승인", "최종 검토 · 공개 승인"], ["서비스 공개(Production)", "승인된 판만"]].map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join("")}</ol>
    <h2 class="h3">개발 순서</h2>
    <div class="tbl" tabindex="0" role="region" aria-label="개발 순서"><table><thead><tr><th>단계</th><th>범위</th><th>상태</th></tr></thead><tbody>
      ${[["1차", "비개발자용 프로젝트 제작 화면 · 시연", "이번 판"], ["2차", "AI 요구사항 분석 · 작업 설계(실제 모델 호출)", "예정"], ["3차", "에이전트·스킬 매핑과 실제 실행 이력", "예정"], ["4차", "GitHub · 격리 실행 · 자동 테스트", "예정"], ["5차", "승인 · Preview · 배포", "예정"]].map(([a, b, c]) => `<tr><td>${a}</td><td>${esc(b)}</td><td>${c === "이번 판" ? chip(c, "accent") : chip(c, "idle")}</td></tr>`).join("")}</tbody></table></div>
    <p class="fine">외부 사용자에게 Claude 기반 기능을 제공할 때는 개인 구독이 아니라 API 인증(Claude Agent SDK · API 키)을 써야 하며, 비용·권한·비밀정보 관리는 서버에서만 다룹니다.</p></div>`;
}

// ── 헤더: 전문가 보기 토글 ──
$("#expert").onclick = () => { prefs.expert = !prefs.expert; savePrefs(); route(); };
route();
