// Atelier AX · AI 라운지(3D) — 고층 라운지에서 AI 들이 자리에 앉아 일하고, 하는 일에 따라 자료실·실행실·검사대·승인 데스크로 오간다.
// 데이터는 모델하우스와 같은 시뮬레이션 이벤트(가상). three.js 로 그리며 `npm run build:lounge` 가 public/studio/lounge.bundle.js 로 묶는다.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Fog, Group, Mesh, Vector3, CanvasTexture, SRGBColorSpace, RepeatWrapping,
  ACESFilmicToneMapping, HemisphereLight, AmbientLight, DirectionalLight, PointLight,
  BoxGeometry, PlaneGeometry, CircleGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, CapsuleGeometry, RingGeometry,
  MeshStandardMaterial, MeshBasicMaterial, AdditiveBlending, DoubleSide,
} from "three";

// 결정적 난수(같은 도시 야경)
const rng = (s) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

// ── 레이아웃 ──
const DESK_X = [-8, -4.6, 1.4, 4.8], DESK_Z = [-2.5, 1.5, 5.5], AISLE_X = -1.6;
const DESKS = DESK_Z.flatMap((z, r) => DESK_X.map((x, c) => ({ n: r * 4 + c + 1, x, z })));
const STATIONS = {
  library: { x: -12.6, z: 8.2, face: Math.PI / 2 }, server: { x: 10.4, z: -6.4, face: -Math.PI / 2 },
  qa: { x: 10.4, z: 3.9, face: -Math.PI / 2 }, approve: { x: 0, z: -6.2, face: 0 }, lounge: { x: -11.4, z: -5.6, face: Math.PI / 2 },
};
const KIND_TO = { read: "library", search: "library", web: "library", run: "server", tool: "server", agent: "server", test: "qa", wait: "lounge", done: "approve" };
const HOME = { "claude-code": 6, gemini: 7, make: 2, openai: 11 };
const COLOR = { blue: 0x3d6bff, yellow: 0xe8b23a, green: 0x2fa36b, red: 0xe5584a, ink: 0x8892a6 };
const laneZ = (z) => z + 1.45;

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); draw(g, w, h);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
// 한강 야경 — 하늘·산 능선·빌딩 불빛·강 반사
function cityTexture(seed) {
  return canvasTex(2048, 640, (g, w, h) => {
    const r = rng(seed), sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#060a18"); sky.addColorStop(0.55, "#121a38"); sky.addColorStop(0.72, "#2a2140"); sky.addColorStop(1, "#0b0f1d");
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${0.15 + r() * 0.5})`; g.fillRect(r() * w, r() * h * 0.45, 1.4, 1.4); }
    g.fillStyle = "#0a0e1c"; g.beginPath(); g.moveTo(0, h * 0.5);
    for (let x = 0; x <= w; x += 40) g.lineTo(x, h * (0.42 + 0.08 * Math.sin(x / 210) + r() * 0.03)); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    for (let x = 0; x < w;) {
      const bw = 18 + r() * 46, bh = h * (0.08 + r() * 0.28), y = h * 0.74 - bh;
      g.fillStyle = `rgb(${12 + r() * 10},${16 + r() * 12},${30 + r() * 18})`; g.fillRect(x, y, bw, bh + h * 0.06);
      for (let wy = y + 5; wy < h * 0.79; wy += 7) for (let wx = x + 3; wx < x + bw - 3; wx += 6) if (r() < 0.38) { const k = r(); g.fillStyle = k < 0.7 ? `rgba(255,${200 + r() * 40},${120 + r() * 60},${0.55 + r() * 0.45})` : `rgba(170,200,255,${0.5 + r() * 0.4})`; g.fillRect(wx, wy, 2.4, 2.6); }
      if (bh > h * 0.28 && r() < 0.6) { g.fillStyle = "#ff3b30"; g.fillRect(x + bw / 2, y - 3, 2.5, 2.5); }
      x += bw + r() * 6;
    }
    const river = g.createLinearGradient(0, h * 0.8, 0, h); river.addColorStop(0, "#0d1530"); river.addColorStop(1, "#05070f"); g.fillStyle = river; g.fillRect(0, h * 0.8, w, h * 0.2);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,${190 + r() * 50},${110 + r() * 60},${0.15 + r() * 0.35})`; g.fillRect(r() * w, h * (0.81 + r() * 0.17), 8 + r() * 26, 1.2); }
    g.strokeStyle = "rgba(255,220,160,.55)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h * 0.795); g.lineTo(w, h * 0.785); g.stroke();
  });
}
const woodTexture = () => canvasTex(512, 512, (g, w, h) => {
  const r = rng(7); g.fillStyle = "#3a1c14"; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 ? -60 : 0; x < w; x += 180) { const l = 30 + r() * 22; g.fillStyle = `rgb(${l + 20},${l * 0.42},${l * 0.3})`; g.fillRect(x + 1, y + 1, 178, 30); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x, y, 180, 1); }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,220,200,${r() * 0.04})`; g.fillRect(r() * w, r() * h, 40 + r() * 80, 1); }
}, [10, 7]);
const numTexture = (n) => canvasTex(128, 64, (g, w, h) => { g.fillStyle = "#1f2227"; g.fillRect(0, 0, w, h); g.fillStyle = "#e9e4d8"; g.font = "700 38px Pretendard, system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(n).padStart(2, "0"), w / 2, h / 2 + 2); });
const signTexture = (text) => canvasTex(512, 96, (g, w, h) => { g.fillStyle = "#14161c"; g.fillRect(0, 0, w, h); g.fillStyle = "#e9e4d8"; g.font = "600 40px Pretendard, system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 2); });

export function mountLounge(el, opt = {}) {
  const L = opt.labels || {}, reduce = !!opt.reduce;
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; renderer.outputColorSpace = SRGBColorSpace;
  el.append(renderer.domElement); renderer.domElement.setAttribute("aria-hidden", "true");
  const overlay = document.createElement("div"); overlay.className = "lg-labels"; el.append(overlay);

  const scene = new Scene(); scene.background = new Color(0x070b16); scene.fog = new Fog(0x070b16, 30, 60);
  const camera = new PerspectiveCamera(42, 1, 0.1, 200);
  scene.add(new HemisphereLight(0x4a5a8a, 0x2a160e, 0.9), new AmbientLight(0x404660, 0.35));
  const moon = new DirectionalLight(0x9db4ff, 0.55); moon.position.set(-8, 14, -12); scene.add(moon);
  for (const [x, z] of [[-6.3, -0.5], [-6.3, 4.5], [3.1, -0.5], [3.1, 4.5], [0, -7], [11, 2]]) { const p = new PointLight(0xffc98a, 14, 10, 1.6); p.position.set(x, 3.2, z); scene.add(p); }

  const M = {
    wood: new MeshStandardMaterial({ color: 0x6b4630, roughness: 0.55 }), panel: new MeshStandardMaterial({ color: 0xb3a892, roughness: 0.9 }),
    dark: new MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.7 }), metal: new MeshStandardMaterial({ color: 0x2b2f38, metalness: 0.6, roughness: 0.4 }),
    shade: new MeshStandardMaterial({ color: 0xf3e1c0, emissive: 0xffcc88, emissiveIntensity: 0.9, side: DoubleSide }),
    rug: new MeshStandardMaterial({ color: 0x2b2d33, roughness: 1 }), white: new MeshStandardMaterial({ color: 0xf1efe9, roughness: 0.6 }),
    eye: new MeshBasicMaterial({ color: 0x111111 }), pool: new MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.18, blending: AdditiveBlending, depthWrite: false }),
  };
  const box = (w, h, d, m, x, y, z, parent = scene) => { const o = new Mesh(new BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };

  // 바닥·러그·천장·보·조명
  const floor = new Mesh(new PlaneGeometry(34, 24), new MeshStandardMaterial({ map: woodTexture(), roughness: 0.42, metalness: 0.05 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  for (const [x, z, w, d] of [[-6.3, 1.5, 9, 12.5], [3.1, 1.5, 9, 12.5]]) { const r = new Mesh(new PlaneGeometry(w, d), M.rug); r.rotation.x = -Math.PI / 2; r.position.set(x, 0.01, z); scene.add(r); }
  const ceil = new Mesh(new PlaneGeometry(34, 24), new MeshStandardMaterial({ color: 0x15161a, roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 7.2; const roof = new Group(); scene.add(roof); roof.add(ceil);
  const beamM = new MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.8 });
  for (let z = -10; z <= 10; z += 2.4) box(32, 0.25, 0.5, beamM, 0, 7.0, z, roof);
  const dl = new MeshBasicMaterial({ color: 0xfff2dd });
  for (let x = -12; x <= 12; x += 6) for (let z = -8.8; z <= 9; z += 4.8) { const c = new Mesh(new CircleGeometry(0.16, 16), dl); c.rotation.x = Math.PI / 2; c.position.set(x, 6.85, z); roof.add(c); }

  // 통유리 창과 야경
  const glassBack = new Mesh(new PlaneGeometry(32, 7), new MeshBasicMaterial({ map: cityTexture(11) })); glassBack.position.set(0, 3.55, -11.8); scene.add(glassBack);
  const glassLeft = new Mesh(new PlaneGeometry(24, 7), new MeshBasicMaterial({ map: cityTexture(29) })); glassLeft.rotation.y = Math.PI / 2; glassLeft.position.set(-16, 3.55, 0); scene.add(glassLeft);
  for (let x = -16; x <= 16; x += 3.2) box(0.12, 7, 0.12, M.dark, x, 3.5, -11.7);
  for (let z = -11.8; z <= 12; z += 3.2) box(0.12, 7, 0.12, M.dark, -15.9, 3.5, z);
  box(32, 0.18, 0.3, M.dark, 0, 0.09, -11.65); box(0.3, 0.18, 24, M.dark, -15.85, 0.09, 0);
  const wallM = new MeshStandardMaterial({ color: 0x17191f, roughness: 0.9 }); box(0.3, 7.2, 24, wallM, 16.1, 3.6, 0);

  // 큰 화면 — 집중 시간·완료·복구(시뮬 시각)
  const screenCanvas = document.createElement("canvas"); screenCanvas.width = 1024; screenCanvas.height = 560;
  const screenTex = new CanvasTexture(screenCanvas); screenTex.colorSpace = SRGBColorSpace;
  const screen = new Mesh(new PlaneGeometry(6.6, 3.6), new MeshBasicMaterial({ map: screenTex })); screen.rotation.y = -Math.PI / 2; screen.position.set(15.9, 3.5, -3.2); scene.add(screen);
  box(0.2, 3.9, 6.9, M.dark, 16.0, 3.5, -3.2);
  let screenKey = "";
  const drawScreen = (clock, stats) => {
    const key = clock + JSON.stringify(stats); if (key === screenKey) return; screenKey = key;
    const g = screenCanvas.getContext("2d"), w = 1024, h = 560; g.fillStyle = "#120d10"; g.fillRect(0, 0, w, h);
    const glow = g.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, 520); glow.addColorStop(0, "rgba(255,80,80,.10)"); glow.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = glow; g.fillRect(0, 0, w, h);
    g.fillStyle = "#ff5a52"; g.beginPath(); g.arc(78, 70, 11, 0, 7); g.fill(); g.fillStyle = "#f2e6e3"; g.font = "600 34px Pretendard, system-ui, sans-serif"; g.fillText(L.focus || "집중 시간", 102, 82);
    g.fillStyle = "#fde9e6"; g.font = "700 210px Pretendard, system-ui, sans-serif"; g.textAlign = "center"; g.fillText(clock.slice(0, 5), w / 2, 310); g.textAlign = "left";
    g.fillStyle = "#3a2328"; g.fillRect(70, 360, w - 140, 10); g.fillStyle = "#ff5a52"; g.fillRect(70, 360, (w - 140) * ((Number(clock.slice(6, 8)) || 0) / 60), 10);
    g.fillStyle = "#c9b3ae"; g.font = "500 32px Pretendard, system-ui, sans-serif";
    g.fillText(`${L.done || "완료"} ${stats.done}   ·   ${L.recover || "실패 → 복구"} ${stats.fails} → ${stats.recovered}`, 70, 440);
    g.fillStyle = "#8d7b77"; g.font = "500 26px Pretendard, system-ui, sans-serif"; g.fillText(L.sim || "시뮬레이션 · 가상 데이터", 70, 500);
    screenTex.needsUpdate = true;
  };

  // 책상 12개 — 칸막이·스탠드·번호판·의자
  const deskGroup = new Group(); scene.add(deskGroup);
  const lampGeo = new ConeGeometry(0.22, 0.22, 20, 1, true), poolGeo = new CircleGeometry(0.7, 24);
  for (const d of DESKS) {
    const g = new Group(); g.position.set(d.x, 0, d.z); deskGroup.add(g);
    box(1.8, 0.06, 0.95, M.wood, 0, 0.78, 0, g); box(0.06, 0.75, 0.9, M.dark, -0.86, 0.38, 0, g); box(0.06, 0.75, 0.9, M.dark, 0.86, 0.38, 0, g);
    box(1.86, 0.62, 0.05, M.panel, 0, 1.1, -0.48, g); box(0.05, 0.62, 0.95, M.panel, -0.9, 1.1, 0, g); box(0.05, 0.62, 0.95, M.panel, 0.9, 1.1, 0, g);
    box(0.3, 0.07, 0.38, new MeshStandardMaterial({ color: [0x2f4f8f, 0x8a3b3b, 0x3d6b52][d.n % 3] }), -0.55, 0.85, 0.05, g);
    box(0.02, 0.5, 0.02, M.metal, 0.6, 1.06, -0.25, g); const sh = new Mesh(lampGeo, M.shade); sh.position.set(0.6, 1.36, -0.25); g.add(sh);
    const pool = new Mesh(poolGeo, M.pool); pool.rotation.x = -Math.PI / 2; pool.position.set(0.3, 0.815, -0.05); g.add(pool);
    const plate = new Mesh(new PlaneGeometry(0.42, 0.21), new MeshBasicMaterial({ map: numTexture(d.n) })); plate.position.set(-0.55, 1.47, -0.45); g.add(plate);
    box(0.5, 0.08, 0.5, M.dark, 0, 0.48, 0.8, g); box(0.5, 0.55, 0.06, M.dark, 0, 0.78, 1.05, g); box(0.06, 0.45, 0.06, M.metal, 0, 0.24, 0.8, g);
  }
  // 자료실 — 서가
  const shelf = new Group(); shelf.position.set(-15, 0, 8.2); scene.add(shelf);
  box(0.5, 3.2, 4.4, M.dark, 0, 1.6, 0, shelf); const r = rng(5), bookM = [0x7a3b2e, 0x2f4f8f, 0xc8a24a, 0x3d6b52, 0xd9d2c3].map((c) => new MeshStandardMaterial({ color: c, roughness: 0.8 }));
  for (let y = 0.35; y < 3; y += 0.62) { box(0.52, 0.04, 4.4, M.wood, 0.02, y - 0.22, 0, shelf); for (let z = -2.05; z < 2.05;) { const t = 0.08 + r() * 0.08; box(0.36, 0.3 + r() * 0.14, t, bookM[Math.floor(r() * 5)], 0.08, y - 0.03, z + t / 2, shelf); z += t + 0.01; } }
  // 실행실 — 서버 랙(불빛 깜박임)
  const ledOn = new MeshBasicMaterial({ color: 0x5fe39b }), ledBlue = new MeshBasicMaterial({ color: 0x6f97ff }), leds = [];
  for (const z of [-8.6, -7.4, -6.2]) { const rk = box(0.9, 2.4, 1, M.metal, 12.6, 1.2, z); for (let y = 0.3; y < 2.3; y += 0.18) { const l = box(0.02, 0.04, 0.12, (y * 10) % 2 > 1 ? ledOn : ledBlue, 12.14, y, z + 0.3); leds.push(l); } rk.userData.rack = true; }
  // 검사대 — 모니터 두 대
  box(2.6, 0.06, 1, M.wood, 12.2, 0.8, 3.9); box(0.06, 0.8, 0.9, M.dark, 11, 0.4, 3.9); box(0.06, 0.8, 0.9, M.dark, 13.4, 0.4, 3.9);
  const scr = new MeshBasicMaterial({ color: 0x2b59e0 }); for (const z of [3.4, 4.4]) { box(0.06, 0.55, 0.85, M.dark, 12.6, 1.18, z); box(0.02, 0.48, 0.78, scr, 12.56, 1.18, z); }
  // 승인 데스크 — 단상
  box(3.2, 0.95, 1.1, M.dark, 0, 0.48, -7.6); const sign = new Mesh(new PlaneGeometry(2, 0.38), new MeshBasicMaterial({ map: signTexture(L.approve || "승인 데스크") })); sign.position.set(0, 0.62, -7.04); scene.add(sign);
  box(4.2, 0.18, 2.4, new MeshStandardMaterial({ color: 0x2a1d18, roughness: 0.6 }), 0, 0.09, -7.6);
  // 대기석 — 소파
  const sofaM = new MeshStandardMaterial({ color: 0x2f4a3c, roughness: 0.9 }); box(1, 0.45, 2.8, sofaM, -13.2, 0.23, -5.6); box(0.3, 0.6, 2.8, sofaM, -13.6, 0.6, -5.6); box(0.8, 0.4, 0.8, M.wood, -11.9, 0.2, -3.6);
  // 식물
  const leaf = new MeshStandardMaterial({ color: 0x2f6b3e, roughness: 0.8 }), pot = new MeshStandardMaterial({ color: 0xd8d2c4 });
  for (const [x, z] of [[-14.6, -10.6], [14.6, -10.6], [-14.6, 3.2], [6.6, -7.8]]) { box(0.6, 0.6, 0.6, pot, x, 0.3, z); const s = new Mesh(new SphereGeometry(0.62, 12, 10), leaf); s.position.set(x, 1.15, z); s.scale.y = 1.3; scene.add(s); }

  // ── AI 캐릭터 ──
  const agents = new Map();
  const bodyGeo = new CapsuleGeometry(0.27, 0.42, 4, 12), headGeo = new SphereGeometry(0.3, 20, 14), eyeGeo = new SphereGeometry(0.04, 8, 6), capGeo = new CylinderGeometry(0.2, 0.26, 0.12, 18), ringGeo = new RingGeometry(0.42, 0.55, 32);
  const failM = new MeshBasicMaterial({ color: 0xff4d40, transparent: true, opacity: 0.85, side: DoubleSide }), okM = new MeshBasicMaterial({ color: 0x5fe39b, transparent: true, opacity: 0.85, side: DoubleSide });
  function makeAgent(s) {
    const g = new Group(), col = COLOR[s.color] ?? COLOR.ink, mat = new MeshStandardMaterial({ color: col, roughness: 0.45 });
    const body = new Mesh(bodyGeo, mat); body.position.y = 0.62; const head = new Mesh(headGeo, M.white); head.position.y = 1.3;
    const cap = new Mesh(capGeo, mat); cap.position.y = 1.58; const e1 = new Mesh(eyeGeo, M.eye), e2 = new Mesh(eyeGeo, M.eye); e1.position.set(-0.1, 1.33, -0.27); e2.position.set(0.1, 1.33, -0.27);
    const ring = new Mesh(ringGeo, failM); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; ring.visible = false;
    const rig = new Group(); rig.add(body, head, cap, e1, e2); g.add(rig, ring); scene.add(g);
    const desk = DESKS.find((d) => d.n === (HOME[s.source] || 1 + (agents.size * 5) % 12)) || DESKS[0];
    const tag = document.createElement("div"); tag.className = "lg-tag"; tag.innerHTML = `<b></b><span></span>`; overlay.append(tag);
    const a = { g, rig, ring, tag, desk, path: [], seated: false, at: null, kind: "", state: "", bob: Math.random() * 6, entering: true };
    g.position.set(AISLE_X, 0, 11); a.path = [];
    return a;
  }
  const seatOf = (d) => ({ x: d.x, z: d.z + 0.78 });
  function targetFor(a, kind) { const st = KIND_TO[kind]; return st ? { ...STATIONS[st], st } : { ...seatOf(a.desk), face: 0, st: "desk" }; }
  function route(a, t) { // 칸막이를 뚫지 않게 통로로 돌아간다
    const p = a.g.position, pts = [], inRows = (z) => z > -3.3 && z < 7.2;
    const curLane = a.at === "desk" ? laneZ(a.desk.z) : p.z, tgtLane = t.st === "desk" ? laneZ(a.desk.z) : t.z;
    if (a.at === "desk") pts.push({ x: p.x, z: curLane });
    if (Math.abs(p.x - AISLE_X) > 0.3 && (inRows(curLane) || inRows(tgtLane))) pts.push({ x: AISLE_X, z: curLane });
    pts.push({ x: AISLE_X, z: tgtLane });
    if (t.st === "desk") pts.push({ x: t.x, z: tgtLane });
    pts.push({ x: t.x, z: t.z });
    a.path = pts; a.goal = t; a.seated = false; a.at = null;
  }

  // ── 시점: 전경 · 책상 · 창가 · 위에서 ──
  const VIEWS = { overview: { t: [0, 1, 1], r: 25, th: 0.55, ph: 1.02 }, desk: { t: [-1, 0.9, 2], r: 12.5, th: 0.35, ph: 1.12 }, window: { t: [0, 2.4, -6], r: 13.5, th: 0.12, ph: 1.32 }, top: { t: [0, 0, 0.5], r: 27, th: 0.001, ph: 0.12 } };
  const cam = { t: new Vector3(0, 1, 1), r: 25, th: 0.55, ph: 1.02 }, goal = { t: new Vector3(0, 1, 1), r: 25, th: 0.55, ph: 1.02 };
  const setView = (v) => { const V = VIEWS[v] || VIEWS.overview; goal.t.set(...V.t); goal.r = V.r; goal.th = V.th; goal.ph = V.ph; if (reduce) Object.assign(cam, { r: goal.r, th: goal.th, ph: goal.ph }), cam.t.copy(goal.t); };
  setView(opt.view || "overview");
  // 드래그로 돌리고, 휠·두 손가락으로 확대
  const ptrs = new Map(); let pinch = 0;
  const cv = renderer.domElement; cv.style.touchAction = "none";
  cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); });
  cv.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId)) return; const [px, py] = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 1) { goal.th -= (e.clientX - px) * 0.006; goal.ph = Math.min(1.45, Math.max(0.1, goal.ph - (e.clientY - py) * 0.005)); }
    else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) goal.r = Math.min(34, Math.max(8, goal.r * (pinch / d))); pinch = d; }
  });
  const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = 0; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", (e) => { e.preventDefault(); goal.r = Math.min(34, Math.max(8, goal.r * (1 + Math.sign(e.deltaY) * 0.08))); }, { passive: false });

  // 크기·보이기
  const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(el); resize();
  let visible = true; const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting)); io.observe(el);
  let showLabels = opt.showLabels !== false, speed = 1, last = performance.now(), raf = 0, ledT = 0;
  const tmp = new Vector3();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!visible || document.hidden) return;
    const k = reduce ? 1 : 1 - Math.pow(0.0015, dt);
    cam.r += (goal.r - cam.r) * k; cam.th += (goal.th - cam.th) * k; cam.ph += (goal.ph - cam.ph) * k; cam.t.lerp(goal.t, k);
    camera.position.set(cam.t.x + cam.r * Math.sin(cam.ph) * Math.sin(cam.th), cam.t.y + cam.r * Math.cos(cam.ph), cam.t.z + cam.r * Math.sin(cam.ph) * Math.cos(cam.th)); camera.lookAt(cam.t);
    ledT += dt; if (!reduce && ledT > 0.35) { ledT = 0; for (const l of leds) if (Math.random() < 0.25) l.visible = !l.visible; }
    const W = el.clientWidth, H = el.clientHeight, shown = [];
    roof.visible = camera.position.y < 6.6; // 위에서 볼 땐 천장을 걷어 낸다
    for (const a of agents.values()) {
      const p = a.g.position;
      if (a.path.length) {
        const n = a.path[0], dx = n.x - p.x, dz = n.z - p.z, d = Math.hypot(dx, dz), step = (reduce ? 999 : 2.4 * Math.min(2.5, speed)) * dt;
        if (d <= step) { p.x = n.x; p.z = n.z; a.path.shift(); if (!a.path.length) { a.at = a.goal.st; a.seated = a.at === "desk"; a.g.rotation.y = a.goal.face; } }
        else { p.x += (dx / d) * step; p.z += (dz / d) * step; a.g.rotation.y = Math.atan2(-dx, -dz); }
      }
      const walking = a.path.length > 0; a.bob += dt * (walking ? 11 : 2.2);
      a.rig.position.y = a.seated ? -0.18 : walking && !reduce ? Math.abs(Math.sin(a.bob)) * 0.08 : Math.sin(a.bob) * 0.015;
      a.ring.visible = a.state === "fail" || a.state === "done"; a.ring.material = a.state === "fail" ? failM : okM; if (a.ring.visible && !reduce) a.ring.scale.setScalar(1 + Math.sin(now / 180) * 0.08);
      tmp.set(p.x, (a.seated ? 1.45 : 1.65) + 0.45, p.z).project(camera);
      const on = showLabels && tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
      a.tag.style.display = on ? "" : "none";
      if (on) shown.push({ a, x: (tmp.x + 1) / 2 * W, y: (1 - tmp.y) / 2 * H, d: tmp.z });
    }
    // 이름표가 겹치면 뒤쪽(먼) 것부터 위로 밀어 올린다
    shown.sort((p, q) => p.d - q.d);
    const placed = [], TW = W < 560 ? 104 : 136, TH = W < 560 ? 36 : 42;
    for (const t of shown) {
      for (let k = 0; k < 6 && placed.some((o) => Math.abs(o.x - t.x) < TW && Math.abs(o.y - t.y) < TH); k++) t.y -= TH;
      placed.push(t);
      t.a.tag.style.zIndex = String(100 - placed.length);
      t.a.tag.style.transform = `translate(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px) translate(-50%, -100%)`;
    }
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    // snapshot: { agents: [{ id, source, color, name, project, kind, kindLabel, title, state }], clock, stats }
    update(snap) {
      drawScreen(snap.clock || "--:--:--", snap.stats || { done: 0, fails: 0, recovered: 0 });
      speed = snap.speed || 1;
      const seen = new Set();
      for (const s of snap.agents) {
        let a = agents.get(s.id); if (!a) { a = makeAgent(s); agents.set(s.id, a); }
        seen.add(s.id);
        const kind = s.kind === "fail" ? a.kind || "edit" : s.kind;
        if (kind !== a.kind || a.entering) { const t = targetFor(a, kind); if (!a.goal || a.entering || t.st !== a.goal.st) route(a, t); a.kind = kind; a.entering = false; }
        a.state = s.state;
        a.tag.className = `lg-tag ${s.color} ${s.state}`; a.tag.firstChild.textContent = s.name; a.tag.lastChild.textContent = s.kindLabel + " · " + s.title;
      }
      for (const [id, a] of agents) if (!seen.has(id)) { scene.remove(a.g); a.tag.remove(); agents.delete(id); }
    },
    setView, setLabels(v) { showLabels = v; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); renderer.domElement.remove(); overlay.remove(); },
  };
}
export const webglOk = () => { try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); } catch { return false; } };
