import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildUnifiedMetricTimeline,renderLwGroups,renderLwProfile,initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
const snapshot=(date,values={})=>({member_id:'synthetic-id',report_date:date,applied_at:date+'T12:00:00Z',batch_id:'lw-'+date,sha256:'a'.repeat(64),source_row:1,values:{power:100,army_power:50,total_troops:10,drone:1,kills:0,hq:30,...values}});
const doc=html=>new JSDOM(html).window.document;

test('newer source columns stay intact while the profile exposes only the six visible KPIs',()=>{
 const data={available:true,snapshots:[snapshot('2026-11-01',{army_power:null,hero_power:null,gorilla_power:0}),snapshot('2026-11-03',{army_power:0,hero_power:250,gorilla_power:null})]};
 const before=structuredClone(data);
 for(const metric of ['power','army_power','hero_power','gorilla_power']){
  const d=doc(renderLwProfile(data,'synthetic-id',metric));
  assert.deepEqual([...d.querySelectorAll('[data-lw-kpi]')].map(card=>card.dataset.lwKpi),['power','drone','kills','hq','vs_results','donations_weekly']);
  assert.doesNotMatch(d.body.textContent,/Army Power|Hero Power|Gorilla Power/);
  assert.match(d.querySelector('.native-lw-chart h5').textContent,/Power/);
 }
 assert.deepEqual(data,before);
});

test('hidden power timelines retain null, zero and original snapshot evidence',()=>{
 for(const metric of ['army_power','hero_power','gorilla_power','total_troops']){
  const data={available:true,snapshots:[snapshot('2026-11-01',{[metric]:null}),snapshot('2026-11-02',{[metric]:0}),snapshot('2026-11-03',{[metric]:250})]};
  const before=structuredClone(data),timeline=buildUnifiedMetricTimeline(data,'synthetic-id',metric);
  assert.deepEqual(timeline.map(point=>point.value),[null,0,250]);
  for(const [index,point] of timeline.entries()){
   const original=data.snapshots[index],source=point.sources[0];
   for(const key of ['report_date','applied_at','batch_id','sha256','source_row'])assert.equal(source[key],original[key]);
  }
  assert.deepEqual(data,before);
 }
});

const sundays=()=>['2026-10-11','2026-10-18','2026-10-25','2026-11-01'].flatMap((date,i)=>['power','kills','donations_weekly'].map(metric=>({snapshot_id:'synthetic-w'+(41+i),week:'2026-W'+(41+i),captured_at:date+'T18:30:00Z',metric,value:100+i*10,quality:'observed'})));
test('Sunday W41-W44 and applied November report form five canonical Power and Kills points',()=>{
 const data={available:true,snapshots:[snapshot('2026-11-03',{power:150,kills:150})]};
 for(const metric of ['power','kills']){
  const timeline=buildUnifiedMetricTimeline(data,'synthetic-id',metric,sundays());
  assert.deepEqual(timeline.map(p=>p.value),[100,110,120,130,150]);
  const d=doc(renderLwProfile(data,'synthetic-id',metric,'all',sundays()));
  assert.equal(d.querySelectorAll('circle').length,5);
  assert.equal(d.querySelectorAll('.native-lw-points li').length,5);
  assert.match(d.querySelector('[data-lw-kpi='+metric+']').textContent,/Vorwert: 130/);
  assert.match(d.querySelector('.native-lw-chart').textContent,/50 % seit 2026-10-11/);
  assert.ok(d.querySelector('[data-native-stat-evidence="synthetic-w41|synthetic-id|'+metric+'"]'));
  assert.match(d.querySelector('.native-lw-points').textContent,/Sonntagsprofil.*Abgelesen/);
  assert.doesNotMatch(d.querySelector('.native-lw-points').textContent,/donations_weekly/);
 }
});
test('same calendar date keeps conflicting originals and one priority-selected point',()=>{
 const stats=[...sundays(),{...sundays()[9],value:140,quality:'corrected'}];
 const data={available:true,snapshots:[snapshot('2026-11-01',{power:999})]};
 const last=buildUnifiedMetricTimeline(data,'synthetic-id','power',stats).at(-1);
 assert.equal(last.value,140);assert.equal(last.sources.length,3);assert.equal(last.discrepancy,true);
 const d=doc(renderLwProfile(data,'synthetic-id','power','all',stats));
 assert.equal(d.querySelectorAll('circle').length,4);
 assert.match(d.body.textContent,/Abweichende Quellenwerte/);
 assert.match(d.querySelector('.native-lw-points').textContent,/999/);
 assert.match(d.querySelector('.native-lw-points').textContent,/SHA256/);
 assert.ok(d.querySelector('[data-native-stat-evidence="synthetic-w44|synthetic-id|power"]'));
});
test('poor quality and NULL never replace applied measurements or become zero; Sunday-only stays usable',()=>{
 const stats=sundays().map(s=>s.captured_at.startsWith('2026-11-01')?{...s,value:null,quality:'corrected'}:s);
 stats.push({...sundays()[9],quality:'inferred',value:999},{...sundays()[9],member_id:'other-id',value:888});
 const data={available:true,snapshots:[snapshot('2026-11-01',{power:155}),snapshot('2026-11-03',{power:null})]};
 const timeline=buildUnifiedMetricTimeline(data,'synthetic-id','power',stats);
 assert.deepEqual(timeline.map(p=>p.value),[100,110,120,155,null]);
 assert.equal(timeline.at(-2).source,'LW Import');
 const d=doc(renderLwProfile(null,'synthetic-id','power','all',sundays()));
 assert.equal(d.querySelectorAll('[data-lw-kpi]').length,6);
 assert.equal(d.querySelectorAll('circle').length,4);
 assert.match(d.querySelector('[data-lw-kpi=drone]').textContent,/nicht erfasst/);
 assert.ok(d.querySelector('[data-officer-tab=lwImport]'));
 assert.doesNotMatch(d.querySelector('[data-lw-kpi=drone]').textContent,/Vorwert: 0/);
});

test('applied history only, report windows, previous values and relative changes share one source',()=>{
 const snapshots=Array.from({length:6},(_,i)=>snapshot('2026-11-0'+(i+1),{power:100+i*10}));
 snapshots.push({...snapshot('2026-11-07',{power:999999}),applied_at:null});
 for(const [range,count] of [['1',1],['4',4],['5',5],['all',6]]){
  const d=doc(renderLwProfile({available:true,snapshots},'synthetic-id','power',range));
  assert.equal(d.querySelectorAll('.native-lw-points li').length,count);
  assert.equal(d.querySelector('[data-lw-range]').value,range);
  assert.match(d.querySelector('[data-lw-kpi=power]').textContent,/Vorwert: 140/);
  assert.match(d.querySelector('[data-lw-kpi=power]').textContent,/7,14 %/);
  assert.match(d.querySelector('.native-lw-chart').textContent,/50 % seit 2026-11-01/);
  assert.doesNotMatch(d.body.textContent,/999999|2026-11-07/);
 }
 const empty=renderLwProfile({available:true,snapshots:[{...snapshot('2026-11-07'),applied_at:null}]},'synthetic-id');
 assert.match(empty,/Noch keine LW-Werte freigegeben/);
 assert.equal(doc(empty).querySelectorAll('[data-lw-kpi]').length,6);
 const button=doc(empty).querySelector('button[data-officer-tab="lwImport"]');
 assert.equal(button.type,'button');assert.equal(button.textContent,'LW Import \u00f6ffnen');

 assert.doesNotMatch(empty,/98|999999|2026-11-07/);
});

test('zero denominator is n/a, missing prior has no delta, source fields are escaped',()=>{
 const old=snapshot('2026-11-01',{power:0,drone:null});
 const current={...snapshot('2026-11-02',{power:10,drone:0,Shield:'<img src=x>','Left / away':'Away S2261'}),reviewer:'<script>bad</script>'};
 const d=doc(renderLwProfile({available:true,snapshots:[old,current]},'synthetic-id'));
 assert.match(d.querySelector('[data-lw-kpi=power]').textContent,/n\/a \(Basis 0\)/);
 assert.match(d.querySelector('[data-lw-kpi=drone]').textContent,/Vergleich nicht erfasst/);
 assert.match(d.body.textContent,/Originalquelle|Reviewer: <script>bad<\/script>/);
 assert.equal(d.querySelectorAll('img,script').length,0);
 assert.doesNotMatch(d.body.textContent,/Infinity|NaN/);
});
test('six profile KPIs preserve zero/null, first snapshot has no trend and private identity anchor is visible',()=>{
 const d=doc(renderLwProfile({available:true,snapshots:[snapshot('2026-11-03',{drone:null})]},'synthetic-id'));
 assert.equal(d.querySelector('[data-officer-tab=lwImport]'),null);
 assert.equal(d.querySelectorAll('[data-lw-kpi]').length,6);assert.match(d.body.textContent,/member_id: synthetic-id/);
 assert.match(d.querySelector('[data-lw-kpi=drone]').textContent,/nicht erfasst/);
 assert.match(d.querySelector('[data-lw-kpi=kills]').textContent,/0/);
 assert.equal(d.querySelectorAll('polyline').length,0);assert.equal(d.querySelectorAll('circle').length,1);
 assert.match(d.body.textContent,/Noch kein Vergleich/);assert.match(d.body.textContent,/2026-11-03/);
 assert.match(d.body.textContent,/T4/);assert.match(d.body.textContent,/Berichtsdatum, kein belegtes Messzeitende/);
});
test('negative delta is neutral; NULL splits SVG paths; scales belong to selected KPI; wrong member excluded',()=>{
 const snapshots=[snapshot('2026-10-20',{drone:100}),snapshot('2026-10-21',{drone:90}),snapshot('2026-10-22',{drone:null}),snapshot('2026-10-23',{drone:80}),snapshot('2026-10-24',{drone:70}),{...snapshot('2026-10-25'),member_id:'other-id'}];
 const d=doc(renderLwProfile({available:true,snapshots},'synthetic-id','drone'));
 assert.equal(d.querySelectorAll('polyline').length,2);assert.equal(d.querySelectorAll('circle').length,4);
 assert.match(d.querySelector('[data-lw-kpi=drone]').textContent,/Rückgang · -10/);
 assert.match(d.querySelector('.native-lw-chart').textContent,/Drone/);assert.doesNotMatch(d.body.textContent,/other-id/);
 assert.match(renderLwProfile({available:true,snapshots:[]},'synthetic-id'),/Noch keine LW-Werte freigegeben/);
 assert.match(renderLwProfile(null,'synthetic-id'),/Noch keine LW-Werte freigegeben/);
});
test('profile escapes values and never invents comparisons from same-day report dates',()=>{
 const html=renderLwProfile({available:true,snapshots:[snapshot('2026-11-03'),snapshot('2026-11-03',{Profession:'<img src=x onerror=1>'})]},'synthetic-id');
 assert.equal(doc(html).querySelectorAll('img').length,0);assert.match(html,/Noch kein Vergleich/);assert.doesNotMatch(html,/Rückgang/);
});
const wait=async fn=>{for(let i=0;i<120;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'UI timeout')};

for(const mode of ['success','unresolved','archive','stale','bad-readback'])test('current G2 census uses batch preview and preserves existing IDs: '+mode,async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'}),oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 const row={source_row:1,source_name:'Synthetic current',member_id:'existing-id',match_state:'matched',review_status:'open',errors:[],source:{Name:'Synthetic current'}};
 const batch={id:'lw-'+'a'.repeat(64),sha256:'a'.repeat(64),report_date:'2026-11-04',revision:4,row_count:1,rows:[row],counts:{applied:0},
  roster_state:{active_ids:['existing-id']},roster_gate:{registry_revision:'b'.repeat(64),officer_attestation:{supported:true,endpoint:'/api/lw-import/lw-'+'a'.repeat(64)+'/reconcile'},blockers:mode==='stale'?['superseded_source']:['independent_roster_verification_missing']},
  reconciliation:{archived:mode==='archive'?[{id:'absent-id'}]:[],reactivated:[],unmatched:mode==='unresolved'?[row]:[],blocked:[],renamed:[{member_id:'existing-id',previous_name:'Synthetic old',name:row.source_name}]}};
 let posted=null,reads=0;
 const result={created:0,archived:0,reactivated:0};
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Synthetic R4',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/session')return Response.json({reviewWritesEnabled:true});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{}});
  if(path==='/api/lw-import')return Response.json({batches:[batch]});
  if(path==='/api/lw-import/'+batch.id){reads++;return Response.json(posted?{...batch,rows:[{...row,member_id:mode==='bad-readback'?'wrong-id':row.member_id,applied_at:'now'}],counts:{applied:1},reconciliation_receipt:{receipt_id:'receipt',result}}:batch)}
  if(path==='/api/lw-import/'+batch.id+'/reconcile'){posted=JSON.parse(opts.body);return Response.json({ok:true,receipt_id:'receipt',result})}
  throw Error('Unexpected current G2 route '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s),submit=form=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';submit(q('form'));
 await wait(()=>q('[data-officer-tab=members]'));q('[data-officer-tab=members]').click();await wait(()=>q('[data-officer-tab=lwImport]'));q('[data-officer-tab=lwImport]').click();
 await wait(()=>q('[data-lw-batch-id]'));q('[data-lw-batch-id]').click();await wait(()=>q('[data-lw-roster-load]'));q('[data-lw-roster-load]').click();await wait(()=>q('[data-lw-current-roster]'));
 const form=q('[data-lw-current-roster]');assert.match(q('[data-lw-roster-preview]').textContent,/Synthetic old.*Synthetic current/);
 submit(form);assert.equal(posted,null);
 form.elements.checked.checked=true;form.elements.reason.value='Synthetic complete census checked';
 if(['unresolved','archive','stale'].includes(mode)){assert.equal(form.querySelector('button').disabled,true);submit(form);assert.equal(posted,null);return}
 submit(form);await wait(()=>posted!==null);await wait(()=>mode==='bad-readback'?q('[data-lw-roster-result]').textContent.includes('unvollständig'):q('[data-lw-result]').textContent.includes('quittiert'));
 assert.deepEqual(posted,{sha256:batch.sha256,source_revision:4,registry_revision:'b'.repeat(64),member_count:1,full_roster_attested:true,new_members:[],reason:'Synthetic complete census checked'});
 assert.equal(reads,3);assert.equal(dom.window.localStorage.length,0);assert.equal(dom.window.sessionStorage.length,0);
 if(mode==='bad-readback'){assert.equal(form.querySelector('button').disabled,true);assert.doesNotMatch(q('[data-lw-result]').textContent,/quittiert/)}
});

test('native CSV upload sends immutable raw bytes through existing R4 bearer session',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'}),oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 const bytes=new TextEncoder().encode('\ufeffName,Power\r\nSynthetic,0\r\n').buffer;
 let uploaded=false;
 const batch={id:'lw-synthetic',sha256:'a'.repeat(64),report_date:'2026-11-04',revision:0,rows:[]};
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Synthetic R4',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/session')return Response.json({reviewWritesEnabled:true});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{}});
  if(path==='/api/lw-import'&&opts.method==='POST'){
   assert.equal(new URL(url).origin,'https://rzsn-staging-api-bridge.pages.dev');
   assert.equal(new URL(url).search,'?report_date=2026-11-04');assert.equal(opts.body,bytes);
   assert.equal(opts.headers.Authorization,'Bearer synthetic-token');assert.equal(opts.headers['Content-Type'],'text/csv');
   assert.equal(opts.credentials,'omit');assert.equal(opts.mode,'cors');assert.equal(opts.cache,'no-store');
   assert.doesNotMatch(JSON.stringify(opts.headers),/private-original/);uploaded=true;return Response.json(batch);
  }
  if(path==='/api/lw-import')return Response.json({batches:[]});
  throw Error('Unexpected upload route '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s),submit=form=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';submit(q('form'));
 await wait(()=>q('[data-officer-tab=members]'));q('[data-officer-tab=members]').click();await wait(()=>q('[data-officer-tab=lwImport]'));q('[data-officer-tab=lwImport]').click();await wait(()=>q('[data-lw-upload]'));
 const form=q('[data-lw-upload]');form.elements.report_date.value='2026-11-04';
 Object.defineProperty(form.elements.csv,'files',{value:[{name:'private-original.csv',size:bytes.byteLength,arrayBuffer:async()=>bytes}]});
 submit(form);await wait(()=>uploaded);await wait(()=>q('[data-lw-status]').textContent.includes('privat hinterlegt'));
 assert.equal(form.elements.csv.value,'');assert.equal(mount.querySelector('iframe'),null);
 assert.equal(dom.window.localStorage.length,0);assert.equal(dom.window.sessionStorage.length,0);
});

for(const mode of ['success','wrong-rank','wrong-post-rank','override-rank','selected-correction','selected-source','bad-ack','bad-readback','schema-blocked','unauthenticated'])test('LW roster requires explicit source/IDs and manual creation stays separate: '+mode,async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'}),oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 const activeIds=Array.from({length:98},(_,i)=>'synthetic-'+i),candidateIds=Array.from({length:7},(_,i)=>'absent-'+i);
 const source={Name:'彡Synthetic New',Rank:'R2',Power:'0'},batch={id:'lw-'+'a'.repeat(64),sha256:'a'.repeat(64),revision:1,report_date:'2026-11-03',rows:[{source_row:99,source_name:source.Name,source,errors:[],match_state:'unmatched',member_id:null,review_status:'open',applied_at:null,review_id:'synthetic-review'}]};
 const preview={batch_id:batch.id,sha256:batch.sha256,revision:1,membership_revision:'b'.repeat(64),report_date:batch.report_date,active_count:105,ready:mode!=='schema-blocked',blockers:mode==='schema-blocked'?['Schema erlaubt roster_confirmed_absence nicht']:[],candidates:candidateIds.map(id=>({id,name:'Synthetic '+id,rank:'R3'})),unmatched:[{source_row:99,source_name:source.Name,rank:'R1',source_rank:'R2',rank_mismatch:true,review_id:'synthetic-review'}]};
 if(mode==='selected-correction'){preview.unmatched[0].rank='R2';preview.unmatched[0].rank_mismatch=false}
 let reconciled=false,created=false,posted=null,createBody=null,rosterReads=0,createCalls=0;
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Synthetic R4',role:'R4'});
  if(path==='/api/overview')return Response.json({active:105,reviews:1});
  if(path==='/api/session')return Response.json({reviewWritesEnabled:true});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{}});
  if(path==='/api/lw-import')return Response.json({batches:[batch]});
  if(path==='/api/lw-import/'+batch.id)return Response.json(batch);
  if(path==='/api/lw-import/'+batch.id+'/roster-reconcile'){
   if(mode==='unauthenticated')return Response.json({error:'Linked R4/R5 session required'},{status:403});
   if(opts.method==='POST'){posted=JSON.parse(opts.body);reconciled=true;return Response.json({ok:mode!=='bad-ack',sha256:batch.sha256,active_count:98,active_ids:activeIds,member_ids:candidateIds})}
   rosterReads++;return Response.json(reconciled?{...preview,reconciled:true,active_count:98,manual_creation_enabled:true,candidates:[],active_ids:activeIds,member_ids:candidateIds}:preview);
  }
  if(path==='/api/member-registry/create'){createCalls++;createBody=JSON.parse(opts.body);created=true;return Response.json({ok:true,member_id:'new-synthetic-id',...(mode==='wrong-post-rank'?{rank:'R2'}:{})})}
  if(path==='/api/member-registry')return Response.json({counts:{active:created?99:mode==='bad-readback'?105:98},members:[...activeIds.map(id=>({id,lifecycle:'active'})),...candidateIds.map(id=>({id,lifecycle:'former'})),...(created?[{id:'new-synthetic-id',name:source.Name,rank:mode==='wrong-rank'?'R2':createBody.rank,...(mode==='override-rank'?{imported_rank:'R2',rank_override:'R1'}:{}),lifecycle:'active'}]:[])]});
  throw Error('Unexpected request '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s),submit=form=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';submit(q('form'));
 await wait(()=>q('[data-officer-tab=members]'));q('[data-officer-tab=members]').click();await wait(()=>q('[data-officer-tab=lwImport]'));q('[data-officer-tab=lwImport]').click();
 await wait(()=>q('[data-lw-batch-id]'));q('[data-lw-batch-id]').click();await wait(()=>q('[data-lw-roster-load]'));
 assert.equal(rosterReads,0);assert.equal(q('[data-lw-roster]').open,false);q('[data-lw-roster]').open=true;q('[data-lw-roster-load]').click();
 if(mode==='unauthenticated'){await wait(()=>q('[data-lw-roster-result]').textContent.includes('session required'));assert.equal(posted,null);assert.equal(q('[data-lw-manual-create]'),null);return}
 await wait(()=>q('[data-lw-roster-confirm]'));const form=q('[data-lw-roster-confirm]');
 assert.equal(form.querySelectorAll('[name=candidate]:checked').length,0);assert.equal(q('[data-lw-manual-create]'),null);assert.match(q('[data-lw-roster-preview]').textContent,/105/);
 if(mode==='schema-blocked'){assert.equal(form.querySelector('button').disabled,true);submit(form);assert.equal(posted,null);return}
 submit(form);assert.equal(posted,null);form.querySelectorAll('[name=candidate]').forEach(x=>x.checked=true);form.elements.reason.value='Synthetic complete source reviewed';submit(form);assert.equal(posted,null);
 form.elements.source_checked.checked=true;submit(form);await wait(()=>posted);await wait(()=>!q('[data-lw-roster-result]').textContent.includes('Rücklesekontrolle …'));
 assert.deepEqual(posted.member_ids,candidateIds);assert.equal(posted.source_checked,true);assert.equal(posted.full_current_roster,true);assert.equal(posted.sha256,batch.sha256);assert.equal(posted.membership_revision,preview.membership_revision);
 if(['bad-ack','bad-readback'].includes(mode)){assert.match(q('[data-lw-roster-result]').textContent,/unvollständig/);assert.equal(q('[data-lw-manual-create]'),null);return}
 const create=q('[data-lw-manual-create]');assert.ok(create);assert.equal(create.elements.player_name.value,source.Name);assert.equal(create.elements.rank.value,mode==='selected-correction'?'R2':'R1');assert.equal(createBody,null);
 submit(create);assert.equal(createBody,null);
 if(mode==='selected-correction'||mode==='selected-source'){create.elements.source_checked.checked=true;create.elements.rank.value=mode==='selected-source'?'R2':'R1';create.elements.rank.dispatchEvent(new dom.window.Event('change',{bubbles:true}));assert.equal(create.elements.source_checked.checked,false)}
 create.elements.reason.value='Synthetic new identity source reviewed';create.elements.source_checked.checked=true;submit(create);
 if(mode==='wrong-rank'||mode==='wrong-post-rank'){await wait(()=>q('[data-lw-roster-result]').textContent.includes('nicht erneut anlegen'));assert.doesNotMatch(q('[data-lw-result]').textContent,/99 aktive/);assert.equal(create.querySelector('button').disabled,true);submit(create);assert.equal(createCalls,1);return}
 await wait(()=>q('[data-lw-result]').textContent.includes('99 aktive'));assert.equal(createBody.name,source.Name);assert.equal(createBody.rank,mode==='selected-source'?'R2':'R1');assert.equal(createBody.source_rank,'R2');assert.equal(createBody.rank_confirmation_source,mode==='selected-source'?'officer_checked_csv_rank':'verified_user_correction');assert.equal(createBody.officer_reviewed,true);assert.deepEqual(Object.keys(createBody).sort(),['name','officer_reviewed','rank','rank_confirmation_source','reason','source_rank']);assert.equal(batch.rows[0].member_id,null);assert.equal(batch.rows[0].applied_at,null);assert.match(q('[data-lw-result]').textContent,/new-synthetic-id.*separat freigeben/);
});
test('native LW Import review uses existing resolve route, no screenshot fiction and explicit source acknowledgment',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'}),oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 const context={sha256:'a'.repeat(64),batch_id:'lw-'+'a'.repeat(64),date:'2026-11-03',source_row:1,match_state:'unmatched',source:{Name:'Synthetic Unmatched',Power:'0',Shield:''},errors:[]};let saved=null;
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Synthetic R4',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:1});
  if(path==='/api/session')return Response.json({reviewWritesEnabled:true});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{}});
  if(path==='/api/reviews')return Response.json([{id:'lw-review',source_name:'Synthetic Unmatched',kind:'lw_import',source_batch:'LW Import',context}]);
  if(path==='/api/reviews/pending')return Response.json({queues:{identities:{available:true,count:2,items:[{source_name:'Synthetic unknown A'},{source_name:'Synthetic unknown B'}]},donations:{available:false,count:null,items:[]}}});
  if(path==='/api/identity-options')return Response.json([{id:'synthetic-id',name:'Synthetic Existing'}]);
  if(path==='/api/profile-captures')return Response.json([]);
  if(path==='/api/reviews/lw-review/resolve'){saved=JSON.parse(opts.body);return Response.json({ok:true,review_id:'lw-review',applied:false})}
  if(path==='/api/capture-publication-review'||path==='/api/capture-publication-decisions')return Response.json({items:[]});
  throw Error('Unexpected synthetic request '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>q('[data-officer-tab=more]'));q('[data-officer-tab=more]').click();await wait(()=>q('[data-officer-tab=reviews]'));q('[data-officer-tab=reviews]').click();
 await wait(()=>q('[data-lw-review-form]'));
 await wait(()=>q('[data-pending-queues] button'));
 assert.equal(q('[data-pending-status]').closest('details').open,true);
 assert.equal(q('[data-pending-queues]').querySelectorAll('button').length,2);
 assert.match(q('[data-pending-queues]').textContent,/Synthetic unknown A.*Synthetic unknown B/);
 assert.match(q('[data-pending-queues]').textContent,/nicht verfügbar|unavailable/);
 const card=q('[data-review-kind=lw_import]');assert.equal(card.querySelectorAll('img,input[type=file]').length,0);assert.match(card.textContent,/nicht erfasst/);
 const form=q('[data-lw-review-form]');form.elements.member_id.value='synthetic-id';form.elements.reason.value='Synthetic source checked';form.elements.checked.checked=true;
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>saved!==null);await wait(()=>card.textContent.includes('separat freigeben'));
 assert.equal(saved.member_id,'synthetic-id');assert.equal(saved.source_checked,true);assert.equal(saved.sha256,context.sha256);
 assert.equal(dom.window.localStorage.length,0);assert.equal(dom.window.sessionStorage.length,0);
});

test('LW groups separate applied from matched, unresolved first, all compact and escaped',()=>{
 const base={source:{Name:'Synthetic'},errors:[],review_status:'open'};
 const rows=[{...base,source_row:4,source_name:'Blocked',match_state:'blocked'},{...base,source_row:3,source_name:'Applied',match_state:'matched',applied_at:'today'},{...base,source_row:2,source_name:'Matched',match_state:'matched'},{...base,source_row:1,source_name:'<img src=x>',match_state:'unmatched'}];
 const d=doc(renderLwGroups({rows}));assert.deepEqual([...d.querySelectorAll('[data-lw-group]')].map(x=>x.dataset.lwGroup),['unmatched','matched','applied','blocked']);
 assert.equal(d.querySelectorAll('details[open],img').length,0);assert.equal(d.querySelector('[data-lw-group=matched] [data-lw-visible]').textContent,'1');assert.equal(d.querySelectorAll('[data-lw-identity]').length,1);
 assert.match(d.querySelector('[data-lw-group=blocked]').textContent,/Blocked/);
 assert.equal(d.querySelector('[data-lw-group=matched] [data-lw-identity]'),null);
 assert.equal(doc(renderLwGroups({rows:[{...base,source_row:5,match_state:'ambiguous'}]})).querySelectorAll('[data-lw-identity]').length,1);
});

test('inline import picker uses current identity API, searches archived IDs and rereads without applying',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'}),oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 const row={source_row:1,source_name:'Synthetic Unmatched',member_id:null,match_state:'unmatched',review_id:'synthetic-review',review_status:'open',errors:[],source:{Name:'Synthetic Unmatched',Power:'0'}};
 const batch={id:'lw-'+'a'.repeat(64),sha256:'a'.repeat(64),report_date:'2026-11-03',revision:0,rows:[row],counts:{}};let saved=null,reads=0;
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Synthetic R4',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:1});
  if(path==='/api/session')return Response.json({reviewWritesEnabled:true});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{}});
  if(path==='/api/lw-import')return Response.json({batches:[batch]});
  if(path==='/api/lw-import/'+batch.id){reads++;return Response.json(batch)}
  if(path==='/api/identity-options'){assert.equal(new URL(url).search,'?include_former=1');return Response.json([{id:'archived-id',name:'Synthetic Archived',status:'former'},{id:'other-id',name:'Other',status:'active'}])}
  if(path==='/api/reviews/synthetic-review/resolve'){saved=JSON.parse(opts.body);row.member_id=saved.member_id;row.match_state='matched';row.review_status='approved';return Response.json({ok:true,applied:false})}
  throw Error('Unexpected request '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>q('[data-officer-tab=members]'));q('[data-officer-tab=members]').click();await wait(()=>q('[data-officer-tab=lwImport]'));q('[data-officer-tab=lwImport]').click();
 await wait(()=>q('[data-lw-batch-id]'));q('[data-lw-batch-id]').click();await wait(()=>q('[data-lw-group]'));
 assert.equal(q('[data-lw-group]').open,false);assert.equal(q('[data-lw-apply]').closest('details').open,false);
 q('[data-lw-search]').value='absent';q('[data-lw-search]').dispatchEvent(new dom.window.Event('input'));assert.equal(q('[data-lw-empty]').hidden,false);
 q('[data-lw-search]').value='';q('[data-lw-search]').dispatchEvent(new dom.window.Event('input'));
 q('[data-lw-group=unmatched]').open=true;q('[data-lw-row]').open=true;await wait(()=>q('[data-lw-inline-review]'));
 const form=q('[data-lw-inline-review]'),select=form.elements.member_id;assert.match(select.textContent,/Archiv/);assert.match(select.textContent,/archived-id/);
 assert.ok([...mount.querySelectorAll('button')].find(b=>b.textContent==='Neues Mitglied anlegen').disabled);
 form.elements.search.value='archived-id';form.elements.search.dispatchEvent(new dom.window.Event('input'));assert.equal(select.options.length,2);assert.equal(select.options[1].value,'archived-id');assert.equal(select.value,'');
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));assert.equal(saved,null);
 select.value='archived-id';form.elements.reason.value='Original source checked';form.elements.checked.checked=true;form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>q('[data-lw-result]').textContent.includes('Keine Punkte'));assert.equal(reads,2);assert.equal(saved.source_checked,true);assert.equal(saved.sha256,batch.sha256);assert.equal(saved.member_id,'archived-id');assert.equal(q('[data-lw-group=matched] [data-lw-visible]').textContent,'1');assert.equal(q('[data-lw-group=applied] [data-lw-visible]').textContent,'0');
});

for(const mode of ['success','bad-ack','bad-reread'])test('matched selection is explicit and verifies ACK plus reread: '+mode,async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'}),oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 const base={errors:[],source:{Name:'Synthetic'},review_status:'open'};
 const batch={id:'lw-synthetic',sha256:'a'.repeat(64),revision:0,report_date:'2026-11-03',rows:[
  {...base,source_row:1,source_name:'Synthetic A',member_id:'a',match_state:'matched'},
  {...base,source_row:2,source_name:'Synthetic B',member_id:'b',match_state:'matched'},
  {...base,source_row:3,source_name:'Synthetic unknown',match_state:'unmatched'},
  {...base,source_row:4,source_name:'Synthetic blocked',match_state:'blocked'},
  {...base,source_row:5,source_name:'Synthetic applied',member_id:'c',match_state:'matched',applied_at:'already'}]};
 let saved=null,reads=0,writes=0;
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Synthetic R4',role:'R4'});
  if(path==='/api/overview')return Response.json({active:3,reviews:2});
  if(path==='/api/session')return Response.json({reviewWritesEnabled:true});
  if(path==='/api/operations')return Response.json({tasks:[]});
  if(path==='/api/train-manager')return Response.json({counts:{}});
  if(path==='/api/lw-import')return Response.json({batches:[batch]});
  if(path==='/api/lw-import/'+batch.id){reads++;return Response.json(reads===1?batch:{...batch,rows:batch.rows.map(r=>[1,2].includes(r.source_row)?{...r,applied_at:'now',member_id:mode==='bad-reread'?'wrong':r.member_id}:r)})}
  if(path==='/api/lw-import/'+batch.id+'/apply'){writes++;saved=JSON.parse(opts.body);return Response.json({ok:mode!=='bad-ack',sha256:batch.sha256,applied_rows:2})}
  throw Error('Unexpected synthetic request '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>q('[data-officer-tab=members]'));q('[data-officer-tab=members]').click();await wait(()=>q('[data-officer-tab=lwImport]'));q('[data-officer-tab=lwImport]').click();
 await wait(()=>q('[data-lw-batch-id]'));q('[data-lw-batch-id]').click();await wait(()=>q('[data-lw-apply]'));
 const form=q('[data-lw-apply]'),submit=()=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(form.closest('details').open,false);assert.equal(form.querySelectorAll('[name=row]:checked').length,0);
 assert.equal(q('[data-lw-group=matched]').querySelector('[data-lw-identity]'),null);
 q('[data-lw-select-all]').click();assert.deepEqual([...form.querySelectorAll('[name=row]:checked')].map(x=>x.value),['1','2']);assert.equal(writes,0);
 q('[data-lw-deselect-all]').click();assert.equal(form.querySelectorAll('[name=row]:checked').length,0);
 submit();assert.equal(writes,0);q('[data-lw-select-all]').click();submit();assert.equal(writes,0);
 form.elements.reason.value='Synthetic R4 source review';submit();assert.equal(writes,0);
 form.elements.reviewed.checked=true;submit();await wait(()=>reads===2);await wait(()=>!q('[data-lw-result]').textContent.includes('Freigabe und'));
 assert.equal(writes,1);assert.deepEqual(saved.rows,[1,2]);assert.equal(saved.reviewed,true);assert.equal(saved.reason,'Synthetic R4 source review');assert.equal(saved.sha256,batch.sha256);assert.equal(saved.revision,0);
 if(mode==='success'){assert.match(q('[data-lw-result]').textContent,/2 Zeilen best/);assert.equal(q('[data-lw-group=applied] [data-lw-visible]').textContent,'3')}
 else {assert.match(q('[data-lw-result]').textContent,/unvollst/);assert.equal(q('[data-lw-group=applied] [data-lw-visible]').textContent,'1');assert.equal(form.querySelector('button:not([type=button])').disabled,false)}
});
