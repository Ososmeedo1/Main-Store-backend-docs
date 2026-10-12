// Overflow guard: fails if any page scrolls horizontally at any width.
// Pages: home, one endpoint, docs index. Widths: 320/375/768/1024/1440.
// Usage: `npm run check:overflow` (builds first, starts prod server itself).
// Needs a Chromium binary: `npx playwright install chromium`, or reuse the
// OS cache (PLAYWRIGHT_BROWSERS_PATH / %USERPROFILE%/AppData/Local/ms-playwright).
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

const WIDTHS = [320, 375, 768, 1024, 1440];
const PATHS = ["/", "/docs", "/docs/users/login"];
const PORTS = [3199, 3201, 3202, 3203, 3204];

function candidateExecutables() {
  const cands = [];
  if (process.env.PLAYWRIGHT_CHROME_PATH) cands.push(process.env.PLAYWRIGHT_CHROME_PATH);
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH ||
    path.join(os.homedir(), "AppData", "Local", "ms-playwright");
  try {
    for (const d of fs.readdirSync(cache)) {
      cands.push(path.join(cache, d, "chrome-win64", "chrome.exe"));
      cands.push(path.join(cache, d, "chrome-win", "chrome.exe"));
    }
  } catch {}
  return [...new Set(cands)].filter((p) => { try { return fs.existsSync(p); } catch { return false; } });
}

async function main() {
  const { chromium } = require("playwright-core");
  const exes = candidateExecutables();
  if (exes.length === 0) {
    console.error("No Chromium found. Run: npx playwright install chromium");
    process.exit(2);
  }
  // Spawn node directly (no shell, no deprecation warnings; works on win32).
  const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
  // Pick a free port first: a zombie server from an interrupted run would
  // otherwise serve a stale build and poison every measurement.
  let PORT = null;
  for (const p of PORTS) {
    try {
      await fetch(`http://localhost:${p}`).then((r) => r.text());
    } catch {
      PORT = p;
      break;
    }
  }
  if (!PORT) {
    console.error("All candidate ports busy. Kill leftover servers and retry.");
    process.exit(2);
  }
  const server = spawn(process.execPath, [nextBin, "start", "--port", String(PORT)], {
    cwd: path.join(__dirname, ".."),
    shell: false,
    stdio: "ignore",
  });
  const base = `http://localhost:${PORT}`;
  // wait for server
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(base).then((r) => r.text());
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.log("chromium:", exes[0]);
  const browser = await chromium.launch({ executablePath: exes[0] });
  let fail = 0;
  async function measure(page, label, w) {
    const over = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    const ok = over.scroll <= over.client;
    if (!ok) fail++;
    console.log(`${ok ? "PASS" : "FAIL"} w=${w} ${label} scrollWidth=${over.scroll} clientWidth=${over.client}`);
  }
  try {
    for (const w of WIDTHS) {
      const page = await browser.newPage({ viewport: { width: w, height: 800 } });
      for (const p of PATHS) {
        await page.goto(base + p, { waitUntil: "networkidle" });
        // The playground is client-only (ssr:false): wait for it to hydrate
        // so its markup is included in the measurement.
        await page
          .getByRole("button", { name: /send request/i })
          .first()
          .waitFor({ timeout: 8000 })
          .catch(() => {});
        await measure(page, p, w);
      }
      // Endpoint with a real response shown (long JSON in scroll wells).
      await page.goto(base + "/docs/users/login", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Send request" }).first().click();
      await page
        .getByRole("button", { name: "Copy response" })
        .waitFor({ timeout: 30000 })
        .catch(() => {});
      await measure(page, "/docs/users/login + response", w);
      // Authorize dialog open.
      await page.getByRole("button", { name: /authorize/i }).first().click();
      await page.getByRole("dialog", { name: "Authorize" }).waitFor({ timeout: 8000 }).catch(() => {});
      await measure(page, "authorize dialog", w);
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }
  if (fail > 0) {
    console.error(`${fail} overflow case(s). Fix layout (min-w-0, wells, no 100vw).`);
    process.exit(1);
  }
  console.log("ALL PASS — no horizontal page scroll.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
