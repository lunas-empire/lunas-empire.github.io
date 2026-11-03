import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer,reviewMatchesMember,reviewNumericValue,sourceDecisionBody,verifySourceBytes} from '../assets/native-admin.js';
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


test('source decision is explicit, exact, source verified and accepts confirmed zero only',()=>{
 const item={row_key:'synthetic-row',image_sha256:'a'.repeat(64),row_y:10,source_archive_id:'synthetic-archive'};
 const members=[{id:'immutable-existing',status:'archived'}];
 const input={member_id:members[0].id,value:'0',reason:'Visually verified original',confirmed:true,rank:'2',rank_visually_confirmed:true};
 assert.throws(()=>sourceDecisionBody(item,input,false,members),/Originalbild/);
 assert.throws(()=>sourceDecisionBody(item,{...input,value:''},true,members),/unbekannt/);
 assert.throws(()=>sourceDecisionBody(item,{...input,member_id:''},true,members),/Mitglied-ID/);
 assert.throws(()=>sourceDecisionBody(item,{...input,rank_visually_confirmed:false},true,members),/Rang/);
 assert.throws(()=>sourceDecisionBody(item,{...input,confirmed:false},true,members),/bestätigen/);
 assert.throws(()=>sourceDecisionBody(item,{...input,reason:'short'},true,members),/8 Zeichen/);
 const body=sourceDecisionBody(item,input,true,members);
 assert.equal(body.value,0);assert.equal(body.member_id,members[0].id);assert.equal(body.row_key,item.row_key);
 assert.equal(body.rank,2);assert.equal(body.rank_visually_confirmed,true);
 const known=sourceDecisionBody({...item,rank:42},{...input,rank:'',rank_visually_confirmed:false},true,members);assert.ok(!('rank' in known));
 for(const rank of ['',null,'R2','1.5','0','201'])assert.throws(()=>sourceDecisionBody(item,{...input,rank},true,members),/Rang/);
 for(const value of [null,'','10000000000000'])assert.throws(()=>sourceDecisionBody(item,{...input,value},true,members));assert.ok(!('create_member' in body));
});

test('source image verification fails closed for absent headers, SHA tampering and row mismatch',async()=>{
 const bytes=Uint8Array.from([1,2,3,4]);
 const hash=Buffer.from(await webcrypto.subtle.digest('SHA-256',bytes)).toString('hex');
 const item={image_sha256:hash,row_y:12};
 const headers={'Content-Type':'image/png','X-Evidence-SHA256':hash,'X-Evidence-Row-Y':'12'};
 await assert.rejects(verifySourceBytes(new Response(bytes),item),/Header/);
 await assert.rejects(verifySourceBytes(new Response(bytes,{headers:{...headers,'X-Evidence-Row-Y':'13'}}),item),/Header/);
 await assert.rejects(verifySourceBytes(new Response(new Uint8Array([9]),{headers}),item),/SHA-256/);
 assert.equal((await verifySourceBytes(new Response(bytes,{headers}),item)).size,4);
});


for(const scenario of ['valid','partial-decision','wrong-batch','wrong-value','applied'])test('native source reviews: '+scenario,async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/admin/#review'});
 const previous={window:globalThis.window,fetch:globalThis.fetch,FormData:globalThis.FormData,create:URL.createObjectURL,revoke:URL.revokeObjectURL};
 globalThis.window=dom.window;globalThis.FormData=dom.window.FormData;
 URL.createObjectURL=()=> 'blob:synthetic-source';let revoked=0;URL.revokeObjectURL=()=>revoked++;
 t.after(()=>{clearOfficer();globalThis.window=previous.window;globalThis.fetch=previous.fetch;globalThis.FormData=previous.FormData;URL.createObjectURL=previous.create;URL.revokeObjectURL=previous.revoke;dom.window.close()});
 const bytes=Uint8Array.from([1,2,3]);const hash=Buffer.from(await webcrypto.subtle.digest('SHA-256',bytes)).toString('hex');
 const item={batch_id:'batch',row_key:'row',kind:'profile',week:'2026-W44',metric:'donations_weekly',image_sha256:hash,row_y:10,source_archive_id:'archive',proposed_value:null,source_name:'<Synthetic>',source_available:true};
 const members=[{id:'exact-id',name:'Existing member',rank:'R2',status:'archived'}];
 let saved=false;const calls=[];
 globalThis.fetch=async(url,opts={})=>{
  const u=new URL(url),path=u.pathname;calls.push({path,search:u.search,opts});
  if(path==='/api/native-login')return Response.json({token:'synthetic-source-token',name:'Officer',role:'R4'});
  assert.equal(opts.headers.Authorization,'Bearer synthetic-source-token');
  if(path==='/api/session')return Response.json({});
  if(path==='/api/reviews'||path==='/api/identity-options'||path==='/api/profile-captures')return Response.json([]);
  if(path==='/api/capture-publication-review')return Response.json({items:saved?[]:Array.from({length:25},(_,i)=>({...item,row_key:i?'row-'+i:'row'})),member_options:members,total_pending:saved?24:50,reviewed_pending_application:saved?1:0});
  if(path.endsWith('/decisions'))return Response.json({items:saved?[{batch_id:'batch',row_key:'row',chosen_member_id:'exact-id',chosen_value:0,source_sha256:hash,source_row_y:10,reason:'Original visually checked',decided_at:'2026-11-03',stage:scenario==='applied'?'APPLIED':'VERIFIED',name:'Existing member',metric:'donations_weekly'}]:[]});
  if(path.endsWith('/image'))return new Response(bytes,{headers:{'Content-Type':'image/png','X-Evidence-SHA256':hash,'X-Evidence-Row-Y':'10'}});
  if(path.endsWith('/decision')){saved=true;if(scenario==='partial-decision')return Response.json({ok:true});return Response.json({ok:true,state:'verified_pending_application',applied_to_report:false,batch_id:'batch',row_key:'row',member_id:'exact-id',value:0})}
  if(path.endsWith('/apply'))return Response.json({state:'APPLIED',applied_to_report:true,audit_id:'audit',batch_id:scenario==='wrong-batch'?'other':'batch',row_key:'row',member_id:'exact-id',value:scenario==='wrong-value'?1:0});
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('main');const wait=async fn=>{for(let i=0;i<200;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'Source UI did not settle')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);mount.querySelector('[name=code]').value='synthetic';mount.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>mount.querySelector('[data-source-list] details'));
 assert.match(mount.querySelector('[data-source-status]').textContent,/0 OCR open; 50 source reviews/);
 assert.match(mount.querySelector('[data-source-list] summary').textContent,/unbekannt/);
 assert.equal(mount.querySelector('[data-source-list] summary').querySelector('synthetic'),null);
 mount.querySelector('[data-source-more]').click();await wait(()=>calls.some(c=>c.search.includes('offset=25')));
 await wait(()=>mount.querySelectorAll('[data-source-list] details').length===50);
 const card=mount.querySelector('[data-source-list] details'),form=card.querySelector('form');
 assert.equal(form.elements.member_id.value,'');assert.equal(form.elements.value.value,'');assert.equal(form.querySelector('button').disabled,true);
 card.querySelector('[data-source-image]').click();await wait(()=>card.querySelector('img'));
 const image=card.querySelector('img');Object.defineProperty(image,'naturalHeight',{value:100});image.dispatchEvent(new dom.window.Event('load'));
 assert.equal(card.querySelector('.native-source-marker').style.top,'10%');
 form.elements.member_id.value='exact-id';form.elements.value.value='0';form.elements.reason.value='Original visually checked';form.elements.rank.value='2';form.elements.rank_confirmed.checked=true;form.elements.confirmed.checked=true;
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>saved);
 assert.equal(calls.filter(c=>c.path.endsWith('/apply')).length,0);
 const posted=JSON.parse(calls.find(c=>c.path.endsWith('/decision')).opts.body);assert.equal(posted.value,0);assert.equal(posted.member_id,'exact-id');
 if(scenario==='partial-decision'){await wait(()=>form.querySelector('button').disabled);form.dispatchEvent(new dom.window.Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,20));assert.equal(calls.filter(c=>c.path.endsWith('/decision')).length,1);assert.ok(!card.querySelector('[data-source-message]').textContent.includes('Entscheidung gespeichert'));return}
 await wait(()=>card.querySelector('[data-source-message]').textContent.includes('Entscheidung gespeichert'));
 mount.querySelector('[data-source-filters]').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>mount.querySelector('[data-source-decisions] details'));
 const appliedCard=mount.querySelector('[data-source-decisions] details'),applyForm=appliedCard.querySelector('form');
 assert.match(appliedCard.textContent,/exact-id.*Wert: 0/);
 assert.equal(appliedCard.querySelector('select'),null);
 if(scenario==='applied'){assert.equal(applyForm,null);assert.equal(appliedCard.querySelector('[data-source-image]'),null);return}
 assert.equal(applyForm.querySelector('button').disabled,true);
 appliedCard.querySelector('[data-source-image]').click();await wait(()=>appliedCard.querySelector('img'));
 const savedImage=appliedCard.querySelector('img');Object.defineProperty(savedImage,'naturalHeight',{value:100});savedImage.dispatchEvent(new dom.window.Event('load'));
 applyForm.elements.confirmed.checked=true;if(applyForm.elements.rank_confirmed)applyForm.elements.rank_confirmed.checked=true;
 applyForm.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));if(scenario.startsWith('wrong-')){await wait(()=>calls.some(c=>c.path.endsWith('/apply')));await new Promise(r=>setTimeout(r,20));assert.ok(!appliedCard.querySelector('[data-source-message]').textContent.includes('vom Server'));assert.equal(applyForm.querySelector('button').disabled,true);applyForm.dispatchEvent(new dom.window.Event('submit',{cancelable:true}));assert.equal(calls.filter(c=>c.path.endsWith('/apply')).length,1);return}await wait(()=>appliedCard.querySelector('[data-source-message]').textContent.includes('vom Server bestätigt'));
 assert.deepEqual(JSON.parse(calls.find(c=>c.path.endsWith('/apply')).opts.body),{row_key:'row'});
 clearOfficer();assert.ok(revoked>=2,'Original object URLs revoked on refresh and logout');
});
