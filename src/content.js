// ================= CONTENT: strokes, grips, spins, zones, lessons =================
// Coordinates for strokes are PLAYER-LOCAL for a right-handed player:
// origin on the floor between the feet, +x = player's right, +y = up, -z = toward the net.
// The table's end line sits at local z = -0.63 when the player is in the base position.
const N = (yaw, fa) => { const y = yaw * Math.PI / 180, f = fa * Math.PI / 180; return [Math.sin(y) * Math.cos(f), Math.sin(f), -Math.cos(y) * Math.cos(f)]; };
const K = (t, p, n, tip, o = {}) => ({ t, p, n, tip, ...o });
const B = (rot, crouch, lean) => ({ rot, crouch, lean });

const FH_R = { p: [0.25, 1.0, -0.4], n: N(-5, 0), tip: [1, 0.35, -0.1] };
const BH_R = { p: [0.02, 1.0, -0.42], n: N(0, 0), tip: [-1, 0.4, -0.2], bh: true };
const kr = (t, base, o = {}) => ({ t, ...base, ...o });
const READY_B = B(0, 0.12, 0.18);

const STROKES = {
  ready: { name: 'Ready position', static: true, keys: [
    K(0, [0.1, 1.0, -0.42], N(-35, 5), [0.25, 0.75, -0.55], { body: B(0, 0.12, 0.2) }),
    K(1, [0.1, 1.01, -0.42], N(-35, 5), [0.25, 0.75, -0.55], { body: B(0, 0.14, 0.21) }),
    K(2, [0.1, 1.0, -0.42], N(-35, 5), [0.25, 0.75, -0.55], { body: B(0, 0.12, 0.2) })] },
  gripShow: { name: 'Grip close-up', static: true, keys: [
    K(0, [0.2, 1.12, -0.5], N(-55, 15), [0.2, 0.65, -0.75], { body: B(0, 0.05, 0.08) }),
    K(3, [0.2, 1.12, -0.5], N(-55, 15), [0.2, 0.65, -0.75], { body: B(0, 0.05, 0.08) })] },

  fhDrive: { name: 'Forehand drive', c: 2, timing: 'peak', speed: 7, spin: 'topspin', to: 'longBH', feed: 'feedTopspin', feedTo: 'longFH', keys: [
    kr(0, FH_R, { body: READY_B }),
    K(0.35, [0.55, 0.9, -0.02], N(-20, -5), [0.75, 0.15, 0.55], { body: B(0.6, 0.16, 0.2), free: [-0.12, 1.08, -0.42] }),
    K(0.5, [0.45, 1.0, -0.45], N(0, -15), [1, 0.3, -0.05], { body: B(0.1, 0.13, 0.2), free: [-0.28, 1.05, -0.28] }),
    K(0.68, [0.08, 1.38, -0.55], N(-35, -25), [0.45, 1, 0.2], { body: B(-0.45, 0.1, 0.15), free: [-0.36, 1.0, -0.05] }),
    kr(1.05, FH_R, { body: READY_B })] },

  bhDrive: { name: 'Backhand drive', c: 2, timing: 'peak', speed: 6.5, spin: 'topspin', to: 'longBH', feed: 'feedTopspin', feedTo: 'longBH', bh: true, keys: [
    kr(0, BH_R, { body: READY_B }),
    K(0.32, [-0.02, 0.93, -0.2], N(10, -5), [-0.6, -0.1, -0.6], { body: B(-0.15, 0.15, 0.2) }),
    K(0.45, [-0.02, 1.03, -0.52], N(0, -15), [-1, 0.25, -0.15], { body: B(0, 0.13, 0.2) }),
    K(0.62, [0.2, 1.25, -0.68], N(20, -25), [-0.4, 0.85, -0.4], { body: B(0.1, 0.1, 0.2) }),
    kr(0.95, BH_R, { body: READY_B })] },

  fhPush: { name: 'Forehand push', c: 2, timing: 'peak', speed: 3.4, spin: 'backspin', to: 'longBH', feed: 'feedBackspin', feedTo: 'shortFH', keys: [
    K(0, [0.22, 1.0, -0.42], N(0, 15), [1, 0.25, -0.2], { body: B(0, 0.14, 0.25) }),
    K(0.3, [0.3, 1.02, -0.4], N(-5, 50), [0.9, 0.1, -0.35], { body: B(0.2, 0.16, 0.32) }),
    K(0.48, [0.25, 0.92, -0.72], N(0, 50), [0.85, 0.05, -0.5], { body: B(0.05, 0.17, 0.38) }),
    K(0.65, [0.15, 0.92, -0.92], N(0, 55), [0.85, 0.1, -0.5], { body: B(0, 0.16, 0.4) }),
    K(1.0, [0.22, 1.0, -0.42], N(0, 15), [1, 0.25, -0.2], { body: B(0, 0.14, 0.25) })] },

  bhPush: { name: 'Backhand push', c: 2, timing: 'peak', speed: 3.4, spin: 'backspin', to: 'longBH', feed: 'feedBackspin', feedTo: 'shortBH', bh: true, keys: [
    K(0, [0.02, 1.0, -0.42], N(0, 15), [-1, 0.3, -0.2], { body: B(0, 0.14, 0.25) }),
    K(0.3, [0.02, 1.02, -0.42], N(0, 55), [-0.7, 0.2, -0.4], { body: B(-0.1, 0.16, 0.32) }),
    K(0.48, [0.0, 0.92, -0.74], N(0, 50), [-0.8, 0.1, -0.55], { body: B(0, 0.17, 0.38) }),
    K(0.65, [0.02, 0.92, -0.94], N(0, 55), [-0.75, 0.1, -0.6], { body: B(0, 0.16, 0.4) }),
    K(1.0, [0.02, 1.0, -0.42], N(0, 15), [-1, 0.3, -0.2], { body: B(0, 0.14, 0.25) })] },

  bhBlock: { name: 'Backhand block', c: 2, timing: 'rising', speed: 5, spin: 'lightTop', to: 'longBH', feed: 'feedLoop', feedTo: 'longBH', bh: true, keys: [
    K(0, [0.0, 1.02, -0.45], N(0, -5), [-1, 0.35, -0.25], { body: B(0, 0.13, 0.22) }),
    K(0.25, [0.0, 1.04, -0.5], N(0, -20), [-1, 0.35, -0.3], { body: B(0, 0.14, 0.24) }),
    K(0.36, [0.0, 1.04, -0.62], N(0, -20), [-1, 0.3, -0.3], { body: B(0, 0.14, 0.26) }),
    K(0.5, [0.02, 1.06, -0.68], N(0, -20), [-1, 0.3, -0.3], { body: B(0, 0.14, 0.26) }),
    K(0.85, [0.0, 1.02, -0.45], N(0, -5), [-1, 0.35, -0.25], { body: B(0, 0.13, 0.22) })] },

  fhLoop: { name: 'Forehand topspin (loop)', c: 2, timing: 'peak', speed: 6, spin: 'heavyTopspin', to: 'longMid', feed: 'feedBackspinLong', feedTo: 'longFH', keys: [
    kr(0, FH_R, { body: B(0, 0.14, 0.2) }),
    K(0.38, [0.55, 0.72, 0.0], N(-15, -20), [0.6, -0.35, 0.7], { body: B(0.7, 0.22, 0.28), free: [-0.1, 1.05, -0.42] }),
    K(0.55, [0.45, 0.98, -0.4], N(0, -35), [1, 0.15, -0.05], { body: B(0.15, 0.16, 0.22), free: [-0.28, 1.05, -0.28] }),
    K(0.72, [0.05, 1.5, -0.5], N(-30, -40), [0.4, 1, 0.25], { body: B(-0.5, 0.08, 0.12), free: [-0.36, 1.0, -0.05] }),
    kr(1.1, FH_R, { body: B(0, 0.14, 0.2) })] },

  bhFlick: { name: 'Backhand flick', c: 2, timing: 'peak', speed: 5, spin: 'topspin', to: 'longBH', feed: 'serveShortBackspin', feedTo: 'shortBH', bh: true, keys: [
    K(0, [0.02, 1.0, -0.42], N(0, 5), [-1, 0.35, -0.2], { body: B(0, 0.14, 0.25) }),
    K(0.3, [0.0, 0.95, -0.68], N(0, -5), [-0.2, -0.8, -0.55], { body: B(0, 0.18, 0.38) }),
    K(0.42, [0.02, 0.98, -0.78], N(0, -5), [-0.9, 0.25, -0.35], { body: B(0, 0.17, 0.38) }),
    K(0.55, [0.12, 1.12, -0.95], N(15, -20), [-0.3, 0.9, -0.4], { body: B(0, 0.15, 0.36) }),
    K(0.95, [0.02, 1.0, -0.42], N(0, 5), [-1, 0.35, -0.2], { body: B(0, 0.14, 0.25) })] },

  fhChop: { name: 'Forehand chop', c: 2, timing: 'late', speed: 5, spin: 'heavyBackspin', to: 'longMid', feed: 'feedLoop', feedTo: 'longFH', rootOffset: [0, 0, 0.9], keys: [
    K(0, [0.3, 1.1, -0.35], N(0, 25), [1, 0.4, 0], { body: B(0, 0.1, 0.15) }),
    K(0.35, [0.45, 1.35, 0.0], N(-10, 40), [0.7, 0.6, 0.35], { body: B(0.5, 0.08, 0.1) }),
    K(0.55, [0.4, 0.88, -0.35], N(0, 55), [0.9, 0.1, -0.4], { body: B(0.15, 0.2, 0.25) }),
    K(0.72, [0.15, 0.7, -0.6], N(0, 60), [0.75, 0.05, -0.65], { body: B(-0.2, 0.22, 0.3) }),
    K(1.1, [0.3, 1.1, -0.35], N(0, 25), [1, 0.4, 0], { body: B(0, 0.1, 0.15) })] },

  // ---------------- SERVES ----------------
  serveShortBackspin: { name: 'Short backspin serve', serve: true, toss: 0.35, c: 2, serveVy: -0.25, spin: 'heavyBackspin', to: 'shortMid', rootOffset: [-0.2, 0, -0.05], keys: [
    K(0, [0.35, 1.05, -0.3], N(-10, 55), [0.85, 0.2, -0.3], { body: B(0.35, 0.14, 0.25) }),
    K(0.55, [0.38, 1.05, -0.28], N(-10, 65), [0.8, 0.25, -0.3], { body: B(0.4, 0.15, 0.27) }),
    K(0.85, [0.12, 0.93, -0.5], N(-10, 65), [0.85, 0.05, -0.45], { body: B(0.25, 0.17, 0.3) }),
    K(1.05, [-0.02, 0.92, -0.62], N(-10, 65), [0.85, 0.05, -0.5], { body: B(0.2, 0.17, 0.3) }),
    kr(1.7, FH_R, { body: READY_B })] },
  serveNoSpin: { name: 'No-spin "fake" serve', serve: true, toss: 0.35, c: 2, serveVy: -0.25, spin: 'noSpin', to: 'shortMid', rootOffset: [-0.2, 0, -0.05], keys: [
    K(0, [0.35, 1.05, -0.3], N(-10, 45), [0.85, 0.2, -0.3], { body: B(0.35, 0.14, 0.25) }),
    K(0.55, [0.38, 1.05, -0.28], N(-5, 40), [0.8, 0.25, -0.3], { body: B(0.4, 0.15, 0.27) }),
    K(0.85, [0.12, 0.94, -0.5], N(-5, 22), [0.9, 0.15, -0.35], { body: B(0.25, 0.17, 0.3) }),
    K(1.05, [-0.02, 0.94, -0.62], N(-5, 22), [0.9, 0.15, -0.35], { body: B(0.2, 0.17, 0.3) }),
    kr(1.7, FH_R, { body: READY_B })] },
  serveFastLong: { name: 'Fast long topspin serve', serve: true, toss: 0.35, c: 2, serveVy: -2.0, b1: 1.05, spin: 'topspin', spinRate: 150, to: 'longBH', rootOffset: [-0.3, 0, 0.05], keys: [
    K(0, [0.4, 1.0, -0.2], N(-10, -10), [0.9, 0.3, 0.2], { body: B(0.45, 0.14, 0.2) }),
    K(0.55, [0.5, 0.98, -0.1], N(-15, -15), [0.8, 0.2, 0.4], { body: B(0.55, 0.15, 0.22) }),
    K(0.85, [0.2, 0.97, -0.48], N(0, -25), [0.95, 0.3, -0.1], { body: B(0.15, 0.15, 0.22) }),
    K(1.02, [-0.08, 1.15, -0.62], N(-25, -30), [0.6, 0.8, -0.1], { body: B(-0.2, 0.13, 0.2) }),
    kr(1.7, FH_R, { body: READY_B })] },
  servePendulum: { name: 'Pendulum serve (side + back)', serve: true, toss: 0.35, c: 2, serveVy: -0.25, spin: 'sideBack', to: 'shortMid', rootOffset: [-0.35, 0, 0], keys: [
    K(0, [0.4, 1.15, -0.25], N(-80, 15), [0.15, -1, 0.1], { body: B(0.45, 0.14, 0.25) }),
    K(0.55, [0.48, 1.08, -0.3], N(-80, 20), [0.2, -1, 0.1], { body: B(0.5, 0.15, 0.27) }),
    K(0.85, [0.14, 0.97, -0.5], N(-80, 20), [0.25, -1, -0.1], { body: B(0.35, 0.16, 0.28) }),
    K(1.02, [-0.12, 0.97, -0.52], N(-80, 25), [0.25, -1, -0.1], { body: B(0.3, 0.16, 0.28) }),
    kr(1.7, FH_R, { body: READY_B })] },
  serveReversePendulum: { name: 'Reverse pendulum serve', serve: true, toss: 0.35, c: 2, serveVy: -0.25, spin: 'rSideBack', to: 'shortMid', rootOffset: [-0.3, 0, 0], keys: [
    K(0, [0.05, 1.15, -0.35], N(80, 15), [-0.1, -1, 0.1], { body: B(0.4, 0.14, 0.25) }),
    K(0.55, [0.0, 1.08, -0.38], N(80, 20), [-0.2, -1, 0.1], { body: B(0.4, 0.15, 0.27) }),
    K(0.85, [0.18, 0.97, -0.5], N(80, 20), [-0.2, -1, -0.1], { body: B(0.3, 0.16, 0.28) }),
    K(1.02, [0.42, 0.97, -0.45], N(80, 25), [-0.2, -1, -0.1], { body: B(0.2, 0.16, 0.28) }),
    kr(1.7, FH_R, { body: READY_B })] },
  serveBackhandSide: { name: 'Backhand sidespin serve', serve: true, toss: 0.35, c: 2, serveVy: -0.35, b1: 0.8, spin: 'rSideTop', spinRate: 130, to: 'halfMid', rootOffset: [-0.1, 0, 0], bh: true, keys: [
    K(0, [-0.25, 1.02, -0.35], N(80, 10), [-0.4, 0.3, -0.85], { body: B(0, 0.14, 0.25) }),
    K(0.55, [-0.35, 1.0, -0.3], N(80, 15), [-0.3, 0.2, -0.9], { body: B(-0.15, 0.15, 0.27) }),
    K(0.85, [-0.02, 0.95, -0.5], N(75, 15), [-0.2, 0.2, -0.95], { body: B(0, 0.16, 0.28) }),
    K(1.02, [0.22, 0.97, -0.55], N(70, 15), [-0.2, 0.3, -0.9], { body: B(0.1, 0.16, 0.28) }),
    kr(1.7, BH_R, { body: READY_B })] },
  serveTomahawk: { name: 'Tomahawk serve', serve: true, toss: 0.35, c: 2, serveVy: -0.25, spin: 'rSideBack', to: 'shortFH', rootOffset: [-0.2, 0, 0], keys: [
    K(0, [0.0, 1.15, -0.35], N(80, 0), [-0.1, 1, -0.1], { body: B(0.2, 0.14, 0.25) }),
    K(0.55, [-0.05, 1.1, -0.4], N(80, 5), [-0.1, 1, -0.15], { body: B(0.2, 0.15, 0.27) }),
    K(0.85, [0.12, 1.0, -0.5], N(80, 10), [-0.1, 1, -0.1], { body: B(0.15, 0.16, 0.28) }),
    K(1.02, [0.35, 0.97, -0.45], N(80, 10), [0.1, 1, 0], { body: B(0.1, 0.16, 0.28) }),
    kr(1.7, FH_R, { body: READY_B })] },
};

const FEEDS = {
  feedTopspin: { stroke: 'fhDrive', spin: 'topspin', speed: 5.5, label: 'Topspin drive' },
  feedBackspin: { stroke: 'bhPush', spin: 'backspin', speed: 3.2, label: 'Short backspin push' },
  feedBackspinLong: { stroke: 'bhPush', spin: 'backspin', speed: 4.5, label: 'Long backspin push' },
  feedLoop: { stroke: 'fhLoop', spin: 'heavyTopspin', speed: 6, label: 'Heavy topspin loop' },
  feedBlock: { stroke: 'bhBlock', spin: 'lightTop', speed: 5, label: 'Block' },
};

// spin: top>0 topspin, top<0 backspin; side = rotation about the vertical axis; rate in rad/s
const SPINS = {
  noSpin: { top: 0, side: 0, rate: 0, label: 'No spin' },
  lightTop: { top: 1, side: 0, rate: 60, label: 'Light topspin' },
  topspin: { top: 1, side: 0, rate: 120, label: 'Topspin' },
  heavyTopspin: { top: 1, side: 0, rate: 250, label: 'Heavy topspin' },
  lightBackspin: { top: -1, side: 0, rate: 60, label: 'Light backspin' },
  backspin: { top: -1, side: 0, rate: 120, label: 'Backspin' },
  heavyBackspin: { top: -1, side: 0, rate: 250, label: 'Heavy backspin' },
  sideBack: { top: -0.6, side: -0.8, rate: 220, label: 'Sidespin + backspin' },
  sideTop: { top: 0.6, side: -0.8, rate: 220, label: 'Sidespin + topspin' },
  rSideBack: { top: -0.6, side: 0.8, rate: 220, label: 'Reverse side + backspin' },
  rSideTop: { top: 0.5, side: 0.85, rate: 200, label: 'Reverse side + topspin' },
};

// Landing zones, relative to the RECEIVER: [depth, lateral toward receiver's forehand]
const ZONES = {
  shortFH: ['short', 0.42], shortMid: ['short', 0], shortBH: ['short', -0.42],
  halfFH: ['half', 0.45], halfMid: ['half', 0], halfBH: ['half', -0.45],
  longFH: ['long', 0.5], longMid: ['long', 0], longBH: ['long', -0.5],
  elbow: ['long', 0.12], wideFH: ['long', 0.66], wideBH: ['long', -0.66],
};
const DEPTH = { short: 0.45, half: 0.85, long: 1.18 };

// ---------------- GRIPS (racket-local coordinates, right hand) ----------------
// Racket local: +y toward the tip, +z = forehand (red) face, -z = backhand (black) face.
// Handle from y=-0.075 to -0.175.  Each finger: 4 points (knuckle -> tip).
const SHAKE = {
  thumb: [[-0.045, -0.13, 0.035], [-0.03, -0.097, 0.026], [-0.012, -0.077, 0.017], [0.006, -0.064, 0.0135]],
  index: [[-0.036, -0.088, -0.03], [-0.012, -0.076, -0.0165], [0.012, -0.066, -0.0142], [0.032, -0.058, -0.0135]],
  middle: [[-0.038, -0.106, -0.03], [0.0, -0.108, -0.021], [0.024, -0.112, -0.002], [0.008, -0.115, 0.021]],
  ring: [[-0.037, -0.127, -0.029], [0.0, -0.13, -0.021], [0.024, -0.133, -0.002], [0.009, -0.136, 0.02]],
  pinky: [[-0.035, -0.15, -0.026], [-0.002, -0.153, -0.0205], [0.022, -0.156, -0.003], [0.008, -0.158, 0.018]],
};
const SHAKE_PALM = [[-0.036, -0.088, -0.03], [-0.038, -0.106, -0.03], [-0.037, -0.127, -0.029], [-0.035, -0.15, -0.026],
  [-0.045, -0.13, 0.035], [-0.042, -0.168, 0.026], [-0.072, -0.178, 0.022], [-0.072, -0.198, -0.02],
  [-0.058, -0.092, -0.018], [-0.06, -0.155, -0.016], [-0.06, -0.125, 0.02], [-0.028, -0.163, 0.018], [-0.026, -0.11, 0.004], [-0.05, -0.185, 0.0]];
const GRIPS = {
  shakeNeutral: { name: 'Shakehand (neutral)', f: SHAKE, palm: SHAKE_PALM, wrist: [-0.075, -0.19, 0], fore: [-0.77, -0.64, 0], rotY: 0 },
  shakeFH: { name: 'Shakehand (forehand grip)', f: SHAKE, palm: SHAKE_PALM, wrist: [-0.075, -0.19, 0], fore: [-0.77, -0.64, 0], rotY: 14 },
  shakeBH: { name: 'Shakehand (backhand grip)', f: SHAKE, palm: SHAKE_PALM, wrist: [-0.075, -0.19, 0], fore: [-0.77, -0.64, 0], rotY: -14 },
  errIndex: { name: 'Index finger up the middle', f: { ...SHAKE, index: [[-0.036, -0.088, -0.03], [-0.012, -0.062, -0.0165], [-0.002, -0.036, -0.0142], [0.004, -0.012, -0.0135]] }, palm: SHAKE_PALM, wrist: [-0.075, -0.19, 0], fore: [-0.77, -0.64, 0], rotY: 0 },
  errThumb: { name: 'Thumb pushed up the face', f: { ...SHAKE, thumb: [[-0.045, -0.13, 0.035], [-0.03, -0.095, 0.026], [-0.02, -0.062, 0.017], [-0.012, -0.034, 0.0135]] }, palm: SHAKE_PALM, wrist: [-0.075, -0.19, 0], fore: [-0.77, -0.64, 0], rotY: 0 },
  shakeMine: { name: 'Your grip', f: { ...SHAKE,
    thumb: [[-0.042, -0.15, 0.033], [-0.021, -0.119, 0.026], [-0.007, -0.091, 0.022], [-0.002, -0.068, 0.0165]],
    index: [[-0.036, -0.088, -0.03], [-0.01, -0.075, -0.0165], [0.018, -0.058, -0.0142], [0.04, -0.036, -0.0135]] },
    palm: SHAKE_PALM, wrist: [-0.075, -0.19, 0], fore: [-0.77, -0.64, 0], rotY: 0 },
  penhold: { name: 'Penhold', rotY: 0, wrist: [-0.005, -0.235, 0.02], fore: [-0.15, -0.99, 0.0], f: {
    thumb: [[0.035, -0.17, 0.025], [0.034, -0.128, 0.026], [0.024, -0.098, 0.019], [0.01, -0.08, 0.0135]],
    index: [[-0.03, -0.155, 0.028], [-0.036, -0.12, 0.024], [-0.026, -0.093, 0.017], [-0.01, -0.08, 0.0135]],
    middle: [[-0.032, -0.165, -0.012], [-0.04, -0.13, -0.03], [-0.03, -0.103, -0.021], [-0.016, -0.09, -0.0135]],
    ring: [[-0.022, -0.17, -0.018], [-0.02, -0.135, -0.033], [-0.008, -0.108, -0.023], [0.0, -0.095, -0.0135]],
    pinky: [[-0.01, -0.175, -0.018], [-0.003, -0.145, -0.03], [0.008, -0.123, -0.022], [0.013, -0.112, -0.0135]] },
    palm: [[-0.03, -0.155, 0.028], [0.035, -0.17, 0.025], [-0.032, -0.165, -0.012], [-0.022, -0.17, -0.018], [-0.01, -0.175, -0.018],
      [0.02, -0.2, 0.03], [-0.03, -0.205, 0.0], [0.01, -0.235, 0.025], [-0.02, -0.235, -0.005], [0.03, -0.215, -0.01], [0.0, -0.18, 0.04]] },
};

const CAMERAS = { grip: 'Grip close-up', racketFace: 'Racket face', eyes: "Player's eyes", side: 'Side', overhead: 'Overhead', opponent: "Opponent's view", behind: 'Behind' };
const ANCHORS = ['thumb', 'index', 'fingers', 'wrist', 'elbow', 'shoulder', 'racketFace', 'handle', 'ball', 'hips', 'knees', 'feet', 'freeHand', 'head'];
const OVERLAYS = { ballPath: 'Ball path', spinAxis: 'Spin arrow', racketPath: 'Racket path', faceAngle: 'Face angle', contact: 'Contact point', zones: 'Target zones', labels: 'Labels' };
const TIMINGS = ['rising', 'peak', 'falling', 'late'];
const OUTCOMES = ['good', 'net', 'long', 'high', 'wide'];

// ---------------- CURRICULUM ----------------
const MODULES = [
  { id: 'm1', name: 'Foundations' }, { id: 'm2', name: 'Racket angle & spin' }, { id: 'm3', name: 'Core strokes' },
  { id: 'm4', name: 'Serves' }, { id: 'm5', name: 'Serve return' }, { id: 'm6', name: 'Rallies & tactics' }, { id: 'm7', name: 'Rules & scoring' }];

const opp = (stroke, to, o = {}) => ({ by: 'opponent', stroke, to, ...o });
const me = (stroke, o = {}) => ({ by: 'learner', stroke, main: true, ...o });
const feed = (feedId, to) => { const f = FEEDS[feedId]; return { by: 'opponent', stroke: f.stroke, spin: f.spin, speed: f.speed, to }; };

const LESSONS = [
  // ===== M1 =====
  { id: 'grip-shakehand', m: 'm1', title: 'The shakehand grip',
    why: 'Almost all modern players use the shakehand grip. A relaxed, neutral grip lets you play forehand and backhand without changing your hold.',
    keys: ['Hold it like a handshake: the handle runs diagonally across your palm.', 'Thumb rests lightly on the red (forehand) rubber, next to the handle.', 'Index finger lies along the bottom edge of the black (backhand) rubber.', 'Middle, ring and little fingers wrap the handle loosely.', 'Grip pressure about 3 out of 10 — squeeze only at contact.'],
    demo: { pose: 'gripShow', cam: 'grip', grip: 'shakeNeutral', fingers: true, autoRotate: true, overlays: ['labels'] },
    callouts: [['thumb', 'Thumb: relaxed on the red rubber'], ['index', 'Index: along the black rubber edge'], ['fingers', '3 fingers wrap the handle'], ['wrist', 'Wrist: neutral, not cocked']],
    items: [
      { kind: 'variant', label: 'Your grip (from your photos)', fix: 'Your grip is a sound neutral shakehand. Your thumb runs straight up the handle and rests at the bottom edge of the forehand rubber — good, keep it relaxed. Your index finger runs up the edge of the backhand rubber, a little higher than the textbook position; that\'s fine as long as it stays on the edge and never slides toward the middle. The app colours your rubbers to match your racket.', demo: { grip: 'shakeMine' } },
      { kind: 'mistake', label: 'Index finger up the middle', fix: 'Keep the index finger low, along the edge of the rubber. Up the middle it blocks your backhand and stiffens the wrist.', demo: { grip: 'errIndex' } },
      { kind: 'mistake', label: 'Thumb pushed up the face', fix: 'Keep the thumb close to the handle. Pushed up the red face, it locks the wrist on the forehand.', demo: { grip: 'errThumb' } }],
    quiz: [
      { q: 'Where does the index finger go in a shakehand grip?', o: ['Along the bottom edge of the black rubber', 'Up the middle of the black rubber', 'Wrapped around the handle'], a: 0, e: 'Low along the edge keeps the backhand face free and the wrist relaxed.' },
      { q: 'How tight should you hold the racket between shots?', o: ['Very tight so it never moves', 'Relaxed, about 3/10, tightening at contact', 'As loose as possible all the time'], a: 1, e: 'A relaxed grip lets the wrist and forearm move freely; firm up only at contact.' }],
    drill: 'Bounce the ball on the red face 50 times, then the black face 50 times, then alternate faces. Target: 50 alternating bounces without changing your grip.' },

  { id: 'grip-variations', m: 'm1', title: 'Forehand vs backhand grip',
    why: 'Small rotations of the racket in your hand favour one side. Beginners should stay neutral; it helps to know what the others look like.',
    keys: ['Neutral: the blade edge points to the V between thumb and index.', 'Forehand grip: racket turned so more of the thumb sits on the red side.', 'Backhand grip: racket turned the other way; thumb higher on the blade.', 'Return to neutral between shots.'],
    demo: { pose: 'gripShow', cam: 'grip', fingers: true, autoRotate: true, overlays: ['labels'] },
    callouts: [['thumb', 'Thumb'], ['index', 'Index finger']],
    items: [
      { kind: 'variant', label: 'Forehand grip', fix: 'Stronger, easier forehands; the backhand face points down and becomes awkward.', demo: { grip: 'shakeFH' } },
      { kind: 'variant', label: 'Backhand grip', fix: 'Easier backhand flicks and blocks; the forehand face opens up and gets harder to close.', demo: { grip: 'shakeBH' } }],
    quiz: [{ q: 'Which grip should a beginner use most of the time?', o: ['Forehand grip', 'Backhand grip', 'Neutral grip'], a: 2, e: 'Neutral works for both sides, so you never need to adjust mid-rally.' }],
    drill: 'Hold neutral, then rotate to forehand grip and back 10 times without looking. Feel where the thumb sits each time.' },

  { id: 'grip-penhold', m: 'm1', title: 'Penhold grip (overview)',
    why: 'Penhold is popular in Asia. The racket is held like a pen; most strokes use the same face.',
    keys: ['Thumb and index finger curl around the throat on the red side.', 'The other three fingers rest curled on the back of the blade.', 'Great over the table and on the forehand; the backhand needs special technique.', 'This app teaches shakehand strokes, so switch only if you already play penhold.'],
    demo: { pose: 'gripShow', cam: 'grip', grip: 'penhold', fingers: true, autoRotate: true, overlays: ['labels'] },
    callouts: [['thumb', 'Thumb on the red side'], ['index', 'Index curls round the throat'], ['fingers', 'Other fingers support the back']],
    items: [{ kind: 'variant', label: 'Compare with shakehand', fix: 'Shakehand uses both faces and is easier to learn for an adult beginner.', demo: { grip: 'shakeNeutral' } }],
    quiz: [{ q: 'In penhold, where are the thumb and index finger?', o: ['On the red side, around the throat', 'On the back of the blade', 'Wrapped around the handle end'], a: 0, e: 'They form a "C" around the throat on the front face.' }],
    drill: 'Optional: try 20 forehand bounces in penhold to feel the difference, then switch back to shakehand.' },

  { id: 'ready-stance', m: 'm1', title: 'Ready position',
    why: 'A good ready position lets you move fast to either side and reach the ball in balance.',
    keys: ['Feet wider than shoulders, right foot slightly back (right-handers).', 'Knees bent, weight on the balls of your feet.', 'Lean forward from the hips.', 'Racket in front of you, at table height, roughly in the middle.', 'Stand about an arm and a racket away from the end line.'],
    demo: { pose: 'ready', cam: 'side', overlays: ['labels'] },
    callouts: [['knees', 'Knees bent'], ['feet', 'Wide stance, on the balls of the feet'], ['racketFace', 'Racket in front, table height'], ['freeHand', 'Free arm up for balance']],
    items: [
      { kind: 'mistake', label: 'Standing upright', fix: 'Bend the knees and lean forward. Upright, you react slowly and swing only with the arm.', demo: { body: { crouch: 0.0, lean: 0.0 } } },
      { kind: 'mistake', label: 'Too close to the table', fix: 'Step back so you have room to swing. Too close, every fast ball jams you.', demo: { rootOffset: [0, 0, -0.35] } }],
    quiz: [{ q: 'Where should your weight be in the ready position?', o: ['On your heels', 'On the balls of your feet', 'Mostly on the back foot'], a: 1, e: 'On the balls of your feet you can push off quickly in any direction.' }],
    drill: 'Shadow drill: hold the ready position for 10 seconds, bounce lightly, repeat 10 times. Check in a mirror that your knees stay bent.' },

  { id: 'footwork', m: 'm1', title: 'Footwork: the side-step',
    why: 'You hit better when your feet put you in position, not when your arm stretches for the ball.',
    keys: ['Move with small side-steps; don\'t cross your feet for short distances.', 'Push off the outside foot, keep knees bent.', 'Get to the ball first, then swing.', 'Return to a balanced middle position after each shot.'],
    demo: { cam: 'overhead', speed: 0.5, overlays: ['ballPath', 'labels'], rally: [feed('feedTopspin', 'longFH'), me('fhDrive', { to: 'longBH' }), opp('bhBlock', 'longBH', { speed: 5 }), { by: 'learner', stroke: 'bhDrive', to: 'longBH' }] },
    callouts: [['feet', 'Side-step, don\'t cross']],
    items: [],
    quiz: [{ q: 'For a short movement to the side, you should…', o: ['Cross your feet', 'Side-step', 'Just reach with your arm'], a: 1, e: 'Side-steps keep you balanced and facing the table.' }],
    drill: 'Falkenberg-lite: partner feeds alternately to your forehand and backhand corners. 2 sets of 20 balls; focus on side-stepping, not reaching.' },

  // ===== M2 =====
  { id: 'face-angle', m: 'm2', title: 'Racket angle: open and closed',
    why: 'The angle of your racket face decides where the ball goes. Incoming spin decides which angle you need.',
    keys: ['Open face (tilted up) lifts the ball — used against backspin.', 'Closed face (tilted down) keeps the ball low — used against topspin.', 'Watch the protractor: angle is measured from vertical.', 'Most errors in the net or long are angle errors, not power errors.'],
    demo: { cam: 'racketFace', speed: 0.25, overlays: ['faceAngle', 'ballPath', 'labels'], rally: [feed('feedBackspin', 'shortFH'), me('fhPush')] },
    callouts: [['racketFace', 'Open face vs backspin']],
    items: [
      { kind: 'variant', label: 'Closed face (topspin drive)', fix: 'Against topspin, close the face about 15–30° and hit forward.', demo: { rally: [feed('feedTopspin', 'longFH'), me('fhDrive')] } },
      { kind: 'variant', label: 'Very closed (block)', fix: 'Against a heavy loop, close even more and let the ball come onto the racket.', demo: { rally: [feed('feedLoop', 'longBH'), me('bhBlock')] } }],
    quiz: [
      { q: 'Against backspin, your racket face should be…', o: ['Open (tilted up)', 'Closed (tilted down)', 'Exactly vertical'], a: 0, e: 'Backspin makes the ball drop off your racket, so open the face to lift it.' },
      { q: 'Your topspin drives keep flying long. First fix?', o: ['Hit harder', 'Close the racket face more', 'Open the racket face'], a: 1, e: 'Closing the face brings the ball down onto the table.' }],
    drill: 'Partner feeds 10 backspin then 10 topspin balls. Say "open" or "close" out loud before each contact.' },

  { id: 'brush-vs-hit', m: 'm2', title: 'Brushing vs hitting',
    why: 'Spin comes from brushing the ball; speed comes from hitting through it. Good strokes mix both.',
    keys: ['Brush: the racket grazes the ball, moving mostly upward — lots of spin.', 'Hit: the racket meets the ball squarely, moving forward — more speed.', 'A loop is mostly brush; a drive is mostly hit.', 'Watch the racket path line against the ball\'s spin arrow.'],
    demo: { cam: 'side', speed: 0.25, overlays: ['racketPath', 'spinAxis', 'ballPath', 'labels'], rally: [feed('feedBackspinLong', 'longFH'), me('fhLoop')] },
    callouts: [['racketFace', 'Brush: thin contact, upward path']],
    items: [{ kind: 'variant', label: 'Hit (flat drive)', fix: 'A flatter, forward path: faster ball, less spin, less margin.', demo: { rally: [feed('feedTopspin', 'longFH'), me('fhDrive')] } }],
    quiz: [{ q: 'Which creates more spin?', o: ['Hitting squarely through the ball', 'Brushing the ball with an upward path'], a: 1, e: 'Friction from a glancing contact turns racket speed into spin.' }],
    drill: 'Throw the ball up and brush it upward with an almost-vertical racket so it spins in place. 20 reps.' },

  { id: 'spin-types', m: 'm2', title: 'The four spins and their bounce',
    why: 'Each spin changes how the ball flies, bounces, and comes off the opponent\'s racket.',
    keys: ['Topspin: ball dips in the air and kicks forward after the bounce.', 'Backspin: ball floats, then slows and "checks" after the bounce.', 'Sidespin: ball curves and jumps sideways off a racket.', 'No spin: floats straight and sits up — easy to attack if you spot it.'],
    demo: { cam: 'side', speed: 0.5, overlays: ['spinAxis', 'ballPath', 'labels'], rally: [me('serveFastLong')] },
    callouts: [['ball', 'Yellow arrow = spin axis']],
    items: [
      { kind: 'variant', label: 'Backspin', fix: 'Racket goes under the ball; ball stays short and slow.', demo: { rally: [me('serveShortBackspin')] } },
      { kind: 'variant', label: 'Sidespin', fix: 'Racket moves sideways across the ball; the axis is near vertical.', demo: { rally: [me('servePendulum')] } },
      { kind: 'variant', label: 'No spin', fix: 'Same look as backspin, but the racket pushes forward instead of brushing.', demo: { rally: [me('serveNoSpin')] } }],
    quiz: [
      { q: 'After bouncing, a backspin ball tends to…', o: ['Kick forward fast', 'Slow down and stay short', 'Curve sideways'], a: 1, e: 'Backspin grips the table and brakes the ball.' },
      { q: 'A ball with topspin in the air will…', o: ['Float up', 'Dip down', 'Fly straight'], a: 1, e: 'The Magnus effect pushes a topspin ball downward.' }],
    drill: 'With a partner, each serve 5 of each spin. The receiver calls the spin before touching the ball.' },

  // ===== M3 =====
  { id: 'fh-drive', m: 'm3', title: 'Forehand drive',
    why: 'The basic attacking stroke and the foundation of the forehand topspin.',
    keys: ['Turn your waist and shoulders back — not just the arm.', 'Contact in front of the body, at the top of the bounce.', 'Racket face closed about 15°, swing forward and slightly up.', 'Finish with the racket near your forehead, then recover.'],
    demo: { cam: 'behind', speed: 0.5, overlays: ['ballPath', 'spinAxis', 'labels'], rally: [feed('feedTopspin', 'longFH'), me('fhDrive')] },
    callouts: [['racketFace', 'Closed ~15°'], ['hips', 'Rotate the waist'], ['elbow', 'Elbow relaxed, near the body']],
    items: [
      { kind: 'mistake', label: 'Racket too open', fix: 'Close the face. Open, the topspin lifts the ball long.', result: 'Ball flies long', demo: { shot: { faceDelta: 30, outcome: 'long' } } },
      { kind: 'mistake', label: 'Contact too late', fix: 'Take the ball at the top of the bounce, in front of you.', result: 'Ball goes into the net', demo: { shot: { timing: 'falling', outcome: 'net' } } },
      { kind: 'mistake', label: 'Arm only, no body turn', fix: 'Rotate your waist back and through; the arm follows.', result: 'Weak, inconsistent ball', demo: { shot: { bodyRotScale: 0.1, speed: 4 } } }],
    quiz: [
      { q: 'Where should you contact a forehand drive?', o: ['Beside or behind your body', 'In front of your body, at the top of the bounce', 'As the ball drops below the table'], a: 1, e: 'In front, at the top: you see the ball and have the most control.' },
      { q: 'What powers the drive most?', o: ['The wrist', 'Waist and shoulder rotation', 'Gripping tighter'], a: 1, e: 'Body rotation gives consistent power; the arm guides.' }],
    drill: 'Forehand-to-forehand cross-court with a partner. Target: 30 in a row with a full waist turn on every ball.' },

  { id: 'bh-drive', m: 'm3', title: 'Backhand drive',
    why: 'A compact attacking stroke from the backhand side, played in front of the body.',
    keys: ['Racket starts in front of your belly, elbow in front of the body.', 'Contact in front, at the top of the bounce.', 'Forearm rotates forward and up; elbow stays still like a hinge.', 'Face closed about 15°.'],
    demo: { cam: 'behind', speed: 0.5, overlays: ['ballPath', 'spinAxis', 'labels'], rally: [feed('feedTopspin', 'longBH'), me('bhDrive')] },
    callouts: [['elbow', 'Elbow in front, acts as a hinge'], ['racketFace', 'Closed ~15°']],
    items: [
      { kind: 'mistake', label: 'Racket too open', fix: 'Close the face so the ball stays on the table.', result: 'Ball flies long', demo: { shot: { faceDelta: 30, outcome: 'long' } } },
      { kind: 'mistake', label: 'Contact too late', fix: 'Meet the ball earlier, in front of your body.', result: 'Ball into the net', demo: { shot: { timing: 'falling', outcome: 'net' } } }],
    quiz: [{ q: 'In the backhand drive, the elbow should…', o: ['Swing out wide', 'Stay in front of the body like a hinge', 'Stay tucked behind the hip'], a: 1, e: 'A stable elbow makes the stroke compact and repeatable.' }],
    drill: 'Backhand-to-backhand diagonal. Target: 30 in a row, racket finishing at eye level.' },

  { id: 'fh-push', m: 'm3', title: 'Forehand push',
    why: 'A safe backspin return of short backspin balls, played over the table.',
    keys: ['Step in with your right foot under the table.', 'Open the face about 45–50°.', 'Brush under the ball, moving forward, at the top of the bounce.', 'Keep it short and low, or long and fast to a corner.'],
    demo: { cam: 'racketFace', speed: 0.25, overlays: ['faceAngle', 'ballPath', 'spinAxis', 'labels'], rally: [feed('feedBackspin', 'shortFH'), me('fhPush')] },
    callouts: [['racketFace', 'Open ~50°'], ['feet', 'Step in with the right foot']],
    items: [
      { kind: 'mistake', label: 'Racket too closed', fix: 'Open the face more against backspin.', result: 'Ball into the net', demo: { shot: { faceDelta: -40, outcome: 'net' } } },
      { kind: 'mistake', label: 'Hitting instead of brushing', fix: 'Graze the bottom of the ball; don\'t bat it.', result: 'Ball pops up high', demo: { shot: { outcome: 'high', faceDelta: 15 } } }],
    quiz: [{ q: 'Typical racket angle for a push against backspin?', o: ['About 45–50° open', 'Vertical', 'Closed 20°'], a: 0, e: 'Open enough to lift the backspin over the net.' }],
    drill: 'Push rally forehand to forehand. Target: 20 pushes that bounce twice on the other side if left alone.' },

  { id: 'bh-push', m: 'm3', title: 'Backhand push',
    why: 'The most common return of short backspin to your backhand.',
    keys: ['Racket in front of the body, elbow forward.', 'Face open about 50°.', 'Forearm moves forward and slightly down; brush under the ball.', 'Contact at the top of the bounce.'],
    demo: { cam: 'racketFace', speed: 0.25, overlays: ['faceAngle', 'ballPath', 'spinAxis', 'labels'], rally: [feed('feedBackspin', 'shortBH'), me('bhPush')] },
    callouts: [['racketFace', 'Open ~50°'], ['elbow', 'Elbow forward']],
    items: [
      { kind: 'mistake', label: 'Racket too closed', fix: 'Open the face more.', result: 'Ball into the net', demo: { shot: { faceDelta: -40, outcome: 'net' } } },
      { kind: 'mistake', label: 'Too late — ball dropping', fix: 'Move in and take it at the top.', result: 'Ball into the net', demo: { shot: { timing: 'falling', outcome: 'net' } } }],
    quiz: [{ q: 'A push that keeps going into the net usually means…', o: ['Face too closed', 'Face too open', 'Swinging too slowly'], a: 0, e: 'Backspin drops off a closed face — open it.' }],
    drill: 'Backhand push rally. Target: 20 in a row, then 10 alternating short and long.' },

  { id: 'bh-block', m: 'm3', title: 'Backhand block',
    why: 'A short, firm stroke to return fast topspin attacks safely.',
    keys: ['Very small backswing — just set the racket.', 'Face closed about 20°; more against heavier topspin.', 'Take the ball early, just after the bounce.', 'Let the opponent\'s speed do the work.'],
    demo: { cam: 'side', speed: 0.25, overlays: ['faceAngle', 'ballPath', 'spinAxis', 'labels'], rally: [feed('feedLoop', 'longBH'), me('bhBlock')] },
    callouts: [['racketFace', 'Closed ~20°, firm'], ['ball', 'Take it on the rise']],
    items: [
      { kind: 'mistake', label: 'Racket too open', fix: 'Close the face — topspin jumps up off an open racket.', result: 'Ball flies long', demo: { shot: { faceDelta: 35, outcome: 'long' } } },
      { kind: 'mistake', label: 'Swinging at it', fix: 'Block, don\'t hit: a short, firm push forward.', result: 'Ball flies high and long', demo: { shot: { outcome: 'high' } } }],
    quiz: [{ q: 'When should you contact a block?', o: ['Early, on the rise', 'At the top', 'As it falls'], a: 0, e: 'Early contact uses the incoming speed and gives the opponent less time.' }],
    drill: 'Partner loops to your backhand; you block back. Target: 15 blocks in a row.' },

  { id: 'fh-loop', m: 'm3', title: 'Forehand topspin (loop)',
    why: 'The main attacking shot in modern table tennis, especially against backspin.',
    keys: ['Drop the racket low behind you, bending the right knee.', 'Brush the back-top of the ball, swinging up and forward.', 'Drive from the legs, then waist, then arm.', 'Against backspin swing more upward; against topspin more forward.'],
    demo: { cam: 'side', speed: 0.25, overlays: ['racketPath', 'ballPath', 'spinAxis', 'labels'], rally: [feed('feedBackspinLong', 'longFH'), me('fhLoop')] },
    callouts: [['knees', 'Load the right leg'], ['racketFace', 'Brush up and forward'], ['hips', 'Legs → waist → arm']],
    items: [
      { kind: 'mistake', label: 'Too closed against backspin', fix: 'Open the face slightly and lift more.', result: 'Ball into the net', demo: { shot: { faceDelta: -15, outcome: 'net' } } },
      { kind: 'mistake', label: 'No leg drive', fix: 'Bend your knees and push up through the stroke.', result: 'Weak loop into the net', demo: { shot: { body: { crouch: 0.02 }, outcome: 'net' } } }],
    quiz: [{ q: 'Looping against backspin, the swing should be…', o: ['More upward', 'More forward', 'Downward'], a: 0, e: 'Backspin pulls the ball down; an upward path lifts it.' }],
    drill: 'Partner serves or pushes long backspin; you loop. Target: 7 out of 10 on the table.' },

  { id: 'bh-flick', m: 'm3', title: 'Backhand flick',
    why: 'An attacking return of short serves, played over the table with the wrist.',
    keys: ['Step in under the table.', 'Cock the wrist so the racket tip points down and back.', 'Contact at the top of the bounce, near the side of the ball.', 'Snap the wrist forward and up — short, fast motion.'],
    demo: { cam: 'racketFace', speed: 0.25, overlays: ['faceAngle', 'ballPath', 'labels'], rally: [opp('serveShortBackspin', 'shortBH'), me('bhFlick')] },
    callouts: [['wrist', 'Wrist cocked, then snaps'], ['racketFace', 'Contact at the top']],
    items: [
      { kind: 'mistake', label: 'Contact too late', fix: 'Get in early — after the peak the ball drops below the net.', result: 'Ball into the net', demo: { shot: { timing: 'falling', outcome: 'net' } } },
      { kind: 'mistake', label: 'Face too closed vs backspin', fix: 'Open slightly and lift more against heavy backspin.', result: 'Ball into the net', demo: { shot: { faceDelta: -25, outcome: 'net' } } }],
    quiz: [{ q: 'Where does the power of a flick come from?', o: ['Waist rotation', 'A fast wrist snap', 'A long backswing'], a: 1, e: 'Over the table there\'s no room for a big swing; the wrist provides speed.' }],
    drill: 'Partner serves short to your backhand. Flick 10, then push 10, then mix at random.' },

  { id: 'fh-chop', m: 'm3', title: 'Forehand chop (intro)',
    why: 'A defensive stroke from far back that returns topspin with heavy backspin.',
    keys: ['Stand well back from the table.', 'Racket starts high, face open about 50°.', 'Swing down and forward, brushing the bottom of the ball.', 'Contact late, as the ball falls.'],
    demo: { cam: 'side', speed: 0.25, overlays: ['faceAngle', 'ballPath', 'spinAxis', 'labels'], rally: [feed('feedLoop', 'longFH'), me('fhChop')] },
    callouts: [['racketFace', 'Open ~55°'], ['ball', 'Contact as it falls']],
    items: [{ kind: 'mistake', label: 'Face too closed', fix: 'Open the face; a closed chop drives the ball down.', result: 'Ball into the net', demo: { shot: { faceDelta: -35, outcome: 'net' } } }],
    quiz: [{ q: 'A chop puts what spin on the ball?', o: ['Topspin', 'Backspin', 'No spin'], a: 1, e: 'Brushing down under the ball makes backspin.' }],
    drill: 'Partner loops gently from mid-distance; you chop. Target: 10 in a row.' },

  // ===== M4 =====
  { id: 'serve-rules', m: 'm4', title: 'Legal serve rules',
    why: 'An illegal serve loses the point. These rules also make your serve harder to read honestly.',
    keys: ['Ball rests on an open, flat palm before the toss.', 'Toss almost vertically, at least 16 cm high.', 'Strike the ball as it falls, behind your end line and above table height.', 'The ball must bounce once on your side, then once on the opponent\'s.', 'Don\'t hide the ball from the receiver with your body or free arm.'],
    demo: { cam: 'side', speed: 0.5, overlays: ['ballPath', 'labels', 'toss'], rally: [me('serveShortBackspin')] },
    callouts: [['freeHand', 'Open flat palm'], ['ball', 'Toss ≥ 16 cm, near vertical'], ['racketFace', 'Contact behind the end line']],
    items: [],
    quiz: [
      { q: 'Minimum toss height?', o: ['5 cm', '16 cm', '30 cm'], a: 1, e: 'The rule is at least 16 cm after leaving the palm.' },
      { q: 'Where must you contact the serve?', o: ['Above the table', 'Behind your end line, above table height', 'Anywhere'], a: 1, e: 'Behind the end line and above the level of the playing surface.' }],
    drill: 'Serve 20 balls with a visible 16 cm+ toss. Ask a friend to watch for legality.' },

  { id: 'serve-short-backspin', m: 'm4', title: 'Short backspin serve',
    why: 'The most useful serve for beginners: hard to attack and sets up your third ball.',
    keys: ['Open the racket face a lot — about 60–65°.', 'Contact the bottom-back of the ball, brushing forward-under.', 'Contact low, just above the table.', 'First bounce close to the net on your side keeps it short.'],
    demo: { cam: 'racketFace', speed: 0.25, overlays: ['faceAngle', 'spinAxis', 'ballPath', 'labels'], rally: [me('serveShortBackspin')] },
    callouts: [['racketFace', 'Very open, brush under'], ['ball', 'Contact low']],
    items: [
      { kind: 'mistake', label: 'Not enough open face', fix: 'Open the face more and brush, don\'t push.', result: 'Ball goes long and is easy to attack', demo: { shot: { faceDelta: -35, outcome: 'long' } } }],
    quiz: [{ q: 'To keep a backspin serve short, the first bounce should land…', o: ['Near your end line', 'Close to the net on your side', 'On the opponent\'s side'], a: 1, e: 'A first bounce near the net leaves less distance for the ball to travel.' }],
    drill: 'Serve 30 short backspin serves. Target: the ball would bounce twice on the other side.' },

  { id: 'serve-no-spin', m: 'm4', title: 'No-spin "fake" serve',
    why: 'Looks like backspin, but isn\'t. Opponents push it high, giving you an easy attack.',
    keys: ['Same body and toss as the backspin serve.', 'Contact nearer the handle, face less open.', 'Push forward rather than brushing under.', 'Mix it with your real backspin serve.'],
    demo: { cam: 'racketFace', speed: 0.25, overlays: ['faceAngle', 'spinAxis', 'ballPath', 'labels'], rally: [me('serveNoSpin')] },
    callouts: [['racketFace', 'Less open, push forward']],
    items: [{ kind: 'variant', label: 'Compare: real backspin', fix: 'Notice how similar they look from the receiver\'s side.', demo: { rally: [me('serveShortBackspin')], cam: 'opponent' } }],
    quiz: [{ q: 'Why does a no-spin serve work?', o: ['It\'s faster', 'Receivers read it as backspin and push it up', 'It\'s illegal'], a: 1, e: 'Pushing a no-spin ball with an open face makes it pop up.' }],
    drill: 'Alternate backspin and no-spin serves, 10 each. Ask your partner to guess.' },

  { id: 'serve-fast-long', m: 'm4', title: 'Fast long topspin serve',
    why: 'Surprises the receiver and forces a quick reaction.',
    keys: ['Racket face closed, brushing up the back of the ball.', 'First bounce close to your own end line.', 'Aim deep to a corner or the receiver\'s elbow.', 'Use it occasionally, after short serves.'],
    demo: { cam: 'side', speed: 0.5, overlays: ['spinAxis', 'ballPath', 'labels'], rally: [me('serveFastLong')] },
    callouts: [['racketFace', 'Closed, brush up and forward']],
    items: [{ kind: 'mistake', label: 'First bounce too far forward', fix: 'Contact lower and aim the first bounce near your end line.', result: 'Ball flies off the end', demo: { shot: { outcome: 'long' } } }],
    quiz: [{ q: 'Where should the first bounce of a long serve be?', o: ['Near your end line', 'Near the net'], a: 0, e: 'That gives the ball the full table length to travel deep.' }],
    drill: 'Serve 20 fast long serves to the backhand corner. Target: 15 landing within 30 cm of the end line.' },

  { id: 'serve-pendulum', m: 'm4', title: 'Forehand pendulum serve',
    why: 'The most common sidespin serve; the same motion can carry side-backspin or side-topspin.',
    keys: ['Stand side-on in your backhand corner.', 'Racket tip points down; swing from right to left like a pendulum.', 'Contact the back-left of the ball for side-backspin.', 'Wrist snap at contact creates the spin.'],
    demo: { cam: 'racketFace', speed: 0.25, overlays: ['spinAxis', 'ballPath', 'labels'], rally: [me('servePendulum')] },
    callouts: [['racketFace', 'Tip down, swing right → left'], ['wrist', 'Snap at contact']],
    items: [{ kind: 'variant', label: 'Receiver\'s view', fix: 'This is what the receiver sees — watch the racket direction.', demo: { cam: 'opponent' } }],
    quiz: [{ q: 'In a forehand pendulum, the racket tip points…', o: ['Up', 'Down', 'At the net'], a: 1, e: 'The racket hangs down and swings across the ball.' }],
    drill: 'Serve 30 pendulum serves. Watch the ball curve; try short ones first.' },

  { id: 'serve-reverse', m: 'm4', title: 'Reverse pendulum serve',
    why: 'Gives the opposite sidespin to the normal pendulum, from the same position.',
    keys: ['Same stance and toss as the pendulum.', 'Racket swings left to right, with the elbow raised.', 'Contact the back-right of the ball.', 'Harder to learn — practise slowly first.'],
    demo: { cam: 'racketFace', speed: 0.25, overlays: ['spinAxis', 'ballPath', 'labels'], rally: [me('serveReversePendulum')] },
    callouts: [['elbow', 'Elbow up'], ['racketFace', 'Swing left → right']],
    items: [{ kind: 'variant', label: 'Compare: normal pendulum', fix: 'Opposite racket direction gives the opposite sidespin.', demo: { rally: [me('servePendulum')] } }],
    quiz: [{ q: 'Compared with the pendulum, the reverse pendulum makes…', o: ['The same spin', 'The opposite sidespin', 'No spin'], a: 1, e: 'The racket travels the other way across the ball.' }],
    drill: 'Shadow the motion 20 times without a ball, then serve 20.' },

  { id: 'serve-backhand', m: 'm4', title: 'Backhand sidespin serve',
    why: 'An easy-to-learn sidespin serve played in front of the body.',
    keys: ['Stand square, ball in front of you.', 'Racket starts on the left, black face toward the ball.', 'Swing left to right across the ball.', 'Brush the side of the ball for sidespin.'],
    demo: { cam: 'behind', speed: 0.5, overlays: ['spinAxis', 'ballPath', 'labels'], rally: [me('serveBackhandSide')] },
    callouts: [['racketFace', 'Swing left → right'], ['wrist', 'Snap through contact']],
    items: [],
    quiz: [{ q: 'The backhand sidespin serve uses which face?', o: ['Red (forehand)', 'Black (backhand)'], a: 1, e: 'It\'s played with the backhand face in front of the body.' }],
    drill: 'Serve 20 backhand sidespin serves; aim half short and half long.' },

  { id: 'serve-tomahawk', m: 'm4', title: 'Tomahawk serve (intro)',
    why: 'Another way to make reverse sidespin, with the racket tip pointing up.',
    keys: ['Racket tip up, elbow high.', 'Swing from left to right across the ball.', 'Contact the left side of the ball.', 'Combine with the pendulum to confuse receivers.'],
    demo: { cam: 'racketFace', speed: 0.25, overlays: ['spinAxis', 'ballPath', 'labels'], rally: [me('serveTomahawk')] },
    callouts: [['racketFace', 'Tip up'], ['elbow', 'Elbow high']],
    items: [],
    quiz: [{ q: 'In the tomahawk serve the racket tip points…', o: ['Up', 'Down'], a: 0, e: 'Tip up, swinging across the ball like a tomahawk.' }],
    drill: 'Shadow 20 times, then 20 serves aiming short to the forehand.' },

  // ===== M5 =====
  { id: 'read-spin', m: 'm5', title: 'Reading spin on serves',
    why: 'Most serve-return errors come from misreading the spin, not from bad technique.',
    keys: ['Watch the server\'s racket at contact, not their body.', 'Racket moving under the ball → backspin.', 'Racket moving up/forward → topspin or no spin.', 'Racket moving sideways → sidespin; it will kick off your racket sideways.', 'Watch the bounce too: backspin checks, no-spin floats.'],
    demo: { cam: 'eyes', speed: 0.5, overlays: ['spinAxis', 'ballPath', 'labels'], rally: [opp('serveShortBackspin', 'shortBH')] },
    callouts: [['ball', 'Read the spin from the racket path']],
    items: [
      { kind: 'variant', label: 'No-spin serve', fix: 'Racket pushes forward; ball floats with almost no rotation.', demo: { rally: [opp('serveNoSpin', 'shortBH')] } },
      { kind: 'variant', label: 'Pendulum (side + back)', fix: 'Racket swings across; the axis tilts — it will kick sideways.', demo: { rally: [opp('servePendulum', 'shortMid')] } },
      { kind: 'variant', label: 'Fast long topspin', fix: 'Racket brushes up and forward; the ball kicks toward you.', demo: { rally: [opp('serveFastLong', 'longBH')] } }],
    quiz: [{ q: 'The server\'s racket moves under the ball. Expect…', o: ['Topspin', 'Backspin', 'No spin'], a: 1, e: 'Brushing under the ball creates backspin.' }],
    drill: 'Use Practice → Read the serve until you can score 8/10.' },

  { id: 'return-matrix', m: 'm5', title: 'Serve-return matrix',
    why: 'For each type of serve, some returns are safe and some are traps. Tap a cell to see it in 3D.',
    keys: ['✓ = recommended, ~ = possible, ✗ = risky.', 'Short balls: push or flick. Long balls: drive, loop or block.', 'Adjust the racket angle to the spin you read.'],
    matrix: true,
    demo: { cam: 'racketFace', speed: 0.5, overlays: ['faceAngle', 'ballPath', 'spinAxis'], rally: [opp('serveShortBackspin', 'shortBH'), me('bhPush')] },
    callouts: [], items: [],
    quiz: [{ q: 'Best safe return of a short backspin serve?', o: ['Block', 'Push', 'Loop'], a: 1, e: 'A push matches the backspin and keeps the ball low.' }],
    drill: 'Partner serves at random; you name the spin and return with the matching stroke. 3 sets of 10.' },

  { id: 'short-long', m: 'm5', title: 'Short vs long serves',
    why: 'Judging the length decides whether you step in or stay back.',
    keys: ['Short: would bounce twice on your side — step in, push or flick.', 'Long: would go off your end — stay back and attack.', 'Half-long is the trickiest: decide early.'],
    demo: { cam: 'side', speed: 0.5, overlays: ['ballPath', 'spinAxis', 'labels'], rally: [opp('serveShortBackspin', 'shortFH'), me('fhPush')] },
    callouts: [['feet', 'Step in for short balls']],
    items: [
      { kind: 'variant', label: 'Long serve: attack it', fix: 'Stay back, let it come, and loop or drive.', demo: { rally: [opp('serveFastLong', 'longFH'), me('fhDrive')] } },
      { kind: 'mistake', label: 'Looping a short ball', fix: 'You can\'t swing over the table — push or flick short serves.', result: 'Ball into the net', demo: { rally: [opp('serveShortBackspin', 'shortFH'), me('fhLoop', { outcome: 'net' })] } }],
    quiz: [{ q: 'A serve that would bounce twice on your side is…', o: ['Long', 'Short'], a: 1, e: 'Short serves stay on the table; attack them over the table.' }],
    drill: 'Partner mixes short and long serves; call "short" or "long" before you move.' },

  // ===== M6 =====
  { id: 'third-ball', m: 'm6', title: 'Serve and third-ball attack',
    why: 'Serve short backspin, get a long push back, and attack it. The most common winning pattern.',
    keys: ['Serve short backspin to make attacking hard.', 'Expect a long push — be ready on the forehand.', 'Loop the third ball with a strong upward swing.', 'Recover to ready right after the serve.'],
    demo: { cam: 'behind', speed: 0.5, overlays: ['ballPath', 'spinAxis', 'labels'], rally: [{ by: 'learner', stroke: 'serveShortBackspin', to: 'shortMid' }, opp('bhPush', 'longFH', { spin: 'backspin', speed: 4.5 }), me('fhLoop', { to: 'wideBH' })] },
    callouts: [['feet', 'Recover after the serve']],
    items: [],
    quiz: [{ q: 'After a short backspin serve, the most likely return is…', o: ['A loop', 'A push', 'A smash'], a: 1, e: 'Short backspin is hard to attack, so most players push it.' }],
    drill: 'Serve short backspin; partner pushes long to your forehand; you loop. 20 reps.' },

  { id: 'placement', m: 'm6', title: 'Placement: where to hit',
    why: 'Placement wins more points than speed at club level.',
    keys: ['Wide forehand and wide backhand stretch the opponent.', 'The playing elbow (crossover point) is hard to defend.', 'Change direction to make the opponent move.', 'Overhead view shows the target zones.'],
    demo: { cam: 'overhead', speed: 0.5, overlays: ['ballPath', 'zones'], rally: [feed('feedTopspin', 'longFH'), me('fhDrive', { to: 'wideFH' })] },
    callouts: [],
    items: [
      { kind: 'variant', label: 'Wide backhand', fix: 'Angle the racket and contact the outside of the ball.', demo: { shot: { to: 'wideBH' } } },
      { kind: 'variant', label: 'To the elbow', fix: 'The opponent must decide forehand or backhand — and often freezes.', demo: { shot: { to: 'elbow' } } }],
    quiz: [{ q: 'Why aim at the opponent\'s elbow?', o: ['It\'s the slowest part of the table', 'They must choose forehand or backhand', 'It\'s always legal'], a: 1, e: 'The crossover point causes hesitation.' }],
    drill: 'Put two targets (paper) in the wide corners; partner feeds; alternate targets. Score hits out of 20.' },

  // ===== M7 =====
  { id: 'rules-scoring', m: 'm7', title: 'Scoring and service order',
    why: 'Knowing the rules keeps games friendly and helps you plan your serves.',
    keys: ['Games go to 11 points; you must win by 2 (12-10, 13-11…).', 'Each player serves 2 points in a row, then switches.', 'At 10-10 (deuce), serve alternates every point.', 'A serve that touches the net and lands in is a let — replay it.', 'A ball that hits the top edge counts; the side of the table does not.', 'Matches are usually best of 5 or 7 games; switch ends after each game.'],
    demo: { cam: 'behind', speed: 1, overlays: ['ballPath'], rally: [me('serveShortBackspin')] },
    callouts: [], items: [],
    quiz: [
      { q: 'Score is 10-10. Who serves next?', o: ['The same server for 2 more', 'Serve alternates every point'], a: 1, e: 'At deuce, each player serves one point at a time.' },
      { q: 'Your serve clips the net and lands on the other side. Result?', o: ['Point to you', 'Point to the opponent', 'Let — replay'], a: 2, e: 'A net-touching serve that lands legally is a let.' }],
    drill: 'Play a game to 11 calling the score before every serve.' },

  { id: 'doubles', m: 'm7', title: 'Doubles basics',
    why: 'Doubles has extra serve rules and partners must alternate hits.',
    keys: ['Serve diagonally: from your right half to the receiver\'s right half.', 'Partners hit alternately — you can\'t hit twice in a row as a team.', 'Serve order rotates every 2 points.', 'Move out of your partner\'s way after each shot.'],
    demo: { cam: 'overhead', speed: 0.5, overlays: ['ballPath'], rally: [{ by: 'learner', stroke: 'serveShortBackspin', to: 'shortFH', main: true, rootOffset: [0.35, 0, -0.05] }] },
    callouts: [], items: [],
    quiz: [{ q: 'In doubles, the serve must go…', o: ['Anywhere', 'Diagonally, right half to right half', 'Straight down the line'], a: 1, e: 'The centre line splits each half; serves go cross-court.' }],
    drill: 'With 3 friends, play a doubles game focusing on moving out after each shot.' },
];

// Serve-return matrix (opponent serves -> your return)
const MATRIX = {
  serves: [
    { id: 'serveShortBackspin', name: 'Short backspin', to: 'shortBH' },
    { id: 'serveNoSpin', name: 'Short no-spin', to: 'shortBH' },
    { id: 'servePendulum', name: 'Pendulum side + back', to: 'shortMid' },
    { id: 'serveReversePendulum', name: 'Reverse pendulum', to: 'shortMid' },
    { id: 'serveFastLong', name: 'Fast long topspin', to: 'longBH' }],
  returns: [{ id: 'push', name: 'Push' }, { id: 'flick', name: 'Flick' }, { id: 'loop', name: 'Loop / drive' }, { id: 'block', name: 'Block' }],
  cells: {
    serveShortBackspin: {
      push: ['good', 'Open ~50°, brush under, keep it low.', { stroke: 'bhPush' }],
      flick: ['ok', 'Possible, but open the face a little more — heavy backspin.', { stroke: 'bhFlick', faceDelta: 10 }],
      loop: ['bad', 'The ball is too short to swing at.', { stroke: 'fhLoop', outcome: 'net' }],
      block: ['bad', 'A closed face against backspin goes in the net.', { stroke: 'bhBlock', outcome: 'net' }] },
    serveNoSpin: {
      push: ['ok', 'Use a less open face (~25°) or it pops up.', { stroke: 'bhPush', faceAngle: 25 }],
      flick: ['good', 'No-spin is the easiest ball to flick.', { stroke: 'bhFlick' }],
      loop: ['bad', 'Too short to loop.', { stroke: 'fhLoop', outcome: 'net' }],
      block: ['bad', 'Nothing to block against — ball dies.', { stroke: 'bhBlock', outcome: 'net' }] },
    servePendulum: {
      push: ['good', 'Push with the face slightly turned against the sidespin.', { stroke: 'bhPush' }],
      flick: ['ok', 'Aim toward the side the spin comes from to cancel the kick.', { stroke: 'bhFlick' }],
      loop: ['bad', 'Too short to loop.', { stroke: 'fhLoop', outcome: 'net' }],
      block: ['bad', 'Sidespin + backspin off a closed block goes into the net or wide.', { stroke: 'bhBlock', outcome: 'wide' }] },
    serveReversePendulum: {
      push: ['good', 'Push, angling the face against the reverse sidespin.', { stroke: 'bhPush' }],
      flick: ['ok', 'Possible; adjust aim for the sidespin.', { stroke: 'bhFlick' }],
      loop: ['bad', 'Too short to loop.', { stroke: 'fhLoop', outcome: 'net' }],
      block: ['bad', 'Closed face against backspin goes into the net.', { stroke: 'bhBlock', outcome: 'net' }] },
    serveFastLong: {
      push: ['bad', 'An open face against topspin sends it long.', { stroke: 'bhPush', outcome: 'long' }],
      flick: ['bad', 'Long balls are too deep to flick over the table.', { stroke: 'bhFlick', outcome: 'long' }],
      loop: ['good', 'Long topspin: drive it back with a closed face.', { stroke: 'bhDrive' }],
      block: ['good', 'Short, firm block with a closed face.', { stroke: 'bhBlock', timing: 'peak' }] } },
};
