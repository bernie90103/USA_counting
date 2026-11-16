const base = "https://bernie90103.github.io/USA_counting/";
let failed = false;
for (const path of ["", "cloud.js", "data/transactions.json", "data/transactions.js"]) {
  const response = await fetch(`${base}${path}${path.startsWith("data/") ? "" : `?verify=${Date.now()}`}`, {
    cache: "no-store", signal: AbortSignal.timeout(20000),
  });
  if (path.startsWith("data/")) {
    console.log(`${path}: HTTP ${response.status} (expected 404)`);
    if (response.status !== 404) failed = true;
  } else {
    const body = await response.text();
    const matches = path === ""
      ? body.includes('id="authGate"') && !body.includes('id="loginPassword" type="password" autocomplete="current-password" minlength="8"')
      : body.includes('elements.password.removeAttribute("minlength")');
    console.log(`${path || "index.html"}: HTTP ${response.status}; latest login version ${matches}`);
    if (response.status !== 200 || !matches) failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
