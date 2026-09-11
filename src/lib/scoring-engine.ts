export interface BotPayload {
  mouseData?: { distance?: number; time?: number; curves?: number };
  typingData?: { totalChars?: number; totalTime?: number; backspaces?: number };
  fingerprint?: string;
  deviceData?: {
    webdriver?: boolean;
    touchPoints?: number;
    hardwareConcurrency?: number;
    platform?: string;
    language?: string;
    screen?: string;
  };
  networkData?: { connectionType?: string; saveData?: boolean };
}

const n = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0);

/** Higher scores are more bot-like. No single signal can decide the result. */
export function calculateBotScore(payload: BotPayload): number {
  const mouse = payload.mouseData || {};
  const typing = payload.typingData || {};
  const device = payload.deviceData || {};
  const network = payload.networkData || {};
  let score = 0;

  // Pointer data is only one component; absence is a weak signal, not proof of a bot.
  if (n(mouse.time) < 500) score += 12;
  if (n(mouse.distance) < 50) score += 10;
  if (n(mouse.curves) < 3 && n(mouse.distance) > 50) score += 10;
  if (n(mouse.time) > 0 && n(mouse.distance) / n(mouse.time) > 3) score += 8;

  if (n(typing.totalChars) > 0 && n(typing.totalTime) < 500) score += 18;
  if (n(typing.totalChars) >= 5 && n(typing.totalTime) > 0 && n(typing.totalTime) / n(typing.totalChars) < 25) score += 15;
  if (n(typing.totalChars) > 20 && n(typing.backspaces) === 0 && n(typing.totalTime) < 2500) score += 8;
  if (n(typing.totalChars) === 0) score += 6;

  if (!payload.fingerprint) score += 20;
  if (/bot|headless|puppet|selenium|playwright|webdriver/i.test(payload.fingerprint || "")) score += 35;
  if (device.webdriver === true) score += 40;
  if (n(device.hardwareConcurrency) === 0) score += 8;
  if (network.saveData === true) score += 3;
  if (/bot|headless|unknown/i.test(network.connectionType || "")) score += 10;

  return Math.min(100, Math.round(score));
}

export function isBlocked(score: number, sensitivity: string): boolean {
  if (sensitivity === "strict") return score >= 30;
  if (sensitivity === "loose") return score >= 80;
  return score >= 50;
}
