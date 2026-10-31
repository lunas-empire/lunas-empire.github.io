import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {renderVsOverview,renderVsTrend,enrichVsWeeks} from '../assets/native-vs-overview.js';
const api={esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),numberText:v=>String(v),formatTime:v=>v,language:'de'};
test('existing VS view renders daily and member changes and a single accessible chart with real gaps',()=>{
 const days=Array.from({length:6},(_,weekday)=>({weekday,verified:weekday<2,points:weekday<2?weekday*3600000:null,passed:weekday===1,pointsDelta:weekday===1?3600000:null,goalChange:weekday===1?'met':null}));
 const week={week:'2026-W44',state:'final',verifiedDays:2,metPlayerDays:1,scopeMembers:1,dayTotals:[{weekday:1,passed:1,failed:0,unknown:0,passedDelta:1,percentagePointDelta:100,attainmentPercent:100}],members:[{id:'stable-id',name:'Synthetic',rank:'R3',failed:1,unknown:4,verified:2,days}],comparisons:{previous:{pointsDelta:0,attainmentDelta:0,pairedPlayerDays:2},rolling:{pointsDelta:0,attainmentDelta:0,pairedPlayerDays:2,missingWeeks:['2026-W41']}}};
 const layout=renderVsOverview(week,{},api),graph=renderVsTrend([week,{...week,week:'2026-W42'}],week.week,api);
 const dom=new JSDOM(layout.dayTiles+layout.groupsHtml+graph),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('.native-day-mini').length,6);
 assert.match(doc.querySelector('.native-day-overview-grid').textContent,/\+1 Spieler zum Vortag/);
 assert.match(doc.querySelector('.native-vs-person-daygrid').textContent,/\+3600000 Punkte.*Ziel neu erreicht/);
 assert.equal(doc.querySelector('[data-native-member]').dataset.nativeMember,'stable-id');
 assert.equal(doc.querySelectorAll('svg').length,1);
 assert.match(doc.querySelector('svg').getAttribute('aria-label'),/W43: unbekannt/);
 assert.equal((doc.querySelectorAll('svg path')[1].getAttribute('d').match(/M/g)||[]).length,2,'missing W43 must break the graph');
 assert.match(doc.querySelector('.native-vs-trends').textContent,/2026-W41/);
 dom.window.close();
});

test('legacy API days derive trends locally using only verified same-ID weekday pairs',()=>{
 const person=(id,points)=>({id,name:'Synthetic',passed:1,failed:0,days:[{weekday:0,verified:true,points,passed:points>=3600000}]});
 const data=enrichVsWeeks({weeks:[{week:'2026-W44',state:'final',threshold:3600000,members:[person('stable',4000000),person('new',9000000)]},{week:'2026-W43',state:'final',threshold:3600000,members:[person('stable',0),person('old',8000000)]}]});
 const w=data.weeks[0];assert.equal(w.comparisons.previous.pairedPlayerDays,1);assert.equal(w.comparisons.previous.pointsDelta,4000000);assert.equal(w.comparisons.previous.attainmentDelta,100);
 assert.equal(w.members[0].weekly_points,null);assert.equal(w.members[0].weekTrend[1].partialPoints,0);
 assert.equal(w.metPlayerDays,2);assert.equal(w.members[0].days[1].points,null);
 const empty=enrichVsWeeks({weeks:[{week:'2026-W44',state:'final'}]});assert.equal(empty.weeks[0].comparisons.previous,null);
});
