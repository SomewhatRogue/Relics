/**
 * Telegraphs on the floor, from the goblin's attack as the room holds it (the same numbers that are
 * judged): a circle (slam, hex, spit), a sector (cleave, swing, stab), a lane (a charge, a rake, a
 * spider's pounce) or an arrow's line. Red that fills over the wind-up; a striped edge for a blow that
 * can't be blocked (no white parry flash: parry went on 2026-11-05), and inside a round one its sign as the
 * flat view draws it (../telegraph2.ts: a net, oil, cracks, flames, a hex). One shader for every shape.
 */
import * as THREE from 'three';
import type { EnemyAttack } from '../../sim/types';
import { isRound } from '../../sim/types';
import { BAYER } from './post';
import { HERO } from '../../shared/tuning';
import { FX_LAYER } from './hazards3d';

const FS = BAYER + `
uniform float uKind, uR, uW, uCos, uProg, uUnb, uT, uSlam, uChev, uSign; uniform vec2 uSize; varying vec2 vP;
float h21(vec2 a){ return fract(sin(dot(a, vec2(12.9898, 78.233))) * 43758.5453); }
// What's inside a round one (../telegraph2.ts): 1 the net's mesh, 2 drops where the pot will burst, 3 the ground
// cracking over a sapper, 4 the torch's flames at its edge, 5 the skimmer's oil spreading and catching, 6 the hex's sign.
bool inner(vec2 p, float d, vec2 fc, out vec3 col, out float al){
  float R = uR, pr = uProg, b = bay4(fc), an = atan(p.y, p.x);
  al = 0.3;
  if (uSign < 1.5) { col = vec3(0.91, 0.82, 0.56); return d < R * 0.9 && b < 0.35 + 0.4 * pr && (mod(p.x + p.y + 9.0, 0.24) < 0.05 || mod(p.x - p.y + 9.0, 0.24) < 0.05); }
  if (uSign < 2.5) {
    col = vec3(0.42, 0.35, 0.16); al = 0.9;
    for (int i = 0; i < 9; i++) { float q = float(i) * 2.4, r = R * (0.25 + mod(float(i) * 3.1, 10.0) / 10.0 * 0.6); if (abs(p.x - cos(q) * r) < 0.08 && abs(p.y - sin(q) * r) < 0.04 && b < 0.5 + 0.4 * pr) return true; }
    return false;
  }
  if (uSign < 3.5) {
    col = vec3(0.63, 0.54, 0.42); al = 0.8;
    for (int i = 0; i < 5; i++) { float q = float(i) * 1.26 + 0.3 + sin(d * 16.0) * 0.08; vec2 u = vec2(cos(q), sin(q)); if (d < R * pr && dot(p, u) > 0.0 && abs(p.x * u.y - p.y * u.x) < 0.035) return true; }
    return false;
  }
  if (uSign < 5.5) {
    float lit = uSign < 4.5 ? 0.4 + 0.6 * pr : (pr - 0.6) * 2.5, f = h21(fc + floor(uT * 12.0));
    if (lit > 0.0 && abs(d - R * (uSign < 4.5 ? 0.85 : 0.8)) < 0.07 && f < lit * 0.8) { col = f < 0.25 ? vec3(1.0, 0.82, 0.48) : vec3(1.0, 0.6, 0.24); al = 0.15; return true; }
    if (uSign > 4.5) { col = vec3(0.23, 0.18, 0.1); al = 0.9; float k = 0.5 + 0.5 * sin(an * 7.0) * sin(an * 3.0 + 1.0); return d < R * (0.25 + 0.6 * k) * pr && b < 0.6; }
    return false;
  }
  col = vec3(0.61, 0.88, 0.25);
  float q = mod(an - uT * 0.8, 6.2832 / 18.0);
  return q < 0.08 && (abs(d - R * 0.55) < 0.05 || abs(d - R * 0.4) < 0.05) && b < 0.5 + 0.4 * pr;
}
void main(){
  vec2 p = vP * uSize; vec2 fc = floor(gl_FragCoord.xy);
  float ew = 0.09, edgeD, inside, along, dist = length(p);
  if (uKind < 0.5) { float d = length(p); inside = step(d, uR); edgeD = uR - d; along = d / uR; }
  else if (uKind < 1.5) {
    float d = length(p); float c = p.x / max(d, 0.0001);
    inside = step(d, uR) * step(uCos, c) * step(0.22, d);
    float side = d * sin(acos(clamp(uCos, -1.0, 1.0)) - acos(clamp(c, -1.0, 1.0)));
    edgeD = min(uR - d, side); along = d / uR;
  } else {
    float x = p.x + uR * 0.5; inside = step(0.0, x) * step(x, uR) * step(abs(p.y), uW);
    edgeD = min(uW - abs(p.y), uR - x); along = x / uR; dist = x;
  }
  if (inside < 0.5) discard;
  vec3 col; float al;
  bool edge = edgeD < ew || (uKind > 2.5);
  if (!edge && uKind < 0.5 && uSign > 0.5 && inner(p, dist, fc, col, al)) { gl_FragColor = vec4(col, al); return; }
  vec3 fill = uSlam > 0.5 ? vec3(0.91, 0.31, 0.12) : vec3(0.89, 0.23, 0.19);
  if (edge) {
    float stripe = mod(floor((p.x + p.y) * 3.2), 2.0);
    if (uKind > 2.5) { if (along > uProg && mod(fc.x + fc.y, 3.0) > 0.5) discard; col = fill; al = 0.2; }
    else if (uUnb > 0.5) { col = stripe > 0.5 ? vec3(1.0, 0.82, 0.25) : vec3(0.17, 0.08, 0.03); al = stripe > 0.5 ? 0.25 : 1.0; }
    else { col = fill; al = 0.3; }
  } else if (uChev > 0.5 && fract((dist - abs(p.y) * 0.9) * 1.7 - uT * 1.6) < 0.22) {
    // A lunge or a charge: chevrons running out along it, the way it's coming.
    if (mod(fc.x + fc.y, 2.0) > 0.5 && along > uProg) discard;
    col = vec3(1.0, 0.62, 0.45); al = 0.35;
  } else if (along < uProg) {
    if (mod(fc.x + fc.y, 2.0) > 0.5) discard;
    col = fill * (0.85 + 0.15 * sin(uT * 20.0)); al = 0.6;
  } else {
    if (bay4(fc) > 0.16) discard;
    col = fill * 0.8; al = 0.85;
  }
  gl_FragColor = vec4(col, al);
}`;

const GEO = new THREE.PlaneGeometry(1, 1);
/** Drawn after smoke (hazards3d.ts SMOKE_ORDER). */
export const TELE_ORDER = 2;
const SIGN: Partial<Record<string, number>> = { net: 1, lob: 2, erupt: 3, torch: 4, pour: 5, hex: 6 };

export function makeTele(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uKind: { value: 0 }, uR: { value: 1 }, uW: { value: 0.5 }, uCos: { value: 0 }, uProg: { value: 0 }, uUnb: { value: 0 }, uT: { value: 0 }, uSlam: { value: 0 }, uChev: { value: 0 }, uSign: { value: 0 }, uSize: { value: new THREE.Vector2(1, 1) } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: FS,
    blending: THREE.NoBlending,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const m = new THREE.Mesh(GEO, mat);
  m.rotation.order = 'YXZ';
  // After smoke and steam (hazards3d.ts), which write no depth: a telegraph under a cloud shows through it.
  m.renderOrder = TELE_ORDER;
  m.layers.set(FX_LAYER);
  return m;
}

/** Shape the mesh to this attack. `lift`: the floor's height there. */
export function shapeTele(m: THREE.Mesh, a: EnemyAttack, now: number, lift: number): boolean {
  if (a.t >= a.windup + a.active) return false;
  // (A boss's pose first, then its floor: sim/bosskit.ts BOSS.tell.)
  const tell = a.tell ?? 0;
  if (a.t < tell) return false;
  const u = (m.material as THREE.ShaderMaterial).uniforms, prog = Math.min(1, (a.t - tell) / (a.windup - tell));
  const round = isRound(a.kind), lane = a.kind === 'charge' || a.kind === 'draw' || a.kind === 'pounce' || a.kind === 'hook', shot = a.kind === 'shot';
  u.uProg.value = prog;
  u.uT.value = now;
  u.uUnb.value = a.unblockable || round || a.kind === 'charge' || a.kind === 'draw' ? 1 : 0;
  u.uSlam.value = a.kind === 'slam' ? 1 : 0;
  u.uSign.value = SIGN[a.kind] ?? 0;
  u.uChev.value = lane || (!round && !shot && a.arc <= 40 && a.range >= 2) ? 1 : 0;
  const yaw = -Math.atan2(a.dy, a.dx);
  if (round) {
    u.uKind.value = 0;
    u.uR.value = a.radius;
    u.uSize.value.set(a.radius * 2, a.radius * 2);
    m.position.set(a.cx, lift + 0.03, a.cy);
    m.scale.set(a.radius * 2, a.radius * 2, 1);
    m.rotation.set(-Math.PI / 2, 0, 0);
    return true;
  }
  if (lane || shot) {
    const W = shot ? 0.07 : a.kind === 'pounce' ? Math.max(0.15, a.radius * 0.5) : a.kind === 'draw' ? 0.12 : a.kind === 'hook' ? (a.boss ? HERO.radius : 0.07) : a.radius;
    u.uKind.value = shot ? 3 : 2;
    u.uR.value = a.range;
    u.uW.value = W;
    u.uSize.value.set(a.range, W * 2);
    m.position.set(a.ox + (a.dx * a.range) / 2, lift + 0.03, a.oy + (a.dy * a.range) / 2);
    m.scale.set(a.range, W * 2, 1);
    m.rotation.set(-Math.PI / 2, yaw, 0);
    return true;
  }
  u.uKind.value = 1;
  u.uR.value = a.range;
  u.uCos.value = Math.cos(((a.arc / 2) * Math.PI) / 180);
  u.uSize.value.set(a.range * 2, a.range * 2);
  m.position.set(a.ox, lift + 0.03, a.oy);
  m.scale.set(a.range * 2, a.range * 2, 1);
  m.rotation.set(-Math.PI / 2, yaw, 0);
  return true;
}
