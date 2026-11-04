/**
 * The gear in the corner row: opens a small box with your heroes (LEAVE on a job), the view (flat or 2.5D,
 * three/switch.ts), sound, music, tips and BUTTONS (what each icon means: legend.ts). A tap on the gear or anywhere outside the box closes it,
 * and so does going to your heroes.
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
  document.getElementById('heroes')?.addEventListener('click', () => show(false));
  document.getElementById('legendbtn')?.addEventListener('click', () => show(false));
  // LEAVE lives in here on a job: its own question takes over.
  document.getElementById('leave')?.addEventListener('click', () => show(false));
  addEventListener('pointerdown', (e) => {
    const t = e.target as Node;
    if (!box.hidden && !box.contains(t) && !btn.contains(t)) show(false);
  });
}
