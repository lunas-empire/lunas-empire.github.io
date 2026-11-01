import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {renderVsOverview,enrichVsWeeks} from '../assets/native-vs-overview.js';
const api={esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),numberText:String,formatTime:String,language:'de'};
test('W44 FINAL keeps proof, player cards and zero vs unknown without charts or signed changes',async()=>{
 const days=Array.from({length:6},(_,weekday)=>({weekday,verified:weekday<2,points:weekday<2?weekday*3600000:null,passed:weekday===1,pointsDelta:3600000,goalChange:'met'}));
 const week={week:'2026-W44',state:'final',captured_at:null,imported_at:'2026-11-01T08:00:00Z',threshold:3600000,dayTotals:[{weekday:1,passed:1,failed:0,unknown:0,passedDelta:1,percentagePointDelta:100,attainmentPercent:100}],members:[{id:'stable-id',name:'Synthetic',rank:'R3',failed:1,unknown:4,days,weekTrend:[{week:'2026-W43',points:123}]}]};
 for(const language of ['de','en']){
  const layout=renderVsOverview(week,{}, {...api,language});
  const dom=new JSDOM(layout.freshness+layout.dayTiles+layout.groupsHtml),doc=dom.window.document;
  assert.equal(doc.querySelectorAll('[data-native-vs-day]').length,6);
  assert.equal(doc.querySelectorAll('svg,.native-vs-trends,.trend-up,.trend-down,[data-native-vs-chart]').length,0);
  assert.doesNotMatch(doc.body.textContent,/Vortag|Delta|Prozentpunkte|Ziel neu erreicht|W43|[+\u2212]/);
  assert.equal(doc.querySelector('[data-native-member]').dataset.nativeMember,'stable-id');
  assert.equal(doc.querySelector('[data-native-vs-image="2026-W44|stable-id|0"]').textContent.trim(),'0 \u2197');
  assert.match(doc.querySelector('[data-native-vs-image="2026-W44|stable-id|2"]').textContent,/Unbekannt|Unknown/);
  assert.match(doc.querySelector('.native-capture-state.is-final').textContent,/Finalisiert|Finalized/);
  assert.match(doc.querySelector('.native-capture-banner').textContent,/W44/);
  assert.match(doc.body.textContent,/2026-11-01T08:00:00Z/);
  assert.match(doc.body.textContent,/Screenshot-Uhrzeit nicht erfasst|Screenshot time not recorded/);
  dom.window.close();
 }
 const css=await readFile(new URL('../assets/hub.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/native-vs-trends|vs-trend-up|vs-trend-down/);
});
test('verified normalization keeps distinct people and player-days without computing trends',()=>{
 const person=(id,points)=>({id,name:'Synthetic',failed:1,days:[{weekday:0,verified:true,points},{weekday:1,verified:true,points:4000000}]});
 const data=enrichVsWeeks({weeks:[{week:'2026-W44',state:'final',threshold:3600000,members:[person('stable',0),person('new',9000000)]}]});
 const w=data.weeks[0];
 assert.equal(w.state,'final');assert.equal(w.scopeMembers,2);assert.equal(w.affectedMembers,2);
 assert.equal(w.verifiedDays,4);assert.equal(w.metPlayerDays,3);assert.equal(w.scopePlayerDays,12);
 assert.equal(w.members[0].weekly_points,null);assert.equal(w.members[0].partial_week_points,4000000);
 assert.equal(w.members[0].days[0].points,0);assert.equal(w.members[0].days[2].points,null);
 assert.equal(w.comparisons,undefined);assert.equal(w.members[0].weekTrend,undefined);
 assert.equal(w.members[0].days[1].pointsDelta,undefined);assert.equal(w.members[0].days[1].goalChange,undefined);
 for(const d of w.dayTotals)for(const key of ['passedDelta','percentagePointDelta','pairedMembers','pairedMetDelta'])assert.equal(d[key],undefined);
 assert.equal(enrichVsWeeks({weeks:[{week:'2026-W44',state:'final'}]}).weeks[0].scopeMembers,0);
});
