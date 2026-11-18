import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {LANGUAGES} from '../assets/i18n.js';
import {CELEBRATION_GUIDE_ID,POLAR_STORM_GUIDE_ID,SEASON_TRANSITION_COPY,celebrationGuideHtml,season2GuideHtml,seasonTransitionPage,seasonTransitionText} from '../assets/season-transition.js';
import {blackMarketGuideHtml} from '../assets/black-market-guide.js';
import {guideHash} from '../assets/guide-links.js';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

test('Season transition renders complete, distinct content in all 15 languages',()=>{
 assert.deepEqual(Object.keys(SEASON_TRANSITION_COPY),Object.keys(LANGUAGES));
 const heroes=new Set();
 for(const lang of Object.keys(LANGUAGES)){
  const c=SEASON_TRANSITION_COPY[lang];
  const celebration=celebrationGuideHtml(lang,escape);
  const polar=season2GuideHtml(lang,escape);
  const page=seasonTransitionPage(lang,escape,'<details data-archive></details>');
  assert.ok(c.heroTitle.trim() && c.heroLead.trim(),lang);
  assert.ok(celebration.includes(c.bingoTitle) && celebration.includes(c.cashTitle),lang);
  assert.ok(celebration.includes(c.bingoLogin) && celebration.includes(c.cashLimit),lang);
  assert.ok(celebration.includes(c.predictionText) && celebration.includes(c.fireworksText),lang);
  assert.match(polar,/\+3(?:\s*)°C/);assert.match(polar,/\+4(?:\s*)°C/);assert.match(polar,/\+5(?:\s*)°C/);
  assert.equal((polar.match(/<li>/g)||[]).length,12,`${lang}: four preparations and eight weeks`);
  assert.ok(polar.includes('/assets/member/tower-of-victory.webp'),lang);
  assert.ok(polar.includes(c.previewNotice) && polar.includes(c.ticketsText),lang);
  assert.ok(page.includes(`id="season-now"`) && page.includes(`id="season-today"`) && page.includes(`id="season-next"`) && page.includes(`id="season-archive"`),lang);
  assert.ok(!/undefined|null|Missing season translation/.test(page),lang);
  assert.doesNotMatch(page,/600\s*(?:Black Market\s*)?Cash/i,lang);
  assert.ok(blackMarketGuideHtml(lang,escape).includes(c.cashLimit),`${lang}: Black Market uses the verified-neutral cash limit guidance`);
  assert.equal(seasonTransitionText(lang,'heroTitle'),c.heroTitle,lang);
  heroes.add(c.heroTitle);
 }
 assert.equal(heroes.size,15,'every language has its own localized hero');
 assert.equal(guideHash(CELEBRATION_GUIDE_ID),'#guides/season-celebration');
 assert.equal(guideHash(POLAR_STORM_GUIDE_ID),'#guides/polar-storm');
 assert.throws(()=>seasonTransitionText('xx','heroTitle'),/Unsupported season language/);
});

test('Post-season DOM exposes Celebration, preparation and archive without losing language selection',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://lunas-empire.github.io/#season',pretendToBeVisual:true});
 const win=dom.window,saved=new Map();
 const expose=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});};
 for(const key of ['window','document','navigator','location','HTMLImageElement'])expose(key,key==='window'?win:win[key]);
 win.matchMedia=()=>({matches:false});win.scrollTo=()=>{};win.HTMLElement.prototype.scrollIntoView=()=>{};
 expose('requestAnimationFrame',callback=>win.requestAnimationFrame(callback));
 expose('ResizeObserver',class{observe(){}disconnect(){}});expose('IntersectionObserver',class{observe(){}disconnect(){}});
 expose('setInterval',()=>0);expose('__GUIDE_TEST_DATE__','2026-11-18T12:00:00Z');
 win.localStorage.setItem('rzsn-language',JSON.stringify('de'));win.localStorage.setItem('rzsn-theme',JSON.stringify('dark'));
 const q=selector=>win.document.querySelector(selector);
 const change=element=>element.dispatchEvent(new win.Event('change',{bubbles:true}));
 const until=async predicate=>{for(let i=0;i<50;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,10));}assert.ok(predicate());};
 try{
  await import('../assets/app.js');
  assert.equal(q('h1').textContent,SEASON_TRANSITION_COPY.de.heroTitle);
  assert.equal(q('[data-disclosure="season-1-archive"]').open,false);
  assert.equal(q('[data-chapter-week]'),null,'old active Season 1 chapter rail is not shown');
  for(const lang of Object.keys(LANGUAGES)){
   q('#language').value=lang;change(q('#language'));await until(()=>win.document.documentElement.lang===lang);
   assert.equal(q('h1').textContent,SEASON_TRANSITION_COPY[lang].heroTitle,lang);
   assert.equal(q('.main-nav [data-ui="season"] span').textContent,SEASON_TRANSITION_COPY[lang].nav,lang);
   assert.ok(q('.st-priority--tower img').alt.length>10,lang);
   win.location.hash='#guides/polar-storm';await until(()=>q('[data-guide-id="polar-storm"]')?.open);
   assert.equal(win.document.documentElement.lang,lang,`${lang}: language survives navigation`);
   assert.ok(q('[data-disclosure="season-1-guide-archive"]'),`${lang}: archive remains in guide library`);
   win.location.hash='#season';await until(()=>q('.st-hero'));
  }
 }finally{
  dom.window.close();
  for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
 }
});
