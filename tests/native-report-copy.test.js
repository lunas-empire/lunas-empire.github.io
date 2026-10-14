import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
test('Daily report is private until login, copy only on explicit click',async t=>{
 const dom=new JSDOM('<html lang="en"><body><main id="app"></main></body></html>',{url:'https://lunas-empire.github.io/#admin'});
 const prevWindow=globalThis.window,prevFetch=globalThis.fetch;
 globalThis.window=dom.window;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const copied=[];
 Object.defineProperty(dom.window.navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied.push(value)}}});
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  const value=path==='/api/native-login'?{token:'synthetic',name:'Officer',role:'R5'}:
   path==='/api/overview'?{reviews:0,active:92}:
   path==='/api/operations'?{tasks:[],events:[],absences:[]}:
   path==='/api/train-manager'?{today:'2026-10-14',calendar:[],history:[],counts:{}}:null;
  if(value===null)throw Error('Unexpected endpoint '+path);
  return Response.json(value);
 };
 t.after(()=>{clearOfficer();globalThis.window=prevWindow;globalThis.fetch=prevFetch;dom.window.close()});
 const mount=dom.window.document.querySelector('#app');
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 assert.equal(mount.querySelector('.native-report-panel'),null);
 mount.querySelector('[name=code]').value='synthetic';
 mount.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 for(let i=0;i<60&&!mount.querySelector('.native-report-panel');i++)await new Promise(resolve=>setTimeout(resolve,10));
 const container=mount.querySelector('.native-report-panel');
 assert.ok(container);
 assert.equal(copied.length,0,'No automatic messaging');
 const message=container.querySelector('textarea').value;
 assert.match(message,/RZSN officer brief/);
 const button=container.querySelector('[data-native-copy-report]');
 button.click();
 for(let i=0;i<30&&copied.length===0;i++)await new Promise(resolve=>setTimeout(resolve,10));
 assert.deepEqual(copied,[message]);
 await new Promise(resolve=>setTimeout(resolve,10));
 assert.match(container.querySelector('.native-report-copy-status').textContent,/Copied/);
 assert.ok(message.length<=500);
});
