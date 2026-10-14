import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer,profileMetricChanges} from '../assets/native-admin.js';

test('Profile development uses only verified repeated samples, not invented changes',()=>{
 const rows=[
  {metric:'power',value:9000000,quality:'observed',captured_at:'2026-10-14T10:00:00Z'},
  {metric:'power',value:8500000,quality:'corrected',captured_at:'2026-10-07T10:00:00Z'},
  {metric:'kills',value:200000,quality:'observed',captured_at:'2026-10-14T10:00:00Z'},
  {metric:'kills',value:10000,quality:'inferred',captured_at:'2026-10-07T10:00:00Z'}
 ];
 const metrics=profileMetricChanges(rows);
 const power=metrics.find(x=>x.metric==='power'),kills=metrics.find(x=>x.metric==='kills');
 assert.equal(power.delta,500000);
 assert.equal(power.deltaSinceFirst,500000);
 assert.equal(power.count,2);
 assert.equal(kills.delta,null);
 assert.equal(kills.deltaSinceFirst,null);
});

test('VS priority is NOT OCR review count; VS player opens real dossier, history and return',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const prevWindow=globalThis.window,prevFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=prevWindow;globalThis.fetch=prevFetch;dom.window.close()});
 const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
 const member={id,name:'Synthetic Player Long Name',rank:'R2',status:'active',power:9000000,kills:200000,donations_weekly:7000};
 const sample={
  member,stats:[
   {metric:'power',value:9000000,quality:'observed',captured_at:'2026-10-14T10:00:00Z'},
   {metric:'power',value:8500000,quality:'corrected',captured_at:'2026-10-07T10:00:00Z'},
   {metric:'kills',value:200000,quality:'observed',captured_at:'2026-10-14T10:00:00Z'}
  ],
  weeks:[
   {week:'2026-W41',state:'preliminary',weekly_points:85000000,verified_days:3,verified_goal_days:2,uncertain_days:3},
   {week:'2026-W40',state:'final',weekly_points:82000000,verified_days:6,verified_goal_days:5,uncertain_days:0},
   {week:'2026-W39',state:'final',weekly_points:80000000,verified_days:6,verified_goal_days:4,uncertain_days:0}
  ],days:[{week:'2026-W40',weekday:0,quality:'observed',points:3700000}],
  rides:[],dice_wins:[],achievements:[]
 };
 const weeks=[{week:'2026-W41',priority:29,failedDays:50,unknownDays:10,perfect:4,
   dayTotals:[{weekday:0,passed:50,failed:20,unknown:5}],
   members:[{id,name:member.name,rank:'R2',failed:3,unknown:1,
     days:[{weekday:0,verified:true,points:1200000}]}]}];
 const routes=[];
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;routes.push(path);
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:94,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-14',history:[],calendar:[],counts:{}});
  if(path==='/api/vs-intelligence')return Response.json({weeks});
  if(path==='/api/members')return Response.json([member]);
  if(path==='/api/member/'+id)return Response.json(sample);
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const until=async fn=>{for(let i=0;i<130;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'UI did not settle')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';
 q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=vs]'));
 q('[data-officer-tab=vs]').click();await until(()=>q('.native-vs-priority-note'));
 assert.match(q('.native-vs-priority-note').textContent,/29 Spieler/);
 assert.match(q('[data-native-action=review-open]').textContent,/OCR-Prüffälle \(0\)/);
 assert.doesNotMatch(q('[data-native-action=review-open]').textContent,/29/);
 q('.native-vs-group summary').click();
 await until(()=>q('[data-native-member="'+id+'"]'));
 q('[data-native-member="'+id+'"]').click();
 await until(()=>q('.native-profile h3'));
 assert.equal(q('.native-profile h3').textContent,member.name);
 assert.match(q('.native-profile-metrics').textContent,/500.000 seit der vorherigen Aufnahme/);
 assert.match(q('.native-profile-metrics').textContent,/Seit 2026-10-07: \+500.000/);
 assert.match(q('.native-profile-metrics').textContent,/Erst eine bestätigte Aufnahme/);
 assert.match(q('.native-profile-weeks').textContent,/2.000.000 zum 2026-W39/);
 assert.match(q('.native-profile-weeks').textContent,/Vorläufig/);
 assert.ok(routes.includes('/api/member/'+id));
 q('[data-native-member-close]').click();
 await until(()=>q('#native-member-list')&&!q('.native-profile'));
 assert.ok(q('.native-rank-group').open);
 assert.ok(q('[data-native-member="'+id+'"]'));
});

test('Unavailable player dossier displays useful retry without making roster disappear',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const prevWindow=globalThis.window,prevFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=prevWindow;globalThis.fetch=prevFetch;dom.window.close()});
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-14',history:[],calendar:[],counts:{}});
  if(path==='/api/members')return Response.json([{id:'member-1',name:'Test',rank:'R2',status:'active'}]);
  if(path==='/api/member/member-1')return Response.json({error:'Service temporarily unavailable'},{status:503});
  throw Error(path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const until=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'not settled')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=members]'));q('[data-officer-tab=members]').click();
 await until(()=>q('[data-native-member]'));q('[data-native-member]').click();
 await until(()=>q('#native-person [role=alert]'));
 assert.match(q('#native-person [role=alert]').textContent,/Service temporarily unavailable/);
 assert.ok(q('[data-native-member="member-1"]'));
});

test('R5 can choose eligible officers and create a member; codes appear once, without persistence',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const win=dom.window,prevWindow=globalThis.window,prevFetch=globalThis.fetch;
 globalThis.window=win;win.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=prevWindow;globalThis.fetch=prevFetch;dom.window.close()});
 const member={id:'r4-new',name:'Synthetic Deputy',rank:'R4',lifecycle:'active',blacklisted:0};
 const posts=[],resultCode='RZSN-ABCD-EFGH-JKLM-NPQR-STUV';
 globalThis.fetch=async(url,opt={})=>{
  const path=new URL(url).pathname;posts.push([path,opt.method||'GET',opt.body]);
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Chief',role:'R5'});
  if(path==='/api/overview')return Response.json({active:10,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-14',calendar:[],history:[],counts:{}});
  if(path==='/api/officer-access')return Response.json({accounts:[{id:'chief-id',ingame_name:'Chief',role:'R5',enabled:1,member_id:null}]});
  if(path==='/api/member-registry'){
   return Response.json({members:[member],counts:{active:1,former:0,blacklisted:0}});
  }
  if(path==='/api/officer-access/issue')return Response.json({ok:true,role:'R4',ingame_name:member.name,code:resultCode});
  if(path==='/api/member-registry/create')return Response.json({ok:true,member_id:'new-player'});
  throw Error('Unexpected '+path);
 };
 const mount=win.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const until=async fn=>{for(let i=0;i<120;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'UI did not settle')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';q('form').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=access]'));
 q('[data-officer-tab=access]').click();await until(()=>q('[data-native-access-mode=issue]'));
 q('[data-native-access-mode=issue]').click();
 assert.equal(q('#native-access-save [name=member_id]').options.length,2);
 q('#native-access-save [name=member_id]').value=member.id;
 q('#native-access-save [name=reason]').value='Approved deputy onboarding';
 q('#native-access-save').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('#native-credential-output'));
 assert.equal(q('#native-credential-output').value,resultCode);
 assert.ok(posts.some(([path,method])=>path==='/api/officer-access/issue'&&method==='POST'));
 q('[data-officer-tab=registry]').click();await until(()=>q('[data-native-member-create]'));
 assert.equal(q('#native-credential-output'),null,'One-time code hidden after leaving access tab');
 q('[data-native-member-create]').click();
 q('#native-member-create-save [name=name]').value='Manual Player';
 q('#native-member-create-save [name=rank]').value='R2';
 q('#native-member-create-save [name=reason]').value='Approved manual addition';
 q('#native-member-create-save').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>posts.some(([path,method])=>path==='/api/member-registry/create'&&method==='POST'));
 const payload=JSON.parse(posts.find(([path,method])=>path==='/api/member-registry/create'&&method==='POST')[2]);
 assert.deepEqual({name:payload.name,rank:payload.rank},{name:'Manual Player',rank:'R2'});
});

test('R4 can rotate own code but not issue or reset other accounts',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const win=dom.window,prevWindow=globalThis.window,prevFetch=globalThis.fetch;
 globalThis.window=win;win.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=prevWindow;globalThis.fetch=prevFetch;dom.window.close()});
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Deputy',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-14',history:[],calendar:[],counts:{}});
  if(path==='/api/officer-access')return Response.json({accounts:[{id:'deputy',role:'R4',ingame_name:'Deputy',enabled:1}]});
  if(path==='/api/member-registry')return Response.json({members:[],counts:{active:0,former:0,blacklisted:0}});
  throw Error(path);
 };
 const mount=win.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const until=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,5))}assert.ok(fn(),'UI did not settle')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';q('form').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=access]'));
 q('[data-officer-tab=access]').click();await until(()=>q('[data-native-access-mode=self]'));
 assert.equal(q('[data-native-access-mode=issue]'),null);
 assert.equal(q('[data-native-access-mode=reset]'),null);
 q('[data-native-access-mode=self]').click();
 assert.ok(q('#native-access-save [name=current_code]'));
 q('[data-officer-tab=registry]').click();await until(()=>q('[data-native-member-create]'));
 q('[data-native-member-create]').click();
 const options=[...q('#native-member-create-save [name=rank]').options].map(x=>x.value);
 assert.deepEqual(options,['R1','R2','R3']);
});
