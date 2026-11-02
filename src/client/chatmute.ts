/** Players muted on this device (tap a name in the chat log), by player id, kept in localStorage. */
const KEY = 'relic.mute';

export class Mutes {
  private ids = new Set<string>();

  constructor() {
    try {
      const list = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      if (Array.isArray(list)) for (const id of list) if (typeof id === 'string') this.ids.add(id);
    } catch {
      /* no storage, or nothing kept */
    }
  }

  has(id: string): boolean {
    return this.ids.has(id);
  }

  /** Mute or unmute; returns whether they're muted now. */
  toggle(id: string): boolean {
    const on = !this.ids.has(id);
    if (on) this.ids.add(id);
    else this.ids.delete(id);
    try {
      localStorage.setItem(KEY, JSON.stringify([...this.ids].slice(-200)));
    } catch {
      /* this session only */
    }
    return on;
  }
}
