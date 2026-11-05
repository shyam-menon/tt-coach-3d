const { chromium } = require('playwright');
const canned = JSON.stringify({answer:"Against a short backspin serve to your backhand, step in and push. Open the racket face about 50 degrees and brush under the ball at the top of the bounce.",keyPoints:["Step in with your right foot","Open the face about 50°","Brush under the ball","Contact at the top of the bounce"],scene:{camera:"racketFace",stroke:"bhPush",grip:"shakeNeutral",incoming:"serveShortBackspin",incomingLanding:"shortBH",contactTiming:"peak",racketFaceAngleDeg:50,outgoingSpin:"backspin",target:"longBH",playbackSpeed:0.25,pauseAtContact:true,overlays:["faceAngle","spinAxis"],callouts:[{target:"racketFace",text:"Open ~50°"},{target:"elbow",text:"Elbow forward"}]},commonMistake:{label:"Racket too closed",result:"Ball goes into the net",racketFaceAngleDeg:10,outcome:"net"},relatedLessonId:"bh-push",followUps:["What if the serve is long?","How do I flick this instead?"]});
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1400, height: 860 } });
  await ctx.addInitScript((canned) => { window.claude = { use: async (n) => n==='sample' ? Object.assign(async (input, opts) => { window.__prompt = input; let acc=''; for (let i=0;i<canned.length;i+=40){ acc=canned.slice(0,i+40); opts.onText&&opts.onText({text:acc,delta:''}); await new Promise(r=>setTimeout(r,5)); } return {text:canned,truncated:false}; }, {json: async()=>JSON.parse(canned)}) : null }; }, canned);
  const p = await ctx.newPage(); const errs=[];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(2000);
  await p.click('.tabs button[data-tab="ask"]'); await p.waitForTimeout(500);
  await p.fill('#askInput', 'How do I return a short backspin serve to my backhand?');
  await p.click('#askBtn'); await p.waitForTimeout(4000);
  await p.evaluate(()=>{ const s=window.__tt.stage; if(s.demo.tMain!=null){s.t=s.demo.tMain; s.playing=false;} });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: 'shots/ask.png' });
  await p.click('#mistakeBtn'); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ const s=window.__tt.stage; s.t=s.demo.tMain? s.demo.tMain+0.25 : 2; s.playing=false; });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: 'shots/ask-mistake.png' });
  const plen = await p.evaluate(()=>window.__prompt.length);
  // practice
  await p.click('.tabs button[data-tab="practice"]'); await p.click('[data-p="spot"]'); await p.waitForTimeout(2500);
  await p.screenshot({ path: 'shots/spot.png' });
  // matrix
  await p.evaluate(()=>window.__tt.openLesson('return-matrix')); await p.waitForTimeout(800);
  await p.click('[data-cell="serveFastLong|block"]'); await p.waitForTimeout(3000);
  await p.screenshot({ path: 'shots/matrix.png' });
  // mobile + lefty
  await p.setViewportSize({ width: 390, height: 844 });
  await p.selectOption('#handSel', 'L'); await p.evaluate(()=>window.__tt.openLesson('fh-drive')); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ const s=window.__tt.stage; s.t=s.demo.tMain; s.playing=false; }); await p.waitForTimeout(2000);
  await p.screenshot({ path: 'shots/mobile-lefty.png' });
  console.log('prompt chars', plen, 'ERRORS', errs);
  await b.close();
})();
