-- Atelier AX · AI 작업 브리지 이벤트 표. 서버 함수(service role)만 읽고 쓴다 — RLS 켜고 공개 정책 없음.
create table if not exists public.atelier_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  session text not null,
  source text not null default 'unknown',
  agent text not null default 'AI',
  project text,
  kind text not null,
  title text not null,
  detail text
);
create index if not exists atelier_events_at_idx on public.atelier_events (at desc);
create index if not exists atelier_events_session_idx on public.atelier_events (session, id);
alter table public.atelier_events enable row level security;
revoke all on public.atelier_events from anon, authenticated;
