import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

test('Uploaded OCR screenshots are visible first, with a separate missing-image filter',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 // Mirror the staging mix: backend originally lists the 27 cases lacking photos first.
 const missing=Array.from({length:27},(_,i)=>({
  id:'no-image-'+i,kind:'identity',category:'unmatched_name',metric:'name',
  source_name:'Needs Mapping '+i,source_batch:'vs/2026-W41',evidence_sha:null
 }));
 const linked=Array.from({length:101},(_,i)=>({
  id:'has-image-'+i,kind:'vs_day',category:'vs_uncertain',metric:'Montag',
  source_name:'Verified Screenshot '+i,source_batch:'vs/2026-W40',evidence_sha:'a'.repeat(64)
 }));
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'test-token',name:'Officer',role:'R4'});
  if(path==='/api/reviews')return Response.json([...missing,...linked]);
  if(path==='/api/identity-options')return Response.json([]);
  if(path==='/api/session')return Response.json({reviewWritesEnabled:true});
  if(path==='/api/overview')return Response.json({active:1,reviews:128});
  if(path==='/api/operations')return Response.json({tasks:[],events:[]});
  if(path==='/api/train-manager')return Response.json({calendar:[],counts:{}});
  throw Error('Unexpected request '+path);
 };
 const root=dom.window.document.querySelector('#mount');
 const q=s=>root.querySelector(s);
 const wait=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'Timeout waiting for UI')};
 initNativeAdmin(root);await renderNativeAdmin(root);
 q('[name=code]').value='synthetic';
 q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>q('[data-officer-tab=reviews]'));
 q('[data-officer-tab=reviews]').click();
 await wait(()=>q('#review-image-native'));
 assert.match(root.textContent,/101 mit Screenshot/);
 assert.match(root.textContent,/27 ohne Screenshot/);
 let cards=[...root.querySelectorAll('.native-review-card')];
 assert.equal(cards.length,20);
 assert.ok(cards.every(card=>card.querySelector('.native-review-evidence-status').textContent==='Bild hinterlegt'));
 const filter=q('#review-image-native');
 filter.value='without';filter.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 cards=[...root.querySelectorAll('.native-review-card')];
 assert.equal(cards.length,20);
 assert.ok(cards.every(card=>card.querySelector('.native-review-evidence-status').textContent==='Bild fehlt'));
 assert.match(q('#review-list-native').textContent,/27 von 128/);
 filter.value='with';filter.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 cards=[...root.querySelectorAll('.native-review-card')];
 assert.equal(cards.length,20);
 assert.ok(cards.every(card=>card.querySelector('.native-review-evidence-status').textContent==='Bild hinterlegt'));
 assert.match(q('#review-list-native').textContent,/101 von 128/);
});
