// GET /api/studio/health — 실제 실행이 켜져 있는지(키 값은 절대 내보내지 않는다)
import { liveStatus, json } from "../_lib/studio.js";
export function GET() { return json(liveStatus()); }
