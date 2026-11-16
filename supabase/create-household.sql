-- Run AFTER schema.sql and after creating accounts in Authentication > Users.
-- Replace the emails below. No user passwords or keys belong in this file.
-- Run once: duplicate membership attempts fail and roll back the entire block.
do $$
declare
  book uuid;
  owner_user uuid;
  family_user uuid;
begin
  select id into owner_user from auth.users where lower(email)=lower('REPLACE_OWNER_EMAIL');
  select id into family_user from auth.users where lower(email)=lower('REPLACE_FAMILY_EMAIL');
  if owner_user is null or family_user is null or owner_user = family_user then
    raise exception 'Create two distinct accounts and replace both email placeholders first';
  end if;
  insert into public.ledgers(name) values ('美國生活記帳') returning id into book;
  insert into public.ledger_members(ledger_id,user_id,role) values
    (book,owner_user,'owner'),(book,family_user,'viewer');
end $$;
-- Add more viewers later using the existing ledger ID (never create a new ledger):
-- insert into public.ledger_members(ledger_id,user_id,role)
-- select 'EXISTING_LEDGER_UUID'::uuid, id, 'viewer' from auth.users where email='FAMILY_EMAIL';
