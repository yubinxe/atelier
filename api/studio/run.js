// POST /api/studio/run — 작업 하나를 실제로 실행하고 진행을 SSE 로 흘려보낸다.
// 이벤트: {t:"start",model} · {t:"delta",text} · {t:"done",outcome,summary,note,usage,model} · {t:"error",error}
import Anthropic from "@anthropic-ai/sdk";
import { liveStatus, checkCode, rateLimited, json, runPrompt, parseRun, client, baseReq } from "../_lib/studio.js";

export async function POST(req) {
  const st = liveStatus(); if (!st.live) return json({ error: st.reason }, 503);
  if (!checkCode(req)) return json({ error: "접근 코드가 맞지 않습니다" }, 401);
  if (rateLimited("run:" + (req.headers.get("x-forwarded-for") || ""), 30)) return json({ error: "요청이 많습니다. 1분 뒤 다시 시도하세요" }, 429);
  let b; try { b = await req.json(); } catch { return json({ error: "잘못된 요청" }, 400); }
  if (!b?.task?.title) return json({ error: "작업 정보가 없습니다" }, 400);
  const p = runPrompt(b), check = !!b.task.check, enc = new TextEncoder();
  const body = new ReadableStream({
    async start(ctrl) {
      const send = (o) => ctrl.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`));
      let text = "";
      try {
        const stream = client().beta.messages.stream({ ...baseReq("low", 4000), system: p.system, messages: [{ role: "user", content: p.user }] }, { signal: req.signal });
        send({ t: "start", model: st.model });
        for await (const ev of stream) if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") { text += ev.delta.text; send({ t: "delta", text: ev.delta.text }); }
        const msg = await stream.finalMessage();
        if (msg.stop_reason === "refusal") send({ t: "error", error: "모델이 이 작업을 거절했습니다" });
        else send({ t: "done", ...parseRun(text, check), model: msg.model, truncated: msg.stop_reason === "max_tokens", usage: { in: msg.usage.input_tokens, out: msg.usage.output_tokens } });
      } catch (e) {
        send({ t: "error", error: e instanceof Anthropic.RateLimitError ? "AI 사용량 한도 — 잠시 뒤 다시" : e instanceof Anthropic.APIError ? `AI 호출 실패 (${e.status})` : "실행 중단" });
      }
      ctrl.close();
    },
  });
  return new Response(body, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}
