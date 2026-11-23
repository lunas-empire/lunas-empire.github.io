import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {memberCohortStats,summarizeCohort,renderCohortCompare} from '../assets/officer-cohort-compare.js';

const data={
 members:[{id:'a',name:'Alpha',rank:'R3',status:'active',power:100,kills:0},{id:'b',name:'Bravo',rank:'R2',status:'active',power:300,kills:null},{id:'f',name:'Former',status:'former',power:999,kills:999}],
 vs:{weeks:[{week:'W1',state:'final',threshold:100,members:[
  {id:'a',days:[{verified:true,points:100},{verified:true,points:0}]},
  {id:'b',days:[{verified:true,points:100},{verified:false,points:0}]},
  {id:'f',former:true,days:[{verified:true,points:100}]}
 ]}]},
 donations:{weeks:[{week:'W1',members:[{id:'a',points:0,status:'below'},{id:'b',points:20000,status:'met'},{id:'f',points:20000,status:'met'}]}]}
};

test('Cohort metrics preserve zeroes, exclude former and keep unknown denominators out',()=>{
 assert.equal(memberCohortStats('a',data).vsKnown,2);assert.equal(memberCohortStats('a',data).vsMet,1);
 const group=summarizeCohort(['a','b','f'],data);
 assert.equal(group.size,2);assert.equal(group.vs.known,3);assert.equal(group.vs.met,2);assert.equal(group.vs.percent,67);
 assert.equal(group.donations.known,2);assert.equal(group.donations.met,1);assert.equal(group.power.total,400);assert.equal(group.kills.known,1);assert.equal(group.kills.total,0);
});

test('Cohort view renders accessible A/B choices, member evidence and small-group warning',()=>{
 const html=renderCohortCompare(data,{A:['a'],B:['b'],sort:'problem'},{numberText:String}),dom=new JSDOM(html),doc=dom.window.document;
 assert.equal(doc.querySelectorAll('[data-cohort-pick]').length,4);assert.equal(doc.querySelector('[data-cohort-pick="A:a"]').getAttribute('aria-pressed'),'true');
 assert.equal(doc.querySelectorAll('.native-cohort-summary [data-native-member]').length,2);assert.match(doc.body.textContent,/Kleine Gruppe/);
 assert.doesNotMatch(html,/Former|undefined|NaN/);dom.window.close();
});
