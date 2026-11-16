const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const fs = require("node:fs");
const html = fs.readFileSync("index.html","utf8");
const app = fs.readFileSync("app.js","utf8");
const cloud = fs.readFileSync("cloud.js","utf8");
const tick = () => new Promise(resolve => setTimeout(resolve,20));
function createWindow() {
  const dom = new JSDOM(html,{runScripts:"outside-only",url:"https://example.com/"});
  const w = dom.window;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.confirm = () => true;
  return w;
}
test("unconfigured app shows setup and keeps private panels hidden",async()=>{
  const w=createWindow();
  w.eval(cloud); w.eval(app); await tick();
  assert.match(w.document.querySelector("#cloudStatus").textContent,/尚未設定/);
  assert.equal(w.document.querySelector(".page-shell").hidden,true);
  assert.equal(w.document.querySelector("#loginForm").inert,true);
  w.close();
});
test("owner saves only after success, preserves failed form; viewer cannot write; logout clears",async()=>{
  const w=createWindow();
  let callback, fail=false, role="owner", calls=[];
  const state={id:"ledger",revision:0,role,settings:{exchangeRate:32.5,deposits:[],pretripExpenses:[]},transactions:[]};
  w.LEDGER_CONFIG={supabaseUrl:"https://example.supabase.co",publishableKey:"sb_publishable_example"};
  const client={
    auth:{onAuthStateChange:fn=>{callback=fn;},getSession:async()=>({data:{session:{user:{id:"u",email:"u@example.com"}}}}),signOut:async()=>{callback("SIGNED_OUT",null);return {}; }},
    rpc:async(name,payload)=>{
      if(name==="ledger_snapshot") return {data:structuredClone(state)};
      calls.push(payload);
      if(fail) return {error:{message:"offline"}};
      state.transactions=[payload.p_payload]; state.revision++; return {data:state.revision};
    },
  };
  w.LedgerSupabase={createClient:()=>client};
  w.eval(cloud);w.eval(app);await tick();
  assert.equal(w.document.querySelector(".page-shell").hidden,false);
  w.document.querySelector("#monthFilter").value="pretrip";
  w.document.querySelector("#monthFilter").dispatchEvent(new w.Event("change"));
  assert.match(w.document.querySelector("#dailyAverageNote").textContent,/尚未匯入/);
  const amount=w.document.querySelector("#amount"),form=w.document.querySelector("#transactionForm");
  amount.value="12.34"; amount.dispatchEvent(new w.Event("input",{bubbles:true}));
  fail=true;form.dispatchEvent(new w.Event("submit",{cancelable:true}));await tick();
  assert.equal(amount.value,"12.34");
  assert.match(w.document.querySelector("#cloudStatus").textContent,/offline/);
  fail=false;form.dispatchEvent(new w.Event("submit",{cancelable:true}));await tick();
  assert.equal(state.transactions.length,1);
  assert.equal(amount.value,"");
  // Preserve a dirty form's original revision during automatic refresh.
  amount.value="45"; amount.dispatchEvent(new w.Event("input",{bubbles:true}));
  state.revision=9;
  await w.LedgerCloud.refresh();
  assert.equal(w.LedgerCloud.revision,1);
  w.document.querySelector("#cancelEdit").click();
  state.role="viewer";await w.LedgerCloud.refresh();
  assert.equal(w.document.querySelector("#exchangeRate").disabled,true);
  await assert.rejects(()=>w.LedgerCloud.write("insert",{}),/權限/);
  w.document.querySelector("#logoutButton").click();await tick();
  assert.equal(w.document.querySelector(".page-shell").hidden,true);
  assert.equal(w.document.querySelector("#transactionRows").children.length,0);
  assert.equal(w.document.querySelector("#loginPassword").value,"");
  w.close();
});
test("CSV export roundtrips quoted multiline notes and legacy income normalization",async()=>{
  const w=createWindow();w.eval(cloud);w.eval(app);await tick();
  const csv='date,type,category,merchant,paymentMethod,note,amount\r\n2026-11-15,income,rec center,lifegrade,現金,"two, lines\nwith ""quotes""",12.34';
  const parsed=w.eval(`parseCsv(${JSON.stringify(csv)})`);
  assert.equal(parsed[0].note,'two, lines\nwith "quotes"');
  const normalized=w.eval(`normalizeTransactions(${JSON.stringify(parsed)})`);
  assert.equal(normalized[0].merchant,"lifeguard");
  assert.throws(()=>w.eval('parseCsv("date,amount\\n2026-11-15,1")'),/欄位不完整/);
  w.close();
});
test("real vendor bundles load without a CDN or framework",()=>{
  const w=createWindow();
  w.eval(fs.readFileSync("vendor/supabase.js","utf8"));
  w.eval(fs.readFileSync("vendor/native.js","utf8"));
  assert.equal(typeof w.LedgerSupabase.createClient,"function");
  assert.equal(typeof w.LedgerNative.Filesystem.writeFile,"function");
  w.close();
});
test("password recovery form submits new password; reset mail uses HTTPS web return",async()=>{
  const w=createWindow();
  w.location.hash="#type=recovery";
  w.LEDGER_CONFIG={supabaseUrl:"https://example.supabase.co",publishableKey:"sb_publishable_example",resetRedirectUrl:"https://example.com/"};
  let update, mail, authChange;
  const client={auth:{
    onAuthStateChange:(callback)=>{authChange=callback;},
    getSession:async()=>({data:{session:{user:{id:"owner",email:"owner@example.com"}}}}),
    updateUser:async(input)=>{update=input;return {error:{message:"Test stops before navigation"}};},
    resetPasswordForEmail:async(...input)=>{mail=input;return {};},
  }};
  w.LedgerSupabase={createClient:()=>client};w.eval(cloud);w.eval(app);await tick();
  assert.equal(w.document.querySelector("#loginButton").textContent,"設定新密碼");
  assert.equal(w.document.querySelector("#loginPassword").minLength,8);
  assert.equal(w.document.querySelector(".page-shell").hidden,true);
  w.document.querySelector("#loginPassword").value="a-test-password";
  w.document.querySelector("#loginForm").dispatchEvent(new w.Event("submit",{cancelable:true}));await tick();
  assert.equal(update.password,"a-test-password");
  assert.match(w.document.querySelector("#cloudStatus").textContent,/Test stops/);
  authChange("SIGNED_OUT", null);
  assert.equal(w.document.querySelector("#loginPassword").hasAttribute("minlength"), false);
  assert.equal(w.document.querySelector("#loginEmail").hidden, false);
  assert.equal(w.document.querySelector("#loginButton").textContent, "登入");
  // Separate normal login state: reset mail request must use the configured web URL.
  w.close();
  const normal=createWindow();
  normal.LEDGER_CONFIG={supabaseUrl:"https://example.supabase.co",publishableKey:"sb_publishable_example",resetRedirectUrl:"https://example.com/"};
  client.auth.getSession=async()=>({data:{session:null}});
  normal.LedgerSupabase={createClient:()=>client};normal.eval(cloud);normal.eval(app);await tick();
  normal.document.querySelector("#loginEmail").value="family@example.com";
  normal.document.querySelector("#resetPassword").click();await tick();
  assert.equal(mail[0],"family@example.com");assert.equal(mail[1].redirectTo,"https://example.com/");
  normal.close();
});
test("native backup uses share sheet and removes temporary file",async()=>{
  const w=createWindow();let deleted=false,shared;
  w.Capacitor={isNativePlatform:()=>true};
  w.LedgerNative={Filesystem:{writeFile:async()=>({uri:"file:///private/test.json"}),deleteFile:async()=>{deleted=true;}},Share:{share:async(input)=>{shared=input;}}};
  w.eval(cloud);
  await w.LedgerCloud.download("test.json","{}","application/json");
  assert.equal(shared.files[0],"file:///private/test.json");assert.equal(deleted,true);
  w.close();
});
test("existing six-character password reaches Supabase login without a new-password length rule", async () => {
  const w = createWindow();
  let submitted;
  w.LEDGER_CONFIG = { supabaseUrl: "https://example.supabase.co", publishableKey: "sb_publishable_example" };
  w.LedgerSupabase = { createClient: () => ({ auth: {
    onAuthStateChange: () => {},
    getSession: async () => ({ data: { session: null } }),
    signInWithPassword: async (credentials) => { submitted = credentials; return {}; },
  } }) };
  w.eval(cloud);
  w.eval(app);
  await tick();
  w.document.querySelector("#loginEmail").value = "family@example.com";
  const password = w.document.querySelector("#loginPassword");
  password.value = "123456";
  assert.equal(password.hasAttribute("minlength"), false);
  assert.equal(w.document.querySelector("#loginForm").checkValidity(), true);
  w.document.querySelector("#loginButton").click();
  await tick();
  assert.equal(submitted.password, "123456");
  assert.equal(password.value, "");
  w.close();
});
