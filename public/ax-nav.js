// 기존 관제 화면(Next 빌드) 상단 메뉴에 '스튜디오' 링크를 덧붙인다. 하이드레이션 뒤에 넣고, 다시 그려져도 유지한다.
(function () {
  function add() {
    document.querySelectorAll('nav[aria-label^="주요 화면"]').forEach(function (nav) {
      if (nav.querySelector("[data-studio]")) return;
      var ref = nav.querySelector("a"); if (!ref) return;
      var a = document.createElement("a");
      a.href = "/studio/"; a.setAttribute("data-studio", "");
      a.className = ref.className.replace(/\b(font-semibold|text-accent-fg|bg-tonal)\b/g, "") + " text-fg-2";
      a.innerHTML = '스튜디오<span style="margin-left:6px;font:700 10px/1 sans-serif;padding:3px 5px;border-radius:6px;background:#e6eefc;color:#1a55c2">NEW</span>';
      a.removeAttribute("aria-current");
      nav.insertBefore(a, ref);
    });
  }
  function start() { add(); new MutationObserver(add).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === "complete") setTimeout(start, 300); else addEventListener("load", function () { setTimeout(start, 300); });
})();
