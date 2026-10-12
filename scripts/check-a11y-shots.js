// Accessibility snapshots: renders home + one endpoint under Windows High
// Contrast emulation (forcedColors) and extra contrast (contrast: more).
// Saves PNGs under screenshots/ for manual review.
// Usage: `npm run check:a11y-shots` (uses the production build).
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

const PORTS = [3209, 3210, 3211, 3212];
const SHOTS = [
  ["home-forced", "/", { forcedColors: "active" }],
  ["home-more", "/", { contrast: "more" }],
  ["endpoint-forced", "/docs/users/login", { forcedColors: "active" }],
  ["endpoint-more", "/docs/users/login", { contrast: "more" }],
];

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
  const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextBin, "start", "--port", String(PORT)], {
    cwd: path.join(__dirname, ".."),
    shell: false,
    stdio: "ignore",
  });
  const base = `http://localhost:${PORT}`;
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(base).then((r) => r.text());
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  const outDir = path.join(__dirname, "..", "screenshots");
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: exes[0] });
  try {
    for (const [name, url, emu] of SHOTS) {
      const ctx = await browser.newContext({ viewport: { width: 1024, height: 800 }, ...emu });
      const page = await ctx.newPage();
      await page.goto(base + url, { waitUntil: "networkidle" });
      const file = path.join(outDir, `${name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log("saved", file);
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }
  console.log("DONE — review screenshots/ manually.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
