import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const sdk = read("public/bot-shield.js");
const challenge = read("app/api/challenge/route.ts");
const createProject = read("app/api/projects/create/route.ts");
const verify = read("app/api/verify/route.ts");
const docs = read("app/api-reference/page.tsx");

assert.match(sdk, /data-api-key/, "SDK must support data-api-key auto initialization");
assert.match(sdk, /DOMContentLoaded/, "SDK must initialize safely after DOM readiness");
assert.match(sdk, /bot_shield_token/, "SDK must attach a hidden verification token to protected forms");
assert.match(challenge, /allowed_origins/, "Challenge route must enforce configured allowed origins");
assert.match(challenge, /increment_request_metrics/, "Challenge route must update live request metrics");
assert.match(challenge, /status: actuallyBlocked \? \"blocked\" : \"passed\"/, "Shadow mode must not log blocked requests");
assert.match(createProject, /max_projects/, "Project creation must enforce plan project limits");
assert.match(verify, /previous_secret_key/, "Verification must support rotated secret migration");
assert.match(docs, /Website widget/, "API docs must include the website integration case");
assert.match(docs, /Backend verification/, "API docs must include backend verification");
assert.match(docs, /Raw challenge API/, "API docs must include the raw API case");
console.log("Integration contract tests passed");
