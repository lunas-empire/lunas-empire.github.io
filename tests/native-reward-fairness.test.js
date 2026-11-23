import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const members=[{id:'a',name:'Alpha',rank:'R3',status:'active',power:0,kills:0},{id:'b',name:'Bravo',rank:'R2',status:'active',power:0,kills:0}];

test('Train view separates VIP and dice fairness and sorts locally',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin',pretendToBeVisual:true});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;let trainCalls=0,diceCalls=0;
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:2,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members});
  if(path==='/api/officer-alerts')return Response.json({});
  if(path==='/api/members')return Response.json(members);
  if(path==='/api/train-manager'){trainCalls++;return Response.json({today:'2026-11-19',calendar:[],history:[],counts:{},members,vip_passengers:[{ride_date:'2026-11-11',vip_member_id:'a'}],absences:[]})}
  if(path==='/api/train-dice'){diceCalls++;return Response.json([{ride_date:'2026-11-11',winner_id:'a',winner_name:'Alpha'}])}
  if(path==='/api/train-rotation')return Response.json(null);
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const until=async predicate=>{for(let i=0;i<160;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(predicate(),'render timeout: '+mount.textContent)};
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('.native-primary-tab[data-officer-tab="train"]'));q('.native-primary-tab[data-officer-tab="train"]').click();await until(()=>q('.native-reward-fairness'));
 assert.match(q('.native-reward-note').textContent,/keine belastbare Fairnesswertung/);q('.native-reward-members summary').click();assert.equal(q('.native-reward-members').open,true);
 q('#native-reward-sort').value='dice';q('#native-reward-sort').dispatchEvent(new dom.window.Event('change',{bubbles:true}));assert.equal(q('.native-reward-members').open,true);
 assert.equal(trainCalls,2,'overview and train only');assert.equal(diceCalls,1);
});
