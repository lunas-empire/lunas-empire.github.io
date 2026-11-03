import test from 'node:test';
import assert from 'node:assert/strict';
import {vsSupportChatReport} from '../assets/vs-support-report.js';
import {HISTORY,diceHistory,diceDisclosure} from '../assets/dice-winners.js';
const member=(id,passed,missing=0)=>({
 id,name:'Member '+id,failed:6-passed-missing,
 days:Array.from({length:6},(_,i)=>i<missing?{verified:false,points:null}:
 {verified:true,points:i<passed?3800000:2500000})
});
test('Dice list counts only the nine confirmed spreadsheet entries, removes duplicate on same day',()=>{
 assert.equal(HISTORY.length,9);
 assert.equal(HISTORY[8].winner_name,'Dennis0106');
 assert.ok(!HISTORY.some(x=>x.ride_date==='2026-10-14'||x.ride_date==='2026-10-28'));
 assert.equal(diceHistory([{ride_date:'2026-06-16',winner_name:'Updated By Officer'}]).length,9);
 assert.match(diceDisclosure('en',x=>x),/Dennis0106/);
});
test('Weekly VS chat report uses only verified full-day categories and never invents breaches',()=>{
 const week={week:'2026-W41',state:'final',threshold:3600000,
 members:[member('all6',6),member('five',5),member('three',3),
  member('zero',0),member('missing',3,1)]};
 const report=vsSupportChatReport(week,[]);
 for(const line of ['6/6 goals: 1','4–5/6 goals: 1','2–3/6 goals: 1',
  '0–1/6 goals: 1','Incomplete / unknown: 1',
  'Not voting does NOT imply poor VS participation','2–3 weeks'])
 assert.ok(report.includes(line),line);
 assert.ok(!report.includes('Member missing: 2 confirmed'),'Incomplete must not be penalized');
 assert.ok(report.length>500,'Chat report should support longer copy than an ingame mail');
});
