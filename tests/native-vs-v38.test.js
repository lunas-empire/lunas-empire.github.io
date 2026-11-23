import test from 'node:test';
import assert from 'node:assert/strict';
import {renderVsOverview,vsDataFreshness,derivedVsWeekTotal,vsDayState,vsResultGroups} from '../assets/native-vs-overview.js';

const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>String(x);

test('weekly fallback card lists all twenty ranks without claiming daily or final results',()=>{
 const rows=Array.from({length:20},(_,index)=>({source_row:index+1,source_name:'Player '+(index+1),
  weekly_rank:index+1,weekly_points:index===0?1000:null,state:index===0?'verified':'deferred'}));
 const week={week:'2026-W47',state:'preliminary',members:[],weeklyFallback:{
  status:'partial_top20',verified_rows:11,deferred_rows:9,captured_at:'2026-11-22T12:00:00+01:00',rows}};
 const html=renderVsOverview(week,{}, {esc,numberText:String,formatTime:fmt,language:'de'}).fallbackHtml;
 assert.match(html,/Wochenrang 1–20/);
 assert.match(html,/Keine rechtzeitige Tagesaufnahme/);
 assert.match(html,/kein finales Duell-Ergebnis/);
 assert.equal((html.match(/class="native-weekly-fallback-row/g)||[]).length,20);
 assert.match(html,/Player 1/);
 assert.match(html,/Unbekannt/);
 assert.doesNotMatch(html,/6\/6 Ziel erreicht/);
});

test('day drill-down separates verified zero, missing data and pre-join days without changing the source',()=>{
 const people=[
  {id:'zero',name:'Zero',days:[{weekday:0,points:0,verified:true}]},
  {id:'met',name:'Met',days:[{weekday:0,points:4000000,quality:'observed'}]},
  {id:'missing',name:'Unknown',days:[]},
  {id:'joined',name:'Joined',days:[{weekday:0,quality:'before_join',points:null,verified:false}]},
  {id:'unverified',name:'Unchecked',days:[{weekday:0,points:9000000,verified:false}]}
 ];
 const week={threshold:3600000,members:people},original=JSON.stringify(week);
 const view=vsResultGroups(week,{day:0});
 assert.deepEqual(view.counts,{low:1,unknown:2,joined:1,met:1});
 assert.equal(vsDayState(people[0],0,3600000).points,0);
 assert.equal(vsDayState(people[2],0,3600000).points,null);
 assert.equal(vsResultGroups(week,{day:0,category:'met'}).groups[0].members[0].id,'met');
 assert.equal(JSON.stringify(week),original);
 assert.equal(vsDayState({days:[...people[0].days,...people[0].days]},0,3600000).kind,'unknown');
});

test('result sorting searches all players, keeps incomplete totals last and paginates compact groups',()=>{
 const members=Array.from({length:25},(_,i)=>({id:'m'+i,name:'Player '+i,failed:1,unknown:0,
  days:Array.from({length:6},(_,weekday)=>({weekday,points:i*100,verified:true}))}));
 members.push({id:'partial',name:'Incomplete',failed:1,unknown:1,days:[{weekday:0,points:999999,verified:true}]});
 const week={week:'2026-W43',members,dayTotals:[]};
 const high=vsResultGroups(week,{sort:'points_desc'}).groups[0].members;
 assert.equal(high[0].id,'m24');assert.equal(high.at(-1).id,'partial');
 const low=vsResultGroups(week,{sort:'points_asc'}).groups[0].members;
 assert.equal(low[0].id,'m0');assert.equal(low.at(-1).id,'partial');
 assert.equal(vsResultGroups(week,{query:'Player 24'}).matchingCount,1);
 const html=renderVsOverview(week,{}, {esc,numberText:String,formatTime:fmt}).groupsHtml;
 assert.equal((html.match(/class="native-vs-player /g)||[]).length,10);
 assert.match(html,/data-native-vs-more-group="low"/);
});
test('VS cockpit shows actual source time, six immediately visible day tiles and compact proof status',()=>{
 const member={id:'player-1',name:'Real Player',rank:'R2',
  failed:3,unknown:0,activeDays:6,weekly_points:11403546,weekly_proof_available:false,
  days:Array.from({length:6},(_,weekday)=>({weekday,verified:true,points:weekday?3000000:4100000,passed:weekday===0}))};
 const week={week:'2026-W41',state:'final',captured_at:'2026-10-10T21:37:19Z',
  imported_at:'2026-10-12 17:43:12',members:[member],dayTotals:[
   {weekday:0,passed:1,failed:0,unknown:0},
   ...Array.from({length:5},(_,i)=>({weekday:i+1,passed:0,failed:1,unknown:0}))]};
 const render=renderVsOverview(week,{}, {esc,numberText:n=>n.toLocaleString('de-DE'),
  formatTime:fmt,language:'de'});
 assert.match(render.freshness,/2026-10-10T21:37:19Z/);
 assert.match(render.freshness,/2026-10-12 17:43:12/);
 assert.equal((render.dayTiles.match(/<article class="native-day-mini(?: has-failures)?">/g)||[]).length,6);
 assert.match(render.groupsHtml,/19\.100\.000/,'Week is calculated from confirmed daily values, not imported ranking');
 assert.match(render.groupsHtml,/Aus sechs Tageswerten berechnet/);
 assert.doesNotMatch(render.groupsHtml,/11\.403\.546 Wochenpunkte · Originalbild/);
 assert.equal((render.groupsHtml.match(/native-vs-person-day /g)||[]).length,6);
 assert.match(render.groupsHtml,/3\/6 unter Ziel/);
 assert.match(render.groupsHtml,/6 aktive Tage/);
 assert.doesNotMatch(render.groupsHtml,/data-native-vs-image="2026-W41\|player-1\|6"/,'No separate weekly screenshot link');
});
test('No screenshot time inventing and no locale leakage to English',()=>{
 const week={week:'2026-W40',state:'preliminary',members:[],dayTotals:[]};
 const result=renderVsOverview(week,{}, {esc,numberText:String,formatTime:fmt,language:'en'});
 assert.match(result.freshness,/Screenshot time not recorded/);
 assert.match(result.freshness,/Provisional/);
 assert.doesNotMatch(result.freshness,/2026-10-15/);
 assert.match(result.groupsHtml,/No players recorded for this week/);
 assert.doesNotMatch(result.groupsHtml,/native-vs-group-low/,'empty result groups are hidden');
 assert.equal(vsDataFreshness(week,fmt).captureKnown,false);
 const mismatched=renderVsOverview({...week,members:[{id:'qa',name:'QA',failed:0,unknown:0,days:[]}],dayTotals:[{weekday:0,passed:89,failed:2,unknown:0}]},{},{esc,numberText:String,formatTime:fmt,language:'en'});
 assert.match(mismatched.dayTiles,/100% captured/,'abnormal source totals cannot display above 100 percent');
});

test('Days before a verified W43 join are labeled, not given invented zero scores or image links',()=>{
 const joined={id:'newcomer',name:'Newcomer',rank:'R1',failed:0,unknown:0,beforeJoin:4,activeDays:2,
  days:Array.from({length:6},(_,weekday)=>weekday<4?
   {weekday,quality:'before_join',eligible:false,verified:false,points:null}:
   {weekday,quality:'observed',verified:true,points:12345,passed:false})};
 const unresolved={id:'abdo',name:'ABDO M',rank:'R1',failed:0,unknown:2,beforeJoin:0,activeDays:4,
  days:Array.from({length:6},(_,weekday)=>weekday<2?{weekday,quality:'missing',verified:false,points:null}:
   {weekday,quality:'observed',verified:true,points:2000,passed:false})};
 const week={week:'2026-W43',state:'final',members:[joined,unresolved],
  dayTotals:Array.from({length:6},(_,weekday)=>({
   weekday,passed:0,failed:weekday<4?0:1,unknown:weekday<2?1:0,beforeJoin:weekday<4?1:0
  }))};
 const view=renderVsOverview(week,{}, {esc,numberText:String,formatTime:fmt,language:'de'});
 assert.match(view.dayTiles,/vor Beitritt/);
 assert.match(view.groupsHtml,/Beitritt während der Woche/);
 assert.match(view.groupsHtml,/Vor Beitritt/);
 assert.equal((view.groupsHtml.match(/data-native-vs-image="2026-W43\|newcomer\|/g)||[]).length,2);
 assert.equal((view.groupsHtml.match(/data-native-vs-image="2026-W43\|abdo\|/g)||[]).length,6);
 assert.match(view.groupsHtml,/2 unklar/);
 assert.doesNotMatch(view.groupsHtml,/0 Wochenpunkte/);
});

test('Weekly result comes only from six verified daily values, never imported leaderboard points',()=>{
 const days=Array.from({length:6},(_,weekday)=>({weekday,points:weekday===2?0:1000,quality:'observed'}));
 const result=derivedVsWeekTotal(days);
 assert.deepEqual(result,{total:5000,partial:5000,confirmed:6,complete:true});
 const partial=derivedVsWeekTotal(days.map(d=>d.weekday===4?{...d,quality:'inferred',points:999999}:d));
 assert.deepEqual(partial,{total:null,partial:4000,confirmed:5,complete:false});
 assert.equal(derivedVsWeekTotal([...days,days[0]]).complete,false,'Duplicate day cannot certify weekly points');
 assert.equal(derivedVsWeekTotal(days.map(d=>({...d,points:null}))).partial,null,'Unknown is not zero');
 const week={week:'2026-W41',state:'final',members:[{id:'member',name:'Safe player',rank:'R3',failed:0,unknown:1,activeDays:5,weekly_points:90000000,
  days:days.map(d=>d.weekday===4?{...d,verified:false,quality:'inferred'}:{...d,verified:true})}],dayTotals:[]};
 const render=renderVsOverview(week,{},{esc,numberText:n=>Number(n).toLocaleString('de-DE'),formatTime:fmt});
 assert.match(render.groupsHtml,/Teilstand/);
 assert.match(render.groupsHtml,/4\.000/);
 assert.doesNotMatch(render.groupsHtml,/90\.000\.000/);
 assert.doesNotMatch(render.groupsHtml,/Wochenbeleg fehlt/);
 assert.doesNotMatch(render.groupsHtml,/[|]6"/);
});
