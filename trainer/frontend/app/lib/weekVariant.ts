// Returns 0 (Week A) or 1 (Week B) based on ISO week number parity.
// Flips automatically every Monday — no state needed.
export function getCurrentWeekVariant(): 0 | 1 {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return (weekNo % 2) as 0 | 1;
}

export function getWeekLabel(): "Week A" | "Week B" {
  return getCurrentWeekVariant() === 0 ? "Week A" : "Week B";
}
