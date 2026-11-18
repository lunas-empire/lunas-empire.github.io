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
 let emptyLw=false,importReads=0;
 let revision='a'.repeat(64),rank='R2',lifecycle='active',failReload=false,posts=[],reason='Initial synthetic reason';
 const profile=()=>({id:'synthetic-member',name:'Synthetic Member',rank,status:'active',imported_rank:'R1',source_status:'former',state_source:'registry',source_difference:1,registry_updated_at:'2026-10-13T00:00:00Z',registry_updated_by:'<Synthetic Officer>'});
 globalThis.fetch=async(url,options)=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-memory-only',name:'Synthetic Officer',role:'R5'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{missing_recent:0}});
  if(path==='/api/members')return Response.json([profile()]);
  if(path==='/api/lw-import'){importReads++;return Response.json({batches:[]})}
  if(path==='/api/member/synthetic-member')return Response.json({member:profile(),stats:['power','kills','donations_weekly'].flatMap(metric=>['2026-10-11','2026-10-18','2026-10-25','2026-11-01'].map((date,i)=>({snapshot_id:'synthetic-w'+i,captured_at:date+'T18:00:00Z',metric,value:80+i,quality:'observed'}))),weeks:[],lw_import:{available:true,snapshots:emptyLw?[]:Array.from({length:6},(_,i)=>({member_id:'synthetic-member',report_date:'2026-11-0'+(i+1),applied_at:'2026-11-07',values:{power:100+i,kills:0}}))}});
  assert.equal(path,'/api/member-registry');
  if(options.method==='POST'){
   const payload=JSON.parse(options.body);posts.push(payload);
   if(payload.revision!==revision)return Response.json({error:'Conflict'},{status:409});
   rank=payload.rank;reason=payload.reason;revision='c'.repeat(64);return Response.json({ok:true});
  }
  if(failReload)return Response.json({error:'Temporarily unavailable'},{status:503});
  return Response.json({members:[{id:'synthetic-member',name:'Synthetic Member',rank,lifecycle,blacklisted:0,reason,revision}],counts:{active:lifecycle==='active'?1:0,former:0,blacklisted:0}});
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
 assert.equal('transition' in posts[1],false);assert.equal('source' in posts[1],false,'Unchanged lifecycle needs no departure source');
 q('[data-officer-tab=members]').click();await until(()=>q('[data-native-member]'));
 assert.match(mount.textContent,/Spieler \u00f6ffnen \u2192 LW Import/);
 q('[data-native-member]').click();await until(()=>q('#native-person').textContent.includes('Abweichender Import'));
 assert.match(q('#native-person').textContent,/R1/);
 assert.match(q('#native-person').textContent,/<Synthetic Officer>/);
 assert.equal(q('#native-person synthetic'),null);
 assert.equal(q('.native-member-aliases').nextElementSibling,q('[data-lw-profile]'));
 assert.equal(q('[data-lw-profile]').nextElementSibling.className,'native-evidence-note');
 assert.equal(q('[data-lw-profile] h4').textContent,'Werte & Entwicklung');
 assert.equal(q('[data-lw-profile]').querySelector('[data-officer-tab=lwImport]'),null);
 assert.equal(q('[data-lw-profile]').querySelectorAll('.native-lw-points li').length,5);
 q('[data-lw-profile] details').open=true;
 let range=q('[data-lw-range]');range.value='4';range.dispatchEvent(new win.Event('change',{bubbles:true}));
 q('[data-lw-kpi=kills]').click();
 assert.equal(q('[data-lw-range]').value,'4');
 assert.equal(q('[data-lw-profile] details').open,true);
 assert.equal(q('[data-lw-kpi=kills]').getAttribute('aria-pressed'),'true');
 assert.equal(win.document.activeElement,q('[data-lw-kpi=kills]'));
 assert.equal(q('[data-lw-profile]').querySelectorAll('.native-lw-points li').length,4);
 range=q('[data-lw-range]');range.value='1';range.dispatchEvent(new win.Event('change',{bubbles:true}));
 assert.equal(q('[data-lw-profile]').querySelectorAll('polyline').length,0);
 assert.equal(win.document.activeElement,q('[data-lw-range]'));

 emptyLw=true;q('[data-native-member-close]').click();q('[data-native-member]').click();
 await until(()=>q('[data-lw-profile] button[data-officer-tab=lwImport]'));
 assert.equal(q('.native-member-aliases').nextElementSibling,q('[data-lw-profile]'));
 assert.equal(q('[data-lw-profile]').querySelectorAll('[data-lw-kpi]').length,6);
 assert.equal(q('[data-lw-profile]').querySelectorAll('circle').length,4);
 assert.equal(q('[data-lw-kpi=donations_weekly]')?.tagName,'BUTTON');
 assert.equal(q('[data-lw-kpi=vs_results]')?.tagName,'BUTTON');
 assert.equal(q('[data-lw-kpi=total_troops]'),null);
 q('[data-lw-kpi=kills]').click();
 assert.equal(q('[data-lw-profile]').querySelectorAll('circle').length,4);
 q('.native-lw-all-points').open=true;q('.native-lw-points [data-lw-point-list]').click();
 assert.ok(q('[data-native-stat-evidence="synthetic-w0|synthetic-member|kills"]'));
 assert.doesNotMatch(q('[data-lw-profile]').textContent,/98|100/);
 q('[data-lw-profile] button[data-officer-tab=lwImport]').click();
 await until(()=>importReads===1);await until(()=>!q('#native-person'));
 await openMore(mount);
 lifecycle='unverified';rank=null;q('[data-officer-tab=registry]').click();
 await until(()=>q('[data-registry-edit]'));q('[data-registry-edit]').click();
 form=q('#registry-save');assert.equal(form.elements.namedItem('rank').value,'');
 assert.equal(form.elements.namedItem('lifecycle').value,'');assert.equal(form.checkValidity(),false);
});

test('Manual lifecycle readback requires identity, changed revision and consistent registry counts',()=>{
 const payload={member_id:'synthetic',lifecycle:'former',revision:'a',rank:'R2',blacklisted:false,reason:'Verified departure'};
 const registry={members:[{...payload,id:'synthetic',revision:'b'}],counts:{active:0,former:1}};
 assert.doesNotThrow(()=>verifyRegistryReadback(payload,registry));
 for(const invalid of [{...registry,counts:{active:1,former:1}}, {...registry,members:[]},
  {...registry,members:[{...registry.members[0],revision:'a'}]},
  {...registry,members:[{...registry.members[0],id:'different'}]},
  {...registry,members:[{...registry.members[0],rank:'R3'}]},
  {...registry,members:[{...registry.members[0],reason:'Other edit'}]}])
  assert.throws(()=>verifyRegistryReadback(payload,invalid),/nicht unabh.ngig/);
});
for(const host of ['lunas-empire.github.io','rzsn-home.github.io'])
for(const outcome of ['success','success-officer','protected-officer','403','409','stale-readback','readback-503','uncertain-post'])test(host+' manual departure '+outcome,async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://'+host+'/#admin'});
 const win=dom.window,previousWindow=globalThis.window,previousFetch=globalThis.fetch;
 globalThis.window=win;win.confirm=()=>true;win.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=previousWindow;globalThis.fetch=previousFetch;dom.window.close()});
 let archived=false,posts=[],gets=[],failRead=true;
 const member=()=>({id:'synthetic',name:'Synthetic Departure',rank:outcome.includes('officer')?'R4':'R2',lifecycle:archived?'former':'active',revision:(archived?'b':'a').repeat(64),reason:posts.at(-1)?.reason||'',blacklisted:false});
 globalThis.fetch=async(url,options)=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Synthetic Officer',role:outcome==='success-officer'?'R5':'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{missing_recent:0}});
  if(path==='/api/membership-watch'){gets.push(path);return Response.json({candidates:[]})}
  if(path==='/api/members'){gets.push(path);return Response.json(archived?[]:[{...member(),status:'active'}])}
  assert.equal(path,'/api/member-registry');
  if(options.method==='POST'){
   posts.push(JSON.parse(options.body));
   if(['403','409'].includes(outcome))return Response.json({error:'Synthetic rejection'},{status:Number(outcome)});
   archived=outcome!=='stale-readback';
   if(outcome==='uncertain-post')throw Error('Synthetic lost POST response');
   return Response.json({ok:true});
  }
  gets.push(path);
  if(posts.length&&failRead&&outcome==='readback-503')return Response.json({error:'Synthetic quota unavailable'},{status:503});
  return Response.json({members:[member()],counts:{active:archived?0:1,former:archived?1:0}});
 };
 const mount=win.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const until=async pred=>{for(let i=0;i<160;i++){if(pred())return;await new Promise(r=>setTimeout(r,5))}assert.ok(pred(),'UI did not settle')};
 const submit=form=>form.dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';submit(q('form'));
 await openMore(mount);q('[data-officer-tab=registry]').click();await until(()=>q('[data-registry-edit]'));q('[data-registry-edit]').click();
 if(outcome==='protected-officer'){
  assert.equal(q('#registry-save'),null);assert.match(q('#registry-form').textContent,/nur durch R5/);assert.equal(posts.length,0);return;
 }
 const form=q('#registry-save');q('[data-native-registry-quick=archive]').click();
 assert.match(q('#native-form-message').textContent,/Originalquelle und Grund/);
 assert.equal(win.document.activeElement,form.elements.namedItem('departure_event'));
 form.elements.namedItem('reason').value='Synthetic witnessed departure';submit(form);
 assert.equal(posts.length,0);assert.match(q('#native-form-message').textContent,/Nicht gespeichert/);
 form.elements.namedItem('departure_event').value='kicked';form.elements.namedItem('departure_source').value='Synthetic alliance log 2026-11-04';
 form.elements.namedItem('source_checked').checked=true;form.elements.namedItem('departure_confirmed').checked=true;
 form.elements.namedItem('reason').value='short';submit(form);assert.equal(posts.length,0);
 form.elements.namedItem('reason').value='Synthetic witnessed departure';
 form.elements.namedItem('source_checked').checked=false;submit(form);assert.equal(posts.length,0);
 form.elements.namedItem('source_checked').checked=true;
 const readsBefore=gets.length;
 submit(form);submit(form);await until(()=>posts.length===1);
 assert.equal(posts[0].transition,'manual_confirmed_departure');assert.equal(posts[0].departure_event,'kicked');assert.equal(posts[0].confirmed,true);assert.equal(posts[0].source_checked,true);assert.equal(posts[0].revision,'a'.repeat(64));
 if(outcome.startsWith('success')){
  await until(()=>!q('#registry-save'));
  assert.deepEqual(gets.slice(readsBefore),['/api/member-registry']);
  assert.equal(q('[data-native-registry-filter=former]').getAttribute('aria-pressed'),'true');
  assert.match(q('#registry-list').textContent,/Synthetic Departure/);
  assert.match(q('#registry-form').textContent,/unabhängig/);
  assert.equal(win.document.activeElement,q('[data-registry-edit=synthetic]'));
 }else{
  await until(()=>q('#native-form-message').textContent.includes(outcome==='409'?'409':outcome==='403'?'403':outcome==='uncertain-post'?'ungewiss':'bestätigt'));
  assert.equal(q('#registry-save'),form);
  if(outcome==='409'){assert.equal(form.dataset.conflict,'1');submit(form);assert.equal(posts.length,1)}
  if(['stale-readback','readback-503','uncertain-post'].includes(outcome)){
   await until(()=>q('[data-registry-recheck]')&&!q('[data-registry-recheck]').disabled);
   assert.equal(form.querySelector('[type=submit]').disabled,true);
   submit(form);assert.equal(posts.length,1);
   assert.match(q('#registry-list').textContent,/active/,'No optimistic removal');
   failRead=false;archived=true;q('[data-registry-recheck]').click();
   await until(()=>!q('#registry-save'));assert.equal(posts.length,1);
   assert.deepEqual(gets.slice(readsBefore),outcome==='uncertain-post'?['/api/member-registry']:['/api/member-registry','/api/member-registry']);
  }
 }
});

async function registryFixture(t,{active=0,lifecycle='active',hook=()=>null}={}){
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'}),win=dom.window;
 const previousWindow=globalThis.window,previousFetch=globalThis.fetch;globalThis.window=win;
 win.confirm=()=>true;win.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=previousWindow;globalThis.fetch=previousFetch;dom.window.close()});
 const member={id:'fixture-person',name:'Fixture Person',rank:'R2',lifecycle,revision:'a'.repeat(64),reason:'Original reason',blacklisted:false};
 const historical={train:[{member_id:member.id,date:'2026-10-01',driver:member.name}],stats:[{member_id:member.id,metric:'kills',value:0},{member_id:member.id,metric:'power',value:null}]};
 const originalHistory=structuredClone(historical),posts=[],reads=[];
 const filler=Array.from({length:active},(_,i)=>({id:'filler-'+i,name:'Filler '+i,rank:'R1',lifecycle:'active'}));
 const snapshot=()=>({members:[{...member},...filler],counts:{active:filler.length+(member.lifecycle==='active'?1:0),former:member.lifecycle==='former'?1:0,blacklisted:0}});
 const apply=payload=>Object.assign(member,{lifecycle:payload.lifecycle,rank:payload.rank,reason:payload.reason,blacklisted:payload.blacklisted,revision:'b'.repeat(64)});
 globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'fixture-token',name:'Fixture Officer',role:'R4'});
  if(path==='/api/member-registry'){
   if(options.method==='POST'){
    const payload=JSON.parse(options.body);posts.push(payload);
    assert.deepEqual(Object.keys(payload).sort(),(payload.lifecycle==='former'?['member_id','revision','rank','lifecycle','blacklisted','reason','transition','source','source_checked','confirmed','departure_event']:['member_id','revision','rank','lifecycle','blacklisted','reason','transition','source','source_checked','confirmed']).sort());
    const response=await hook({write:true,payload,apply,snapshot});if(response)return response;
    apply(payload);return Response.json({ok:true});
   }
   reads.push(path);const response=await hook({write:false,snapshot});return response||Response.json(snapshot());
  }
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{},history:[]});
  if(path==='/api/members')return Response.json(member.lifecycle==='active'?[{...member,status:'active'}]:[]);
  if(path==='/api/member/'+member.id)return Response.json({member:{...member,status:member.lifecycle},stats:historical.stats,weeks:[],rides:historical.train});
  throw Error('Unexpected '+path);
 };
 const mount=win.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const until=async predicate=>{for(let i=0;i<150;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(predicate(),'UI did not settle: '+mount.textContent)};
 const submit=form=>form.dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='fixture';submit(q('form'));
 await openMore(mount);q('[data-officer-tab=registry]').click();await until(()=>q('[data-registry-edit]'));
 if(lifecycle==='former')q('[data-native-registry-filter=former]').click();
 const edit=()=>{[...mount.querySelectorAll('[data-registry-edit]')].find(button=>button.dataset.registryEdit===member.id).click();return q('#registry-save')};
 const form=edit();
 const prepare=()=>{
  q('[data-native-registry-quick='+(lifecycle==='former'?'active':'archive')+']').click();
  form.elements.namedItem('reason').value='Fixture verified original evidence';
  form.elements.namedItem('departure_source').value='Fixture original alliance log 2026-11-12';
  form.elements.namedItem('departure_event').value='left';form.elements.namedItem('source_checked').checked=true;form.elements.namedItem('departure_confirmed').checked=true;
 };
 return {mount,q,until,submit,form,prepare,posts,reads,member,edit,historical,originalHistory};
}

for(const active of [99,100])test('Verified return respects '+active+' current active members',async t=>{
 const f=await registryFixture(t,{active,lifecycle:'former'});f.prepare();f.submit(f.form);
 if(active===100){assert.equal(f.posts.length,0);assert.match(f.q('#native-form-message').textContent,/100 aktive/);return}
 await f.until(()=>!f.q('#registry-save'));
 assert.equal(f.posts.length,1);assert.equal(f.posts[0].transition,'manual_verified_return');assert.equal('departure_event' in f.posts[0],false);
 assert.equal(f.q('[data-native-registry-filter=active]').getAttribute('aria-pressed'),'true');
 assert.deepEqual(f.historical,f.originalHistory);
});

test('Return capacity changed server-side keeps evidence and requires explicit conflict reload',async t=>{
 const f=await registryFixture(t,{active:99,lifecycle:'former',hook:({write})=>write?Response.json({error:'Active capacity changed to 100; reload revision'},{status:409}):null});
 f.prepare();f.submit(f.form);await f.until(()=>f.form.dataset.conflict==='1');
 assert.equal(f.member.lifecycle,'former');assert.equal(f.posts.length,1);assert.equal(f.form.elements.namedItem('source_checked').checked,true);
 assert.equal(f.form.elements.namedItem('reason').value,'Fixture verified original evidence');
 f.submit(f.form);assert.equal(f.posts.length,1);assert.equal(f.q('[data-registry-reload]').hidden,false);
});

for(const phase of ['post','readback','reload'])test('Old '+phase+' response cannot update a new officer session',async t=>{
 let release,started=false;
 const waiting=new Promise(resolve=>{release=resolve});
 const f=await registryFixture(t,{hook:async({write,payload,apply,snapshot})=>{
  if((phase==='post'&&write)||(phase==='readback'&&!write&&started)||(phase==='reload'&&!write&&started)){
   if(write)apply(payload);const captured=snapshot();await waiting;return Response.json(write?{ok:true}:captured);
  }
  if(write)started=true;
 }});
 f.prepare();
 if(phase==='reload'){started=true;f.q('[data-registry-reload]').hidden=false;f.q('[data-registry-reload]').click()}
 else f.submit(f.form);
 await f.until(()=>phase==='post'?f.posts.length===1:f.reads.length===2);
 clearOfficer();await renderNativeAdmin(f.mount);const login=f.mount.innerHTML;
 release();await new Promise(resolve=>setTimeout(resolve,20));
 assert.equal(f.mount.innerHTML,login);assert.equal(f.q('#registry-list'),null);
 assert.equal(f.posts.length,phase==='reload'?0:1);
});

test('Pending archive survives reopening and retries only GET; identity and history remain intact',async t=>{
 let fail=true;
 const f=await registryFixture(t,{hook:({write,snapshot})=>!write&&snapshot().members[0].lifecycle==='former'&&fail?Response.json({error:'Fixture quota'},{status:503}):null});
 f.prepare();f.submit(f.form);await f.until(()=>f.q('[data-registry-recheck]')&&!f.q('[data-registry-recheck]').disabled);
 f.edit();assert.equal(f.q('[type=submit]').disabled,true);assert.equal(f.q('[data-registry-recheck]').hidden,false);
 fail=false;f.q('[data-registry-recheck]').click();await f.until(()=>!f.q('#registry-save'));
 assert.equal(f.posts.length,1);assert.equal(f.member.id,'fixture-person');assert.deepEqual(f.historical,f.originalHistory);
 assert.equal(f.posts[0].departure_event,'left');
});

test('A reload begun before saving cannot replace the newer confirmed revision',async t=>{
 let release,hold=false;
 const waiting=new Promise(resolve=>{release=resolve});
 const f=await registryFixture(t,{hook:async({write,snapshot})=>{
  if(!write&&hold){hold=false;const old=snapshot();await waiting;return Response.json(old)}
 }});
 f.prepare();hold=true;f.q('[data-registry-reload]').hidden=false;f.q('[data-registry-reload]').click();
 await f.until(()=>f.reads.length===2);f.submit(f.form);await f.until(()=>!f.q('#registry-save'));
 release();await new Promise(resolve=>setTimeout(resolve,20));
 assert.equal(f.q('[data-native-registry-filter=former]').getAttribute('aria-pressed'),'true');
 f.edit();assert.equal(f.q('#registry-save').dataset.revision,'b'.repeat(64));assert.equal(f.q('[name=lifecycle]').value,'former');
 assert.equal(f.posts.length,1);
});

test('Reopening the same member during readback does not leave a disabled editor behind',async t=>{
 let release;
 const waiting=new Promise(resolve=>{release=resolve});
 const f=await registryFixture(t,{hook:async({write,snapshot})=>{
  if(!write&&snapshot().members[0].lifecycle==='former'){await waiting;return Response.json(snapshot())}
 }});
 f.prepare();f.submit(f.form);await f.until(()=>f.reads.length===2);f.edit();
 assert.equal(f.q('[data-registry-recheck]').disabled,true);
 release();await f.until(()=>!f.q('#registry-save'));
 assert.match(f.q('#registry-form').textContent,/unabhängig/);assert.equal(f.posts.length,1);
});

test('Archiving from the existing player dossier opens the verified archive without another load',async t=>{
 const f=await registryFixture(t);
 f.q('[data-officer-tab=members]').click();await f.until(()=>f.q('[data-native-member]'));
 f.q('[data-native-member]').click();await f.until(()=>f.q('[data-native-manage]'));
 f.q('[data-native-manage]').click();await f.until(()=>f.q('#registry-save'));
 const form=f.q('#registry-save');
 f.q('[data-native-registry-quick=archive]').click();
 form.elements.namedItem('reason').value='Fixture verified original evidence';form.elements.namedItem('departure_source').value='Original witnessed alliance log';
 form.elements.namedItem('departure_event').value='removed';form.elements.namedItem('source_checked').checked=true;form.elements.namedItem('departure_confirmed').checked=true;
 const reads=f.reads.length;f.submit(form);await f.until(()=>f.q('#registry-list'));
 assert.equal(f.reads.length,reads+1);assert.equal(f.posts.length,1);
 assert.equal(f.q('[data-native-registry-filter=former]').getAttribute('aria-pressed'),'true');
 assert.match(f.q('#registry-form').textContent,/unabhängig/);assert.deepEqual(f.historical,f.originalHistory);
});
