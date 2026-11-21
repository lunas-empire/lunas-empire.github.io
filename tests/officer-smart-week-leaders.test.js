import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildSmartWeekLeaders,renderWeekLeaders} from '../assets/officer-week-leaders.js';

const days=points=>points.map((value,weekday)=>({weekday,verified:true,points:value,passed:value>=100}));
const player=(id,points)=>({id,name:id,rank:'R3',days:Array.from({length:6},()=>points).flatMap((value,index)=>[] )});
const person=(id,value)=>({id,name:id,rank:'R3',days:Array.from({length:6},(_,weekday)=>({weekday,verified:true,points:value,passed:value>=100}))});
const trends={weeks:[
 {week:'W1',members:[{id:'a',name:'Alpha',rank:'R3',power:100,kills:10,donations_weekly:0},{id:'b',name:'Bravo',rank:'R3',power:100,kills:20,donations_weekly:100}]},
 {week:'W2',members:[{id:'a',name:'Alpha',rank:'R3',power:200,kills:20,donations_weekly:100},{id:'b',name:'Bravo',rank:'R3',power:100,kills:25,donations_weekly:50},{id:'c',name:'Unknown',rank:'R2',power:null,kills:null,donations_weekly:null}]}
]};
const vs1={week:'W1',members:[person('a',100),person('b',50),person('c',100)]},vs2={week:'W2',members:[person('a',50),person('b',100),person('c',100)]};
const donations1={week:'W1',members:[{id:'a',points:0},{id:'b',points:100}]},donations2={week:'W2',is_complete:false,members:[{id:'a',points:100},{id:'b',points:50}]};

test('Smart leaders combine VS, power growth, kill gain and donations with transparent development ranks',()=>{
 const model=buildSmartWeekLeaders(vs2,donations2,trends,'W2',vs1,donations1);
 assert.deepEqual(model.lists.combined.map(item=>item.id),['a','b']);assert.equal(model.eligible.combined,2);
 assert.equal(model.lists.combined[0].averageRank,1.5);assert.equal(model.lists.development[0].improvements,3);assert.equal(model.lists.development[1].improvements,2);
 assert.equal(model.lists.growth[0].id,'a');assert.equal(model.lists.kills[0].id,'a');assert.equal(model.lists.donations[0].id,'a');assert.equal(model.lists.vs[0].id,'b');
 assert.equal(model.records.find(item=>item.id==='c').improvements,null);
});

test('Smart leader menu exposes all six categories and component evidence',()=>{
 const html=renderWeekLeaders(vs2,donations2,{metric:'combined',trends,selectedWeek:'W2',previousVsWeek:vs1,previousDonationWeek:donations1,numberText:String}),dom=new JSDOM(html),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('[data-week-leader-metric]').length,6);assert.match(doc.body.textContent,/Mittelwert der vier Einzelränge/);
 assert.match(doc.body.textContent,/Power-Wachstum/);assert.match(doc.body.textContent,/Kill-Zuwachs/);assert.equal(doc.querySelectorAll('.native-week-leader').length,2);
 assert.match(doc.body.textContent,/Ø 1,5/);assert.doesNotMatch(doc.body.textContent,/Ø —/);
 assert.doesNotMatch(html,/undefined|NaN/);dom.window.close();
 const development=renderWeekLeaders(vs2,donations2,{metric:'development',trends,selectedWeek:'W2',previousVsWeek:vs1,previousDonationWeek:donations1,numberText:String});assert.match(development,/3\/4/);
});
