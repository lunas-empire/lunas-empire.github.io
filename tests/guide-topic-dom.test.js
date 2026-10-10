import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {GUIDE_TOPIC_ORDER} from '../assets/guide-library-nav.js';

test('topic-first library opens categories, searches everywhere, preserves direct links and seasonal weeks',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://lunas-empire.github.io/#guides',pretendToBeVisual:true});
 const win=dom.window;
 const saved=new Map();
 const expose=(key,value)=>{
   saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
   Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
 };
 win.matchMedia=()=>({matches:false});
 win.scrollTo=()=>{};
 win.HTMLElement.prototype.scrollIntoView=()=>{};
 for(const key of ['window','document','navigator','location','HTMLImageElement'])expose(key,key==='window'?win:win[key]);
 expose('requestAnimationFrame',callback=>win.requestAnimationFrame(callback));
 expose('ResizeObserver',class{observe(){}disconnect(){}});
 expose('IntersectionObserver',class{observe(){}disconnect(){}});
 expose('setInterval',()=>0);
 expose('__GUIDE_TEST_DATE__','2026-10-10T13:00:00Z');
 const q=selector=>win.document.querySelector(selector);
 const nav=async hash=>{
   if(win.location.hash===hash)return;
   await new Promise(resolve=>{win.addEventListener('hashchange',resolve,{once:true});win.location.hash=hash;});
 };
 try{
   win.localStorage.setItem('rzsn-language',JSON.stringify('de'));
   win.localStorage.setItem('rzsn-test-checklist',JSON.stringify({alpha:true}));
   await import('../assets/app.js?guide-topic-nav=20261010');
   assert.equal(q('[data-guide-home]').hidden,false,'initial five-topic overview');
   assert.equal(q('[data-guide-featured]').hidden,false,'featured current links');
   assert.equal(q('[data-guide-featured] a').getAttribute('href').startsWith('#guides/vs-'),true);
   assert.equal(win.document.querySelectorAll('[data-guide-topic-select]').length,5);
   assert.equal([...win.document.querySelectorAll('[data-guide-topic]')].filter(el=>!el.hidden).length,0,'no huge guide list initially');
   for(const topic of GUIDE_TOPIC_ORDER){
     q('[data-guide-topic-select="'+topic+'"]').click();
     const visible=[...win.document.querySelectorAll('[data-guide-topic]')].filter(section=>!section.hidden);
     assert.equal(visible.length,1,topic+' only selected topic shown');
     assert.equal(visible[0].dataset.guideTopic,topic);
     assert.equal(q('[data-guide-home]').hidden,true);
     assert.ok(visible[0].querySelector('.guide-disclosure'),topic+' has guide');
     q('[data-guide-browse-back]').click();
     assert.equal(q('[data-guide-home]').hidden,false);
     assert.equal(visible[0].hidden,true);
   }
   const search=q('#search');search.value='General Trial';
   search.dispatchEvent(new win.Event('input',{bubbles:true}));
   assert.equal(q('[data-guide-topic="alliance"]').hidden,false,'search opens result topic');
   assert.equal(q('[data-guide-id="generals-trial"]').hidden,false);
   assert.equal(q('[data-guide-id="generals-trial"]').open,false,'search does not expand whole guide');
   search.value='zzz_no_such_guide_987';
   search.dispatchEvent(new win.Event('input',{bubbles:true}));
   assert.equal(q('#no-results').hidden,false,'empty state is visible');
   await nav('#guides/mason');
   assert.equal(q('[data-guide-topic="season"]').hidden,false);
   assert.equal(q('[data-guide-id="mason"]').open,true);
   assert.equal(q('[data-guide-id="mason"]').closest('.guide-roadmap-week').open,true,'week opens with direct link');
   await nav('#guides/t10');
   assert.equal(q('[data-guide-topic="power"]').hidden,false);
   assert.equal(q('[data-guide-id="t10"]').open,true,'old deep link still works');
   assert.ok(win.localStorage.getItem('rzsn-test-checklist'),'localStorage unchanged');
   q('#language').value='ar';
   q('#language').dispatchEvent(new win.Event('change',{bubbles:true}));
   for(let i=0;i<40&&win.document.documentElement.lang!=='ar';i++)await new Promise(r=>setTimeout(r,10));
   assert.equal(win.document.documentElement.lang,'ar');
   assert.equal(win.document.documentElement.dir,'rtl');
   assert.equal(q('[data-guide-id="t10"]').open,true,'guide stays open when language changes');
 } finally{
   dom.window.close();
   for(const [key,descriptor] of saved)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
 }
});
