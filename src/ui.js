// ================= UI =================
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const KEY = 'ttcoach3d.v1';
let storageOK = true;
function loadStore() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { storageOK = false; return null; } }
const state = Object.assign({ lefty: false, grip: 'mine', fhColor: 'black', lessonId: LESSONS[0].id, done: {}, quiz: {}, practice: { read: { n: 0, ok: 0 }, spot: { n: 0, ok: 0 }, quiz: { n: 0, ok: 0 } }, doubts: [] }, loadStore() || {});
state.layer = {};
{ const st = loadStore(); if (st && !st.fhColor) { state.grip = 'mine'; state.fhColor = 'black'; } }
function save() {
  const { lefty, grip, fhColor, lessonId, done, quiz, practice, doubts } = state;
  try { localStorage.setItem(KEY, JSON.stringify({ lefty, grip, fhColor, lessonId, done, quiz, practice, doubts: doubts.slice(0, 40) })); } catch (e) { storageOK = false; }
}
const lessonById = id => LESSONS.find(l => l.id === id);
const clone = o => JSON.parse(JSON.stringify(o));

// ---------- stage ----------
let cur = { spec: null };
let hudTick = 0;
const stage = new Stage($('#stage'), $('#labels'), {
  onFrame: (t, D) => {
    if (!D) return;
    if (!scrubbing) $('#scrub').value = Math.round((t / D.duration) * 1000);
    $('#time').textContent = t.toFixed(2) + ' s';
    if (++hudTick % 6 === 0) renderHud(t, D);
  },
  onPause: () => syncPlay(),
  onCamera: name => document.querySelectorAll('#camBar .chip').forEach(c => c.classList.toggle('on', c.dataset.cam === name)),
});
function renderHud(t, D) {
  const h = stage.hud();
  const name = cur.title || D.mainInst?.S.name || '';
  const atC = D.tMain != null && Math.abs(t - D.tMain) < 0.02;
  let s = `<div>${esc(name)} · <b>${stage.speed}×</b>${atC ? ' · <span class="contact">CONTACT</span>' : ''}</div><div>Racket face: <b>${h.face}</b></div>`;
  if (h.spin && !stage.hideSpin) s += `<div>Ball: <b>${h.spin.type}</b>${h.spin.rps >= 3 ? ` (~${Math.round(h.spin.rps)} rev/s)` : ''}</div>`;
  else if (h.spin && stage.hideSpin) s += `<div>Ball: <b>?</b></div>`;
  $('#hud').innerHTML = s;
}
function defaultGrip() { return state.grip === 'pen' ? 'penhold' : state.grip === 'mine' ? 'shakeMine' : 'shakeNeutral'; }
// swap rubber colour words when the learner's forehand rubber is black
const rb = s => state.fhColor !== 'black' ? s : String(s ?? '').replace(/\b(red|black|Red|Black)\b/g, w => ({ red: 'black', black: 'red', Red: 'Black', Black: 'Red' })[w]);
function loadSpec(spec, o = {}) {
  cur = { spec, ...o };
  if (spec.callouts) spec = { ...spec, callouts: spec.callouts.map(([a, t]) => [a, rb(t)]) };
  stage.load(spec, { lefty: state.lefty, grip: defaultGrip(), ghostSpec: o.ghostSpec, layerOverrides: state.layer, swapRubber: state.fhColor === 'black' });
  const b = $('#badge');
  if (o.badge) { b.textContent = o.badge; b.className = o.badgeKind === 'variant' ? 'variant' : ''; b.style.display = 'block'; } else b.style.display = 'none';
  renderLayers(); syncPlay();
}
function applyOverride(spec, ov) {
  const s = clone(spec); if (!ov) return s;
  for (const k of ['grip', 'body', 'rootOffset', 'pose', 'shadow', 'cam', 'rally']) if (ov[k] !== undefined) s[k] = clone(ov[k]);
  if (ov.shot && s.rally) {
    let i = s.rally.findIndex(x => x.main); if (i < 0) i = s.rally.findIndex(x => x.by === 'learner');
    if (i >= 0) Object.assign(s.rally[i], clone(ov.shot));
  }
  if (ov.overlays) s.overlays = [...new Set([...(s.overlays || []), ...ov.overlays])];
  return s;
}
function lessonSpec(L) { const d = clone(L.demo); d.callouts = L.callouts || []; d.overlays = d.overlays || ['ballPath', 'labels']; return d; }

// ---------- header / nav ----------
$('#handSel').value = state.lefty ? 'L' : 'R';
$('#gripSel').value = state.grip;
$('#rubberSel').value = state.fhColor;
$('#rubberSel').onchange = e => { state.fhColor = e.target.value; save(); reloadCurrent(); if (state.lessonId) renderLesson(); };
$('#handSel').onchange = e => { state.lefty = e.target.value === 'L'; save(); reloadCurrent(); };
$('#gripSel').onchange = e => { state.grip = e.target.value; save(); reloadCurrent(); };
function reloadCurrent() { if (cur.spec) loadSpec(cur.spec, { ...cur, spec: undefined }); }
const nav = $('#nav');
function renderNav() {
  nav.innerHTML = MODULES.map(m => {
    const ls = LESSONS.filter(l => l.m === m.id), d = ls.filter(l => state.done[l.id]).length;
    return `<div class="mod"><span>${esc(m.name)}</span><span>${d}/${ls.length}</span></div>` + ls.map(l => `<a data-id="${l.id}" class="${l.id === state.lessonId ? 'cur' : ''}"><span class="ck">${state.done[l.id] ? '✓' : ''}</span>${esc(l.title)}</a>`).join('');
  }).join('');
}
nav.onclick = e => { const a = e.target.closest('a[data-id]'); if (a) openLesson(a.dataset.id); };
const openDrawer = on => { nav.classList.toggle('open', on); $('#scrim').classList.toggle('open', on); };
$('#navBtn').onclick = () => openDrawer(!nav.classList.contains('open'));
$('#scrim').onclick = () => openDrawer(false);

// ---------- tabs ----------
function showTab(name) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.id === 'tab-' + name));
  if (name === 'progress') renderProgress();
  if (name === 'practice' && !practice) renderPracticeHome();
}
document.querySelector('.tabs').onclick = e => { const b = e.target.closest('button[data-tab]'); if (b) showTab(b.dataset.tab); };

// ---------- camera / layers / playbar ----------
$('#camBar').innerHTML = Object.entries(CAMERAS).map(([k, v]) => `<button class="chip" data-cam="${k}">${esc(v)}</button>`).join('');
$('#camBar').onclick = e => { const c = e.target.closest('[data-cam]'); if (c) { stage.controls.autoRotate = false; stage.setCamera(c.dataset.cam); } };
$('#layersBtn').onclick = () => $('#layers').classList.toggle('open');
function renderLayers() {
  $('#layers').innerHTML = '<div class="muted" style="font-size:12px;padding:0 4px 4px">Show</div>' + Object.entries(OVERLAYS).map(([k, v]) => `<label><input type="checkbox" data-k="${k}" ${stage.overlays.has(k) ? 'checked' : ''}> ${esc(v)}</label>`).join('');
}
$('#layers').onchange = e => { const k = e.target.dataset.k; if (!k) return; state.layer[k] = e.target.checked; e.target.checked ? stage.overlays.add(k) : stage.overlays.delete(k); };
const SPEEDS = [0.1, 0.25, 0.5, 1];
$('#speeds').innerHTML = SPEEDS.map(s => `<button class="btn" data-s="${s}">${s}×</button>`).join('');
$('#speeds').onclick = e => { const b = e.target.closest('[data-s]'); if (b) { stage.speed = +b.dataset.s; syncPlay(); } };
function syncPlay() {
  $('#playBtn').textContent = stage.playing ? '⏸' : '▶';
  document.querySelectorAll('#speeds .btn').forEach(b => b.classList.toggle('on', +b.dataset.s === stage.speed));
  $('#loopBtn').classList.toggle('on', stage.loop);
  $('#contactBtn').disabled = !(stage.demo && stage.demo.tMain != null);
}
function togglePlay() { if (!stage.playing && stage.demo && stage.t >= stage.demo.duration - 0.01) { stage.t = 0; stage.paused1 = false; } stage.playing = !stage.playing; syncPlay(); }
$('#playBtn').onclick = togglePlay;
const step = d => { stage.playing = false; stage.t = clamp(stage.t + d, 0, stage.demo?.duration || 0); syncPlay(); };
$('#stepB').onclick = () => step(-1 / 30); $('#stepF').onclick = () => step(1 / 30);
$('#contactBtn').onclick = () => { if (stage.demo?.tMain != null) { stage.t = stage.demo.tMain; stage.playing = false; stage.paused1 = true; syncPlay(); } };
$('#loopBtn').onclick = () => { stage.loop = !stage.loop; syncPlay(); };
let scrubbing = false;
$('#scrub').addEventListener('input', e => { scrubbing = true; stage.playing = false; stage.t = (e.target.value / 1000) * (stage.demo?.duration || 0); syncPlay(); });
$('#scrub').addEventListener('change', () => { scrubbing = false; });
document.addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) && document.activeElement.type !== 'range') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  else if (e.key === 'ArrowLeft') step(-1 / 30); else if (e.key === 'ArrowRight') step(1 / 30);
  else if (['1', '2', '3', '4'].includes(e.key)) { stage.speed = SPEEDS[+e.key - 1]; syncPlay(); }
});

// ---------- lessons ----------
let curItem = null, matrixSel = null;
function openLesson(id, { keepTab = false } = {}) {
  const L = lessonById(id); if (!L) return;
  state.lessonId = id; save(); curItem = null; matrixSel = null;
  renderNav(); openDrawer(false);
  loadSpec(lessonSpec(L), { title: L.title, lessonId: id });
  renderLesson();
  if (!keepTab) showTab('lesson');
  $('#tab-lesson').scrollTop = 0;
}
function selectItem(i) {
  const L = lessonById(state.lessonId);
  if (curItem === i || i == null) { curItem = null; loadSpec(lessonSpec(L), { title: L.title, lessonId: L.id }); renderLesson(); return; }
  curItem = i; const it = L.items[i];
  const spec = applyOverride(lessonSpec(L), it.demo);
  const useGhost = it.kind === 'mistake' && it.demo && (it.demo.shot || it.demo.body) && !it.demo.rally;
  loadSpec(spec, { title: L.title + (it.kind === 'mistake' ? ' — mistake' : ''), lessonId: L.id, ghostSpec: useGhost ? lessonSpec(L) : null,
    badge: (it.kind === 'mistake' ? 'Mistake: ' : '') + it.label + (it.result ? ' → ' + it.result : '') + (useGhost ? ' (green ghost = correct)' : ''), badgeKind: it.kind });
  renderLesson();
}
function renderLesson() {
  const L = lessonById(state.lessonId), m = MODULES.find(x => x.id === L.m);
  const idx = LESSONS.indexOf(L), next = LESSONS[idx + 1];
  let h = `<div class="muted">${esc(m.name)} · Lesson ${idx + 1} of ${LESSONS.length}</div><h2>${esc(L.title)}</h2><p class="why">${esc(L.why)}</p>`;
  h += `<h3>What to look for</h3><ol class="keys">${L.keys.map(k => `<li>${esc(k)}</li>`).join('')}</ol>`;
  if (L.matrix) h += renderMatrix();
  if (L.items.length) {
    const hasM = L.items.some(i => i.kind === 'mistake');
    h += `<h3>${hasM ? 'Wrong vs right' : 'Compare'}</h3><div class="cmp"><button class="btn ${curItem == null ? 'on' : ''}" data-item="">✓ Correct</button>` +
      L.items.map((it, i) => `<button class="btn ${it.kind} ${curItem === i ? 'on' : ''}" data-item="${i}">${it.kind === 'mistake' ? '✗ ' : ''}${esc(it.label)}</button>`).join('') + '</div>';
    if (curItem != null) { const it = L.items[curItem]; h += `<div class="note ${it.kind === 'mistake' ? 'bad' : ''}">${it.result ? `<div class="res">${esc(it.result)}</div>` : ''}${esc(it.fix)}</div>`; }
  }
  h += `<div class="row" style="margin-top:14px"><button class="btn" id="askThis">💬 Ask about this</button></div>`;
  h += `<h3>Check yourself</h3>` + L.quiz.map((q, qi) => `<div class="q" data-q="${qi}"><div>${esc(q.q)}</div><div class="opts">${q.o.map((o, oi) => `<button data-o="${oi}">${esc(o)}</button>`).join('')}</div><div class="ex">${esc(q.e)}</div></div>`).join('');
  h += `<h3>Practice drill</h3><div class="drill">${esc(L.drill)}</div>`;
  h += `<div class="row" style="margin:16px 0 8px"><button class="btn ${state.done[L.id] ? 'on' : ''}" id="doneBtn">${state.done[L.id] ? '✓ Done' : 'Mark as done'}</button>${next ? `<button class="btn primary" id="nextBtn">Next: ${esc(next.title)} →</button>` : ''}</div>`;
  const T = $('#tab-lesson'); T.innerHTML = state.fhColor === 'black' ? h.replace(/>([^<]*)</g, (m, t) => '>' + rb(t) + '<') : h;
  T.querySelectorAll('[data-item]').forEach(b => b.onclick = () => selectItem(b.dataset.item === '' ? null : +b.dataset.item));
  T.querySelectorAll('.q').forEach(qd => {
    const q = L.quiz[+qd.dataset.q];
    qd.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
      if (qd.dataset.answered) return; qd.dataset.answered = 1;
      const ok = +b.dataset.o === q.a; b.classList.add(ok ? 'right' : 'wrong'); qd.querySelectorAll('[data-o]')[q.a].classList.add('right');
      qd.querySelector('.ex').style.display = 'block';
      state.quiz[L.id] = state.quiz[L.id] || {}; state.quiz[L.id][qd.dataset.q] = ok;
      if (Object.keys(state.quiz[L.id]).length === L.quiz.length && Object.values(state.quiz[L.id]).every(Boolean)) { state.done[L.id] = true; renderNav(); const d = $('#doneBtn'); d.textContent = '✓ Done'; d.classList.add('on'); }
      save();
    });
  });
  $('#doneBtn').onclick = () => { state.done[L.id] = !state.done[L.id]; save(); renderNav(); renderLesson(); };
  if (next) $('#nextBtn').onclick = () => openLesson(next.id);
  $('#askThis').onclick = () => { askContext = { lessonId: L.id, label: L.title + (curItem != null ? ' — ' + L.items[curItem].label : '') }; showTab('ask'); renderAsk(); $('#askInput')?.focus(); };
  T.querySelectorAll('[data-cell]').forEach(b => b.onclick = () => selectCell(b.dataset.cell));
}
function renderMatrix() {
  let h = `<h3>Tap a cell</h3><table class="matrix"><tr><th>Serve ↓ / Return →</th>${MATRIX.returns.map(r => `<th>${esc(r.name)}</th>`).join('')}</tr>`;
  for (const s of MATRIX.serves) {
    h += `<tr><th>${esc(s.name)}</th>` + MATRIX.returns.map(r => { const c = MATRIX.cells[s.id][r.id]; const k = s.id + '|' + r.id; return `<td><button class="${c[0]} ${matrixSel === k ? 'sel' : ''}" data-cell="${k}">${c[0] === 'good' ? '✓' : c[0] === 'ok' ? '~' : '✗'}</button></td>`; }).join('') + '</tr>';
  }
  h += '</table>';
  if (matrixSel) { const [sid, rid] = matrixSel.split('|'); const c = MATRIX.cells[sid][rid]; const s = MATRIX.serves.find(x => x.id === sid), r = MATRIX.returns.find(x => x.id === rid);
    h += `<div class="note ${c[0] === 'bad' ? 'bad' : ''}"><b>${esc(s.name)} → ${esc(r.name)}</b> (${c[0] === 'good' ? 'recommended' : c[0] === 'ok' ? 'possible' : 'risky'})<br>${esc(c[1])}</div>`; }
  return h;
}
function matrixSpec(sid, rid) {
  const s = MATRIX.serves.find(x => x.id === sid), c = MATRIX.cells[sid][rid];
  const ov = { ...c[2] }; const stroke = ov.stroke; delete ov.stroke;
  return { cam: c[0] === 'bad' ? 'side' : 'racketFace', speed: 0.5, overlays: ['faceAngle', 'ballPath', 'spinAxis', 'labels'], callouts: [['racketFace', faceHint(stroke, ov)]], rally: [opp(sid, s.to), me(stroke, ov)] };
}
function faceHint(stroke, ov) { const S = STROKES[stroke]; return (ov.outcome && ov.outcome !== 'good') ? 'Risky choice' : S.name; }
function selectCell(k) {
  matrixSel = k; const [sid, rid] = k.split('|'); const c = MATRIX.cells[sid][rid];
  loadSpec(matrixSpec(sid, rid), { title: MATRIX.serves.find(x => x.id === sid).name + ' → ' + MATRIX.returns.find(x => x.id === rid).name, lessonId: state.lessonId, badge: c[0] === 'bad' ? 'Risky: ' + c[1] : null });
  renderLesson();
}

// ---------- Ask the Coach ----------
let sampleFn; // undefined = connecting, null = unavailable
let askContext = null, asking = false, lastAnswer = null, aiHistory = [];
async function initAI() {
  const t0 = Date.now();
  while (!(window.claude && window.claude.use) && Date.now() - t0 < 10000) await new Promise(r => setTimeout(r, 250));
  try { sampleFn = window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch (e) { sampleFn = null; }
  renderAsk();
}
const EXAMPLES = ['How should I hold the racket for a backhand push?', 'My returns of short serves keep going into the net. What am I doing wrong?', 'Show me a pendulum serve with sidespin.', 'How do I tell backspin from no spin on a serve?', 'Where should my elbow be on a forehand topspin?'];
function vocabText() {
  const strokes = Object.entries(STROKES).map(([k, v]) => `${k}: ${v.name}`).join('; ');
  return [
    `CAMERAS: ${Object.keys(CAMERAS).join(', ')} (grip = close-up of hand on racket; racketFace = side-on view showing face angle; eyes = learner's first-person view; opponent = the receiver's view of the learner)`,
    `STROKES (learner): ${strokes}`,
    `INCOMING (what the opponent plays first): none, ${Object.keys(STROKES).filter(k => STROKES[k].serve).join(', ')}, ${Object.entries(FEEDS).map(([k, v]) => `${k} (${v.label})`).join(', ')}`,
    `GRIPS: ${Object.keys(GRIPS).filter(g => !g.startsWith('err')).join(', ')}`,
    `ZONES (relative to the receiver): ${Object.keys(ZONES).join(', ')}`,
    `SPINS: ${Object.keys(SPINS).join(', ')}`,
    `TIMINGS: ${TIMINGS.join(', ')}`, `OUTCOMES: ${OUTCOMES.join(', ')}`,
    `OVERLAYS: ${Object.keys(OVERLAYS).join(', ')}`, `ANCHORS: ${ANCHORS.join(', ')}`,
    `LESSON_IDS: ${LESSONS.map(l => l.id + ' (' + l.title + ')').join(', ')}`].join('\n');
}
function buildPrompt(q) {
  const hand = state.lefty ? 'left' : 'right', grip = state.grip === 'pen' ? 'penhold' : state.grip === 'mine' ? 'shakehand (thumb straight up the handle resting at the bottom edge of the forehand rubber; index finger along the edge of the backhand rubber, a little higher than textbook; forehand rubber is ' + state.fhColor + '; use grip "shakeMine" in demos)' : 'shakehand';
  const ctxL = askContext ? lessonById(askContext.lessonId) : lessonById(state.lessonId);
  const hist = aiHistory.slice(-4).map(h => `Learner: ${h.q}\nCoach: ${h.a}`).join('\n');
  return `You are an experienced table tennis coach teaching an adult recreational player who enjoys the game but was never coached. Be patient, specific and practical: name body parts, racket angles in degrees, and timing.
The app answers with a 3D demonstration: the learner (${hand}-handed, ${grip} grip) is at the near end; an opponent is at the far end. You choose the demo using ONLY the vocabulary below.

LEARNER IS CURRENTLY VIEWING: ${askContext ? askContext.label : ctxL.title}
${hist ? 'EARLIER IN THIS CONVERSATION:\n' + hist + '\n' : ''}QUESTION: ${q}

Reply with ONE JSON object only — no markdown, no code fences — with this shape:
{"answer":"2-4 sentences of plain-English coaching",
 "keyPoints":["3-5 short imperative points, max 12 words each"],
 "scene":{"camera":"CAMERA","stroke":"STROKE","grip":"GRIP","incoming":"INCOMING","incomingLanding":"ZONE","contactTiming":"TIMING","racketFaceAngleDeg":0,"outgoingSpin":"SPIN","target":"ZONE","playbackSpeed":0.25,"pauseAtContact":true,"overlays":["OVERLAY"],"callouts":[{"target":"ANCHOR","text":"max 6 words"}]},
 "commonMistake":{"label":"short name","result":"what happens to the ball","racketFaceAngleDeg":0,"contactTiming":"TIMING","outcome":"OUTCOME"},
 "relatedLessonId":"LESSON_ID",
 "followUps":["2-3 short follow-up questions"]}
Rules:
- stroke is the learner's stroke. If it is a serve, "incoming" is ignored. Otherwise pick the incoming ball that creates the situation asked about.
- racketFaceAngleDeg is measured from vertical: positive = open (face tilted up), negative = closed. Typical: push +45..+55, drive -10..-20, loop vs backspin -20..-30, block -20..-35, short backspin serve +60..+70, chop +50..+60. Omit it to use the stroke's natural angle.
- For grip or hand-placement questions use camera "grip" and stroke "gripShow" (or a stroke with camera "grip"). For angle questions use "racketFace" with overlay "faceAngle".
- Use 2-4 callouts. commonMistake may be null; when present it should change the angle or timing and give an outcome (net/long/high/wide).
- Omit any field you don't need. relatedLessonId and followUps may be omitted.
- If the question is ambiguous, reply instead {"clarify":{"question":"...","options":["...","..."]}} with 2-4 tappable options.
- If the question is not about table tennis, give a one-sentence "answer" steering back and use stroke "ready".

VOCABULARY
${vocabText()}`;
}
function parseJSON(text) {
  let s = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
}
function partialAnswer(text) {
  const m = /"answer"\s*:\s*"((?:[^"\\]|\\.)*)/.exec(text); if (!m) return null;
  try { return JSON.parse('"' + m[1].replace(/\\$/, '') + '"'); } catch (e) { return m[1]; }
}
function aiToSpec(sc, defGrip) {
  sc = sc || {};
  const pick = (x, list, d) => list.includes(x) ? x : d;
  const strokeIds = Object.keys(STROKES);
  const stroke = pick(sc.stroke, strokeIds, 'fhDrive');
  const spec = {
    cam: pick(sc.camera, Object.keys(CAMERAS), 'behind'),
    grip: pick(sc.grip, Object.keys(GRIPS), defGrip),
    overlays: [...new Set([...(Array.isArray(sc.overlays) ? sc.overlays.filter(o => o in OVERLAYS) : []), 'labels', 'ballPath'])],
    callouts: (Array.isArray(sc.callouts) ? sc.callouts : []).filter(c => c && ANCHORS.includes(c.target)).slice(0, 4).map(c => [c.target, String(c.text || '').slice(0, 48)]),
    speed: SPEEDS.includes(sc.playbackSpeed) ? sc.playbackSpeed : 0.5, pauseAtContact: sc.pauseAtContact !== false,
  };
  if (spec.cam === 'racketFace' && !spec.overlays.includes('faceAngle')) spec.overlays.push('faceAngle');
  if (STROKES[stroke].static) { spec.pose = stroke; spec.fingers = stroke === 'gripShow' || spec.cam === 'grip'; if (spec.cam === 'grip') spec.autoRotate = true; return spec; }
  if (spec.cam === 'grip') spec.fingers = true;
  const S = STROKES[stroke];
  const shot = { by: 'learner', stroke, main: true };
  if (ZONES[sc.target]) shot.to = sc.target;
  if (SPINS[sc.outgoingSpin]) shot.spin = sc.outgoingSpin;
  if (typeof sc.racketFaceAngleDeg === 'number' && isFinite(sc.racketFaceAngleDeg)) shot.faceAngle = clamp(sc.racketFaceAngleDeg, -60, 80);
  if (TIMINGS.includes(sc.contactTiming)) shot.timing = sc.contactTiming;
  if (S.serve) { spec.rally = [shot]; return spec; }
  let inc = sc.incoming;
  if (!inc || inc === 'none' || !(FEEDS[inc] || (STROKES[inc] && STROKES[inc].serve))) inc = S.feed || 'feedTopspin';
  const land = ZONES[sc.incomingLanding] ? sc.incomingLanding : S.feedTo || 'longMid';
  const o = FEEDS[inc] ? feed(inc, land) : opp(inc, land);
  spec.rally = [o, shot];
  return spec;
}
function mistakeOverride(cm) {
  if (!cm || typeof cm !== 'object') return null;
  const shot = {};
  if (typeof cm.racketFaceAngleDeg === 'number' && isFinite(cm.racketFaceAngleDeg)) shot.faceAngle = clamp(cm.racketFaceAngleDeg, -60, 80);
  if (TIMINGS.includes(cm.contactTiming)) shot.timing = cm.contactTiming;
  shot.outcome = OUTCOMES.includes(cm.outcome) ? cm.outcome : 'net';
  return { shot };
}
function renderAsk() {
  const T = $('#tab-ask');
  let st;
  if (sampleFn === undefined) st = '<div class="status"><span class="spinner"></span>Connecting to the coach…</div>';
  else if (sampleFn === null) st = '<div class="status warn">Ask the Coach isn\'t available in this view. Open the app from claude.ai to use it — lessons and practice still work.</div>';
  else st = '<div class="status">Ask any question about technique, serves, returns or tactics. You\'ll get an answer and a 3D demo.</div>';
  let h = `<h2>Ask the Coach</h2>${st}`;
  if (askContext) h += `<div class="row" style="margin-bottom:6px"><span class="chip on">About: ${esc(askContext.label)}</span><button class="btn" id="clearCtx" style="min-height:28px;padding:2px 8px">✕</button></div>`;
  h += `<textarea id="askInput" placeholder="e.g. How do I return a short backspin serve to my backhand?" ${sampleFn ? '' : 'disabled'}></textarea>
    <div class="row" style="margin-top:8px"><button class="btn primary" id="askBtn" ${sampleFn && !asking ? '' : 'disabled'}>${asking ? '<span class="spinner"></span>Thinking…' : 'Ask'}</button></div>
    <div class="ex-chips">${EXAMPLES.map(e => `<button data-ex="${esc(e)}" ${sampleFn ? '' : 'disabled'}>${esc(e)}</button>`).join('')}</div>
    <div id="answerBox"></div>`;
  T.innerHTML = h;
  $('#askBtn').onclick = () => { const q = $('#askInput').value.trim(); if (q) ask(q); };
  $('#askInput').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) $('#askBtn').click(); });
  T.querySelectorAll('[data-ex]').forEach(b => b.onclick = () => { $('#askInput').value = b.dataset.ex; ask(b.dataset.ex); });
  if ($('#clearCtx')) $('#clearCtx').onclick = () => { askContext = null; renderAsk(); };
  if (lastAnswer) renderAnswer(lastAnswer);
}
async function ask(q) {
  if (!sampleFn || asking) return;
  asking = true; renderAsk(); $('#askInput').value = q;
  const box = $('#answerBox');
  box.innerHTML = `<div class="answer"><div class="qtext">${esc(q)}</div><div id="streamA" class="muted"><span class="spinner"></span>Thinking…</div></div>`;
  let full = '';
  try {
    const res = await sampleFn(buildPrompt(q), { modelTier: 'default', cache: false, onText: ({ text }) => { full = text; const a = partialAnswer(text); const el = $('#streamA'); if (a && el) { el.className = ''; el.textContent = a; } } });
    full = res && res.text ? res.text : full;
    const data = parseJSON(full);
    asking = false;
    if (!data) { lastAnswer = { q, data: { answer: full.slice(0, 1200) } }; renderAsk(); return; }
    lastAnswer = { q, data, ts: Date.now() };
    if (data.answer) aiHistory.push({ q, a: data.answer });
    if (!data.clarify) { state.doubts.unshift(lastAnswer); save(); }
    renderAsk();
    if (data.scene) playAnswer(lastAnswer, false);
  } catch (e) {
    asking = false;
    const msg = e && e.code === 'rate_limited' ? 'The coach is busy right now — please wait a minute and try again.' : e && e.code === 'not_granted' ? 'Ask the Coach wasn\'t allowed in this view.' : 'Something went wrong getting an answer. Please try again.';
    if (e && e.code === 'not_granted') sampleFn = null;
    lastAnswer = { q, error: msg }; renderAsk();
  }
}
function playAnswer(A, mistake) {
  const d = A.data, base = aiToSpec(d.scene, defaultGrip());
  if (mistake && d.commonMistake) {
    const ov = mistakeOverride(d.commonMistake);
    const spec = base.rally ? applyOverride(base, ov) : base;
    loadSpec(spec, { title: 'Coach demo — mistake', ghostSpec: base.rally ? base : null, badge: 'Mistake: ' + (d.commonMistake.label || '') + (d.commonMistake.result ? ' → ' + d.commonMistake.result : '') + (base.rally ? ' (green ghost = correct)' : '') });
  } else loadSpec(base, { title: 'Coach demo' });
  A.showingMistake = !!mistake;
}
function renderAnswer(A) {
  const box = $('#answerBox'); if (!box) return;
  if (A.error) { box.innerHTML = `<div class="answer"><div class="qtext">${esc(A.q)}</div><div class="status warn">${esc(A.error)}</div></div>`; return; }
  const d = A.data;
  if (d.clarify) {
    box.innerHTML = `<div class="answer"><div class="qtext">${esc(A.q)}</div><div>${esc(d.clarify.question || 'Can you tell me a bit more?')}</div><div class="ex-chips">${(d.clarify.options || []).map(o => `<button data-f="${esc(A.q + ' — ' + o)}">${esc(o)}</button>`).join('')}</div></div>`;
  } else {
    const rel = d.relatedLessonId && lessonById(d.relatedLessonId);
    box.innerHTML = `<div class="answer"><div class="qtext">${esc(A.q)}</div><div>${esc(d.answer || '')}</div>
      ${Array.isArray(d.keyPoints) && d.keyPoints.length ? `<ol>${d.keyPoints.slice(0, 6).map(k => `<li>${esc(k)}</li>`).join('')}</ol>` : ''}
      <div class="row">${d.scene ? `<button class="btn" id="replayBtn">▶ Show demo</button>` : ''}${d.commonMistake && d.scene ? `<button class="btn ${A.showingMistake ? 'on' : ''}" id="mistakeBtn">✗ ${A.showingMistake ? 'Showing' : 'Show'} the mistake</button>` : ''}${rel ? `<button class="btn" id="relBtn">Open lesson: ${esc(rel.title)}</button>` : ''}</div>
      ${d.commonMistake && A.showingMistake ? `<div class="note bad"><div class="res">${esc(d.commonMistake.label || '')}</div>${esc(d.commonMistake.result || '')}</div>` : ''}
      ${Array.isArray(d.followUps) && d.followUps.length ? `<div class="muted" style="margin-top:10px;font-size:12px">Ask next</div><div class="ex-chips">${d.followUps.slice(0, 3).map(f => `<button data-f="${esc(f)}">${esc(f)}</button>`).join('')}</div>` : ''}</div>`;
    if ($('#replayBtn')) $('#replayBtn').onclick = () => { playAnswer(A, false); renderAnswer(A); };
    if ($('#mistakeBtn')) $('#mistakeBtn').onclick = () => { playAnswer(A, !A.showingMistake); renderAnswer(A); };
    if ($('#relBtn')) $('#relBtn').onclick = () => openLesson(rel.id);
  }
  box.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { if (sampleFn) ask(b.dataset.f); });
}

// ---------- Practice ----------
let practice = null;
const READ_SERVES = [
  { id: 'serveShortBackspin', to: 'shortBH', spin: 'Backspin', ret: 'Push with an open face (~50°).', cell: 'serveShortBackspin|push' },
  { id: 'serveNoSpin', to: 'shortBH', spin: 'No spin', ret: 'Flick it, or push with a less open face.', cell: 'serveNoSpin|flick' },
  { id: 'servePendulum', to: 'shortMid', spin: 'Side + backspin', ret: 'Push, angling the face against the sidespin.', cell: 'servePendulum|push' },
  { id: 'serveFastLong', to: 'longBH', spin: 'Topspin', ret: 'Block or drive with a closed face.', cell: 'serveFastLong|block' }];
const SPIN_OPTS = ['Backspin', 'No spin', 'Topspin', 'Side + backspin'];
function renderPracticeHome() {
  practice = null;
  const P = state.practice;
  $('#tab-practice').innerHTML = `<h2>Practice</h2>
    <div class="card"><b>Read the serve</b><div class="muted">Watch a serve from your own eyes with the ball's markings hidden. Name the spin.</div><div class="row" style="margin-top:8px"><button class="btn primary" data-p="read">Start</button><span class="muted">${P.read.ok}/${P.read.n} correct</span></div></div>
    <div class="card"><b>Spot the mistake</b><div class="muted">A stroke plays with one error. What's wrong?</div><div class="row" style="margin-top:8px"><button class="btn primary" data-p="spot">Start</button><span class="muted">${P.spot.ok}/${P.spot.n} correct</span></div></div>
    <div class="card"><b>Quick quiz</b><div class="muted">5 mixed questions from the lessons.</div><div class="row" style="margin-top:8px"><button class="btn primary" data-p="quiz">Start</button><span class="muted">${P.quiz.ok}/${P.quiz.n} correct</span></div></div>`;
  $('#tab-practice').querySelectorAll('[data-p]').forEach(b => b.onclick = () => ({ read: startRead, spot: startSpot, quiz: startQuiz })[b.dataset.p]());
}
function practiceShell(title, body) {
  $('#tab-practice').innerHTML = `<div class="row" style="justify-content:space-between"><h2>${esc(title)}</h2><button class="btn" id="pBack">← Back</button></div>${body}`;
  $('#pBack').onclick = renderPracticeHome;
}
function startRead() {
  const s = READ_SERVES[Math.floor(Math.random() * READ_SERVES.length)];
  practice = { kind: 'read', s };
  loadSpec({ rally: [opp(s.id, s.to)], cam: 'eyes', speed: 0.5, hideSpin: true, overlays: ['ballPath'], pauseAtContact: false }, { title: 'Read the serve' });
  stage.overlays.delete('spinAxis');
  practiceShell('Read the serve', `<p>Watch the server's racket at contact (use slow motion and replay). What spin is on the ball?</p><div class="q"><div class="opts">${SPIN_OPTS.map(o => `<button data-a="${esc(o)}">${esc(o)}</button>`).join('')}</div><div class="ex"></div></div>`);
  $('#tab-practice').querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const q = b.closest('.q'); if (q.dataset.done) return; q.dataset.done = 1;
    const ok = b.dataset.a === s.spin; b.classList.add(ok ? 'right' : 'wrong'); q.querySelector(`[data-a="${s.spin}"]`).classList.add('right');
    state.practice.read.n++; if (ok) state.practice.read.ok++; save();
    const ex = q.querySelector('.ex'); ex.style.display = 'block';
    ex.innerHTML = `${ok ? '✓ Correct!' : '✗ It was <b>' + esc(s.spin) + '</b>.'} Best return: ${esc(s.ret)}<div class="row" style="margin-top:8px"><button class="btn" id="revealBtn">Replay with spin shown</button><button class="btn" id="retBtn">See the return</button><button class="btn primary" id="nextR">Next serve</button></div>`;
    $('#revealBtn').onclick = () => loadSpec({ rally: [opp(s.id, s.to)], cam: 'eyes', speed: 0.25, overlays: ['ballPath', 'spinAxis'], pauseAtContact: false }, { title: 'Read the serve — revealed' });
    $('#retBtn').onclick = () => { const [a, r] = s.cell.split('|'); loadSpec(matrixSpec(a, r), { title: 'Return' }); };
    $('#nextR').onclick = startRead;
  });
}
function startSpot() {
  const pool = []; LESSONS.forEach(L => L.items.forEach((it, i) => { if (it.kind === 'mistake' && it.demo && (it.demo.shot || it.demo.body || it.demo.grip)) pool.push({ L, it, i }); }));
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const others = shuffle([...new Set(pool.filter(p => p.it.label !== pick.it.label).map(p => p.it.label))]).slice(0, 2);
  const opts = shuffle([pick.it.label, ...others]);
  practice = { kind: 'spot', pick };
  const spec = applyOverride(lessonSpec(pick.L), pick.it.demo); spec.overlays = ['ballPath']; spec.callouts = [];
  loadSpec(spec, { title: pick.L.title + ' — what\'s wrong?' });
  practiceShell('Spot the mistake', `<p>This is a <b>${esc(pick.L.title.toLowerCase())}</b>. Watch it (try the Racket face and Side cameras). What's wrong?</p><div class="q"><div class="opts">${opts.map(o => `<button data-a="${esc(o)}">${esc(o)}</button>`).join('')}</div><div class="ex"></div></div>`);
  $('#tab-practice').querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
    const q = b.closest('.q'); if (q.dataset.done) return; q.dataset.done = 1;
    const ok = b.dataset.a === pick.it.label; b.classList.add(ok ? 'right' : 'wrong'); [...q.querySelectorAll('[data-a]')].find(x => x.dataset.a === pick.it.label).classList.add('right');
    state.practice.spot.n++; if (ok) state.practice.spot.ok++; save();
    const ex = q.querySelector('.ex'); ex.style.display = 'block';
    const ghostOK = !!(pick.it.demo.shot || pick.it.demo.body);
    ex.innerHTML = `${ok ? '✓ Correct!' : '✗ It was <b>' + esc(pick.it.label) + '</b>.'} ${esc(pick.it.fix)}<div class="row" style="margin-top:8px">${ghostOK ? '<button class="btn" id="cmpBtn">Compare with correct</button>' : ''}<button class="btn" id="lesBtn">Open lesson</button><button class="btn primary" id="nextS">Next</button></div>`;
    if (ghostOK) $('#cmpBtn').onclick = () => loadSpec(spec, { title: pick.L.title, ghostSpec: lessonSpec(pick.L), badge: 'Mistake: ' + pick.it.label + ' (green ghost = correct)' });
    $('#lesBtn').onclick = () => openLesson(pick.L.id);
    $('#nextS').onclick = startSpot;
  });
}
function startQuiz() {
  const all = []; LESSONS.forEach(L => L.quiz.forEach(q => all.push({ L, q })));
  const done = all.filter(x => state.done[x.L.id]);
  const qs = shuffle(done.length >= 5 ? done : all).slice(0, 5);
  practice = { kind: 'quiz', qs, i: 0, score: 0 };
  showQuizQ();
}
function showQuizQ() {
  const P = practice;
  if (P.i >= P.qs.length) { practiceShell('Quick quiz', `<p>You scored <b>${P.score}/${P.qs.length}</b>.</p><button class="btn primary" id="again">Another round</button>`); $('#again').onclick = startQuiz; return; }
  const { L, q } = P.qs[P.i];
  practiceShell(`Quick quiz (${P.i + 1}/${P.qs.length})`, `<div class="muted">${esc(L.title)}</div><div class="q"><div>${esc(q.q)}</div><div class="opts">${q.o.map((o, i) => `<button data-o="${i}">${esc(o)}</button>`).join('')}</div><div class="ex">${esc(q.e)}<div class="row" style="margin-top:8px"><button class="btn" id="showL">Show in 3D</button><button class="btn primary" id="nq">Next</button></div></div></div>`);
  $('#tab-practice').querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
    const qd = b.closest('.q'); if (qd.dataset.done) return; qd.dataset.done = 1;
    const ok = +b.dataset.o === q.a; b.classList.add(ok ? 'right' : 'wrong'); qd.querySelectorAll('[data-o]')[q.a].classList.add('right');
    if (ok) P.score++; state.practice.quiz.n++; if (ok) state.practice.quiz.ok++; save();
    qd.querySelector('.ex').style.display = 'block';
    $('#showL').onclick = () => loadSpec(lessonSpec(L), { title: L.title });
    $('#nq').onclick = () => { P.i++; showQuizQ(); };
  });
}

// ---------- Progress ----------
function renderProgress() {
  const tot = LESSONS.length, d = LESSONS.filter(l => state.done[l.id]).length, P = state.practice;
  let h = `<h2>Progress</h2><div class="card"><b>${d} of ${tot} lessons done</b><div class="bar"><i style="width:${(d / tot) * 100}%"></i></div></div>`;
  h += MODULES.map(m => { const ls = LESSONS.filter(l => l.m === m.id), dn = ls.filter(l => state.done[l.id]).length; return `<div style="margin:8px 0"><div class="row" style="justify-content:space-between"><span>${esc(m.name)}</span><span class="muted">${dn}/${ls.length}</span></div><div class="bar"><i style="width:${(dn / ls.length) * 100}%"></i></div></div>`; }).join('');
  h += `<h3>Practice</h3><div class="muted">Read the serve: ${P.read.ok}/${P.read.n} · Spot the mistake: ${P.spot.ok}/${P.spot.n} · Quiz: ${P.quiz.ok}/${P.quiz.n}</div>`;
  h += `<h3>My doubts</h3>` + (state.doubts.length ? state.doubts.slice(0, 40).map((x, i) => `<div class="doubt" data-d="${i}"><div>${esc(x.q)}</div><div class="muted" style="font-size:12px">${esc((x.data.answer || '').slice(0, 110))}${(x.data.answer || '').length > 110 ? '…' : ''}</div></div>`).join('') : '<div class="muted">Questions you ask the coach will appear here, with their 3D demos.</div>');
  if (!storageOK) h += `<p class="status warn">Progress can't be saved in this browser, so it will reset when you close the page.</p>`;
  h += `<div class="row" style="margin-top:16px"><button class="btn" id="resetP">Reset progress</button></div>`;
  $('#tab-progress').innerHTML = h;
  $('#tab-progress').querySelectorAll('[data-d]').forEach(el => el.onclick = () => { const A = state.doubts[+el.dataset.d]; lastAnswer = A; showTab('ask'); renderAsk(); if (A.data.scene) playAnswer(A, false); });
  $('#resetP').onclick = () => { const b = $('#resetP'); if (b.dataset.c) { Object.assign(state, { done: {}, quiz: {}, practice: { read: { n: 0, ok: 0 }, spot: { n: 0, ok: 0 }, quiz: { n: 0, ok: 0 } }, doubts: [] }); save(); renderNav(); renderProgress(); } else { b.dataset.c = 1; b.textContent = 'Tap again to confirm'; } };
}

// ---------- boot ----------
renderNav();
renderAsk();
openLesson(lessonById(state.lessonId) ? state.lessonId : LESSONS[0].id);
initAI();
window.__tt = { stage, state, openLesson, loadSpec, LESSONS, aiToSpec, buildPrompt };
