import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildVsLongTermReport,renderVsLongTermReport} from '../assets/native-vs-overview.js';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

const patterns={Alpha:[0,0,0,0,4000000,0],Middle:[0,0,0,0,0,0],Zeta:[0,0,0,8000000,8000000,0]};
const ranks={Alpha:'R1',Middle:'R3',Zeta:'R5'};
const people=()=>Object.entries(patterns).map(([name,points])=>({id:name.toLowerCase(),name,rank:ranks[name],failed:points.filter(value=>value<3600000).length,unknown:0,activeDays:6,
 days:points.map((value,weekday)=>({weekday,verified:true,quality:'observed',points:value}))}));
const weeks=()=>['2026-W46','2026-W45','2026-W44'].map(week=>({week,state:'final',threshold:3600000,members:people()}));

test('Long-term groups support contextual metrics, names and current alliance rank',()=>{
 const data=weeks();
 assert.deepEqual(buildVsLongTermReport(data).repeated.map(item=>item.name),['Middle','Alpha','Zeta']);
 assert.deepEqual(buildVsLongTermReport(data,{sort:{repeated:'name'}}).repeated.map(item=>item.name),['Alpha','Middle','Zeta']);
 assert.deepEqual(buildVsLongTermReport(data,{sort:{repeated:'rank'}}).repeated.map(item=>item.name),['Zeta','Middle','Alpha']);
 const html=renderVsLongTermReport(data,{sort:{repeated:'rank',never:'close',improved:'points'}});
 const dom=new JSDOM(html),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('[data-native-vs-report-sort]').length,2,'empty improved group has no pointless sort control');
 assert.equal(doc.querySelector('[data-native-vs-report-sort="repeated"]').value,'rank');
 assert.equal(doc.querySelector('[data-native-vs-report-sort="never"]').value,'close');
 const names=[...doc.querySelectorAll('.native-vs-report-repeated .native-vs-report-person summary strong')].map(node=>node.textContent);
 assert.deepEqual(names,['Zeta','Middle','Alpha']);
 dom.window.close();
});

test('Never-perfect and progress groups sort by their own evidence metrics',()=>{
 const member=(id,points)=>({id,name:id,rank:'R2',days:points.map((value,weekday)=>({weekday,verified:true,points:value}))});
 const data=['2026-W46','2026-W45','2026-W44'].map(week=>({week,members:[
  member('Low',[4000000,4000000,0,0,0,9000000]),member('Near',[4000000,4000000,4000000,4000000,0,9000000])
 ]}));
 const never=buildVsLongTermReport(data);
 assert.deepEqual(never.neverPerfect.map(item=>item.id),['Low','Near']);
 assert.deepEqual(buildVsLongTermReport(data,{sort:{never:'close'}}).neverPerfect.map(item=>item.id),['Near','Low']);
 const progressData=[{week:'2026-W46',members:[member('Goal',[4000000,4000000,4000000,4000000,4000000,0]),member('Points',[8000000,4000000,4000000,4000000,4000000,0])]},
  {week:'2026-W45',members:[member('Goal',[0,0,6000000,6000000,6000000,0]),member('Points',[0,4000000,4000000,4000000,4000000,0])]}];
 assert.deepEqual(buildVsLongTermReport(progressData).improved.map(item=>item.id),['Goal','Points']);
 assert.deepEqual(buildVsLongTermReport(progressData,{sort:{improved:'points'}}).improved.map(item=>item.id),['Points','Goal']);
 const html=renderVsLongTermReport(progressData,{sort:{improved:'points'}});
 assert.match(html,/data-native-vs-report-sort="improved"[\s\S]*?<option value="points" selected>/);
});

test('Report sorting keeps its group open, restores focus and controls copied order',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 let copied='';Object.defineProperty(dom.window.navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied=value}}});
 let vsRequests=0;
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:3,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],absences:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-11-18',history:[],calendar:[],counts:{}});
  if(path==='/api/vs-intelligence'){vsRequests++;return Response.json({weeks:weeks()})}
  throw Error('Unexpected '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const until=async predicate=>{for(let n=0;n<120;n++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5))}assert.ok(predicate(),'render timeout')};
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';
 q('#native-officer-login').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=vs]'));q('[data-officer-tab=vs]').click();await until(()=>q('.native-vs-report-repeated'));
 q('.native-vs-report-repeated > summary').click();
 const select=q('[data-native-vs-report-sort="repeated"]');select.value='name';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 const names=()=>[...mount.querySelectorAll('.native-vs-report-repeated .native-vs-report-person summary strong')].map(node=>node.textContent);
 assert.deepEqual(names(),['Alpha','Middle','Zeta']);
 assert.equal(q('.native-vs-report-repeated').open,true,'sorted category stays open');
 assert.equal(dom.window.document.activeElement,q('[data-native-vs-report-sort="repeated"]'));
 const rank=q('[data-native-vs-report-sort="repeated"]');rank.value='rank';rank.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.deepEqual(names(),['Zeta','Middle','Alpha']);
 q('[data-native-vs-copy-report]').click();await until(()=>Boolean(copied));
 assert.ok(copied.indexOf('Zeta —')<copied.indexOf('Middle —')&&copied.indexOf('Middle —')<copied.indexOf('Alpha —'),'copy follows selected order');
 q('.native-vs-report-repeated .native-vs-report-person > summary').click();
 assert.equal(q('.native-vs-report-repeated .native-vs-report-person').open,true);
 assert.equal(q('.native-vs-report-repeated .native-vs-report-person').querySelectorAll('[data-native-vs-image]').length,6);
 assert.equal(vsRequests,1,'sorting uses already loaded authorized data');
});
