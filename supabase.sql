-- Poppy: ejecutar una sola vez en Supabase > SQL Editor > New query > Run.
-- Cada cuenta solo puede leer y escribir sus propios datos.
create table if not exists public.poppy_records (
 user_id uuid not null references auth.users(id) on delete cascade,
 movie_id text not null check (movie_id ~ '^[0-9]{1,10}$'),
 payload jsonb not null check (jsonb_typeof(payload) = 'object'),
 revision bigint not null default 0,
 primary key (user_id, movie_id)
);
alter table public.poppy_records enable row level security;
drop policy if exists "poppy_owner" on public.poppy_records;
create policy "poppy_owner" on public.poppy_records for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.poppy_records from anon;
grant select, insert, update on public.poppy_records to authenticated;
-- Una consulta atómica: conserva la versión más reciente de cada película.
-- Las eliminaciones son tombstones para que otro dispositivo no las resucite.
create or replace function public.poppy_sync(changes jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare item record; rev bigint; answer jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if jsonb_typeof(changes) <> 'object' or octet_length(changes::text)>10000000 then raise exception 'Invalid payload'; end if;
 for item in select * from jsonb_each(changes) loop
  if item.key !~ '^[0-9]{1,10}$' or jsonb_typeof(item.value) <> 'object' then raise exception 'Invalid record'; end if;
  rev := coalesce((item.value->>'updatedAt')::bigint,0);
  if rev < 0 or rev > (extract(epoch from now())*1000)::bigint + 300000 then raise exception 'Check device clock'; end if;
  insert into public.poppy_records(user_id,movie_id,payload,revision)
  values(auth.uid(),item.key,item.value,rev)
  on conflict(user_id,movie_id) do update set payload=excluded.payload,revision=excluded.revision
  where poppy_records.revision < excluded.revision;
 end loop;
 select coalesce(jsonb_object_agg(movie_id,payload),'{}'::jsonb) into answer
 from public.poppy_records where user_id=auth.uid();
 return answer;
end; $$;
revoke all on function public.poppy_sync(jsonb) from public, anon;
grant execute on function public.poppy_sync(jsonb) to authenticated;
