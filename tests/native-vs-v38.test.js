import test from 'node:test';
import assert from 'node:assert/strict';
import {renderVsOverview,vsDataFreshness} from '../assets/native-vs-overview.js';

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
 assert.match(render.groupsHtml,/Wochenbeleg fehlt · ergänzen/);
 assert.doesNotMatch(render.groupsHtml,/11\.403\.546 Wochenpunkte · Originalbild/);
 assert.equal((render.groupsHtml.match(/native-vs-person-day /g)||[]).length,6);
 assert.match(render.groupsHtml,/3\/6 unter Ziel/);
 assert.match(render.groupsHtml,/6 aktive Tage/);
 assert.match(render.groupsHtml,/data-native-vs-image="2026-W41\|player-1\|6"/);
});
test('No screenshot time inventing and no locale leakage to English',()=>{
 const week={week:'2026-W40',state:'preliminary',members:[],dayTotals:[]};
 const result=renderVsOverview(week,{}, {esc,numberText:String,formatTime:fmt,language:'en'});
 assert.match(result.freshness,/Screenshot time not recorded/);
 assert.match(result.freshness,/Provisional/);
 assert.doesNotMatch(result.freshness,/2026-10-15/);
 assert.match(result.groupsHtml,/No players in this group/);
 assert.equal(vsDataFreshness(week,fmt).captureKnown,false);
});
