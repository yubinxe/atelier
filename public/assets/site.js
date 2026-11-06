// Atelier AX — 공통: 스크롤 시 헤더 구분선, 메뉴 닫기, 문의 양식 전송.
(() => {
  const top = document.getElementById("top");
  const onScroll = () => top && top.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const menu = document.querySelector(".menu");
  if (menu) { menu.addEventListener("click", (e) => { if (e.target.closest("a")) menu.open = false; }); addEventListener("keydown", (e) => { if (e.key === "Escape") menu.open = false; }); }

  const form = document.getElementById("contact");
  if (!form) return;
  const ko = form.dataset.lang !== "en", t0 = Date.now();
  const M = ko ? { name: "성명을 입력해 주세요.", email: "올바른 이메일 주소를 입력해 주세요.", message: "문의 내용을 10자 이상 적어 주세요.", consent: "개인정보 수집·이용에 동의해 주세요.", sending: "보내는 중…", ok: "문의가 접수되었습니다. 확인 후 회신드리겠습니다.", dup: "같은 내용의 문의가 이미 접수되어 있습니다.", fail: "전송하지 못했습니다. 잠시 후 다시 시도해 주세요.", net: "네트워크 오류로 전송하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요." }
    : { name: "Please enter your name.", email: "Please enter a valid email address.", message: "Please write at least 10 characters.", consent: "Please agree to the personal data notice.", sending: "Sending…", ok: "Thank you — your enquiry has been received. We will reply after reviewing it.", dup: "An identical enquiry has already been received.", fail: "We could not send your enquiry. Please try again shortly.", net: "A network error stopped the enquiry. Please check your connection and try again." };
  const res = document.getElementById("f-result"), btn = document.getElementById("f-submit");
  const setErr = (id, msg) => { const el = document.getElementById("f-" + id), e = document.getElementById("e-" + id); if (el) el.setAttribute("aria-invalid", msg ? "true" : "false"); if (el && msg) el.setAttribute("aria-describedby", "e-" + id); if (e) e.textContent = msg || ""; return !msg; };
  const check = () => {
    const f = form.elements, ok = [
      setErr("name", f.name.value.trim() ? "" : M.name),
      setErr("email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim()) ? "" : M.email),
      setErr("message", f.message.value.trim().length >= 10 ? "" : M.message),
      setErr("consent", f.consent.checked ? "" : M.consent),
    ];
    return ok.every(Boolean);
  };
  let busy = false;
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); if (busy) return;
    res.className = "result"; res.textContent = "";
    if (!check()) { const bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
    busy = true; btn.disabled = true; const label = btn.innerHTML; btn.textContent = M.sending;
    const f = form.elements, data = { name: f.name.value.trim(), company: f.company.value.trim(), email: f.email.value.trim(), service: (form.querySelector('input[name="service"]:checked') || {}).value || "", stage: f.stage.value, message: f.message.value.trim(), consent: f.consent.checked, website: f.website.value, elapsed: Date.now() - t0, locale: ko ? "ko" : "en" };
    try {
      const r = await fetch("/api/contact/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { res.className = "result ok"; res.textContent = j.duplicate ? M.dup : M.ok; form.reset(); }
      else { res.className = "result bad"; res.textContent = (j.field && M[j.field]) || M.fail; if (j.field) setErr(j.field, M[j.field]); }
    } catch { res.className = "result bad"; res.textContent = M.net; }
    busy = false; btn.disabled = false; btn.innerHTML = label;
  });
})();
