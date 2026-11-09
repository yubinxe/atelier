// Atelier AX — 사이트 인터랙션. 움직임은 이해를 돕는 곳에만, prefers-reduced-motion 이면 정지 화면.
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ko = document.documentElement.lang !== "en";

// ── 헤더: 어두운 첫 화면 위에서는 밝은 글자, 내려가면 바탕색 ──
const top = $("#top"), firstDark = $(".hero, .page-head");
const onScroll = () => { if (!top) return; const past = !firstDark || scrollY > firstDark.offsetHeight - 80; top.classList.toggle("on-dark", !past); top.classList.toggle("scrolled", past && scrollY > 8); };
addEventListener("scroll", onScroll, { passive: true }); onScroll();
const menu = $(".menu");
if (menu) { menu.addEventListener("click", (e) => { if (e.target.closest("a")) menu.open = false; }); addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.open) { menu.open = false; $("summary", menu).focus(); } }); }

// ── 나타나기 ──
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
$$("[data-reveal]").forEach((el) => (reduce ? el.classList.add("in") : io.observe(el)));

// ── 포인터 빛: 버튼·카드 위 커서 위치 ──
if (!reduce) addEventListener("pointermove", (e) => { const el = e.target.closest?.(".btn, [data-light]"); if (!el) return; const r = el.getBoundingClientRect(); el.style.setProperty("--mx", `${e.clientX - r.left}px`); el.style.setProperty("--my", `${e.clientY - r.top}px`); }, { passive: true });

// ── 히어로 흐름도: 일감이 입력 → 수집 → AI → 검토 → 결과로 흐른다 ──
const flow = $("[data-flow]");
if (flow) {
  const svg = $("svg", flow), cap = $(".cap", flow), toks = $(".toks", flow), nodes = $$(".node", flow);
  const P = (id) => $("#" + id, svg);
  const route = (s) => [P("p-s" + s), P("p-ca"), P("p-ag"), P("p-go")];
  const kindAt = ["", "ai", "ai", "ok"];
  let hold = null, items = [], last = performance.now(), visible = true, idleIx = 0, idleT = 0;
  const pick = (k) => { nodes.forEach((n) => n.classList.toggle("hot", n.dataset.k === k)); const n = nodes.find((x) => x.dataset.k === k); if (n) cap.textContent = n.dataset.cap; };
  nodes.forEach((n) => { const on = () => { hold = n.dataset.k; pick(hold); }, off = () => { hold = null; };
    n.addEventListener("pointerenter", on); n.addEventListener("focus", on); n.addEventListener("pointerleave", off); n.addEventListener("blur", off); });
  const spawn = () => { const s = Math.floor(Math.random() * 3), g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("class", "tok"); g.innerHTML = '<rect x="-7" y="-5" width="14" height="10" rx="3"/>'; toks.append(g); items.push({ g, segs: route(s), i: 0, d: 0, wait: 0 }); };
  const step = (now) => {
    const dt = Math.min(64, now - last); last = now;
    if (visible) {
      if (items.length < (innerWidth < 640 ? 4 : 7) && Math.random() < dt / 520) spawn();
      for (const it of items) {
        if (it.wait > 0) { it.wait -= dt; continue; }
        const seg = it.segs[it.i], L = seg.getTotalLength(); it.d += dt * 0.085;
        if (it.d >= L) { it.i++; it.d = 0; if (it.i === 3) it.wait = 650; if (it.i >= it.segs.length) { it.g.remove(); it.done = true; continue; } it.g.setAttribute("class", "tok " + kindAt[it.i]); }
        const p = it.segs[it.i].getPointAtLength(Math.min(it.d, it.segs[it.i].getTotalLength())); it.g.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      }
      items = items.filter((x) => !x.done);
      if (!hold) { idleT += dt; if (idleT > 2600) { idleT = 0; idleIx = (idleIx + 1) % 5; pick(["src", "collect", "ai", "gate", "out"][idleIx]); } }
    }
    requestAnimationFrame(step);
  };
  pick("src");
  if (!reduce) {
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(flow);
    requestAnimationFrame(step);
    // 깊이감: 포인터를 따라 겹이 조금씩 다르게 움직인다
    const lyrs = $$(".lyr", svg);
    flow.addEventListener("pointermove", (e) => { const r = flow.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; lyrs.forEach((l) => { const d = +l.dataset.depth; l.style.transform = `translate(${(-x * d).toFixed(1)}px, ${(-y * d).toFixed(1)}px)`; }); });
    flow.addEventListener("pointerleave", () => lyrs.forEach((l) => (l.style.transform = "")));
  }
}

// ── 지금의 방식 / 재설계 비교 ──
$$("[data-ba]").forEach((box) => {
  const tabs = $$('[role="tab"]', box);
  const sel = (t) => { tabs.forEach((x) => { const on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; const p = $("#" + x.getAttribute("aria-controls"), box); p.hidden = !on; p.classList.remove("show"); if (on) requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add("show"))); }); };
  tabs.forEach((t) => { t.addEventListener("click", () => sel(t)); t.addEventListener("keydown", (e) => { if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return; e.preventDefault(); const n = tabs[(tabs.indexOf(t) + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; sel(n); n.focus(); }); });
  // 처음 화면에 들어오면 한 번 '재설계'로 넘겨 차이를 보여 준다
  if (!reduce) { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { o.disconnect(); setTimeout(() => { if (tabs[0].getAttribute("aria-selected") === "true" && !box.contains(document.activeElement)) sel(tabs[1]); }, 1800); } }, { threshold: 0.6 }); o.observe(box); }
});

// ── 방법론: 스크롤에 따라 단계가 켜진다 ──
const method = $("[data-method]");
if (method) {
  const steps = $$("[data-step]", method), pts = $$("[data-pt]", method), arc = $(".arc", method), C = 942.5;
  const on = (i) => { steps.forEach((s, j) => s.classList.toggle("on", j === i)); pts.forEach((p, j) => p.classList.toggle("on", j <= i)); if (arc) arc.style.strokeDashoffset = String(C - (C * (i + 1)) / 4); const n = $("[data-dial-n]", method), t = $("[data-dial-t]", method); if (n) n.textContent = "0" + (i + 1); if (t) t.textContent = steps[i].dataset.name; };
  const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) on(steps.indexOf(e.target)); }), { rootMargin: "-45% 0px -45% 0px" });
  steps.forEach((s) => so.observe(s));
}

// ── 실제 작동 시연: Studio Demo 엔진(sim.js·floor.js)을 그대로 불러와 돌린다(보일 때만) ──
const demo = $("[data-demo]");
if (demo) {
  const stage = $("[data-demo-stage]", demo), feed = $("[data-demo-feed]", demo), btn = $("[data-demo-toggle]", demo);
  let started = false, playing = !reduce, visible = false;
  const start = async () => {
    started = true;
    try {
      const [SIM, FL, BR] = await Promise.all([import("/studio/sim.js"), import("/studio/floor.js"), import("/studio/bridge.js")]);
      const sim = SIM.createSim({ seed: 20261109 }); SIM.tick(sim, 9000);
      stage.innerHTML = FL.scene(); const layer = $(".pawns", stage), prev = {};
      const KO = { session: "시작", prompt: "지시", read: "읽기", search: "찾기", web: "웹", edit: "수정", run: "실행", test: "검사", tool: "도구", agent: "위임", output: "산출물", wait: "대기", done: "완료", fail: "실패", note: "메모" };
      const EN = { session: "start", prompt: "brief", read: "read", search: "search", web: "web", edit: "edit", run: "run", test: "check", tool: "tool", agent: "delegate", output: "output", wait: "wait", done: "done", fail: "fail", note: "note" };
      const L = ko ? KO : EN; let lastId = 0;
      const draw = () => {
        const now = SIM.simNow(sim), ses = BR.sessions(sim.events, now).filter((x) => now - Date.parse(x.last) < (x.state === "done" ? 4000 : 12e4)), per = {}, keep = new Set();
        for (const x of ses.slice().reverse()) {
          const ev = sim.events.filter((e) => e.session === x.session).at(-1), stn = FL.stationFor(ev.kind, prev[x.session]); prev[x.session] = stn;
          const slot = (per[stn] = (per[stn] || 0) + 1) - 1, [px, py] = FL.spot(stn, slot);
          let g = layer.querySelector(`[data-pawn="${x.session}"]`);
          if (!g) { layer.insertAdjacentHTML("beforeend", FL.pawnHTML(x.session, x.source, L[ev.kind] || ev.kind)); g = layer.lastElementChild; const [sx, sy] = FL.spot("desk", 3); g.style.transform = `translate(${sx}px, ${sy - 30}px)`; g.style.opacity = "0"; g.getBoundingClientRect(); }
          g.style.opacity = ""; g.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`; g.setAttribute("class", `fp ${FL.srcStyle(x.source)[0]} ${x.state}`); $(".tag text", g).textContent = L[ev.kind] || ev.kind; keep.add(x.session);
        }
        $$("[data-pawn]", layer).forEach((g) => { if (!keep.has(g.dataset.pawn)) g.remove(); });
        $$(".st", stage).forEach((g) => g.classList.toggle("busy", !!per[g.dataset.st]));
        const top = sim.events.at(-1)?.id || 0;
        if (top !== lastId) { lastId = top; feed.innerHTML = sim.events.slice(-3).reverse().map((e) => { const [c, i] = FL.srcStyle(e.source); return `<li class="${e.kind}"><b class="src-${c}">${i}</b><span class="k">${L[e.kind] || e.kind}</span><span>${e.title.replace(/^[^·]+ · /, "").replace(/</g, "&lt;")}</span></li>`; }).join(""); }
      };
      let t0 = performance.now();
      setInterval(() => { const t = performance.now(), dt = Math.min(1000, t - t0); t0 = t; if (playing && visible && !document.hidden) { SIM.tick(sim, dt); draw(); } }, 300);
      draw();
    } catch { stage.innerHTML = `<p class="ph">${ko ? "시연을 불러오지 못했습니다. Studio Demo에서 직접 확인해 주세요." : "The demo could not load. Please open the Studio Demo."}</p>`; }
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !started) start(); }, { rootMargin: "200px" }).observe(demo);
  btn?.addEventListener("click", () => { playing = !playing; btn.setAttribute("aria-pressed", String(playing)); btn.textContent = playing ? (ko ? "일시정지" : "Pause") : (ko ? "재생" : "Play"); });
  if (reduce && btn) { btn.setAttribute("aria-pressed", "false"); btn.textContent = ko ? "재생" : "Play"; }
}

// ── 상담 문의 양식 ──
const form = $("#contact");
if (form) {
  const t0 = Date.now(), en = form.dataset.lang === "en";
  const M = !en ? { name: "성명을 입력해 주세요.", email: "올바른 이메일 주소를 입력해 주세요.", message: "문의 내용을 10자 이상 적어 주세요.", consent: "개인정보 수집·이용에 동의해 주세요.", sending: "보내는 중…", ok: "문의가 접수되었습니다. 확인 후 회신드리겠습니다.", dup: "같은 내용의 문의가 이미 접수되어 있습니다.", fail: "전송하지 못했습니다. 잠시 후 다시 시도해 주세요.", net: "네트워크 오류로 전송하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요." }
    : { name: "Please enter your name.", email: "Please enter a valid email address.", message: "Please write at least 10 characters.", consent: "Please agree to the personal data notice.", sending: "Sending…", ok: "Thank you — your enquiry has been received. We will reply after reviewing it.", dup: "An identical enquiry has already been received.", fail: "We could not send your enquiry. Please try again shortly.", net: "A network error stopped the enquiry. Please check your connection and try again." };
  const res = $("#f-result"), btn = $("#f-submit");
  const setErr = (id, msg) => { const el = $("#f-" + id), e = $("#e-" + id); if (el) { el.setAttribute("aria-invalid", msg ? "true" : "false"); if (msg) el.setAttribute("aria-describedby", "e-" + id); } if (e) e.textContent = msg || ""; return !msg; };
  const check = () => { const f = form.elements; return [setErr("name", f.name.value.trim() ? "" : M.name), setErr("email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim()) ? "" : M.email), setErr("message", f.message.value.trim().length >= 10 ? "" : M.message), setErr("consent", f.consent.checked ? "" : M.consent)].every(Boolean); };
  let busy = false;
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); if (busy) return;
    res.className = "result"; res.textContent = "";
    if (!check()) { $('[aria-invalid="true"]', form)?.focus(); return; }
    busy = true; btn.disabled = true; const label = btn.innerHTML; btn.textContent = M.sending;
    const f = form.elements, data = { name: f.name.value.trim(), company: f.company.value.trim(), email: f.email.value.trim(), service: ($('input[name="service"]:checked', form) || {}).value || "", stage: f.stage.value, message: f.message.value.trim(), consent: f.consent.checked, website: f.website.value, elapsed: Date.now() - t0, locale: en ? "en" : "ko" };
    try {
      const r = await fetch("/api/contact/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { res.className = "result ok"; res.textContent = j.duplicate ? M.dup : M.ok; form.reset(); }
      else { res.className = "result bad"; res.textContent = (j.field && M[j.field]) || M.fail; if (j.field) setErr(j.field, M[j.field]); }
    } catch { res.className = "result bad"; res.textContent = M.net; }
    busy = false; btn.disabled = false; btn.innerHTML = label;
  });
}
