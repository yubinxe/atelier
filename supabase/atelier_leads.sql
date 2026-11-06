-- Atelier AX · 상담 문의 표. 공개 키(anon)는 INSERT 만, 읽기·수정·삭제는 대시보드(서비스 키)에서만.
create table if not exists public.atelier_leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 60),
  company text check (char_length(company) <= 100),
  email text not null check (char_length(email) between 5 and 200),
  service text check (char_length(service) <= 40),
  stage text check (char_length(stage) <= 40),
  message text not null check (char_length(message) between 10 and 4000),
  locale text check (char_length(locale) <= 5),
  consent boolean not null check (consent),
  fingerprint text not null check (char_length(fingerprint) = 64)
);
create unique index if not exists atelier_leads_dedupe on public.atelier_leads (fingerprint);
alter table public.atelier_leads enable row level security;
revoke all on public.atelier_leads from anon, authenticated;
grant insert on public.atelier_leads to anon;
drop policy if exists atelier_leads_insert on public.atelier_leads;
create policy atelier_leads_insert on public.atelier_leads for insert to anon with check (consent);
-- 보관 기간(문의 처리 후 1년) 정리: 처리 완료 1년이 지난 문의를 대시보드에서 주기적으로 삭제한다.
