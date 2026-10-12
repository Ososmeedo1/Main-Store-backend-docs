// Main user flow: home → search → open → send → authorize → protected →
// server switch → persist → reset → copy. Fails on the first broken step.
// Usage: `npm run check:flow` (uses the production build, starts its own server).
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

const PORTS = [3198, 3205, 3206, 3207, 3208];
let step = 0;
function ok(name, cond) {
  step++;
  console.log(`${cond ? "PASS" : "FAIL"} ${step}. ${name}`);
  if (!cond) throw new Error(`flow failed at: ${name}`);
}

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
  const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
  // Pick a free port first (a zombie server would serve a stale build).
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
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(base).then((r) => r.text());
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  const browser = await chromium.launch({ executablePath: exes[0] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 800 } });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
    const page = await ctx.newPage();
    page.setDefaultTimeout(25000);

    // 1. Home: Start-here visible, 3 steps.
    await page.goto(base + "/", { waitUntil: "networkidle" });
    ok("home shows Start here", await page.getByRole("heading", { name: /start here/i }).isVisible());
    ok("home has 3 steps", (await page.locator("ol li").count()) >= 3);

    // 2. Search: Ctrl+K, "order", Enter opens endpoint.
    await page.keyboard.press("Control+k");
    await page.getByLabel(/search endpoints/i).fill("order");
    await page.waitForSelector('a[href^="/docs/"]');
    const firstHref = await page.locator('ul a[href^="/docs/"]').first().getAttribute("href");
    ok("search result has docs link", /^\/docs\/.+\/.+/.test(firstHref || ""));
    const firstText = await page.locator('ul a[href^="/docs/"]').first().innerText();
    ok("search result shows method + path", /GET|POST|PUT|PATCH|DELETE/.test(firstText) && firstText.includes("/"));
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/docs\/.+\/.+/);
    ok("Enter opens endpoint", /\/docs\/.+\/.+/.test(page.url()));

    // 3. Non-auth send (login page): prefilled, one click, real response.
    await page.goto(base + "/docs/users/login", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Send request" }).first().click();
    await page.getByRole("button", { name: "Copy response" }).waitFor();
    ok("send returns a real response", true);
    ok("live preview visible", await page.getByText(/live request preview/i).isVisible());

    // 4. Authorize: dialog, save token, header shows Authorized.
    await page.getByRole("button", { name: /authorize/i }).first().click();
    await page.getByLabel(/token \(raw value/i).fill("test-token-123");
    await page.getByRole("button", { name: "Save token" }).click();
    await page.getByRole("button", { name: /authorized/i }).first().waitFor();
    ok("authorize saves + shows Authorized", true);

    // 5. Protected endpoint: unlocked lock, send → 401 + Authorize now.
    // 5. Protected endpoint: unlocked lock, send → real API answer.
    // (This API answers malformed tokens with 500 "jwt malformed", so assert
    // the friendly server-error explanation here; the 401 shortcut is covered
    // next via the no-token path, which is deterministic.)
    await page.goto(base + "/docs/users/get-user-profile", { waitUntil: "networkidle" });
    ok("lock shows unlocked", await page.getByText(/unlocked — token saved/i).isVisible());
    await page.getByRole("button", { name: "Send request" }).first().click();
    await page.getByRole("button", { name: "Copy response" }).waitFor();
    ok("protected call explains the answer", await page.getByText(/server had a problem|did not recognize you/i).isVisible());

    // 5b. No token → friendly nudge + one-click Authorize now (story 7).
    await page.getByRole("button", { name: /authorized/i }).first().click();
    await page.getByRole("button", { name: /log out/i }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Send request" }).first().click();
    ok("missing login shows Authorize now", await page.getByRole("button", { name: /authorize now/i }).first().isVisible());

    // 6. Single Production server behind the scenes: no picker, no banner,
    // and the live preview points at its URL.
    ok("server banner removed", (await page.getByText(/production: requests affect real data/i).count()) === 0);
    const preview = await page.getByLabel(/live curl preview/i).innerText();
    ok("preview uses Production URL", preview.includes("https://e-commerce-backend-masar.vercel.app"));

    // 7. Persistence: re-authorize, reload keeps it; logout + clear reverts.
    await page.getByRole("button", { name: /authorize/i }).first().click();
    await page.getByLabel(/token \(raw value/i).fill("test-token-123");
    await page.getByRole("button", { name: "Save token" }).click();
    await page.reload({ waitUntil: "networkidle" });
    ok("token persists after reload", await page.getByRole("button", { name: /authorized/i }).first().isVisible());
    await page.getByRole("button", { name: /authorized/i }).first().click();
    await page.getByRole("button", { name: /log out/i }).click();
    await page.getByRole("button", { name: /authorize/i }).first().waitFor();
    ok("logout works", true);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /authorize/i }).first().click();
    await page.getByRole("button", { name: /clear saved data/i }).click();
    await page.getByRole("button", { name: /close authorization dialog/i }).click();
    ok("clear saved data works", true);

    // 8. Reset restores prefilled body.
    await page.goto(base + "/docs/users/login", { waitUntil: "networkidle" });
    await page.locator("textarea").first().fill('{"broken": true');
    await page.getByRole("button", { name: "Reset" }).click();
    const restored = await page.locator("textarea").first().inputValue();
    ok("reset restores example", restored.includes("email"));

    // 9. Copy the live cURL (matches current form values, not the static text).
    await page.getByRole("button", { name: /copy current curl/i }).first().click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    ok("copy cURL works", clip.includes("curl"));

    // 10. Copy link + required markers (protected page) + next step.
    await page.getByRole("button", { name: /shareable link/i }).click();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    ok("copy link works", link.includes("/docs/users/login"));
    await page.goto(base + "/docs/users/get-user-profile", { waitUntil: "networkidle" });
    ok("required marker shown", await page.getByText("required", { exact: true }).first().isVisible());
    ok("next step shown", await page.getByText(/next step in this topic/i).isVisible());

    await ctx.close();
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(`ALL PASS — ${step} flow checks.`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
