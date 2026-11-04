/**
 * Small pieces of the job tracker (the banner, main.ts): drawn hearts for the get-ups left, a diamond
 * for each room of the job with the one you're in gilt, and names in title case for the display face
 * (a blackletter in capitals can't be read).
 */
const SMALL = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'up']);

/** "BACK TO WICKHOLD?" as "Back to Wickhold?"; a name already in mixed case is left alone. */
export function titleCase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/[a-z][a-z']*/g, (w, at: number) => (at > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)));
}

/** `full` hearts, then `spent` hollow ones. */
export const heartsHtml = (full: number, spent: number) => `<em class="ups">${'<i class="ht"></i>'.repeat(full)}${'<i class="ht no"></i>'.repeat(spent)}</em>`;

/** A diamond a room, the one you're in (`at`, from 0) lit gold. */
export const roomsHtml = (at: number, rooms: number) => (rooms > 1 ? `<em class="rooms">${Array.from({ length: rooms }, (_, i) => `<i class="rm${i === at ? ' on' : i < at ? ' done' : ''}"></i>`).join('')}</em>` : '');
