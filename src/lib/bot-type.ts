export function classifyBot(payload: any, score: number): string {
  if (score < 30) return "human";
  const m = payload.mouseData || {};
  const t = payload.typingData || {};
  const time = m.time || 0;
  if (time > 0 && time < 100) return "automation-script";
  if ((m.curves || 0) === 0 && (m.distance || 0) > 0) return "linear-mover";
  if ((t.totalChars || 0) > 0 && (t.totalTime || 0) / Math.max(1, t.totalChars) < 20) return "credential-stuffer";
  if ((t.backspaces || 0) === 0 && (t.totalChars || 0) > 20) return "spam-bot";
  return "suspicious";
}

export function thresholdFor(sensitivity?: string): number {
  if (sensitivity === "strict") return 30;
  if (sensitivity === "loose") return 80;
  return 50;
}
