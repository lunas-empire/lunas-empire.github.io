import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
async function openMore(mount) {
 for(let i=0;i<160;i++){
  const more=mount.querySelector('[data-officer-tab=more]');
  if(more){more.click();return}
  await new Promise(resolve=>setTimeout(resolve,6));
 }
 throw Error('More page did not become available');
}


test('OCR review filters show real source groups without unverified approval',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const previousWindow=globalThis.window,previousFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=previousWindow;globalThis.fetch=previousFetch;dom.window.close()});
 const cases=[
  {id:'a',source_name:'Test Player',kind:'vs_day',category:'vs_uncertain',metric:'Montag',source_batch:'vs/2026-W40',context:{date:'2026-09-28'}},
  {id:'b',source_name:'Other Player',kind:'profile',category:'inferred',metric:'donations_daily',source_batch:'profiles/2026-10-11'},
  {id:'c',source_name:'Third Player',kind:'identity',category:'unmatched_name',metric:'name',source_batch:'vs/2026-W41'}
 ];
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Officer',role:'R5'});
  if(path==='/api/reviews')return Response.json(cases);
  if(path==='/api/overview')return Response.json({active:1,reviews:3});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{missing_recent:0}});
  throw Error('Unexpected request: '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const wait=async fn=>{for(let i=0;i<80;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'render timeout')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';
 q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await openMore(mount);
 await wait(()=>q('[data-officer-tab=reviews]'));
 await openMore(mount);
 q('[data-officer-tab=reviews]').click();
 await wait(()=>q('#review-batch-native'));
 const secondary=q('.native-review-filter-fold');
 assert.ok(secondary,'Advanced OCR filters are grouped under a single summary');
 assert.equal(secondary.open,false,'Primary review cases are visible without expanding filters');
 assert.equal(secondary.querySelectorAll('select').length,3);
 assert.equal(q('.native-review-search-head input').id,'review-search-native');
 assert.match(q('#review-list-native').textContent,/3 von 3 offenen Prüffällen/);
 const batch=q('#review-batch-native');
 batch.value='vs/2026-W40';batch.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.match(q('#review-list-native').textContent,/1 von 3 offenen Prüffällen/);
 assert.match(q('#review-list-native').textContent,/Test Player/);
 assert.doesNotMatch(q('#review-list-native').textContent,/Other Player/);
 const kind=q('#review-kind-native');
 kind.value='profile';kind.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.match(q('#review-list-native').textContent,/0 von 3 offenen Prüffällen/);
 batch.value='';batch.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.match(q('#review-list-native').textContent,/Other Player/);
 assert.doesNotMatch(q('#review-list-native').textContent,/Test Player/);
 assert.equal(q('#review-list-native [data-review-approve]'),null);
});
