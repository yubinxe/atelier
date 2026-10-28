// POST /api/bridge/events — AI 도구가 작업 이벤트를 보낸다. Authorization: Bearer <BRIDGE_TOKEN>. 한 건 또는 배열(최대 50).
import { bridgeStatus, senderOk, normEvent, insertEvents } from "../_lib/bridge.js";
import { json, rateLimited } from "../_lib/studio.js";

export async function POST(req) {
  const st = bridgeStatus(); if (!st.bridge) return json({ error: st.bridgeReason }, 503);
  if (!senderOk(req)) return json({ error: "토큰이 맞지 않습니다" }, 401);
  if (rateLimited("bridge:" + (req.headers.get("x-forwarded-for") || ""), 600)) return json({ error: "요청이 많습니다" }, 429);
  let b; try { b = await req.json(); } catch { return json({ error: "JSON 이 아닙니다" }, 400); }
  const rows = (Array.isArray(b) ? b : [b]).slice(0, 50).map((e) => normEvent(e)).filter(Boolean);
  if (!rows.length) return json({ error: "session 이 있는 이벤트가 없습니다" }, 400);
  try { await insertEvents(rows); return json({ ok: true, saved: rows.length }); }
  catch (e) { return json({ error: e.message }, 502); }
}
