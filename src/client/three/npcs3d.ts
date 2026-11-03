/**
 * The people of Wickhold (and Hew in the wood, and the dead on the Greyhollow field) as low-poly
 * figures in the colours of their pixel sprites (npcs.ts LOOKS): a trade's coat and trim, an apron,
 * hair or a cap, a beard, Vell's tall hat. What they're busy at is work3d.ts. Paint only: the room
 * never asks where they stand beyond npcAt.
 */
import * as THREE from 'three';
import { LOOKS, type Look } from '../npcs';
import { M, hex } from './mats';
import { blob, collect, middle, part, pivot, stars, type Figure } from './rig';

export interface NpcFig extends Figure {
  /** A hand to put a spade, a spear or a bucket in, and a shoulder to carry the dead on. */
  tool: THREE.Group;
  shoulder: THREE.Group;
  child: boolean;
}

/** A sprite part's colour (rects and ellipses carry it last; points third). */
const colOf = (p: (string | number)[]) => String(p[p.length - 1]);

/** What the sprite's hair parts say: the main colour, a beard (rows low on the face), a tall hat (rows above the head). */
function hairOf(l: Look): { hair: string; beard?: string; hat?: string } {
  const top = l.hair.find((p) => (p[2] as number) <= 2) ?? l.hair[0];
  const beard = l.hair.find((p) => (p[2] as number) >= 5);
  const hat = l.hair.find((p) => (p[2] as number) < 0);
  return { hair: colOf(top), beard: beard ? colOf(beard) : undefined, hat: hat ? colOf(hat) : undefined };
}

export function makeNpc(look: string): NpcFig {
  const child = look === 'child', l = LOOKS[look] ?? (child ? { body: '#6a7a4a', trim: '#5a6a3a', skin: '#c79c78', hair: [['r', 3, 0, 4, 1, '#8a5a2a']] } as Look : LOOKS.villager);
  const root = new THREE.Group(), [mid, body] = middle(root, 0.5), coat = M(hex(l.body)), skin = M(hex(l.skin)), h = hairOf(l);
  blob(root, 0.3);
  const legs = [pivot(body, 0.1, 0.52, 0), pivot(body, -0.1, 0.52, 0)];
  for (const L of legs) part(L, 0.15, 0.48, 0.17, M(0x3a3036), 0, -0.24, 0), part(L, 0.17, 0.1, 0.24, M(0x1a1410), 0, -0.5, 0.03);
  part(body, 0.46, 0.56, 0.3, coat, 0, 0.82, 0);
  part(body, 0.48, 0.07, 0.32, M(hex(l.trim)), 0, 1.07, 0);
  if (l.apron) part(body, 0.34, 0.46, 0.03, M(hex(l.apron)), 0, 0.72, 0.16);
  const head = pivot(body, 0, 1.28, 0);
  part(head, 0.32, 0.32, 0.32, skin, 0, 0, 0);
  for (const ex of [0.07, -0.07]) part(head, 0.05, 0.05, 0.02, M(0x141218), ex, 0.0, 0.165);
  const hairM = M(hex(h.hair));
  part(head, 0.36, 0.12, 0.36, hairM, 0, 0.17, -0.01);
  part(head, 0.34, 0.2, 0.08, hairM, 0, 0.04, -0.15);
  if (h.beard) part(head, 0.26, 0.16, 0.06, M(hex(h.beard)), 0, -0.14, 0.15);
  // A guard's helm with its nasal; Vell's tall hat gone soft at the point.
  if (look === 'guard' || look === 'soldier') part(head, 0.38, 0.16, 0.38, M(hex(h.hair)), 0, 0.15, 0), part(head, 0.04, 0.14, 0.04, M(0x6a6470), 0, 0.02, 0.18);
  if (h.hat) {
    const hat = M(hex(h.hat));
    part(head, 0.56, 0.05, 0.56, hat, 0, 0.2, 0);
    for (let i = 0; i < 4; i++) part(head, 0.3 - i * 0.065, 0.14, 0.3 - i * 0.065, hat, i * 0.03, 0.29 + i * 0.13, -i * 0.03, 0, 0, -i * 0.12);
  }
  const arm = (x: number) => {
    const A = pivot(body, x, 1.02, 0);
    A.rotation.order = 'YXZ';
    part(A, 0.12, 0.4, 0.14, coat, 0, -0.19, 0);
    part(A, 0.1, 0.1, 0.1, skin, 0, -0.42, 0);
    return A;
  };
  const aR = arm(-0.29), aL = arm(0.29);
  const tool = pivot(aR, 0, -0.44, 0.02), shoulder = pivot(body, 0, 1.18, 0);
  const st = stars(root, 1.6);
  root.scale.setScalar(child ? 0.56 : 0.8);
  return { ...collect({ root, mid, body, legs, aR, aL, head, stars: st }), tool, shoulder, child };
}
