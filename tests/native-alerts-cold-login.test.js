import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
test('Fresh officer login shows proven VS and donation notices without visits or automatic sends',async t=>{
 const dom=new JSDOM('<html lang="en"><body><main id="app"></main></body></html>',{url:'https://lunas-empire.github.io/#admin'});
 const prev={window:globalThis.window,fetch:globalThis.fetch};globalThis.window=dom.window;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const paths=[];
 globalThis.fetch=async(url,opts={})=>{
  const path=new URL(url).pathname;paths.push(path);
  const responses={
   '/api/native-login':{role:'R5',name:'Synthetic Officer',token:'synthetic-memory-only'},
   '/api/overview':{active:92,reviews:0},
   '/api/operations':{tasks:[],events:[],absences:[]},
   '/api/train-manager':{today:'2026-10-14',calendar:[],counts:{},history:[]},
   '/api/officer-alerts':{
    vs:{state:'final',week:'2026-W41',confirmed_repeated_low:3},
    donations:{week:'2026-W41',is_complete:true,confirmed_below:2}
   }
  };
  assert.ok(Object.hasOwn(responses,path),'Unexpected endpoint '+path);
  return Response.json(responses[path]);
 };
 t.after(()=>{clearOfficer();globalThis.window=prev.window;globalThis.fetch=prev.fetch;dom.window.close()});
 const mount=dom.window.document.getElementById('app');
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 mount.querySelector('[name=code]').value='synthetic';
 mount.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 for(let i=0;i<80&&!mount.querySelector('[data-native-action=donations-open]');i++)
  await new Promise(resolve=>setTimeout(resolve,10));
 assert.ok(mount.querySelector('[data-native-action=vs-open]'));
 assert.ok(mount.querySelector('[data-native-action=donations-open]'));
 assert.ok(!paths.includes('/api/vs-intelligence'),'No heavy VS fetch on dashboard');
 assert.ok(!paths.includes('/api/donations-intelligence'),'No heavy donations fetch on dashboard');
 assert.equal(paths.filter(p=>p==='/api/officer-alerts').length,1);
});
