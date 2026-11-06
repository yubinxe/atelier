// Atelier AX 기업 사이트 생성기 — `node site/build.mjs` → public/ 에 정적 HTML 을 쓴다(빌드 도구 없음, 결과물도 커밋).
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ORG, SERVICES, METHOD, WORK } from "./content.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const V = "2"; // 정적 자산 캐시 버전
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const MARK = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="1" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6 22V11a6 6 0 0 1 12 0v11" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 5v17" stroke="#9c7e48" stroke-width="1.4"/></svg>`;
const ARR = '<span class="arr" aria-hidden="true">→</span>';

const T = {
  ko: { nav: [["services", "서비스"], ["work", "작업"], ["lab", "랩"], ["about", "회사 소개"]], contact: "상담 문의", other: "EN", otherLabel: "English", skip: "본문으로 건너뛰기", menu: "메뉴",
    foot: { tag: "업무를 분석하고 AI 에이전트·자동화·소프트웨어로 실행 가능한 업무 시스템을 설계하는 AI 전환 스튜디오.", company: "회사", explore: "살펴보기", legal: "안내", privacy: "개인정보처리방침", biz: `${ORG.nameKo} · 개인사업자 · ${ORG.city.ko}`, demo: "Studio Demo" } },
  en: { nav: [["services", "Services"], ["work", "Work"], ["lab", "Lab"], ["about", "About"]], contact: "Get in touch", other: "KO", otherLabel: "한국어", skip: "Skip to content", menu: "Menu",
    foot: { tag: "An AI transformation studio that studies how work is done and engineers working systems from AI agents, automation and software.", company: "Company", explore: "Explore", legal: "Legal", privacy: "Privacy policy", biz: `${ORG.nameEn} · Sole proprietorship · Seoul, Korea`, demo: "Studio Demo" } },
};
const path = (lang, p) => (lang === "en" ? "/en" : "") + (p ? `/${p}/` : "/");

function layout({ lang, page, title, desc, body, noindex = false }) {
  const t = T[lang], other = lang === "ko" ? "en" : "ko", url = ORG.url + path(lang, page);
  const full = page ? `${title} — ${lang === "ko" ? ORG.nameKo : ORG.nameEn}` : title;
  const nav = t.nav.map(([p, n]) => `<a href="${path(lang, p)}"${p === page ? ' aria-current="page"' : ""}>${n}</a>`).join("");
  const ld = page ? "" : `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "ProfessionalService", name: ORG.nameEn, alternateName: ORG.nameKo, url: ORG.url, description: desc, foundingDate: String(ORG.founded), address: { "@type": "PostalAddress", addressLocality: "Seoul", addressCountry: "KR" }, areaServed: "KR", knowsLanguage: ["ko", "en"] })}</script>`;
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
<meta name="theme-color" content="#f4f1ea">
<link rel="icon" href="/assets/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/site.css?v=${V}">
${ld}
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header class="top" id="top"><div class="wrap">
  <a class="brand" href="${path(lang, "")}" aria-label="${lang === "ko" ? ORG.nameKo : ORG.nameEn}">${MARK}<span>Atelier AX</span></a>
  <nav class="nav" aria-label="${lang === "ko" ? "주요 메뉴" : "Main"}">${nav}<a class="lang" href="${path(other, page)}" hreflang="${other}" lang="${other}" aria-label="${t.otherLabel}">${t.other}</a><a class="btn sm solid" href="${path(lang, "contact")}">${t.contact}</a></nav>
  <details class="menu"><summary aria-label="${t.menu}"><i aria-hidden="true"></i>${t.menu}</summary><div class="sheet">${t.nav.map(([p, n], i) => `<a href="${path(lang, p)}">${n}<span>0${i + 1}</span></a>`).join("")}<a href="${path(other, page)}" hreflang="${other}" lang="${other}">${t.otherLabel}<span>${t.other}</span></a><a class="btn solid" href="${path(lang, "contact")}">${t.contact}</a></div></details>
</div></header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="foot"><div class="wrap">
  <div class="grid">
    <div class="who"><a class="brand" href="${path(lang, "")}">${MARK}<span>Atelier AX</span></a><p>${t.foot.tag}</p></div>
    <nav aria-label="${t.foot.company}"><b>${t.foot.company}</b><a href="${path(lang, "about")}">${t.nav[3][1]}</a><a href="${path(lang, "contact")}">${t.contact}</a></nav>
    <nav aria-label="${t.foot.explore}"><b>${t.foot.explore}</b><a href="${path(lang, "services")}">${t.nav[0][1]}</a><a href="${path(lang, "work")}">${t.nav[1][1]}</a><a href="${path(lang, "lab")}">${t.nav[2][1]}</a><a href="/studio/">${t.foot.demo}</a></nav>
    <nav aria-label="${t.foot.legal}"><b>${t.foot.legal}</b><a href="${path(lang, "privacy")}">${t.foot.privacy}</a><a href="${path(other, page)}" hreflang="${other}" lang="${other}">${t.otherLabel}</a></nav>
  </div>
  <div class="legal"><span>${t.foot.biz}</span><span>© ${ORG.founded} Atelier AX</span></div>
</div></footer>
<script src="/assets/site.js?v=${V}" defer></script>
</body>
</html>
`;
}

// ── 페이지 ──
const pages = {};
const svcName = (s, lang) => (lang === "ko" ? s.ko.name : s.en.name);

pages.home = (lang) => {
  const ko = lang === "ko";
  const P = ko ? [
    ["도구가 업무 흐름 밖에 있습니다", "사람마다 따로 쓰는 AI는 조직의 절차, 데이터, 승인 체계와 연결되지 않습니다. 결과는 다시 사람이 옮겨 붙입니다."],
    ["결과를 확인할 방법이 없습니다", "AI가 만든 결과가 맞는지, 누가 확인했는지 기록이 남지 않습니다. 그래서 중요한 일일수록 쓰지 못합니다."],
    ["자동화에 책임자가 없습니다", "한번 만든 자동화는 실패해도 아무도 모르고, 바꾸려면 만든 사람을 찾아야 합니다."],
  ] : [
    ["The tools sit outside the work", "AI used individually is not connected to the organisation's procedures, data or approvals. People still carry the results across by hand."],
    ["There is no way to check the result", "Nothing records whether an AI output was right or who verified it — so it is kept away from the work that matters most."],
    ["Automation has no owner", "Once built, an automation can fail without anyone noticing, and changing it means finding whoever made it."],
  ];
  return layout({ lang, page: "", title: ko ? "아뜰리에 AX — AI 전환 스튜디오" : "Atelier AX — AI Transformation Studio",
    desc: ko ? "아뜰리에 AX는 기업의 업무 프로세스를 분석하고 AI 에이전트, 자동화, 소프트웨어 엔지니어링을 결합해 실행 가능한 업무 시스템을 설계하는 서울의 AI 전환 스튜디오입니다." : "Atelier AX is a Seoul-based AI transformation studio that analyses business processes and combines AI agents, automation and software engineering into working operational systems.",
    body: `
<section class="hero"><div class="wrap">
  <p class="eyebrow">${ko ? "AI 전환 스튜디오 · 서울" : "AI Transformation Studio · Seoul"}</p>
  <h1 class="display">${ko ? "AI를 도입하는 일을 넘어, 일이 움직이는 방식을 다시 설계합니다." : "Beyond AI adoption. Engineering better ways of working."}</h1>
  <p class="lede">${ko ? "아뜰리에 AX는 기업의 업무 흐름을 분석하고 AI 에이전트, 자동화, 소프트웨어 엔지니어링을 결합해 실제로 돌아가는 업무 시스템을 만듭니다. 누가 무엇을 맡고, 어디서 사람이 승인하며, 결과를 무엇으로 확인하는지까지 설계합니다." : "Atelier AX studies how your work actually flows, then combines AI agents, automation and software engineering into systems that run in practice — including who does what, where a person approves, and how every result is checked."}</p>
  <div class="ctas"><a class="btn solid" href="${path(lang, "services")}">${ko ? "서비스 살펴보기" : "Explore services"} ${ARR}</a><a class="btn" href="/studio/">${ko ? "Studio Demo 체험하기" : "Try the Studio Demo"}</a></div>
  <ol class="phases" aria-label="${ko ? "일하는 방식" : "How we work"}">${METHOD.map((m, i) => `<li><span class="num">0${i + 1}</span><b>${ko ? `${m.k[0]} <span class="meta" style="display:inline">${m.k[1]}</span>` : m.e[0]}</b><span>${ko ? m.ko : m.eo}</span></li>`).join("")}</ol>
</div></section>

<section class="sec" aria-labelledby="h-problem"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow">${ko ? "문제" : "The problem"}</p><h2 class="h2" id="h-problem">${ko ? "AI 도구는 늘었는데, 일하는 방식은 그대로인 이유" : "More AI tools, the same way of working"}</h2></div>
    <p class="body">${ko ? "대부분의 조직에서 AI는 개인의 생산성 도구에 머뭅니다. 업무 구조가 바뀌지 않으면 효과도 개인 단위에서 끝납니다." : "In most organisations AI stays a personal productivity tool. If the structure of the work does not change, neither do the results."}</p></div>
  <ol class="rows">${P.map(([h, b], i) => `<li><span class="num">0${i + 1}</span><h3 class="h3">${h}</h3><p class="body">${b}</p></li>`).join("")}</ol>
</div></section>

<section class="sec paper" aria-labelledby="h-approach"><div class="wrap split">
  <div class="l"><p class="eyebrow">${ko ? "접근법" : "Our approach"}</p><h2 class="h2" id="h-approach">${ko ? "도구를 고르기 전에, 업무를 설계합니다." : "We design the work before choosing the tools."}</h2>
    <p class="lede">${ko ? "어떤 모델을 쓸지보다 먼저, 일이 어디서 시작해 누구를 거쳐 어디서 끝나는지를 봅니다. 그 위에 AI와 사람의 역할을 나누고, 작동하는 소프트웨어로 만들고, 운영 중에도 확인할 수 있게 합니다." : "Before deciding which model to use, we look at where the work starts, whom it passes through and where it ends. On that map we divide roles between AI and people, build working software, and keep it verifiable in operation."}</p></div>
  <dl class="pairs r">${(ko ? [["일반 AI 도구", "개인이 질문하고 답을 받는 데서 끝납니다. 업무 절차와 기록에 남지 않습니다."], ["일반 개발 외주", "요구한 화면은 만들지만, 업무를 어떻게 바꿀지는 발주자의 몫으로 남습니다."], ["아뜰리에 AX", "업무 분석에서 시작해 자동화·소프트웨어·승인 구조를 함께 설계하고, 운영까지 확인 가능한 형태로 넘깁니다."]] : [["Generic AI tools", "Stop at an individual asking and getting an answer, with nothing recorded in the process."], ["Typical outsourced development", "Builds the screens you specify, but leaves how the work should change to you."], ["Atelier AX", "Starts from the work itself, designs automation, software and approval structure together, and hands over a system that can be verified in operation."]]).map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join("")}</dl>
</div></section>

<section class="sec" aria-labelledby="h-svc"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow">${ko ? "서비스" : "Services"}</p><h2 class="h2" id="h-svc">${ko ? "네 가지 방식으로 일합니다" : "Four ways we work with you"}</h2></div>
    <p class="body">${ko ? "진단에서 시작할 수도, 이미 정해진 과제의 구현이나 운영 점검에서 시작할 수도 있습니다." : "Start with a diagnosis, or go straight to building a defined project or reviewing what you already run."}</p></div>
  <ul class="svc">${SERVICES.map((s, i) => `<li><a href="${path(lang, "services")}#${s.id}"><span class="num">0${i + 1}</span><h3 class="h3">${svcName(s, lang)}${ko ? `<small>${s.en.name}</small>` : ""}</h3><p class="body">${ko ? s.k.short : s.e.short}</p><span class="go" aria-hidden="true">→</span></a></li>`).join("")}</ul>
</div></section>

<section class="sec dark" aria-labelledby="h-method"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow">${ko ? "방법론" : "Method"}</p><h2 class="h2" id="h-method">${ko ? "발견에서 운영까지, 네 단계" : "Discover, Architect, Engineer, Govern"}</h2></div>
    <p class="body">${ko ? "단계마다 눈으로 확인할 수 있는 산출물이 남습니다. 다음 단계로 넘어갈지는 그 산출물을 보고 함께 정합니다." : "Every stage leaves something you can inspect. Whether to move on is decided together, on the basis of that output."}</p></div>
  <div class="method">${METHOD.map((m, i) => `<div><span class="num">0${i + 1} · ${m.k[1]}</span><h3 class="h3">${ko ? m.k[0] : m.e[0]}</h3><p>${ko ? m.kt : m.et}</p><p class="out">${ko ? m.ko : m.eo}</p></div>`).join("")}</div>
</div></section>

<section class="sec" aria-labelledby="h-proof"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow">${ko ? "기술력" : "Capability"}</p><h2 class="h2" id="h-proof">${ko ? "설명보다 작동하는 화면으로 보여 드립니다" : "We would rather show you something that runs"}</h2></div>
    <p class="body">${ko ? "Studio Demo는 AI 에이전트들이 일을 나눠 맡고, 사람의 승인을 거치고, 검사 기록을 남기는 과정을 직접 조작해 볼 수 있는 시연입니다." : "The Studio Demo lets you operate the process yourself: AI agents dividing the work, passing human approval gates and leaving verification records."}</p></div>
  <div class="proof">
    <figure><div class="frame"><div class="bar"><i></i><i></i><i></i><span>atelier-ax / studio · ${ko ? "시연" : "demo"}</span></div><picture><source srcset="/assets/studio-board.webp" type="image/webp"><img src="/assets/studio-board.png" width="1440" height="900" loading="lazy" decoding="async" alt="${ko ? "Studio Demo의 진행 보드 — 단계별 작업, 승인 관문, 에이전트 상태가 한 화면에 표시된다" : "The Studio Demo progress board, showing tasks by stage, approval gates and agent status on one screen"}"></picture></div>
      <figcaption>${ko ? "Studio Demo 화면. 표시되는 작업과 결과는 모두 가상의 시연 데이터입니다." : "Studio Demo. All tasks and results shown are simulated demonstration data."}</figcaption></figure>
    <div class="side"><ul class="checks">${(ko ? ["6단계 업무 흐름과 에이전트별 역할", "범위·설계·검토·공개 네 개의 승인 관문", "실행하지 않은 검사는 ‘미검증’으로 표시", "AI 작업을 실시간으로 보는 모델하우스"] : ["A six-stage workflow with a role for each agent", "Four approval gates: scope, design, review and release", "Checks that have not run are shown as unverified", "A live model house of AI agents at work"]).map((x) => `<li>${x}</li>`).join("")}</ul>
      <a class="btn" href="/studio/">${ko ? "Studio Demo 열기" : "Open the Studio Demo"} ${ARR}</a></div>
  </div>
</div></section>

<section class="sec paper" aria-labelledby="h-ind"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow">${ko ? "산업" : "Industries"}</p><h2 class="h2" id="h-ind">${ko ? "문서와 규정이 많은 업무에 집중합니다" : "Focused on document- and rule-heavy work"}</h2></div></div>
  <div class="ind">${(ko ? [["법률", "판례·계약서·내부 문서처럼 양이 많고 정확성이 중요한 자료의 정리, 검색, 업무 흐름 관리."], ["부동산", "공고·실거래·공시 자료처럼 흩어진 공공 데이터를 모아 조건별로 정리하고 일정을 관리하는 시스템."], ["전문서비스", "보고서 작성, 자료 취합, 고객 대응처럼 반복되지만 판단이 섞인 업무의 자동화와 검증 구조."]] : [["Legal", "Organising, searching and routing large volumes of precise material such as case law, contracts and internal documents."], ["Real estate", "Systems that gather scattered public data — notices, transactions, official prices — sort it by criteria and track the dates."], ["Professional services", "Automation and verification for repetitive work that still involves judgement: reports, data gathering, client response."]]).map(([h, b]) => `<div><h3 class="h3">${h}</h3><p>${b}</p></div>`).join("")}</div>
  <p class="note">${ko ? "아뜰리에 AX는 법률 자문이나 법률 사무를 제공하지 않으며, 고객의 법률적·전문적 판단을 대신하지 않습니다. 업무를 돕는 시스템을 설계하고 만듭니다." : "Atelier AX does not provide legal advice or legal services and does not replace a client's legal or professional judgement. We design and build the systems that support that work."}</p>
</div></section>

<section class="sec" aria-labelledby="h-steps"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow">${ko ? "협업" : "Working together"}</p><h2 class="h2" id="h-steps">${ko ? "지금의 업무에서 시작합니다" : "We start from the work you have today"}</h2></div></div>
  <ol class="steps">${(ko ? [["문의", "해결하고 싶은 업무를 간단히 적어 보내 주세요."], ["첫 대화", "업무 담당자와 함께 현재 흐름과 목표를 확인합니다."], ["범위와 제안", "진단 결과를 바탕으로 범위·일정·산출물을 제안합니다."], ["착수", "합의한 범위에서 시작하고, 단계마다 결과를 함께 봅니다."]] : [["Enquiry", "Send a short note about the work you want to change."], ["First conversation", "We review the current flow and the goal with the people who do the work."], ["Scope and proposal", "Based on that, we propose scope, schedule and deliverables."], ["Start", "Work begins within the agreed scope, reviewing results at every stage."]]).map(([b, s]) => `<li><b>${b}</b><span>${s}</span></li>`).join("")}</ol>
</div></section>

<section class="sec dark"><div class="wrap band">
  <h2 class="h2">${ko ? "바꾸고 싶은 업무가 있다면, 그 업무 이야기부터 들려주세요." : "If there is work you want to change, start by telling us about it."}</h2>
  <a class="btn solid" style="background:var(--ivory);color:var(--ink);border-color:var(--ivory)" href="${path(lang, "contact")}">${ko ? "상담 문의하기" : "Get in touch"} ${ARR}</a>
</div></section>` });
};

pages.services = (lang) => {
  const ko = lang === "ko", L = ko ? ["고객의 문제", "제공하는 작업", "산출물", "적용 사례", "시작하는 방법"] : ["The problem", "What we do", "Deliverables", "Typical applications", "How to start"];
  return layout({ lang, page: "services", title: ko ? "서비스" : "Services",
    desc: ko ? "AX 전략·업무 진단, AI 워크플로 자동화, AI 제품·소프트웨어 개발, AI 거버넌스·운영 신뢰성. 아뜰리에 AX가 제공하는 네 가지 서비스." : "AX strategy and process intelligence, AI workflow automation, intelligent product engineering, and AI governance and operational reliability.",
    body: `<section class="page-head"><div class="wrap"><p class="eyebrow">${ko ? "서비스" : "Services"}</p><h1 class="display">${ko ? "기술의 이름이 아니라, 해결할 문제로 나눴습니다." : "Organised by the problem to solve, not the technology."}</h1>
  <p class="lede">${ko ? "가격은 범위를 확인한 뒤 개별로 제안합니다. 정해진 패키지 가격은 두지 않습니다." : "Pricing is proposed individually once the scope is clear. We do not sell fixed packages."}</p></div></section>
<div class="wrap">${SERVICES.map((s, i) => { const c = ko ? s.k : s.e, list = (a) => `<ul>${a.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  return `<section class="detail" id="${s.id}" aria-labelledby="h-${s.id}"><header><span class="num">0${i + 1}</span><h2 class="h2" id="h-${s.id}">${svcName(s, lang)}</h2>${ko ? `<span class="meta">${s.en.name}</span>` : ""}</header>
  <div class="content"><dl class="facts"><div><dt>${L[0]}</dt><dd>${c.problem}</dd></div><div><dt>${L[1]}</dt><dd>${list(c.work)}</dd></div><div><dt>${L[2]}</dt><dd>${list(c.out)}</dd></div><div><dt>${L[3]}</dt><dd>${list(c.cases)}</dd></div><div><dt>${L[4]}</dt><dd>${c.start}</dd></div></dl></div></section>`; }).join("")}</div>
<section class="sec dark"><div class="wrap band"><h2 class="h2">${ko ? "어느 서비스에서 시작할지 몰라도 괜찮습니다." : "Not sure where to start? That is fine."}</h2><a class="btn solid" style="background:var(--ivory);color:var(--ink);border-color:var(--ivory)" href="${path(lang, "contact")}">${ko ? "상담 문의하기" : "Get in touch"} ${ARR}</a></div></section>` });
};

pages.work = (lang) => {
  const ko = lang === "ko", S = ko ? { live: "공개·작동", proto: "시제품", concept: "기획", conf: "비공개" } : { live: "Live", proto: "Prototype", concept: "Concept", conf: "Confidential" };
  return layout({ lang, page: "work", title: ko ? "작업과 역량" : "Work & Capabilities",
    desc: ko ? "아뜰리에 AX의 공개 시연 제품과 대표 개인 프로젝트. 각 작업의 상태와 소유 관계를 구분해 표시합니다." : "Atelier AX's public demo product and the founder's personal projects, each labelled with its status and ownership.",
    body: `<section class="page-head"><div class="wrap"><p class="eyebrow">${ko ? "작업과 역량" : "Work & capabilities"}</p><h1 class="display">${ko ? "확인할 수 있는 것만 싣습니다." : "Only what can be checked."}</h1>
  <p class="lede">${ko ? "회사의 작업과 대표 개인 프로젝트를 구분해 표시합니다. 재직 기업의 내부 시스템과 고객사의 비공개 자료는 싣지 않으며, 성과 수치나 고객 후기도 만들어 쓰지 않습니다." : "Company work and the founder's personal projects are labelled separately. We do not show internal systems of any employer or confidential client material, and we do not invent metrics or testimonials."}</p></div></section>
<section class="sec flush"><div class="wrap">
  <p class="meta" style="margin:0 0 18px">${ko ? "상태" : "Status"} — ${Object.entries(S).map(([k, v]) => `<span class="status ${k}" style="margin-right:16px">${v}</span>`).join("")}</p>
  <ul class="work">${WORK.map((w) => { const c = ko ? w.ko : w.en; return `<li id="${w.id}"><div class="tag"><span class="status ${w.status}">${c.status}</span><span class="meta" style="display:block;margin-top:6px">${c.kind}</span></div><h2 class="h3">${c.name}</h2>
    <div class="desc"><p>${c.desc}</p>${c.stack ? `<span class="meta">${c.stack}</span>` : ""}</div>${w.href ? `<a class="link" href="${w.href}"${w.ext ? ' rel="noopener" target="_blank"' : ""}>${c.link} ${w.ext ? "↗" : "→"}</a>` : '<span class="link meta">—</span>'}</li>`; }).join("")}</ul>
  <p class="note">${ko ? "‘대표 개인 프로젝트’는 사업자 출범 전후 대표가 개인적으로 만든 작업으로, 아뜰리에 AX의 고객 실적이 아닙니다." : "‘Founder’s personal project’ marks work the founder built personally; it is not client work of Atelier AX."}</p>
</div></section>` });
};

pages.lab = (lang) => {
  const ko = lang === "ko";
  const modes = ko ? [["/studio/", "프로젝트 스튜디오", "아이디어를 입력하면 AI 팀이 6단계로 일을 나눠 처리합니다. 승인 관문에서 사람이 결정하고, 검사 결과가 기록됩니다.", "live", "시연"], ["/studio/#/bridge", "AI 작업 모델하우스", "여러 AI가 각자의 업무를 수행하는 모습을 실시간 평면도로 봅니다. 실패와 복구 과정도 그대로 보입니다.", "live", "시뮬레이션"], ["/console/", "운영 관제 콘솔 · 초기판", "AI 인력의 업무·승인·성과를 한눈에 보던 첫 번째 관제 화면입니다. 기록 보존용으로 남겨 둡니다.", "proto", "보존판"]]
    : [["/studio/", "Project Studio", "Describe an idea and an AI team divides it into six stages. A person decides at each approval gate, and every check is recorded.", "live", "Demo"], ["/studio/#/bridge", "AI Work Model House", "Watch several AI agents carry out their own work on a live floor plan, including failures and recovery.", "live", "Simulation"], ["/console/", "Operations Console · first edition", "The first monitoring view of AI workers' tasks, approvals and performance, kept for the record.", "proto", "Archived"]];
  return layout({ lang, page: "lab", title: ko ? "아뜰리에 랩" : "Atelier Lab",
    desc: ko ? "아뜰리에 AX의 실험실. AI 에이전트 오케스트레이션 시연, 실시간 작업 시뮬레이션, 이벤트 브리지 구조를 공개합니다." : "Atelier AX's lab: an AI agent orchestration demo, a live work simulation and the architecture of our event bridge.",
    body: `<section class="page-head"><div class="wrap"><p class="eyebrow">${ko ? "아뜰리에 랩" : "Atelier Lab"}</p><h1 class="display">${ko ? "보고, 눌러 보고, 확인하는 실험실." : "A lab you can see, operate and inspect."}</h1>
  <p class="lede">${ko ? "랩의 시연은 모두 가상 데이터로 움직입니다. 실제 AI 키나 고객 데이터 없이 이 브라우저 안에서만 실행되며, 화면에 ‘시연’과 ‘가상’을 표시합니다." : "Everything in the lab runs on simulated data, inside your browser, without real AI keys or client data — and is labelled as a demo on screen."}</p></div></section>
<section class="sec flush"><div class="wrap"><ul class="lab-modes">${modes.map(([h, n, d, s, l]) => `<li><a href="${h}"><h2 class="h3">${n}</h2><p class="body">${d}</p><span class="status ${s}">${l}</span></a></li>`).join("")}</ul></div></section>
<section class="sec paper" aria-labelledby="h-arch"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow">${ko ? "구조" : "Architecture"}</p><h2 class="h2" id="h-arch">${ko ? "AI의 실행과 사람의 승인 사이에 경계를 둡니다" : "A boundary between AI execution and human approval"}</h2></div>
    <p class="body">${ko ? "AI 도구가 보내는 작업 기록은 서버에서 정리·보관되고, 접근 코드가 있는 사람만 봅니다. 공개 시연은 이 경로와 분리된 가상 각본만 사용합니다." : "Work records sent by AI tools are normalised and stored on the server, and only people with an access code can view them. The public demo uses separate, simulated scripts."}</p></div>
  <div class="arch" role="img" aria-label="${ko ? "구조도: AI 도구가 이벤트 브리지로 작업 기록을 보내고, 저장소에 보관된 기록을 승인된 사용자만 관제 화면에서 본다. 공개 시연은 브라우저 안의 가상 각본으로 따로 움직인다." : "Diagram: AI tools send work records to the event bridge; stored records are viewed only by authorised users. The public demo runs separately on simulated scripts in the browser."}">
  <svg viewBox="0 0 960 300" aria-hidden="true"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>
    <rect class="bx" x="10" y="40" width="180" height="96"/><text x="28" y="72">${ko ? "AI 도구" : "AI tools"}</text><text class="sm" x="28" y="96">Claude Code · n8n</text><text class="sm" x="28" y="114">${ko ? "작업마다 기록 전송" : "a record per action"}</text>
    <rect class="bx alt" x="260" y="40" width="200" height="96"/><text class="inv" x="278" y="72">${ko ? "이벤트 브리지" : "Event bridge"}</text><text class="inv sm" x="278" y="96">POST /api/bridge/events</text><text class="inv sm" x="278" y="114">${ko ? "토큰 확인 · 비밀값 가림" : "token check · redaction"}</text>
    <rect class="bx" x="530" y="40" width="170" height="96"/><text x="548" y="72">${ko ? "저장소" : "Storage"}</text><text class="sm" x="548" y="96">Supabase · RLS</text><text class="sm" x="548" y="114">${ko ? "공개 접근 없음" : "no public access"}</text>
    <rect class="bx" x="770" y="40" width="180" height="96"/><text x="788" y="72">${ko ? "관제 화면" : "Monitoring view"}</text><text class="sm" x="788" y="96">GET /api/bridge/feed</text><text class="sm" x="788" y="114">${ko ? "접근 코드 필요" : "access code required"}</text>
    <path class="ln" d="M190 88H254"/><path class="ln" d="M460 88H524"/><path class="ln" d="M700 88H764"/>
    <rect class="gate" x="852" y="152" width="10" height="10" transform="rotate(45 857 157)"/><text x="878" y="162">${ko ? "사람의 승인" : "Human approval"}</text>
    <path class="ln dash" d="M860 140V150"/>
    <rect class="bx soft" x="10" y="200" width="940" height="76"/><text x="28" y="232">${ko ? "공개 시연 (Studio Demo)" : "Public demo (Studio Demo)"}</text><text class="sm" x="28" y="256">${ko ? "브라우저 안의 가상 각본 · 서버·키·실제 기록과 분리 · 화면에 ‘시뮬레이션’ 표기" : "simulated scripts in the browser · separate from servers, keys and real records · labelled as simulated"}</text>
  </svg></div>
</div></section>` });
};

pages.about = (lang) => {
  const ko = lang === "ko";
  const PR = ko ? [["기술은 운영을 위해 존재합니다", "새로운 기술 자체보다, 그 기술이 매일의 업무를 실제로 얼마나 바꾸는지를 기준으로 판단합니다."], ["지능은 검증될 때 쓸모가 있습니다", "AI가 ‘완료했다’고 말하는 것과 실제로 작동하는 것을 구분합니다. 실행하지 않은 검사는 미검증으로 남깁니다."], ["자동화에도 책임자가 있어야 합니다", "모든 자동화에는 멈추는 지점, 확인하는 사람, 되돌리는 방법이 정해져 있어야 합니다."], ["설계가 곧 실행의 구조입니다", "화면과 문장, 데이터 구조와 승인 절차까지 하나의 설계로 다룹니다. 잘 설계된 업무는 설명이 짧아집니다."]]
    : [["Technology serves operations", "We judge technology by how much it actually changes everyday work, not by how new it is."], ["Intelligence is useful once verified", "We separate an AI saying it is done from something that actually works. A check that has not run stays unverified."], ["Every automation needs an owner", "Each automation needs a point where it stops, a person who checks it and a way to roll it back."], ["Design is the structure of execution", "Screens and sentences, data structures and approval steps are treated as one design. Well-designed work needs less explaining."]];
  return layout({ lang, page: "about", title: ko ? "회사 소개" : "About",
    desc: ko ? "아뜰리에 AX는 2026년 서울에서 출범한 AI 전환 스튜디오입니다. 복잡한 업무를 더 명확하고 통제 가능한 시스템으로 바꿉니다." : "Atelier AX is an AI transformation studio founded in Seoul in 2026. We turn complex work into clearer, controllable systems.",
    body: `<section class="page-head"><div class="wrap"><p class="eyebrow">${ko ? "회사 소개" : "About"}</p><h1 class="display">${ko ? "복잡한 업무를, 더 명확하고 통제할 수 있는 시스템으로." : "Complex work, made clear and controllable."}</h1>
  <p class="lede">${ko ? "아뜰리에 AX는 2026년 서울에서 개인사업자로 출범한 AI 전환 스튜디오입니다. ‘아뜰리에’라는 이름처럼, 고객마다 다른 업무를 직접 들여다보고 그에 맞는 시스템을 정밀하게 만듭니다. 큰 조직을 흉내 내기보다, 작은 스튜디오의 밀도와 실행력으로 일합니다." : "Atelier AX is an AI transformation studio founded in Seoul in 2026 as a sole proprietorship. As the name suggests, we look closely at each client's work and build a system that fits it precisely — working with the focus and execution of a small studio rather than imitating a large firm."}</p></div></section>
<div class="wrap">
  <section class="detail" aria-labelledby="h-mission"><header><span class="num">${ko ? "미션" : "Mission"}</span><h2 class="h2" id="h-mission">${ko ? "복잡한 업무를 더 명확하고 통제 가능한 시스템으로 바꿉니다." : "Turn complex work into clearer, controllable systems."}</h2></header>
    <div class="content"><p class="body">${ko ? "업무가 복잡해지는 이유는 대개 일의 양보다 흐름이 보이지 않기 때문입니다. 우리는 흐름을 드러내고, 사람과 AI가 맡을 일을 나누고, 그 결과를 확인할 수 있게 만듭니다." : "Work usually becomes complex not because there is too much of it, but because its flow cannot be seen. We make the flow visible, divide it between people and AI, and make the results checkable."}</p></div></section>
  <section class="detail" aria-labelledby="h-vision"><header><span class="num">${ko ? "비전" : "Vision"}</span><h2 class="h2" id="h-vision">${ko ? "AI가 조직의 생산성과 의사결정에 꾸준히 기여하는 실행 환경." : "An environment where AI contributes lastingly to productivity and decisions."}</h2></header>
    <div class="content"><p class="body">${ko ? "한 번의 시연으로 끝나는 AI가 아니라, 매일의 업무 안에서 기록되고 검증되며 개선되는 AI를 목표로 합니다." : "Not AI that ends with a single demo, but AI that is recorded, verified and improved inside everyday work."}</p></div></section>
</div>
<section class="sec" aria-labelledby="h-pr"><div class="wrap"><div class="sec-head"><div><p class="eyebrow">${ko ? "원칙" : "Principles"}</p><h2 class="h2" id="h-pr">${ko ? "일하는 방식을 정하는 네 가지 원칙" : "Four principles behind how we work"}</h2></div></div>
  <ol class="principles">${PR.map(([h, b], i) => `<li><span class="num">0${i + 1}</span><h3 class="h3">${h}</h3><p>${b}</p></li>`).join("")}</ol></div></section>
<section class="sec paper" aria-labelledby="h-biz"><div class="wrap split"><div class="l"><p class="eyebrow">${ko ? "사업자 정보" : "Business information"}</p><h2 class="h2" id="h-biz">${ko ? "확인된 정보만 적습니다" : "Only confirmed information"}</h2></div>
  <dl class="facts r"><div><dt>${ko ? "상호" : "Name"}</dt><dd>${ORG.nameKo} (${ORG.nameEn})</dd></div><div><dt>${ko ? "형태" : "Type"}</dt><dd>${ko ? "개인사업자 · 2026년 사업자등록" : "Sole proprietorship · registered 2026"}</dd></div><div><dt>${ko ? "소재지" : "Location"}</dt><dd>${ko ? "서울" : "Seoul, Korea"}</dd></div><div><dt>${ko ? "브랜드 구분" : "Brand scope"}</dt><dd>${ko ? "이 사이트는 회사의 공식 사이트입니다. 대표의 개인 포트폴리오는 별도로 운영되며, 개인 프로젝트는 ‘작업’ 페이지에서 회사 실적과 구분해 표시합니다." : "This is the company's official site. The founder's personal portfolio is separate, and personal projects are labelled apart from company work on the Work page."}</dd></div></dl>
</div></section>` });
};

pages.contact = (lang) => {
  const ko = lang === "ko";
  const svc = SERVICES.map((s) => [s.id, svcName(s, lang)]).concat([["unsure", ko ? "아직 모르겠음" : "Not sure yet"]]);
  const stages = ko ? [["explore", "알아보는 중"], ["defined", "해결할 과제가 정해짐"], ["budgeted", "예산·일정이 정해짐"], ["running", "이미 운영 중인 시스템 개선"]] : [["explore", "Exploring"], ["defined", "Problem defined"], ["budgeted", "Budget and timeline set"], ["running", "Improving a running system"]];
  return layout({ lang, page: "contact", title: ko ? "상담 문의" : "Contact",
    desc: ko ? "아뜰리에 AX에 AI 전환, 업무 자동화, AI 소프트웨어 개발 상담을 문의하세요." : "Contact Atelier AX about AI transformation, workflow automation or AI software development.",
    body: `<section class="page-head"><div class="wrap"><p class="eyebrow">${ko ? "상담 문의" : "Contact"}</p><h1 class="display">${ko ? "바꾸고 싶은 업무를 알려 주세요." : "Tell us about the work you want to change."}</h1>
  <p class="lede">${ko ? "정리된 기획서가 없어도 괜찮습니다. 지금 어떻게 일하고 있는지, 무엇이 불편한지만 적어 주시면 내용을 확인한 뒤 회신드립니다." : "No formal brief is needed. Tell us how the work is done today and what gets in the way; we will reply once we have read it."}</p></div></section>
<section class="sec flush"><div class="wrap split">
  <form class="form cform" id="contact" novalidate data-lang="${lang}">
    <div class="field"><label for="f-name">${ko ? "성명" : "Name"}</label><input id="f-name" name="name" autocomplete="name" required maxlength="60"><p class="err" id="e-name"></p></div>
    <div class="field"><label for="f-company">${ko ? "소속 또는 기업명" : "Organisation"}<span class="opt">${ko ? "선택" : "optional"}</span></label><input id="f-company" name="company" autocomplete="organization" maxlength="100"><p class="err"></p></div>
    <div class="field full"><label for="f-email">${ko ? "업무용 이메일" : "Work email"}</label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="200" inputmode="email"><p class="err" id="e-email"></p></div>
    <fieldset class="field full"><legend>${ko ? "관심 서비스" : "Service of interest"}</legend><div class="chips">${svc.map(([v, n], i) => `<label><input type="radio" name="service" value="${v}"${i === svc.length - 1 ? " checked" : ""}>${n}</label>`).join("")}</div></fieldset>
    <div class="field full"><label for="f-message">${ko ? "해결하고 싶은 문제" : "What you want to solve"}</label><textarea id="f-message" name="message" required minlength="10" maxlength="4000" placeholder="${ko ? "예: 매주 지점별 자료를 손으로 모아 보고서를 만듭니다. 이 과정을 줄이고 싶습니다." : "e.g. Every week we compile branch data by hand into a report and would like to cut that down."}"></textarea><p class="err" id="e-message"></p></div>
    <div class="field full"><label for="f-stage">${ko ? "예상 프로젝트 단계" : "Project stage"}</label><select id="f-stage" name="stage">${stages.map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}</select></div>
    <div class="hp" aria-hidden="true"><label for="f-website">Website</label><input id="f-website" name="website" tabindex="-1" autocomplete="off"></div>
    <div class="consent-box"><p><b>${ko ? "개인정보 수집·이용 안내" : "Personal data notice"}</b></p><p>${ko ? "수집 항목: 성명, 소속(선택), 업무용 이메일, 문의 내용 · 목적: 문의 확인과 회신 · 보유 기간: 문의 처리 완료 후 1년, 이후 파기. 동의하지 않으실 수 있으나 이 경우 양식으로 문의를 받을 수 없습니다." : "Collected: name, organisation (optional), work email, your message · Purpose: reviewing and replying to your enquiry · Retention: one year after the enquiry is closed, then deleted. You may decline, but the form cannot be sent without consent."} <a href="${path(lang, "privacy")}">${ko ? "개인정보처리방침" : "Privacy policy"}</a></p></div>
    <label class="consent"><input type="checkbox" name="consent" id="f-consent" required><span>${ko ? "위 개인정보 수집·이용에 동의합니다." : "I agree to the collection and use of my personal data as described."}</span></label><p class="err" id="e-consent" style="grid-column:1/-1;margin-top:-14px"></p>
    <input type="hidden" name="t" id="f-t">
    <div class="submit-row"><button class="btn solid" type="submit" id="f-submit">${ko ? "문의 보내기" : "Send enquiry"} ${ARR}</button><p class="result" id="f-result" role="status" aria-live="polite"></p></div>
  </form>
  <aside class="contact-side cside"><dl class="facts"><div><dt>${ko ? "회신" : "Reply"}</dt><dd>${ko ? "내용을 확인한 뒤 남겨 주신 이메일로 회신드립니다." : "We reply to the email you provide once we have reviewed your message."}</dd></div><div><dt>${ko ? "언어" : "Languages"}</dt><dd>${ko ? "한국어, 영어" : "Korean, English"}</dd></div><div><dt>${ko ? "소재지" : "Location"}</dt><dd>${ko ? "서울" : "Seoul, Korea"}</dd></div></dl>
  <p class="note">${ko ? "기밀 자료나 고객 개인정보는 첫 문의에 포함하지 마세요. 필요하면 범위를 정한 뒤 안전한 방법으로 따로 받습니다." : "Please do not include confidential documents or customers' personal data in a first enquiry. If needed, we arrange a secure channel once the scope is agreed."}</p></aside>
</div></section>` });
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
    body: `<section class="page-head"><div class="wrap"><p class="eyebrow">${ko ? "안내" : "Legal"}</p><h1 class="display">${ko ? "개인정보처리방침" : "Privacy policy"}</h1></div></section><section class="sec flush"><div class="wrap"><div class="prose">${body}</div></div></section>` });
};

const nf = layout({ lang: "ko", page: "", title: "페이지를 찾을 수 없습니다 — 아뜰리에 AX", desc: "요청한 페이지를 찾을 수 없습니다.", noindex: true,
  body: `<section class="nf"><div class="wrap"><p class="eyebrow">404</p><h1 class="display">찾는 페이지가 없습니다.</h1><p class="lede">주소가 바뀌었거나 삭제된 페이지입니다. <span lang="en">The page you requested does not exist.</span></p><div class="hero"><div class="ctas" style="margin-top:0"><a class="btn solid" href="/">홈으로 ${ARR}</a><a class="btn" href="/en/" lang="en">English home</a></div></div></div></section>` });

// ── 쓰기 ──
const out = (rel, html) => { const f = join(ROOT, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html); return rel; };
const written = [];
for (const lang of ["ko", "en"]) for (const [name, fn] of Object.entries(pages)) {
  const p = name === "home" ? "" : name;
  written.push(out((lang === "en" ? "en/" : "") + (p ? `${p}/` : "") + "index.html", fn(lang)));
}
written.push(out("404.html", nf));
const urls = ["", "services", "work", "lab", "about", "contact", "privacy"];
written.push(out("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.flatMap((u) => ["ko", "en"].map((l) => `  <url><loc>${ORG.url + path(l, u)}</loc><xhtml:link rel="alternate" hreflang="ko" href="${ORG.url + path("ko", u)}"/><xhtml:link rel="alternate" hreflang="en" href="${ORG.url + path("en", u)}"/></url>`)).join("\n")}
</urlset>
`));
written.push(out("robots.txt", `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /studio/\nDisallow: /console/\n\nSitemap: ${ORG.url}/sitemap.xml\n`));
if (process.argv.includes("--list")) console.log(written.join("\n"));
export { pages, written };
