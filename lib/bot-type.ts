/**
 * Classify the type of bot detected
 * Returns a descriptive bot type or "human" if score is low
 */
export function classifyBot(payload: any, score: number): string {
  if (score < 30) return "human";

  const m = payload.mouseData || {};
  const t = payload.typingData || {};

  // Fast mouse movement with very short duration
  const time = m.time || 0;
  if (time > 0 && time < 100 && (m.distance || 0) > 50) {
    return "automation-script";
  }

  // Perfectly straight movement pattern
  if ((m.curves || 0) === 0 && (m.distance || 0) > 0) {
    return "linear-mover";
  }

  // Very fast typing: <20ms per character
  if ((t.totalChars || 0) > 0 && (t.totalTime || 0) > 0) {
    const timePerChar = (t.totalTime || 1) / Math.max(1, t.totalChars || 1);
    if (timePerChar < 20) {
      return "credential-stuffer";
    }
  }

  // No corrections in substantial typing
  if ((t.backspaces || 0) === 0 && (t.totalChars || 0) > 20) {
    return "spam-bot";
  }

  return "suspicious";
}

/**
 * Get bot detection threshold based on sensitivity level
 * - strict: aggressive detection (30 threshold)
 * - default: balanced (50 threshold)
 * - loose: permissive (80 threshold)
 */
export function thresholdFor(sensitivity?: string): number {
  if (sensitivity === "strict") return 30;
  if (sensitivity === "loose") return 80;
  return 50; // default
}