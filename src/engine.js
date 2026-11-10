// ================= ENGINE =================
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const Qn = () => new THREE.Quaternion();
const UP = V(0, 1, 0);
const D2R = Math.PI / 180;
const TBL = { H: 0.76, halfL: 1.37, halfW: 0.7625, netH: 0.1525 };
const BR = 0.02, TOP = TBL.H + BR, BASE_Z = 2.0;
const G = 9.81, KD = 0.12, KM = 0.0016, E_T = 0.92, E_F = 0.55;
const smooth = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const DEF_BODY = { rot: 0, crouch: 0.12, lean: 0.18 };
let HAND_ASSET = null;
const DEF_FREE = [-0.3, 0.98, -0.2];

// ---------- ball physics ----------
function stepBall(s, dt) {
  const v = s.v, sp = v.length();
  const a = V(0, -G, 0).addScaledVector(v, -KD * sp).add(V().crossVectors(s.w, v).multiplyScalar(KM));
  v.addScaledVector(a, dt); s.p.addScaledVector(v, dt);
}
function bounce(s, e) {
  const vin = Math.abs(s.v.y);
  s.v.y = vin * e;
  const u = V(s.v.x, 0, s.v.z).add(V().crossVectors(s.w, V(0, -BR, 0)));
  const ul = u.length(); if (ul < 1e-6) return;
  const mag = Math.min(0.4 * ul, 0.25 * (1 + e) * vin);
  const dv = u.multiplyScalar(-mag / ul);
  s.v.add(dv);
  s.w.add(V().crossVectors(V(0, -BR, 0), dv).multiplyScalar(1.5 / (BR * BR)));
}
function simulate(p0, v0, w0, t0, { maxT = 2.6 } = {}) {
  const s = { p: p0.clone(), v: v0.clone(), w: w0.clone() }; const q = Qn();
  const out = [], ev = []; const dt = 1 / 480; let t = t0, n = 0, floor = 0, dead = false;
  out.push({ t, p: s.p.clone(), q: q.clone(), w: s.w.clone() });
  while (t < t0 + maxT) {
    const py = s.p.y, pz = s.p.z;
    stepBall(s, dt); t += dt;
    const wl = s.w.length();
    if (wl > 1e-6) q.premultiply(Qn().setFromAxisAngle(s.w.clone().divideScalar(wl), wl * dt));
    if (py >= TOP && s.p.y < TOP && s.v.y < 0 && Math.abs(s.p.x) <= TBL.halfW && Math.abs(s.p.z) <= TBL.halfL) {
      s.p.y = TOP; bounce(s, E_T);
      if (s.v.y < 0.35) s.v.y = 0; else ev.push({ type: 'table', t, p: s.p.clone(), side: s.p.z > 0 ? 'learner' : 'opponent' });
    }
    if (s.v.y === 0 && Math.abs(s.p.x) <= TBL.halfW && Math.abs(s.p.z) <= TBL.halfL) { s.p.y = TOP; s.v.x *= 0.995; s.v.z *= 0.995; }
    if (!dead && Math.sign(pz) !== Math.sign(s.p.z) && s.p.y < TBL.H + TBL.netH + BR && s.p.y > TBL.H - 0.01 && Math.abs(s.p.x) < 0.915) {
      s.p.z = Math.sign(pz) * BR * 1.05; s.v.set(s.v.x * 0.2, Math.min(0, s.v.y) * 0.3, -s.v.z * 0.12); s.w.multiplyScalar(0.2);
      ev.push({ type: 'net', t, p: s.p.clone() }); dead = true;
    }
    if (s.p.y < BR && s.v.y < 0) { s.p.y = BR; bounce(s, E_F); floor++; ev.push({ type: 'floor', t, p: s.p.clone() }); if (floor >= 3) break; }
    if (++n % 2 === 0) out.push({ t, p: s.p.clone(), q: q.clone(), w: s.w.clone() });
  }
  return { samples: out, events: ev };
}
function landing(p0, v0, w0, bounces, net = false) {
  const s = { p: p0.clone(), v: v0.clone(), w: w0.clone() }; const dt = 1 / 240; let c = 0;
  for (let i = 0; i < 1500; i++) {
    const py = s.p.y, pz = s.p.z; stepBall(s, dt);
    if (net && Math.sign(pz) !== Math.sign(s.p.z) && s.p.y < TBL.H + TBL.netH + BR + 0.01) return 'net';
    if (py >= TOP && s.p.y < TOP && s.v.y < 0) { c++; if (c >= bounces) return s.p.clone(); s.p.y = TOP; bounce(s, E_T); }
  }
  return null;
}
function spinVec(spin, dir) {
  if (!spin || !spin.rate) return V();
  const v = V().crossVectors(UP, dir).multiplyScalar(spin.top).addScaledVector(UP, spin.side);
  if (v.lengthSq() < 1e-9) return V();
  return v.normalize().multiplyScalar(spin.rate);
}
function shoot(p0, target, spin, mode, bounces, outers = 4) {
  const dir = V(target.x - p0.x, 0, target.z - p0.z); const dist = dir.length(); dir.normalize();
  let res = null;
  for (let outer = 0; outer < outers; outer++) {
    const w = spinVec(spin, dir);
    const make = x => mode.fix === 'speed' ? dir.clone().multiplyScalar(mode.s).setY(x) : dir.clone().multiplyScalar(x).setY(mode.vy);
    let lo = mode.fix === 'speed' ? -4 : 0.3, hi = mode.fix === 'speed' ? 7 : 22;
    const rangeOf = x => { const L = landing(p0, make(x), w, bounces); return L ? V(L.x - p0.x, 0, L.z - p0.z).dot(dir) : -1; };
    for (let i = 0; i < 26; i++) { const mid = (lo + hi) / 2; if (rangeOf(mid) < dist) lo = mid; else hi = mid; }
    const v = make((lo + hi) / 2); res = { v, w };
    const L = landing(p0, v, w, bounces); if (!L) break;
    const side = V().crossVectors(UP, dir);
    const e = V(target.x - L.x, 0, target.z - L.z).dot(side);
    if (Math.abs(e) < 0.01) break;
    dir.applyAxisAngle(UP, Math.atan2(e, dist));
  }
  return res;
}
function zonePoint(zone, receiver, lefty) {
  const z = ZONES[zone] || ZONES.longMid;
  const sz = receiver === 'learner' ? 1 : -1;
  const fx = receiver === 'learner' ? (lefty ? -1 : 1) : -1;
  return V(z[1] * fx, TOP, sz * DEPTH[z[0]]);
}

// ---------- stroke instances ----------
function racketQuat(n, tip, bh) {
  const z = n.clone().normalize(); if (bh) z.negate();
  const y = tip.clone(); y.addScaledVector(z, -y.dot(z)).normalize();
  const x = V().crossVectors(y, z);
  return Qn().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}
function makeInst(id, o = {}) {
  const S = STROKES[id]; if (!S) throw new Error('Unknown stroke ' + id);
  const keys = S.keys.map(k => ({ t: k.t, p: V(...k.p), n: V(...k.n).normalize(), tip: V(...k.tip), bh: !!(k.bh ?? S.bh),
    body: { ...DEF_BODY, ...(k.body || {}) }, free: V(...(k.free || DEF_FREE)) }));
  if (o.body) keys.forEach(k => Object.assign(k.body, o.body));
  if (o.bodyRotScale != null) keys.forEach(k => k.body.rot *= o.bodyRotScale);
  const ci = S.c;
  let delta = (o.faceDelta || 0) * D2R;
  if (o.faceAngle != null && ci != null) delta = o.faceAngle * D2R - Math.asin(clamp(keys[ci].n.y, -1, 1));
  if (delta) keys.forEach(k => {
    const h = V(k.n.x, 0, k.n.z); if (h.lengthSq() < 1e-6) return; h.normalize();
    const q = Qn().setFromAxisAngle(V().crossVectors(h, UP).normalize(), delta);
    k.n.applyQuaternion(q); k.tip.applyQuaternion(q);
  });
  keys.forEach(k => { k.q = racketQuat(k.n, k.tip, k.bh); });
  const inst = { id, S, keys, dur: keys[keys.length - 1].t, serve: !!S.serve, toss: S.toss || 0, static: !!S.static };
  if (ci != null) { inst.tc = keys[ci].t; inst.ci = ci; inst.ballLocal = keys[ci].p.clone().addScaledVector(keys[ci].n, BR + 0.006); }
  return inst;
}
function shiftKeys(inst, v) { inst.keys.forEach(k => k.p.add(v)); if (inst.ballLocal) inst.ballLocal.add(v); if (inst.hold) inst.hold.add(v); }
function catmull(a, b, c, d, u) {
  const u2 = u * u, u3 = u2 * u;
  return V().addScaledVector(a, -0.5 * u3 + u2 - 0.5 * u).addScaledVector(b, 1.5 * u3 - 2.5 * u2 + 1)
    .addScaledVector(c, -1.5 * u3 + 2 * u2 + 0.5 * u).addScaledVector(d, 0.5 * u3 - 0.5 * u2);
}
function sampleInst(inst, tau) {
  const K = inst.keys; tau = clamp(tau, 0, inst.dur);
  let i = 0; while (i < K.length - 2 && tau > K[i + 1].t) i++;
  const k1 = K[i], k2 = K[i + 1] || k1, k0 = K[i - 1] || k1, k3 = K[i + 2] || k2;
  const u = k2.t > k1.t ? clamp((tau - k1.t) / (k2.t - k1.t), 0, 1) : 0, us = smooth(u);
  const pose = {
    p: catmull(k0.p, k1.p, k2.p, k3.p, u), q: k1.q.clone().slerp(k2.q, us),
    body: { rot: k1.body.rot + (k2.body.rot - k1.body.rot) * us, crouch: k1.body.crouch + (k2.body.crouch - k1.body.crouch) * us, lean: k1.body.lean + (k2.body.lean - k1.body.lean) * us },
    free: catmull(k0.free, k1.free, k2.free, k3.free, u), bh: us < 0.5 ? k1.bh : k2.bh };
  if (inst.serve && inst.hold) {
    if (tau < inst.toss + 0.05) pose.holding = true;
    if (tau < inst.toss) pose.free = inst.hold.clone();
    else if (tau < inst.toss + 0.35) pose.free = inst.hold.clone().lerp(pose.free, smooth((tau - inst.toss) / 0.35));
  }
  return pose;
}
function blendPose(a, b, u) {
  return { p: a.p.clone().lerp(b.p, u), q: a.q.clone().slerp(b.q, u), free: a.free.clone().lerp(b.free, u), bh: u < 0.5 ? a.bh : b.bh, holding: u < 0.5 ? a.holding : b.holding,
    body: { rot: a.body.rot + (b.body.rot - a.body.rot) * u, crouch: a.body.crouch + (b.body.crouch - a.body.crouch) * u, lean: a.body.lean + (b.body.lean - a.body.lean) * u } };
}
function poseAt(entries, t) {
  const first = entries[0];
  if (t <= first.start) { const p = sampleInst(first.inst, 0); p.rootOff = first.prevOff.clone(); p.inst = first.inst; return p; }
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i], nx = entries[i + 1];
    if (t >= e.start && t <= e.end) {
      const tau = t - e.start, p = sampleInst(e.inst, e.inst.static ? tau % e.inst.dur : tau);
      const ramp = e.inst.tc ? Math.max(0.2, e.inst.tc * 0.9) : 0.3;
      p.rootOff = e.prevOff.clone().lerp(e.rootOff, smooth(tau / ramp)); p.inst = e.inst; p.tau = tau;
      p.step = { from: e.prevOff, to: e.rootOff, u: clamp(tau / ramp, 0, 1) };
      if (e.stepIn) { const tcE = (e.inst.tc || 0) + 0.12, w = smooth(tau / ramp) * (tau > tcE ? 1 - smooth((tau - tcE) / Math.max(0.2, e.inst.dur - tcE)) : 1); p.stepIn = e.stepIn * w; p.stepW = w; }
      return p;
    }
    if (nx && t > e.end && t < nx.start) {
      const p = blendPose(sampleInst(e.inst, e.inst.dur), sampleInst(nx.inst, 0), smooth((t - e.end) / (nx.start - e.end)));
      p.rootOff = e.rootOff.clone(); p.inst = nx.inst; return p;
    }
  }
  const last = entries[entries.length - 1];
  const p = sampleInst(last.inst, last.inst.static ? (t - last.start) % last.inst.dur : last.inst.dur); p.rootOff = last.rootOff.clone(); p.inst = last.inst; return p;
}

// ---------- geometry helpers ----------
function setSeg(mesh, a, b) {
  const d = V().subVectors(b, a); const L = d.length() || 1e-4;
  mesh.position.copy(a).addScaledVector(d, 0.5); mesh.scale.set(1, L, 1);
  mesh.quaternion.setFromUnitVectors(UP, d.divideScalar(L));
}
function ik(S, W, a, b, pole) {
  const d = V().subVectors(W, S); let L = d.length(); const dir = d.clone().divideScalar(L || 1);
  L = Math.min(L, a + b - 1e-4);
  const x = (a * a - b * b + L * L) / (2 * L), h = Math.sqrt(Math.max(0, a * a - x * x));
  const pv = V().subVectors(pole, S); pv.addScaledVector(dir, -pv.dot(dir));
  if (pv.lengthSq() < 1e-8) pv.set(0, -1, 0);
  pv.normalize();
  return S.clone().addScaledVector(dir, x).addScaledVector(pv, h);
}
function stdMat(c, o = {}) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.62, metalness: 0, ...o }); }

// ---------- player ----------
class Player {
  constructor(scene, { shirt = 0x2f81f7, ghost = false } = {}) {
    this.ghost = ghost; this.root = new THREE.Group(); scene.add(this.root);
    this.base = V(); this.rotY = 0; this.lefty = false; this.gripId = null; this.highlight = false;
    const gm = ghost ? new THREE.MeshBasicMaterial({ color: 0x7ee787, transparent: true, opacity: 0.25, depthWrite: false }) : null;
    this.M = { skin: gm || stdMat(0xc99a78), shirt: gm || stdMat(shirt), shorts: gm || stdMat(0x1c2230), shoe: gm || stdMat(0xe8e8e8),
      wood: gm || stdMat(0xc9a06a), red: gm || stdMat(0xc62828, { roughness: 0.9 }), black: gm || stdMat(0x181818, { roughness: 0.9 }),
      skinHand: gm || stdMat(0xc99a78, { roughness: 0.55 }), thumb: gm || stdMat(0xffb300, { emissive: 0x332200 }), index: gm || stdMat(0x29b6f6, { emissive: 0x002233 }), sleeve: gm || stdMat(shirt) };
    const R = this.root, cast = !ghost;
    this.body = new THREE.Group(); R.add(this.body);
    const add = (m, parent = this.body) => { m.castShadow = cast; parent.add(m); return m; };
    const cyl = (r1, r2, m, parent) => add(new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, 1, 16), m), parent);
    const sph = (r, m, parent) => add(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), m), parent);
    const lathe = (pts, sz, m) => { const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), 28); g.scale(1, 1, sz); g.computeVertexNormals(); return add(new THREE.Mesh(g, m)); };
    this.chest = lathe([[0.001, -0.03], [0.128, -0.03], [0.14, 0.02], [0.158, 0.1], [0.172, 0.19], [0.176, 0.235], [0.152, 0.275], [0.075, 0.298], [0.05, 0.315], [0.001, 0.315]], 0.62, this.M.shirt);
    this.abdomen = lathe([[0.001, -0.05], [0.15, -0.05], [0.152, -0.02], [0.145, 0.08], [0.139, 0.2], [0.001, 0.2]], 0.76, this.M.shirt);
    this.pelvis = sph(0.13, this.M.shorts); this.pelvis.scale.set(1.42, 0.9, 0.84);
    this.neck = cyl(0.044, 0.04, this.M.skin);
    this.headG = new THREE.Group(); this.body.add(this.headG);
    const hairM = ghost ? gm : stdMat(0x1d1612, { roughness: 0.9 }), darkM = ghost ? gm : stdMat(0x15100c);
    this.head = sph(1, this.M.skin, this.headG); this.head.scale.set(0.088, 0.108, 0.098);
    this.hair = add(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.52), hairM), this.headG); this.hair.scale.set(0.093, 0.106, 0.104); this.hair.position.set(0, 0.012, 0.008); this.hair.rotation.x = 0.45;
    for (const sx of [-1, 1]) {
      const ear = sph(0.018, this.M.skin, this.headG); ear.position.set(sx * 0.088, -0.005, 0.008); ear.scale.set(0.5, 1, 0.8);
      const eye = sph(0.0105, darkM, this.headG); eye.position.set(sx * 0.034, 0.014, -0.088);
      const brow = add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.008), hairM), this.headG); brow.position.set(sx * 0.034, 0.034, -0.09);
    }
    const nose = sph(0.014, this.M.skin, this.headG); nose.position.set(0, -0.012, -0.099); nose.scale.set(0.8, 1.2, 1);
    this.arm = new THREE.Group(); R.add(this.arm);
    this.uaR = cyl(0.046, 0.039, this.M.skin, this.arm); this.faR = cyl(0.041, 0.027, this.M.skin, this.arm); this.slR = cyl(0.057, 0.051, this.M.sleeve, this.arm);
    this.shRj = sph(0.058, this.M.sleeve, this.arm); this.elRj = sph(0.04, this.M.skin, this.arm); this.wrRj = sph(0.027, this.M.skin, this.arm);
    this.uaL = cyl(0.046, 0.039, this.M.skin); this.faL = cyl(0.041, 0.029, this.M.skin); this.slL = cyl(0.057, 0.051, this.M.sleeve);
    this.shLj = sph(0.058, this.M.sleeve); this.elLj = sph(0.04, this.M.skin);
    this.freeHand = new THREE.Group(); this.body.add(this.freeHand);
    // free (left) hand: rounded palm + curled fingers; local z = toward fingertips, y = back of hand
    const fh = this.freeHand, M = this.M.skin;
    const capsule = (r, len) => add(new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), M), fh);
    const palmF = add(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), M), fh); palmF.scale.set(0.043, 0.017, 0.05); palmF.position.z = 0.045;
    this.freeFingers = [];
    [-0.027, -0.009, 0.009, 0.026].forEach((x, i) => {
      const g = new THREE.Group(); g.position.set(x, -0.002, 0.09); fh.add(g);
      const L1 = [0.04, 0.044, 0.041, 0.034][i];
      const p1 = capsule(0.0085, L1); p1.rotation.x = Math.PI / 2; p1.position.z = L1 / 2; fh.remove(p1); g.add(p1);
      const g2 = new THREE.Group(); g2.position.z = L1; g.add(g2);
      const p2 = capsule(0.008, L1 * 0.7); p2.rotation.x = Math.PI / 2; p2.position.z = L1 * 0.35; fh.remove(p2); g2.add(p2);
      this.freeFingers.push({ g, g2 });
    });
    this.freeThumb = new THREE.Group(); this.freeThumb.position.set(0.04, -0.008, 0.03); fh.add(this.freeThumb);
    const th = capsule(0.0095, 0.045); th.rotation.x = Math.PI / 2; th.position.z = 0.03; fh.remove(th); this.freeThumb.add(th);
    this.legs = {};
    const soleM = ghost ? gm : stdMat(0x2b2f36), sockM = ghost ? gm : stdMat(0xf4f4f4), trimM = ghost ? gm : stdMat(shirt);
    for (const s of ['L', 'R']) {
      const shoe = new THREE.Group(); this.body.add(shoe);
      const upper = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.15, 6, 14), this.M.shoe), shoe); upper.rotation.x = Math.PI / 2; upper.scale.set(1, 1, 0.82); upper.position.set(0, 0.05, -0.045);
      const sole = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.155, 4, 14), soleM), shoe); sole.rotation.x = Math.PI / 2; sole.scale.set(1, 1, 0.3); sole.position.set(0, 0.014, -0.045);
      const trim = add(new THREE.Mesh(new THREE.BoxGeometry(0.094, 0.012, 0.09), trimM), shoe); trim.position.set(0, 0.058, -0.03);
      this.legs[s] = { th: cyl(0.078, 0.056, this.M.skin), sho: cyl(0.092, 0.084, this.M.shorts), sh: cyl(0.054, 0.037, this.M.skin), kn: sph(0.055, this.M.skin), sock: cyl(0.041, 0.043, sockM), hj: sph(0.091, this.M.shorts), shoe };
    }
    // racket
    this.racket = new THREE.Group(); R.add(this.racket);
    const blade = add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.006, 40), this.M.wood), this.racket); blade.rotation.x = Math.PI / 2; blade.scale.set(0.079, 1, 0.075);
    const red = add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.003, 40), this.M.red), this.racket); red.rotation.x = Math.PI / 2; red.scale.set(0.077, 1, 0.073); red.position.z = 0.0045;
    const blk = add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.003, 40), this.M.black), this.racket); blk.rotation.x = Math.PI / 2; blk.scale.set(0.077, 1, 0.073); blk.position.z = -0.0045;
    const handle = add(new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.1, 0.024), this.M.wood), this.racket); handle.position.y = -0.125;
    const flare = add(new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.025, 0.026), this.M.wood), this.racket); flare.position.y = -0.165;
    this.hand = new THREE.Group(); this.racket.add(this.hand);
    this.wristObj = new THREE.Object3D(); this.hand.add(this.wristObj);
    this.tips = {};
    this.J = {};
    if (ghost) [this.body].forEach(o => o.visible = false);
  }
  setBase(pos, rotY, lefty) {
    this.base.copy(pos); this.rotY = rotY; this.lefty = lefty;
    this.root.rotation.set(0, rotY, 0); this.root.scale.set(lefty ? -1 : 1, 1, 1);
  }
  l2w(v, off) { return V(this.lefty ? -v.x : v.x, v.y, v.z).applyAxisAngle(UP, this.rotY).add(this.base).add(off || V()); }
  l2wDir(v) { return V(this.lefty ? -v.x : v.x, v.y, v.z).applyAxisAngle(UP, this.rotY); }
  w2l(v, off) { return this.w2lDir(V().subVectors(v, this.base).sub(off || V())); }
  w2lDir(v) { const r = v.clone().applyAxisAngle(UP, -this.rotY); if (this.lefty) r.x = -r.x; return r; }
  setGrip(id, highlight) {
    highlight = false;
    const useMesh = !!(HAND_ASSET && !this.ghost);
    if (this.gripId === id && this.meshHand === useMesh) return;
    this.gripId = id; this.highlight = highlight; this.meshHand = useMesh;
    while (this.hand.children.length > 1) { const c = this.hand.children.pop(); c.geometry?.dispose(); }
    const g = GRIPS[id] || GRIPS.shakeNeutral;
    this.hand.rotation.set(0, (g.rotY || 0) * D2R, 0);
    if (useMesh) { this.buildMeshHand(g); return; }
    const radii = { thumb: 0.0108, index: 0.0095, middle: 0.0097, ring: 0.0092, pinky: 0.0082 };
    for (const [name, pts] of Object.entries(g.f)) {
      const m = highlight && name === 'thumb' ? this.M.thumb : highlight && name === 'index' ? this.M.index : this.M.skin;
      const P = pts.map(p => V(...p)); const r = radii[name];
      for (let i = 0; i < 3; i++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(r * (1 - i * 0.07), r * (1 - i * 0.07), 1, 12), m); seg.castShadow = !this.ghost; setSeg(seg, P[i], P[i + 1]); this.hand.add(seg);
        const j = new THREE.Mesh(new THREE.SphereGeometry(r * (1 - i * 0.07), 12, 10), m); j.position.copy(P[i + 1]); this.hand.add(j);
        if (i === 2) this.tips[name] = j;
      }
      const k = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 12, 10), m); k.position.copy(P[0]); this.hand.add(k);
    }
    const ell = (center, ax, ay, az) => { const geo = new THREE.SphereGeometry(1, 24, 16); const m = new THREE.Matrix4().makeBasis(ax, ay, az); m.setPosition(center); geo.applyMatrix4(m); const me = new THREE.Mesh(geo, this.M.skin); me.castShadow = !this.ghost; this.hand.add(me); return me; };
    const kn = ['index', 'middle', 'ring', 'pinky'].map(n => V(...g.f[n][0]));
    const kc = kn.reduce((a, b) => a.add(b), V()).multiplyScalar(0.25), w = V(...g.wrist);
    const Ld = V().subVectors(kc, w), len = Ld.length(); Ld.normalize();
    const Wd = V().subVectors(kn[0], kn[3]); Wd.addScaledVector(Ld, -Wd.dot(Ld)); const wid = Wd.length(); Wd.normalize();
    const Td = V().crossVectors(Ld, Wd).normalize();
    this.palmCenter = V().addVectors(kc, w).multiplyScalar(0.5);
    ell(this.palmCenter, Wd.clone().multiplyScalar(wid / 2 + 0.016), Ld.clone().multiplyScalar(len / 2 + 0.016), Td.clone().multiplyScalar(0.027));
    { const t0 = V(...g.f.thumb[0]), base = w.clone().lerp(this.palmCenter, 0.35);
      const pad = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, Math.max(0.001, t0.distanceTo(base)), 6, 12), this.M.skin); pad.castShadow = !this.ghost;
      setSeg(pad, base, t0); pad.scale.set(1, 1, 1); this.hand.add(pad); }
    this.wristObj.position.set(...g.wrist);
    this.foreLocal = V(...g.fore).normalize();
  }
  buildFreeHand() {
    if (!HAND_ASSET || this.ghost || this.freeSet) return;
    const model = cloneSkinned(HAND_ASSET.scene);
    const B = {}; model.traverse(o => { if (o.name) B[o.name] = o; if (o.isMesh) { o.material = this.M.skinHand; o.castShadow = true; o.frustumCulled = false; } });
    model.position.set(0, 0, 0); model.quaternion.identity(); model.scale.set(1, 1, 1); model.updateMatrixWorld(true);
    const arm = B['Armature'] || model, armInvQ = arm.getWorldQuaternion(Qn()).invert();
    const rest = {}; for (const [n, o] of Object.entries(B)) if (o.isBone) rest[n] = { p: o.getWorldPosition(V()), q: o.getWorldQuaternion(Qn()) };
    const W = rest['wrist'].p, Mk = rest['middle-finger-phalanx-proximal'].p;
    const y = V().subVectors(Mk, W).normalize(), x = V().subVectors(rest['index-finger-phalanx-proximal'].p, rest['pinky-finger-phalanx-proximal'].p); x.addScaledVector(y, -x.dot(y)).normalize();
    const z = V().crossVectors(x, y);
    const chains = { thumb: ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'] };
    for (const f of ['index', 'middle', 'ring', 'pinky']) chains[f] = ['proximal', 'intermediate', 'distal', 'tip'].map(j => `${f}-finger-${j === 'tip' ? 'tip' : 'phalanx-' + j}`);
    const turn = (a0, b0, a1, b1, q0) => Qn().setFromUnitVectors(V().subVectors(b0, a0).normalize(), V().subVectors(b1, a1).normalize()).multiply(q0);
    const poseFor = (curl) => { const out = {};
      Object.entries(chains).forEach(([f, names], fi) => {
        const c = f === 'thumb' ? curl * 0.35 : curl * (0.85 + fi * 0.08), axis = f === 'thumb' ? y : x;
        const T = [rest[names[0]].p.clone()]; let ang = 0, q = null;
        for (let i = 0; i < 3; i++) { ang += c; T.push(T[i].clone().add(V().subVectors(rest[names[i + 1]].p, rest[names[i]].p).applyAxisAngle(axis, ang))); }
        for (let i = 0; i < 3; i++) { q = turn(rest[names[i]].p, rest[names[i + 1]].p, T[i], T[i + 1], rest[names[i]].q); out[names[i]] = { p: T[i], q }; }
        out[names[3]] = { p: T[3], q };
      }); return out; };
    const toLocal = pose => { for (const t of Object.values(pose)) { t.p = arm.worldToLocal(t.p.clone()); t.q = armInvQ.clone().multiply(t.q); } return pose; };
    const poses = { relaxed: toLocal(poseFor(0.5)), flat: toLocal(poseFor(0.1)) };
    this.freeSet = name => { for (const [n, t] of Object.entries(poses[name])) { B[n].position.copy(t.p); B[n].quaternion.copy(t.q); } };
    this.freeSet('relaxed'); this.freePoseNow = 'relaxed';
    const Rq = Qn().setFromRotationMatrix(new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().makeBasis(V(1, 0, 0), V(0, 0, 1), V(0, -1, 0)), new THREE.Matrix4().makeBasis(x, y, z).transpose()));
    const s = 0.094 / W.distanceTo(Mk);
    model.quaternion.copy(Rq); model.scale.setScalar(s); model.position.copy(W.clone().multiplyScalar(-s).applyQuaternion(Rq));
    this.freeHand.children.forEach(c => { c.visible = false; });
    const wrap = new THREE.Group(); wrap.scale.x = -1; wrap.add(model); this.freeHand.add(wrap);
  }
  buildMeshHand(g) {
    const model = cloneSkinned(HAND_ASSET.scene);
    const B = {}; model.traverse(o => { if (o.name) B[o.name] = o; if (o.isMesh) { o.material = this.M.skinHand; o.castShadow = true; o.frustumCulled = false; } });
    model.position.set(0, 0, 0); model.quaternion.identity(); model.scale.set(1, 1, 1); model.updateMatrixWorld(true);
    const wp = n => B[n].getWorldPosition(V());
    const Wm = wp('wrist'), Mm = wp('middle-finger-phalanx-proximal'), Im = wp('index-finger-phalanx-proximal'), Pm = wp('pinky-finger-phalanx-proximal');
    const Wt = V(...g.wrist), Mt = V(...g.f.middle[0]), It = V(...g.f.index[0]), Pt = V(...g.f.pinky[0]);
    const frame = (W, M, I, P) => { const y = V().subVectors(M, W).normalize(); const x = V().subVectors(I, P); x.addScaledVector(y, -x.dot(y)).normalize(); const z = V().crossVectors(x, y); return new THREE.Matrix4().makeBasis(x, y, z); };
    const R = new THREE.Matrix4().multiplyMatrices(frame(Wt, Mt, It, Pt), frame(Wm, Mm, Im, Pm).transpose());
    const Rq = Qn().setFromRotationMatrix(R), s = Wt.distanceTo(Mt) / Wm.distanceTo(Mm);
    const toModel = p => V(...p).sub(Wt).applyQuaternion(Rq.clone().invert()).divideScalar(s).add(Wm);
    const arm = B['Armature'] || model; arm.updateMatrixWorld(true);
    const armInvQ = arm.getWorldQuaternion(Qn()).invert();
    const rest = {}; for (const [n, o] of Object.entries(B)) if (o.isBone) rest[n] = { p: o.getWorldPosition(V()), q: o.getWorldQuaternion(Qn()) };
    const place = (n, pW, qW) => { const o = B[n]; o.position.copy(arm.worldToLocal(pW.clone())); o.quaternion.copy(armInvQ.clone().multiply(qW)); };
    const turn = (fromA, fromB, toA, toB, q0) => Qn().setFromUnitVectors(V().subVectors(fromB, fromA).normalize(), V().subVectors(toB, toA).normalize()).multiply(q0);
    const chains = { thumb: ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'] };
    for (const f of ['index', 'middle', 'ring', 'pinky']) chains[f] = ['proximal', 'intermediate', 'distal', 'tip'].map(j => `${f}-finger-${j === 'tip' ? 'tip' : 'phalanx-' + j}`);
    for (const [f, names] of Object.entries(chains)) {
      const T = g.f[f].map(toModel);
      if (f !== 'thumb') { const mc = `${f}-finger-metacarpal`; place(mc, rest[mc].p, turn(rest[mc].p, rest[names[0]].p, rest[mc].p, T[0], rest[mc].q)); }
      let q = null;
      for (let i = 0; i < 3; i++) { q = turn(rest[names[i]].p, rest[names[i + 1]].p, T[i], T[i + 1], rest[names[i]].q); place(names[i], T[i], q); }
      place(names[3], T[3], q);
    }
    model.updateMatrixWorld(true);
    model.position.copy(Wt).sub(Wm.clone().multiplyScalar(s).applyQuaternion(Rq)); model.quaternion.copy(Rq); model.scale.setScalar(s);
    this.hand.add(model);
    this.tips = { thumb: B['thumb-tip'], index: B['index-finger-tip'], middle: B['middle-finger-tip'] };
    this.wristObj.position.copy(Wt);
    this.foreLocal = V().subVectors(Wt, Mt).normalize();
    const kn = ['index', 'middle', 'ring', 'pinky'].map(n => V(...g.f[n][0]));
    this.palmCenter = kn.reduce((a, b) => a.add(b), V()).multiplyScalar(0.25).add(Wt).multiplyScalar(0.5);
  }
  apply(P) {
    const J = this.J;
    this.root.position.copy(this.base).add(P.rootOff || V());
    const { rot, crouch, lean } = P.body;
    const si = P.stepIn || 0;
    const hips = V(rot * 0.06, 0.965 - crouch * 0.55, lean * 0.1 - si * 0.25);
    const qPel = Qn().setFromAxisAngle(UP, -rot * 0.35);
    const qLow = Qn().setFromAxisAngle(UP, -rot * 0.6).multiply(Qn().setFromAxisAngle(V(1, 0, 0), -lean * 0.5));
    const qt = Qn().setFromAxisAngle(UP, -rot).multiply(Qn().setFromAxisAngle(V(1, 0, 0), -lean)).multiply(Qn().setFromAxisAngle(V(0, 0, 1), -rot * 0.1));
    const mid = hips.clone().add(V(0, 0.19, 0).applyQuaternion(qLow));
    const neck = mid.clone().add(V(0, 0.3, 0).applyQuaternion(qt));
    const shR = mid.clone().add(V(0.185, 0.25, 0).applyQuaternion(qt)), shL = mid.clone().add(V(-0.185, 0.25, 0).applyQuaternion(qt));
    this.abdomen.position.copy(hips); this.abdomen.quaternion.copy(qLow);
    this.chest.position.copy(mid); this.chest.quaternion.copy(qt);
    this.pelvis.position.copy(hips).add(V(0, -0.045, 0)); this.pelvis.quaternion.copy(qPel);
    const headP = neck.clone().add(V(0, 0.135, 0).applyQuaternion(Qn().setFromAxisAngle(V(1, 0, 0), -lean * 0.45))); setSeg(this.neck, neck.clone().add(V(0, -0.02, 0)), headP);
    let hy = rot * 0.25, hp = -lean * 0.25;
    if (P.look) { const d = V().subVectors(P.look, headP); hy = clamp(Math.atan2(d.x, -d.z), -1.1, 1.1); hp = clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.7, 0.35); }
    this.headG.position.copy(headP); this.headG.quaternion.copy(Qn().setFromAxisAngle(UP, -hy).multiply(Qn().setFromAxisAngle(V(1, 0, 0), hp)));
    // racket + playing arm
    this.racket.position.copy(P.p); this.racket.quaternion.copy(P.q); this.racket.updateMatrix(); this.hand.updateMatrix(); this.wristObj.updateMatrix();
    const handM = new THREE.Matrix4().multiplyMatrices(this.racket.matrix, this.hand.matrix);
    let wrist = this.wristObj.position.clone().applyMatrix4(handM);
    const reach = 0.585; let dsw = V().subVectors(wrist, shR), L = dsw.length();
    if (L > reach) { shR.addScaledVector(dsw, Math.min(0.09, L - reach) / L); this.shRj.position.copy(shR); dsw = V().subVectors(wrist, shR); L = dsw.length(); }
    if (L > reach) { const shift = dsw.multiplyScalar(1 - reach / L); this.racket.position.sub(shift); wrist.sub(shift); this.racket.updateMatrix(); }
    const fq = Qn().setFromRotationMatrix(handM), fdir = this.foreLocal.clone().applyQuaternion(fq);
    const guess = wrist.clone().addScaledVector(fdir, 0.28).add(V(0, -0.06, 0));
    const elbow = ik(shR, wrist, 0.31, 0.28, guess);
    setSeg(this.uaR, shR, elbow); setSeg(this.faR, elbow, wrist); setSeg(this.slR, shR, shR.clone().lerp(elbow, 0.5));
    this.shRj.position.copy(shR); this.elRj.position.copy(elbow); this.wrRj.position.copy(wrist);
    // free arm
    const free = P.free.clone();
    const elbowL = ik(shL, free, 0.30, 0.27, shL.clone().add(V(-0.3, -0.8, 0.45)));
    setSeg(this.uaL, shL, elbowL); setSeg(this.faL, elbowL, free); setSeg(this.slL, shL, shL.clone().lerp(elbowL, 0.5)); this.shLj.position.copy(shL); this.elLj.position.copy(elbowL);
    const fd = V().subVectors(free, elbowL).normalize();
    const hold = !!P.holding;
    let ya = hold ? V(0, -1, 0) : V(-1, 0.5, 0).normalize(); ya.addScaledVector(fd, -ya.dot(fd)); if (ya.lengthSq() < 1e-4) ya.set(0, 1, 0); ya.normalize();
    const xa = V().crossVectors(ya, fd).normalize();
    this.freeHand.position.copy(free).addScaledVector(fd, -0.01); this.freeHand.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xa, ya, fd));
    const curl = hold ? 0.15 : 0.75;
    this.freeFingers.forEach(f => { f.g.rotation.x = curl * 0.8; f.g2.rotation.x = curl; });
    this.freeThumb.position.x = xa.x > 0 ? 0.04 : -0.04; this.freeThumb.rotation.set(hold ? 0.1 : 0.5, xa.x > 0 ? -0.6 : 0.6, 0);
    if (this.freeSet) { const want = hold ? 'flat' : 'relaxed'; if (want !== this.freePoseNow) { this.freeSet(want); this.freePoseNow = want; } }
    // legs: feet stay planted and step when the body moves
    const foot = { L: V(-0.28, 0, -0.08), R: V(0.28, 0, 0.1) }, lift = { L: 0, R: 0 };
    const st = P.step;
    if (st) {
      const d = this.w2lDir(V().subVectors(st.to, st.from)), cur = this.w2lDir(V().subVectors(P.rootOff, st.from)), dist = d.length();
      if (dist > 0.04) {
        const lead = Math.abs(d.x) > Math.abs(d.z) * 0.6 ? (d.x > 0 ? 'R' : 'L') : (d.z < 0 ? 'R' : 'L');
        for (const s of ['L', 'R']) { const ph = clamp(s === lead ? st.u / 0.6 : (st.u - 0.4) / 0.6, 0, 1); foot[s].add(d.clone().multiplyScalar(smooth(ph)).sub(cur)); lift[s] = Math.sin(Math.PI * ph) * Math.min(0.07, dist * 0.3); }
      }
    }
    if (si > 0.005) { foot.R.z -= si; lift.R += Math.sin(Math.PI * clamp(P.stepW || 0, 0, 1)) * 0.05; }
    for (const s of ['L', 'R']) {
      const lg = this.legs[s], hip = hips.clone().add(V(s === 'L' ? -0.1 : 0.1, -0.05, 0).applyQuaternion(qPel));
      const f = foot[s]; const hd = V(f.x - hip.x, 0, f.z - hip.z), hl = hd.length(); if (hl > 0.6) { hd.multiplyScalar(0.6 / hl); f.x = hip.x + hd.x; f.z = hip.z + hd.z; }
      const ankle = V(f.x, 0.085 + lift[s], f.z + 0.03);
      const knee = ik(hip, ankle, 0.45, 0.44, hip.clone().add(V(s === 'L' ? -0.2 : 0.2, -0.3, -1)));
      setSeg(lg.th, hip, knee); setSeg(lg.sho, hip.clone().lerp(knee, 0.0), hip.clone().lerp(knee, 0.58)); setSeg(lg.sh, knee, ankle); lg.kn.position.copy(knee); lg.hj.position.copy(hip);
      setSeg(lg.sock, ankle.clone().lerp(knee, -0.05), ankle.clone().lerp(knee, 0.2));
      lg.shoe.position.set(f.x, lift[s], f.z); lg.shoe.rotation.set(-lift[s] * 5, s === 'L' ? 0.28 : -0.28, 0);
      J['knee' + s] = knee; J['foot' + s] = f;
    }
    Object.assign(J, { hips, neck, head: headP, shR, elbow, wrist, free, feet: foot.L.clone().add(foot.R).multiplyScalar(0.5).setY(0.05) });
    this.bhNow = P.bh;
    this.root.updateMatrixWorld(true);
  }
  world(name) {
    const J = this.J, r = this.root;
    const lw = v => r.localToWorld(v.clone());
    switch (name) {
      case 'thumb': case 'index': return this.tips[name] ? this.tips[name].getWorldPosition(V()) : lw(J.wrist);
      case 'fingers': return this.tips.middle ? this.tips.middle.getWorldPosition(V()) : lw(J.wrist);
      case 'wrist': return lw(J.wrist); case 'elbow': return lw(J.elbow); case 'shoulder': return lw(J.shR);
      case 'hips': return lw(J.hips); case 'knees': return lw(J.kneeR); case 'feet': return lw(J.feet);
      case 'freeHand': return lw(J.free); case 'head': return lw(J.head);
      case 'handle': return this.racket.localToWorld(V(0, -0.13, 0));
      case 'racketFace': return this.racket.localToWorld(V(0, 0.02, this.bhNow ? -0.03 : 0.03));
      case 'racketCenter': return this.racket.localToWorld(V());
      case 'handCenter': return this.hand.localToWorld(this.palmCenter ? this.palmCenter.clone() : V(0, -0.13, 0));
    }
    return lw(J.hips);
  }
  hitNormal() { this.racket.updateMatrixWorld(); return V(0, 0, this.bhNow ? -1 : 1).transformDirection(this.racket.matrixWorld); }
}

// ---------- demo builder ----------
function resolveSpin(sh, S, P, isLearner, lefty) {
  const name = sh.spin || S.spin || 'noSpin';
  const sp = { ...(SPINS[name] || SPINS.noSpin) };
  if (S.spinRate && !sh.spin) sp.rate = S.spinRate;
  if (isLearner && lefty) sp.side = -sp.side;
  sp.name = name; return sp;
}
function pickContact(prev, hitter, timing) {
  const b = prev.events.find(e => e.type === 'table' && e.side === hitter);
  if (!b) return null;
  if (prev.events.some(e => e.type === 'net' && e.t < b.t)) return null;
  const nextE = prev.events.find(e => e.t > b.t + 0.01);
  const seg = prev.samples.filter(s => s.t > b.t + 0.005 && (!nextE || s.t < nextE.t));
  if (seg.length < 4) return null;
  let ia = 0; seg.forEach((s, i) => { if (s.p.y > seg[ia].p.y) ia = i; });
  let idx = ia;
  if (timing === 'rising') idx = Math.floor(ia * 0.45);
  else if (timing === 'falling' || timing === 'late') {
    const drop = timing === 'late' ? 0.32 : 0.16, y = seg[ia].p.y - drop;
    idx = seg.findIndex((s, i) => i > ia && s.p.y < y); if (idx < 0) idx = seg.length - 1;
  }
  return { t: seg[idx].t, p: seg[idx].p.clone() };
}
function serveTrace(p0, v0, w0) {
  const s = { p: p0.clone(), v: v0.clone(), w: w0.clone() }; const dt = 1 / 240; let c = 0, b1 = null, netY = null;
  for (let i = 0; i < 1500; i++) {
    const py = s.p.y, pz = s.p.z; stepBall(s, dt);
    if (Math.sign(pz) !== Math.sign(s.p.z) && netY == null) netY = s.p.y;
    if (py >= TOP && s.p.y < TOP && s.v.y < 0) { c++; if (c === 1) { b1 = s.p.clone(); s.p.y = TOP; bounce(s, E_T); } else return { b1, b2: s.p.clone(), netY }; }
  }
  return { b1, b2: null, netY };
}
function serveSolve(ballC, tgt, spin, d1) {
  const own = Math.sign(ballC.z) || 1;
  let dir = V(tgt.x - ballC.x, 0, tgt.z - ballC.z); const dist = dir.length(); dir.normalize();
  let best = null;
  for (let pass = 0; pass < 3; pass++) {
    const w = spinVec(spin, dir); best = null;
    for (let vy = -2.5; vy <= 2.01; vy += 0.25) {
      let lo = 0.5, hi = 14;
      for (let i = 0; i < 22; i++) { const sp = (lo + hi) / 2; const L = landing(ballC, dir.clone().multiplyScalar(sp).setY(vy), w, 2); const r = L ? V(L.x - ballC.x, 0, L.z - ballC.z).dot(dir) : 1e9; if (r < dist) lo = sp; else hi = sp; }
      const v = dir.clone().multiplyScalar((lo + hi) / 2).setY(vy);
      const tr = serveTrace(ballC, v, w);
      if (!tr.b1 || !tr.b2 || Math.sign(tr.b1.z) !== own || Math.abs(tr.b1.z) > TBL.halfL || tr.netY == null || tr.netY < TBL.H + TBL.netH + BR + 0.005) continue;
      const score = Math.abs(Math.abs(tr.b1.z) - d1) + Math.max(0, tr.netY - (TBL.H + TBL.netH + 0.12)) * 2;
      if (!best || score < best.score) best = { v, w, score, b2: tr.b2 };
    }
    if (!best) break;
    const e = V(tgt.x - best.b2.x, 0, tgt.z - best.b2.z).dot(V().crossVectors(UP, dir));
    if (Math.abs(e) < 0.02) break;
    dir.applyAxisAngle(UP, Math.atan2(e, dist));
  }
  if (best) return { v: best.v, w: best.w };
  const w = spinVec(spin, dir); return { v: dir.clone().multiplyScalar(3).setY(1.2), w };
}
function computeLaunch(ballC, target, spin, S, sh, outcome) {
  const speed = sh.speed || S.speed || 5;
  const tgt = target.clone(); const sz = Math.sign(tgt.z) || -1;
  if (outcome === 'net') {
    const dir = V(tgt.x - ballC.x, 0, tgt.z - ballC.z).normalize();
    const T = Math.abs(ballC.z) / Math.max(0.05, Math.abs(dir.z)) / speed;
    const vy = (TBL.H + TBL.netH - 0.075 - ballC.y + 0.5 * G * T * T) / T;
    return { v: dir.clone().multiplyScalar(speed).setY(vy), w: spinVec(spin, dir) };
  }
  if (outcome === 'long') tgt.z = sz * (TBL.halfL + 0.45);
  if (outcome === 'wide') tgt.x = (Math.sign(tgt.x) || 1) * 1.05;
  if (S.serve && outcome !== 'high') return serveSolve(ballC, tgt, spin, S.b1 || 0.55);
  let mode = S.serve ? { fix: 'vy', vy: S.serveVy ?? -0.3 } : { fix: 'speed', s: speed };
  if (outcome === 'high') mode = { fix: 'vy', vy: 3.0 };
  const bounces = S.serve ? 2 : 1;
  let res;
  for (let k = 0; k < 7; k++) {
    res = shoot(ballC, tgt, spin, mode, bounces);
    if (outcome !== 'good' && outcome !== 'long') break;
    const sim = simulate(ballC, res.v, res.w, 0, { maxT: 1.6 });
    if (!sim.events.some(e => e.type === 'net')) break;
    if (mode.fix === 'speed') mode.s *= 0.88; else mode.vy -= 0.4;
  }
  return res;
}
function buildDemo(spec, env) {
  const { L, O, lefty } = env; const players = { learner: L, opponent: O };
  const tl = { learner: [], opponent: [] };
  let samples = [], events = []; let tMain = null, mainShot = null, mainInst = null, toss = null, lastOff = { learner: V(), opponent: V() };
  const shots = (spec.rally || []).map(s => ({ ...s }));
  if (!shots.length) {
    const id = spec.pose || spec.shadow || 'ready';
    const inst = makeInst(id, { body: spec.body });
    const off = L.l2wDir(V(...(spec.rootOffset || [0, 0, 0])));
    tl.learner.push({ inst, start: inst.static ? 0 : 0.3, end: inst.static ? 1e9 : 0.3 + inst.dur, rootOff: off, prevOff: off });
    const oi = makeInst('ready'); tl.opponent.push({ inst: oi, start: 0, end: 1e9, rootOff: V(), prevOff: V() });
    const dur = inst.static ? inst.dur : inst.dur + 0.6;
    return { tl, samples: [], events: [], duration: dur, tMain: inst.tc != null ? 0.3 + inst.tc : null, static: inst.static, shots: [] };
  }
  let prev = null;
  for (let i = 0; i < shots.length; i++) {
    const sh = shots[i], P = players[sh.by], S = STROKES[sh.stroke];
    const isL = sh.by === 'learner';
    const inst = makeInst(sh.stroke, { faceDelta: sh.faceDelta, faceAngle: sh.faceAngle, body: isL ? { ...(spec.body || {}), ...(sh.body || {}) } : sh.body, bodyRotScale: sh.bodyRotScale });
    const ro = sh.rootOffset || (isL && spec.rootOffset) || S.rootOffset || [0, 0, 0];
    const baseOff = P.l2wDir(V(...ro));
    let start, tc, ballC, rootOff, prevOff = lastOff[sh.by].clone();
    const measure = (entry) => { const pose = sampleInst(entry.inst, tc - entry.start); pose.rootOff = entry.rootOff.clone(); if (entry.stepIn) { pose.stepIn = entry.stepIn; pose.stepW = 1; } P.apply(pose); return P.world('racketCenter').addScaledVector(P.hitNormal(), BR + 0.006); };
    let entry;
    if (i === 0) {
      start = 0.3; rootOff = baseOff.clone(); prevOff = baseOff.clone(); tc = start + inst.tc;
      entry = { inst, start, end: start + inst.dur, rootOff, prevOff };
      ballC = measure(entry);
      if (inst.serve) {
        const tossW = V(ballC.x, P.base.y + 1.03, ballC.z);
        inst.hold = P.w2l(tossW, rootOff).add(V(0, -0.035, 0));
        const tT = start + inst.toss, dT = tc - tT, vy = (ballC.y - tossW.y + 0.5 * G * dT * dT) / dT;
        for (let t = 0; t < tT; t += 1 / 60) samples.push({ t, p: tossW.clone(), q: Qn(), w: V(), k: -1 });
        for (let t = tT; t < tc; t += 1 / 240) { const u = t - tT; samples.push({ t, p: V(tossW.x, tossW.y + vy * u - 0.5 * G * u * u, tossW.z), q: Qn(), w: V(), k: 0 }); }
        toss = { p: tossW, h: vy * vy / (2 * G), by: sh.by };
      } else {
        samples.push({ t: 0, p: ballC.clone(), q: Qn(), w: V(), hidden: true, k: -1 });
        samples.push({ t: tc - 0.002, p: ballC.clone(), q: Qn(), w: V(), hidden: true, k: -1 });
      }
    } else {
      const pc = pickContact(prev, sh.by, sh.timing || S.timing || 'peak');
      if (!pc) break;
      tc = pc.t; ballC = pc.p; start = tc - inst.tc;
      const nom = P.l2w(inst.ballLocal, baseOff);
      const delta = V().subVectors(ballC, nom), shift = V(delta.x, 0, delta.z);
      const rz = P.base.z + baseOff.z + shift.z;
      if (isL) { if (rz < 1.42) shift.z += 1.42 - rz; } else if (rz > -1.42) shift.z -= rz + 1.42;
      shift.x = clamp(shift.x, -1.3, 1.3);
      rootOff = baseOff.clone().add(shift);
      const remL = P.w2lDir(V().subVectors(delta, shift));
      shiftKeys(inst, remL);
      if (remL.z < -0.02) { inst.stepIn0 = Math.min(0.42, -remL.z); inst.keys.forEach(k => { k.body.lean += Math.min(0.3, -remL.z * 0.6); }); }
      samples = samples.filter(s => s.t < tc); events = events.filter(e => e.t < tc);
      entry = { inst, start, end: start + inst.dur, rootOff, prevOff, stepIn: inst.stepIn0 || 0 };
      for (let it = 0; it < 8; it++) {
        const d = V().subVectors(ballC, measure(entry)); if (d.length() < 0.006) break;
        const ro = entry.rootOff, nz = ro.z + d.z; let rz = nz;
        if (isL && P.base.z + rz < 1.42) rz = 1.42 - P.base.z; if (!isL && P.base.z + rz > -1.42) rz = -1.42 - P.base.z;
        ro.x += d.x; ro.z = rz;
        const resid = nz - rz;
        if (Math.abs(resid) > 0.004) { shiftKeys(inst, P.w2lDir(V(0, 0, resid))); entry.stepIn = Math.min(0.42, (entry.stepIn || 0) + Math.abs(resid)); inst.keys.forEach(k => { k.body.lean = Math.min(0.8, k.body.lean + Math.abs(resid) * 0.6); }); }
        if (Math.abs(d.y) > 0.004) shiftKeys(inst, V(0, d.y, 0));
      }
    }
    tl[sh.by].push(entry);
    lastOff[sh.by] = rootOff.clone();
    if ((sh.main && mainShot == null) || (mainShot == null && isL && !shots.some(s => s.main))) { tMain = tc; mainShot = sh; mainInst = inst; }
    const recv = isL ? 'opponent' : 'learner';
    const spin = resolveSpin(sh, S, P, isL, lefty);
    const target = zonePoint(sh.to || S.to || 'longMid', recv, lefty);
    const outcome = sh.outcome || 'good';
    const launch = computeLaunch(ballC, target, spin, S, sh, outcome);
    const seg = simulate(ballC, launch.v, launch.w, tc, { maxT: 2.6 });
    seg.samples.forEach(s => { s.k = i; s.by = sh.by; });
    samples.push(...seg.samples); events.push(...seg.events.map(e => ({ ...e, k: i })));
    prev = { samples: seg.samples, events: seg.events };
    sh._target = target; sh._spin = spin; sh._tc = tc; sh._ball = ballC.clone();
    if (outcome !== 'good') break;
  }
  if (tMain == null && tl.learner.length === 0) { // opponent-only demo: learner stands ready
    const inst = makeInst('ready'); tl.learner.push({ inst, start: 0, end: 1e9, rootOff: V(), prevOff: V() });
  }
  if (!tl.opponent.length) { const inst = makeInst('ready'); tl.opponent.push({ inst, start: 0, end: 1e9, rootOff: V(), prevOff: V() }); }
  const lastT = samples.length ? samples[samples.length - 1].t : 0;
  let endS = 0;
  for (const k of ['learner', 'opponent']) tl[k].forEach(e => { if (e.end < 1e8) endS = Math.max(endS, e.end); });
  const lastTc = Math.max(0, ...shots.map(s => s._tc || 0));
  const duration = Math.max(endS, Math.min(lastT, lastTc + 1.8)) + 0.2;
  return { tl, samples, events, duration, tMain, mainShot, mainInst, toss, shots };
}
function sampleBall(samples, t) {
  if (!samples.length) return null;
  if (t <= samples[0].t) return samples[0];
  let lo = 0, hi = samples.length - 1;
  if (t >= samples[hi].t) return samples[hi];
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (samples[m].t <= t) lo = m; else hi = m; }
  const a = samples[lo], b = samples[hi], u = (t - a.t) / Math.max(1e-6, b.t - a.t);
  return { t, p: a.p.clone().lerp(b.p, u), q: a.q.clone().slerp(b.q, u), w: a.w.clone().lerp(b.w, u), hidden: a.hidden, k: a.k };
}
function spinLabel(w, v) {
  const rps = w.length() / (2 * Math.PI);
  if (rps < 3) return { type: 'No spin', rps };
  const h = V(v.x, 0, v.z); if (h.lengthSq() < 1e-6) h.set(0, 0, -1); h.normalize();
  const top = w.dot(V().crossVectors(UP, h)), side = w.y;
  let type;
  if (Math.abs(top) > Math.abs(side) * 1.7) type = top > 0 ? 'Topspin' : 'Backspin';
  else if (Math.abs(side) > Math.abs(top) * 1.7) type = 'Sidespin';
  else type = 'Side + ' + (top > 0 ? 'topspin' : 'backspin');
  return { type, rps };
}
function faceText(n) {
  const a = Math.round(Math.asin(clamp(n.y, -1, 1)) / D2R);
  if (Math.abs(a) <= 3) return 'Vertical';
  return (a > 0 ? 'Open ' : 'Closed ') + Math.abs(a) + '°';
}

// ---------- textures ----------
function ballTexture(striped) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#ff8f1f'; g.fillRect(0, 0, 256, 128);
  if (striped) { g.fillStyle = '#3b1600'; g.fillRect(0, 58, 256, 12); g.fillRect(60, 0, 12, 128); g.fillStyle = '#ffffff'; g.fillRect(186, 0, 10, 128); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function netTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 32; const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 32); g.strokeStyle = 'rgba(20,24,30,0.9)'; g.lineWidth = 1;
  for (let x = 0; x <= 128; x += 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 32); g.stroke(); }
  for (let y = 0; y <= 32; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 1); return t;
}

// ---------- stage ----------
class Stage {
  constructor(el, labelsEl, hooks = {}) {
    this.el = el; this.labelsEl = labelsEl; this.hooks = hooks;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace; el.prepend(r.domElement);
    const sc = this.scene = new THREE.Scene(); sc.background = new THREE.Color(0x0f141b); sc.fog = new THREE.Fog(0x0f141b, 9, 22);
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 60); this.camera.position.set(0.9, 2.1, 4.3);
    const c = this.controls = new OrbitControls(this.camera, r.domElement);
    c.enableDamping = true; c.dampingFactor = 0.12; c.minDistance = 0.12; c.maxDistance = 14; c.target.set(0, 0.85, 0.2); c.autoRotateSpeed = 1.6;
    c.addEventListener('start', () => { this.userOrbit = true; });
    sc.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1d24, 1.0));
    const d = new THREE.DirectionalLight(0xffffff, 1.7); d.position.set(2.5, 6, 3); d.castShadow = true;
    d.shadow.mapSize.set(1024, 1024); Object.assign(d.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 15 }); d.shadow.bias = -0.0004; sc.add(d);
    const fill = new THREE.DirectionalLight(0x9fb8ff, 0.5); fill.position.set(-3, 3, -2); sc.add(fill);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), stdMat(0x18202b, { roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
    const court = new THREE.Mesh(new THREE.PlaneGeometry(7, 12), stdMat(0x5a2a2e, { roughness: 0.9 })); court.rotation.x = -Math.PI / 2; court.position.y = 0.002; court.receiveShadow = true; sc.add(court);
    this.buildTable();
    this.L = new Player(sc, { shirt: 0x2f81f7 }); this.O = new Player(sc, { shirt: 0xd1495b }); this.Gh = new Player(sc, { ghost: true });
    this.Gh.root.visible = false;
    this.O.setGrip('shakeNeutral', false);
    try {
      const bin = Uint8Array.from(atob(HAND_GLB_B64), c => c.charCodeAt(0)).buffer;
      new GLTFLoader().parse(bin, '', gltf => { HAND_ASSET = gltf; for (const P of [this.L, this.O]) { const id = P.gripId; P.gripId = null; P.setGrip(id || 'shakeNeutral', false); P.buildFreeHand(); } if (this.demo) this.apply(this.t); }, err => console.warn('hand model', err));
    } catch (err) { console.warn('hand model', err); }
    this.texStripe = ballTexture(true); this.texPlain = ballTexture(false);
    this.ballMat = new THREE.MeshStandardMaterial({ map: this.texStripe, roughness: 0.45 });
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(BR * 1.15, 24, 16), this.ballMat); this.ball.castShadow = true; sc.add(this.ball);
    this.arrow = new THREE.ArrowHelper(V(0, 1, 0), V(), 0.1, 0xffe066, 0.03, 0.02); sc.add(this.arrow);
    this.over = new THREE.Group(); sc.add(this.over);
    this.prot = this.makeProtractor(); sc.add(this.prot.g);
    this.zones = this.makeZones(); sc.add(this.zones);
    this.t = 0; this.playing = true; this.speed = 0.5; this.loop = true; this.pauseAtContact = true; this.paused1 = false;
    this.overlays = new Set(); this.callouts = []; this.camState = null; this.hideSpin = false;
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(el); this.resize();
    this.last = performance.now();
    const tick = () => { requestAnimationFrame(tick); if (document.hidden) { this.last = performance.now(); return; } this.frame(); };
    requestAnimationFrame(tick);
  }
  buildTable() {
    const g = new THREE.Group(), sc = this.scene;
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.525, 0.03, 2.74), stdMat(0x1f4f9a, { roughness: 0.5 })); top.position.y = TBL.H - 0.015; top.castShadow = top.receiveShadow = true; g.add(top);
    const wm = stdMat(0xf2f2f2, { roughness: 0.5 });
    const line = (w, l, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.002, l), wm); m.position.set(x, TBL.H + 0.0005, z); m.receiveShadow = true; g.add(m); };
    line(1.525, 0.02, 0, 1.36); line(1.525, 0.02, 0, -1.36); line(0.02, 2.74, 0.7525, 0); line(0.02, 2.74, -0.7525, 0); line(0.003, 2.74, 0, 0);
    const lm = stdMat(0x22262e);
    for (const x of [-0.6, 0.6]) for (const z of [-1.1, 1.1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, TBL.H - 0.03, 0.05), lm); l.position.set(x, (TBL.H - 0.03) / 2, z); l.castShadow = true; g.add(l); }
    const net = new THREE.Mesh(new THREE.PlaneGeometry(1.83, TBL.netH), new THREE.MeshBasicMaterial({ map: netTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    net.position.set(0, TBL.H + TBL.netH / 2, 0); net.rotation.y = Math.PI / 2; net.rotation.set(0, 0, 0); g.add(net);
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.83, 0.015, 0.004), wm); band.position.set(0, TBL.H + TBL.netH - 0.0075, 0); g.add(band);
    for (const x of [-0.915, 0.915]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.02, TBL.netH + 0.02, 0.03), lm); p.position.set(x, TBL.H + TBL.netH / 2, 0); g.add(p); }
    sc.add(g);
  }
  makeProtractor() {
    const g = new THREE.Group(); g.visible = false;
    const mk = (color, n, dashed) => {
      const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const m = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.01, gapSize: 0.008, depthTest: false, transparent: true })
        : new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true });
      const l = new THREE.Line(geo, m); l.renderOrder = 10; g.add(l); return l;
    };
    return { g, vert: mk(0xffffff, 2, true), face: mk(0x4fc3f7, 2), arc: mk(0xffe066, 25) };
  }
  updateProtractor(on) {
    const P = this.prot; P.g.visible = on; if (!on) return null;
    const c = this.L.world('racketCenter'), n = this.L.hitNormal();
    let f = UP.clone().addScaledVector(n, -n.dot(UP)); if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
    const set = (line, pts) => { const a = line.geometry.attributes.position; pts.forEach((p, i) => a.setXYZ(i, p.x, p.y, p.z)); a.needsUpdate = true; line.geometry.computeBoundingSphere(); if (line.computeLineDistances) line.computeLineDistances(); };
    set(P.vert, [c.clone().addScaledVector(UP, -0.12), c.clone().addScaledVector(UP, 0.16)]);
    set(P.face, [c.clone().addScaledVector(f, -0.14), c.clone().addScaledVector(f, 0.14)]);
    const arc = []; for (let i = 0; i < 25; i++) arc.push(c.clone().addScaledVector(UP.clone().lerp(f, i / 24).normalize(), 0.1));
    set(P.arc, arc);
    return { pos: c.clone().addScaledVector(UP.clone().add(f).normalize(), 0.13), text: faceText(n) };
  }
  makeZones() {
    const g = new THREE.Group(); g.visible = false; this.zoneMeshes = {};
    for (const [id, z] of Object.entries(ZONES)) {
      if (id === 'elbow' || id.startsWith('wide')) continue;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.38), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; g.add(m); this.zoneMeshes[id] = m;
    }
    return g;
  }
  layoutZones(lefty) {
    for (const [id, m] of Object.entries(this.zoneMeshes)) { const p = zonePoint(id, 'opponent', lefty); m.position.set(p.x, TBL.H + 0.003, p.z); }
  }
  resize() {
    const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h;
    this.camera.fov = clamp(2 * Math.atan(Math.tan(24 * D2R) / (w / h)) / D2R, 45, 80); this.camera.updateProjectionMatrix();
  }
  configure({ lefty, grip, highlight, swapRubber }) {
    this.lefty = lefty;
    for (const P of [this.L]) { P.M.red.color.set(swapRubber ? 0x181818 : 0xc62828); P.M.black.color.set(swapRubber ? 0xc62828 : 0x181818); }
    this.L.setBase(V(0, 0, BASE_Z), 0, lefty); this.Gh.setBase(V(0, 0, BASE_Z), 0, lefty);
    this.O.setBase(V(0, 0, -BASE_Z), Math.PI, false);
    this.L.setGrip(grip, highlight); this.Gh.setGrip(grip, false);
    this.layoutZones(lefty);
  }
  load(spec, opts = {}) {
    this.spec = spec;
    this.configure({ lefty: opts.lefty, grip: spec.grip || opts.grip || 'shakeNeutral', highlight: !!spec.fingers, swapRubber: opts.swapRubber });
    const env = { L: this.L, O: this.O, lefty: opts.lefty };
    this.demo = buildDemo(spec, env);
    this.ghostDemo = opts.ghostSpec ? buildDemo(opts.ghostSpec, { L: this.Gh, O: this.O, lefty: opts.lefty }) : null;
    this.Gh.root.visible = !!this.ghostDemo;
    this.overlays = new Set(spec.overlays || []);
    if (opts.layerOverrides) for (const [k, v] of Object.entries(opts.layerOverrides)) v ? this.overlays.add(k) : this.overlays.delete(k);
    this.hideSpin = !!spec.hideSpin;
    this.ballMat.map = this.hideSpin ? this.texPlain : this.texStripe; this.ballMat.needsUpdate = true;
    this.speed = spec.speed || 0.5; this.pauseAtContact = spec.pauseAtContact !== false && this.demo.tMain != null;
    this.t = 0; this.paused1 = false; this.playing = true;
    this.controls.autoRotate = !!spec.autoRotate;
    this.buildOverlays();
    this.setCallouts(spec.callouts || []);
    this.apply(0);
    this.setCamera(spec.cam || 'behind', !this.camState);
    this.hooks.onLoad?.(this.demo);
  }
  buildOverlays() {
    this.over.clear();
    const D = this.demo;
    // ball path
    if (D.samples.length) {
      const segs = {};
      D.samples.forEach(s => { if (s.hidden || s.k < 0) return; (segs[s.k] = segs[s.k] || []).push(s); });
      this.pathGroup = new THREE.Group(); this.over.add(this.pathGroup);
      for (const [k, arr] of Object.entries(segs)) {
        const by = D.shots[k]?.by || 'learner';
        const geo = new THREE.BufferGeometry().setFromPoints(arr.map(s => s.p));
        const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: by === 'learner' ? 0x4fc3f7 : 0xff8a65, transparent: true, opacity: 0.85 }));
        this.pathGroup.add(l);
      }
      const cnt = {}; D.events.filter(e => e.type === 'table' && (cnt[e.k] = (cnt[e.k] || 0) + 1) <= 2).forEach(e => {
        const r = new THREE.Mesh(new THREE.RingGeometry(0.025, 0.04, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
        r.rotation.x = -Math.PI / 2; r.position.set(e.p.x, TBL.H + 0.004, e.p.z); this.pathGroup.add(r);
      });
      if (D.tMain != null && D.mainShot?._ball) {
        const m = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.004, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffe066 }));
        m.position.copy(D.mainShot._ball); m.lookAt(this.camera.position); this.contactMark = m; this.over.add(m);
      } else this.contactMark = null;
    } else { this.pathGroup = null; this.contactMark = null; }
    // racket path
    const pts = []; const step = 1 / 60, end = D.static ? 0 : D.duration;
    const save = this.t;
    for (let t = 0; t <= end; t += step) { const p = poseAt(D.tl.learner, t); this.L.apply(p); pts.push(this.L.world('racketCenter')); }
    this.t = save;
    if (pts.length > 2) { this.racketPath = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xc792ea, transparent: true, opacity: 0.9 })); this.over.add(this.racketPath); }
    else this.racketPath = null;
    // toss marker
    this.tossMark = null;
    if (D.toss && D.toss.by === 'learner') {
      const g = new THREE.Group(), p = D.toss.p;
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p, p.clone().add(V(0, 0.16, 0))]), new THREE.LineBasicMaterial({ color: 0x7ee787 }));
      g.add(l);
      for (const y of [0, 0.16]) { const tk = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p.clone().add(V(-0.03, y, 0)), p.clone().add(V(0.03, y, 0))]), new THREE.LineBasicMaterial({ color: 0x7ee787 })); g.add(tk); }
      this.tossMark = g; this.over.add(g);
    }
    // zones target highlight
    Object.values(this.zoneMeshes).forEach(m => { m.material.opacity = 0.08; m.material.color.set(0xffffff); });
    const ms = D.mainShot; if (ms && ms.by === 'learner' && this.zoneMeshes[ms.to || STROKES[ms.stroke].to]) { const m = this.zoneMeshes[ms.to || STROKES[ms.stroke].to]; m.material.opacity = 0.3; m.material.color.set(0x7ee787); }
  }
  setCallouts(list) {
    this.labelsEl.querySelectorAll('.callout').forEach(e => e.remove());
    this.callouts = list.filter(c => ANCHORS.includes(c[0]) || c[0] === 'ball').map(([target, text]) => {
      const el = document.createElement('div'); el.className = 'callout'; el.innerHTML = '<span class="dot"></span><span class="txt"></span>';
      el.querySelector('.txt').textContent = text; this.labelsEl.appendChild(el); return { target, el };
    });
    if (!this.protLabel) { this.protLabel = document.createElement('div'); this.protLabel.className = 'protlabel'; this.labelsEl.appendChild(this.protLabel); }
    if (!this.tossLabel) { this.tossLabel = document.createElement('div'); this.tossLabel.className = 'protlabel toss'; this.tossLabel.textContent = '16 cm'; this.labelsEl.appendChild(this.tossLabel); }
  }
  anchor(name) { return name === 'ball' ? this.ball.position.clone() : this.L.world(name); }
  setCamera(name, instant) {
    const lefty = this.lefty, sx = lefty ? -1 : 1, L = this.L;
    let pos, tgt, track = null;
    switch (name) {
      case 'side': pos = V(3.4 * sx, 1.35, 1.25); tgt = V(0, 0.9, 1.0); break;
      case 'overhead': pos = V(0, 4.8, 0.9); tgt = V(0, 0.76, 0.05); break;
      case 'opponent': pos = V(-0.3, 1.65, -3.7); tgt = V(0, 0.85, 1.0); break;
      case 'eyes': { const h = L.world('head'); pos = h.clone().add(V(0, 0.05, -0.02)); tgt = V(0, 0.82, -0.9); track = 'eyes'; break; }
      case 'grip': { const h = L.world('handCenter'), n = L.hitNormal(); tgt = h; const fw = L.foreLocal ? L.foreLocal.clone().applyQuaternion(L.hand.getWorldQuaternion(Qn())) : V(); fw.y = Math.min(fw.y, 0); pos = h.clone().addScaledVector(n, 0.42).addScaledVector(fw, -0.3).add(V(0, 0.06, 0)); track = 'grip'; break; }
      case 'racketFace': {
        const D = this.demo; const save = this.t;
        if (D.tMain != null) this.apply(D.tMain);
        const c = L.world('racketCenter'), n = L.hitNormal(); let h = V(n.x, 0, n.z); if (h.lengthSq() < 1e-4) h.set(0, 0, -1); h.normalize();
        let side = V().crossVectors(h, UP).normalize(); if (side.x * sx * (L.bhNow ? -1 : 1) < 0) side.negate();
        tgt = c; pos = c.clone().addScaledVector(side, 0.8).add(V(0, 0.16, -0.08));
        this.apply(save); break;
      }
      default: pos = V(0.55 * sx, 2.25, 5.0); tgt = V(0, 0.85, 0.6); name = 'behind';
    }
    L.headG.visible = L.neck.visible = name !== 'eyes';
    this.camState = { name, pos, tgt, track, anchor0: track ? this.trackPoint(track) : null, t0: performance.now(), dur: instant ? 0 : 700, from: { pos: this.camera.position.clone(), tgt: this.controls.target.clone() }, lastTrack: null };
    this.hooks.onCamera?.(name);
  }
  trackPoint(kind) { return kind === 'grip' ? this.L.world('handCenter') : kind === 'racket' ? this.L.world('racketCenter') : kind === 'eyes' ? this.L.world('head') : null; }
  updateCamera() {
    const C = this.camState; if (!C) return;
    const u = C.dur ? smooth((performance.now() - C.t0) / C.dur) : 1;
    if (!C.done) {
      if (u >= 1) C.done = true;
      let pos = C.pos, tgt = C.tgt;
      if (C.track) { const tp = this.trackPoint(C.track); const d = V().subVectors(tp, C.anchor0); pos = pos.clone().add(d); if (C.track !== 'eyes') tgt = tgt.clone().add(d); }
      this.camera.position.lerpVectors(C.from.pos, pos, u); this.controls.target.lerpVectors(C.from.tgt, tgt, u);
      C.lastTrack = C.track ? this.trackPoint(C.track) : null;
    } else if (C.track) {
      const tp = this.trackPoint(C.track);
      if (C.lastTrack) { const d = V().subVectors(tp, C.lastTrack); this.camera.position.add(d); if (C.track !== 'eyes') this.controls.target.add(d); }
      C.lastTrack = tp;
    }
  }
  apply(t) {
    const D = this.demo; if (!D) return;
    const s = sampleBall(D.samples, t);
    const withLook = (P, pose) => { if (s && !s.hidden) pose.look = P.w2l(s.p, pose.rootOff); return pose; };
    this.L.apply(withLook(this.L, poseAt(D.tl.learner, t))); this.O.apply(withLook(this.O, poseAt(D.tl.opponent, t)));
    if (this.ghostDemo) this.Gh.apply(poseAt(this.ghostDemo.tl.learner, t));
    if (!s || s.hidden) { this.ball.visible = false; this.curBall = null; }
    else { this.ball.visible = true; this.ball.position.copy(s.p); this.ball.quaternion.copy(s.q); this.curBall = s; }
    // free-hand ball while holding: keep ball on palm for learner serve pre-toss
    if (s && s.k === -1 && !s.hidden && D.toss) {
      const P = D.toss.by === 'learner' ? this.L : this.O; const fh = P.root.localToWorld(P.J.free.clone()); this.ball.position.copy(fh).add(V(0, 0.032, 0));
    }
  }
  frame() {
    const now = performance.now(), dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    const D = this.demo;
    if (D && this.playing) {
      const prevT = this.t; this.t += dt * this.speed;
      if (this.pauseAtContact && !this.paused1 && D.tMain != null && prevT < D.tMain && this.t >= D.tMain) { this.t = D.tMain; this.playing = false; this.paused1 = true; this.hooks.onPause?.('contact'); }
      if (this.t > D.duration) { if (this.loop || D.static) { this.t = 0; this.paused1 = false; } else { this.t = D.duration; this.playing = false; this.hooks.onPause?.('end'); } }
    }
    if (D) this.apply(this.t);
    this.updateCamera(); this.controls.update();
    this.updateOverlays();
    this.renderer.render(this.scene, this.camera);
    this.hooks.onFrame?.(this.t, D);
  }
  updateOverlays() {
    const O = this.overlays, D = this.demo; if (!D) return;
    if (this.pathGroup) this.pathGroup.visible = O.has('ballPath');
    if (this.racketPath) this.racketPath.visible = O.has('racketPath');
    if (this.contactMark) { this.contactMark.visible = O.has('contact') || O.has('ballPath'); this.contactMark.lookAt(this.camera.position); }
    this.zones.visible = O.has('zones');
    if (this.tossMark) this.tossMark.visible = O.has('toss');
    const b = this.curBall;
    const showArrow = O.has('spinAxis') && !this.hideSpin && b && b.w.length() > 15 && this.ball.visible;
    this.arrow.visible = !!showArrow;
    if (showArrow) { const wl = b.w.length(); this.arrow.position.copy(this.ball.position); this.arrow.setDirection(b.w.clone().divideScalar(wl)); this.arrow.setLength(0.06 + Math.min(0.12, wl / 2500), 0.03, 0.02); }
    const pr = this.updateProtractor(O.has('faceAngle'));
    const W = this.el.clientWidth, H = this.el.clientHeight;
    const proj = (p, el) => {
      const v = p.clone().project(this.camera); const vis = v.z < 1 && v.z > -1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      el.style.display = vis ? '' : 'none'; if (vis) el.style.transform = `translate(${(v.x * 0.5 + 0.5) * W}px, ${(-v.y * 0.5 + 0.5) * H}px)`;
    };
    if (pr) { this.protLabel.textContent = pr.text; proj(pr.pos, this.protLabel); } else if (this.protLabel) this.protLabel.style.display = 'none';
    if (this.tossLabel) { if (this.tossMark && O.has('toss')) proj(D.toss.p.clone().add(V(0.04, 0.17, 0)), this.tossLabel); else this.tossLabel.style.display = 'none'; }
    const showLabels = O.has('labels'); const shown = [];
    for (const c of this.callouts) {
      if (!showLabels || (c.target === 'ball' && !this.ball.visible)) { c.el.style.display = 'none'; continue; }
      const v = this.anchor(c.target).project(this.camera);
      if (!(v.z < 1 && v.z > -1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1)) { c.el.style.display = 'none'; continue; }
      c.x = (v.x * 0.5 + 0.5) * W; c.y = (-v.y * 0.5 + 0.5) * H; if (!c.w) { c.el.style.display = ''; c.w = c.el.querySelector('.txt').offsetWidth || 0; } shown.push(c);
    }
    // keep labels on screen and apart: flip to the left near the right edge, then spread vertically
    shown.sort((a, b) => a.y - b.y); const placed = [];
    for (const c of shown) {
      const x0 = clamp(c.x + 6, 4, Math.max(4, W - c.w - 6));
      let ty = Math.max(44, c.y - 26);
      for (const p of placed) if (x0 < p.x1 + 4 && x0 + c.w > p.x0 - 4 && ty < p.y + 24 && ty > p.y - 24) ty = p.y + 24;
      placed.push({ x0, x1: x0 + c.w, y: ty });
      c.el.style.display = ''; c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
      c.el.style.setProperty('--dy', (ty - c.y) + 'px'); c.el.style.setProperty('--dx', (x0 - c.x) + 'px');
    }
  }
  hud() {
    const n = this.L.hitNormal(); const b = this.curBall;
    let spin = null; if (b && this.ball.visible) { const i = this.demo.samples.findIndex(s => s.t >= b.t); const s2 = this.demo.samples[Math.min(this.demo.samples.length - 1, i + 1)]; const v = s2 ? V().subVectors(s2.p, b.p) : V(0, 0, -1); spin = spinLabel(b.w, v); }
    return { face: faceText(n), spin };
  }
}
