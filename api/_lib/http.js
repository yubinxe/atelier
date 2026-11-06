// 서버 함수 공용 — JSON 응답과 인스턴스당 간이 속도 제한(분당)
export const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const hits = new Map();
export function rateLimited(key, perMin = 30, now = Date.now()) {
  const w = (hits.get(key) || []).filter((t) => now - t < 60e3); w.push(now); hits.set(key, w);
  return w.length > perMin;
}
