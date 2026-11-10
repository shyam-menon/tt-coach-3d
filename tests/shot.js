// usage: node tests/shot.js name lessonId cam [w h] [t|contact] [itemIdx]
const { chromium } = require('playwright');
(async () => {
  const [name, id, cam, w = 1300, h = 820, when = 'contact', item] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +w < 500 ? 2 : 1, hasTouch: +w < 500, isMobile: +w < 500 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2000);
  await p.evaluate(([id, cam, when, item]) => { const t = window.__tt, s = t.stage; t.openLesson(id);
    if (item != null && item !== '') document.querySelectorAll('#tab-lesson [data-item]')[+item + 1].click();
    s.controls.autoRotate = false; const D = s.demo;
    if (when === 'contact') { if (D.tMain != null) s.t = D.tMain; } else s.t = +when; s.playing = false; if (cam) s.setCamera(cam, true); }, [id, cam, when, item]);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `shots/${name}.png` });
  if (errs.length) console.log('ERR', errs.slice(0, 5));
  await b.close();
})();
