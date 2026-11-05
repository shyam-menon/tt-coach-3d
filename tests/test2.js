const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2000);
  const shots = (process.argv[2]||'').split(',').filter(Boolean);
  const res = process.argv[3]?[]:await p.evaluate(() => { const t = window.__tt; t.stage.playing=false; return t.LESSONS.map(L => { t.openLesson(L.id); t.stage.playing=false; const D = t.stage.demo;
    const ev = D.events.filter(e=>e.type!=='floor').map(e => e.type[0] + (e.side ? e.side[0] : '') + '(' + e.p.x.toFixed(2) + ',' + e.p.z.toFixed(2) + ')@' + e.t.toFixed(2));
    return L.id + ' | ' + D.shots.map(s => s.by[0] + ':' + s.stroke + (s._tc ? '' : '(X)')).join(' ') + ' | ' + ev.join(' '); }); });
  console.log(res.join('\n'));
  for (const id of shots) { await p.evaluate(id => { const t = window.__tt; t.openLesson(id); const D=t.stage.demo; if (D.tMain!=null){t.stage.t=D.tMain;} t.stage.playing=false; }, id); await p.waitForTimeout(3000); await p.screenshot({ path: `shots/${id}.png` }); }
  console.log('ERRORS', errs.slice(0, 10));
  await b.close();
})();
