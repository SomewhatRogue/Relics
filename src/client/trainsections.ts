/**
 * The trainer's screen in sections (SKILLS, TECHNIQUE, RANKS, KNACKS), each a header you tap to open
 * or close. Closed, a header still says where you stand in it and whether anything is ready to buy.
 * Which are open is remembered on this device (localStorage, a per-viewer convenience only).
 */
export type SecId = 'skills' | 'craft' | 'ranks' | 'knacks';

const KEY = 'relic.trainer.open';
const DEFAULT: Record<SecId, boolean> = { skills: true, craft: false, ranks: true, knacks: false };

export function openSecs(): Record<SecId, boolean> {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULT };
  }
}

function remember(id: SecId, open: boolean): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...openSecs(), [id]: open }));
  } catch {
    // Private window or blocked storage: it just won't be remembered.
  }
}

/**
 * One section. `sum`: a few words for where you stand (shown open or closed); `ready`: how many
 * things in it you could buy now (a gold badge).
 */
export function section(id: SecId, title: string, sum: string, ready: number, body: string, open: boolean): string {
  return `<section class="tr-sec${open ? ' open' : ''}" data-sec="${id}">` +
    `<button class="tr-sh" data-sec-toggle="${id}" aria-expanded="${open}"><i class="tr-chev"></i><b>${title}</b>` +
    (ready ? `<em class="tr-ready">${ready} READY</em>` : '') + `<span class="tr-sum">${sum}</span></button>` +
    `<div class="tr-sb">${body}</div></section>`;
}

/** Wire every section header in the panel: a tap opens or closes it, in place, and remembers. */
export function wireSections(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-sec-toggle]').forEach((b) =>
    b.addEventListener('click', () => {
      const sec = b.closest('.tr-sec')!, open = !sec.classList.contains('open');
      sec.classList.toggle('open', open);
      b.setAttribute('aria-expanded', String(open));
      remember(b.dataset.secToggle as SecId, open);
    }),
  );
}
