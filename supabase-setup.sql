-- Veckoplanering: tabell + säkerhetsregler. Klistra in i Supabase -> SQL Editor -> Run.
create table if not exists public.planner_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.planner_state enable row level security;

create policy "Läs egen rad"   on public.planner_state for select using (auth.uid() = user_id);
create policy "Skapa egen rad" on public.planner_state for insert with check (auth.uid() = user_id);
create policy "Ändra egen rad" on public.planner_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.planner_state;
