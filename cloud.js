/* Authentication and storage boundary. No transaction persistence in localStorage. */
window.LedgerCloud = (() => {
  const elements = {
    gate: document.querySelector("#authGate"),
    form: document.querySelector("#loginForm"),
    email: document.querySelector("#loginEmail"),
    password: document.querySelector("#loginPassword"),
    login: document.querySelector("#loginButton"),
    reset: document.querySelector("#resetPassword"),
    status: document.querySelector("#cloudStatus"),
    shell: document.querySelector(".page-shell"),
    toolbar: document.querySelector("#accountToolbar"),
    account: document.querySelector("#accountLabel"),
    logout: document.querySelector("#logoutButton"),
    reload: document.querySelector("#reloadLedger"),
  };
  let client;
  let snapshot = null;
  let onState = () => {};
  let busy = false;
  let loading = false;
  let generation = 0;
  let recovery = /type=recovery/.test(location.hash);
  let userEmail = "";
  let sessionUser = null;
  let authenticated = false;
  let stale = false;
  let dirty = false;

  function status(message) { elements.status.textContent = message; }
  function showError(error) {
    const conflict = error?.code === "40001";
    if (conflict) stale = true;
    status(conflict ? "其他裝置已更新帳目。請先備份表單內容，再按「重新載入」後編輯。" : `操作未完成：${error?.message || "請確認網路後重試"}`);
  }
  function clear() {
    generation += 1;
    loading = false;
    busy = false;
    dirty = false;
    elements.shell.inert = false;
    snapshot = null;
    authenticated = false;
    sessionUser = null;
    stale = false;
    elements.shell.hidden = true;
    elements.gate.hidden = false;
    elements.toolbar.hidden = true;
    elements.account.textContent = "";
    elements.password.value = "";
    elements.password.removeAttribute("minlength");
    elements.password.autocomplete = "current-password";
    elements.password.placeholder = "密碼";
    elements.email.hidden = false;
    elements.email.required = true;
    elements.login.textContent = "登入";
    elements.reset.hidden = false;
    // One-time cleanup of legacy transaction cache, after migration/export step.
    localStorage.removeItem("us-ledger-cloud-cache");
    onState(null);
  }
  async function refresh(force = false) {
    if (!authenticated || loading || busy || recovery || (dirty && !force)) return;
    loading = true;
    const ticket = generation;
    try {
      const { data, error } = await client.rpc("ledger_snapshot");
      if (error) throw error;
      if (ticket !== generation) return;
      if (!data) {
        snapshot = null;
        elements.shell.hidden = true;
        onState(null);
        status("此帳號尚未加入帳本，請由管理者在 Supabase 設定成員。");
        return;
      }
      snapshot = data;
      stale = false;
      onState(snapshot);
      elements.gate.hidden = true;
      elements.shell.hidden = false;
      elements.account.textContent = `${userEmail} · ${data.role === "owner" ? "可編輯" : "唯讀"}`;
      status("已載入最新雲端帳目。");
    } catch (error) {
      if (ticket !== generation) return;
      // Hide old account data on a failed load; edits are blocked until reload.
      stale = true;
      elements.shell.hidden = true;
      showError(error);
    } finally { if (ticket === generation) loading = false; }
  }
  async function acceptSession(session) {
    const nextUser = session?.user?.id || null;
    if (nextUser !== sessionUser) clear();
    if (!session) return;
    sessionUser = nextUser;
    authenticated = true;
    userEmail = session.user.email || "";
    elements.toolbar.hidden = false;
    elements.account.textContent = userEmail;
    if (recovery) {
      elements.shell.hidden = true;
      elements.gate.hidden = false;
      elements.email.hidden = true;
      elements.email.required = false;
      elements.login.textContent = "設定新密碼";
      elements.password.autocomplete = "new-password";
      elements.password.minLength = 8;
      elements.password.placeholder = "新密碼（至少 8 個字元）";
      elements.reset.hidden = true;
      status("請輸入至少 8 個字元的新密碼。");
      return;
    }
    await refresh();
  }
  async function write(action, payload, expectedRevision = snapshot?.revision) {
    if (busy || loading) throw new Error("正在同步，請稍後重試。");
    if (stale) throw new Error("請先重新載入最新帳目。");
    if (snapshot?.role !== "owner") throw new Error("此帳號沒有修改權限。");
    const ticket = generation;
    busy = true;
    elements.shell.inert = true;
    status("正在儲存至雲端…");
    try {
      const { data, error } = await client.rpc("ledger_write", {
        p_ledger: snapshot.id, p_revision: expectedRevision, p_action: action, p_payload: payload,
      });
      if (error) throw error;
      if (ticket !== generation) return;
      snapshot.revision = data;
      busy = false;
      await refresh(true);
      if (stale) status("雲端已儲存，但畫面更新失敗。請重新載入，不要重複新增。");
    } finally {
      if (ticket === generation) { busy = false; elements.shell.inert = false; }
    }
  }
  async function start(callback) {
    onState = callback;
    clear();
    const config = window.LEDGER_CONFIG || {};
    if (!config.supabaseUrl || !config.publishableKey) {
      status("尚未設定 Supabase。請依 docs/SETUP.md 建立免費專案，再填寫 config.js。");
      elements.form.inert = true;
      return;
    }
    if (!/^https:\/\//.test(config.supabaseUrl) || !config.publishableKey.startsWith("sb_publishable_")) {
      status("連線設定無效，請使用 HTTPS Project URL 與 publishable key。");
      elements.form.inert = true;
      return;
    }
    if (!window.LedgerSupabase) {
      status("登入套件載入失敗，請執行 npm run vendor 後重試。");
      return;
    }
    client = LedgerSupabase.createClient(config.supabaseUrl, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal || AbortSignal.timeout(25000) }) },
    });
    client.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") recovery = true;
      if (event === "SIGNED_OUT") { recovery = false; clear(); }
      // Avoid awaiting Supabase requests inside its auth lock callback.
      if (["SIGNED_IN", "PASSWORD_RECOVERY"].includes(event)) {
        setTimeout(() => acceptSession(session).catch(showError), 0);
      }
    });
    elements.form.addEventListener("submit", async (event) => {
      event.preventDefault();
      elements.login.disabled = true;
      try {
        if (recovery) {
          const { error } = await client.auth.updateUser({ password: elements.password.value });
          if (error) throw error;
          recovery = false;
          location.hash = "";
          await client.auth.signOut({ scope: "local" });
          location.reload();
        } else {
          const { error } = await client.auth.signInWithPassword({ email: elements.email.value.trim(), password: elements.password.value });
          if (error) throw error;
          elements.password.value = "";
        }
      } catch (error) { showError(error); }
      finally { elements.login.disabled = false; }
    });
    elements.reset.addEventListener("click", async () => {
      if (!elements.email.reportValidity()) return;
      elements.reset.disabled = true;
      try {
        const { error } = await client.auth.resetPasswordForEmail(elements.email.value.trim(), { redirectTo: config.resetRedirectUrl });
        if (error) throw error;
        status("若帳號存在，將收到密碼重設郵件。請在瀏覽器開啟信中連結。");
      } catch (error) { showError(error); }
      finally { elements.reset.disabled = false; }
    });
    elements.logout.addEventListener("click", async () => {
      // Clear sensitive UI immediately even when network logout fails.
      clear();
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) showError(error);
      else status("已登出。");
    });
    elements.reload.addEventListener("click", async () => {
      if (busy || loading) return;
      if (!confirm("重新載入會清除尚未儲存的表單，確定繼續？")) return;
      document.querySelector("#cancelEdit").click();
      await refresh();
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refresh();
    });
    if (window.Capacitor?.isNativePlatform() && window.LedgerNative?.App) {
      LedgerNative.App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) refresh();
      }).catch(showError);
    }
    const { data, error } = await client.auth.getSession();
    if (error) showError(error);
    else await acceptSession(data.session);
    if (!data?.session) status("請使用管理者建立的帳號登入。");
  }
  async function download(filename, content, type) {
    if (window.Capacitor?.isNativePlatform()) {
      const { uri } = await LedgerNative.Filesystem.writeFile({ path: filename, data: content, directory: "CACHE", encoding: "utf8" });
      try { await LedgerNative.Share.share({ title: filename, files: [uri] }); }
      finally { await LedgerNative.Filesystem.deleteFile({ path: filename, directory: "CACHE" }); }
      return;
    }
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return {
    start, refresh, write, download, showError,
    set dirty(value) { dirty = value; },
    get revision() { return snapshot?.revision; },
    get settings() { return snapshot?.settings || {}; },
    get busy() { return busy || loading; },
  };
})();
