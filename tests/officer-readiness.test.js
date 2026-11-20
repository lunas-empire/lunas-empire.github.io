import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildReadinessComparison,renderReadiness} from '../assets/officer-readiness.js';

const metric=(total,median,verified=2)=>({total,median,verified,coverage:100,p25:median,p75:median,min:0,max:total});
const data={active:2,batches:[
 {id:'new',report_date:'2026-11-15',verified:2,coverage:100,metrics:{power:metric(400,200),army_power:metric(0,0)},profession:{verified:2,values:[{value:'Engineer',count:2}]}},
 {id:'old',report_date:'2026-11-08',verified:2,coverage:100,metrics:{power:metric(200,100),army_power:metric(0,0)},profession:{verified:0,values:[]}}
]};

test('Readiness compares only known totals and medians and preserves real zeroes',()=>{
 const comparison=buildReadinessComparison(data,'power');assert.equal(comparison.totalDelta,200);assert.equal(comparison.medianDelta,100);
 const zero=buildReadinessComparison(data,'army_power');assert.equal(zero.totalDelta,0);assert.equal(zero.latest.metrics.army_power.total,0);
 assert.equal(buildReadinessComparison(data,'unknown').metric,null);
});

test('Readiness renders distribution, coverage and professions without coordinates or fabricated thresholds',()=>{
 const html=renderReadiness(data,{numberText:String}),dom=new JSDOM(html),text=dom.window.document.body.textContent;
 assert.match(text,/\+200/);assert.match(text,/Engineer/);assert.match(text,/2\/2/);assert.match(text,/Keine Koordinaten/);
 assert.doesNotMatch(html,/Coords|undefined|NaN/);dom.window.close();
 const one=renderReadiness({active:1,batches:[data.batches[0]]},{numberText:String});assert.match(one,/Kein Vergleich/);
});
