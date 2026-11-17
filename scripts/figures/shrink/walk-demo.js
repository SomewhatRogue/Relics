// The generated knight as a game sprite: cut from his flat background, shrunk with nothing blended left, then cut
// into body and legs and walked the way the game walks its figures (the legs lift in turn, each shown shorter).
(async () => {
  const hint = document.getElementById('hint');
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; });
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  let town, take;
  try { [town, take] = await Promise.all([load('town3d.png'), load('take2.png')]); } catch (e) { hint.className = 'note fallback'; hint.textContent = 'The walk could not load its pictures.'; return; }
  const cut = (img, tol) => {
    const c = mk(img.width, img.height), x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data, w = c.width, h = c.height;
    const k0 = [p[8], p[9], p[10]], bg = (i) => Math.abs(p[i] - k0[0]) + Math.abs(p[i + 1] - k0[1]) + Math.abs(p[i + 2] - k0[2]) < tol;
    const seen = new Uint8Array(w * h), stack = [];
    for (let a = 0; a < w; a++) stack.push(a, (h - 1) * w + a);
    for (let b = 0; b < h; b++) stack.push(b * w, b * w + w - 1);
    while (stack.length) { const k = stack.pop(); if (seen[k] || !bg(k * 4)) continue; seen[k] = 1; p[k * 4 + 3] = 0; const a = k % w, b = (k - a) / w; if (a > 0) stack.push(k - 1); if (a < w - 1) stack.push(k + 1); if (b > 0) stack.push(k - w); if (b < h - 1) stack.push(k + w); }
    x.putImageData(d, 0, 0);
    let x0 = w, x1 = 0, y0 = h, y1 = 0;
    for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) if (p[(b * w + a) * 4 + 3]) { x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); }
    const o = mk(x1 - x0 + 1, y1 - y0 + 1); o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height); return o;
  };
  const shrink = (src, k) => { let c = src; while (c.width * 0.5 >= src.width * k && c.width > 4) { const n = mk(Math.max(1, c.width >> 1), Math.max(1, c.height >> 1)), x = n.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, n.width, n.height); c = n; } const o = mk(Math.max(2, Math.round(src.width * k)), Math.max(2, Math.round(src.height * k))), x = o.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, o.width, o.height); return o; };
  const pixel = (c, n) => {
    const w = c.width, h = c.height, p = c.getContext('2d').getImageData(0, 0, w, h).data, px = [];
    for (let i = 0; i < p.length; i += 4) if (p[i + 3] >= 128) px.push(i);
    const lum = (i) => p[i] * 0.3 + p[i + 1] * 0.55 + p[i + 2] * 0.15, sorted = px.slice().sort((a, b) => lum(a) - lum(b));
    let cen = Array.from({ length: n }, (_, j) => { const i = sorted[Math.floor(((j + 0.5) / n) * sorted.length)]; return [p[i], p[i + 1], p[i + 2]]; });
    const near = (i) => { let best = 0, bd = 1e9; for (let j = 0; j < cen.length; j++) { const k = cen[j], dd = (p[i] - k[0]) ** 2 + (p[i + 1] - k[1]) ** 2 + (p[i + 2] - k[2]) ** 2; if (dd < bd) (bd = dd), (best = j); } return best; };
    for (let it = 0; it < 6; it++) { const sum = cen.map(() => [0, 0, 0, 0]); for (const i of px) { const s = sum[near(i)]; s[0] += p[i]; s[1] += p[i + 1]; s[2] += p[i + 2]; s[3]++; } cen = cen.map((k, j) => (sum[j][3] ? [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]] : k)); }
    const o = mk(w + 2, h + 2), x = o.getContext('2d'), od = x.createImageData(w + 2, h + 2), t = od.data, solid = (a, b) => a >= 0 && b >= 0 && a < w && b < h && p[(b * w + a) * 4 + 3] >= 128;
    for (let b = -1; b <= h; b++) for (let a = -1; a <= w; a++) { const i = ((b + 1) * (w + 2) + a + 1) * 4; if (solid(a, b)) { const k = cen[near((b * w + a) * 4)]; t[i] = k[0]; t[i + 1] = k[1]; t[i + 2] = k[2]; t[i + 3] = 255; } else if (solid(a - 1, b) || solid(a + 1, b) || solid(a, b - 1) || solid(a, b + 1)) { t[i] = 13; t[i + 1] = 11; t[i + 2] = 16; t[i + 3] = 255; } }
    x.putImageData(od, 0, 0); return o;
  };
  const whole = cut(take, 110), made = {};
  // The figure at a size: the sprite, and from it the legs (the steel below the tassets, either side of the blade,
  // with the dark line round them) and the rest with the cloak lining filled in where the legs were.
  function knight(den) {
    if (made[den]) return made[den];
    const s = pixel(shrink(whole, (35 * den) / (whole.height * 0.8)), 32), W = s.width, H = s.height, d = s.getContext('2d').getImageData(0, 0, W, H), p = d.data;
    const top = Math.floor(H * 0.7), hem = Math.floor(H * 0.905), rects = [[Math.floor(W * 0.19), Math.floor(W * 0.47)], [Math.floor(W * 0.54), Math.floor(W * 0.86)]];
    const kind = (i) => { const r = p[i], g = p[i + 1], b = p[i + 2]; if (p[i + 3] < 128) return 0; if (r * 0.3 + g * 0.55 + b * 0.15 < 36) return 1; if (r > g * 1.45 && r > 60) return 2; if (r > b * 1.5 && g > b * 1.2 && r > 90) return 3; return 4; };
    const red = [0, 0, 0, 0];
    for (let i = 0; i < p.length; i += 4) if (kind(i) === 2) { red[0] += p[i]; red[1] += p[i + 1]; red[2] += p[i + 2]; red[3]++; }
    const lining = red[3] ? [(red[0] / red[3]) * 0.7, (red[1] / red[3]) * 0.7, (red[2] / red[3]) * 0.7] : [60, 14, 18];
    const rest = mk(W, H), rd = new ImageData(new Uint8ClampedArray(p), W, H), legs = rects.map(([a, b]) => {
      const mask = new Uint8Array(W * H);
      for (let y = top; y < H; y++) for (let x = a; x < b; x++) if (kind((y * W + x) * 4) === 4) mask[y * W + x] = 1;
      for (let y = top; y < H; y++) for (let x = a - 1; x <= b; x++) { const q = y * W + x; if (!mask[q] && kind(q * 4) === 1 && (mask[q - 1] === 1 || mask[q + 1] === 1 || mask[q - W] === 1 || (q + W < W * H && mask[q + W] === 1))) mask[q] = 2; }
      const c = mk(W, H), cd = c.getContext('2d').createImageData(W, H);
      for (let q = 0; q < W * H; q++) if (mask[q]) { for (let k = 0; k < 4; k++) cd.data[q * 4 + k] = p[q * 4 + k]; const y = (q / W) | 0; if (y < hem) { rd.data[q * 4] = lining[0]; rd.data[q * 4 + 1] = lining[1]; rd.data[q * 4 + 2] = lining[2]; } else rd.data[q * 4 + 3] = 0; }
      c.getContext('2d').putImageData(cd, 0, 0); return c;
    });
    rest.getContext('2d').putImageData(rd, 0, 0);
    return (made[den] = { rest, legs, W, H, top });
  }

  const view = document.getElementById('walk'), vg = view.getContext('2d'), scene = mk(2, 2), sg = scene.getContext('2d');
  const BOX = [62, 66, 330, 142], st = { den: 2, x: 205, y: 114, phase: 0, moving: false, lastInput: -1e9, goal: null };
  const keys = new Set(); let drag = null, S = 3, VW = 0, VH = 0;
  function size() {
    const dpr = window.devicePixelRatio || 1, room = Math.max(200, view.parentElement.clientWidth) * dpr;
    // A figure pixel is 3 screen pixels at 70 tall and 2 at 105, so a world pixel is 6 either way, as in the game.
    S = st.den === 3 ? 2 : dpr >= 2 ? 3 : 2;
    const fit = (v) => Math.floor(v / st.den) * st.den;
    VW = Math.min(town.width * st.den, fit(room / S)); VH = Math.min(town.height * st.den, fit(VW * (VW / st.den < 240 ? 1.05 : 0.62)));
    view.width = VW * S; view.height = VH * S; view.style.width = (VW * S) / dpr + 'px'; view.style.height = (VH * S) / dpr + 'px';
    scene.width = VW; scene.height = VH; sg.imageSmoothingEnabled = false; vg.imageSmoothingEnabled = false;
  }
  for (const b of document.querySelectorAll('#sizes button')) b.addEventListener('click', () => { st.den = Number(b.dataset.den); for (const o of document.querySelectorAll('#sizes button')) o.setAttribute('aria-pressed', String(o === b)); size(); });
  const touched = () => (st.lastInput = performance.now());
  addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { keys.add(k); touched(); if (k.startsWith('arrow')) e.preventDefault(); } });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());
  view.addEventListener('pointerdown', (e) => { drag = { x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 }; view.setPointerCapture(e.pointerId); touched(); });
  view.addEventListener('pointermove', (e) => { if (drag) { drag.dx = e.clientX - drag.x0; drag.dy = e.clientY - drag.y0; touched(); } });
  view.addEventListener('pointerup', () => (drag = null)); view.addEventListener('pointercancel', () => (drag = null));
  addEventListener('resize', size);
  size();
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const den = st.den, K = knight(den);
    let mx = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0), my = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0);
    if (drag && Math.hypot(drag.dx, drag.dy) > 8) { mx = drag.dx; my = drag.dy; }
    if (!mx && !my && now - st.lastInput > 3500 && !still) {
      if (!st.goal || Math.hypot(st.goal[0] - st.x, st.goal[1] - st.y) < 3) st.goal = [BOX[0] + 15 + Math.random() * (BOX[2] - BOX[0] - 30), BOX[1] + 8 + Math.random() * (BOX[3] - BOX[1] - 16)];
      mx = st.goal[0] - st.x; my = st.goal[1] - st.y;
    }
    const m = Math.hypot(mx, my); st.moving = m > 0;
    if (st.moving) { const sp = 46 * dt; st.x = Math.min(BOX[2], Math.max(BOX[0], st.x + (mx / m) * sp)); st.y = Math.min(BOX[3], Math.max(BOX[1], st.y + (my / m) * sp)); st.phase += sp / 34; }
    // The window on the square, following him.
    const kx = Math.round(st.x * den), ky = Math.round(st.y * den), snap = (v) => Math.round(v / den) * den;
    const ox = snap(Math.min(town.width * den - VW, Math.max(0, kx - VW / 2))), oy = snap(Math.min(town.height * den - VH, Math.max(0, ky - VH * 0.62)));
    sg.drawImage(town, ox / den, oy / den, VW / den, VH / den, 0, 0, VW, VH);
    const X = kx - ox - Math.round(K.W / 2), Y = ky - oy - K.H + 2 * den;
    sg.fillStyle = 'rgba(8,8,12,0.34)'; sg.beginPath(); sg.ellipse(kx - ox, ky - oy, 9 * den, 2.6 * den, 0, 0, 7); sg.fill();
    sg.drawImage(K.rest, X, Y);
    // Each leg lifts in turn, cut off at the knee line so a lifted leg shows shorter; walking across, they also part.
    const side = st.moving ? Math.sign(Math.round(mx / (m || 1))) : 0;
    K.legs.forEach((leg, i) => {
      const a = st.phase * Math.PI * 2 + i * Math.PI, lift = st.moving ? Math.round(1.6 * den * Math.max(0, Math.sin(a))) : 0, dx = st.moving ? Math.round(side * Math.sin(a) * 0.6 * den) : 0;
      sg.save(); sg.beginPath(); sg.rect(X - 4, Y + K.top, K.W + 8, K.H - K.top + 4); sg.clip(); sg.drawImage(leg, X + dx, Y - lift); sg.restore();
    });
    vg.drawImage(scene, 0, 0, VW * S, VH * S);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
