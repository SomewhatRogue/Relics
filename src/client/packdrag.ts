/**
 * Dragging in the pack, for mouse and finger alike: press a piece (`data-src`), move a little and it
 * lifts and follows; the places it can go (`data-dst`) light up; let go over one to move it there. A
 * press that doesn't move is a tap.
 */
interface Hooks {
  can: (src: string, dst: string) => boolean;
  drop: (src: string, dst: string) => void;
  tap: (src: string) => void;
}

export function drag(root: HTMLElement, on: Hooks): void {
  let src = '', from: HTMLElement | null = null, x0 = 0, y0 = 0, id = -1, ghost: HTMLElement | null = null;
  const under = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest('[data-dst]') as HTMLElement | null;
  const clear = () => root.querySelectorAll('.can, .over').forEach((t) => t.classList.remove('can', 'over'));

  root.addEventListener('pointerdown', (e) => {
    const t = (e.target as HTMLElement).closest('[data-src]') as HTMLElement | null;
    if (!t || e.button > 0) return;
    (src = t.dataset.src!), (from = t), (x0 = e.clientX), (y0 = e.clientY), (id = e.pointerId);
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerId !== id || !from) return;
    if (!ghost) {
      if (Math.hypot(e.clientX - x0, e.clientY - y0) < 7) return;
      // Lift it: a copy follows the pointer; everywhere it could go lights up.
      ghost = from.cloneNode(true) as HTMLElement;
      ghost.classList.add('ghost');
      document.body.appendChild(ghost);
      from.classList.add('dragging');
      root.querySelectorAll<HTMLElement>('[data-dst]').forEach((d) => on.can(src, d.dataset.dst!) && d.classList.add('can'));
    }
    e.preventDefault();
    ghost.style.left = e.clientX + 'px';
    ghost.style.top = e.clientY + 'px';
    root.querySelectorAll('.over').forEach((t) => t.classList.remove('over'));
    const d = under(e.clientX, e.clientY);
    if (d && d.classList.contains('can')) d.classList.add('over');
  }, { passive: false });
  const end = (e: PointerEvent, cancel = false) => {
    if (e.pointerId !== id || !from) return;
    if (ghost) {
      ghost.remove();
      from.classList.remove('dragging');
      const d = cancel ? null : under(e.clientX, e.clientY);
      clear();
      if (d && on.can(src, d.dataset.dst!)) on.drop(src, d.dataset.dst!);
    } else if (!cancel) on.tap(src);
    (ghost = null), (from = null), (id = -1);
  };
  addEventListener('pointerup', (e) => end(e));
  addEventListener('pointercancel', (e) => end(e, true));
}
