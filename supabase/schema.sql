-- شغّل الملف ده كله مرة واحدة في Supabase: SQL Editor -> New query -> Run

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table public.tickets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  rider_name text not null,
  from_station text not null,
  to_station text not null,
  fare int not null,
  stops int not null,
  pay text not null,
  exp timestamptz not null,
  created_at timestamptz not null default now()
);

-- أنشئ بروفايل تلقائيًا أول ما حد يسجّل
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- يمنع أي مستخدم عادي من إنه يرقّي نفسه أدمن
create function public.protect_role() returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and not coalesce(public.is_admin(), false) and auth.uid() is not null then
    raise exception 'not allowed';
  end if;
  return new;
end $$;
create trigger protect_role before update on public.profiles for each row execute function public.protect_role();

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;

create policy "profiles: read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "tickets: read own or admin" on public.tickets for select using (user_id = auth.uid() or public.is_admin());
create policy "tickets: insert own" on public.tickets for insert with check (user_id = auth.uid());

-- لعمل أول أدمن (بعد ما تسجّل بإيميلك): غيّر الإيميل وشغّل السطر ده
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'your@email.com');
