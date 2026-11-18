import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildVsLongTermReport,renderVsLongTermReport} from '../assets/native-vs-overview.js';

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
 const html=renderVsLongTermReport(weeks,{range:'all',numberText:String,esc:value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')});
 const dom=new JSDOM(html),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('.native-vs-report-days article').length,5);
 assert.equal(doc.querySelectorAll('.native-vs-report-group').length,3);
 assert.match(doc.querySelector('.native-vs-report-scope').textContent,/Saturday excluded|Samstag ausgeschlossen/);
 assert.equal(doc.querySelector('[data-native-member]').dataset.nativeMember,'safe-id');
 assert.equal(doc.querySelector('[data-native-member] strong').textContent,'<Unsafe>');
 assert.doesNotMatch(html,/<Unsafe>/);
 const english=renderVsLongTermReport(weeks,{language:'en'});
 assert.match(english,/Mon–Fri &amp; long-term|Mon–Fri & long-term/);assert.match(english,/Saturday excluded/);assert.match(english,/3\.6M/);assert.match(english,/7\.2M/);
 assert.doesNotMatch(english,/Wiederholt unter|Noch nie/);
 dom.window.close();
});
