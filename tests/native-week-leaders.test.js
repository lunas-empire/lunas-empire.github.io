import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const metric=total=>({total,median:total/2,verified:1,coverage:100});
const trends={active:1,weeks:[
 {week:'2026-W45',captured_at:'2026-11-08',is_complete:true,metrics:{power:metric(200),kills:metric(0),donations_weekly:metric(100)}},
 {week:'2026-W46',captured_at:'2026-11-15',is_complete:true,metrics:{power:metric(400),kills:metric(0),donations_weekly:metric(200)}}
]};
const player={id:'a',name:'Alpha',rank:'R3',days:Array.from({length:6},(_,weekday)=>({weekday,verified:true,points:100,passed:true}))};

test('Trend weeks open detailed leaders with daily evidence and metric switch',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin',pretendToBeVisual:true});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-11-19',calendar:[],counts:{}});
  if(path==='/api/officer-alerts')return Response.json({});
  if(path==='/api/alliance-trends')return Response.json(trends);
  if(path==='/api/vs-intelligence')return Response.json({weeks:trends.weeks.map(week=>({week:week.week,state:'final',dayTotals:[{passed:1,failed:0,unknown:0}],members:[player]}))});
  if(path==='/api/donations-intelligence')return Response.json({weeks:trends.weeks.map(week=>({week:week.week,is_complete:false,members:[{id:'a',name:'Alpha',rank:'R3',points:20000,status:'met',delta:1000}]}))});
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const until=async predicate=>{for(let i=0;i<160;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(predicate(),'render timeout: '+mount.textContent)};
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('.native-primary-tab[data-officer-tab="vs"]'));q('.native-primary-tab[data-officer-tab="vs"]').click();await until(()=>q('[data-officer-tab="allianceTrends"]'));
 q('[data-officer-tab="allianceTrends"]').click();await until(()=>q('.native-week-leaders'));
 assert.equal(q('[data-alliance-trend-week="2026-W46"]').getAttribute('aria-pressed'),'true');assert.equal(q('.native-week-leader-days').children.length,6);
 q('[data-alliance-trend-week="2026-W45"]').click();assert.equal(q('[data-alliance-trend-week="2026-W45"]').getAttribute('aria-pressed'),'true');
 q('[data-week-leader-metric="donations"]').click();assert.match(q('.native-week-leader-delta').textContent,/\+1\.000/);assert.equal(q('[data-week-leader-metric="donations"]').getAttribute('aria-pressed'),'true');
 q('.native-week-leader summary').click();assert.equal(q('.native-week-leader').open,true);assert.ok(q('.native-week-leader [data-native-member="a"]'));
});
