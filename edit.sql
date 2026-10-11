-- edit.sql — ТОЛЬКО новые таблицы. Существующие таблицы/auth не изменяются.
-- Выполнить в Supabase → SQL Editor. Пока не выполнено, приложение работает на моковых данных.
create table if not exists public.campus_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null, grp text, bio text, skills text[] default '{}',
  role text not null default 'student' check (role in ('student','moderator','admin')),
  points int not null default 0);
create table if not exists public.campus_grades (
  user_id uuid references auth.users(id) on delete cascade, subject text not null,
  avg int not null, attendance int not null, primary key (user_id, subject));
create table if not exists public.campus_schedule (
  id bigserial primary key, weekday int not null check (weekday between 0 and 4),
  starts text not null, ends text not null, subject text not null, room text, kind text, teacher text);
create table if not exists public.campus_events (
  id bigserial primary key, event_date date not null, title text not null, place text, tag text);
create table if not exists public.campus_teams (
  id bigserial primary key, title text not null, cat text not null, descr text,
  leader uuid references auth.users(id), need text[] default '{}', slots int default 3, hidden boolean default false);
create table if not exists public.campus_team_members (
  team_id bigint references public.campus_teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, primary key (team_id, user_id));
create table if not exists public.campus_applications (
  id bigserial primary key, team_id bigint references public.campus_teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, msg text,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz default now());
create table if not exists public.campus_messages (
  id bigserial primary key, team_id bigint references public.campus_teams(id) on delete cascade,
  user_id uuid references auth.users(id), body text not null, created_at timestamptz default now());

do $$ declare t text; begin
  foreach t in array array['campus_profiles','campus_grades','campus_schedule','campus_events','campus_teams','campus_team_members','campus_applications','campus_messages']
  loop execute format('alter table public.%I enable row level security', t); end loop; end $$;

create or replace function public.campus_is_staff() returns boolean language sql stable security definer as
$$ select exists (select 1 from public.campus_profiles where id = auth.uid() and role in ('moderator','admin')) $$;
create or replace function public.campus_is_member(tid bigint) returns boolean language sql stable security definer as
$$ select exists (select 1 from public.campus_team_members where team_id = tid and user_id = auth.uid()) $$;

create policy "profiles read" on public.campus_profiles for select to authenticated using (true);
create policy "profiles own write" on public.campus_profiles for all to authenticated using (id = auth.uid() or campus_is_staff()) with check (id = auth.uid() or campus_is_staff());
create policy "grades own" on public.campus_grades for select to authenticated using (user_id = auth.uid() or campus_is_staff());
create policy "schedule read" on public.campus_schedule for select to authenticated using (true);
create policy "events read" on public.campus_events for select to authenticated using (true);
create policy "teams read" on public.campus_teams for select to authenticated using (not hidden or campus_is_staff());
create policy "teams create" on public.campus_teams for insert to authenticated with check (leader = auth.uid());
create policy "teams staff" on public.campus_teams for update to authenticated using (leader = auth.uid() or campus_is_staff());
create policy "members read" on public.campus_team_members for select to authenticated using (true);
create policy "apps apply" on public.campus_applications for insert to authenticated with check (user_id = auth.uid());
create policy "apps read" on public.campus_applications for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.campus_teams t where t.id = team_id and t.leader = auth.uid()) or campus_is_staff());
create policy "apps decide" on public.campus_applications for update to authenticated using (exists (select 1 from public.campus_teams t where t.id = team_id and t.leader = auth.uid()));
create policy "msgs read" on public.campus_messages for select to authenticated using (campus_is_member(team_id));
create policy "msgs write" on public.campus_messages for insert to authenticated with check (user_id = auth.uid() and campus_is_member(team_id));
-- Leader добавляет принятого участника:
create policy "members add" on public.campus_team_members for insert to authenticated with check (exists (select 1 from public.campus_teams t where t.id = team_id and t.leader = auth.uid()));
