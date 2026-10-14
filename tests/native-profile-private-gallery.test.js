import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
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

if(!globalThis.crypto)globalThis.crypto=webcrypto;
test('A profile image is never linked before explicit image viewing and confirmation',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 dom.window.confirm=()=>true;
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 const bytes=new Uint8Array(100);bytes.set([137,80,78,71,13,10,26,10]);
 const sha=Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 const sample={id:'power-2026-10-11-001',metric:'power',capture_day:'2026-10-11',capture_index:1,sha256:sha,byte_count:100};
 const reviews=[{id:'profile-review',source_name:'Synthetic',kind:'profile',category:'missing',metric:'power',status:'open',evidence_sha:null}];
 let puts=0,approvals=0;
 globalThis.fetch=async (url,opts={})=>{
  const parsed=new URL(url),path=parsed.pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Officer',role:'R4'});
  if(path==='/api/reviews')return Response.json(reviews);
  if(path==='/api/identity-options')return Response.json([]);
  if(path==='/api/session')return Response.json({reviewWritesEnabled:true});
  if(path==='/api/profile-captures'){
   assert.notEqual(parsed.searchParams.get('metric'),'donations_daily','Daily donations must no longer load');
   return Response.json(parsed.searchParams.get('metric')==='power'?[sample]:[]);
  }
  if(path==='/api/profile-captures/power/2026-10-11-001/image')return new Response(bytes,{headers:{'Content-Type':'image/png'}});
  if(path==='/api/reviews/profile-review/evidence'&&opts.method==='PUT'){puts++;return Response.json({ok:true,sha256:sha})}
  if(path==='/api/reviews/profile-review/evidence')return new Response(bytes,{headers:{'Content-Type':'image/png'}});
  if(path==='/api/reviews/profile-review/resolve'){approvals++;return Response.json({ok:true})}
  if(path==='/api/overview')return Response.json({active:1,reviews:1});
  if(path==='/api/operations')return Response.json({tasks:[],events:[]});
  if(path==='/api/train-manager')return Response.json({calendar:[],counts:{}});
  throw Error('Unexpected mock request '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const wait=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'UI timeout')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';
 q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await openMore(mount);
 await wait(()=>q('[data-officer-tab=reviews]'));
 await openMore(mount);
 q('[data-officer-tab=reviews]').click();
 await wait(()=>q('[data-native-capture-choice]'));
 assert.equal(puts,0);assert.equal(approvals,0);
 assert.equal(q('[data-native-capture-attach]').disabled,true);
 q('[data-native-capture-preview]').click();
 await wait(()=>!q('[data-native-capture-attach]').disabled);
 assert.equal(puts,0);assert.equal(approvals,0);
 q('[data-native-capture-attach]').click();
 await wait(()=>puts===1);
 await wait(()=>q('.native-review-evidence-status').textContent==='Bild hinterlegt');
 assert.equal(approvals,0);
 assert.match(q('.native-review-evidence-status').textContent,/Bild hinterlegt/);
});
test('Visible zero suggestion requires explicit button and never saves on its own',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;globalThis.window=dom.window;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 globalThis.fetch=async(url)=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Officer',role:'R5'});
  if(path==='/api/reviews')return Response.json([{id:'zero-case',kind:'vs_day',category:'vs_uncertain',metric:'Montag',source_name:'Synthetic',evidence_sha:'a'.repeat(64)}]);
  if(path==='/api/identity-options')return Response.json([]);
  if(path==='/api/session')return Response.json({reviewWritesEnabled:true});
  if(path==='/api/overview')return Response.json({active:1,reviews:1});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{}});
  throw Error('Unexpected request '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const wait=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'UI timeout')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await openMore(mount);
 await wait(()=>q('[data-officer-tab=reviews]'));q('[data-officer-tab=reviews]').click();
 await wait(()=>q('[data-native-mark-zero]'));
 assert.equal(q('[data-native-review-value]').value,'');
 q('[data-native-mark-zero]').click();
 assert.equal(q('[data-native-review-value]').value,'0');
 assert.match(q('[data-native-review-reason]').value,/Original-Screenshot/);
});

test('A clipped screenshot can be replaced with explicit confirmation without closing its review',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;globalThis.window=dom.window;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};dom.window.confirm=()=>true;
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 const rows=[{id:'clipped',source_name:'Synthetic',kind:'vs_day',category:'vs_uncertain',metric:'Dienstag',status:'open',evidence_sha:'a'.repeat(64)}];
 let replaces=0,approvals=0;
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Officer',role:'R4'});
  if(path==='/api/reviews')return Response.json(rows);
  if(path==='/api/identity-options')return Response.json([]);
  if(path==='/api/session')return Response.json({reviewWritesEnabled:true});
  if(path==='/api/profile-captures')return Response.json([]);
  if(path==='/api/reviews/clipped/evidence'&&opts.method==='PATCH'){
   replaces++;assert.equal(opts.headers['If-Match'],'a'.repeat(64));return Response.json({ok:true,sha256:'b'.repeat(64)});
  }
  if(path==='/api/reviews/clipped/evidence')return new Response(new Uint8Array([137,80,78,71,13,10,26,10,0,0]),{headers:{'Content-Type':'image/png'}});
  if(path==='/api/reviews/clipped/resolve'){approvals++;return Response.json({ok:true})}
  if(path==='/api/overview')return Response.json({active:1,reviews:1});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{}});
  throw Error('Unexpected '+path);
 };
 const root=dom.window.document.querySelector('#mount'),q=s=>root.querySelector(s);
 const wait=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'UI timeout')};
 initNativeAdmin(root);await renderNativeAdmin(root);
 q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await openMore(root);
 await wait(()=>q('[data-officer-tab=reviews]'));q('[data-officer-tab=reviews]').click();
 await wait(()=>q('[data-native-review-replace-file]'));
 const replacement=new dom.window.File([new Uint8Array(100)],'better.png',{type:'image/png'});
 Object.defineProperty(q('[data-native-review-replace-file]'),'files',{configurable:true,value:[replacement]});
 q('[data-native-review-reason]').value='Source screenshot was clipped; verified replacement';
 q('[data-native-review-replace]').click();
 await wait(()=>replaces===1);
 await wait(()=>q('.native-review-evidence-status').textContent==='Bild ersetzt');
 assert.equal(approvals,0);
 assert.equal(rows[0].status,'open');
 assert.match(q('.native-review-message').textContent,/Prüffall bleibt offen/);
});
