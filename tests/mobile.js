const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2000);
  const at = async (id, cam, when) => { await p.evaluate(([id, cam, when]) => { const t = window.__tt, s = t.stage; t.openLesson(id); s.controls.autoRotate = false; s.t = when === 'contact' ? s.demo.tMain : +when; s.playing = false; s.setCamera(cam, true); }, [id, cam, when]); await p.waitForTimeout(1800); };
  await at('fh-drive', 'behind', 'contact'); await p.screenshot({ path: 'shots/mb-1.png' });
  await p.tap('#setBtn'); await p.waitForTimeout(300); await p.screenshot({ path: 'shots/mb-2.png' });
  await p.selectOption('#handSel', 'L'); await p.touchscreen.tap(60, 420); await p.waitForTimeout(300);
  await at('serve-rules', 'side', 0.25); await p.tap('#bigBtn'); await p.waitForTimeout(1500); await p.screenshot({ path: 'shots/mb-3.png' });
  await p.tap('#bigBtn'); await p.tap('#speedCycle'); await p.tap('#navBtn'); await p.waitForTimeout(500); await p.screenshot({ path: 'shots/mb-4.png' });
  console.log('speed', await p.evaluate(() => window.__tt.stage.speed), 'ERR', errs.slice(0, 5));
  await b.close();
})();
