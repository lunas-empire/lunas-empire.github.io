import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {summarizeAllianceEventRuns,initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
test('Alliance event history preserves unknown levels, outcomes, waves and genuine changes',()=>{
 const runs=[
  {id:'a',event_type:'zombie_siege',event_date:'2026-10-11',level:7,waves:18,outcome:'completed'},
  {id:'b',event_type:'zombie_siege',event_date:'2026-10-05',level:6,waves:null,outcome:'failed'},
  {id:'c',event_type:'zombie_siege',event_date:'2026-10-20',level:99,waves:20,outcome:'scheduled'},
  {id:'d',event_type:'marshall_guard',event_date:'2026-10-12',level:null,outcome:'completed'},
  {id:'e',event_type:'zombie_siege',event_date:'invalid',level:8,outcome:'completed'}
 ];
 const siege=summarizeAllianceEventRuns(runs,'zombie_siege');
 assert.equal(siege.entries.length,3);
 assert.equal(siege.latest.level,7);
 assert.equal(siege.deltaLevel,1);
 assert.equal(siege.bestLevel,7,'planned 99 is not an achieved level');
 const trials=summarizeAllianceEventRuns([
  {event_type:'marshall_guard',event_date:'2026-10-12',level:10,outcome:'failed'},
  {event_type:'marshall_guard',event_date:'2026-10-10',level:8,outcome:'completed'},
  {event_type:'marshall_guard',event_date:'2026-10-08',level:9,outcome:'completed'}
 ],'marshall_guard');
 assert.equal(trials.level,10,'latest attempted level remains visible');
 assert.equal(trials.bestLevel,9,'higher failed level is not the best completed level');
 assert.equal(siege.waves,18);
 assert.equal(siege.planned.length,1);
 const guard=summarizeAllianceEventRuns(runs,'marshall_guard');
 assert.equal(guard.level,null);
 assert.equal(guard.waves,null);
 assert.equal(guard.deltaLevel,null);
 assert.equal(summarizeAllianceEventRuns([{event_type:'zombie_siege',event_date:'2026-10-11',level:0,waves:null,outcome:'failed'}],'zombie_siege').waves,null);
});

test('Officer can log Zombie Siege and Marshal Guard recurring runs, preserve Desert Storm and edit history',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const origWindow=globalThis.window,origFetch=globalThis.fetch,origForm=globalThis.FormData;
 globalThis.window=dom.window;globalThis.FormData=dom.window.FormData;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=origWindow;globalThis.fetch=origFetch;globalThis.FormData=origForm;dom.window.close()});
 let posts=[];
 const existing=[
  {id:'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',event_type:'zombie_siege',event_date:'2026-10-11',level:7,waves:19,lead_id:id,attendance:54,outcome:'completed',notes:'historical synthetic'},
  {id:'cccccccc-cccc-4ccc-cccc-cccccccccccc',event_type:'zombie_siege',event_date:'2026-10-08',level:6,waves:18,lead_id:id,attendance:51,outcome:'completed'},
  {id:'dddddddd-dddd-4ddd-dddd-dddddddddddd',event_type:'marshall_guard',event_date:'2026-10-12',level:5,waves:null,attendance:43,outcome:'completed'},
  {id:'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee',event_type:'desert_storm',event_date:'2026-10-10',outcome:'completed'}
 ];
 const ops={events:existing,tasks:[],absences:[],members:[{id,name:'Synthetic Officer',rank:'R4'}]};
 globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:92,reviews:0});
  if(path==='/api/operations'&&(!options.method||options.method==='GET'))return Response.json(ops);
  if(path==='/api/train-manager')return Response.json({today:'2026-10-13',counts:{missing_recent:0},calendar:[]});
  if(path==='/api/operations/events'&&options.method==='POST'){
   const payload=JSON.parse(options.body);posts.push(payload);
   return Response.json({ok:true,id:payload.id||'12345678-1234-1234-1234-123456789abc'});
  }
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=sel=>mount.querySelector(sel);
 const until=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,6))}assert.ok(fn(),'render timeout')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=events]'));
 q('[data-officer-tab=events]').click();
 await until(()=>q('.native-event-panels'));
 assert.equal(mount.querySelectorAll('.native-event-panel').length,2);
 assert.match(q('.native-event-panels').textContent,/Level unverändert|\+1 Level/);
 assert.match(q('#native-records').textContent,/Desert Storm \(1\)/);
 assert.match(q('#native-records').textContent,/54|51|19|18/);
 q('[data-native-event-quick=zombie_siege]').click();
 let form=q('#native-record-save');
 assert.equal(form.elements.namedItem('event_type').value,'zombie_siege');
 assert.equal(form.elements.namedItem('waves').disabled,false);
 assert.match(form.elements.namedItem('event_date').value,/^20\d{2}-\d{2}-\d{2}$/);
 form.elements.namedItem('level').value='8';
 form.elements.namedItem('waves').value='20';
 form.elements.namedItem('outcome').value='completed';
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>posts.length===1);
 assert.equal(posts[0].event_type,'zombie_siege');
 assert.equal(posts[0].waves,20);
 assert.equal(posts[0].level,8);
 await until(()=>!q('#native-record-save'));
 q('[data-native-event-quick=marshall_guard]').click();
 form=q('#native-record-save');
 assert.equal(form.elements.namedItem('event_type').value,'marshall_guard');
 assert.equal(form.elements.namedItem('waves').disabled,true);
 assert.equal(form.querySelector('[data-event-waves]').hidden,true);
 form.elements.namedItem('level').value='6';
 form.elements.namedItem('outcome').value='completed';
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>posts.length===2);
 assert.equal(posts[1].event_type,'marshall_guard');
 assert.equal(Object.hasOwn(posts[1],'waves'),false,'Marshall should not submit nonexistent wave count');
 await until(()=>!q('#native-record-save'));
 q('[data-native-edit=bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb]').click();
 form=q('#native-record-save');
 assert.equal(form.dataset.id,'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb');
 assert.equal(form.elements.namedItem('waves').value,'19');
 assert.equal(form.elements.namedItem('attendance').value,'54');
});
