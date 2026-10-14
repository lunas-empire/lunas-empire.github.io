import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';
test('English officer cockpit translates all urgent action labels and count messages',async t=>{
 const dom=new JSDOM('<html lang="en"><body><main id="app"></main></body></html>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;
 dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 const today='2026-10-14';
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  const body=path==='/api/native-login'?{token:'synthetic',name:'Officer',role:'R5'}:
   path==='/api/overview'?{active:92,reviews:3}:
   path==='/api/operations'?{
    tasks:[{id:'a',title:'Synthetic overdue task',status:'open',due_date:today,priority:'high'}],
    absences:[{id:'b',member_id:'c',start_date:today,end_date:today,substitute_id:null}],
    events:[{id:'d',event_date:'2026-10-15',event_type:'zombie_siege',outcome:'scheduled',lead_id:null}]
   }:
   path==='/api/train-manager'?{today,history:[],calendar:[{date:today,type:'R4',entry:null}],counts:{}}:
   null;
  if(body===null)throw Error('Unexpected endpoint '+path);
  return Response.json(body);
 };
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 const mount=dom.window.document.querySelector('#app');
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 mount.querySelector('[name=code]').value='synthetic';
 mount.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 for(let i=0;i<90&&!mount.querySelector('.native-dashboard');i++)await new Promise(r=>setTimeout(r,10));
 assert.ok(mount.querySelector('.native-dashboard'),'dashboard should render');
 await new Promise(r=>setTimeout(r,120));
 const captions=[...mount.querySelectorAll('.native-mission')].map(n=>n.textContent.trim());
 assert.equal(captions.length,5);
 const mixed=/(?:[äöüß]|\b(?:Prüffälle|Prüfaufträge|unbestätigt|Fällige|Aufgaben|Abwesenheiten|Vertretung|Leitung|prüfen|fehlend|ohne|Fahrer|noch|nicht|offene|Tageszug)\b)/iu;
 assert.ok(captions.every(s=>!mixed.test(s)),'German cockpit fragments: '+JSON.stringify(captions));
 assert.equal(mount.querySelectorAll('.native-error').length,0);
});
