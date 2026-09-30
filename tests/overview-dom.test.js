import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { LANGUAGES } from '../assets/i18n.js';
import { guideState, checklistKey } from '../assets/engine.js';

test('member workflow: legacy checks, shared tasks, availability, guides, languages and reset',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{url:'https://lunas-empire.github.io/#today',pretendToBeVisual:true});
  const win=dom.window;
  const errors=[];
  win.addEventListener('error',event=>errors.push(event.error));
  win.matchMedia=()=>({matches:false});
  win.scrollTo=()=>{};
  win.HTMLElement.prototype.scrollIntoView=()=>{};
  const saved=new Map();
  const expose=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});};
  for (const key of ['window','document','navigator','location','HTMLImageElement']) expose(key,key==='window'?win:win[key]);
  expose('requestAnimationFrame',callback=>win.requestAnimationFrame(callback));
  expose('ResizeObserver',class {observe(){} disconnect(){}});
  expose('IntersectionObserver',class {observe(){} disconnect(){}});
  let tick;
  expose('setInterval',(callback,delay)=>{if(delay===15000)tick=callback;return 0;});
  expose('__GUIDE_TEST_DATE__','2026-09-30T19:30:00Z');
  const state=guideState();
  const store=win.localStorage;
  store.setItem('rzsn-language',JSON.stringify('de'));
  store.setItem('rzsn-theme',JSON.stringify('dark'));
  store.setItem(checklistKey('vs',state),JSON.stringify({radarClaim:true}));
  store.setItem(checklistKey('season',state),JSON.stringify({mason:true}));
  store.setItem(checklistKey('seasonDaily',state),JSON.stringify({pumpkinLikes:true}));
  const q=selector=>win.document.querySelector(selector);
  const change=element=>element.dispatchEvent(new win.Event('change',{bubbles:true}));
  const nav=async hash=>{
    if (win.location.hash===hash) return;
    await new Promise(resolve=>{win.addEventListener('hashchange',resolve,{once:true});win.location.hash=hash;});
  };
  const until=async predicate=>{
    for (let i=0;i<50;i++) {if(predicate()) return;await new Promise(resolve=>setTimeout(resolve,10));}
    assert.ok(predicate(),'UI update did not complete');
  };
  try {
    await import('../assets/app.js');
    assert.equal(q('h1').textContent,'Heute');
    assert.equal(q('[data-arms-state]').dataset.state,'ended');
    assert.equal(win.document.querySelectorAll('.main-nav a').length,5);
    await nav('#daily');
    assert.equal(q('h1').textContent,'Aufgaben');
    assert.ok(q('[data-check="radarClaim"]').checked,'old VS check appears in daily tasks');
    assert.ok(q('[data-check="mason"]').checked,'old weekly progress stays checked');
    assert.ok(q('[data-check="pumpkinLikes"]').checked,'old Season daily progress stays checked');
    assert.equal(q('[data-check="wishHero"]'),null,'future unlock is not an active task');
    q('[data-task-filter-button="all"]').click();
    const radar=q('[data-check="radarClaim"]');radar.checked=false;change(radar);
    await nav('#vs');
    assert.equal(q('[data-check="radarClaim"]').checked,false,'uncheck propagates to VS');
    const radarVs=q('[data-check="radarClaim"]');radarVs.checked=true;change(radarVs);
    await nav('#daily');
    assert.ok(q('[data-check="radarClaim"]').checked,'new VS check propagates to daily');
    const total=Number(q('[data-task-progress] progress').max);
    q('[data-check="tower"]').closest('li').querySelector('[data-unavailable-toggle]').click();
    assert.equal(Number(q('[data-task-progress] progress').max),total-1);
    q('[data-task-filter-button="unavailable"]').click();
    assert.equal(q('[data-check="tower"]').closest('li').hidden,false);
    q('[data-check="tower"]').closest('li').querySelector('[data-unavailable-toggle]').click();
    assert.equal(Number(q('[data-task-progress] progress').max),total);
    await nav('#season');
    const nextTitles=[...win.document.querySelectorAll('.next-event summary strong')].map(el=>el.textContent);
    assert.equal(new Set(nextTitles.slice(0,2)).size,2,'same-day milestones have distinct titles');
    assert.equal(q('.roadmap-disclosure').open,false);
    await nav('#guides');
    assert.equal(q('[data-guide-filter="current"]').getAttribute('aria-pressed'),'true');
    q('#search').value='Mason';q('#search').dispatchEvent(new win.Event('input',{bubbles:true}));
    assert.equal(q('[data-guide-id="mason"]').hidden,false);
    assert.equal(q('[data-guide-id="mason"]').open,false);
    await nav('#guides/tech/mastery');
    assert.ok(q('[data-guide-id="tech"]').open);
    assert.ok(q('[data-section-id="mastery"]').open);
    for (const lang of Object.keys(LANGUAGES)) {
      q('#language').value=lang;change(q('#language'));
      await until(()=>win.document.documentElement.lang===lang);
      for (const view of ['today','daily','vs','season','guides']) {
        await nav(`#${view}`);
        assert.ok(q('h1').textContent.trim(),`${lang} ${view}: heading`);
        assert.ok(!q('main').textContent.includes('undefined'),`${lang} ${view}: missing text`);
        assert.equal(q('html').dir,lang==='ar'?'rtl':'ltr');
      }
    }
    await nav('#today');
    globalThis.__GUIDE_TEST_DATE__='2026-10-01T03:00:00Z';tick();
    await nav('#daily');
    assert.equal(q('[data-check="pumpkinLikes"]').checked,false,'daily check resets at 00:00 ST');
    assert.equal(q('[data-check="mason"]').checked,true,'weekly check survives daily reset');
    assert.ok(q('[data-check="wishHero"]'),'day 11 activates Wish Hero');
    assert.deepEqual(errors,[]);
  } finally {
    dom.window.close();
    for (const [key,descriptor] of saved) {
      if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
    }
  }
});
