import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {initNativeAdmin,renderNativeAdmin,clearOfficer} from '../assets/native-admin.js';

test('VS data starts compact with under-target and day breakdown collapsed, while controls stay accessible',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch,oldFormData=globalThis.FormData;
 globalThis.window=dom.window;globalThis.FormData=dom.window.FormData;
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;globalThis.FormData=oldFormData;dom.window.close()});
 const mkWeek=(name)=>({week:name,failedDays:2,unknownDays:1,perfect:4,priority:1,
  dayTotals:[{weekday:0,passed:89,failed:2,unknown:1}],
  members:[{name:'Synthetic Under Target',failed:2,unknown:0,days:[{verified:true,points:2500000}]},
   {name:'Synthetic Unclear',failed:0,unknown:1,days:[{verified:false,points:null}]},
   {name:'Synthetic Passed',failed:0,unknown:0,days:[{verified:true,points:4200000}]}]});
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;
  if(path==='/api/native-login')return Response.json({token:'synthetic-session',name:'Officer',role:'R5'});
  if(path==='/api/overview')return Response.json({active:90,reviews:1});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-13',history:[],calendar:[],counts:{missing_recent:0}});
  if(path==='/api/vs-intelligence')return Response.json({weeks:[mkWeek('2026-W41'),mkWeek('2026-W40')]});
  throw Error('Unexpected synthetic path '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const until=async predicate=>{for(let n=0;n<100;n++){if(predicate())return;await new Promise(r=>setTimeout(r,5))}assert.ok(predicate(),'render timeout')};
 initNativeAdmin(mount);
 await renderNativeAdmin(mount);
 q('[name=code]').value='synthetic';
 q('#native-officer-login').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('.native-dashboard'));
 assert.equal(q('.native-dashboard .native-shortcuts'),null,'duplicate quick actions should be absent');
 assert.equal(q('.native-dashboard-stat-fold').open,false,'supplemental cockpit metrics start collapsed');
 assert.equal(mount.querySelectorAll('.native-more-menu [data-officer-tab]').length,8,'all officer destinations including membership watch remain reachable');
 q('[data-officer-tab=vs]').click();
 await until(()=>q('.native-vs-group'));
 const groups=mount.querySelectorAll('.native-vs-group');
 assert.equal(groups.length,3);
 assert.ok(groups[0].textContent.includes('Unter Tagesziel'));
 assert.ok([...groups].every(group=>!group.open),'all VS player groups start collapsed');
 assert.equal(q('.native-vs-days').open,false,'daily comparisons start collapsed');
 assert.equal(mount.querySelectorAll('.native-vs-compact .native-cards article').length,3);
 groups[0].querySelector('summary').click();
 assert.equal(groups[0].open,true,'an officer can expand under-target members');
 assert.match(groups[0].textContent,/Synthetic Under Target/);
 q('.native-vs-days summary').click();
 assert.equal(q('.native-vs-days').open,true);
 assert.match(q('.native-vs-days').textContent,/89 erreicht/);
 q('#native-vs-week').value='2026-W40';
 q('#native-vs-week').dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.ok([...mount.querySelectorAll('.native-vs-group')].every(group=>!group.open),'next week starts collapsed');
 assert.equal(q('.native-vs-days').open,false,'next week day details also start collapsed');
 assert.ok(q('[data-native-action=review-open]'),'review action remains visible without opening an accordion');
});