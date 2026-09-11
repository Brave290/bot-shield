import assert from "node:assert/strict";

const base = (process.env.BASE_URL || "https://bo-tshield.vercel.app").replace(/\/$/, "");
const apiKey = process.env.SMOKE_API_KEY;
const secretKey = process.env.SMOKE_SECRET_KEY;
const allowedOrigin = process.env.SMOKE_ALLOWED_ORIGIN || "https://allowed.example";

if (!apiKey || !secretKey) {
  console.log("Live security tests skipped: set SMOKE_API_KEY and SMOKE_SECRET_KEY to run them.");
  process.exit(0);
}

async function post(path, body, headers = {}) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json().catch(() => ({})) };
}

const human = await post("/api/challenge", {
  apiKey,
  mouseData: { distance: 850, time: 3200, curves: 24 },
  typingData: { totalChars: 42, totalTime: 9800, backspaces: 3 },
  fingerprint: `fp_live_human_${Date.now()}`,
  deviceData: { webdriver: false, hardwareConcurrency: 8 },
  networkData: { connectionType: "4g", saveData: false },
}, { Origin: allowedOrigin });
assert.equal(human.response.status, 200, `human challenge failed: ${human.response.status}`);
assert.ok(human.body.token, "human challenge did not issue a token");
const humanVerify = await post("/api/verify", { secretKey, token: human.body.token });
assert.equal(humanVerify.body.status, "human", `human verification returned ${humanVerify.body.status}`);

const bot = await post("/api/challenge", {
  apiKey,
  mouseData: { distance: 0, time: 0, curves: 0 },
  typingData: { totalChars: 0, totalTime: 0, backspaces: 0 },
  fingerprint: `headless_node_bot_${Date.now()}`,
  deviceData: { webdriver: true, hardwareConcurrency: 0 },
  networkData: { connectionType: "unknown", saveData: true },
}, { Origin: allowedOrigin });
assert.equal(bot.response.status, 200, `bot challenge should issue a scored token: ${bot.response.status}`);
assert.ok(Number(bot.body.score) >= 80, `bot score too low: ${bot.body.score}`);
const botVerify = await post("/api/verify", { secretKey, token: bot.body.token });
assert.equal(botVerify.body.status, "blocked", `bot verification returned ${botVerify.body.status}`);

const replay = await post("/api/verify", { secretKey, token: bot.body.token });
assert.equal(replay.body.status, "blocked", "replayed token was not blocked");

const origin = await post("/api/challenge", { apiKey, mouseData: { distance: 1, time: 1, curves: 0 }, typingData: { totalChars: 0, totalTime: 0, backspaces: 0 }, fingerprint: "origin-test" }, { Origin: "https://evil.example" });
assert.ok([401, 403].includes(origin.response.status), `unexpected origin response: ${origin.response.status}`);

if (process.env.RUN_RATE_LIMIT === "true") {
  let limited = false;
  for (let i = 0; i < 105; i += 1) {
    const result = await post("/api/verify", { secretKey, token: `invalid-${i}` });
    if (result.response.status === 429) { limited = true; break; }
  }
  assert.equal(limited, true, "verify rate limit did not trigger");
} else {
  console.log("Rate-limit hammer test skipped: set RUN_RATE_LIMIT=true to opt in.");
}

console.log("Live security scenarios passed");
