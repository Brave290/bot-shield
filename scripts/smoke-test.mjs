const BASE = process.env.BASE_URL || "https://bo-tshield.vercel.app";
const API_KEY = process.env.SMOKE_API_KEY || "";
const SECRET_KEY = process.env.SMOKE_SECRET_KEY || "";

let passed = 0, failed = 0;
const ok = (name, cond, extra = "") => {
  if (cond) { passed++; console.log("PASS " + name); }
  else { failed++; console.log("FAIL " + name + (extra ? " - got " + extra : "")); }
};

const humanPayload = { mouseData: { distance: 1200, time: 4200, curves: 14 }, typingData: { totalChars: 60, totalTime: 9000, backspaces: 2 }, fingerprint: "smoke-human" };
const botPayload = { mouseData: { distance: 10, time: 40, curves: 0 }, typingData: { totalChars: 5, totalTime: 60, backspaces: 0 }, fingerprint: "smoke-bot" };

async function challenge(payload, key) {
  const r = await fetch(BASE + "/api/challenge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey: key, ...payload }) });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
}

(async () => {
  if (!API_KEY || !SECRET_KEY) { console.log("SMOKE SKIPPED: set SMOKE_API_KEY + SMOKE_SECRET_KEY"); process.exit(0); }

  const bad = await challenge(humanPayload, "bs_live_invalid_key");
  ok("invalid API key rejected (401)", bad.status === 401, bad.status);

  let hum = await challenge(humanPayload, API_KEY);
  if (hum.status === 429) { console.log("rate window hot - cooling 65s..."); await new Promise(r => setTimeout(r, 65000)); hum = await challenge(humanPayload, API_KEY); }
  ok("human payload passes with token", hum.status === 200 && !!hum.json?.token, hum.status);

  const bot = await challenge(botPayload, API_KEY);
  ok("bot payload blocked (403)", bot.status === 403, bot.status);

  if (hum.json?.token) {
    const v = await fetch(BASE + "/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secretKey: SECRET_KEY, token: hum.json.token }) });
    let vj = null; try { vj = await v.json(); } catch {}
    ok("verify accepts human token", v.status === 200 && vj?.status === "human", v.status);
  } else { failed++; console.log("FAIL verify accepts human token - no token"); }

  const vg = await fetch(BASE + "/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secretKey: SECRET_KEY, token: "garbage.token.here" }) });
  ok("verify rejects garbage token (401)", vg.status === 401, vg.status);

  let saw429 = false;
  for (let i = 0; i < 40; i++) {
    const r = await fetch(BASE + "/api/challenge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey: API_KEY, ...botPayload }) });
    if (r.status === 429) { saw429 = true; break; }
  }
  ok("rate limiter fires within 40 requests", saw429);

  console.log(passed + " passed, " + failed + " failed");
  process.exit(failed ? 1 : 0);
})();
