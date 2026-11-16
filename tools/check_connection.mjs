import fs from "node:fs";
import vm from "node:vm";
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL("../config.js", import.meta.url), "utf8"), context);
const config = context.window.LEDGER_CONFIG;
if (!config.supabaseUrl || !config.publishableKey) throw new Error("Configure config.js first");
for (const path of ["/auth/v1/settings", "/rest/v1/ledgers?select=id&limit=1"]) {
  try {
    const response = await fetch(config.supabaseUrl + path, {
      headers: { apikey: config.publishableKey }, signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (path.startsWith("/auth")) {
      console.log(`Auth settings: HTTP ${response.status}; email login ${data.external?.email ? "enabled" : "unconfirmed"}; public signup ${data.disable_signup ? "disabled" : "enabled or unconfirmed"}`);
    } else if (response.status === 200) {
      console.error("FAIL: Anonymous ledger read succeeded. Check table grants/RLS before importing data.");
      process.exitCode = 1;
    } else {
      console.log(`Anonymous ledger access: HTTP ${response.status}; code ${data.code || "unknown"}`);
      if (data.code === "PGRST205" || data.code === "42P01") console.log("Schema not installed: run supabase/schema.sql in SQL Editor.");
      else if (data.code === "42501") console.log("Table exists and anonymous access is denied, as expected.");
      else process.exitCode = 1;
    }
    if (response.status >= 500 || (path.startsWith("/auth") && !response.ok)) process.exitCode = 1;
  } catch (error) {
    console.error(`Connection check failed: ${error.cause?.code || error.name}`);
    process.exitCode = 1;
  }
}
