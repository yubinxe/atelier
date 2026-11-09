// Atelier AX 기업 사이트 생성기 v2 — `npm run build:site` → public/ 에 정적 HTML·CSS 를 쓴다(빌드 도구 없음, 결과물 커밋).
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ORG, SERVICES, METHOD, WORK, PAINS, BA, DIFF, INDUSTRIES, FOUNDER, FAQ, POSTS, TOPICS } from "./content.mjs";

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..", "public");
const V = "3"; // 정적 자산 캐시 버전
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const MARK = (c = "currentColor") => `<svg viewBox="0 0 26 26" aria-hidden="true"><rect x="1" y="1" width="24" height="24" rx="6" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M7 21V12a6 6 0 0 1 12 0v9" fill="none" stroke="${c}" stroke-width="1.5"/><path d="M13 6.5V21" stroke="#9dbbff" stroke-width="1.5"/></svg>`;
const ARR = '<span class="arr" aria-hidden="true">→</span>';
const ICON = {
  gather: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="11" height="8" rx="2"/><rect x="3" y="23" width="11" height="8" rx="2"/><rect x="22" y="14" width="11" height="8" rx="2"/><path d="M14 9h4v18h-4M18 18h4"/></svg>',
  doc: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 3h13l6 6v24H9z"/><path d="M22 3v6h6M13 16h11M13 21h11M13 26h7"/></svg>',
  split: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="12" width="10" height="12" rx="2"/><rect x="23" y="12" width="10" height="12" rx="2"/><path d="M13 18h3M20 18h3" /><path d="M16 15l4 6" /></svg>',
  check: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="16" cy="16" r="11"/><path d="M24 24l8 8"/><path d="M12 16h8M16 12v8" opacity=".35"/><path d="M16 9v1M16 22v1"/></svg>',
  gear: '<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="18" cy="18" r="5"/><path d="M18 4v5M18 27v5M4 18h5M27 18h5M8 8l3.5 3.5M24.5 24.5 28 28M8 28l3.5-3.5M24.5 11.5 28 8"/></svg>',
};

const T = {
  ko: { nav: [["services", "서비스"], ["work", "작업"], ["lab", "랩"], ["insights", "인사이트"], ["about", "회사 소개"]], contact: "상담 신청", other: "EN", otherLabel: "English", skip: "본문으로 건너뛰기", menu: "메뉴",
    foot: { tag: "업무를 진단하고, AI와 자동화를 결합해 실제로 운영할 수 있는 시스템으로 구현하는 독립 AX 컨설팅 스튜디오.", company: "회사", explore: "살펴보기", legal: "안내", privacy: "개인정보처리방침", biz: `${ORG.nameKo} · 개인사업자 · ${ORG.city.ko}`, demo: "Studio Demo" } },
  en: { nav: [["services", "Services"], ["work", "Work"], ["lab", "Lab"], ["insights", "Insights"], ["about", "About"]], contact: "Start a conversation", other: "KO", otherLabel: "한국어", skip: "Skip to content", menu: "Menu",
    foot: { tag: "An independent AX consulting studio that diagnoses how work is done and turns it into systems that run, combining AI and automation.", company: "Company", explore: "Explore", legal: "Legal", privacy: "Privacy policy", biz: `${ORG.nameEn} · Sole proprietorship · Seoul, Korea`, demo: "Studio Demo" } },
};
const path = (lang, p) => (lang === "en" ? "/en" : "") + (p ? `/${p}/` : "/");

function layout({ lang, page, title, desc, body, noindex = false, dark = true }) {
  const t = T[lang], other = lang === "ko" ? "en" : "ko", url = ORG.url + path(lang, page);
  const full = page ? `${title} — ${lang === "ko" ? ORG.nameKo : ORG.nameEn}` : title;
  const nav = t.nav.map(([p, n]) => `<a href="${path(lang, p)}"${p === page ? ' aria-current="page"' : ""}>${n}</a>`).join("");
  const ld = page ? "" : `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "ProfessionalService", name: ORG.nameEn, alternateName: ORG.nameKo, url: ORG.url, logo: ORG.url + "/assets/mark.svg", image: ORG.url + "/assets/og.png", description: desc, foundingDate: String(ORG.founded), address: { "@type": "PostalAddress", addressLocality: "Seoul", addressCountry: "KR" }, areaServed: "KR", knowsLanguage: ["ko", "en"], knowsAbout: ["AI transformation", "Process innovation", "Workflow automation", "AI software development"] })}</script>`;
  return `<!doctype html>
<html lang="${lang}" class="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="ko" href="${ORG.url + path("ko", page)}">
<link rel="alternate" hreflang="en" href="${ORG.url + path("en", page)}">
<link rel="alternate" hreflang="x-default" href="${ORG.url + path("ko", page)}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${lang === "ko" ? ORG.nameKo : ORG.nameEn}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORG.url}/assets/og.png">
<meta property="og:locale" content="${lang === "ko" ? "ko_KR" : "en_US"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a1122">
<link rel="icon" href="/assets/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/site.css?v=${V}">
<script>document.documentElement.classList.add("js")</script>
${ld}
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header class="top${dark ? " on-dark" : ""}" id="top"><div class="wrap">
  <a class="brand" href="${path(lang, "")}" aria-label="${lang === "ko" ? ORG.nameKo : ORG.nameEn}">${MARK()}<span>Atelier AX</span></a>
  <nav class="nav" aria-label="${lang === "ko" ? "주요 메뉴" : "Main"}">${nav}<a class="lang" href="${path(other, page)}" hreflang="${other}" lang="${other}" aria-label="${t.otherLabel}">${t.other}</a><a class="btn sm" href="${path(lang, "contact")}">${t.contact}</a></nav>
  <details class="menu"><summary aria-label="${t.menu}"><i aria-hidden="true"></i>${t.menu}</summary><div class="sheet">${t.nav.map(([p, n], i) => `<a href="${path(lang, p)}">${n}<span>0${i + 1}</span></a>`).join("")}<a href="${path(other, page)}" hreflang="${other}" lang="${other}">${t.otherLabel}<span>${t.other}</span></a><a class="btn" href="${path(lang, "contact")}">${t.contact}</a></div></details>
</div></header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="foot"><div class="wrap">
  <div class="grid">
    <div class="who"><a class="brand" href="${path(lang, "")}">${MARK()}<span>Atelier AX</span></a><p>${t.foot.tag}</p></div>
    <nav aria-label="${t.foot.company}"><b>${t.foot.company}</b><a href="${path(lang, "about")}">${t.nav[4][1]}</a><a href="${path(lang, "contact")}">${t.contact}</a></nav>
    <nav aria-label="${t.foot.explore}"><b>${t.foot.explore}</b><a href="${path(lang, "services")}">${t.nav[0][1]}</a><a href="${path(lang, "work")}">${t.nav[1][1]}</a><a href="${path(lang, "lab")}">${t.nav[2][1]}</a><a href="${path(lang, "insights")}">${t.nav[3][1]}</a><a href="/studio/">${t.foot.demo}</a></nav>
    <nav aria-label="${t.foot.legal}"><b>${t.foot.legal}</b><a href="${path(lang, "privacy")}">${t.foot.privacy}</a><a href="${path(other, page)}" hreflang="${other}" lang="${other}">${t.otherLabel}</a></nav>
  </div>
  <div class="legal"><span>${t.foot.biz}</span><span>© ${ORG.founded} Atelier AX</span></div>
</div></footer>
<script src="/assets/site.js?v=${V}" type="module"></script>
</body>
</html>
`;
}

const svcName = (s, lang) => (lang === "ko" ? s.ko.name : s.en.name);
const head = (k, h, id, body = "") => `<div class="sec-head"><div><p class="kicker">${k}</p><h2 class="h2" id="${id}" data-reveal>${h}</h2></div>${body ? `<p class="body" data-reveal>${body}</p>` : ""}</div>`;

// 히어로 시각화 — 입력 → 수집·정리 → AI 처리 → 사람 검토 → 결과. 노드는 키보드로도 고를 수 있다.
function flowSVG(ko) {
  const L = ko ? { s: ["요청 메일", "엑셀 자료", "계약 문서"], ss: ["입력", "입력", "입력"], c: ["수집·정리", "자동"], a: ["AI 처리", "분류·요약·초안"], g: "사람 검토", r: "반려 시 되돌림", o: ["주간 보고서", "검토 완료 · 기록 저장"], ok: "승인됨" }
    : { s: ["Request emails", "Spreadsheets", "Contracts"], ss: ["input", "input", "input"], c: ["Collect & tidy", "automated"], a: ["AI processing", "classify · summarise · draft"], g: "Human review", r: "sent back if rejected", o: ["Weekly report", "reviewed · logged"], ok: "Approved" };
  const cap = ko ? { src: "입력 — 메일, 엑셀, 문서처럼 흩어진 곳에서 일이 시작됩니다.", collect: "수집·정리 — 정해진 규칙으로 모으고 형식을 맞추는 일은 자동으로.", ai: "AI 처리 — 분류·요약·초안처럼 AI가 잘하는 일만 맡깁니다.", gate: "사람 검토 — 중요한 결과는 사람이 확인하고 승인해야 다음으로 갑니다.", out: "결과 — 승인된 결과만 전달되고, 모든 단계가 기록으로 남습니다." }
    : { src: "Input — work starts in scattered places: email, spreadsheets, documents.", collect: "Collect & tidy — gathering and formatting by rule happens automatically.", ai: "AI processing — AI takes only what it does well: classifying, summarising, drafting.", gate: "Human review — important results move on only after a person checks and approves them.", out: "Output — only approved results go out, and every step is on record." };
  const src = L.s.map((s, i) => `<g class="node src" tabindex="0" data-cap="${esc(cap.src)}" data-k="src"><rect x="6" y="${26 + i * 76}" width="136" height="54" rx="10"/><text x="22" y="${50 + i * 76}">${s}</text><text class="sub" x="22" y="${68 + i * 76}">${L.ss[i]}</text></g>`).join("");
  return `<div class="flow" data-flow>
<svg viewBox="0 0 560 470" role="group" aria-label="${ko ? "업무 흐름 시각화: 입력이 수집·정리와 AI 처리를 거쳐 사람의 검토 후 결과로 나간다" : "Workflow visualisation: input passes through collection, AI processing and human review before becoming output"}">
<defs><linearGradient id="fg" gradientUnits="userSpaceOnUse" x1="140" y1="0" x2="470" y2="340"><stop offset="0" stop-color="#9dbbff"/><stop offset="1" stop-color="#2b59e0"/></linearGradient></defs>
<g class="lyr" data-depth="4">
  <path class="path live" id="p-s0" d="M142 53 C168 53 166 130 192 130"/><path class="path live" id="p-s1" d="M142 129 C166 129 166 130 192 130"/><path class="path live" id="p-s2" d="M142 205 C168 205 166 130 192 130"/>
  <path class="path live" id="p-ca" d="M326 130 L380 130"/><path class="path live" id="p-ag" d="M462 170 L462 236"/><path class="path live" id="p-go" d="M462 290 L462 344"/>
  <path class="path" d="M436 263 C380 263 360 200 392 170" stroke-dasharray="3 5"/><text x="300" y="232" fill="#7e8ba6" font-size="11">${L.r}</text>
</g>
<g class="lyr" data-depth="9">
  ${src}
  <g class="node collect" tabindex="0" data-cap="${esc(cap.collect)}" data-k="collect"><rect x="192" y="98" width="134" height="64" rx="12"/><text x="208" y="126">${L.c[0]}</text><text class="sub" x="208" y="146">${L.c[1]}</text></g>
  <g class="node ai" tabindex="0" data-cap="${esc(cap.ai)}" data-k="ai"><rect class="ring" x="380" y="90" width="164" height="80" rx="14"/><rect x="380" y="90" width="164" height="80" rx="14"/><text x="398" y="124">${L.a[0]}</text><text class="sub" x="398" y="146">${L.a[1]}</text></g>
  <g class="node gate" tabindex="0" data-cap="${esc(cap.gate)}" data-k="gate"><path d="M462 236 L489 263 L462 290 L435 263 Z"/><text x="500" y="268">${L.g}</text></g>
  <g class="node out" tabindex="0" data-cap="${esc(cap.out)}" data-k="out"><rect x="192" y="344" width="352" height="100" rx="14"/><text x="214" y="380">${L.o[0]}</text><text class="sub" x="214" y="402">${L.o[1]}</text><text class="ok" x="214" y="426">✓ ${L.ok}</text>
    <rect x="390" y="366" width="130" height="8" rx="4" fill="#e1e3e9"/><rect x="390" y="384" width="96" height="8" rx="4" fill="#e1e3e9"/><rect x="390" y="402" width="112" height="8" rx="4" fill="#e1e3e9"/></g>
  <g class="toks"></g>
</g>
</svg>
<p class="flow-cap" aria-live="polite"><span class="cap">${cap.src}</span><span class="tag">${ko ? "시각화 · 예시" : "illustration"}</span></p>
</div>`;
}

const pages = {};

pages.home = (lang) => {
  const ko = lang === "ko", ba = ko ? BA.k : BA.e, f = ko ? FOUNDER.k : FOUNDER.e;
  const lane = (rows, who) => `<ol class="lane">${rows.map(([w, b, d], i) => `<li style="--i:${i}"><div class="step${w === "person" ? " hand" : ""}"><span class="who ${w}">${who[w]}</span><b>${b}</b><span class="d">${d}</span></div></li>`).join("")}</ol>`;
  const sum = (rows) => `<p class="ba-sum">${rows.map(([k, v]) => `<span>${k} <i>${v}</i></span>`).join("")}</p>`;
  return layout({ lang, page: "", title: ko ? "아뜰리에 AX — 업무를 다시 설계하고, 작동하는 AI까지" : "Atelier AX — Redesign the work. Ship AI that runs.",
    desc: ko ? "아뜰리에 AX는 기업의 업무를 진단하고 AI와 자동화를 결합해 실제로 운영할 수 있는 시스템으로 구현하는 서울의 독립 AX 컨설팅 스튜디오입니다." : "Atelier AX is an independent AX consulting studio in Seoul that diagnoses how work is done and builds AI and automation into systems that actually run.",
    body: `
<section class="hero"><div class="wrap">
  <div>
    <p class="kicker">${ko ? "독립 AX 컨설팅 스튜디오 · 서울" : "Independent AX consulting studio · Seoul"}</p>
    <h1 class="display">${ko ? "업무를 다시 설계하고,<br><span class=\"grad\">작동하는 AI까지.</span>" : "Redesign the work.<br><span class=\"grad\">Ship AI that runs.</span>"}</h1>
    <p class="lede">${ko ? "아뜰리에 AX는 기업의 업무를 진단하고, AI와 자동화를 결합해 실제로 운영할 수 있는 시스템으로 구현하는 독립 AX 컨설팅 스튜디오입니다." : "Atelier AX is an independent AX consulting studio. We diagnose how your work is done, then combine AI and automation into systems your team can actually run."}</p>
    <p class="motto">${ko ? "기획한 사람이 만들고, 만든 사람이 설명합니다." : "The person who designs it builds it — and explains it."}</p>
    <div class="ctas"><a class="btn" href="${path(lang, "contact")}" data-magnet>${ko ? "상담 신청하기" : "Start a conversation"} ${ARR}</a><a class="btn ghost" href="/studio/">${ko ? "Studio Demo 보기" : "See the Studio Demo"}</a></div>
  </div>
  ${flowSVG(ko)}
</div></section>
<section class="strip" aria-label="${ko ? "서비스 요약" : "Services at a glance"}"><div class="wrap"><ul>${SERVICES.map((s) => `<li><b>${svcName(s, lang)}</b>${ko ? s.k.short : s.e.short}</li>`).join("")}</ul></div></section>

<section class="sec" aria-labelledby="h-pain"><div class="wrap">
  ${head(ko ? "문제" : "The problem", ko ? "AI 도구는 늘었는데, 일하는 방식은 그대로입니다" : "More AI tools. The same way of working.", "h-pain", ko ? "대부분의 비효율은 기술이 없어서가 아니라, 업무가 끊긴 채 사람 손으로 이어지기 때문에 생깁니다." : "Most inefficiency is not a lack of technology. It comes from work that is broken into pieces and stitched together by hand.")}
  <div class="pains">${PAINS.map((p, i) => { const [h, b] = ko ? p.k : p.e; return `<article class="pain" data-reveal style="transition-delay:${i * 60}ms">${ICON[p.icon]}<h3 class="h3">${h}</h3><p>${b}</p></article>`; }).join("")}</div>
  <div class="ba" data-ba>
    <div class="ba-top"><h3 class="h3">${ba.title}</h3><div class="seg" role="tablist" aria-label="${ko ? "비교" : "Compare"}"><button role="tab" id="tb-b" aria-controls="ba-b" aria-selected="true">${ba.before}</button><button role="tab" id="tb-a" aria-controls="ba-a" aria-selected="false" tabindex="-1">${ba.after}</button></div></div>
    <div class="ba-panel show" id="ba-b" role="tabpanel" aria-labelledby="tb-b">${lane(ba.b, ba.who)}${sum(ba.sumB)}</div>
    <div class="ba-panel" id="ba-a" role="tabpanel" aria-labelledby="tb-a" hidden>${lane(ba.a, ba.who)}${sum(ba.sumA)}</div>
    <p class="note" style="margin-top:14px">${ba.note}</p>
  </div>
</div></section>

<section class="sec white" aria-labelledby="h-diff"><div class="wrap diff">
  <div class="quote"><p class="kicker">${ko ? "1인 전문 스튜디오" : "A one-person studio"}</p><p class="big" id="h-diff" data-reveal>${ko ? "작게 일하기 때문에,<br>끝까지 책임질 수 있습니다." : "Because we work small,<br>we can own it end to end."}</p><span class="meta">${ko ? "규모를 부풀리지 않습니다. 대신 한 사람이 처음부터 끝까지 맡습니다." : "We do not inflate our size. One person takes the work from start to finish."}</span></div>
  <ol>${DIFF.map((d, i) => { const [h, b] = ko ? d.k : d.e; return `<li data-reveal><span class="num">0${i + 1}</span><h3 class="h3">${h}</h3><p>${b}</p></li>`; }).join("")}</ol>
</div></section>

<section class="sec" aria-labelledby="h-svc"><div class="wrap">
  ${head(ko ? "서비스" : "Services", ko ? "진단에서 운영까지, 이어지는 네 가지 서비스" : "Four connected services, from diagnosis to operation", "h-svc", ko ? "어느 단계에서든 시작할 수 있고, 필요한 다음 단계로 자연스럽게 이어집니다." : "Start at any stage; each one leads naturally into the next.")}
  <div class="svc-grid">${SERVICES.map((s, i) => { const c = ko ? s.k : s.e; return `<a class="card" href="${path(lang, "services")}#${s.id}" data-reveal data-light><div class="top-row"><span class="num">0${i + 1}</span></div><h3 class="h3">${svcName(s, lang)}</h3>${ko ? `<p class="en-name">${s.en.name}</p>` : ""}
    <dl><div><dt>${ko ? "문제" : "Problem"}</dt><dd>${c.problem}</dd></div><div><dt>${ko ? "하는 일" : "We do"}</dt><dd>${c.work.slice(0, 3).join(" · ")}</dd></div><div><dt>${ko ? "산출물" : "You get"}</dt><dd>${c.out.join(" · ")}</dd></div></dl>
    <span class="go">${ko ? "자세히 보기" : "Details"} ${ARR}</span></a>`; }).join("")}</div>
</div></section>

<section class="sec dark" aria-labelledby="h-method"><div class="wrap">
  ${head(ko ? "방법론" : "Method", ko ? "발견, 설계, 구현, 운영" : "Discover. Architect. Engineer. Govern.", "h-method", ko ? "단계마다 눈으로 확인할 수 있는 산출물이 남고, 다음 단계로 갈지는 그 산출물을 보고 함께 정합니다." : "Every stage leaves something you can inspect, and we decide together whether to move on.")}
  <div class="method" data-method>
    <div class="stage" aria-hidden="true"><svg class="dial" viewBox="0 0 400 400"><circle class="trk" cx="200" cy="200" r="150"/><circle class="arc" cx="200" cy="200" r="150" transform="rotate(-90 200 200)" stroke-dasharray="942.5" stroke-dashoffset="706.9"/>
      ${METHOD.map((m, i) => { const a = (i / 4) * 2 * Math.PI - Math.PI / 2, x = 200 + 150 * Math.cos(a), y = 200 + 150 * Math.sin(a), tx = 200 + 186 * Math.cos(a), ty = 200 + 186 * Math.sin(a) + 4; return `<g class="pt${i === 0 ? " on" : ""}" data-pt="${i}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"/><text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle">${ko ? m.k[0] : m.e[0]}</text></g>`; }).join("")}
      <g class="center"><text x="200" y="196" text-anchor="middle" data-dial-n>01</text><text class="s" x="200" y="224" text-anchor="middle" data-dial-t>${METHOD[0].k[1]}</text></g></svg></div>
    <div class="steps">${METHOD.map((m, i) => `<div class="step${i === 0 ? " on" : ""}" data-step="${i}" data-name="${m.k[1]}"><span class="num">0${i + 1} · ${m.k[1]}</span><h3 class="h3">${ko ? m.k[0] : m.e[0]}</h3><p>${ko ? m.kt : m.et}</p><div class="out">${(ko ? m.ko : m.eo).split(" · ").map((x) => `<span>${x}</span>`).join("")}</div></div>`).join("")}</div>
  </div>
</div></section>

<section class="sec dark" style="padding-top:0" aria-labelledby="h-demo"><div class="wrap">
  ${head(ko ? "실제로 작동하는 시스템" : "A system that runs", ko ? "설명 대신, 움직이는 화면으로" : "Not a description. A working screen.", "h-demo", ko ? "아래는 AI 네 개가 각자의 업무를 수행하는 모습을 Studio Demo의 엔진으로 그대로 돌린 것입니다." : "Below, the Studio Demo engine runs four AI agents doing their own work, live in your browser.")}
  <div class="demo">
    <div class="demo-frame" data-demo><div class="demo-bar"><span class="live">${ko ? "시뮬레이션 · 가상 데이터" : "Simulation · synthetic data"}</span><span>studio / model-house</span><button type="button" data-demo-toggle aria-pressed="true">${ko ? "일시정지" : "Pause"}</button></div>
      <div class="demo-stage mini" data-demo-stage><p class="ph">${ko ? "시연을 불러오는 중…" : "Loading demo…"}</p></div>
      <ol class="demo-feed" data-demo-feed aria-label="${ko ? "방금 일어난 일" : "Latest activity"}" aria-live="off"></ol></div>
    <div class="demo-side"><h3 class="h3" style="color:#fff">${ko ? "Studio Demo에서 직접 확인할 수 있는 것" : "What you can check in the Studio Demo"}</h3>
      <ul class="checks">${(ko ? [["6단계 업무 흐름", "기획·설계·제작·검증·검토·공개"], ["사람의 승인 관문", "범위·설계·검토·공개 네 지점에서 멈춤"], ["정직한 검증 기록", "실행하지 않은 검사는 ‘미검증’"], ["실패와 복구", "오류를 숨기지 않고 수정·재검사"]] : [["A six-stage workflow", "plan · design · build · verify · review · release"], ["Human approval gates", "it stops at scope, design, review and release"], ["Honest verification", "checks that have not run stay ‘unverified’"], ["Failure and recovery", "errors are shown, fixed and re-checked"]]).map(([b, s]) => `<li><span><b>${b}</b> — ${s}</span></li>`).join("")}</ul>
      <div class="ctas" style="margin-top:0"><a class="btn" href="/studio/">${ko ? "Studio Demo 열기" : "Open the Studio Demo"} ${ARR}</a><a class="btn ghost" href="/studio/#/bridge">${ko ? "모델하우스 크게 보기" : "Full model house"}</a></div>
      <p class="honest">${ko ? "이 화면은 브라우저 안에서 돌아가는 시뮬레이션입니다. 실제 AI 호출이나 고객 데이터를 쓰지 않으며, 실제 AI 실행은 별도 설정이 있을 때만 켜집니다." : "This is a simulation running in your browser. It makes no real AI calls and uses no client data; live AI execution is enabled only with separate configuration."}</p></div>
  </div>
</div></section>

<section class="sec" aria-labelledby="h-ind"><div class="wrap">
  ${head(ko ? "적용 분야" : "Where it applies", ko ? "문서와 규칙이 많은 업무에서 특히 효과가 큽니다" : "Most valuable where documents and rules pile up", "h-ind")}
  <div class="ind">${INDUSTRIES.map((x) => { const [h, b, ex] = ko ? x.k : x.e; return `<div class="tile" data-reveal><h3 class="h3">${h}</h3><p>${b}</p><div class="ex">${ex.map((e) => `<span>${e}</span>`).join("")}</div></div>`; }).join("")}</div>
  <p class="note">${ko ? "적용 가능한 업무의 예시이며, 고객 수행 사례가 아닙니다. 아뜰리에 AX는 법률 자문이나 법률 사무를 제공하지 않으며 고객의 법률적·전문적 판단을 대신하지 않습니다." : "These are examples of applicable work, not client case studies. Atelier AX does not provide legal advice or legal services and does not replace a client's legal or professional judgement."}</p>
</div></section>

<section class="sec white" aria-labelledby="h-founder"><div class="wrap founder">
  <div class="l"><p class="kicker">${ko ? "대표" : "Founder"}</p><p class="big" id="h-founder" data-reveal>${ko ? "기획한 사람이 만들고,<br>만든 사람이 설명합니다." : "The person who designs it<br>builds it — and explains it."}</p>
    <p class="lede" style="font-size:17px">${ko ? "아뜰리에 AX는 대표 한 사람이 직접 운영하는 스튜디오입니다. 첫 상담에서 들은 이야기가 설계서가 되고, 그 설계서를 쓴 사람이 직접 시스템을 만들고 운영 방법을 설명합니다." : "Atelier AX is run directly by its founder. What you say in the first conversation becomes the design, and the person who wrote that design builds the system and explains how to run it."}</p>
    <div class="ctas"><a class="btn ghost" href="${path(lang, "about")}">${ko ? "회사 소개" : "About the studio"} ${ARR}</a></div></div>
  <div class="r"><div class="profile" data-reveal><div class="who"><span class="mono">${MARK("#eef2fb")}</span><div><b>${f.role}</b><span>${f.line}</span></div></div>
    <dl class="facts">${f.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl></div></div>
</div></section>

<section class="sec" aria-labelledby="h-start"><div class="wrap">
  ${head(ko ? "시작하는 방법" : "How to start", ko ? "정리된 기획서가 없어도 됩니다" : "No formal brief required", "h-start")}
  <ol class="steps4">${(ko ? [["문의", "해결하고 싶은 업무를 짧게 적어 보내 주세요."], ["첫 대화", "현재 흐름과 목표를 함께 확인합니다."], ["범위와 제안", "범위·일정·산출물을 제안드립니다."], ["착수", "작은 과제부터 시작해 단계마다 결과를 봅니다."]] : [["Enquiry", "Send a short note about the work you want to change."], ["First conversation", "We look at the current flow and the goal together."], ["Scope & proposal", "We propose scope, schedule and deliverables."], ["Start", "We begin small and review results at every stage."]]).map(([b, s]) => `<li data-reveal><b>${b}</b><span>${s}</span></li>`).join("")}</ol>
  <div class="band" style="margin-top:clamp(56px,7vw,96px)" data-reveal><div><h2 class="h2">${ko ? "우리 조직의 문제를 한번 설명해 보세요." : "Tell us about the problem in your organisation."}</h2><p>${ko ? "지금 어떻게 일하는지, 무엇이 불편한지만 적어 주시면 됩니다. 내용을 확인한 뒤 대표가 직접 회신드립니다." : "Just describe how the work is done today and what gets in the way. The founder will reply personally."}</p></div><a class="btn light" href="${path(lang, "contact")}" data-magnet>${ko ? "상담 신청하기" : "Start a conversation"} ${ARR}</a></div>
</div></section>` });
};

pages.services = (lang) => {
  const ko = lang === "ko", L = ko ? ["고객의 문제", "제공하는 작업", "산출물", "적용 사례", "시작하는 방법"] : ["The problem", "What we do", "Deliverables", "Typical applications", "How to start"];
  return layout({ lang, page: "services", title: ko ? "서비스" : "Services",
    desc: ko ? "AX 전략·업무 진단, AI 워크플로 자동화, AI 제품·소프트웨어 개발, AI 거버넌스·운영 신뢰성. 아뜰리에 AX의 네 가지 서비스." : "AX strategy and process intelligence, AI workflow automation, intelligent product engineering, and AI governance and operational reliability.",
    body: `<section class="page-head"><div class="wrap"><p class="kicker">${ko ? "서비스" : "Services"}</p><h1 class="display">${ko ? "기술의 이름이 아니라, 해결할 문제로 나눴습니다." : "Organised by the problem to solve, not the technology."}</h1>
  <p class="lede">${ko ? "네 서비스는 따로 맡길 수도, 진단에서 운영까지 이어서 맡길 수도 있습니다. 가격은 범위를 확인한 뒤 개별로 제안합니다." : "Engage one service or run from diagnosis to operation. Pricing is proposed individually once the scope is clear."}</p></div></section>
<div class="wrap">${SERVICES.map((s, i) => { const c = ko ? s.k : s.e, list = (a) => `<ul>${a.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  return `<section class="detail" id="${s.id}" aria-labelledby="h-${s.id}"><header><span class="num">0${i + 1}</span><h2 class="h2" id="h-${s.id}">${svcName(s, lang)}</h2>${ko ? `<span class="meta">${s.en.name}</span>` : ""}<p class="meta" style="margin-top:14px">${c.short}</p></header>
  <div class="content"><dl class="facts"><div><dt>${L[0]}</dt><dd>${c.problem}</dd></div><div><dt>${L[1]}</dt><dd>${list(c.work)}</dd></div><div><dt>${L[2]}</dt><dd>${list(c.out)}</dd></div><div><dt>${L[3]}</dt><dd>${list(c.cases)}</dd></div><div><dt>${L[4]}</dt><dd>${c.start} <a href="${path(lang, "contact")}">${ko ? "상담 신청" : "Get in touch"} →</a></dd></div></dl></div></section>`; }).join("")}</div>
<section class="sec" style="padding-top:0"><div class="wrap"><div class="band"><div><h2 class="h2">${ko ? "어느 서비스에서 시작할지 몰라도 괜찮습니다." : "Not sure where to start? That is fine."}</h2><p>${ko ? "업무 이야기를 들려주시면 맞는 출발점을 함께 정합니다." : "Tell us about the work and we will find the right starting point together."}</p></div><a class="btn light" href="${path(lang, "contact")}">${ko ? "상담 신청하기" : "Start a conversation"} ${ARR}</a></div></div></section>` });
};

pages.work = (lang) => {
  const ko = lang === "ko", S = ko ? { live: "공개·작동", proto: "시제품", concept: "기획", conf: "비공개" } : { live: "Live", proto: "Prototype", concept: "Concept", conf: "Confidential" };
  return layout({ lang, page: "work", title: ko ? "작업과 역량" : "Work & Capabilities",
    desc: ko ? "아뜰리에 AX의 공개 시연 제품과 대표 개인 프로젝트. 각 작업의 상태와 소유 관계를 구분해 표시합니다." : "Atelier AX's public demo product and the founder's personal projects, each labelled with its status and ownership.",
    body: `<section class="page-head"><div class="wrap"><p class="kicker">${ko ? "작업과 역량" : "Work & capabilities"}</p><h1 class="display">${ko ? "확인할 수 있는 것만 싣습니다." : "Only what can be checked."}</h1>
  <p class="lede">${ko ? "회사의 작업과 대표 개인 프로젝트를 구분해 표시합니다. 재직 기업의 내부 시스템과 고객사의 비공개 자료는 싣지 않으며, 성과 수치나 고객 후기도 만들어 쓰지 않습니다." : "Company work and the founder's personal projects are labelled separately. We do not show internal systems of any employer or confidential client material, and we do not invent metrics or testimonials."}</p></div></section>
<section class="sec" style="padding-top:clamp(48px,6vw,80px)"><div class="wrap">
  <p class="meta" style="margin:0 0 18px">${ko ? "상태" : "Status"} — ${Object.entries(S).map(([k, v]) => `<span class="status ${k}" style="margin-right:16px">${v}</span>`).join("")}</p>
  <ul class="work">${WORK.map((w) => { const c = ko ? w.ko : w.en; return `<li id="${w.id}" data-reveal><div class="tag"><span class="status ${w.status}">${c.status}</span><span class="meta" style="display:block;margin-top:6px">${c.kind}</span></div><h2 class="h3">${c.name}</h2>
    <div class="desc"><p>${c.desc}</p>${c.stack ? `<span class="meta">${c.stack}</span>` : ""}</div>${w.href ? `<a class="link" href="${w.href}"${w.ext ? ' rel="noopener" target="_blank"' : ""}>${c.link} ${w.ext ? "↗" : "→"}</a>` : '<span class="link meta">—</span>'}</li>`; }).join("")}</ul>
  <p class="note">${ko ? "‘대표 개인 프로젝트’는 대표가 개인적으로 만든 작업으로, 아뜰리에 AX의 고객 실적이 아닙니다." : "‘Founder’s personal project’ marks work the founder built personally; it is not client work of Atelier AX."}</p>
</div></section>` });
};

pages.lab = (lang) => {
  const ko = lang === "ko";
  const modes = ko ? [["/studio/", "프로젝트 스튜디오", "아이디어를 입력하면 AI 팀이 6단계로 일을 나눠 처리합니다. 승인 관문에서 사람이 결정하고, 검사 결과가 기록됩니다.", "live", "시연"], ["/studio/#/bridge", "AI 작업 모델하우스", "여러 AI가 각자의 업무를 수행하는 모습을 실시간 평면도로 봅니다. 실패와 복구 과정도 그대로 보입니다.", "live", "시뮬레이션"], ["/console/", "운영 관제 콘솔 · 초기판", "AI 인력의 업무·승인·성과를 한눈에 보던 첫 번째 관제 화면입니다. 기록 보존용으로 남겨 둡니다.", "proto", "보존판"]]
    : [["/studio/", "Project Studio", "Describe an idea and an AI team divides it into six stages. A person decides at each approval gate, and every check is recorded.", "live", "Demo"], ["/studio/#/bridge", "AI Work Model House", "Watch several AI agents carry out their own work on a live floor plan, including failures and recovery.", "live", "Simulation"], ["/console/", "Operations Console · first edition", "The first monitoring view of AI workers' tasks, approvals and performance, kept for the record.", "proto", "Archived"]];
  return layout({ lang, page: "lab", title: ko ? "아뜰리에 랩" : "Atelier Lab",
    desc: ko ? "아뜰리에 AX의 실험실. AI 에이전트 오케스트레이션 시연, 실시간 작업 시뮬레이션, 이벤트 브리지 구조를 공개합니다." : "Atelier AX's lab: an AI agent orchestration demo, a live work simulation and the architecture of our event bridge.",
    body: `<section class="page-head"><div class="wrap"><p class="kicker">${ko ? "아뜰리에 랩" : "Atelier Lab"}</p><h1 class="display">${ko ? "보고, 눌러 보고, 확인하는 실험실." : "A lab you can see, operate and inspect."}</h1>
  <p class="lede">${ko ? "랩의 시연은 모두 가상 데이터로 움직입니다. 실제 AI 키나 고객 데이터 없이 이 브라우저 안에서만 실행되며, 화면에 ‘시연’과 ‘가상’을 표시합니다." : "Everything in the lab runs on simulated data, inside your browser, without real AI keys or client data — and is labelled as a demo on screen."}</p></div></section>
<section class="sec" style="padding-top:clamp(48px,6vw,80px)"><div class="wrap"><ul class="lab-modes">${modes.map(([h, n, d, s, l]) => `<li><a class="card" href="${h}" data-light data-reveal><span class="status ${s}">${l}</span><h2 class="h3">${n}</h2><p class="body" style="font-size:15px">${d}</p><span class="go">${ko ? "열기" : "Open"} ${ARR}</span></a></li>`).join("")}</ul></div></section>
<section class="sec white" aria-labelledby="h-arch"><div class="wrap">
  ${head(ko ? "구조" : "Architecture", ko ? "AI의 실행과 사람의 승인 사이에 경계를 둡니다" : "A boundary between AI execution and human approval", "h-arch", ko ? "AI 도구가 보내는 작업 기록은 서버에서 정리·보관되고, 접근 코드가 있는 사람만 봅니다. 공개 시연은 이 경로와 분리된 가상 각본만 사용합니다." : "Work records sent by AI tools are normalised and stored on the server, and only people with an access code can view them. The public demo uses separate, simulated scripts.")}
  <div class="arch" role="img" aria-label="${ko ? "구조도: AI 도구가 이벤트 브리지로 작업 기록을 보내고, 저장소에 보관된 기록을 승인된 사용자만 관제 화면에서 본다. 공개 시연은 브라우저 안의 가상 각본으로 따로 움직인다." : "Diagram: AI tools send work records to the event bridge; stored records are viewed only by authorised users. The public demo runs separately on simulated scripts in the browser."}">
  <svg viewBox="0 0 960 300" aria-hidden="true"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>
    <rect class="bx" x="10" y="40" width="180" height="96" rx="10"/><text x="28" y="72">${ko ? "AI 도구" : "AI tools"}</text><text class="sm" x="28" y="96">Claude Code · n8n</text><text class="sm" x="28" y="114">${ko ? "작업마다 기록 전송" : "a record per action"}</text>
    <rect class="bx alt" x="260" y="40" width="200" height="96" rx="10"/><text class="inv" x="278" y="72">${ko ? "이벤트 브리지" : "Event bridge"}</text><text class="inv sm" x="278" y="96">POST /api/bridge/events</text><text class="inv sm" x="278" y="114">${ko ? "토큰 확인 · 비밀값 가림" : "token check · redaction"}</text>
    <rect class="bx" x="530" y="40" width="170" height="96" rx="10"/><text x="548" y="72">${ko ? "저장소" : "Storage"}</text><text class="sm" x="548" y="96">Supabase · RLS</text><text class="sm" x="548" y="114">${ko ? "공개 접근 없음" : "no public access"}</text>
    <rect class="bx" x="770" y="40" width="180" height="96" rx="10"/><text x="788" y="72">${ko ? "관제 화면" : "Monitoring view"}</text><text class="sm" x="788" y="96">GET /api/bridge/feed</text><text class="sm" x="788" y="114">${ko ? "접근 코드 필요" : "access code required"}</text>
    <path class="ln" d="M190 88H254"/><path class="ln" d="M460 88H524"/><path class="ln" d="M700 88H764"/>
    <rect class="gate" x="852" y="152" width="10" height="10" transform="rotate(45 857 157)"/><text x="878" y="162">${ko ? "사람의 승인" : "Human approval"}</text>
    <path class="ln dash" d="M860 140V150"/>
    <rect class="bx soft" x="10" y="200" width="940" height="76" rx="10"/><text x="28" y="232">${ko ? "공개 시연 (Studio Demo)" : "Public demo (Studio Demo)"}</text><text class="sm" x="28" y="256">${ko ? "브라우저 안의 가상 각본 · 서버·키·실제 기록과 분리 · 화면에 ‘시뮬레이션’ 표기" : "simulated scripts in the browser · separate from servers, keys and real records · labelled as simulated"}</text>
  </svg></div>
</div></section>` });
};

pages.about = (lang) => {
  const ko = lang === "ko", f = ko ? FOUNDER.k : FOUNDER.e;
  const PR = ko ? [["기술은 운영을 위해 존재합니다", "새로운 기술 자체보다, 그 기술이 매일의 업무를 실제로 얼마나 바꾸는지를 기준으로 판단합니다."], ["지능은 검증될 때 쓸모가 있습니다", "AI가 ‘완료했다’고 말하는 것과 실제로 작동하는 것을 구분합니다. 실행하지 않은 검사는 미검증으로 남깁니다."], ["자동화에도 책임자가 있어야 합니다", "모든 자동화에는 멈추는 지점, 확인하는 사람, 되돌리는 방법이 정해져 있어야 합니다."], ["설계가 곧 실행의 구조입니다", "화면과 문장, 데이터 구조와 승인 절차까지 하나의 설계로 다룹니다. 잘 설계된 업무는 설명이 짧아집니다."]]
    : [["Technology serves operations", "We judge technology by how much it actually changes everyday work, not by how new it is."], ["Intelligence is useful once verified", "We separate an AI saying it is done from something that actually works. A check that has not run stays unverified."], ["Every automation needs an owner", "Each automation needs a point where it stops, a person who checks it and a way to roll it back."], ["Design is the structure of execution", "Screens and sentences, data structures and approval steps are treated as one design. Well-designed work needs less explaining."]];
  return layout({ lang, page: "about", title: ko ? "회사 소개" : "About",
    desc: ko ? "아뜰리에 AX는 2026년 서울에서 출범한 1인 AX 컨설팅 스튜디오입니다. 대표가 직접 업무를 진단하고 설계하고 구현합니다." : "Atelier AX is a one-person AX consulting studio founded in Seoul in 2026. The founder diagnoses, designs and builds the work in person.",
    body: `<section class="page-head"><div class="wrap"><p class="kicker">${ko ? "회사 소개" : "About"}</p><h1 class="display">${ko ? "복잡한 업무를, 더 명확하고 통제할 수 있는 시스템으로." : "Complex work, made clear and controllable."}</h1>
  <p class="lede">${ko ? "아뜰리에 AX는 2026년 서울에서 개인사업자로 출범한 1인 AX 컨설팅 스튜디오입니다. ‘아뜰리에’라는 이름처럼, 고객마다 다른 업무를 직접 들여다보고 그에 맞는 시스템을 정밀하게 만듭니다. 큰 조직을 흉내 내지 않고, 작은 스튜디오의 밀도와 실행력으로 일합니다." : "Atelier AX is a one-person AX consulting studio founded in Seoul in 2026 as a sole proprietorship. As the name suggests, we look closely at each client's work and build a system that fits it precisely — with the focus and execution of a small studio, not the imitation of a large firm."}</p></div></section>
<section class="sec white" aria-labelledby="h-f"><div class="wrap founder">
  <div class="l"><p class="kicker">${ko ? "대표" : "Founder"}</p><p class="big" id="h-f">${ko ? "기획한 사람이 만들고,<br>만든 사람이 설명합니다." : "The person who designs it<br>builds it — and explains it."}</p></div>
  <div class="r"><div class="profile"><div class="who"><span class="mono">${MARK("#eef2fb")}</span><div><b>${f.role}</b><span>${f.line}</span></div></div><dl class="facts">${f.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl></div></div>
</div></section>
<div class="wrap">
  <section class="detail" aria-labelledby="h-mission"><header><span class="num">${ko ? "미션" : "Mission"}</span><h2 class="h2" id="h-mission">${ko ? "복잡한 업무를 더 명확하고 통제 가능한 시스템으로 바꿉니다." : "Turn complex work into clearer, controllable systems."}</h2></header>
    <div class="content"><p class="body">${ko ? "업무가 복잡해지는 이유는 대개 일의 양보다 흐름이 보이지 않기 때문입니다. 흐름을 드러내고, 사람과 AI가 맡을 일을 나누고, 그 결과를 확인할 수 있게 만듭니다." : "Work usually becomes complex not because there is too much of it, but because its flow cannot be seen. We make the flow visible, divide it between people and AI, and make the results checkable."}</p></div></section>
  <section class="detail" aria-labelledby="h-vision"><header><span class="num">${ko ? "비전" : "Vision"}</span><h2 class="h2" id="h-vision">${ko ? "AI가 조직의 생산성과 의사결정에 꾸준히 기여하는 실행 환경." : "An environment where AI contributes lastingly to productivity and decisions."}</h2></header>
    <div class="content"><p class="body">${ko ? "한 번의 시연으로 끝나는 AI가 아니라, 매일의 업무 안에서 기록되고 검증되며 개선되는 AI를 목표로 합니다." : "Not AI that ends with a single demo, but AI that is recorded, verified and improved inside everyday work."}</p></div></section>
</div>
<section class="sec" aria-labelledby="h-pr"><div class="wrap">${head(ko ? "원칙" : "Principles", ko ? "일하는 방식을 정하는 네 가지 원칙" : "Four principles behind how we work", "h-pr")}
  <ol class="principles">${PR.map(([h, b], i) => `<li data-reveal><span class="num">0${i + 1}</span><h3 class="h3">${h}</h3><p>${b}</p></li>`).join("")}</ol></div></section>
<section class="sec white" aria-labelledby="h-biz"><div class="wrap split"><div style="grid-column:1/6"><p class="kicker">${ko ? "사업자 정보" : "Business information"}</p><h2 class="h2" id="h-biz">${ko ? "확인된 정보만 적습니다" : "Only confirmed information"}</h2></div>
  <dl class="facts" style="grid-column:7/13"><div><dt>${ko ? "상호" : "Name"}</dt><dd>${ORG.nameKo} (${ORG.nameEn})</dd></div><div><dt>${ko ? "형태" : "Type"}</dt><dd>${ko ? "개인사업자 · 2026년 사업자등록" : "Sole proprietorship · registered 2026"}</dd></div><div><dt>${ko ? "주요 사업" : "Business"}</dt><dd>${ko ? "경영컨설팅 · AI 전환(AX) · 프로세스 혁신(PI) · 업무 자동화 · AI 소프트웨어 개발" : "Management consulting · AI transformation (AX) · process innovation (PI) · workflow automation · AI software development"}</dd></div><div><dt>${ko ? "소재지" : "Location"}</dt><dd>${ko ? "서울" : "Seoul, Korea"}</dd></div><div><dt>${ko ? "브랜드 구분" : "Brand scope"}</dt><dd>${ko ? "이 사이트는 회사의 공식 사이트입니다. 대표의 개인 포트폴리오는 별도로 운영되며, 개인 프로젝트는 ‘작업’ 페이지에서 회사 실적과 구분해 표시합니다." : "This is the company's official site. The founder's personal portfolio is separate, and personal projects are labelled apart from company work on the Work page."}</dd></div></dl>
</div></section>` });
};

pages.insights = (lang) => {
  const ko = lang === "ko", posts = POSTS.filter((p) => p.lang === lang), topics = ko ? TOPICS.k : TOPICS.e;
  return layout({ lang, page: "insights", title: ko ? "인사이트" : "Insights", noindex: posts.length === 0,
    desc: ko ? "아뜰리에 AX의 인사이트 — AI 전환, 업무 혁신, 제품 엔지니어링에 관한 글." : "Insights from Atelier AX on AI transformation, process innovation and product engineering.",
    body: `<section class="page-head"><div class="wrap"><p class="kicker">${ko ? "인사이트" : "Insights"}</p><h1 class="display">${ko ? "현장에서 정리한 생각을 씁니다." : "Notes written from the work itself."}</h1>
  <p class="lede">${posts.length ? "" : ko ? "아직 발행한 글이 없습니다. 첫 글을 준비하고 있으며, 아래는 다룰 주제입니다." : "Nothing has been published yet. The first pieces are in preparation; these are the topics they will cover."}</p></div></section>
<section class="sec" style="padding-top:clamp(48px,6vw,80px)"><div class="wrap">
  ${posts.length ? `<ul class="topics">${posts.map((p) => `<li><span class="meta">${esc(p.date)} · ${esc(p.topic)}</span><h2 class="h3"><a href="${path(lang, "insights/" + p.slug)}">${esc(p.title)}</a></h2><p>${esc(p.summary)}</p></li>`).join("")}</ul>`
    : `<h2 class="h3" style="margin-bottom:18px">${ko ? "준비 중인 주제" : "Topics in preparation"}</h2><ul class="topics">${topics.map(([t, h, d]) => `<li data-reveal><span class="meta">${t}</span><h3 class="h3">${h}</h3><p>${d}</p></li>`).join("")}</ul>`}
</div></section>` });
};

pages.contact = (lang) => {
  const ko = lang === "ko", faq = ko ? FAQ.k : FAQ.e;
  const svc = SERVICES.map((s) => [s.id, svcName(s, lang)]).concat([["unsure", ko ? "아직 모르겠음" : "Not sure yet"]]);
  const stages = ko ? [["explore", "알아보는 중"], ["defined", "해결할 과제가 정해짐"], ["budgeted", "예산·일정이 정해짐"], ["running", "이미 운영 중인 시스템 개선"]] : [["explore", "Exploring"], ["defined", "Problem defined"], ["budgeted", "Budget and timeline set"], ["running", "Improving a running system"]];
  return layout({ lang, page: "contact", title: ko ? "상담 신청" : "Contact",
    desc: ko ? "아뜰리에 AX에 AI 전환, 업무 자동화, AI 소프트웨어 개발 상담을 신청하세요. 정리된 기획서가 없어도 됩니다." : "Contact Atelier AX about AI transformation, workflow automation or AI software development. No formal brief needed.",
    body: `<section class="page-head"><div class="wrap"><p class="kicker">${ko ? "상담 신청" : "Contact"}</p><h1 class="display">${ko ? "바꾸고 싶은 업무를 알려 주세요." : "Tell us about the work you want to change."}</h1>
  <p class="lede">${ko ? "정리된 기획서가 없어도 괜찮습니다. 지금 어떻게 일하고 있는지, 무엇이 불편한지만 적어 주시면 내용을 확인한 뒤 대표가 직접 회신드립니다." : "No formal brief is needed. Tell us how the work is done today and what gets in the way; the founder will reply personally once it has been read."}</p></div></section>
<section class="sec" style="padding-top:clamp(48px,6vw,80px)"><div class="wrap split">
  <form class="form cform" id="contact" novalidate data-lang="${lang}">
    <div class="field"><label for="f-name">${ko ? "성명" : "Name"}</label><input id="f-name" name="name" autocomplete="name" required maxlength="60"><p class="err" id="e-name"></p></div>
    <div class="field"><label for="f-company">${ko ? "소속 또는 기업명" : "Organisation"}<span class="opt">${ko ? "선택" : "optional"}</span></label><input id="f-company" name="company" autocomplete="organization" maxlength="100"></div>
    <div class="field full"><label for="f-email">${ko ? "업무용 이메일" : "Work email"}</label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="200" inputmode="email"><p class="err" id="e-email"></p></div>
    <fieldset class="field full"><legend>${ko ? "관심 서비스" : "Service of interest"}</legend><div class="chips">${svc.map(([v, n], i) => `<label><input type="radio" name="service" value="${v}"${i === svc.length - 1 ? " checked" : ""}>${n}</label>`).join("")}</div></fieldset>
    <div class="field full"><label for="f-message">${ko ? "해결하고 싶은 문제" : "What you want to solve"}</label><textarea id="f-message" name="message" required minlength="10" maxlength="4000" placeholder="${ko ? "예: 매주 지점별 자료를 손으로 모아 보고서를 만듭니다. 이 과정을 줄이고 싶습니다." : "e.g. Every week we compile branch data by hand into a report and would like to cut that down."}"></textarea><p class="err" id="e-message"></p></div>
    <div class="field full"><label for="f-stage">${ko ? "예상 프로젝트 단계" : "Project stage"}</label><select id="f-stage" name="stage">${stages.map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}</select></div>
    <div class="hp" aria-hidden="true"><label for="f-website">Website</label><input id="f-website" name="website" tabindex="-1" autocomplete="off"></div>
    <div class="consent-box"><p><b>${ko ? "개인정보 수집·이용 안내" : "Personal data notice"}</b></p><p>${ko ? "수집 항목: 성명, 소속(선택), 업무용 이메일, 문의 내용 · 목적: 문의 확인과 회신 · 보유 기간: 문의 처리 완료 후 1년, 이후 파기. 동의하지 않으실 수 있으나 이 경우 양식으로 문의를 받을 수 없습니다." : "Collected: name, organisation (optional), work email, your message · Purpose: reviewing and replying to your enquiry · Retention: one year after the enquiry is closed, then deleted. You may decline, but the form cannot be sent without consent."} <a href="${path(lang, "privacy")}">${ko ? "개인정보처리방침" : "Privacy policy"}</a></p></div>
    <label class="consent"><input type="checkbox" name="consent" id="f-consent" required><span>${ko ? "위 개인정보 수집·이용에 동의합니다." : "I agree to the collection and use of my personal data as described."}</span></label><p class="err" id="e-consent" style="grid-column:1/-1;margin-top:-14px"></p>
    <div class="submit-row"><button class="btn" type="submit" id="f-submit">${ko ? "문의 보내기" : "Send enquiry"} ${ARR}</button><p class="result" id="f-result" role="status" aria-live="polite"></p></div>
  </form>
  <aside class="cside"><dl class="facts"><div><dt>${ko ? "회신" : "Reply"}</dt><dd>${ko ? "내용을 확인한 뒤 남겨 주신 이메일로 대표가 직접 회신드립니다." : "The founder replies personally to the email you provide."}</dd></div><div><dt>${ko ? "언어" : "Languages"}</dt><dd>${ko ? "한국어, 영어" : "Korean, English"}</dd></div><div><dt>${ko ? "소재지" : "Location"}</dt><dd>${ko ? "서울" : "Seoul, Korea"}</dd></div></dl>
    <p class="note">${ko ? "기밀 자료나 고객 개인정보는 첫 문의에 포함하지 마세요." : "Please keep confidential documents and customers' personal data out of a first enquiry."}</p></aside>
</div></section>
<section class="sec white" aria-labelledby="h-faq"><div class="wrap split"><div style="grid-column:1/5"><p class="kicker">FAQ</p><h2 class="h2" id="h-faq">${ko ? "상담 전에 자주 묻는 것" : "Before we talk"}</h2></div>
  <div class="faq" style="grid-column:6/13">${faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></div></section>` });
};

pages.privacy = (lang) => {
  const ko = lang === "ko";
  const body = ko ? `
<h2>1. 수집하는 개인정보와 목적</h2><p>아뜰리에 AX(이하 ‘회사’)는 상담 문의 양식을 통해 다음 정보를 수집합니다.</p>
<table><tr><th>항목</th><td>성명, 업무용 이메일, 문의 내용(필수) · 소속 또는 기업명, 관심 서비스, 프로젝트 단계(선택)</td></tr><tr><th>목적</th><td>문의 내용 확인, 회신, 상담 진행</td></tr><tr><th>보유 기간</th><td>문의 처리 완료 후 1년. 기간이 지나면 지체 없이 파기합니다. 법령에서 보존을 요구하는 경우 그 기간 동안 보관합니다.</td></tr></table>
<p>회원가입, 결제, 광고 목적의 정보 수집은 하지 않습니다.</p>
<h2>2. 자동으로 수집되는 정보</h2><p>이 사이트는 방문자 분석 도구나 광고 쿠키를 쓰지 않습니다. Studio Demo의 시연 기록과 화면 설정은 방문자의 브라우저 저장소(localStorage)에만 저장되며 회사 서버로 전송되지 않습니다. 호스팅 서비스는 보안과 운영을 위해 접속 기록(IP 주소, 요청 시각 등)을 일시적으로 처리할 수 있습니다.</p>
<h2>3. 처리 위탁과 국외 이전</h2><table><tr><th>Vercel Inc. (미국)</th><td>웹사이트 호스팅과 문의 양식 서버 처리. 문의 정보가 처리 과정에서 미국 소재 서버를 거칠 수 있습니다.</td></tr><tr><th>Supabase Inc. (미국)</th><td>문의 정보 저장. 데이터는 서울 리전(ap-northeast-2)에 보관합니다.</td></tr></table>
<p>회사는 위 목적 외로 개인정보를 제3자에게 제공하지 않습니다.</p>
<h2>4. 정보주체의 권리</h2><p>언제든지 자신의 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다. 문의 양식에 요청 내용을 적어 보내 주시면 본인 확인 후 지체 없이 처리합니다.</p>
<h2>5. 안전성 확보 조치</h2><p>문의 정보는 공개 접근이 차단된 저장소에 보관하고, 접근 권한을 최소한으로 제한합니다. 전송 구간은 HTTPS로 암호화됩니다.</p>
<h2>6. 개인정보 보호책임자</h2><p>아뜰리에 AX 대표 · 연락: 이 사이트의 <a href="/contact/">문의 양식</a></p>
<h2>7. 시행일</h2><p>이 방침은 2026년 11월 6일부터 적용합니다. 변경할 경우 이 페이지에 게시합니다.</p>` : `
<h2>1. Data we collect and why</h2><p>Atelier AX (“we”) collects the following through the contact form.</p>
<table><tr><th>Items</th><td>Name, work email and message (required) · organisation, service of interest and project stage (optional)</td></tr><tr><th>Purpose</th><td>Reviewing and replying to enquiries and holding consultations</td></tr><tr><th>Retention</th><td>One year after the enquiry is closed, then deleted without delay, unless a law requires longer retention.</td></tr></table>
<p>We do not collect data for accounts, payments or advertising.</p>
<h2>2. Information collected automatically</h2><p>This site uses no analytics or advertising cookies. Studio Demo records and display settings are stored only in your browser (localStorage) and are not sent to us. Our hosting provider may briefly process access logs (such as IP address and request time) for security and operation.</p>
<h2>3. Processors and international transfer</h2><table><tr><th>Vercel Inc. (USA)</th><td>Website hosting and server-side handling of the contact form; enquiry data may pass through servers in the United States.</td></tr><tr><th>Supabase Inc. (USA)</th><td>Storage of enquiries, kept in the Seoul region (ap-northeast-2).</td></tr></table>
<p>We do not provide personal data to third parties for any other purpose.</p>
<h2>4. Your rights</h2><p>You may ask to access, correct or delete your data, or to stop its processing, at any time. Send your request through the contact form and we will act on it promptly after verifying your identity.</p>
<h2>5. Security</h2><p>Enquiries are stored where public access is blocked, with access limited to the minimum. Data in transit is encrypted with HTTPS.</p>
<h2>6. Data protection officer</h2><p>The owner of Atelier AX · Contact: the <a href="/en/contact/">contact form</a> on this site</p>
<h2>7. Effective date</h2><p>This policy applies from 6 November 2026. Changes will be posted on this page.</p>`;
  return layout({ lang, page: "privacy", title: ko ? "개인정보처리방침" : "Privacy policy", desc: ko ? "아뜰리에 AX가 상담 문의로 수집하는 개인정보의 항목, 목적, 보유 기간, 처리 위탁과 정보주체의 권리." : "What personal data Atelier AX collects through enquiries, why, for how long, who processes it, and your rights.",
    body: `<section class="page-head"><div class="wrap"><p class="kicker">${ko ? "안내" : "Legal"}</p><h1 class="display">${ko ? "개인정보처리방침" : "Privacy policy"}</h1></div></section><section class="sec" style="padding-top:clamp(48px,6vw,80px)"><div class="wrap"><div class="prose">${body}</div></div></section>` });
};

const nf = layout({ lang: "ko", page: "", title: "페이지를 찾을 수 없습니다 — 아뜰리에 AX", desc: "요청한 페이지를 찾을 수 없습니다.", noindex: true,
  body: `<section class="page-head nf"><div class="wrap"><p class="kicker">404</p><h1 class="display">찾는 페이지가 없습니다.</h1><p class="lede">주소가 바뀌었거나 삭제된 페이지입니다. <span lang="en">The page you requested does not exist.</span></p><div class="ctas"><a class="btn" href="/">홈으로 ${ARR}</a><a class="btn ghost" href="/en/" lang="en">English home</a></div></div></section>` });

// ── 쓰기 ──
const out = (rel, data) => { const f = join(ROOT, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, data); return rel; };
const written = [];
for (const lang of ["ko", "en"]) for (const [name, fn] of Object.entries(pages)) {
  const p = name === "home" ? "" : name;
  written.push(out((lang === "en" ? "en/" : "") + (p ? `${p}/` : "") + "index.html", fn(lang)));
}
written.push(out("404.html", nf));
written.push(out("assets/site.css", "/* fonts: Pretendard Variable · JetBrains Mono (Latin) — files under /_next/static/media */\n" + readFileSync(join(HERE, "fonts.css.part"), "utf8") + "\n" + readFileSync(join(HERE, "style.css"), "utf8")));
const urls = ["", "services", "work", "lab", "about", "contact", "privacy"].concat(POSTS.length ? ["insights"] : []);
written.push(out("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.flatMap((u) => ["ko", "en"].map((l) => `  <url><loc>${ORG.url + path(l, u)}</loc><xhtml:link rel="alternate" hreflang="ko" href="${ORG.url + path("ko", u)}"/><xhtml:link rel="alternate" hreflang="en" href="${ORG.url + path("en", u)}"/></url>`)).join("\n")}
</urlset>
`));
written.push(out("robots.txt", `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /studio/\nDisallow: /console/\n\nSitemap: ${ORG.url}/sitemap.xml\n`));
if (process.argv.includes("--list")) console.log(written.join("\n"));
export { pages, written };
