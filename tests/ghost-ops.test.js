import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {LANGUAGES} from '../assets/i18n.js';
import {TASKS} from '../assets/content.js';
import {GHOST_OPS_COPY,GHOST_OPS_ID,ghostOpsGuideHtml,ghostOpsGuideTitle} from '../assets/ghost-ops-guide.js';
import {guideHash} from '../assets/guide-links.js';
import {guideTopicOf} from '../assets/guide-library-nav.js';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

test('Ghost Ops guide has complete, distinct and fact-safe content in all 15 languages',()=>{
 assert.deepEqual(Object.keys(GHOST_OPS_COPY),Object.keys(LANGUAGES));
 const titles=new Set();
 for(const lang of Object.keys(LANGUAGES)){
  const c=GHOST_OPS_COPY[lang],html=ghostOpsGuideHtml(lang,escape);
  assert.ok(c.unlockText.includes('60') && c.unlockText.includes('18'),lang);
  for(const time of ['00:00–03:00','06:00–09:00','12:00–15:00','18:00–21:00'])assert.ok(c.windowsText.includes(time),`${lang}: ${time}`);
  for(const number of ['3','5'])assert.ok(c.limitsText.includes(number),`${lang}: ${number}`);
  assert.ok(c.priorityText.includes('UR★') && c.priorityText.includes('UR'),lang);
  assert.ok(c.claimText.length>40 && c.teamText.length>40 && c.smartText.includes('2261'),lang);
  assert.equal(c.steps.length,5,lang);
  assert.ok(html.includes('noopener noreferrer') && !html.includes('undefined'),lang);
  titles.add(ghostOpsGuideTitle(lang));
 }
 assert.equal(titles.size,15);
 assert.equal(guideHash(GHOST_OPS_ID),'#guides/ghost-ops');
 assert.equal(guideTopicOf(GHOST_OPS_ID),'alliance');
 assert.deepEqual(TASKS.filter(task=>task.id==='ghostOps').map(task=>task.weekdays),[[4]],'task appears only on Thursdays');
});

test('Thursday daily view and direct guide route preserve language in all 15 locales',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://lunas-empire.github.io/#guides/ghost-ops',pretendToBeVisual:true});
 const win=dom.window,saved=new Map();
 const expose=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});};
 for(const key of ['window','document','navigator','location','HTMLImageElement'])expose(key,key==='window'?win:win[key]);
 win.matchMedia=()=>({matches:false});win.scrollTo=()=>{};win.HTMLElement.prototype.scrollIntoView=()=>{};
 expose('requestAnimationFrame',callback=>win.requestAnimationFrame(callback));expose('ResizeObserver',class{observe(){}disconnect(){}});expose('IntersectionObserver',class{observe(){}disconnect(){}});expose('setInterval',()=>0);expose('__GUIDE_TEST_DATE__','2026-11-19T12:00:00Z');
 win.localStorage.setItem('rzsn-language',JSON.stringify('de'));win.localStorage.setItem('rzsn-theme',JSON.stringify('dark'));
 const q=selector=>win.document.querySelector(selector),change=element=>element.dispatchEvent(new win.Event('change',{bubbles:true}));
 const until=async predicate=>{for(let i=0;i<60;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,8));}assert.ok(predicate());};
 try{
  await import('../assets/app.js');
  for(const lang of Object.keys(LANGUAGES)){
   q('#language').value=lang;change(q('#language'));await until(()=>win.document.documentElement.lang===lang);
   win.location.hash='#guides/ghost-ops';await until(()=>q('[data-guide-id="ghost-ops"]')?.open);
   const guide=q('[data-guide-id="ghost-ops"]');
   assert.ok(guide.open,`${lang}: direct guide opens`);
   assert.equal(guide.dataset.guideCategory,'alliance',lang);
   assert.equal(guide.querySelector('summary .disclosure-title').textContent,GHOST_OPS_COPY[lang].title,lang);
   assert.equal(guide.querySelectorAll('.ghost-ops-topic').length,7,lang);
   assert.equal(guide.querySelectorAll('.ghost-ops-routine li').length,5,lang);
   assert.ok(q('[data-guide-topic="alliance"]').hidden===false,`${lang}: alliance topic selected`);
   win.location.hash='#today';await until(()=>q('.related-guides a[href="#guides/ghost-ops"]'));
   win.location.hash='#daily';await until(()=>q('[data-check="ghostOps"]'));
   assert.ok(q('[data-check="ghostOps"]'),`${lang}: Thursday task visible in full checklist`);
  }
 }finally{
  dom.window.close();
  for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
 }
});
