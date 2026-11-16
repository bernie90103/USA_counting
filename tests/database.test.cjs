const { test } = require("node:test");
const assert = require("node:assert/strict");
const { PGlite } = require("@electric-sql/pglite");
const fs = require("node:fs");

test("database enforces access, versions, and atomic replacement", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to anon,authenticated;
      grant execute on function auth.uid() to anon,authenticated;`);
    await db.exec(fs.readFileSync("supabase/schema.sql", "utf8"));
    const ledger = "10000000-0000-0000-0000-000000000001";
    const owner = "20000000-0000-0000-0000-000000000001";
    const viewer = "20000000-0000-0000-0000-000000000002";
    const stranger = "20000000-0000-0000-0000-000000000003";
    await db.exec(`insert into auth.users values ('${owner}'),('${viewer}'),('${stranger}');
      insert into public.ledgers(id) values ('${ledger}');
      insert into public.ledger_members values ('${ledger}','${owner}','owner'),('${ledger}','${viewer}','viewer');`);
    async function as(user, role = "authenticated") {
      await db.exec(`reset role; set role ${role}; set request.jwt.claim.sub='${user}';`);
    }
    async function snapshot() { return (await db.query("select public.ledger_snapshot() as value")).rows[0].value; }
    async function write(revision, action, payload) {
      return (await db.query("select public.ledger_write($1,$2,$3,$4) as revision", [ledger,revision,action,JSON.stringify(payload)])).rows[0].revision;
    }
    const transaction = { id: "legacy-ID",date:"2026-11-15",type:"expense",category:"超市",merchant:"Trader Joe's",paymentMethod:"現金",note:"line 1\nline 2",amount:12.34 };
    await as("", "anon");
    await assert.rejects(snapshot, /permission denied/);
    await assert.rejects(() => write(0,"insert",transaction), /permission denied/);
    await as(stranger);
    assert.equal(await snapshot(), null);
    assert.equal((await db.query("select * from transactions")).rows.length,0);
    await assert.rejects(() => write(0,"insert",transaction), /Forbidden/);
    await as(viewer);
    assert.equal((await snapshot()).role,"viewer");
    await assert.rejects(() => write(0,"insert",transaction), /Forbidden/);
    await assert.rejects(() => db.exec("update ledger_members set role='owner'"), /permission denied/);
    await assert.rejects(() => db.exec("update ledgers set revision=99"), /permission denied/);
    await as(owner);
    assert.equal(Number(await write(0,"insert",transaction)),1);
    await assert.rejects(() => write(0,"update",{ ...transaction,amount:99 }), /Conflict/);
    assert.equal(Number((await snapshot()).transactions[0].amount),12.34);
    await assert.rejects(() => write(1,"replace",{ transactions:[transaction,{...transaction,id:"bad",amount:-1}] }), /check constraint/);
    assert.equal((await snapshot()).transactions.length,1);
    assert.equal((await snapshot()).revision,1);
    await assert.rejects(() => write(1,"replace",{ transactions:[transaction,transaction] }), /Duplicate/);
    await assert.rejects(() => write(1,"replace",{ transactions:[transaction], settings:{exchangeRate:0} }), /Invalid settings/);
    assert.equal((await snapshot()).revision,1);
    await write(1,"update",{...transaction,merchant:"Amazon",amount:23.45});
    await write(2,"settings",{exchangeRate:32,deposits:[{date:"2026-01-01",amount:500}],pretripExpenses:[{group:"必要花費",item:"Flight",twd:100,rate:30,usd:3.33}]});
    const state = await snapshot();
    assert.equal(state.settings.pretripExpenses[0].rate,30);
    await write(3,"delete",{id:transaction.id});
    assert.equal((await snapshot()).transactions.length,0);
    // A complete snapshot must include more than the default PostgREST row limit.
    const many = Array.from({length:1100},(_,i)=>({...transaction,id:`id-${i}`}));
    await write(4,"replace",{transactions:many});
    assert.equal((await snapshot()).transactions.length,1100);
    await as(viewer);
    assert.equal((await snapshot()).transactions.length,1100);
  } finally { await db.close(); }
});
