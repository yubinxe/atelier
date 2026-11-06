// Atelier AX · Project Studio — 데이터 모델과 상태 전이(순수 함수, DOM 없음 → node --test 로 검증)
// 용어: Agent(실행 주체) · Skill(재사용 절차) · Workflow(단계와 순서) · Project · Task(완료기준) · Run(실행 기록)
//       Artifact(산출물) · Approval(사용자 결정) · Evidence(검증 증거)
// 원칙: 실행하지 않은 일은 완료로 표시하지 않는다. 시연(demo)에서 만든 결과는 모두 demo:true 로 남기고 화면에 '가상'이라 적는다.

export const MODES = { demo: "시연", live: "실제 실행" };

// ── 업무 단계(Workflow) — 사용자 언어 / 실제 개발 절차 ──
export const STAGES = [
  { id: "idea", n: "01", name: "아이디어 정리", say: "무엇을 만들지 구체화하고 있어요", tech: "요구사항 분석", why: "만들 범위를 먼저 정해야 나중에 '이게 아니었는데'로 다시 만드는 일을 줄일 수 있습니다.", gate: "scope" },
  { id: "design", n: "02", name: "제작 설계", say: "필요한 화면과 기능을 설계하고 있어요", tech: "UX · 아키텍처 설계", why: "화면 순서와 데이터를 어디에 둘지 정해 두면, 만드는 도중 구조를 갈아엎는 일을 막습니다.", gate: "decisions" },
  { id: "build", n: "03", name: "실제 제작", say: "AI 개발자가 기능을 만들고 있어요", tech: "코드 구현", why: "설계도대로 기능을 하나씩 만듭니다. 기능마다 완료 기준이 있어 '대충 완성'을 막습니다." },
  { id: "verify", n: "04", name: "작동 확인", say: "버튼과 기능이 제대로 작동하는지 검사해요", tech: "기능 · 통합 테스트", why: "만든 쪽이 아닌 검수 담당이 따로 확인합니다. 'AI가 완성했다고 말한 것'과 '실제로 작동하는 것'을 구분하기 위해서입니다." },
  { id: "review", n: "05", name: "최종 검토", say: "완성된 결과물을 확인해 주세요", tech: "Preview · 승인", why: "공개 전에 실제 화면을 직접 보고 결정합니다. 이 승인 없이는 다음 단계로 넘어가지 않습니다.", gate: "review" },
  { id: "launch", n: "06", name: "서비스 공개", say: "승인된 서비스를 공개해요", tech: "Production 배포", why: "검토를 마친 판만 외부에 공개합니다.", gate: "launch" },
];

// ── 실행 주체(Agent) ──
export const AGENTS = {
  planner: { name: "기획 담당 AI", tech: "Planner agent", color: "blue", does: "아이디어를 분석해 필요한 기능과 우선순위를 정리합니다." },
  designer: { name: "디자인 담당 AI", tech: "Designer agent", color: "yellow", does: "사용자가 보게 될 화면과 흐름을 설계합니다." },
  developer: { name: "개발 담당 AI", tech: "Developer agent", color: "green", does: "설계도에 맞춰 기능을 만들고, 스스로 1차 테스트를 작성합니다." },
  qa: { name: "품질 검수 AI", tech: "QA agent (독립)", color: "red", does: "만든 쪽과 분리된 위치에서 정상 작동 여부를 독립적으로 확인합니다." },
};

// ── 전문 역량(Skill) — 한 스킬을 여러 에이전트가 재사용할 수 있다 ──
export const SKILLS = {
  "req-analysis": { name: "요구사항 분석", tech: "requirements-analysis", plain: "설명 속에서 꼭 필요한 기능과 있으면 좋은 기능을 골라냅니다." },
  "prioritize": { name: "기능 우선순위 설정", tech: "prioritization (MoSCoW)", plain: "먼저 만들 것과 나중에 해도 될 것을 나눕니다." },
  "ux-flow": { name: "화면 흐름 설계", tech: "user-flow / IA", plain: "사용자가 어떤 순서로 화면을 오가는지 정합니다." },
  "design-system": { name: "디자인 시스템 구성", tech: "design-tokens", plain: "색·글자·여백 규칙을 정해 모든 화면이 한 제품처럼 보이게 합니다." },
  "mobile-layout": { name: "모바일 화면 설계", tech: "responsive-layout", plain: "휴대폰에서도 버튼과 글자가 잘 보이도록 배치합니다." },
  "data-model": { name: "데이터 구조 설계", tech: "data-modeling", plain: "어떤 정보를 어떤 묶음으로 보관할지 정합니다. 엑셀에서 시트를 나누는 일과 비슷합니다." },
  "feature-impl": { name: "기능 구현", tech: "implementation", plain: "설계된 기능을 실제로 작동하는 화면과 로직으로 만듭니다." },
  "finance-calc": { name: "금융 계산 로직 구현", tech: "financial-math", plain: "수익률·비중 같은 숫자를 정확한 공식으로 계산하게 만듭니다." },
  "auth-impl": { name: "회원 기능 구현", tech: "authentication", plain: "가입·로그인과 개인별 정보 분리를 만듭니다." },
  "content-write": { name: "원고 작성", tech: "copywriting", plain: "독자에 맞는 문장으로 원고를 씁니다." },
  "source-check": { name: "출처 확인", tech: "fact-checking", plain: "사실·수치·법령이 믿을 만한 출처와 맞는지 대조합니다." },
  "channel-format": { name: "채널별 형식 맞춤", tech: "channel-formatting", plain: "블로그·SNS·카드뉴스마다 길이와 형식을 맞춥니다." },
  "automation-design": { name: "반복 업무 자동화 설계", tech: "workflow-automation", plain: "사람이 매번 하던 순서를 규칙으로 바꿉니다." },
  "integration": { name: "외부 서비스 연결", tech: "api-integration", plain: "메일·스프레드시트 같은 외부 서비스와 주고받는 방법을 만듭니다." },
  "test-writing": { name: "자동 테스트 작성", tech: "unit / integration tests", plain: "같은 검사를 사람이 매번 하지 않도록 검사 절차를 코드로 남깁니다." },
  "ui-check": { name: "화면 동작 검사", tech: "e2e testing", plain: "실제 브라우저에서 버튼을 눌러 보며 확인합니다." },
  "a11y-check": { name: "접근성 검사", tech: "accessibility audit", plain: "글자 대비·키보드 이동 등 누구나 쓸 수 있는지 확인합니다." },
  "build-check": { name: "전체 빌드 검사", tech: "build / typecheck", plain: "전체를 한 번에 조립해 오류 없이 만들어지는지 확인합니다." },
};

// ── 사용자 언어로 번역하는 용어집 ──
export const GLOSSARY = [
  ["서비스 구조 설계", "Architecture", "어떤 부품을 어디에 두고 어떻게 연결할지 정하는 일"],
  ["사용자가 보는 화면", "Frontend", "브라우저에 보이는 버튼·글자·표"],
  ["서비스 내부 기능", "Backend", "화면 뒤에서 계산·저장·전송을 처리하는 부분"],
  ["데이터 보관 및 관리", "Database", "여러 사람이 동시에 써도 정보가 섞이지 않게 보관하는 저장소. 엑셀 시트를 나눠 관리하는 것과 비슷하지만 연결 관계를 체계적으로 관리합니다"],
  ["정상 작동 검사", "Testing", "정해 둔 기준대로 작동하는지 자동·수동으로 확인"],
  ["서비스 공개", "Deployment", "검토를 마친 판을 인터넷에 올리는 일"],
  ["미리보기 판", "Preview", "공개 전에 나만 볼 수 있는 시험용 주소"],
  ["변경 요청서", "Pull Request", "무엇을 왜 바꿨는지 묶어 검토를 요청하는 문서"],
];

export const CATEGORIES = {
  web: { name: "웹사이트·서비스 제작", hint: "예: 미국 주식 포트폴리오 분석 사이트를 만들고 싶어요." },
  content: { name: "콘텐츠·마케팅 제작", hint: "예: 상가임대차 계약 주의사항을 블로그·인스타 카드뉴스로 만들고 싶어요." },
  automation: { name: "업무 자동화", hint: "예: 매주 월요일 엑셀 매출 자료를 정리해 팀에 메일로 보내고 싶어요." },
};

// ── 키워드 규칙 — 시연용 설계도 초안(실제 AI 분석이 아님을 화면에 명시) ──
const RULES = [
  { re: /주식|포트폴리오|투자|수익률|자산|etf|배당/i, skills: ["finance-calc"], features: [["보유 종목 입력", "가진 종목과 수량, 산 가격을 적어 둡니다", "종목·수량·평균단가를 저장하고 다시 열어도 그대로 보인다"], ["수익률 계산", "투자 성과를 한눈에 봅니다", "종목별·전체 수익률이 공식과 같은 값으로 계산된다"], ["자산 비중 차트", "어디에 얼마나 몰려 있는지 봅니다", "비중 합계가 100%이고 차트와 표의 숫자가 같다"]] },
  { re: /예약|일정|캘린더|스케줄/i, features: [["예약·일정 등록", "날짜와 시간을 골라 신청합니다", "겹치는 시간은 신청되지 않는다"], ["일정 알림", "잊지 않도록 미리 알려 줍니다", "정한 시각에 알림이 한 번만 간다"]] },
  { re: /결제|구매|쇼핑|판매|주문/i, decision: "pay", features: [["상품·주문 관리", "무엇을 얼마에 파는지 관리합니다", "주문 내역이 빠짐없이 남는다"]] },
  { re: /게시판|커뮤니티|후기|리뷰|댓글/i, features: [["글 작성·목록", "이용자가 글을 남기고 읽습니다", "작성한 글이 목록 맨 위에 보인다"]] },
  { re: /관리자|대시보드|통계|현황|분석/i, features: [["현황 대시보드", "핵심 숫자를 한 화면에 모읍니다", "표시되는 숫자마다 출처와 기준 시각이 있다"]] },
  { re: /지도|위치|매장|주변/i, features: [["지도 표시", "위치를 지도로 보여 줍니다", "주소와 지도 표시 위치가 일치한다"]] },
  { re: /검색|찾기|필터/i, features: [["검색·필터", "원하는 항목을 빨리 찾습니다", "검색어가 포함된 항목만 보인다"]] },
  { re: /회원|로그인|가입|계정|마이페이지/i, decision: "auth" },
  { re: /블로그|카드뉴스|sns|인스타|유튜브|뉴스레터|원고|홍보|마케팅/i, cat: "content" },
  { re: /자동|매일|매주|매달|엑셀|메일|보고서|정리해|취합/i, cat: "automation" },
];
const BASE = {
  web: [["첫 화면", "무엇을 하는 서비스인지 바로 알게 합니다", "처음 온 사람이 10초 안에 무엇을 할 수 있는지 안다"], ["모바일 화면 대응", "휴대폰에서도 편하게 씁니다", "가로 390px 화면에서 가로 스크롤 없이 모든 버튼을 누를 수 있다"]],
  content: [["채널별 원고", "블로그·SNS마다 맞는 길이로 씁니다", "채널별 글자 수 기준을 지킨다"], ["출처 표기", "믿을 수 있는 근거를 붙입니다", "모든 수치·법령 인용에 출처가 있다"], ["카드뉴스 구성", "핵심을 장면별로 나눕니다", "카드 한 장에 메시지 하나"]],
  automation: [["입력 자료 정리", "흩어진 자료를 같은 형식으로 모읍니다", "형식이 다른 파일도 같은 표로 합쳐진다"], ["처리 규칙", "사람이 하던 판단을 규칙으로 옮깁니다", "같은 입력이면 항상 같은 결과가 나온다"], ["결과 전달", "정리된 결과를 정해진 사람에게 보냅니다", "받는 사람·시각이 기록에 남는다"], ["실패 시 알림", "문제가 생기면 바로 알 수 있게 합니다", "처리 실패 시 담당자에게 사유와 함께 알린다"]],
};
const DECISIONS = {
  auth: { q: "회원가입 기능을 넣을까요?", opts: [
    { k: "A", label: "회원가입 없이 시작", pro: "제작 범위가 작고 누구나 바로 써 볼 수 있습니다", cost: "작음", risk: "기기를 바꾸면 기록이 이어지지 않습니다" },
    { k: "B", label: "회원가입 기능 추가", pro: "사용자별로 정보를 저장하고 어디서나 이어 씁니다", cost: "큼 (로그인·비밀번호 관리·개인정보 처리)", risk: "개인정보 보호 의무와 보안 점검이 늘어납니다" }] },
  store: { q: "입력한 정보를 어디에 보관할까요?", opts: [
    { k: "A", label: "이 기기(브라우저)에만", pro: "서버가 필요 없고 개인정보가 밖으로 나가지 않습니다", cost: "작음", risk: "브라우저 기록을 지우면 사라집니다" },
    { k: "B", label: "서버 데이터베이스", pro: "여러 기기·여러 사람이 같은 정보를 봅니다", cost: "중간 (서버·저장소 운영비)", risk: "보관 정보의 보안과 백업 책임이 생깁니다" }] },
  pay: { q: "결제 기능은 언제 붙일까요?", opts: [
    { k: "A", label: "1차 공개 뒤에", pro: "핵심 기능을 먼저 검증하고 결제는 나중에 붙입니다", cost: "작음", risk: "처음엔 판매 수익이 없습니다" },
    { k: "B", label: "처음부터 연결", pro: "공개 즉시 판매할 수 있습니다", cost: "큼 (결제 대행사 심사·수수료)", risk: "결제 오류·환불 처리 책임이 바로 생깁니다" }] },
  tone: { q: "글의 말투를 어떻게 할까요?", opts: [
    { k: "A", label: "전문가 톤", pro: "신뢰감이 높습니다", cost: "같음", risk: "어렵게 느낄 수 있습니다" },
    { k: "B", label: "친근한 톤", pro: "공유·저장이 잘 됩니다", cost: "같음", risk: "가볍게 보일 수 있습니다" }] },
  schedule: { q: "얼마나 자동으로 돌릴까요?", opts: [
    { k: "A", label: "버튼을 눌러 실행", pro: "사람이 결과를 보고 판단할 수 있습니다", cost: "작음", risk: "깜빡하면 실행되지 않습니다" },
    { k: "B", label: "정해진 시각에 자동 실행", pro: "손이 가지 않습니다", cost: "중간 (예약 실행 환경)", risk: "잘못된 결과도 자동으로 나갑니다 — 실패 알림이 필수" }] },
};

const slug = (s) => s.replace(/\s+/g, "-");
const uid = (n) => Math.abs([...n].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(36).slice(0, 6);

// 아이디어 문장 → 프로젝트 이름 (끝맺음 표현 제거)
export function titleFrom(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim()
    .replace(/(을|를)?\s*(만들고 싶어요|만들고 싶습니다|만들어 주세요|만들어줘|만들고 싶다|만들기|하고 싶어요|싶어요)[.!]?$/, "")
    .replace(/[.!?]$/, "").trim();
  return (t.length > 28 ? t.slice(0, 27) + "…" : t) || "새 프로젝트";
}

export function detectCategory(text, fallback = "web") {
  for (const r of RULES) if (r.cat && r.re.test(text)) return r.cat;
  return fallback;
}

// 설계도(Blueprint) — 키워드 규칙으로 만든 초안
export function blueprint(text, category) {
  const cat = CATEGORIES[category] ? category : detectCategory(text);
  const feats = [], skills = new Set(), dec = [];
  for (const r of RULES) if (r.re.test(text)) {
    (r.features || []).forEach(([name, why, accept]) => feats.push({ name, why, accept, must: true }));
    (r.skills || []).forEach((s) => skills.add(s));
    if (r.decision) dec.push(r.decision);
  }
  BASE[cat].forEach(([name, why, accept], i) => { if (!feats.some((f) => f.name === name)) feats.push({ name, why, accept, must: i === 0 || cat !== "web" }); });
  if (cat === "web") { if (!dec.includes("auth")) dec.unshift("auth"); dec.push("store"); }
  if (cat === "content") dec.push("tone");
  if (cat === "automation") dec.push("schedule");
  if (dec.includes("auth")) skills.add("auth-impl");
  const features = feats.slice(0, 8).map((f, i) => ({ id: "f" + (i + 1), ...f, must: i < 4 ? true : f.must }));
  const matched = RULES.filter((r) => r.re.test(text) && (r.features || r.skills)).length;
  return {
    category: cat, title: titleFrom(text), idea: String(text).trim(),
    goal: `${titleFrom(text)} — ${CATEGORIES[cat].name}. 꼭 필요한 기능 ${features.filter((f) => f.must).length}개부터 만들고, 나머지는 검증 뒤에 붙입니다.`,
    features, decisions: [...new Set(dec)].map((id) => ({ id, ...DECISIONS[id], choice: null })), extraSkills: [...skills],
    confidence: matched ? "키워드 일치 " + matched + "건" : "일치 키워드 없음 — 기본 틀만 제안",
  };
}

// 단계별 작업(Task) — 각 작업에 담당 에이전트·사용 스킬·완료 기준
export function planTasks(bp) {
  const T = [], add = (stage, title, agent, skills, accept, extra = {}) => T.push({ id: "t" + (T.length + 1), stage, title, agent, skills, accept, status: "todo", ...extra });
  const content = bp.category === "content", auto = bp.category === "automation";
  add("idea", "아이디어에서 요구사항 뽑기", "planner", ["req-analysis"], "필요한 기능 목록과 각 기능의 완료 기준이 있다");
  add("idea", "먼저 만들 기능 정하기", "planner", ["prioritize"], "필수·권장이 나뉘어 있다");
  add("design", content ? "원고·카드 구성안" : auto ? "처리 순서도 설계" : "화면 목록과 이동 흐름 설계", content ? "designer" : "designer", content ? ["ux-flow", "channel-format"] : ["ux-flow", "mobile-layout"], "모든 기능이 어느 화면/단계에 들어가는지 정해져 있다");
  add("design", content ? "표현 규칙(톤·형식) 정리" : "디자인 규칙 정하기", "designer", ["design-system"], "색·글자·간격 규칙이 문서로 있다");
  if (!content) add("design", "데이터 구조 설계", "planner", ["data-model"], "보관할 정보와 묶음이 표로 정리돼 있다");
  for (const f of bp.features) {
    const sk = content ? (/출처/.test(f.name) ? ["source-check"] : ["content-write", "channel-format"]) : auto ? (/전달|알림/.test(f.name) ? ["integration", "automation-design"] : ["automation-design"]) : ["feature-impl", ...(/수익률|비중|계산/.test(f.name) && bp.extraSkills.includes("finance-calc") ? ["finance-calc"] : [])];
    add("build", `${f.name} 만들기`, content && /카드/.test(f.name) ? "designer" : content ? "developer" : "developer", [...sk, ...(content ? [] : ["test-writing"])], f.accept, { feature: f.id });
  }
  for (const f of bp.features) add("verify", `${f.name} 검사`, "qa", content ? ["source-check"] : ["ui-check", "test-writing"], f.accept, { check: f.id });
  if (!content) add("verify", "모바일 화면 검사", "qa", ["ui-check", "mobile-layout"], "390px 화면에서 가로 스크롤 없음", { check: "mobile" });
  add("verify", content ? "형식·분량 검사" : "접근성 검사", "qa", [content ? "channel-format" : "a11y-check"], content ? "채널별 기준 충족" : "글자 대비 4.5:1 이상 · 키보드로 모든 버튼 이동", { check: "a11y" });
  if (!content) add("verify", "전체 빌드 검사", "qa", ["build-check"], "오류 없이 전체가 조립된다", { check: "build" });
  add("review", "미리보기 판 준비", "developer", ["build-check"], "공개 전 확인용 주소가 있다");
  add("launch", "서비스 공개", "developer", ["build-check"], "승인된 판만 공개된다");
  return T;
}

// mode "live": plan = 실제 AI 가 만든 설계도({title, goal, features, decisions}). 스킬 배정은 키워드 규칙을 그대로 쓴다.
export function createProject(text, category, now = Date.now(), mode = "demo", plan = null) {
  const bp = blueprint(text, category);
  if (mode === "live" && plan) {
    bp.title = plan.title || bp.title; bp.goal = plan.goal || bp.goal;
    bp.features = plan.features.map((f, i) => ({ id: "f" + (i + 1), name: f.name, why: f.why, accept: f.accept, must: !!f.must }));
    bp.decisions = plan.decisions.map((d) => ({ ...d, choice: null }));
    bp.confidence = "AI 설계도";
  }
  const id = "p" + uid(text + now) + (now % 1000);
  const tasks = planTasks(bp);
  const evidence = tasks.filter((t) => t.check).map((t) => ({ id: "e-" + t.check, task: t.id, name: t.title, status: "unverified", runs: [] }));
  evidence.push({ id: "e-deploy", task: null, name: "운영환경 배포", status: "unverified", runs: [] });
  return { id, v: 1, mode, created: now, updated: now, status: "active", stage: 0, ...bp, tasks, runs: [], approvals: [], evidence, history: [{ at: now, kind: "create", text: `프로젝트 생성 — ${CATEGORIES[bp.category].name}${mode === "live" ? " · 실제 AI 설계도" : ""}`, demo: mode === "demo" }] };
}

// ── 승인(Approval) 게이트 ──
const gateOf = (p) => STAGES[p.stage]?.gate;
export const stageTasks = (p, i = p.stage) => p.tasks.filter((t) => t.stage === STAGES[i].id);
export const pendingApproval = (p) => p.approvals.find((a) => a.status === "pending") || null;
const GATE_TEXT = {
  scope: ["범위 확인", "정리된 기능 목록이 맞는지 확인해 주세요. 승인하면 설계를 시작합니다."],
  decisions: ["설계 결정", "AI 팀이 결정을 요청합니다. 선택지를 고른 뒤 승인하면 제작을 시작합니다."],
  review: ["최종 검토", "미리보기 판과 검사 결과를 확인해 주세요. 승인해야 공개 단계로 넘어갑니다."],
  launch: ["공개 승인", "승인하면 서비스를 공개합니다."],
};

// 다음 한 걸음 — 결과: { p, did, blocked } · 실제 실행에서 결과 없이 부르면 { p, needs: 작업 } (화면이 AI 를 부른 뒤 result 와 함께 다시 부른다)
// result: { outcome: "done"|"pass"|"fail"|"unknown"|"error", summary, note, output, start, end, model, usage }
export function step(p0, now = Date.now(), result = null) {
  const p = structuredClone(p0);
  if (p.status === "paused") return { p, blocked: "중단된 프로젝트입니다. ‘다시 시작’을 누르면 이어서 진행합니다." };
  if (p.status === "done" || p.status === "stopped") return { p, blocked: "이미 끝난 프로젝트입니다." };
  const pend = pendingApproval(p); if (pend) return { p, blocked: `‘${pend.title}’ 결정을 기다리고 있습니다.` };
  const todo = stageTasks(p).find((t) => t.status === "todo");
  if (todo) {
    if (p.mode === "live") {
      if (!result) return { p, needs: todo };
      if (result.outcome === "error") { log(p, now, "error", `${AGENTS[todo.agent].name} · ${todo.title} — 실행 실패: ${result.note || "오류"} (완료로 적지 않음)`); p.updated = now; return { p, blocked: result.note || "실행 실패" }; }
    }
    runTask(p, todo, now, result); p.updated = now; return { p, did: todo.title };
  }
  // 단계의 작업이 모두 끝남 → 게이트가 있으면 승인 요청, 없으면 다음 단계
  const g = gateOf(p);
  if (g && !p.approvals.some((a) => a.gate === g && a.status === "approved")) {
    const [title, text] = GATE_TEXT[g];
    p.approvals.push({ id: "a" + (p.approvals.length + 1), gate: g, stage: STAGES[p.stage].id, title, text, status: "pending", asked: now });
    log(p, now, "approval", `승인 요청 — ${title}`);
    p.updated = now; return { p, did: `승인 요청: ${title}` };
  }
  return nextStage(p, now);
}
function nextStage(p, now) {
  if (p.stage >= STAGES.length - 1) { p.status = "done"; log(p, now, "done", p.mode === "demo" ? "시연 완료 — 실제로 공개된 서비스는 없습니다" : "AI 작업 완료 — 배포는 연결되지 않아 공개된 서비스는 없습니다"); p.updated = now; return { p, did: "완료" }; }
  p.stage += 1; log(p, now, "stage", `${STAGES[p.stage].n} ${STAGES[p.stage].name} 시작`); p.updated = now;
  return { p, did: `${STAGES[p.stage].name} 시작` };
}
function log(p, at, kind, text, extra = {}) { p.history.push({ at, kind, text, demo: p.mode === "demo", ...extra }); }

// 작업 실행 기록(Run). 시연에서는 결과가 '가상'이며, 검사 실패→수정→재검사 흐름을 한 번 보여 준다.
function runTask(p, t, now, res) {
  const demo = p.mode === "demo", runId = "r" + (p.runs.length + 1);
  const run = { id: runId, task: t.id, agent: t.agent, skills: t.skills, start: now, end: now + 1000 * (20 + (p.runs.length * 37) % 90), demo, outcome: "done", note: "" };
  if (res) liveRun(p, t, run, res, now);
  else if (t.check) {
    const ev = p.evidence.find((e) => e.id === "e-" + t.check);
    const firstMobile = t.check === "mobile" && !ev.runs.length;
    run.outcome = firstMobile ? "fail" : "pass";
    run.note = firstMobile ? "좁은 화면에서 표가 화면 밖으로 넘칩니다 — 개발 담당에게 수정 요청" : `완료 기준 확인: ${t.accept}`;
    ev.runs.push({ run: runId, at: run.end, result: run.outcome, demo });
    ev.status = run.outcome === "pass" ? "pass" : "fail";
    if (firstMobile) { // 수정 작업과 재검사를 추가 — 실패를 숨기지 않는다
      p.tasks.push({ id: "t" + (p.tasks.length + 1), stage: "verify", title: "표 영역 가로 스크롤 수정", agent: "developer", skills: ["mobile-layout", "feature-impl"], accept: "390px에서 표가 화면 안에 들어온다", status: "todo", fix: true });
      p.tasks.push({ id: "t" + (p.tasks.length + 1), stage: "verify", title: "모바일 화면 재검사", agent: "qa", skills: ["ui-check"], accept: t.accept, status: "todo", check: "mobile" });
    }
  } else run.note = t.accept ? `완료 기준: ${t.accept}` : "";
  t.status = "done"; t.run = runId; p.runs.push(run);
  log(p, now, "run", `${AGENTS[t.agent].name} · ${t.title}${run.outcome === "fail" ? " — 실패" : run.outcome === "pass" ? " — 통과" : run.outcome === "unknown" ? " — 판정 없음(미검증)" : " — 완료"}`, { agent: t.agent, run: runId });
}

// 실제 실행 결과 기록. 검사는 'AI 검토'(코드 실행 아님)로 남기고, 판정이 없으면 미검증. 실패는 수정·재검사를 최대 2회 붙인다.
const clipOut = (s) => String(s || "").slice(0, 4000);
function liveRun(p, t, run, res, now) {
  Object.assign(run, { start: res.start || now, end: res.end || now, outcome: res.outcome === "unknown" ? "unknown" : res.outcome || "done", note: res.note || "", summary: res.summary || "", output: clipOut(res.output), model: res.model || "", usage: res.usage || null, review: !!t.check });
  if (!t.check) { if (!run.note) run.note = t.accept ? `완료 기준: ${t.accept}` : ""; return; }
  const ev = p.evidence.find((e) => e.id === "e-" + t.check);
  if (!ev) return;
  ev.kind = "ai-review";
  ev.runs.push({ run: run.id, at: run.end, result: run.outcome === "unknown" ? "unknown" : run.outcome, demo: false, review: true });
  ev.status = run.outcome === "pass" ? "pass" : run.outcome === "fail" ? "fail" : "unverified";
  const fixes = p.tasks.filter((x) => x.fix && x.fixFor === t.check).length;
  if (run.outcome === "fail" && fixes < 2) {
    p.tasks.push({ id: "t" + (p.tasks.length + 1), stage: "verify", title: `${t.title.replace(/ (재)?검사$/, "")} 수정`, agent: "developer", skills: ["feature-impl"], accept: run.note || t.accept, status: "todo", fix: true, fixFor: t.check });
    p.tasks.push({ id: "t" + (p.tasks.length + 1), stage: "verify", title: `${t.title.replace(/ (재)?검사$/, "")} 재검사`, agent: "qa", skills: t.skills, accept: t.accept, status: "todo", check: t.check });
  }
}

// 사용자 결정 — 설계 결정 게이트는 모든 선택지를 골라야 승인 가능
export function choose(p0, decisionId, key, now = Date.now()) {
  const p = structuredClone(p0), d = p.decisions.find((x) => x.id === decisionId);
  if (!d || !d.opts.some((o) => o.k === key)) return p;
  d.choice = key; log(p, now, "decision", `결정 — ${d.q} → ${key}. ${d.opts.find((o) => o.k === key).label}`); p.updated = now; return p;
}
export function canApprove(p, a) { return a.gate !== "decisions" || p.decisions.every((d) => d.choice); }
export function approve(p0, approvalId, now = Date.now()) {
  const p = structuredClone(p0), a = p.approvals.find((x) => x.id === approvalId);
  if (!a || a.status !== "pending" || !canApprove(p, a)) return p;
  a.status = "approved"; a.at = now; log(p, now, "approve", `승인 — ${a.title}`);
  if (a.gate === "launch") { const ev = p.evidence.find((e) => e.id === "e-deploy"); ev.status = "skipped"; ev.note = p.mode === "demo" ? "시연에서는 실제 공개를 실행하지 않습니다" : "배포 서비스가 연결되지 않아 공개를 실행하지 않았습니다"; }
  p.updated = now; return p;
}
// 반려 — 해당 단계로 되돌려 다시 작업하게 한다
export function reject(p0, approvalId, reason = "", now = Date.now()) {
  const p = structuredClone(p0), a = p.approvals.find((x) => x.id === approvalId);
  if (!a || a.status !== "pending") return p;
  a.status = "rejected"; a.at = now; a.reason = reason;
  const back = a.gate === "review" ? STAGES.findIndex((s) => s.id === "build") : STAGES.findIndex((s) => s.id === a.stage);
  p.stage = back;
  for (const t of p.tasks) if (STAGES.findIndex((s) => s.id === t.stage) >= back) t.status = "todo";
  for (const e of p.evidence) if (back <= 3) { e.status = "unverified"; }
  log(p, now, "reject", `반려 — ${a.title}${reason ? ` (${reason})` : ""} → ${STAGES[back].name}부터 다시`);
  p.updated = now; return p;
}
export function pause(p0, now = Date.now()) { const p = structuredClone(p0); if (p.status === "active") { p.status = "paused"; log(p, now, "pause", "사용자가 진행을 멈췄습니다"); } return p; }
export function resume(p0, now = Date.now()) { const p = structuredClone(p0); if (p.status === "paused") { p.status = "active"; log(p, now, "resume", "진행 재개"); } return p; }

// ── 요약: 비개발자가 답할 수 있어야 하는 다섯 질문 ──
export function summary(p) {
  const st = STAGES[p.stage], tasks = p.tasks, done = tasks.filter((t) => t.status === "done").length;
  const doing = stageTasks(p).find((t) => t.status === "todo"), pend = pendingApproval(p);
  const ev = p.evidence, pass = ev.filter((e) => e.status === "pass").length, fail = ev.filter((e) => e.status === "fail").length, unv = ev.filter((e) => e.status === "unverified").length;
  return {
    stage: st, done, total: tasks.length, pct: Math.round((done / tasks.length) * 100),
    now: p.status === "done" ? "모든 단계를 마쳤습니다." : p.status === "paused" ? "멈춰 있습니다." : pend ? "사용자의 결정을 기다리며 멈춰 있습니다." : doing ? `${AGENTS[doing.agent].name}가 ‘${doing.title}’ 작업을 할 차례입니다.` : `${st.name} 단계를 마무리하고 있습니다.`,
    why: doing ? (doing.accept ? `완료 기준: ${doing.accept}` : st.why) : st.why,
    decide: pend ? `${pend.title} — ${pend.text}` : p.decisions.some((d) => !d.choice) && p.stage <= 1 ? "곧 설계 결정이 필요합니다." : "지금 결정할 것은 없습니다.",
    completed: `작업 ${done}/${tasks.length}개 완료`,
    proof: `검사 통과 ${pass} · 실패 ${fail} · 미검증 ${unv}${p.mode === "demo" ? " — 시연 결과(가상)" : " — AI 검토(코드 실행 아님)"}`,
  };
}
// 스킬 → 쓰는 에이전트(다대다 관계)
export function skillUsage(p) {
  const m = {};
  for (const t of p.tasks) for (const s of t.skills) { (m[s] ||= { agents: new Set(), tasks: 0, done: 0 }); m[s].agents.add(t.agent); m[s].tasks++; if (t.status === "done") m[s].done++; }
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { ...v, agents: [...v.agents] }]));
}
// ── 보드(게임 화면)용 구조 — 단계 = 구역, 작업 = 칸, 승인 = 관문 ──
export function board(p) {
  const next = p.status === "active" && !pendingApproval(p) ? stageTasks(p).find((t) => t.status === "todo") : null;
  return STAGES.map((s, i) => ({
    i, id: s.id, n: s.n, name: s.name, state: i < p.stage || p.status === "done" ? "done" : i === p.stage ? "now" : "next",
    tasks: p.tasks.filter((t) => t.stage === s.id).map((t) => ({ id: t.id, title: t.title, agent: t.agent, status: t.status, now: t === next, fix: !!t.fix, check: !!t.check, outcome: t.run ? p.runs.find((r) => r.id === t.run)?.outcome || "done" : null })),
    gate: s.gate ? { gate: s.gate, state: p.approvals.some((a) => a.gate === s.gate && a.status === "approved") ? "open" : p.approvals.some((a) => a.gate === s.gate && a.status === "pending") ? "wait" : "closed" } : null,
  }));
}
// 경험치·레벨·업적 — 기록에서만 계산(꾸며 낸 점수 없음). 작업 10 · 검사 통과 15 · 실패 뒤 복구 20 · 승인 25
export const LEVEL_XP = 40;
export function game(p) {
  const agents = Object.fromEntries(Object.keys(AGENTS).map((k) => [k, { xp: 0 }]));
  for (const r of p.runs) agents[r.agent].xp += r.outcome === "pass" ? 15 : r.outcome === "fail" || r.outcome === "unknown" ? 5 : 10;
  const recovered = p.evidence.filter((e) => e.runs.some((r) => r.result === "fail") && e.status === "pass");
  agents.developer.xp += 20 * recovered.length;
  const approved = p.approvals.filter((a) => a.status === "approved");
  for (const k in agents) { const a = agents[k]; a.lv = 1 + Math.floor(a.xp / LEVEL_XP); a.into = a.xp % LEVEL_XP; }
  const xp = Object.values(agents).reduce((n, a) => n + a.xp, 0) + 25 * approved.length;
  const checks = p.evidence.filter((e) => e.id !== "e-deploy");
  const B = [
    ["first", "첫 실행", p.runs.length > 0],
    ["scope", "범위 확정", approved.some((a) => a.gate === "scope")],
    ["design", "설계 확정", approved.some((a) => a.gate === "decisions")],
    ["recover", "실패 복구", recovered.length > 0],
    ["clean", "검사 전부 통과", checks.length > 0 && checks.every((e) => e.status === "pass")],
    ["finish", "완주", p.status === "done"],
  ];
  return { xp, lv: 1 + Math.floor(xp / (LEVEL_XP * 3)), into: xp % (LEVEL_XP * 3), per: LEVEL_XP * 3, agents, gates: approved.length, badges: B.map(([id, name, got]) => ({ id, name, got })) };
}
export const isValidProject = (p) => !!(p && p.v === 1 && p.id && Array.isArray(p.tasks) && Array.isArray(p.evidence) && STAGES[p.stage]);
export { slug };
