/**
 * OPTIONS in the corner row: opens a small box with the view (pixel or 3D, three/switch.ts), sound,
 * music and tips. A tap on the button or anywhere outside the box closes it again.
 */
export function options(): void {
  const btn = document.getElementById('opts'), box = document.getElementById('options');
  if (!btn || !box) return;
  const show = (on: boolean) => {
    box.hidden = !on;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-expanded', String(on));
  };
  btn.addEventListener('click', () => show(!!box.hidden));
  addEventListener('pointerdown', (e) => {
    const t = e.target as Node;
    if (!box.hidden && !box.contains(t) && !btn.contains(t)) show(false);
  });
}
