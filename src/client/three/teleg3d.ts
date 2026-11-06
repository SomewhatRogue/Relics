/**
 * Telegraphs on the floor, from the goblin's attack as the room holds it (the same numbers that are
 * judged): a circle (slam, hex, spit), a sector (cleave, swing, stab), a lane (a charge, a rake, a
 * spider's pounce) or an arrow's line. Red that fills over the wind-up; a striped edge for a blow that
 * can't be blocked (no white parry flash: parry went on 2026-11-05). One shader for every shape.
 */
import * as THREE from 'three';
import type { EnemyAttack } from '../../sim/types';
import { isRound } from '../../sim/types';
import { BAYER } from './post';

const FS = BAYER + `
uniform float uKind, uR, uW, uCos, uProg, uUnb, uT, uSlam, uChev; uniform vec2 uSize; varying vec2 vP;
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

export function makeTele(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uKind: { value: 0 }, uR: { value: 1 }, uW: { value: 0.5 }, uCos: { value: 0 }, uProg: { value: 0 }, uUnb: { value: 0 }, uT: { value: 0 }, uSlam: { value: 0 }, uChev: { value: 0 }, uSize: { value: new THREE.Vector2(1, 1) } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: FS,
    blending: THREE.NoBlending,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const m = new THREE.Mesh(GEO, mat);
  m.rotation.order = 'YXZ';
  return m;
}

/** Shape the mesh to this attack. `lift`: the floor's height there. */
export function shapeTele(m: THREE.Mesh, a: EnemyAttack, now: number, lift: number): boolean {
  if (a.t >= a.windup + a.active) return false;
  const u = (m.material as THREE.ShaderMaterial).uniforms, prog = Math.min(1, a.t / a.windup);
  const round = isRound(a.kind), lane = a.kind === 'charge' || a.kind === 'draw' || a.kind === 'pounce' || a.kind === 'hook', shot = a.kind === 'shot';
  u.uProg.value = prog;
  u.uT.value = now;
  u.uUnb.value = a.unblockable || round || a.kind === 'charge' || a.kind === 'draw' ? 1 : 0;
  u.uSlam.value = a.kind === 'slam' ? 1 : 0;
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
    const W = shot ? 0.07 : a.kind === 'pounce' ? Math.max(0.15, a.radius * 0.5) : a.kind === 'draw' ? 0.12 : a.kind === 'hook' ? 0.07 : a.radius;
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
