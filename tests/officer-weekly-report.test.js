import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWeeklyReport} from '../assets/officer-weekly-report.js';

const metric=total=>({total,median:total/2,verified:1,coverage:100});
const data={
 trends:{weeks:[{week:'W2',captured_at:'2026-11-15',is_complete:true,metrics:{power:metric(400),kills:metric(0),donations_weekly:metric(20000)}}]},
 vs:{weeks:[{week:'W2',state:'final',dayTotals:[{passed:1,failed:0,unknown:1}]}]},
 donations:{weeks:[{week:'W2',met:1,verified:1,below:0,unknown:1}]},
 readiness:{batches:[{report_date:'2026-11-15',metrics:{power:metric(400),total_troops:metric(50)}}]},
 eventInsights:{runs:[{id:'e',event_type:'zombie_siege',event_date:'2026-11-19',outcome:'completed'}],series:[]},
 trains:{today:'2026-11-19',counts:{completed:10,planned:2},calendar:[],vip_passengers:[]},dice:[],members:[{id:'a',status:'active'}],duel:{matches:[]},overview:{reviews:2},operations:{tasks:[],absences:[]}
};

test('Weekly report combines all evidence areas and marks missing history honestly',()=>{
 const report=buildWeeklyReport(data);
 assert.match(report,/Stärke: 400/);assert.match(report,/VS: 1\/1/);assert.match(report,/Truppen: 50/);
 assert.match(report,/Keine vollständige Vergaberunde/);assert.match(report,/Keine bestätigten finalen Matches/);assert.match(report,/Offene OCR-Reviews: 2/);
 assert.doesNotMatch(report,/undefined|NaN/);
});

test('Weekly report has an honest empty state and English officer brief',()=>{
 assert.match(buildWeeklyReport({},{language:'en'}),/No confirmed weekly data/);
 const english=buildWeeklyReport(data,{language:'en'});assert.match(english,/RZSN R4 weekly report/);assert.match(english,/RZSN officer brief/);
});
