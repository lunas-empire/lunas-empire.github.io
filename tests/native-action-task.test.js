import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const person=(id,name,points)=>({id,name,rank:'R3',days:points.map((value,weekday)=>({weekday,verified:Number.isSafeInteger(value),points:Number.isSafeInteger(value)?value:null,quality:Number.isSafeInteger(value)?'observed':'inferred'}))});
const lowWeek=(label,id='repeat',name='Repeat')=>({week:label,state:'final',members:[person(id,name,[0,2000000,3000000,8000000,9000000,0])]});
const weeks=[lowWeek('2026-W46'),lowWeek('2026-W45'),lowWeek('2026-W44')];

test('Action center opens a prefilled officer task through the real click and submit workflow',async t=>{
 const dom=new JSDOM('<!doctype html><html lang="de"><body><main id="mount"></main></body></html>',{url:'https://lunas-empire.github.io/#vs',pretendToBeVisual:true});
 const origWindow=globalThis.window,origFetch=globalThis.fetch,origForm=globalThis.FormData;
 t.after(()=>{clearOfficer();globalThis.window=origWindow;globalThis.fetch=origFetch;globalThis.FormData=origForm;dom.window.close()});
 globalThis.window=dom.window;globalThis.FormData=dom.window.FormData;
  dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const posts=[],errors=[];
 process.on('unhandledRejection',error=>errors.push(error));
 dom.window.addEventListener('error',event=>errors.push(event.error));
 globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-token',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:92,reviews:0});
  if(path==='/api/operations'&&(!options.method||options.method==='GET'))return Response.json({events:[],tasks:[],absences:[],members:[{id:'officer',name:'Officer',rank:'R4'}]});
  if(path==='/api/vs-intelligence')return Response.json({weeks,policy:{daily_minimum:3600000}});
  if(path==='/api/operations/tasks'&&options.method==='POST'){
   const body=JSON.parse(options.body);posts.push(body);
   return Response.json({ok:true,id:'12345678-1234-1234-1234-123456789abc'});
  }
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const until=async predicate=>{for(let i=0;i<160;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,6));}assert.ok(predicate(),'render timeout');};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab="vs"]'));
 q('[data-officer-tab="vs"]').click();
 await until(()=>q('.native-action-center [data-native-action-task="repeat"]'));
 q('.native-action-center [data-native-action-task="repeat"]').click();
 await new Promise(resolve=>setTimeout(resolve,500));
 const form=q('#native-record-save');
 assert.ok(form,'officer task form opened');
 assert.equal(form.elements.namedItem('title').value,'Coaching: Repeat');
 assert.match(form.elements.namedItem('description').value,/Problemwochen/);
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>posts.length===1);
 assert.equal(posts[0].title,'Coaching: Repeat');
 assert.match(posts[0].description,/Problemwochen/);
 await until(()=>!q('#native-record-save'));
});
