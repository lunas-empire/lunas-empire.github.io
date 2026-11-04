import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer,verifyRegistryReadback} from '../assets/native-admin.js';
async function openMore(mount) {
 for(let i=0;i<160;i++){
  const more=mount.querySelector('[data-officer-tab=more]');
  if(more){more.click();return}
  await new Promise(resolve=>setTimeout(resolve,6));
 }
 throw Error('More page did not become available');
}


test('Registry preserves conflicting edits, reloads explicitly, and submits the displayed revision',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const win=dom.window,originalWindow=globalThis.window,originalFetch=globalThis.fetch;
 globalThis.window=win;win.confirm=()=>true;win.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=originalWindow;globalThis.fetch=originalFetch;dom.window.close()});
 let revision='a'.repeat(64),rank='R2',lifecycle='active',failReload=false,posts=[];
 const profile=()=>({id:'synthetic-member',name:'Synthetic Member',rank,status:'active',imported_rank:'R1',source_status:'former',state_source:'registry',source_difference:1,registry_updated_at:'2026-10-13T00:00:00Z',registry_updated_by:'<Synthetic Officer>'});
 globalThis.fetch=async(url,options)=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-memory-only',name:'Synthetic Officer',role:'R5'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{missing_recent:0}});
  if(path==='/api/members')return Response.json([profile()]);
  if(path==='/api/member/synthetic-member')return Response.json({member:profile(),stats:[],weeks:[]});
  assert.equal(path,'/api/member-registry');
  if(options.method==='POST'){
   const payload=JSON.parse(options.body);posts.push(payload);
   if(payload.revision!==revision)return Response.json({error:'Conflict'},{status:409});
   rank=payload.rank;revision='c'.repeat(64);return Response.json({ok:true});
  }
  if(failReload)return Response.json({error:'Temporarily unavailable'},{status:503});
  return Response.json({members:[{id:'synthetic-member',name:'Synthetic Member',rank,lifecycle,blacklisted:0,reason:'Initial synthetic reason',revision}],counts:{active:1,former:0,blacklisted:0}});
 };
 const mount=win.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const until=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(predicate(),'UI did not settle')};
 const submit=form=>form.dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';submit(q('form'));
 await openMore(mount);
 await until(()=>q('[data-officer-tab=registry]'));q('[data-officer-tab=registry]').click();
 await until(()=>q('[data-registry-edit]'));q('[data-registry-edit]').click();
 let form=q('#registry-save');
 assert.equal(form.elements.namedItem('reason').required,true);
 assert.equal(form.elements.namedItem('reason').minLength,8);
 assert.equal(form.dataset.revision,'a'.repeat(64));
 form.elements.namedItem('rank').value='R3';form.elements.namedItem('reason').value='My unsaved evidence';
 revision='b'.repeat(64);rank='R1';submit(form);
 await until(()=>form.dataset.conflict==='1');
 assert.equal(posts.length,1);assert.equal(posts[0].revision,'a'.repeat(64));
 assert.equal(form.elements.namedItem('rank').value,'R3');
 assert.equal(form.elements.namedItem('reason').value,'My unsaved evidence');
 assert.equal(form.querySelector('[type=submit]').disabled,true);
 submit(form);assert.equal(posts.length,1);
 win.confirm=()=>false;q('[data-registry-reload]').click();assert.equal(q('#registry-save'),form);
 win.confirm=()=>true;failReload=true;q('[data-registry-reload]').click();
 await until(()=>q('#native-form-message').textContent==='Temporarily unavailable');
 assert.equal(q('#registry-save'),form);assert.equal(form.dataset.revision,'a'.repeat(64));
 failReload=false;q('[data-registry-reload]').click();
 await until(()=>q('#registry-save')!==form);form=q('#registry-save');
 assert.equal(form.dataset.revision,'b'.repeat(64));assert.equal(form.elements.namedItem('rank').value,'R1');
 form.elements.namedItem('rank').value='R3';submit(form);
 await until(()=>posts.length===2&&!q('#registry-save'));
 assert.equal(posts[1].revision,'b'.repeat(64));assert.equal(rank,'R3');
 q('[data-officer-tab=members]').click();await until(()=>q('[data-native-member]'));
 q('[data-native-member]').click();await until(()=>q('#native-person').textContent.includes('Abweichender Import'));
 assert.match(q('#native-person').textContent,/R1/);
 assert.match(q('#native-person').textContent,/<Synthetic Officer>/);
 assert.equal(q('#native-person synthetic'),null);
 await openMore(mount);
 lifecycle='unverified';rank=null;q('[data-officer-tab=registry]').click();
 await until(()=>q('[data-registry-edit]'));q('[data-registry-edit]').click();
 form=q('#registry-save');assert.equal(form.elements.namedItem('rank').value,'');
 assert.equal(form.elements.namedItem('lifecycle').value,'');assert.equal(form.checkValidity(),false);
});

test('Manual lifecycle readback requires both registry and active members projections',()=>{
 const payload={member_id:'synthetic',lifecycle:'former'},registry={members:[{id:'synthetic',lifecycle:'former'}]};
 assert.doesNotThrow(()=>verifyRegistryReadback(payload,registry,[]));
 assert.throws(()=>verifyRegistryReadback(payload,registry,[{id:'synthetic'}]),/nicht unabh.ngig/);
 assert.throws(()=>verifyRegistryReadback(payload,{members:[]},[]),/nicht unabh.ngig/);
 assert.throws(()=>verifyRegistryReadback(payload,registry,null),/nicht unabh.ngig/);
 assert.doesNotThrow(()=>verifyRegistryReadback({...payload,lifecycle:'active'},{members:[{id:'synthetic',lifecycle:'active'}]},[{id:'synthetic'}]));
});
for(const outcome of ['success','403','409','stale-readback'])test('Manual departure UI confirmation and '+outcome,async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const win=dom.window,previousWindow=globalThis.window,previousFetch=globalThis.fetch;
 globalThis.window=win;win.confirm=()=>true;win.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=previousWindow;globalThis.fetch=previousFetch;dom.window.close()});
 let archived=false,posts=[],gets=[];
 const member=()=>({id:'synthetic',name:'Synthetic Departure',rank:'R2',lifecycle:archived?'former':'active',revision:'a'.repeat(64),reason:''});
 globalThis.fetch=async(url,options)=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Synthetic Officer',role:'R5'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{missing_recent:0}});
  if(path==='/api/membership-watch'){gets.push(path);return Response.json({candidates:[]})}
  if(path==='/api/members'){gets.push(path);return Response.json(archived?[]:[{...member(),status:'active'}])}
  assert.equal(path,'/api/member-registry');
  if(options.method==='POST'){
   posts.push(JSON.parse(options.body));
   if(['403','409'].includes(outcome))return Response.json({error:'Synthetic rejection'},{status:Number(outcome)});
   archived=outcome==='success';return Response.json({ok:true});
  }
  gets.push(path);return Response.json({members:[member()],counts:{active:archived?0:1,former:archived?1:0}});
 };
 const mount=win.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const until=async pred=>{for(let i=0;i<160;i++){if(pred())return;await new Promise(r=>setTimeout(r,5))}assert.ok(pred(),'UI did not settle')};
 const submit=form=>form.dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';submit(q('form'));
 await openMore(mount);q('[data-officer-tab=registry]').click();await until(()=>q('[data-registry-edit]'));q('[data-registry-edit]').click();
 const form=q('#registry-save');q('[data-native-registry-quick=archive]').click();
 form.elements.namedItem('reason').value='Synthetic witnessed departure';submit(form);
 assert.equal(posts.length,0);assert.match(q('#native-form-message').textContent,/Nicht gespeichert/);
 form.elements.namedItem('departure_event').value='kicked';form.elements.namedItem('departure_source').value='Synthetic alliance log 2026-11-04';
 form.elements.namedItem('source_checked').checked=true;form.elements.namedItem('departure_confirmed').checked=true;
 submit(form);submit(form);await until(()=>posts.length===1);
 assert.equal(posts[0].transition,'manual_confirmed_departure');assert.equal(posts[0].departure_event,'kicked');assert.equal(posts[0].confirmed,true);assert.equal(posts[0].source_checked,true);assert.equal(posts[0].revision,'a'.repeat(64));
 if(outcome==='success'){
  await until(()=>!q('#registry-save'));assert.ok(gets.includes('/api/members'));assert.ok(gets.includes('/api/membership-watch'));
  q('[data-native-registry-filter=former]').click();assert.match(q('#registry-list').textContent,/Synthetic Departure/);
 }else{
  await until(()=>q('#native-form-message').textContent.includes('Nicht best\u00e4tigt'));
  assert.equal(q('#registry-save'),form);
  if(outcome==='409'){assert.equal(form.dataset.conflict,'1');submit(form);assert.equal(posts.length,1)}
 }
});
