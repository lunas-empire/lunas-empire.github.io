import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {renderLwProfile,initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
const snapshot=(date,values={})=>({member_id:'synthetic-id',report_date:date,applied_at:date+'T12:00:00Z',batch_id:'lw-'+date,sha256:'a'.repeat(64),source_row:1,values:{power:100,army_power:50,total_troops:10,drone:1,kills:0,hq:30,...values}});
const doc=html=>new JSDOM(html).window.document;
test('six profile KPIs preserve zero/null, first snapshot has no trend and private identity anchor is visible',()=>{
 const d=doc(renderLwProfile({available:true,snapshots:[snapshot('2026-11-03',{army_power:null})]},'synthetic-id'));
 assert.equal(d.querySelectorAll('[data-lw-kpi]').length,6);assert.match(d.body.textContent,/member_id: synthetic-id/);
 assert.match(d.querySelector('[data-lw-kpi=army_power]').textContent,/nicht erfasst/);
 assert.match(d.querySelector('[data-lw-kpi=kills]').textContent,/0/);
 assert.equal(d.querySelectorAll('polyline').length,0);assert.equal(d.querySelectorAll('circle').length,1);
 assert.match(d.body.textContent,/Noch kein Vergleich/);assert.match(d.body.textContent,/2026-11-03/);
 assert.match(d.body.textContent,/T4/);assert.match(d.body.textContent,/Berichtsdatum, kein belegtes Messzeitende/);
});
test('negative delta is neutral; NULL splits SVG paths; scales belong to selected KPI; wrong member excluded',()=>{
 const snapshots=[snapshot('2026-10-20',{army_power:100}),snapshot('2026-10-21',{army_power:90}),snapshot('2026-10-22',{army_power:null}),snapshot('2026-10-23',{army_power:80}),snapshot('2026-10-24',{army_power:70}),{...snapshot('2026-10-25'),member_id:'other-id'}];
 const d=doc(renderLwProfile({available:true,snapshots},'synthetic-id','army_power'));
 assert.equal(d.querySelectorAll('polyline').length,2);assert.equal(d.querySelectorAll('circle').length,4);
 assert.match(d.querySelector('[data-lw-kpi=army_power]').textContent,/Rückgang · -10/);
 assert.match(d.querySelector('.native-lw-chart').textContent,/Army Power/);assert.doesNotMatch(d.body.textContent,/other-id/);
 assert.match(renderLwProfile({available:true,snapshots:[]},'synthetic-id'),/Noch kein LW Import-Snapshot/);
 assert.match(renderLwProfile(null,'synthetic-id'),/derzeit nicht verfügbar/);
});
test('profile escapes values and never invents comparisons from same-day report dates',()=>{
 const html=renderLwProfile({available:true,snapshots:[snapshot('2026-11-03'),snapshot('2026-11-03',{Profession:'<img src=x onerror=1>'})]},'synthetic-id');
 assert.equal(doc(html).querySelectorAll('img').length,0);assert.match(html,/Noch kein Vergleich/);assert.doesNotMatch(html,/Rückgang/);
});
const wait=async fn=>{for(let i=0;i<120;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'UI timeout')};
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
 const card=q('[data-review-kind=lw_import]');assert.equal(card.querySelectorAll('img,input[type=file]').length,0);assert.match(card.textContent,/nicht erfasst/);
 const form=q('[data-lw-review-form]');form.elements.member_id.value='synthetic-id';form.elements.reason.value='Synthetic source checked';form.elements.checked.checked=true;
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>saved!==null);await wait(()=>card.textContent.includes('separat freigeben'));
 assert.equal(saved.member_id,'synthetic-id');assert.equal(saved.source_checked,true);assert.equal(saved.sha256,context.sha256);
 assert.equal(dom.window.localStorage.length,0);assert.equal(dom.window.sessionStorage.length,0);
});
