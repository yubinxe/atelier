// GET /api/studio/health — 실제 실행·작업 브리지가 켜져 있는지(키 값은 절대 내보내지 않는다)
import { liveStatus, json } from "../_lib/studio.js";
import { bridgeStatus } from "../_lib/bridge.js";
export function GET() { return json({ ...liveStatus(), ...bridgeStatus() }); }
