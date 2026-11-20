import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const metric=total=>({total,median:total/2,verified:2,coverage:100});
const trends={active:2,weeks:[
 {week:'2026-W45',captured_at:'2026-11-08',is_complete:true,metrics:{power:metric(200),kills:metric(0),donations_weekly:metric(100)}},
 {week:'2026-W46',captured_at:'2026-11-15',is_complete:false,metrics:{power:metric(400),kills:metric(0),donations_weekly:metric(200)}}
]};

test('Alliance development loads once through the real tab and changes range without another API read',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin',pretendToBeVisual:true});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch,calls=[];
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname;if(options.method==='POST'||path==='/api/alliance-trends'||path==='/api/vs-intelligence')calls.push(path);
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:2,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-11-19',calendar:[],counts:{}});
  if(path==='/api/officer-alerts')return Response.json({});
  if(path==='/api/alliance-trends')return Response.json(trends);
  if(path==='/api/vs-intelligence')return Response.json({weeks:trends.weeks.map(week=>({week:week.week,state:'final',dayTotals:[{passed:1,failed:1,unknown:0}],members:[]}))});
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const until=async predicate=>{for(let i=0;i<160;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(predicate(),'render timeout: '+mount.textContent)};
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab="vs"]'));q('.native-primary-tab[data-officer-tab="vs"]').click();await until(()=>q('[data-officer-tab="allianceTrends"]'));
 q('[data-officer-tab="allianceTrends"]').click();await until(()=>q('.native-alliance-trends'));
 assert.equal(q('.native-trend-weeks').children.length,2);assert.equal(calls.filter(path=>path==='/api/alliance-trends').length,1);
 q('#native-alliance-trend-range').value='2';q('#native-alliance-trend-range').dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.equal(calls.filter(path=>path==='/api/alliance-trends').length,1);assert.equal(q('.native-trend-weeks').children.length,2);
});
