import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildAllianceTrendSeries,renderAllianceTrends} from '../assets/officer-alliance-trends.js';

const metric=(total,verified=2,coverage=100)=>({total,median:total===null?null:total/2,verified,coverage});
const trends={active:2,weeks:[
 {week:'2026-W45',captured_at:'2026-11-08',is_complete:true,metrics:{power:metric(200),kills:metric(0),donations_weekly:metric(10000)}},
 {week:'2026-W46',captured_at:'2026-11-15',is_complete:false,metrics:{power:metric(400),kills:metric(0,1,50),donations_weekly:metric(20000)}}
]};
const vs={weeks:[
 {week:'2026-W45',dayTotals:[{passed:1,failed:1,unknown:0}]},
 {week:'2026-W46',dayTotals:[{passed:2,failed:0,unknown:1}]}
]};

test('Alliance trend series uses confirmed denominators and preserves zeroes and unknowns',()=>{
 const points=buildAllianceTrendSeries(trends,vs,'2');
 assert.equal(points.length,2);assert.equal(points[0].vs.percent,50);assert.equal(points[1].vs.percent,100);
 assert.equal(points[1].vs.unknown,1);assert.equal(points[1].metrics.kills.total,0);assert.equal(points[1].metrics.kills.verified,1);
 assert.equal(buildAllianceTrendSeries(trends,vs,'previous').length,2);
});

test('Alliance trend rendering shows deltas, partial captures and no false zero fallback',()=>{
 const html=renderAllianceTrends(trends,vs,{range:'all',numberText:String}),dom=new JSDOM(html),text=dom.window.document.body.textContent;
 assert.match(text,/\+200 seit 2026-W45/);assert.match(text,/Teilaufnahme/);assert.match(text,/100%/);
 assert.match(text,/1\/2 bestätigt · 50%/);assert.match(html,/data-native-review-week="2026-W46" data-native-review-kind="profile" data-native-review-metric="kills"/);
 assert.doesNotMatch(html,/undefined|NaN/);dom.window.close();
 const single=renderAllianceTrends({weeks:[trends.weeks[1]]},{weeks:[vs.weeks[1]]},{numberText:String});assert.match(single,/Kein Vergleich/);
 const empty=renderAllianceTrends({weeks:[]},{weeks:[]},{numberText:String});assert.match(empty,/Noch keine/);
});
