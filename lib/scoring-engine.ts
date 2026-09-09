export interface BotPayload {
  mouseData: { distance: number; time: number; curves: number };
  typingData: { totalChars: number; totalTime: number; backspaces: number };
  fingerprint?: string;
}

/**
 * Calculate bot score based on behavioral signals (0-100)
 * Lower scores = more human-like
 * Higher scores = more bot-like
 * 
 * Heuristics:
 * - Straight line movement (no curves) with high distance = automation
 * - Extremely fast mouse movement = automation
 * - Extremely fast typing without mistakes = automation
 * - No backspaces in long text = suspicious
 */
export function calculateBotScore(payload: BotPayload): number {
  // Validate payload
  if (!payload.mouseData || !payload.typingData) {
    return 50; // Default to suspicious if data is missing
  }

  const m = payload.mouseData;
  const t = payload.typingData;
  let score = 0;

  // Mouse kinematics heuristics
  if (m.distance > 0 && m.curves === 0) {
    // Straight line movement indicates automation
    score += 35;
  }

  // Extremely fast mouse movement (>100px in <100ms)
  if (m.distance > 100 && m.time < 100 && m.time > 0) {
    score += 30;
  }

  // Typing speed heuristics
  if (t.totalTime > 0 && t.totalChars > 0) {
    const charsPerSecond = t.totalChars / (t.totalTime / 1000);
    // >15 chars/sec is inhuman (average human: 4-8 cps)
    if (charsPerSecond > 15) {
      score += 25;
    }
  }

  // No backspaces in substantial typing = suspicious
  if (t.totalChars > 20 && t.backspaces === 0) {
    score += 10;
  }

  return Math.min(score, 100);
}

export function isBlocked(score: number, sensitivity: string): boolean {
  if (sensitivity === "strict") return score >= 30;
  if (sensitivity === "loose") return score >= 80;
  return score >= 50;
}
