// Atelier AX — 사이트 인터랙션. 움직임은 이해를 돕는 곳에만, prefers-reduced-motion 이면 정지 화면.
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ko = document.documentElement.lang !== "en";

// ── 헤더: 어두운 첫 화면 위에서는 밝은 글자, 내려가면 바탕색 ──
const top = $("#top"), firstDark = $(".hero, .page-head");
const darkSecs = $$(".mani, .finale, .reel, .strip, .sec.dark, .foot");
const onScroll = () => {
  if (!top) return; const past = !firstDark || scrollY > firstDark.offsetHeight - 80; top.classList.toggle("on-dark", !past); top.classList.toggle("scrolled", past && scrollY > 8);
  const y = top.offsetHeight / 2; top.classList.toggle("dk", past && darkSecs.some((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; }));
};
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

// ── 시네마틱: 진행선 · 오프닝 · 원근 광선 · 선언문 · 수치 · 자석 버튼 ──
const prog = $(".prog");
const cine = $("[data-cine]"), mani = $("[data-mani]");
const words = mani ? $$(".w", mani) : [];
let counted = false;
const countUp = () => {
  if (counted) return; counted = true;
  $$("[data-count]", mani).forEach((b, i) => {
    const n = +b.dataset.count; if (reduce) return;
    const t0 = performance.now() + i * 120; b.textContent = "0";
    const f = (t) => { const k = Math.min(1, Math.max(0, (t - t0) / 1100)); b.textContent = String(Math.round(n * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  });
};
const onScrollCine = () => {
  const H = document.documentElement.scrollHeight - innerHeight;
  prog?.style.setProperty("--sp", (H > 0 ? scrollY / H : 0).toFixed(4));
  if (cine && !reduce) cine.style.setProperty("--hp", Math.min(1, Math.max(0, scrollY / (cine.offsetHeight * 0.9))).toFixed(3));
  if (mani) {
    const r = mani.getBoundingClientRect(), span = mani.offsetHeight - innerHeight, p = reduce ? 1 : Math.min(1, Math.max(0, -r.top / Math.max(1, span)));
    mani.style.setProperty("--mp", p.toFixed(3));
    const lit = Math.round(p * 1.25 * words.length);
    words.forEach((w, i) => w.classList.toggle("on", i < lit));
    const done = lit >= words.length; mani.classList.toggle("done", done); if (done) countUp();
  }
};
addEventListener("scroll", onScrollCine, { passive: true }); addEventListener("resize", onScrollCine); onScrollCine();

if (cine) {
  requestAnimationFrame(() => requestAnimationFrame(() => cine.classList.add("rolled")));
  // 원근 바닥 격자 — 바깥의 빛이 소실점 하나로 모인다(흩어진 업무가 하나의 흐름으로)
  const cv = $(".hero-fx", cine), g = cv?.getContext("2d");
  if (g) {
    let W = 0, Hh = 0, dpr = 1, mx = 0, my = 0, tx = 0, ty = 0, vis = true, t = 0, last = performance.now(), raf = 0;
    const N = 22, pulses = Array.from({ length: innerWidth < 700 ? 6 : 12 }, () => ({ l: 0, z: 1, s: 0.06 + Math.random() * 0.1 }));
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = cine.clientWidth; Hh = cine.clientHeight; cv.width = W * dpr; cv.height = Hh * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const draw = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      tx += (mx - tx) * 0.04; ty += (my - ty) * 0.04;
      g.clearRect(0, 0, W, Hh);
      const hy = Hh * (0.36 + ty * 0.03), vx = W * (0.66 - tx * 0.05), depth = Hh - hy, spread = W * 2.4;
      const hz = g.createLinearGradient(0, hy - 60, 0, hy + 40); hz.addColorStop(0, "rgba(43,89,224,0)"); hz.addColorStop(0.6, "rgba(43,89,224,.16)"); hz.addColorStop(1, "rgba(43,89,224,0)");
      g.fillStyle = hz; g.fillRect(0, hy - 60, W, 100);
      g.lineWidth = 1; g.strokeStyle = "rgba(157,187,255,.28)"; g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); g.stroke();
      for (let i = -N; i <= N; i++) {
        const bx = vx + (i / N) * spread, a = 0.05 + 0.1 * (1 - Math.abs(i) / N);
        const gr = g.createLinearGradient(vx, hy, bx, Hh); gr.addColorStop(0, "rgba(157,187,255,0)"); gr.addColorStop(1, `rgba(157,187,255,${a.toFixed(3)})`);
        g.strokeStyle = gr; g.beginPath(); g.moveTo(vx, hy); g.lineTo(bx, Hh); g.stroke();
      }
      for (let k = 0; k < 16; k++) {
        const z = (k + ((t * 0.35) % 1)) / 16, y = hy + depth * Math.pow(z, 2.2);
        g.strokeStyle = `rgba(157,187,255,${(0.02 + z * 0.13).toFixed(3)})`; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      }
      for (const p of pulses) {
        if (!p.l) { p.l = Math.floor(Math.random() * (2 * N + 1)) - N || 1; p.z = 1 + Math.random() * 0.6; }
        p.z -= p.s * dt * 2.2; if (p.z <= 0.02) { p.l = 0; continue; }
        const zz = Math.min(1, p.z), bx = vx + (p.l / N) * spread, e = Math.pow(zz, 2.2), x = vx + (bx - vx) * e, y = hy + depth * e;
        const e2 = Math.pow(Math.min(1, zz + 0.12), 2.2), x2 = vx + (bx - vx) * e2, y2 = hy + depth * e2;
        const tr = g.createLinearGradient(x2, y2, x, y); tr.addColorStop(0, "rgba(157,187,255,0)"); tr.addColorStop(1, `rgba(220,232,255,${(0.16 + zz * 0.42).toFixed(2)})`);
        g.strokeStyle = tr; g.lineWidth = 1 + zz * 1.1; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x, y); g.stroke(); g.lineWidth = 1;
      }
      const core = g.createRadialGradient(vx, hy, 0, vx, hy, 180); core.addColorStop(0, "rgba(157,187,255,.22)"); core.addColorStop(1, "rgba(157,187,255,0)");
      g.fillStyle = core; g.fillRect(vx - 180, hy - 180, 360, 360);
      raf = !reduce && vis && !document.hidden ? requestAnimationFrame(draw) : 0;
    };
    const kick = () => { if (!raf && !reduce && vis && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(draw); } };
    size();
    new ResizeObserver(() => { size(); if (reduce || !raf) draw(performance.now()); }).observe(cine);
    if (reduce) draw(performance.now());
    else {
      kick();
      new IntersectionObserver(([e]) => { vis = e.isIntersecting; kick(); }).observe(cine);
      document.addEventListener("visibilitychange", kick);
      cine.addEventListener("pointermove", (e) => { const r = cine.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; }, { passive: true });
    }
  }
}

// 자석 버튼 — 커서 쪽으로 살짝 끌린다
if (!reduce && matchMedia("(hover: hover)").matches) $$("[data-magnet]").forEach((b) => {
  b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1)}px)`; });
  b.addEventListener("pointerleave", () => (b.style.transform = ""));
});
