export interface BotPayload {
  mouseData: { distance: number; time: number; curves: number };
  typingData: { totalChars: number; totalTime: number; backspaces: number };
  fingerprint: string;
}

export function calculateBotScore(payload: BotPayload): number {
  let score = 0;
  if (payload.mouseData.curves === 0 && payload.mouseData.distance > 0) score += 40; 
  if (payload.mouseData.time < 100 && payload.mouseData.distance > 100) score += 40; 
  
  const charsPerSecond = payload.typingData.totalChars / (payload.typingData.totalTime / 1000);
  if (charsPerSecond > 15) score += 50; 
  if (payload.typingData.totalChars > 20 && payload.typingData.backspaces === 0) score += 10; 

  return Math.min(score, 100);
}

export function isBlocked(score: number, sensitivity: string): boolean {
  if (sensitivity === 'strict') return score >= 30;
  if (sensitivity === 'loose') return score >= 80;
  return score >= 50; 
}
