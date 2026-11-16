import { build } from "esbuild";
await build({
  stdin: { contents: 'export { createClient } from "@supabase/supabase-js";', resolveDir: process.cwd() },
  bundle: true, format: "iife", globalName: "LedgerSupabase", platform: "browser",
  outfile: "vendor/supabase.js", minify: true, legalComments: "eof",
});

await build({
  stdin: { contents: 'export { Filesystem } from "@capacitor/filesystem"; export { Share } from "@capacitor/share"; export { App } from "@capacitor/app";', resolveDir: process.cwd() },
  bundle: true, format: "iife", globalName: "LedgerNative", platform: "browser",
  outfile: "vendor/native.js", minify: true, legalComments: "eof",
});
