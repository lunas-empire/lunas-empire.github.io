import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const members=[{id:'a',name:'Alpha',rank:'R3',status:'active',power:100,kills:0},{id:'b',name:'Bravo',rank:'R2',status:'active',power:300,kills:200}];

test('Members compare real groups through existing APIs without overlap or extra member reads',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin',pretendToBeVisual:true});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch,calls=[];
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;calls.push(path);
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:2,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members});
  if(path==='/api/train-manager')return Response.json({today:'2026-11-19',calendar:[],history:[],counts:{}});
  if(path==='/api/officer-alerts')return Response.json({});
  if(path==='/api/members')return Response.json(members);
  if(path==='/api/vs-intelligence')return Response.json({weeks:[{week:'W1',state:'final',threshold:100,members:members.map(person=>({...person,days:[{verified:true,points:100}]}))}]});
  if(path==='/api/donations-intelligence')return Response.json({weeks:[{week:'W1',members:[{id:'a',points:0,status:'below'},{id:'b',points:20000,status:'met'}]}]});
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const until=async predicate=>{for(let i=0;i<160;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(predicate(),'render timeout: '+mount.textContent)};
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('.native-primary-tab[data-officer-tab="members"]'));q('.native-primary-tab[data-officer-tab="members"]').click();await until(()=>q('[data-native-cohort-open]'));
 q('[data-native-cohort-open]').click();await until(()=>q('.native-cohort-compare'));q('.native-cohort-picker summary').click();
 q('[data-cohort-pick="A:a"]').click();q('[data-cohort-pick="B:b"]').click();
 assert.equal(q('[data-cohort-pick="A:a"]').getAttribute('aria-pressed'),'true');assert.equal(q('[data-cohort-pick="B:b"]').getAttribute('aria-pressed'),'true');
 q('[data-cohort-pick="B:a"]').click();assert.equal(q('[data-cohort-pick="A:a"]').getAttribute('aria-pressed'),'false');assert.equal(q('[data-cohort-pick="B:a"]').getAttribute('aria-pressed'),'true');
 assert.equal(calls.filter(path=>path==='/api/vs-intelligence').length,1);assert.equal(calls.filter(path=>path==='/api/donations-intelligence').length,1);assert.equal(calls.filter(path=>path==='/api/members').length,1);
});
