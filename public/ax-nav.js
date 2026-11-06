// 초기판 운영 관제 콘솔(Next 정적 빌드) 보조 스크립트.
// 회사 사이트가 '/' 를 쓰게 되면서, 콘솔의 '라이브'(/) 링크는 /console/ 로 보내고 상단에 회사 홈·Lab 으로 돌아가는 줄을 덧붙인다.
(function () {
  function fix() {
    document.querySelectorAll('a[href="/"]').forEach(function (a) { if (!a.closest("[data-ax-bar]")) a.setAttribute("href", "/console/"); });
    if (!document.querySelector("[data-ax-bar]")) {
      var bar = document.createElement("div"); bar.setAttribute("data-ax-bar", "");
      bar.style.cssText = "font:500 13px/1.4 system-ui,sans-serif;background:#15171c;color:#f4f1ea;padding:9px 20px;display:flex;gap:18px;align-items:center;flex-wrap:wrap";
      bar.innerHTML = '<a href="/" style="color:#f4f1ea;text-decoration:none;font-weight:600">Atelier AX</a><span style="color:#a9a49a">운영 관제 콘솔 · 초기판(보존) — 표시되는 데이터는 시연용입니다</span><a href="/lab/" style="color:#c9b07e;margin-left:auto">Lab으로 돌아가기</a><a href="/studio/" style="color:#c9b07e">Studio Demo</a>';
      document.body.insertBefore(bar, document.body.firstChild);
    }
  }
  document.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest('a[href="/console/"]'); if (a) { e.preventDefault(); e.stopPropagation(); if (location.pathname !== "/console/") location.href = "/console/"; } }, true);
  function start() { fix(); new MutationObserver(fix).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === "complete") setTimeout(start, 300); else addEventListener("load", function () { setTimeout(start, 300); });
})();
