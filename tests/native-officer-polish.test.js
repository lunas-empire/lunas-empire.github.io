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
