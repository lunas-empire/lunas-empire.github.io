import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

test('Four destinations drive real cockpit, train and player dossier workflows',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const priorWindow=globalThis.window,priorFetch=globalThis.fetch,priorFormData=globalThis.FormData;
 globalThis.window=dom.window;globalThis.FormData=dom.window.FormData;
 dom.window.confirm=()=>true;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=priorWindow;globalThis.fetch=priorFetch;globalThis.FormData=priorFormData;dom.window.close()});
 const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
 const train={today:'2026-10-13',counts:{completed:3,planned:1,missing_recent:1},
  members:[{id,name:'Synthetic Officer Driver',rank:'R4'}],history:[],
  calendar:[{date:'2026-10-13',type:'R4',entry:null},
   {date:'2026-10-14',type:'Members Day',entry:{driver:'Confirmed Player',status:'planned',linked:true}}]};
 const roster={members:[{id,name:'Synthetic Officer Driver',rank:'R4',lifecycle:'active',
  blacklisted:0,reason:'Initial synthetic reason',revision:'a'.repeat(64)}],
  counts:{active:1,former:0,blacklisted:0}};
 const writes=[];
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-memory-only',name:'Synthetic Officer',role:'R5'});
  if(path==='/api/overview')return Response.json({active:1,reviews:2});
  if(path==='/api/operations')return Response.json({tasks:[{title:'Prepare team',status:'open',due_date:'2026-10-13',priority:'high'}],
   events:[{event_type:'marshall_guard',event_date:'2026-10-14',outcome:'scheduled',lead_id:null}],members:[]});
  if(path==='/api/train-manager')return Response.json(train);
  if(path==='/api/members')return Response.json([{id,name:'Synthetic Officer Driver',rank:'R4',power:20000000}]);
  if(path==='/api/member/'+id)return Response.json({member:{id,name:'Synthetic Officer Driver',rank:'R4',status:'active',source_difference:1,imported_rank:'R3',source_status:'active',state_source:'registry',registry_updated_by:'Synthetic R5',registry_updated_at:'2026-10-13'},stats:[],weeks:[]});
  if(path==='/api/member-registry')return Response.json(roster);
  if(path==='/api/reviews')return Response.json([{id:'test-review',kind:'vs_day',category:'vs_uncertain',source_name:'Test Player',metric:'Mon',source_batch:'vs/2026-W40'}]);
  if(path==='/api/train-assignments'&&opts.method==='POST'){
   writes.push(JSON.parse(opts.body));
   return Response.json({ok:true});
  }
  throw Error('Unexpected endpoint '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=sel=>mount.querySelector(sel);
 const until=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,6))}assert.ok(fn(),'render did not settle')};
 const submit=form=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';submit(q('form'));
 await until(()=>q('.native-mission'));
 assert.equal(mount.querySelectorAll('.native-primary-tab').length,5);
 assert.equal(mount.querySelectorAll('.native-admin-top').length,0,'Nested branded header must not return');
 assert.equal(mount.querySelectorAll('.native-command-emblem').length,0,'Second RZSN emblem must not be rendered');
 assert.equal(mount.querySelectorAll('.native-officer-strip').length,1,'One compact officer session bar');
 assert.equal(q('.native-return-link')?.getAttribute('href'),'#today','Return to member hub remains obvious');
 assert.equal(mount.querySelectorAll('h1').length,1,'Accessible admin title exists but is not a second hero');
 assert.equal(mount.querySelectorAll('.native-mission').length,4,'Cockpit keeps only four open cases in this fixture');
 assert.match(q('.native-dashboard').textContent,/2 offene Prüffälle/);
 q('[data-officer-tab=more]').click();
 assert.ok(q('[data-officer-tab=registry]'),'Roster archive is one tile away');
 assert.ok(q('[data-officer-tab=reviews]'),'Review workflow is one tile away');
 q('[data-officer-tab=overview]').click();
 await until(()=>q('.native-dashboard'));
 q('[data-native-action=train-today]').click();
 await until(()=>q('#native-train-save'));
 assert.equal(q('#native-train-save [name=date]').value,'2026-10-13');
 assert.equal(q('#native-train-save [name=date]').readOnly,true);
 q('#native-train-save [name=member_id]').value=id;
 submit(q('#native-train-save'));
 await until(()=>writes.length===1);
 assert.equal(writes[0].member_id,id);
 assert.equal(writes[0].note,'','Empty optional note must not be sent as null');
 assert.equal(writes[0].expected_revision,0);
 await until(()=>q('#native-train-body')&&!q('#native-train-save'));
 q('[data-officer-tab=members]').click();
 await until(()=>q('[data-native-member]'));
 q('[data-native-member]').click();
 await until(()=>q('.native-profile'));
 assert.match(q('.native-profile').textContent,/Abweichender Import/);
 q('[data-native-manage]').click();
 await until(()=>q('#registry-save'));
 assert.equal(q('#registry-save [name=rank]').value,'R4');
 q('[data-officer-tab=overview]').click();
 await until(()=>q('[data-native-action=review-open]'));
 q('[data-native-action=review-open]').click();
 await until(()=>q('#review-list-native'));
 assert.equal(q('#review-list-native [data-review-approve]'),null);
});

test('Train concurrent conflict keeps inputs and offers explicit reload',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const priorWindow=globalThis.window,priorFetch=globalThis.fetch,priorFormData=globalThis.FormData;
 globalThis.window=dom.window;globalThis.FormData=dom.window.FormData;dom.window.confirm=()=>true;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=priorWindow;globalThis.fetch=priorFetch;globalThis.FormData=priorFormData;dom.window.close()});
 let saves=0;
 const train={today:'2026-10-13',history:[],calendar:[{date:'2026-10-13',type:'R4',entry:null}],members:[],counts:{completed:0,planned:0,missing_recent:0}};
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Officer',role:'R5'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],members:[]});
  if(path==='/api/train-manager')return Response.json(train);
  if(path==='/api/train-assignments'){saves++;return Response.json({error:'Stale version'},{status:409})}
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=sel=>mount.querySelector(sel);
 const until=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,6))}assert.ok(fn(),'render did not settle')};
 const submit=form=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';submit(q('form'));
 await until(()=>q('[data-native-action=train-today]'));q('[data-native-action=train-today]').click();
 await until(()=>q('#native-train-save'));
 q('#native-train-save [name=driver_name]').value='Synthetic backup';
 const form=q('#native-train-save');submit(form);
 await until(()=>form.dataset.conflict==='1');
 assert.equal(form.querySelector('[name=driver_name]').value,'Synthetic backup');
 assert.equal(form.querySelector('[type=submit]').disabled,true);
 assert.equal(form.querySelector('[data-native-form-reload]').hidden,false);
 assert.equal(saves,1);
 form.querySelector('[data-native-form-reload]').click();
 await until(()=>!q('#native-train-save'));
});
