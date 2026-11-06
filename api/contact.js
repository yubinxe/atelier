// POST /api/contact — 상담 문의 접수
import { validate, store } from "./_lib/contact.js";
import { json, rateLimited } from "./_lib/http.js";

export async function POST(req) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  if (rateLimited("contact:" + ip, 5)) return json({ ok: false, error: "rate_limited" }, 429);
  if (!/application\/json/.test(req.headers.get("content-type") || "")) return json({ ok: false, error: "bad_request" }, 415);
  let b; try { b = await req.json(); } catch { return json({ ok: false, error: "bad_request" }, 400); }
  const v = validate(b);
  if (v.spam) return json({ ok: true }); // 봇에게는 성공처럼 보이게, 저장은 하지 않음
  if (!v.ok) return json({ ok: false, error: v.error, field: v.field }, v.status);
  try {
    const s = await store(v.row);
    if (s.saved) return json({ ok: true, duplicate: !!s.duplicate });
    console.error("contact store failed", s.status, s.missingTable ? "missing table atelier_leads" : "");
    return json({ ok: false, error: "unavailable" }, 503);
  } catch (e) { console.error("contact store error", e?.message); return json({ ok: false, error: "unavailable" }, 503); }
}
