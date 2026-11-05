const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 500, height: 400 } });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(1500);
  const ids = await p.evaluate(()=>window.__tt.LESSONS.map(l=>[l.id,l.items.length]));
  for (const [id,n] of ids) for (let i=-1;i<n;i++) {
    const a=Date.now();
    const r = await p.evaluate(([id,i]) => { const t = window.__tt, s=t.stage; t.openLesson(id); if (i>=0) document.querySelectorAll('#tab-lesson [data-item]')[i+1].click();
      const D=s.demo; s.playing=false; const out=[];
      for (const sh of (D.shots||[])) { if (!sh._tc) { out.push('NOCONTACT '+sh.stroke); continue; }
        s.apply(sh._tc); const P = sh.by==='learner'? s.L : s.O; const rc = P.world('racketCenter'); const nn=P.hitNormal(); const gap = rc.clone().addScaledVector(nn, 0.026).distanceTo(sh._ball);
        if (gap>0.035) out.push(sh.by[0]+':'+sh.stroke+' gap='+gap.toFixed(3)); }
      return out.join(', '); }, [id,i]);
    if (r || Date.now()-a>3000) console.log(id+'#'+i, (Date.now()-a)+'ms', r);
  }
  console.log('done'); await b.close();
})();
