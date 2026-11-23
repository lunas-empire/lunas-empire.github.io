import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const runs=[{id:'done',event_type:'zombie_siege',event_date:'2026-11-19',outcome:'completed',level:7,attendance:0},{id:'open',event_type:'marshall_guard',event_date:'2026-11-20',outcome:'scheduled',level:8}];

test('Alliance events load insights and filter locally without another API read',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin',pretendToBeVisual:true});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;let insightCalls=0;
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:2,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:runs,absences:[],members:[],protocolEvents:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-11-19',calendar:[],history:[],counts:{}});
  if(path==='/api/officer-alerts')return Response.json({});
  if(path==='/api/event-insights'){insightCalls++;return Response.json({runs,series:[runs[0]],summary:{total:2,completed:1,scheduled:1}})}
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const until=async predicate=>{for(let i=0;i<160;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(predicate(),'render timeout: '+mount.textContent)};
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('.native-primary-tab[data-officer-tab="more"]'));q('.native-primary-tab[data-officer-tab="more"]').click();await until(()=>q('.native-hub-tile[data-officer-tab="events"]'));
 q('.native-hub-tile[data-officer-tab="events"]').click();await until(()=>q('.native-event-insights'));assert.equal(insightCalls,1);assert.equal(q('.native-event-insight-runs').children.length,2);
 q('#native-event-insight-type').value='zombie_siege';q('#native-event-insight-type').dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.equal(insightCalls,1);assert.equal(q('.native-event-insight-runs').children.length,1);assert.match(q('.native-event-insight-runs').textContent,/zombie_siege/);
});
