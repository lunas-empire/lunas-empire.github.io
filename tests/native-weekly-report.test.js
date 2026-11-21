import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const metric=total=>({total,median:total/2,verified:1,coverage:100});
const trends={weeks:[{week:'W2',captured_at:'2026-11-15',is_complete:true,metrics:{power:metric(400),kills:metric(0),donations_weekly:metric(20000)}}]};

test('Weekly report loads all areas once and copies the consolidated evidence text',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin',pretendToBeVisual:true});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch,calls=[],copied=[];
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 Object.defineProperty(dom.window.navigator,'clipboard',{configurable:true,value:{writeText:async value=>copied.push(value)}});
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;calls.push(path);
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:1,reviews:2});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members:[{id:'a',name:'Alpha',status:'active'}]});
  if(path==='/api/train-manager')return Response.json({today:'2026-11-19',calendar:[],history:[],counts:{completed:10,planned:2},vip_passengers:[]});
  if(path==='/api/officer-alerts')return Response.json({});
  if(path==='/api/alliance-trends')return Response.json(trends);
  if(path==='/api/vs-intelligence')return Response.json({weeks:[{week:'W2',state:'final',dayTotals:[{passed:1,failed:0,unknown:1}],members:[]}]});
  if(path==='/api/donations-intelligence')return Response.json({weeks:[{week:'W2',met:1,verified:1,below:0,unknown:1,members:[]}]});
  if(path==='/api/readiness')return Response.json({active:1,batches:[{report_date:'2026-11-15',metrics:{power:metric(400),total_troops:metric(50)},profession:{values:[]}}]});
  if(path==='/api/event-insights')return Response.json({runs:[{id:'e',event_type:'zombie_siege',event_date:'2026-11-19',outcome:'completed'}],series:[]});
  if(path==='/api/train-dice')return Response.json([]);
  if(path==='/api/members')return Response.json([{id:'a',name:'Alpha',status:'active',power:0,kills:0}]);
  if(path==='/api/duel-league')return Response.json({matches:[]});
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const until=async predicate=>{for(let i=0;i<160;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(predicate(),'render timeout: '+mount.textContent)};
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('.native-primary-tab[data-officer-tab="vs"]'));q('.native-primary-tab[data-officer-tab="vs"]').click();await until(()=>q('[data-officer-tab="weeklyReport"]'));
 q('[data-officer-tab="weeklyReport"]').click();await until(()=>q('#native-weekly-report-text'));const text=q('#native-weekly-report-text').textContent;
 assert.match(text,/Stärke: 400/);assert.match(text,/Keine bestätigten finalen Matches/);assert.match(text,/Offene OCR-Reviews: 2/);
 q('[data-native-weekly-report-copy]').click();await until(()=>copied.length===1);assert.equal(copied[0],text);assert.match(q('.native-weekly-report [role=status]').textContent,/kopiert/);
 q('[data-native-weekly-report-details]').click();await until(()=>q('.native-week-leaders'));
 for(const path of ['/api/alliance-trends','/api/readiness','/api/event-insights','/api/duel-league'])assert.equal(calls.filter(call=>call===path).length,1,path);
});
