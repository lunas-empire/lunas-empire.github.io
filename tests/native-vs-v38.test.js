import test from 'node:test';
import assert from 'node:assert/strict';
import {renderVsOverview,vsDataFreshness,derivedVsWeekTotal} from '../assets/native-vs-overview.js';

const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>String(x);
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
