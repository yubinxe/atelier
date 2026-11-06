import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { validate, store } from "../api/_lib/contact.js";
import { pages } from "../site/build.mjs"; // 불러오면 public/ 을 다시 쓴다 — 커밋된 결과와 같아야 한다

const P = (r) => "public/" + r;
const PAGES = ["", "services/", "work/", "lab/", "about/", "contact/", "privacy/"];
const files = PAGES.flatMap((p) => [p + "index.html", "en/" + p + "index.html"]);

test("기업 사이트: 모든 페이지에 lang·title·설명·h1 하나·canonical, ko/en 짝", () => {
  for (const f of files) {
    const h = readFileSync(P(f), "utf8"), en = f.startsWith("en/");
    assert.match(h, new RegExp(`<html lang="${en ? "en" : "ko"}"`), f);
    assert.match(h, /<title>[^<]{4,}<\/title>/, f); assert.match(h, /<meta name="description" content="[^"]{20,}">/, f);
    assert.equal((h.match(/<h1[ >]/g) || []).length, 1, f + " h1");
    assert.match(h, /rel="canonical"/, f); assert.match(h, /hreflang="ko"/, f); assert.match(h, /hreflang="en"/, f);
    assert.doesNotMatch(h, /undefined|\[object Object\]|NaN/, f);
  }
  assert.ok(Object.keys(pages).length === PAGES.length);
});

test("기업 사이트: 내부 링크가 모두 실제 파일로 이어진다", () => {
  const bad = [];
  for (const f of files.concat(["404.html"])) {
    const h = readFileSync(P(f), "utf8");
    for (const [, href] of h.matchAll(/href="(\/[^"#?]*)/g)) {
      if (href.startsWith("/_next/") || href.startsWith("/assets/")) { if (!existsSync(P(href.slice(1)))) bad.push(f + " → " + href); continue; }
      const t = href.endsWith("/") ? href.slice(1) + "index.html" : href.slice(1);
      if (!existsSync(P(t))) bad.push(f + " → " + href);
    }
  }
  assert.deepEqual(bad, []);
});

test("기업 사이트: 확인되지 않은 실적·가격·후기 표현이 없다", () => {
  const all = files.map((f) => readFileSync(P(f), "utf8")).join("\n");
  for (const re of [/고객사\s*\d|\d+\s*개\s*기업|\d+%\s*(절감|증가|향상)|만원|₩\s*\d|\$\s*\d|\d+\s*(clients|customers)|award-winning|수상 경력/i]) assert.doesNotMatch(all, re);
  assert.match(readFileSync(P("work/index.html"), "utf8"), /비공개/);
  assert.match(readFileSync(P("index.html"), "utf8"), /법률 자문이나 법률 사무를 제공하지 않으며/);
});

test("Studio Demo·관제 콘솔 보존, 색인 정책 분리", () => {
  for (const f of ["studio/index.html", "studio/app.js", "studio/sim.js", "console/index.html", "missions/index.html"]) assert.ok(existsSync(P(f)), f);
  assert.match(readFileSync(P("studio/index.html"), "utf8"), /noindex/);
  const robots = readFileSync(P("robots.txt"), "utf8"); assert.match(robots, /Disallow: \/studio\//); assert.match(robots, /Sitemap:/);
  const v = JSON.parse(readFileSync("vercel.json", "utf8")); assert.ok(v.redirects.some((r) => r.source === "/demo" && r.destination === "/studio/"));
});

test("상담 문의: 검증·스팸 차단·중복 방지", async () => {
  const ok = { name: "홍길동", email: "Ops@Example.com", message: "매주 보고서를 손으로 만듭니다.", consent: true, elapsed: 9000, service: "automation", stage: "defined" };
  const v = validate(ok); assert.equal(v.ok, true); assert.equal(v.row.email, "ops@example.com"); assert.equal(v.row.fingerprint.length, 64);
  assert.equal(validate({ ...ok, website: "x" }).spam, true);
  assert.equal(validate({ ...ok, elapsed: 500 }).spam, true);
  assert.equal(validate({ ...ok, email: "nope" }).field, "email");
  assert.equal(validate({ ...ok, consent: false }).field, "consent");
  assert.equal(validate({ ...ok, message: "짧음" }).field, "message");
  assert.equal(validate({ ...ok, service: "hack" }).row.service, "unsure");
  const calls = [], f = async (url, init) => { calls.push([url, init]); return new Response(null, { status: calls.length === 1 ? 201 : 409 }); };
  assert.deepEqual(await store(v.row, {}, f), { saved: true });
  assert.deepEqual(await store(v.row, {}, f), { saved: true, duplicate: true });
  assert.match(calls[0][0], /\/rest\/v1\/atelier_leads$/); assert.equal(calls[0][1].headers.prefer, "return=minimal");
  const miss = await store(v.row, {}, async () => new Response('{"code":"PGRST205"}', { status: 404 })); assert.equal(miss.saved, false); assert.equal(miss.missingTable, true);
});
