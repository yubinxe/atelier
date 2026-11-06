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
