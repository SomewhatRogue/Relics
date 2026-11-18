/**
 * Writing the page only when it would change (the HUD sets its words, bars and marks every frame, and a
 * write of the same words still rebuilds nodes and restyles). Each one compares with what the page holds
 * now, not with what was last written here, so another file writing the same element never leaves it stale:
 * after any of these the element is exactly as the plain write would have left it.
 */

const found = new Map<string, HTMLElement>();

/** The element for a selector that matches one element on the page, looked up once (again if it leaves the page). */
export function one(sel: string): HTMLElement {
  let el = found.get(sel);
  if (!el || !el.isConnected) {
    el = document.querySelector(sel) as HTMLElement;
    if (el) found.set(sel, el);
  }
  return el;
}

/** Its text, as `textContent = s` leaves it: no child for '', else one text node of s. */
export function setText(el: HTMLElement, s: string): void {
  const f = el.firstChild;
  if (s === '' ? !f : !!f && f === el.lastChild && f.nodeType === 3 && f.nodeValue === s) return;
  el.textContent = s;
}

/** Wrote and read back, per element and property: the page's own spelling of a value, so a match needs no write. */
const wrote = new WeakMap<HTMLElement, Map<string, [string, string]>>();
const memo = (el: HTMLElement) => wrote.get(el) ?? (wrote.set(el, new Map()), wrote.get(el)!);

/** Its markup: skipped when the last markup set here is still what the element holds. */
export function setHtml(el: HTMLElement, s: string): void {
  const m = memo(el), had = m.get('html');
  if (had && had[0] === s && el.innerHTML === had[1]) return;
  el.innerHTML = s;
  m.set('html', [s, el.innerHTML]);
}

/** An inline style or custom property (`width`, `--cost`), as `style.setProperty` leaves it. */
export function setStyle(el: HTMLElement, prop: string, v: string): void {
  const m = memo(el), had = m.get(prop);
  if (had && had[0] === v && el.style.getPropertyValue(prop) === had[1] && !el.style.getPropertyPriority(prop)) return;
  el.style.setProperty(prop, v);
  m.set(prop, [v, el.style.getPropertyValue(prop)]);
}

export function setTitle(el: HTMLElement, s: string): void {
  if (el.title !== s) el.title = s;
}

export function setHidden(el: HTMLElement, on: boolean): void {
  if (el.hidden !== on) el.hidden = on;
}

/** A data attribute, as `dataset[k] = v` leaves it (an undefined becomes 'undefined', as there). */
export function setData(el: HTMLElement, k: string, v: unknown): void {
  const s = String(v);
  if (el.dataset[k] !== s) el.dataset[k] = s;
}

export function toggle(el: HTMLElement, cls: string, on: boolean): void {
  if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
}
