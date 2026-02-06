/**
 * Duration helpers for recordings: DB stores duration as integer (seconds).
 * UI may receive number (seconds) or legacy string "MM:SS".
 */

/** Parse "MM:SS" or "H:MM:SS" to integer seconds. Accepts number (returns as-is). */
export function parseDurationToSeconds(val) {
  if (val == null || val === '') return 0;
  if (typeof val === 'number' && !Number.isNaN(val)) return Math.max(0, Math.floor(val));
  const s = String(val).trim();
  if (!s) return 0;
  const parts = s.split(':').map((p) => parseInt(p, 10));
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

/** Format duration for display: number (seconds) or string -> "MM:SS". */
export function formatDurationDisplay(duration) {
  if (duration == null) return '--:--';
  if (typeof duration === 'number' && !Number.isNaN(duration)) {
    const sec = Math.floor(duration);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return String(duration) || '--:--';
}
