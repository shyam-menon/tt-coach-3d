const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type()==='warning') errs.push(m.type()+': '+m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await p.goto('http://localhost:8765/index.html');
  await p.waitForTimeout(2500);
  const ids = process.argv[2] ? process.argv[2].split(',') : await p.evaluate(()=>window.__tt.LESSONS.map(l=>l.id));
  for (const id of ids) {
    const info = await p.evaluate((id) => {
      const t=window.__tt; t.openLesson(id); const D=t.stage.demo;
      const ev = D.events.map(e=>e.type+'@'+e.t.toFixed(2)+(e.side?':'+e.side[0]:'')+'('+e.p.x.toFixed(2)+','+e.p.z.toFixed(2)+')');
      const shots = D.shots.map(s=>s.by[0]+':'+s.stroke+(s._tc?'@'+s._tc.toFixed(2):' (no contact)'));
      if (D.tMain!=null){ t.stage.t=D.tMain; t.stage.playing=false; }
      return {id, dur:D.duration.toFixed(2), tMain:D.tMain&&D.tMain.toFixed(2), shots, ev};
    }, id);
    console.log(JSON.stringify(info));
    await p.waitForTimeout(900);
    await p.screenshot({ path: `/home/claude/tt/shots/${id}.png` });
  }
  console.log('ERRORS:', errs.slice(0,20).join('\n'));
  await b.close();
})();
