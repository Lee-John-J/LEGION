-- LEGION — Supabase Database Schema
-- Safe to re-run: drops old policies first, renames old tables if needed.

-- ═══════════════════════════════════════════════════════════════
-- STEP 1: Clean up old policies (so this script can be re-run)
-- ═══════════════════════════════════════════════════════════════

-- Drop old policies on the "operatives" table (from prior scaffold)
do $$ begin
  drop policy if exists "operatives: own record" on operatives;
exception when undefined_table then null;
end $$;

-- Rename old "operatives" table → "operators" if it exists
do $$ begin
  if exists (select 1 from information_schema.tables where table_name = 'operatives' and table_schema = 'public') then
    alter table operatives rename to operators;
    -- Also rename old index
    alter index if exists idx_operatives_user_id rename to idx_operators_user_id;
  end if;
end $$;

-- Drop existing policies on all tables (safe if they don't exist)
drop policy if exists "operators: own record" on operators;
drop policy if exists "cells: members can read" on cells;
drop policy if exists "cells: authenticated can create" on cells;
drop policy if exists "cell_members: visible to members" on cell_members;
drop policy if exists "cell_members: self insert" on cell_members;
drop policy if exists "cell_members: handler or self delete" on cell_members;
drop policy if exists "matches: authenticated read" on matches;
drop policy if exists "matches: authenticated insert" on matches;
drop policy if exists "matches: authenticated update" on matches;

-- ═══════════════════════════════════════════════════════════════
-- STEP 2: Create tables (IF NOT EXISTS keeps them safe on re-run)
-- ═══════════════════════════════════════════════════════════════

-- Operators: one row per user, stores their Riot ID + PUUID
create table if not exists operators (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade unique not null,
  puuid       text unique,
  riot_game_name text,
  riot_tag_line  text,
  is_verified boolean default false,
  created_at  timestamptz default now()
);

-- Cells: named friend groups
-- created_by is ON DELETE SET NULL: a cell survives its creator's account
-- deletion (members keep their data; the cell is simply handler-less).
create table if not exists cells (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- Backfill: add invite_code column if table already exists without it
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'cells' and column_name = 'invite_code'
  ) then
    alter table cells add column invite_code text unique;
  end if;
end $$;

-- Backfill: ensure created_by has ON DELETE SET NULL on pre-existing tables
-- (the pre-audit schema had no delete rule, which made deleting any
-- cell-creating user fail with an FK violation).
do $$ begin
  if exists (
    select 1 from information_schema.referential_constraints
    where constraint_name = 'cells_created_by_fkey' and delete_rule <> 'SET NULL'
  ) then
    alter table cells drop constraint cells_created_by_fkey;
    alter table cells add constraint cells_created_by_fkey
      foreign key (created_by) references auth.users(id) on delete set null;
  end if;
end $$;

-- Cell membership: many-to-many between users and cells
create table if not exists cell_members (
  id       uuid primary key default gen_random_uuid(),
  cell_id  uuid references cells(id) on delete cascade not null,
  user_id  uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(cell_id, user_id)
);

-- Match cache: stores raw Riot API match data to avoid re-fetching
create table if not exists matches (
  match_id             text primary key,
  match_data           jsonb not null,
  participants_puuids  text[] not null default '{}',
  fetched_at           timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- STEP 3: Create indexes
-- ═══════════════════════════════════════════════════════════════

create index if not exists idx_cell_members_cell_id on cell_members(cell_id);
create index if not exists idx_cell_members_user_id on cell_members(user_id);
create index if not exists idx_operators_user_id on operators(user_id);
create index if not exists idx_cells_created_by on cells(created_by);
create index if not exists idx_matches_participants on matches using gin(participants_puuids);

-- ═══════════════════════════════════════════════════════════════
-- STEP 4: Enable Row Level Security
-- ═══════════════════════════════════════════════════════════════

alter table operators enable row level security;
alter table cells enable row level security;
alter table cell_members enable row level security;
alter table matches enable row level security;

-- The anon role gets no table access at all: the browser client uses Supabase
-- for auth only, so unauthenticated visitors have nothing to read here. This
-- also hides the tables from anonymous GraphQL introspection.
revoke all on operators, cells, cell_members, matches from anon;

-- ═══════════════════════════════════════════════════════════════
-- STEP 5: Helper function for RLS (avoids infinite recursion)
-- ═══════════════════════════════════════════════════════════════

-- security definer runs with the function owner's privileges,
-- bypassing RLS on cell_members so policies can check membership
-- without triggering themselves.
create or replace function public.is_member_of_cell(p_cell_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from cell_members
    where cell_id = p_cell_id and user_id = auth.uid()
  );
$$;

-- Signed-in users need EXECUTE (the RLS policies below call this as the
-- querying user), but anon must not be able to probe membership.
revoke execute on function public.is_member_of_cell(uuid) from public, anon;

-- ═══════════════════════════════════════════════════════════════
-- STEP 6: Create policies (dropped in Step 1, so always fresh)
--
-- SECURITY MODEL (2026-08-19 audit): the browser client talks to Supabase for
-- AUTH ONLY. Every table write goes through the Express server, which uses the
-- service role and does its own membership/handler checks. RLS therefore
-- grants end users READ access (plus self-scoped operator writes and the two
-- delete paths), and deliberately defines NO insert/update policies for
-- cells, cell_members, or matches — a client-side write must be denied.
-- auth.uid() is wrapped in (select ...) so Postgres evaluates it once per
-- query instead of once per row (Supabase perf lint 0003).
-- ═══════════════════════════════════════════════════════════════

-- Operators: users can read/write their own record
create policy "operators: own record" on operators
  for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Cells: members can read cells they belong to
create policy "cells: members can read" on cells
  for select using (
    created_by = (select auth.uid()) or public.is_member_of_cell(id)
  );

-- Cell members: visible to other members of the same cell
create policy "cell_members: visible to members" on cell_members
  for select using (
    user_id = (select auth.uid()) or public.is_member_of_cell(cell_id)
  );

-- Cell members: handler can remove members; members can leave
create policy "cell_members: handler or self delete" on cell_members
  for delete using (
    user_id = (select auth.uid())
    or exists (select 1 from cells where id = cell_members.cell_id and created_by = (select auth.uid()))
  );

-- Cells: handler can dissolve
create policy "cells: handler can delete" on cells
  for delete using (created_by = (select auth.uid()));

-- Matches: any authenticated user can read (game data is public)
create policy "matches: authenticated read" on matches
  for select using ((select auth.uid()) is not null);
