-- Run once in Supabase SQL Editor. Accounts and memberships are admin-managed.
begin;
create table public.ledgers (
  id uuid primary key default gen_random_uuid(),
  name text not null default '美國生活記帳',
  revision bigint not null default 0,
  settings jsonb not null default '{"exchangeRate":32.5,"rateUpdatedAt":null,"deposits":[],"pretripExpenses":[]}'::jsonb
);
create table public.ledger_members (
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','viewer')),
  primary key (ledger_id,user_id),
  unique (user_id)
);
create table public.transactions (
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  date date not null,
  type text not null check (type in ('income','expense')),
  category text not null,
  merchant text not null default '',
  "paymentMethod" text not null,
  note text not null default '',
  amount numeric(14,2) not null check (amount > 0 and amount < 1000000000000),
  position bigint not null default 0,
  primary key (ledger_id,id)
);
create index transactions_date on public.transactions(ledger_id,date);
alter table public.ledgers enable row level security;
alter table public.ledger_members enable row level security;
alter table public.transactions enable row level security;
-- No write grants or write policies: all client writes go through the locked RPC.
revoke all on public.ledgers, public.ledger_members, public.transactions from public, anon, authenticated;
grant select on public.ledgers, public.ledger_members, public.transactions to authenticated;
create policy own_membership on public.ledger_members for select to authenticated using (user_id = (select auth.uid()));
create policy member_ledger on public.ledgers for select to authenticated using (
  exists (select 1 from public.ledger_members m where m.ledger_id = id and m.user_id = (select auth.uid()))
);
create policy member_transactions on public.transactions for select to authenticated using (
  exists (select 1 from public.ledger_members m where m.ledger_id = transactions.ledger_id and m.user_id = (select auth.uid()))
);
-- A single statement snapshot avoids pagination limits and mixed revisions.
create function public.ledger_snapshot() returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('id', l.id, 'role', m.role, 'revision', l.revision, 'settings', l.settings,
    'transactions', coalesce((select jsonb_agg(to_jsonb(t) - 'ledger_id' - 'position' order by t.position, t.id)
      from public.transactions t where t.ledger_id = l.id), '[]'::jsonb))
  from public.ledgers l join public.ledger_members m on m.ledger_id = l.id where m.user_id = auth.uid();
$$;
create function public.ledger_write(p_ledger uuid, p_revision bigint, p_action text, p_payload jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  current_revision bigint;
  entry jsonb;
  entries jsonb;
  seq bigint := 0;
  next_position bigint;
  config jsonb;
begin
  -- Check membership before taking the lock; callers cannot choose their role.
  if not exists (select 1 from public.ledger_members where ledger_id = p_ledger and user_id = auth.uid() and role = 'owner') then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  select revision into current_revision from public.ledgers where id = p_ledger for update;
  if p_revision is distinct from current_revision then
    raise exception 'Conflict: reload ledger before editing' using errcode = '40001';
  end if;
  if p_action = 'delete' then
    delete from public.transactions where ledger_id = p_ledger and id = p_payload->>'id';
    if not found then raise exception 'Transaction no longer exists'; end if;
  elsif p_action in ('insert','update','replace') then
    if p_action = 'replace' then
      entries := p_payload->'transactions';
      if jsonb_typeof(entries) is distinct from 'array' or jsonb_array_length(entries) = 0 then
        raise exception 'Import must contain transactions';
      end if;
      if (select count(*) from jsonb_array_elements(entries)) <> (select count(distinct value->>'id') from jsonb_array_elements(entries)) then
        raise exception 'Duplicate or missing transaction IDs';
      end if;
      delete from public.transactions where ledger_id = p_ledger;
    else
      entries := jsonb_build_array(p_payload);
    end if;
    select coalesce(min(position),0)-1 into next_position from public.transactions where ledger_id = p_ledger;
    for entry in select value from jsonb_array_elements(entries) loop
      if entry->>'id' is null or entry->>'category' is null or entry->>'paymentMethod' is null
        or (entry->>'amount')::numeric <> round((entry->>'amount')::numeric,2) then
        raise exception 'Invalid transaction';
      end if;
      if p_action = 'update' then
        update public.transactions set date=(entry->>'date')::date, type=entry->>'type',category=entry->>'category',
          merchant=coalesce(entry->>'merchant',''), "paymentMethod"=entry->>'paymentMethod',note=coalesce(entry->>'note',''),amount=(entry->>'amount')::numeric
          where ledger_id=p_ledger and id=entry->>'id';
        if not found then raise exception 'Transaction no longer exists'; end if;
      else
        insert into public.transactions(ledger_id,id,date,type,category,merchant,"paymentMethod",note,amount,position)
        values(p_ledger,entry->>'id',(entry->>'date')::date,entry->>'type',entry->>'category',coalesce(entry->>'merchant',''),entry->>'paymentMethod',coalesce(entry->>'note',''),(entry->>'amount')::numeric,
          case when p_action='replace' then seq else next_position end);
      end if;
      seq := seq+1;
    end loop;
  elsif p_action <> 'settings' then
    raise exception 'Unknown action';
  end if;
  if p_action = 'settings' or (p_action = 'replace' and p_payload ? 'settings') then
    config := case when p_action='settings' then p_payload else p_payload->'settings' end;
    if jsonb_typeof(config) is distinct from 'object' or not (config ?& array['exchangeRate','deposits','pretripExpenses'])
      or (config->>'exchangeRate')::numeric is null or (config->>'exchangeRate')::numeric <= 0
      or (config->>'exchangeRate')::numeric > 1000
      or jsonb_typeof(config->'deposits') is distinct from 'array'
      or jsonb_typeof(config->'pretripExpenses') is distinct from 'array' then
      raise exception 'Invalid settings';
    end if;
    for entry in select value from jsonb_array_elements(config->'deposits') loop
      if (entry->>'amount')::numeric is null or (entry->>'amount')::numeric < 0 or (entry->>'date')::date is null then
        raise exception 'Invalid deposit';
      end if;
    end loop;
    for entry in select value from jsonb_array_elements(config->'pretripExpenses') loop
      if entry->>'item' is null or entry->>'group' is null or (entry->>'twd')::numeric is null or (entry->>'twd')::numeric < 0
        or (entry ? 'rate' and (entry->>'rate')::numeric <= 0) then raise exception 'Invalid pretrip expense'; end if;
    end loop;
    update public.ledgers set settings=config where id=p_ledger;
  end if;
  update public.ledgers set revision=revision+1 where id=p_ledger returning revision into current_revision;
  return current_revision;
end;
$$;
revoke all on function public.ledger_write(uuid,bigint,text,jsonb), public.ledger_snapshot() from public, anon;
grant execute on function public.ledger_write(uuid,bigint,text,jsonb), public.ledger_snapshot() to authenticated;
commit;
