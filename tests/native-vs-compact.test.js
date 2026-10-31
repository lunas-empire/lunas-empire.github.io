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
 assert.equal(q('.native-dashboard-stat-fold'),null,'empty and redundant metrics panel is removed');
 assert.ok(q('.native-command-today'),'today duties are shown in one compact panel');
 assert.equal(q('.native-command-tasks'),null,'no empty task cards when no open tasks');
 assert.equal(mount.querySelectorAll('.native-dashboard-mini-tile').length,2,'two small signal tiles replace big duplicate cards');
 q('[data-officer-tab=more]').click();
 assert.equal(mount.querySelectorAll('.native-hub-tile[data-officer-tab]').length,10,'all officer destinations including protected planning and settings remain reachable from the dedicated More page');
 q('[data-officer-tab=vs]').click();
 await until(()=>q('.native-vs-group'));
 const groups=mount.querySelectorAll('.native-vs-group');
 assert.equal(groups.length,3);
 assert.ok(groups[0].textContent.includes('Unter Tagesziel'));
 assert.ok([...groups].every(group=>!group.open),'all VS player groups start collapsed');
 assert.equal(q('.native-vs-days'),null,'old oversized day accordion has been removed');
 assert.equal(mount.querySelectorAll('.native-day-mini').length,6,'six weekday comparisons immediately visible');
 assert.equal(mount.querySelectorAll('.native-vs-kpi').length,5,'metrics remain compact and visible');
 assert.equal(q('.native-vs-priority-note'),null,'duplicated warning callout removed');
 groups[0].querySelector('summary').click();
 assert.equal(groups[0].open,true,'an officer can expand under-target members');
 assert.match(groups[0].textContent,/Synthetic Under Target/);
 assert.match(mount.querySelector('.native-day-overview-grid').textContent,/89/,'Monday counts visible without opening anything');
 q('#native-vs-week').value='2026-W40';
 q('#native-vs-week').dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.ok([...mount.querySelectorAll('.native-vs-group')].every(group=>!group.open),'next week starts collapsed');
 assert.equal(mount.querySelectorAll('.native-day-mini').length,6,'switching week keeps weekday summary visible');
 assert.ok(q('.native-vs-tools [data-native-action=review-open]'),'small review action remains visible');
 assert.equal(mount.querySelectorAll('.native-vs-single-insight').length,1,'one combined warning note');
});

test('day tiles reveal attributable scores, categories, sorting and pagination without losing week or profile context',async t=>{
 const dom=new JSDOM('<main id="mount"></main>',{url:'https://lunas-empire.github.io/#admin'});
 const oldWindow=globalThis.window,oldFetch=globalThis.fetch;
 globalThis.window=dom.window;dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
 t.after(()=>{clearOfficer();globalThis.window=oldWindow;globalThis.fetch=oldFetch;dom.window.close()});
 const people=Array.from({length:25},(_,i)=>({id:'low-'+i,name:'Player '+String(i).padStart(2,'0'),rank:i===0?'R5':'R2',failed:1,unknown:0,
  days:Array.from({length:6},(_,weekday)=>({weekday,verified:true,points:weekday===0?i*1000:5000000,passed:weekday!==0}))}));
 people.push({id:'met',name:'Winner',rank:'R3',failed:0,unknown:0,days:Array.from({length:6},(_,weekday)=>({weekday,verified:true,points:5000000,passed:true}))},
  {id:'missing',name:'Missing',failed:0,unknown:1,days:[{weekday:0,verified:false,points:10000000}]},
  {id:'joined',name:'Newcomer',failed:0,unknown:0,beforeJoin:1,days:[{weekday:0,quality:'before_join'}]});
 const weeks=['2026-W43','2026-W42'].map(week=>({week,threshold:3600000,failedDays:25,unknownDays:1,perfect:1,
  dayTotals:[{weekday:0,passed:1,failed:25,unknown:1,beforeJoin:1}],members:people}));
 const requests=[];
 globalThis.fetch=async url=>{
  const path=new URL(url).pathname;requests.push(path);
  if(path==='/api/native-login')return Response.json({token:'synthetic',name:'Officer',role:'R4'});
  if(path==='/api/overview')return Response.json({active:28,reviews:0});
  if(path==='/api/operations')return Response.json({tasks:[],events:[],members:[]});
  if(path==='/api/train-manager')return Response.json({today:'2026-10-26',history:[],calendar:[],counts:{}});
  if(path==='/api/vs-intelligence')return Response.json({weeks});
  if(path==='/api/members')return Response.json(people);
  if(path==='/api/member/low-0')return Response.json({member:{...people[0],status:'active'},stats:[],weeks:[],days:[],rides:[],dice_wins:[],achievements:[]});
  throw Error('Unexpected synthetic path '+path);
 };
 const mount=dom.window.document.querySelector('#mount'),q=selector=>mount.querySelector(selector);
 const until=async predicate=>{for(let n=0;n<120;n++){if(predicate())return;await new Promise(r=>setTimeout(r,5))}assert.ok(predicate(),'render timeout')};
 const change=(selector,value)=>{q(selector).value=value;q(selector).dispatchEvent(new dom.window.Event('change',{bubbles:true}))};
 const rows=()=>[...mount.querySelectorAll('[data-native-vs-group=low] .native-vs-player')];
 const name=row=>row.querySelector('.native-vs-person-main strong').textContent;
 initNativeAdmin(mount);await renderNativeAdmin(mount);q('[name=code]').value='synthetic';
 q('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>q('[data-officer-tab=vs]'));q('[data-officer-tab=vs]').click();await until(()=>q('[data-native-vs-day]'));
 assert.equal(rows().length,10,'long groups start with ten rows');
 q('[data-native-vs-day="0"]').click();
 assert.match(q('#native-vs-results-title').textContent,/Montag.*2026-W43/);
 assert.equal(q('[data-native-vs-day="0"]').getAttribute('aria-pressed'),'true');
 assert.equal(dom.window.document.activeElement,q('#native-vs-results-title'));
 assert.equal(q('[data-native-vs-group=low]').open,true);
 assert.match(q('[data-native-vs-category=low]').textContent,/25/);
 assert.match(rows()[0].querySelector('.native-vs-selected-day').textContent,/Mo · 0/,'verified zero is attributable');
 q('[data-native-vs-group=low] > summary').click();change('#native-vs-sort','name');
 assert.equal(q('[data-native-vs-group=low]').open,false,'sorting respects a manually closed daily group');
 q('[data-native-vs-group=low] > summary').click();
 q('[data-native-vs-more-group=low]').click();assert.equal(rows().length,20);
 assert.equal(dom.window.document.activeElement,q('[data-native-vs-more-group=low]'));
 q('[data-native-vs-more-group=low]').click();assert.equal(rows().length,25);
 assert.equal(q('[data-native-vs-more-group=low]'),null);
 assert.equal(dom.window.document.activeElement,q('[data-native-vs-group=low] > summary'));
 change('#native-vs-sort','points_desc');assert.equal(rows().length,10);assert.equal(name(rows()[0]),'Player 24');
 assert.equal(q('[data-native-vs-group=low]').open,true,'sorting preserves expanded group');
 change('#native-vs-sort','points_asc');assert.equal(name(rows()[0]),'Player 00');
 change('#native-vs-sort','rank');assert.equal(name(rows()[0]),'Player 00');
 q('[data-native-vs-category=unknown]').click();assert.equal(mount.querySelectorAll('.native-vs-player').length,1);
 assert.match(q('.native-vs-selected-day').textContent,/Unbekannt/);assert.doesNotMatch(q('.native-vs-selected-day').textContent,/10\.000\.000/);
 q('[data-native-vs-category=joined]').click();assert.match(q('.native-vs-selected-day').textContent,/Vor Beitritt/);
 q('[data-native-vs-category=met]').click();assert.equal(name(q('.native-vs-player')),'Winner');
 q('[data-native-vs-category=all]').click();
 const search=q('#native-vs-search');search.value='Player 24';search.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 assert.equal(mount.querySelectorAll('.native-vs-player').length,1,'search reaches players beyond the initial page');
 assert.match(q('[data-native-vs-category=low]').textContent,/25/,'search does not change original day counts');
 search.value='Player 00';search.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 q('[data-native-vs-weekly]').click();assert.match(q('#native-vs-results-title').textContent,/Spieler nach Ergebnis/);
 assert.equal(q('#native-vs-search').value,'');assert.equal(q('[data-native-vs-category]'),null);
 q('[data-native-vs-day="0"]').click();change('#native-vs-week','2026-W42');
 assert.match(q('#native-vs-results-title').textContent,/Spieler nach Ergebnis/);
 assert.equal(q('[data-native-vs-day="0"]').getAttribute('aria-pressed'),'false');
 assert.equal(q('#native-vs-sort').value,'rank','week changes preserve selected ordering');
 assert.equal(requests.filter(path=>path==='/api/vs-intelligence').length,1,'day/category/week/sort/search/pagination use the already loaded VS data');


});
