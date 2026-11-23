import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildVsLongTermReport,renderVsLongTermReport,vsLongTermReportText,buildVsHistory,renderVsHistory} from '../assets/native-vs-overview.js';

const person=(id,name,points)=>({id,name,days:points.map((value,weekday)=>({weekday,verified:Number.isSafeInteger(value),points:Number.isSafeInteger(value)?value:null,quality:Number.isSafeInteger(value)?'observed':'inferred'}))});
const week=(week,members)=>({week,state:'final',members});
const lowWeek=(label,id='repeat',name='Repeat')=>week(label,[person(id,name,[0,2000000,3000000,8000000,9000000,0])]);

test('Mo-Fr report separates 3.6M and 7.2M, excludes Saturday and never counts unknown as zero',()=>{
 const data=[week('2026-W46',[
  person('high','High',[7200000,3600000,7300000,8000000,4000000,0]),
  person('unknown','Unknown',[null,null,null,null,null,0]),
  person('zero','Zero',[0,3600000,7200000,0,4000000,0])
 ])];
 const report=buildVsLongTermReport(data);
 assert.equal(report.weeks.length,1);assert.equal(report.memberCount,3);
 assert.deepEqual(report.days.map(day=>day.confirmed),[2,2,2,2,2]);
 assert.deepEqual(report.days.map(day=>day.lowMet),[1,2,2,1,2]);
 assert.deepEqual(report.days.map(day=>day.highMet),[1,0,2,1,0]);
 assert.deepEqual(report.days.map(day=>day.unknown),[1,1,1,1,1]);
 assert.equal(report.repeated.length,0,'Saturday zero cannot create a repeated weekday warning');
 assert.equal(report.neverPerfect.length,0,'One incomplete or complete week is insufficient');
 const high=report.improved.find(item=>item.id==='high');assert.equal(high,undefined,'No baseline means no invented progress');
});

test('Long-term groups use permanent IDs, complete weeks and explicit repeat rules',()=>{
 const weeks=[
  lowWeek('2026-W46'),
  lowWeek('2026-W45'),
  week('2026-W44',[
   person('repeat','Repeat',[4000000,4000000,4000000,4000000,4000000,9000000]),
   person('never','Never',[4000000,4000000,4000000,4000000,0,9000000])
  ]),
  week('2026-W43',[
   person('never','Never',[4000000,4000000,4000000,4000000,0,9000000]),
   person('better','Better',[0,0,4000000,4000000,4000000,9000000])
  ]),
  week('2026-W42',[
   person('never','Never',[4000000,4000000,4000000,4000000,0,9000000]),
   person('better','Better',[0,0,0,4000000,4000000,9000000])
  ]),
  week('2026-W41',[person('better','Better',[0,0,0,0,4000000,9000000])])
 ];
 weeks[0].members.push(person('better','Better',[4000000,4000000,4000000,4000000,4000000,0]));
 weeks[0].members.push(person('never','Never',[4000000,4000000,4000000,4000000,0,0]));
 const all=buildVsLongTermReport(weeks,{range:'all'});
 assert.equal(all.weeks.length,6);assert.deepEqual(new Set(all.repeated.map(item=>item.id)),new Set(['repeat','better']));
 assert.deepEqual(all.neverPerfect.map(item=>item.id),['never']);
 assert.equal(all.neverPerfect[0].completeWeeks,4);assert.equal(all.neverPerfect[0].bestMet,4);
 const better=all.improved.find(item=>item.id==='better');
 assert.equal(better.earliest.week,'2026-W41');assert.equal(better.latest.week,'2026-W46');assert.equal(better.metDelta,4);
 const monthly=buildVsLongTermReport(weeks);
 assert.deepEqual(monthly.weeks,['2026-W46','2026-W45','2026-W44','2026-W43']);
 assert.equal(monthly.improved.find(item=>item.id==='better').earliest.week,'2026-W43');
});

test('Same names are not merged and duplicate ID rows do not certify a week',()=>{
 const weeks=['2026-W44','2026-W43','2026-W42'].map(label=>week(label,[
  person('id-a','Shared name',[0,0,0,4000000,4000000,9000000]),
  person('id-b','Shared name',[5000000,5000000,5000000,5000000,5000000,9000000])
 ]));
 const report=buildVsLongTermReport(weeks,{range:'all'});
 assert.equal(report.memberCount,2);
 assert.deepEqual(report.neverPerfect.map(item=>item.id),['id-a']);
 assert.equal(report.neverPerfect.find(item=>item.id==='id-a').name,'Shared name');
 const duplicate=buildVsLongTermReport(weeks.map(w=>({...w,members:[w.members[0],w.members[0]]})),{range:'all'});
 assert.equal(duplicate.days[0].confirmed,0);assert.equal(duplicate.neverPerfect.length,0);
});

test('Rendered report is accessible, escaped, bilingual and links only stable member IDs',()=>{
 const weeks=['2026-W46','2026-W45','2026-W44'].map(label=>lowWeek(label,'safe-id','<Unsafe>'));
 const html=renderVsLongTermReport(weeks,{range:'all',currentWeek:weeks[0],numberText:String,esc:value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')});
 const dom=new JSDOM(html),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('.native-vs-report-days article').length,5);
 assert.equal(doc.querySelectorAll('.native-vs-report-group').length,3);
 assert.match(doc.querySelector('.native-vs-report-scope').textContent,/Saturday excluded|Samstag ausgeschlossen/);
 assert.equal(doc.querySelector('[data-native-member]').dataset.nativeMember,'safe-id');
 assert.equal(doc.querySelector('.native-vs-report-person summary strong').textContent,'<Unsafe>');
 assert.doesNotMatch(html,/<Unsafe>/);
 const card=doc.querySelector('.native-vs-report-repeated .native-vs-report-person');
 assert.equal(card.querySelectorAll('.native-vs-person-day').length,6,'inline player card shows all six days');
 assert.equal(card.querySelectorAll('[data-native-vs-image]').length,6,'every verified day links to its image');
 assert.match(card.querySelector('[data-native-vs-image="2026-W46|safe-id|0"]').textContent,/0 ↗/);
 assert.equal(card.querySelector('summary').hasAttribute('data-native-member'),false,'summary expands inline instead of navigating away');
 assert.match(card.querySelector('[data-native-member]').textContent,/Spielerakte/);
 assert.equal(doc.querySelectorAll('.native-vs-report-day[data-native-vs-day]').length,5,'all five report days open the selected week');
 assert.equal(doc.querySelectorAll('[data-native-vs-copy-report]').length,1);
 assert.equal(doc.querySelector('.native-vs-report-fallback[hidden]').readOnly,true);
 const english=renderVsLongTermReport(weeks,{language:'en'});
 assert.match(english,/Mon–Fri &amp; long-term|Mon–Fri & long-term/);assert.match(english,/Saturday excluded/);assert.match(english,/3\.6M/);assert.match(english,/7\.2M/);
 assert.doesNotMatch(english,/Wiederholt unter|Noch nie/);
 dom.window.close();
});

test('Copyable long-term report contains exact daily ratios and attributable member lists',()=>{
 const weeks=['2026-W46','2026-W45','2026-W44'].map(label=>lowWeek(label,'stable','Repeat Example'));
 const report=buildVsLongTermReport(weeks,{range:'all'});
 const text=vsLongTermReportText(report);
 assert.match(text,/RZSN VS Mo–Fr \| 2026-W44–2026-W46/);
 assert.match(text,/Mo: 0\/1 ≥ 3,6 Mio\. \(0%\) \| 0\/1 ≥ 7,2 Mio\. \(0%\)/);
 assert.match(text,/Do: 1\/1 ≥ 3,6 Mio\. \(100%\) \| 1\/1 ≥ 7,2 Mio\. \(100%\)/);
 assert.match(text,/Wiederholt unter dem Tagesziel \(1\)/);assert.match(text,/Repeat Example — 3 Wochen \/ 9 Tage unter Ziel/);
 assert.match(text,/Keine automatische Sanktion|keine automatische Sanktion/);
 const english=vsLongTermReportText(report,{language:'en'});
 assert.match(english,/Saturday excluded/);assert.match(english,/Repeatedly below the daily goal/);
});

test('Weekly history is a clickable CSS chart with confirmed-only ratios and unknown counts',()=>{
 const weeks=[
  {week:'2026-W46',state:'final',perfect:24,dayTotals:[{weekday:0,passed:77,failed:21,unknown:1},{weekday:1,passed:71,failed:28,unknown:0}]},
  {week:'2026-W45',state:'final',perfect:20,dayTotals:[{weekday:0,passed:50,failed:50,unknown:0}]},
  {week:'2026-W44',state:'preliminary',dayTotals:[]}
 ];
 const history=buildVsHistory(weeks);
 assert.deepEqual(history.map(item=>item.percent),[75,50,null]);
 assert.equal(history[0].confirmed,197);assert.equal(history[0].met,148);assert.equal(history[0].unknown,1);
 const html=renderVsHistory(weeks,'2026-W46',{numberText:String});
 const dom=new JSDOM(html),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('[data-native-vs-history-week]').length,3);
 assert.equal(doc.querySelector('[data-native-vs-history-week="2026-W46"]').getAttribute('aria-pressed'),'true');
 assert.match(doc.body.textContent,/148\/197/);assert.match(doc.body.textContent,/24× 6\/6/);assert.match(doc.body.textContent,/1 unklar/);
 assert.equal(doc.querySelectorAll('svg').length,0);
 assert.match(doc.querySelector('.native-vs-history-track i').getAttribute('style'),/width:75%/);
 dom.window.close();
});

test('Long-term analysis counts unique active IDs once and excludes former members everywhere',()=>{
 const weeks=['2026-W46','2026-W45','2026-W44'].map(label=>week(label,[
  person('active','Active Member',[8000000,8000000,8000000,8000000,8000000,8000000]),
  {...person('former','Former Member',[0,0,0,0,0,0]),former:true}
 ]));
 const report=buildVsLongTermReport(weeks,{range:'all'});
 assert.equal(report.memberCount,1);assert.deepEqual(report.repeated,[]);assert.deepEqual(report.neverPerfect,[]);
 assert.ok(report.days.every(day=>day.confirmed===1&&day.lowMet===1&&day.highMet===1&&day.unknown===0));
 const html=renderVsLongTermReport(weeks,{range:'all',language:'en'});
 assert.match(html,/1 active members/);assert.match(html,/each member counted once/);assert.doesNotMatch(html,/Former Member/);
});

test('Two, three and custom week ranges select only actual recordings',()=>{
 const weeks=['2026-W46','2026-W45','2026-W44','2026-W43','2026-W42','2026-W41'].map(label=>lowWeek(label));
 assert.deepEqual(buildVsLongTermReport(weeks,{range:'2'}).weeks,['2026-W46','2026-W45']);
 assert.deepEqual(buildVsLongTermReport(weeks,{range:'3'}).weeks,['2026-W46','2026-W45','2026-W44']);
 const custom=buildVsLongTermReport(weeks,{range:'custom',from:'2026-W42',to:'2026-W45'});
 assert.deepEqual(custom.weeks,['2026-W45','2026-W44','2026-W43','2026-W42']);
 assert.deepEqual(buildVsLongTermReport(weeks,{range:'custom',from:'2026-W45',to:'2026-W42'}).weeks,custom.weeks,'reversed inputs are normalized');
 const html=renderVsLongTermReport(weeks,{range:'custom',from:'2026-W42',to:'2026-W45'});
 assert.match(html,/class="native-vs-report-custom" >/);
 assert.match(html,/id="native-vs-report-from"[\s\S]*?value="2026-W42" selected/);
 assert.match(html,/id="native-vs-report-to"[\s\S]*?value="2026-W45" selected/);
 assert.match(html,/native-vs-longterm-fold/);
});
