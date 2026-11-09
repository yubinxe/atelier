// Atelier AX — 기업 사이트 문안(ko/en). 확인된 사실만 쓴다: 실적·고객·인원·가격·자격·수상은 넣지 않는다.

export const ORG = { nameKo: "아뜰리에 AX", nameEn: "Atelier AX", city: { ko: "서울", en: "Seoul" }, founded: 2026, url: "https://atelier-ax.vercel.app" };

export const SERVICES = [
  { id: "strategy", ko: { name: "AX 전략·업무 진단", en: "AX Strategy & Process Intelligence" }, en: { name: "AX Strategy & Process Intelligence" },
    k: {
      short: "어디부터 AI를 적용해야 하는지, 근거를 갖고 정합니다.",
      problem: "AI를 도입해야 한다는 압박은 있지만, 어느 업무부터 바꿔야 효과가 나는지 판단할 근거가 없습니다.",
      work: ["담당자 인터뷰와 문서·데이터 흐름 조사", "업무를 반복·판단·승인 단계로 분해", "자동화 가능성과 위험도 평가", "우선순위와 단계별 전환 로드맵 수립"],
      out: ["현재·목표 업무 지도", "자동화 후보 목록과 평가표", "단계별 전환 로드맵", "첫 과제 정의서"],
      cases: ["검토 문서가 많은 팀의 업무 분해와 병목 식별", "주기적 보고 업무의 자동화 범위 산정"],
      start: "담당자 한두 분과 나누는 첫 대화에서 진단 범위를 정합니다." },
    e: {
      short: "Decide where AI should go first — with evidence, not hype.",
      problem: "There is pressure to adopt AI, but no basis for deciding which work to change first or what will actually pay off.",
      work: ["Interviews and a survey of document and data flows", "Breaking work into repeatable, judgement and approval steps", "Assessing automation potential and risk", "A prioritised, phased transformation roadmap"],
      out: ["Current and target process maps", "Automation candidates with an assessment matrix", "Phased roadmap", "A definition of the first project"],
      cases: ["Mapping a review-heavy team to find its bottlenecks", "Scoping automation for recurring reporting work"],
      start: "A first conversation with one or two people who own the work sets the scope." } },
  { id: "automation", ko: { name: "AI 워크플로 자동화" }, en: { name: "AI Workflow Automation" },
    k: {
      short: "반복되는 정리·전달·입력을, 기록이 남는 자동화로 바꿉니다.",
      problem: "같은 취합·정리·전달을 매주 사람이 반복하고, 시스템 사이의 데이터는 손으로 옮겨집니다.",
      work: ["반복 업무 자동화와 시스템 간 데이터 연결", "n8n 등 워크플로 도구 기반 구현", "AI 에이전트의 역할 분담과 사람의 승인 단계 설계", "실패 알림과 재시도 규칙"],
      out: ["운영 중인 워크플로", "실행 기록과 실패 알림", "운영·변경 매뉴얼"],
      cases: ["지점별 매출 자료 취합과 주간 보고 발송", "공고·문서 수집 후 요약·분류"],
      start: "지금 손으로 하는 한 가지 업무를 함께 따라가며 자동화 범위를 정합니다." },
    e: {
      short: "Turn repetitive collecting, formatting and hand-offs into automation that leaves a record.",
      problem: "The same gathering, tidying and forwarding is repeated by hand every week, and data moves between systems by copy and paste.",
      work: ["Automating repetitive work and connecting systems", "Implementation on workflow tools such as n8n", "Dividing roles between AI agents and placing human approval steps", "Failure alerts and retry rules"],
      out: ["A workflow running in production", "Run history and failure alerts", "An operating and change manual"],
      cases: ["Collecting branch sales data and sending a weekly report", "Gathering notices and documents, then summarising and classifying them"],
      start: "We walk through one task you currently do by hand and scope the automation from there." } },
  { id: "engineering", ko: { name: "AI 제품·소프트웨어 개발" }, en: { name: "Intelligent Product Engineering" },
    k: {
      short: "업무에 맞는 도구가 없을 때, 직접 만들어 운영까지 넘깁니다.",
      problem: "기성 도구는 우리 업무 방식과 맞지 않고, 내부에는 이를 만들 개발 인력이 없습니다.",
      work: ["AI 기능을 포함한 제품 시제품", "사내 전용 웹 애플리케이션", "데이터 수집·정리 파이프라인", "운영 대시보드 설계와 개발"],
      out: ["배포된 애플리케이션과 소스 코드", "자동 테스트", "운영·인수인계 문서"],
      cases: ["공공 데이터를 모아 조건별 후보로 정리하는 서비스", "흩어진 이슈와 지표를 한 화면에 모으는 대시보드"],
      start: "해결하려는 업무와 사용자를 정리한 뒤, 가장 작은 작동 판부터 만듭니다." },
    e: {
      short: "When no tool fits the way you work, we build one and hand it over ready to run.",
      problem: "Off-the-shelf tools do not fit how the work is done, and there is no in-house team to build an alternative.",
      work: ["Prototypes of AI-enabled products", "Internal web applications", "Data collection and preparation pipelines", "Operational dashboards"],
      out: ["A deployed application with its source code", "Automated tests", "Operating and hand-over documentation"],
      cases: ["A service that gathers public data and turns it into candidates by criteria", "A dashboard that brings scattered issues and indicators onto one screen"],
      start: "We define the work and its users, then build the smallest version that actually runs." } },
  { id: "governance", ko: { name: "AI 거버넌스·운영 신뢰성" }, en: { name: "AI Governance & Operational Reliability" },
    k: {
      short: "AI가 한 일을 누가 확인했는지, 어디서 멈추는지 정해 둡니다.",
      problem: "AI가 만든 결과를 누가 확인했는지, 문제가 생기면 어디서 멈추고 되돌리는지가 정해져 있지 않습니다.",
      work: ["실행 추적과 기록 구조", "사람이 승인해야 하는 지점 설계", "결과 검증 절차와 품질 기준", "오류 대응·되돌리기, 권한과 비밀정보 분리"],
      out: ["승인·검증 정책", "실행 기록 구조", "운영 점검표", "관제 화면"],
      cases: ["외부 공개 전 사람의 승인을 거치는 관문", "AI의 판정과 실제 검사를 구분해 표시하는 결과표"],
      start: "이미 쓰고 있는 AI·자동화를 함께 점검하는 것부터 시작할 수 있습니다." },
    e: {
      short: "Decide who checks what AI has done, and where it must stop.",
      problem: "No one has defined who verified an AI-generated result, or where the process stops and rolls back when something goes wrong.",
      work: ["Execution tracing and record structure", "Designing the points where a person must approve", "Verification procedures and quality criteria", "Error handling and rollback; separating permissions and secrets"],
      out: ["Approval and verification policy", "Execution record structure", "Operating checklist", "A monitoring view"],
      cases: ["A gate that requires human approval before anything is published", "A results table that separates AI judgement from executed checks"],
      start: "We can begin by reviewing the AI and automation you already run." } },
];

export const METHOD = [
  { k: ["발견", "Discover"], e: ["Discover", "Discover"], kt: "업무가 실제로 어떻게 흘러가는지 봅니다. 문서, 데이터, 사람 사이의 인계를 따라갑니다.", et: "See how the work really flows — following documents, data and hand-offs between people.", ko: "업무 지도 · 병목 목록", eo: "Process map · bottlenecks" },
  { k: ["설계", "Architect"], e: ["Architect", "Architect"], kt: "AI와 사람의 경계를 정합니다. 무엇을 자동화하고, 어디서 사람이 판단하고 승인하는지.", et: "Draw the line between AI and people: what is automated, and where a person judges and approves.", ko: "시스템 설계 · 승인 지점", eo: "System design · approval points" },
  { k: ["구현", "Engineer"], e: ["Engineer", "Engineer"], kt: "작동하는 소프트웨어와 워크플로로 만듭니다. 기능마다 완료 기준과 테스트가 있습니다.", et: "Build working software and workflows, each feature with its own acceptance criteria and tests.", ko: "애플리케이션 · 워크플로", eo: "Applications · workflows" },
  { k: ["운영", "Govern"], e: ["Govern", "Govern"], kt: "운영 중에도 확인할 수 있게 합니다. 실행 기록, 검증, 실패 알림, 되돌리기.", et: "Keep it verifiable in operation: run history, checks, failure alerts and rollback.", ko: "실행 기록 · 점검표", eo: "Run history · checklist" },
];

// 상태: live(공개·작동) · proto(시제품) · concept(기획) · conf(비공개)
export const WORK = [
  { id: "studio", status: "live", href: "/studio/", ko: { name: "Atelier AX Studio", kind: "자사 시연 제품", desc: "AI 에이전트들이 아이디어를 기획·설계·제작·검증·검토·공개의 6단계로 처리하는 과정을 직접 조작해 보는 시연입니다. 승인 관문, 검사 기록, 실시간 작업 모델하우스를 포함합니다.", stack: "정적 ES 모듈 · Vercel 서버 함수 · 이벤트 브리지", status: "공개 시연", link: "시연 열기" },
    en: { name: "Atelier AX Studio", kind: "Company demo product", desc: "An interactive demonstration in which AI agents take an idea through six stages — planning, design, build, verification, review and release — with approval gates, verification records and a live simulation of agent work.", stack: "Static ES modules · Vercel functions · event bridge", status: "Live demo", link: "Open demo" } },
  { id: "gukjeong", status: "live", href: "https://gukjeong-hannune.vercel.app", ext: true, ko: { name: "국정 한눈에", kind: "대표 개인 프로젝트", desc: "공개 뉴스와 지표를 모아 국정 이슈를 한 화면에 정리하는 서비스입니다. 사실·기전·합의·시나리오·전망·검증 순서로 근거를 쌓는 전망 모듈을 개발하고 있습니다.", stack: "정적 프론트엔드 · 서버리스 함수 · 공개 RSS", status: "공개 운영", link: "사이트 열기" },
    en: { name: "Gukjeong at a Glance", kind: "Founder's personal project", desc: "A service that gathers public news and indicators to present national policy issues on one screen, now adding an outlook module that builds from facts to mechanisms, consensus, scenarios, forecasts and verification.", stack: "Static front end · serverless functions · public RSS", status: "Live", link: "Open site" } },
  { id: "zipcatch", status: "proto", ko: { name: "집캐치 ZipCatch", kind: "대표 개인 프로젝트", desc: "청약·공공임대 공고를 찾는 사람을 위해, 조건을 한 번 입력하면 지원 가능한 후보를 정리하고 관심 공고와 일정을 이어서 관리하게 하는 서비스입니다.", stack: "Next.js · Supabase · 공공데이터 API", status: "시제품" },
    en: { name: "ZipCatch", kind: "Founder's personal project", desc: "For people looking for public housing subscriptions and rentals: enter your conditions once, see the notices you can apply for, and keep track of saved notices and dates.", stack: "Next.js · Supabase · public data APIs", status: "Prototype" } },
  { id: "legal", status: "conf", ko: { name: "법조시장 한눈에", kind: "비공개 작업", desc: "법조 시장 정보를 한 화면에 모으는 대시보드입니다. 공개 범위가 확인되지 않아 화면과 세부 내용은 싣지 않습니다.", stack: "", status: "비공개" },
    en: { name: "Legal Market at a Glance", kind: "Confidential work", desc: "A dashboard that brings legal-market information onto one screen. Screens and details are withheld because the scope of disclosure has not been confirmed.", stack: "", status: "Confidential" } },
];

// ── v2 홈 구성 요소 ──
// 업무의 흔한 비효율 — 아이콘은 build.mjs 의 ICON 키
export const PAINS = [
  { icon: "gather", k: ["반복되는 자료 취합", "매주 같은 자료를 여러 곳에 요청하고, 받은 파일을 하나로 붙입니다."], e: ["Repetitive data gathering", "The same figures are requested from several places every week and pasted together by hand."] },
  { icon: "doc", k: ["손으로 하는 문서 정리", "받은 문서를 읽고, 분류하고, 다른 양식에 옮겨 적는 일이 사람 몫입니다."], e: ["Manual document handling", "Reading, classifying and re-keying incoming documents is still someone's job."] },
  { icon: "split", k: ["끊긴 정보 흐름", "부서와 시스템 사이의 정보가 메일과 메신저로만 오가고, 최신본이 어디 있는지 모릅니다."], e: ["Broken information flow", "Information moves between teams and systems only by email and chat, and no one is sure which version is current."] },
  { icon: "check", k: ["검증하기 어려운 AI 결과", "AI가 만든 결과가 맞는지, 누가 확인했는지 기록이 남지 않습니다."], e: ["AI output no one can verify", "There is no record of whether an AI result was right or who checked it."] },
  { icon: "gear", k: ["관리되지 않는 자동화", "한번 만든 자동화가 실패해도 모르고, 만든 사람이 없으면 고칠 수 없습니다."], e: ["Automation no one maintains", "When an automation fails no one notices, and without its author no one can fix it."] },
];

// 기존 방식 vs 재설계 — 예시 시나리오(실적 아님)
export const BA = {
  k: { title: "예시 · 주간 실적 보고", before: "지금의 방식", after: "재설계 후",
    b: [["person", "자료 요청", "담당자가 지점마다 메일로 자료를 요청합니다."], ["person", "회신 대기", "답이 늦은 곳에 다시 연락합니다."], ["person", "복사·붙여넣기", "받은 엑셀을 하나의 표로 합칩니다."], ["person", "수치 확인", "빠진 값과 이상한 숫자를 눈으로 찾습니다."], ["person", "보고서 작성", "표를 보고 요약을 씁니다."], ["person", "메일 발송", "완성본을 정해진 사람에게 보냅니다."]],
    a: [["auto", "자동 수집", "정해진 시각에 각 지점 자료를 모읍니다."], ["auto", "형식 통일", "양식을 맞추고 누락을 표시합니다."], ["ai", "AI 요약", "변동과 이상치를 정리한 초안을 씁니다."], ["gate", "담당자 승인", "사람은 판단이 필요한 부분만 확인합니다."], ["auto", "보고·발송", "승인된 보고서를 만들어 보냅니다."], ["auto", "기록·알림", "모든 실행을 남기고 실패하면 알립니다."]],
    who: { person: "사람", ai: "AI", auto: "자동", gate: "사람 승인" },
    sumB: [["사람이 하는 단계", "6"], ["실행 기록", "없음"]], sumA: [["사람이 하는 단계", "1 · 판단만"], ["실행 기록", "모든 단계"]],
    note: "설명을 위한 예시입니다. 실제 설계는 업무와 기존 시스템에 따라 달라지며, 효과를 수치로 약속하지 않습니다." },
  e: { title: "Example · weekly performance report", before: "Today", after: "Redesigned",
    b: [["person", "Request data", "Someone emails every branch for figures."], ["person", "Chase replies", "Late replies get a second reminder."], ["person", "Copy & paste", "Spreadsheets are merged into one table."], ["person", "Check numbers", "Missing values and outliers are found by eye."], ["person", "Write report", "A summary is written from the table."], ["person", "Send", "The final version is emailed out."]],
    a: [["auto", "Collect", "Branch data is gathered at a set time."], ["auto", "Normalise", "Formats are aligned and gaps flagged."], ["ai", "AI draft", "Changes and outliers are summarised in a draft."], ["gate", "Approve", "A person checks only what needs judgement."], ["auto", "Report & send", "The approved report is generated and sent."], ["auto", "Log & alert", "Every run is recorded; failures raise an alert."]],
    who: { person: "Person", ai: "AI", auto: "Automated", gate: "Human approval" },
    sumB: [["Steps done by people", "6"], ["Run history", "None"]], sumA: [["Steps done by people", "1 · judgement only"], ["Run history", "Every step"]],
    note: "An illustrative example. Real designs depend on the work and the systems in place, and we do not promise results in numbers." },
};

// 1인 스튜디오가 일하는 방식 — 비교 우위 주장(가격·성과) 없이
export const DIFF = [
  { k: ["대표가 직접 듣고, 직접 설계합니다", "첫 상담부터 구현과 인수인계까지 같은 사람이 맡습니다. 전달 과정에서 요구가 바뀌지 않습니다."], e: ["The founder listens and designs, in person", "The same person handles everything from the first conversation to build and hand-over, so nothing is lost in translation."] },
  { k: ["판단이 빠릅니다", "내부 결재 단계가 없어 범위 조정과 기술 선택이 대화 안에서 정해집니다."], e: ["Decisions are quick", "With no internal sign-off chain, scope and technology choices are settled within the conversation."] },
  { k: ["전략과 구현이 끊기지 않습니다", "진단 보고서로 끝내지 않고, 그 설계를 실제로 작동하는 시스템으로 만듭니다."], e: ["Strategy and build stay connected", "The work does not stop at a diagnostic report; the design becomes a system that runs."] },
  { k: ["업무에 맞춰 기술을 고릅니다", "특정 도구를 팔지 않습니다. 기존 시스템과 예산, 운영할 사람에 맞는 방식을 택합니다."], e: ["Technology chosen to fit the work", "We do not resell a particular tool; we choose what fits your systems, budget and the people who will run it."] },
  { k: ["단계마다 산출물이 남습니다", "업무 지도, 설계서, 작동하는 결과물, 운영 기록. 다음 단계로 갈지는 그 산출물을 보고 정합니다."], e: ["Every stage leaves a deliverable", "Process maps, designs, working software and run records — each next step is decided on what you can see."] },
  { k: ["작은 과제에서 시작할 수 있습니다", "처음부터 큰 계약을 맺기보다, 검증할 수 있는 한 가지 업무로 시작합니다."], e: ["You can start small", "Rather than a large contract up front, we can begin with one piece of work that can be verified."] },
];

export const INDUSTRIES = [
  { k: ["법률", "양이 많고 정확성이 중요한 문서와 절차를 다루는 업무.", ["판례·문서 검색", "검토 보조 흐름", "사건 일정 관리"]], e: ["Legal", "Work with large volumes of precise documents and procedure.", ["Case-law & document search", "Review-support workflows", "Matter scheduling"]] },
  { k: ["부동산·프롭테크", "흩어진 공공 데이터와 공고를 모으고 조건에 맞게 정리하는 업무.", ["공고·실거래 수집", "조건별 후보 정리", "일정·알림"]], e: ["Real estate & proptech", "Gathering scattered public data and notices and sorting them by criteria.", ["Notice & transaction collection", "Candidates by criteria", "Dates & alerts"]] },
  { k: ["금융·전문서비스", "자료 취합과 보고, 검토·승인 기록이 반복되는 업무.", ["보고 자료 취합", "문의 분류", "검토·승인 기록"]], e: ["Finance & professional services", "Recurring gathering, reporting and review records.", ["Report data gathering", "Enquiry triage", "Review & approval logs"]] },
  { k: ["공공행정·정책", "공개 자료를 지속적으로 살피고 근거를 정리하는 업무.", ["공개 자료 모니터링", "이슈 정리", "근거 관리"]], e: ["Public administration & policy", "Continuously tracking public sources and organising evidence.", ["Public-source monitoring", "Issue briefs", "Evidence management"]] },
  { k: ["일반 기업의 반복 업무", "부서마다 매주, 매달 되풀이되는 정리와 전달.", ["주간 보고 자동화", "데이터 정리", "시스템 간 연결"]], e: ["Recurring work in any company", "The tidying and hand-offs every team repeats weekly and monthly.", ["Weekly report automation", "Data cleaning", "Connecting systems"]] },
];

// 대표 — 사용자가 확인해 준 사실만. 이름·학력·자격은 확인 전이라 쓰지 않는다.
export const FOUNDER = {
  k: { role: "아뜰리에 AX 대표", line: "업무 진단 · 시스템 설계 · 개발 · 운영 인수인계",
    facts: [["직접 하는 일", "업무 진단부터 설계, 개발, 운영 인수인계까지 직접 수행합니다."], ["실무 배경", "법무법인 경국에서 법률 실무 환경을 경험했습니다. 대표 개인의 경력이며, 경국은 아뜰리에 AX의 고객이나 협력 기관이 아닙니다."], ["공개 작업", "Atelier AX Studio · 국정 한눈에 · 집캐치"], ["관심 분야", "법률·부동산 업무의 AI 전환, 공공데이터 활용, AI 결과의 검증과 승인 구조"]] },
  e: { role: "Founder, Atelier AX", line: "Diagnosis · system design · engineering · hand-over",
    facts: [["Does personally", "Everything from process diagnosis to design, engineering and operational hand-over."], ["Background", "Experience of legal practice at the Korean law firm 법무법인 경국 — the founder's own career; the firm is not a client or partner of Atelier AX."], ["Public work", "Atelier AX Studio · Gukjeong at a Glance · ZipCatch"], ["Interests", "AI transformation in legal and real-estate work, public data, and verification and approval structures for AI"]] },
};

export const FAQ = {
  k: [["어떤 문제를 상담할 수 있나요?", "반복 업무 자동화, AI 도입 우선순위, 사내 도구 개발, 이미 쓰고 있는 AI·자동화의 점검 등입니다. 아직 정리되지 않은 고민도 괜찮습니다."],
    ["제안서나 요구사항 문서가 없어도 되나요?", "네. 지금 어떻게 일하고 있는지, 무엇이 불편한지만 알려 주시면 됩니다. 정리는 첫 대화에서 함께 합니다."],
    ["상담 후에는 어떻게 진행되나요?", "첫 대화에서 현재 흐름과 목표를 확인하고, 범위·일정·산출물을 제안드립니다. 합의한 범위에서 시작하며 단계마다 결과를 함께 봅니다."],
    ["기밀 자료는 어떻게 다루나요?", "첫 문의에는 기밀 자료나 고객 개인정보를 넣지 마세요. 필요한 경우 범위를 합의한 뒤 최소한의 자료만 합의한 방법으로 받고, 작업이 끝나면 반환하거나 삭제합니다. 요청하시면 비밀유지 약정을 먼저 맺고 시작합니다."],
    ["비용은 어떻게 정하나요?", "범위를 확인한 뒤 개별로 제안합니다. 정해진 패키지 가격은 두지 않습니다."]],
  e: [["What can we talk about?", "Automating repetitive work, prioritising AI adoption, building internal tools, or reviewing AI and automation you already run. An unstructured concern is fine too."],
    ["Do we need a proposal or requirements document?", "No. Tell us how the work is done today and what gets in the way; we structure it together in the first conversation."],
    ["What happens after the first conversation?", "We confirm the current flow and the goal, then propose scope, schedule and deliverables. Work starts within the agreed scope and results are reviewed at every stage."],
    ["How is confidential material handled?", "Please keep confidential documents and customers' personal data out of a first enquiry. If needed, we agree the scope first, receive only the minimum through an agreed channel, and return or delete it when the work ends. We can sign a non-disclosure agreement before starting."],
    ["How is pricing set?", "Individually, once the scope is clear. We do not sell fixed packages."]],
};

// 인사이트 — 발행된 글만 POSTS 에 넣는다(제목·날짜·요약·본문 HTML). 빈 배열이면 목록 대신 '준비 중인 주제'만 보인다.
export const POSTS = [];
export const TOPICS = {
  k: [["법률산업", "법률산업의 AI 전환", "문서와 절차가 많은 업무에서 무엇을 먼저 바꿔야 하는가."], ["에이전트", "AI 에이전트의 업무 적용과 한계", "에이전트에게 맡길 일과 맡기면 안 되는 일의 경계."], ["프로세스", "AI 도입 이전의 프로세스 혁신", "도구보다 먼저 정리해야 하는 업무 구조."], ["데이터", "부동산·공공데이터의 실무 활용", "공개 데이터를 실제 업무 판단에 쓰는 방법."], ["거버넌스", "AI 시스템의 검증·승인·책임 구조", "AI가 한 일을 누가, 어떻게 확인하는가."]],
  e: [["Legal", "AI transformation in the legal sector", "What to change first in document- and procedure-heavy work."], ["Agents", "AI agents at work: uses and limits", "Where to draw the line on what agents should and should not do."], ["Process", "Process innovation before AI", "The work structure to sort out before choosing tools."], ["Data", "Real estate and public data in practice", "Using open data for real operational decisions."], ["Governance", "Verification, approval and accountability for AI", "Who checks what AI has done, and how."]],
};
