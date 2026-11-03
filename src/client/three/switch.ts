/**
 * The VIEW switch at the top of the ? panel: PIXEL or 3D, changed live (mid-fight too; both views
 * draw the same room, so it's only which canvas shows), remembered on this device. ?look=3d in the
 * address starts in 3D.
 */
import { saveLook, startLook, type Look } from './look';

export class ViewSwitch {
  look: Look = startLook();
  private btn = document.createElement('button');

  constructor(private changed: () => void) {
    const box = document.createElement('div');
    box.id = 'viewswitch';
    this.btn.id = 'viewbtn';
    this.btn.setAttribute('aria-label', 'Switch between the pixel view and the 3D view');
    const note = document.createElement('span');
    note.textContent = '3D shows on jobs for now';
    box.append(this.btn, note);
    // A tap here switches the view; anywhere else on the panel still closes it.
    box.addEventListener('click', (e) => e.stopPropagation());
    this.btn.addEventListener('click', () => this.set(this.look === '3d' ? 'pixel' : '3d'));
    document.getElementById('how')?.prepend(box);
    this.label();
  }

  set(l: Look): void {
    this.look = l;
    saveLook(l);
    this.label();
    this.changed();
  }

  private label(): void {
    this.btn.textContent = this.look === '3d' ? 'VIEW: 3D' : 'VIEW: PIXEL';
    this.btn.classList.toggle('on', this.look === '3d');
  }
}
