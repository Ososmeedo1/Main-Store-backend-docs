// Automated High Contrast check. Targets are stricter than AA:
// Luminance math per WCAG 2.2. Body text must be >= 4.5:1, large/UI >= 3:1.
function lum(hex) {
  const c = hex.replace("#", "");
  const v = [0, 2, 4].map((i) => {
    const s = parseInt(c.slice(i, i + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

// Automated High Contrast check. Targets are stricter than AA:
// body text >= 7:1 (AAA), large text/UI >= 4.5:1, focus >= 3:1.
// [label, fg, bg, min]
const CHECKS = [
  // light: white surfaces, black text
  ["light body", "#000000", "#ffffff", 7],
  ["light secondary", "#333a44", "#ffffff", 7],
  ["light tertiary", "#3f4552", "#ffffff", 7],
  ["light primary button text", "#ffffff", "#000000", 7],
  ["light link underline text", "#000000", "#ffffff", 7],
  ["light focus ring", "#0033cc", "#ffffff", 3],
  ["light method badge text", "#000000", "#ffffff", 7],
  ["light success", "#006636", "#ffffff", 7],
  ["light warning", "#6b4300", "#ffffff", 7],
  ["light danger", "#b00020", "#ffffff", 7],
  ["light info", "#00566b", "#ffffff", 7],
  ["light subtle border", "#595959", "#ffffff", 3],
  // dark: black surfaces, white text
  ["dark body", "#ffffff", "#000000", 7],
  ["dark secondary", "#c9cfdb", "#000000", 7],
  ["dark tertiary", "#b0b6c6", "#000000", 7],
  ["dark primary button text", "#000000", "#ffffff", 7],
  ["dark link underline text", "#ffffff", "#000000", 7],
  ["dark focus ring", "#ffdd00", "#000000", 3],
  ["dark method badge text", "#ffffff", "#000000", 7],
  ["dark success", "#4ade80", "#000000", 7],
  ["dark warning", "#fbbf24", "#000000", 7],
  ["dark danger", "#ff8fa3", "#000000", 7],
  ["dark info", "#67e8f9", "#000000", 7],
  ["dark subtle border", "#9a9fae", "#000000", 3],
];

let fail = 0;
for (const [label, fg, bg, min] of CHECKS) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${r.toFixed(2)}:1 (needs ${min}:1) — ${label}`);
}
if (fail > 0) {
  console.error(`${fail} contrast check(s) failed.`);
  process.exit(1);
} else {
  console.log("ALL PASS");
}
