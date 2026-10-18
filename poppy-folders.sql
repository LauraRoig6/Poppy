-- Poppy v6: ejecutar UNA VEZ en Supabase > SQL Editor.
-- No altera el sistema de sincronización anterior.
create table if not exists public.poppy_folders (
 user_id uuid not null references auth.users(id) on delete cascade,
 id uuid not null,
 name text not null check (length(name) between 1 and 70),
 movies jsonb not null default '[]'::jsonb check (jsonb_typeof(movies)='array'),
 updated_at bigint not null default 0,
 deleted boolean not null default false,
 primary key(user_id,id)
);
alter table public.poppy_folders enable row level security;
drop policy if exists "poppy_folders_owner" on public.poppy_folders;
create policy "poppy_folders_owner" on public.poppy_folders for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
revoke all on public.poppy_folders from anon;
grant select,insert,update on public.poppy_folders to authenticated;
