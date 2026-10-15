import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer,reviewMatchesMember,reviewNumericValue} from '../assets/native-admin.js';
async function openMore(mount) {
 for(let i=0;i<160;i++){
  const more=mount.querySelector('[data-officer-tab=more]');
  if(more){more.click();return}
  await new Promise(resolve=>setTimeout(resolve,6));
 }
 throw Error('More page did not become available');
}


test('Numeric correction accepts confirmed digit groups but not guesses or overflow',()=>{
 assert.equal(reviewNumericValue('3.600.000'),3600000);
 assert.equal(reviewNumericValue('12 345 678'),12345678);
 assert.equal(reviewNumericValue(''),null);
 assert.equal(reviewNumericValue('abc'),null);
 assert.equal(reviewNumericValue('-10'),null);
 assert.equal(reviewNumericValue('999999999999999999999'),null);
 assert.equal(reviewMatchesMember({name:'Synthetic Officer',rank:'R4'},'offic'),true);
 assert.equal(reviewMatchesMember({name:'Synthetic Officer',rank:'R4'},'Nonexistent'),false);
});
test('Protected review workflow requires a screenshot, searchable member and explicit audited save',async t=>{
 if(!globalThis.crypto)globalThis.crypto=webcrypto;
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch,oldForm=globalThis.FormData,oldConfirm=dom.window.confirm;
 const oldCreateObjectURL=URL.createObjectURL,oldRevokeObjectURL=URL.revokeObjectURL;
 URL.createObjectURL=()=> 'blob:synthetic-review';URL.revokeObjectURL=()=>{};
 const opened=[];dom.window.open=(...args)=>{opened.push(args)};
 globalThis.window=dom.window;globalThis.FormData=dom.window.FormData;dom.window.confirm=()=>true;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;globalThis.FormData=oldForm;dom.window.confirm=oldConfirm;URL.createObjectURL=oldCreateObjectURL;URL.revokeObjectURL=oldRevokeObjectURL;dom.window.close()});
 const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
 const imageBytes=Uint8Array.from([137,80,78,71,13,10,26,10,...Array(72).fill(2)]);
 const imageHash=Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256',imageBytes)),v=>v.toString(16).padStart(2,'0')).join('');
 const cases=[
  {id:'case-no-image',kind:'profile',category:'missing',metric:'power',source_name:'Low OCR Player',source_batch:'profiles/2026-10-11',source_value:null,status:'open',evidence_sha:null},
  {id:'case-with-image',kind:'identity',category:'unmatched_name',metric:'name',source_name:'Unmatched Player',source_batch:'vs/2026-W41',source_value:0,context:{date:'2026-10-06'},status:'open',evidence_sha:imageHash}
 ];
 const posts=[];
 let tampered=true;
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-officer',name:'Synthetic Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:2,reviews:2});
  if(path==='/api/session')return Response.json({authenticated:true,reviewWritesEnabled:true});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-13',counts:{missing_recent:0},calendar:[]});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members:[]});
  if(path==='/api/reviews'&&opts.method!=='POST')return Response.json(cases);
  if(path==='/api/identity-options')return Response.json([{id,name:'Synthetic Officer',rank:'R4'},{id:'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',name:'Another Player',rank:'R2'}]);
  if(path.endsWith('/evidence'))return new Response(tampered?Uint8Array.from([...imageBytes.slice(0,-1),3]):imageBytes,{headers:{'Content-Type':'image/png'}});
  if(path.endsWith('/resolve')){
   posts.push(JSON.parse(opts.body));
   if(posts.length===2)return Response.json({error:'synthetic conflict'},{status:409});
   return Response.json({ok:true,status:'approved'});
  }
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const wait=async fn=>{for(let k=0;k<120;k++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'DOM did not settle')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';
 q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await openMore(mount);
 await wait(()=>q('[data-officer-tab=reviews]'));
 await openMore(mount);
 q('[data-officer-tab=reviews]').click();
 await wait(()=>q('[data-review-id=case-with-image]'));
 assert.equal(q('#review-search-native').labels[0].textContent,'Spieler oder Fall suchen');
 const missing=q('[data-review-id=case-no-image]');
 assert.equal(missing.dataset.evidence,'without','Missing-image reviews use compact evidence placeholder');
 assert.match(missing.querySelector('.native-review-source').textContent,/profiles\/2026-10-11.*unbekannt/);
 assert.equal(missing.querySelector('[data-native-review-resolve=approve]').disabled,true);
 assert.ok(missing.querySelector('[data-native-review-file]'),'Evidence upload control is required');
 const attached=q('[data-review-id=case-with-image]');
 assert.equal(attached.querySelector('[data-native-review-resolve=approve]').disabled,true,'Approval waits for the protected image and hash check');
 assert.match(attached.querySelector('.native-review-source').textContent,/vs\/2026-W41.*2026-10-06.*OCR: 0.*SHA-256/);
 attached.open=true;
 attached.dispatchEvent(new dom.window.Event('toggle'));
 await wait(()=>attached.querySelector('.native-review-image').textContent.includes('Prüfsumme'));
 assert.equal(attached.querySelector('[data-native-review-resolve=approve]').disabled,true,'Tampered image cannot be approved');
 tampered=false;
 attached.dispatchEvent(new dom.window.Event('toggle'));
 await wait(()=>attached.querySelector('[data-native-review-expand]'));
 assert.equal(attached.querySelector('[data-native-review-resolve=approve]').disabled,false);
 const expand=attached.querySelector('[data-native-review-expand]');
 assert.equal(expand.tagName,'BUTTON');
 assert.equal(expand.getAttribute('aria-label'),'Originalbild ansehen');
 assert.equal(opened.length,0);
 expand.click();
 assert.deepEqual(opened,[['blob:synthetic-review','_blank','noopener,noreferrer']]);
 await wait(()=>attached.querySelector('[data-native-review-pick]'));
 const field=attached.querySelector('[data-native-review-search]');
 field.value='synthetic';
 field.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 await wait(()=>attached.querySelectorAll('[data-native-review-pick]').length===1);
 attached.querySelector('[data-native-review-pick]').click();
 assert.equal(attached.querySelector('[data-native-review-member]').value,id);
 attached.querySelector('[data-native-review-reason]').value='Original image confirms synthetic identity';
 attached.querySelector('[data-native-review-resolve=approve]').click();
 await wait(()=>posts.length===1);
 assert.equal(posts[0].member_id,id);
 assert.equal(posts[0].evidence_sha,imageHash);
 assert.ok(!('corrected_value' in posts[0]));
 await wait(()=>!q('[data-review-id=case-with-image]'));
 assert.match(q('#native-review-finished').textContent,/erledigt/);
 const next=q('[data-review-id=case-no-image]');
 assert.ok(next,'Unresolved review must remain');
 assert.equal(next.open,true,'Next open review is expanded immediately after a confirmed save');
 assert.equal(dom.window.document.activeElement,next.querySelector('summary'),'Keyboard focus moves to next review');
 assert.equal(next.querySelector('[data-native-review-resolve=approve]').disabled,true);
 next.querySelector('[data-native-review-reason]').value='Synthetic evidence cannot be matched';
 next.querySelector('[data-native-review-resolve=dismiss]').click();
 await wait(()=>posts.length===2);
 await wait(()=>next.querySelector('.native-review-message')?.textContent.includes('synthetic conflict'));
 assert.equal(next.querySelector('[data-native-review-resolve=approve]').disabled,true,'Conflicted save does not enable approval without a screenshot');
 assert.equal(next.querySelector('[data-native-review-resolve=dismiss]').disabled,false,'Retry remains possible after request error');
 assert.equal(next.querySelector('[data-native-review-upload]').disabled,false,'An unrelated upload button keeps its original state');
});
