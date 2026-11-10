// usage: node tests/close.js name lessonId when px,py,pz tx,ty,tz [item]
const { chromium } = require('playwright');
(async () => {
  const [name, id, when, pos, tgt, item] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1300, height: 820 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2000);
  await p.evaluate(([id, when, pos, tgt, item]) => { const t = window.__tt, s = t.stage; t.openLesson(id);
    if (item != null && item !== '') document.querySelectorAll('#tab-lesson [data-item]')[+item + 1].click();
    s.controls.autoRotate = false; const D = s.demo; s.t = when === 'contact' ? D.tMain : +when; s.playing = false;
    s.camState = null; s.overlays.delete('labels'); s.camera.position.set(...pos.split(',').map(Number)); s.controls.target.set(...tgt.split(',').map(Number)); }, [id, when, pos, tgt, item]);
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `shots/${name}.png`, clip: { x: 250, y: 48, width: 660, height: 680 } });
  if (errs.length) console.log('ERR', errs.slice(0, 5));
  await b.close();
})();
