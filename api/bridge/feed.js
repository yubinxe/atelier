// GET /api/bridge/feed — 최근 24시간 AI 작업(보기 전용). x-studio-code: <STUDIO_ACCESS_CODE>.
import { bridgeStatus, viewerOk, recentEvents, sessions } from "../_lib/bridge.js";
import { json } from "../_lib/studio.js";

export async function GET(req) {
  const st = bridgeStatus(); if (!st.bridge) return json({ bridge: false, error: st.bridgeReason }, 503);
  if (!viewerOk(req)) return json({ error: "접근 코드가 맞지 않습니다" }, 401);
  try { const events = await recentEvents(); return json({ bridge: true, now: new Date().toISOString(), sessions: sessions(events), events }); }
  catch (e) { return json({ error: e.message }, 502); }
}
