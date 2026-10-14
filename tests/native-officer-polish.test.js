import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {formatOfficerTime,auditChanges,initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

test('Audit timeline parses SQLite UTC and ISO UTC without double-zone errors',()=>{
 assert.equal(formatOfficerTime('2026-10-13 13:30:00'),formatOfficerTime('2026-10-13T13:30:00Z'));
 assert.match(formatOfficerTime('2026-10-13T13:30:00Z'),/15:30/);
 assert.equal(formatOfficerTime('invalid timestamp'),'Zeit unbekannt');
 assert.equal(formatOfficerTime(null),'Zeit unbekannt');
});

test('Audit diff highlights changed fields without exposing unrecognized secret keys',()=>{
 const changes=auditChanges({
  before_json:JSON.stringify({rank_override:'R2',lifecycle:'active',session_mac:'before'}),
  after_json:JSON.stringify({rank_override:'R3',lifecycle:'active',session_mac:'do-not-show',reason:'Verified promotion'})
 });
 assert.deepEqual(changes,[{field:'Rang',before:'R2',after:'R3'},{field:'Begründung',before:'—',after:'Verified promotion'}]);
 assert.equal(auditChanges({before_json:'malformed',after_json:'malformed'}).length,0);
});

test('Train message can only be copied for a verified, planned alliance driver',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const prevWindow=globalThis.window,prevFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=prevWindow;globalThis.fetch=prevFetch;dom.window.close()});
 let copied='',copyCalls=0;
 Object.defineProperty(dom.window.navigator,'clipboard',{value:{writeText:async value=>{copied=value;copyCalls++}},configurable:true});
 const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
 const train={today:'2026-10-13',members:[{id,name:'Synthetic Verified Driver',rank:'R4'}],
  history:[],counts:{completed:0,planned:1,missing_recent:0},
  calendar:[
   {date:'2026-10-13',type:'R4',entry:{driver:'Synthetic Verified Driver',member_id:id,status:'planned',linked:true}},
   {date:'2026-10-14',type:'Members Day',entry:{driver:'Mystery',member_id:null,status:'planned',linked:false}}
  ]};
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],members:[]});
  if(path==='/api/train-manager')return Response.json(train);
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const until=async check=>{for(let i=0;i<100;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(check(),'DOM wait failed')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=train]'));
 q('[data-officer-tab=train]').click();
 await until(()=>q('[data-native-copy-train]'));
 assert.equal(mount.querySelectorAll('[data-native-copy-train]').length,1);
 q('[data-native-copy-train]').click();
 await until(()=>copyCalls===1);
 assert.match(copied,/2026-10-13/);
 assert.match(copied,/Synthetic Verified Driver/);
 assert.match(copied,/3 tickets/);
 assert.doesNotMatch(copied,/Mystery/);
});

test('Train suggestion explanations keep absent metrics unknown, but observed zero visible',async t=>{
 const {trainSuggestionFacts}=await import('../assets/native-admin.js');
 const unknown=trainSuggestionFacts({rides:0,last_ride:null,donations_weekly:null,vs_weekly:null},'Donation King');
 assert.match(unknown.join(' | '),/Keine bestätigte Fahrt zugeordnet/);
 assert.match(unknown.join(' | '),/Wochenspenden: nicht belegt/);
 assert.doesNotMatch(unknown.join(' | '),/Wochenspenden: 0/);
 // Earlier Cloudflare builds reported missing values as zero, with no evidence flag.
 assert.match(trainSuggestionFacts({rides:0,vs_weekly:0},'VS Hero').join(' | '),/VS-Wochenpunkte: nicht belegt/);
 const observed=trainSuggestionFacts({rides:2,last_ride:'2026-10-01',vs_weekly:0,vs_weekly_known:true},'VS Hero');
 assert.match(observed.join(' | '),/2 bestätigte Fahrten/);
 assert.match(observed.join(' | '),/VS-Wochenpunkte: 0/);
 assert.match(observed.join(' | '),/2026-10-01/);
});

test('Mobile-friendly train shortlist opens a prefilled form without automatically assigning',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const prevWindow=globalThis.window,prevFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=prevWindow;globalThis.fetch=prevFetch;dom.window.close()});
 const id='cccccccc-cccc-4ccc-cccc-cccccccccccc';
 const driver={id,name:'Synthetic R2 Member',rank:'R2',status:'active',rides:0,last_ride:null,vs_weekly:null,donations_weekly:null};
 const train={today:'2026-10-18',history:[],absences:[],counts:{completed:0,planned:0,missing_recent:0},
  members:[driver],calendar:[{date:'2026-10-18',type:'VS Hero',entry:null,suggestions:[driver]}]};
 const calls=[];
 globalThis.fetch=async (url,options={})=>{
  const path=new URL(url).pathname;calls.push([path,options.method||'GET']);
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],members:[]});
  if(path==='/api/train-manager')return Response.json(train);
  if(path==='/api/train-dice'||path==='/api/members')return Response.json([]);
  if(path==='/api/train-rotation')return Response.json({revision:1,types:['R5','R4','Members Day','Donation King','R4','Members Day','VS Hero'],coordinators:Array(7).fill(null),auto_suggest:true});
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=s=>mount.querySelector(s);
 const until=async condition=>{for(let i=0;i<120;i++){if(condition())return;await new Promise(r=>setTimeout(r,5))}assert.ok(condition(),'Expected DOM element did not appear')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=train]'));
 q('[data-officer-tab=train]').click();await until(()=>q('.native-train-shortlist'));
 assert.match(q('.native-train-shortlist').textContent,/VS-Wochenpunkte: nicht belegt/);
 assert.equal(q('#native-train-save'),null);
 q('[data-native-train-choice]').click();await until(()=>q('#native-train-save'));
 assert.equal(q('#native-train-save [name=member_id]').value,id);
 assert.ok(!calls.some(([path,method])=>path==='/api/train-assignments'&&method==='POST'));
});
