import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const metric=total=>({total,median:total/2,verified:1,coverage:100,p25:0,p75:total,min:0,max:total});
const readiness={active:1,batches:[{id:'new',report_date:'2026-11-15',verified:1,coverage:100,metrics:{power:metric(400),army_power:metric(0)},profession:{verified:1,values:[{value:'Engineer',count:1}]}}]};

test('Readiness opens through member navigation and changes metric without another API read',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin',pretendToBeVisual:true});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;let readinessCalls=0;
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-11-19',calendar:[],counts:{}});
  if(path==='/api/officer-alerts')return Response.json({});
  if(path==='/api/readiness'){readinessCalls++;return Response.json(readiness)}
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const until=async predicate=>{for(let i=0;i<160;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(predicate(),'render timeout: '+mount.textContent)};
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('.native-primary-tab[data-officer-tab="members"]'));q('.native-primary-tab[data-officer-tab="members"]').click();await until(()=>q('[data-officer-tab="readiness"]'));
 q('[data-officer-tab="readiness"]').click();await until(()=>q('.native-readiness'));assert.equal(readinessCalls,1);assert.match(q('.native-readiness').textContent,/400/);
 q('#native-readiness-metric').value='army_power';q('#native-readiness-metric').dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.equal(readinessCalls,1);assert.match(q('.native-readiness-kpis').textContent,/0/);
});
