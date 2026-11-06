// POST /api/studio/plan — 아이디어 → 설계도(구조화 출력)
import Anthropic from "@anthropic-ai/sdk";
import { liveStatus, checkCode, rateLimited, json, planPrompt, cleanPlan, PLAN_SCHEMA, client, baseReq } from "../_lib/studio.js";

export async function POST(req) {
  const st = liveStatus(); if (!st.live) return json({ error: st.reason }, 503);
  if (!checkCode(req)) return json({ error: "접근 코드가 맞지 않습니다" }, 401);
  if (rateLimited("plan:" + (req.headers.get("x-forwarded-for") || ""), 6)) return json({ error: "요청이 많습니다. 1분 뒤 다시 시도하세요" }, 429);
  let b; try { b = await req.json(); } catch { return json({ error: "잘못된 요청" }, 400); }
  const idea = String(b?.idea || "").trim();
  if (idea.length < 6 || idea.length > 400) return json({ error: "아이디어는 6~400자" }, 400);
  const p = planPrompt(idea, b.category);
  try {
    const stream = client().beta.messages.stream({ ...baseReq("medium", 16000), system: p.system, messages: [{ role: "user", content: p.user }],
      output_config: { effort: "medium", format: { type: "json_schema", schema: PLAN_SCHEMA } } });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") return json({ error: "모델이 이 요청을 거절했습니다" }, 422);
    const text = msg.content.filter((c) => c.type === "text").map((c) => c.text).join("");
    return json({ plan: cleanPlan(JSON.parse(text)), model: msg.model, usage: { in: msg.usage.input_tokens, out: msg.usage.output_tokens } });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: "AI 사용량 한도 — 잠시 뒤 다시" }, 429);
    if (e instanceof Anthropic.APIError) return json({ error: `AI 호출 실패 (${e.status})` }, 502);
    return json({ error: "설계도를 만들지 못했습니다: " + String(e.message || e).slice(0, 120) }, 502);
  }
}
