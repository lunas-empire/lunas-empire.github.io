import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

test('iPhone More navigation offers direct grouped shortcuts and closes on tap',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const previousWindow=globalThis.window,previousFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=previousWindow;globalThis.fetch=previousFetch;dom.window.close()});
 const id='aaaa-aaaa';
 const weekly={minimum:20000,weeks:[{week:'2026-W41',captured_at:'2026-10-11T00:19:36+02:00',
  is_complete:true,active:3,verified:2,met:1,below:1,unknown:1,
  members:[
   {id,name:'Alpha',rank:'R4',status:'met',points:22000,difference:2000,delta:null,previous_week:null},
   {id:'b',name:'Bravo',rank:'R3',status:'below',points:15000,difference:-5000,delta:null,previous_week:null},
   {id:'c',name:'Charlie',rank:'R2',status:'unknown',points:null,difference:null,delta:null,previous_week:null}
  ]}]};
 const calls=[];
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;calls.push(path);
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Luna',role:'R4',siteOwner:true});
  if(path==='/api/overview')return Response.json({active:3,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-14',history:[],calendar:[],counts:{}});
  if(path==='/api/donations-intelligence')return Response.json(weekly);
  if(path==='/api/vs-intelligence')return Response.json({weeks:[]});
  if(path==='/api/members')return Response.json([{id,name:'Alpha',rank:'R4',power:0,kills:0,donations_weekly:22000}]);
  if(path==='/api/member/'+id)return Response.json({member:{id,name:'Alpha',rank:'R4',status:'active'},stats:[
   {metric:'donations_weekly',value:22000,quality:'observed',captured_at:'2026-10-11T00:19:36+02:00'}
  ],weeks:[],days:[],rides:[],dice_wins:[],achievements:[]});
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=x=>mount.querySelector(x);
 const until=async check=>{for(let n=0;n<130;n++){if(check())return;await new Promise(r=>setTimeout(r,5))}assert.ok(check(),'UI timeout')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';
 q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('.native-admin-more'));
 const more=q('.native-admin-more');
 assert.equal(more.open,false);
 assert.equal(q('.native-more-group').querySelectorAll('button').length,3);
 assert.equal(mount.querySelectorAll('.native-more-group').length,3);
 const shortcuts=[...mount.querySelectorAll('.native-more-group [data-officer-tab]')].map(x=>x.dataset.officerTab);
 assert.equal(new Set(shortcuts).size,9);
 assert.ok(shortcuts.includes('registry')&&shortcuts.includes('access'));
 more.open=true;
 q('[data-native-more-close]').click();
 assert.equal(more.open,false);
 q('[data-officer-tab=vs]').click();
 await until(()=>q('[data-officer-tab=donations]'));
 q('[data-officer-tab=donations]').click();
 await until(()=>q('.native-donation-tiles'));
 assert.ok(calls.includes('/api/donations-intelligence'));
 assert.match(q('.native-donation-summary').textContent,/20.000/);
 assert.equal(q('.native-donation-tiles').querySelectorAll('article').length,4);
 assert.match(q('.native-donation-summary').textContent,/Bisher liegt nur eine verlässliche Wochenaufnahme vor/);
 const folds=q('.native-donation-groups').querySelectorAll('details');
 assert.equal(folds.length,3);
 assert.match(folds[0].textContent,/Bravo/);
 assert.match(folds[1].textContent,/Charlie/);
 assert.doesNotMatch(folds[1].textContent,/0 zum Wochenminimum/);
 assert.match(folds[2].textContent,/Alpha/);
 q('#native-donation-search').value='Bravo';
 q('#native-donation-search').dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 assert.match(q('.native-donation-groups').textContent,/Bravo/);
 assert.doesNotMatch(q('.native-donation-groups').textContent,/Alpha/);
 q('#native-donation-search').value='';
 q('#native-donation-search').dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 const btn=q('.native-donation-met [data-native-member]');
 btn.click();
 await until(()=>q('.native-profile h3'));
 assert.equal(q('.native-profile h3').textContent,'Alpha');
 assert.match(q('.native-profile-metrics').textContent,/22.000/);
});
