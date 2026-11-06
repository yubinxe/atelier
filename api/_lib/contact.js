// 상담 문의 — 입력 검증·스팸 차단·중복 방지 후 Supabase(atelier_leads)에 저장.
// 공개 키(publishable)로 넣기만 할 수 있다: 표에는 RLS 가 켜져 있고 anon 은 INSERT 만 허용(supabase/atelier_leads.sql). 읽기는 대시보드에서만.
import { createHash } from "node:crypto";

export const SUPA_URL = "https://zxjdrpkkxxpwamslquml.supabase.co";
export const SUPA_PUBLISHABLE = "sb_publishable_M6jbqwkgdHHfVMF71TGGWQ_cC0x7YgQ"; // 공개용 키(비밀 아님)
const SERVICES = ["strategy", "automation", "engineering", "governance", "unsure"], STAGES = ["explore", "defined", "budgeted", "running"];
const clip = (s, n) => String(s ?? "").replace(/\u0000/g, "").trim().slice(0, n);

// 결과: { ok:true, row } | { ok:false, status, field?, error }
export function validate(b, now = Date.now()) {
  if (!b || typeof b !== "object") return { ok: false, status: 400, error: "bad_request" };
  if (b.website) return { ok: false, status: 200, spam: true };                       // 숨은 칸이 채워짐 → 봇
  if (Number(b.elapsed) < 2500) return { ok: false, status: 200, spam: true };        // 2.5초 안에 제출 → 봇
  const name = clip(b.name, 60), email = clip(b.email, 200).toLowerCase(), message = clip(b.message, 4000);
  if (!name) return { ok: false, status: 422, field: "name", error: "name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, status: 422, field: "email", error: "email" };
  if (message.length < 10) return { ok: false, status: 422, field: "message", error: "message" };
  if (b.consent !== true) return { ok: false, status: 422, field: "consent", error: "consent" };
  if ((message.match(/https?:\/\//g) || []).length > 5) return { ok: false, status: 422, field: "message", error: "message" };
  const row = { name, company: clip(b.company, 100) || null, email, service: SERVICES.includes(b.service) ? b.service : "unsure", stage: STAGES.includes(b.stage) ? b.stage : "explore",
    message, locale: b.locale === "en" ? "en" : "ko", consent: true, fingerprint: createHash("sha256").update(email + "\n" + message).digest("hex") };
  return { ok: true, row };
}

export async function store(row, env = process.env, f = fetch) {
  const url = (env.SUPABASE_URL || SUPA_URL).replace(/\/$/, ""), key = env.SUPABASE_PUBLISHABLE_KEY || SUPA_PUBLISHABLE;
  const r = await f(`${url}/rest/v1/atelier_leads`, { method: "POST", headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", prefer: "return=minimal" }, body: JSON.stringify(row) });
  if (r.status === 201 || r.status === 204) return { saved: true };
  if (r.status === 409) return { saved: true, duplicate: true };
  const t = await r.text().catch(() => "");
  return { saved: false, status: r.status, missingTable: /PGRST205|schema cache/.test(t) };
}
