import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildWeekLeaders,renderWeekLeaders} from '../assets/officer-week-leaders.js';

const person=(id,points,extra={})=>({id,name:id,rank:'R3',days:points.map((value,weekday)=>({weekday,verified:Number.isSafeInteger(value),points:value,passed:value>=100})),...extra});
const vsWeek={week:'W1',state:'final',administratively_closed:true,members:[
 person('Complete',[100,100,100,100,100,100]),person('Zero',[0,0,0,0,0,0]),person('Incomplete',[100,100,100,100,100,null]),person('Former',[999,999,999,999,999,999],{former:true})
]};
const donationWeek={week:'W1',is_complete:false,members:[{id:'Complete',name:'Complete',rank:'R3',points:0,delta:0,status:'below'},{id:'Incomplete',name:'Incomplete',rank:'R3',points:null,status:'unknown'}]};

test('Week leaders rank only fully confirmed active weeks and preserve real zeroes',()=>{
 const model=buildWeekLeaders(vsWeek,donationWeek);
 assert.deepEqual(model.vs.map(item=>item.id),['Complete','Zero']);assert.equal(model.excluded.vs,1);
 assert.equal(model.vs[1].total,0);assert.equal(model.donations[0].total,0);assert.equal(model.excluded.donations,1);
});

test('Week leaders cap the ranking at ten confirmed players',()=>{
 const week={...vsWeek,members:Array.from({length:12},(_,index)=>person('P'+index,[index,index,index,index,index,index]))};
 const model=buildWeekLeaders(week,donationWeek);assert.equal(model.vs.length,10);assert.equal(model.vs[0].id,'P11');assert.equal(model.vs.at(-1).id,'P2');
});

test('Week leaders show day evidence and explicit pre-reset and partial-capture facts',()=>{
 const html=renderWeekLeaders(vsWeek,donationWeek,{numberText:String}),dom=new JSDOM(html),doc=dom.window.document;
 assert.match(doc.body.textContent,/Pre-Reset-Snapshot/);
 assert.equal(doc.querySelectorAll('.native-week-leader').length,2);assert.equal(doc.querySelectorAll('[data-native-member]').length,2);
 assert.doesNotMatch(html,/Former|undefined|NaN/);dom.window.close();
 const donations=renderWeekLeaders(vsWeek,donationWeek,{metric:'donations',numberText:String});assert.match(donations,/kein finales Wochenergebnis/);
});
