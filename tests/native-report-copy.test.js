import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const until=async fn=>{for(let i=0;i<170;i++){if(fn())return;await new Promise(r=>setTimeout(r,8))}assert.ok(fn(),'UI did not settle')};

test('unapproved chat and mail report drafts are not exposed in any officer analysis surface',async t=>{
 const dom=new JSDOM('<html lang="en"><body><main id="app"></main></body></html>',{url:'https://lunas-empire.github.io/#admin'});
 const old={window:globalThis.window,fetch:globalThis.fetch};
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const copied=[];
 Object.defineProperty(dom.window.navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied.push(value)}}});
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  const data=path==='/api/native-login'?{token:'synthetic',name:'Officer',role:'R5'}:
   path==='/api/overview'?{reviews:0,active:92}:
   path==='/api/operations'?{tasks:[],events:[],absences:[]}:
   path==='/api/train-manager'?{today:'2026-10-14',calendar:[],history:[],counts:{}}:
   path==='/api/vs-intelligence'?{weeks:[{week:'2026-W41',threshold:3600000,dayTotals:[],rankings:[],records:[],players:[],members:[],rows:[],groups:[],priority:0,unknownDays:0,failedDays:0,perfect:0}]}:
   path==='/api/donations-intelligence'?{weeks:[{week:'2026-W41',captured_at:'2026-10-11T00:19:00Z',is_complete:true,met:0,below:0,unknown:0,verified:0,active:0,rows:[],players:[],members:[]}]}:null;
  if(data===null)throw Error('Unexpected endpoint '+path);
  return Response.json(data);
 };
 t.after(()=>{clearOfficer();globalThis.window=old.window;globalThis.fetch=old.fetch;dom.window.close()});
 const mount=dom.window.document.querySelector('#app'),q=sel=>mount.querySelector(sel);
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';
 q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('.native-dashboard'));
 const noReports=()=>{
  assert.equal(q('.native-report-panel'),null,'No report draft panel');
  assert.equal(q('[data-native-copy-report]'),null,'No report copy actions');
  assert.equal(q('[data-native-jump-report]'),null,'No report jumps');
  assert.equal(q('.native-command-daily-report'),null,'No officer daily report');
  assert.equal(q('.native-chat-report-panel'),null,'No chat draft');
 };
 noReports();
 q('[data-officer-tab=vs]').click();
 await until(()=>q('.native-vs-brief')||q('.native-error'));
 assert.equal(q('.native-error'),null,'VS screen remains available');
 noReports();
 q('[data-officer-tab=donations]')?.click();
 if(q('[data-officer-tab=donations]')){
  await until(()=>q('.native-donation-summary')||q('.native-error'));
  assert.equal(q('.native-error'),null,'Donations screen remains available');
  noReports();
 }
 assert.deepEqual(copied,[],'No messages are sent or copied');
});
