import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildRewardFairness,renderRewardFairness} from '../assets/officer-reward-fairness.js';

const members=[{id:'a',name:'Alpha',rank:'R3',status:'active'},{id:'b',name:'Bravo',rank:'R2',status:'active'},{id:'f',name:'Former',status:'former'}];
const trains={vip_passengers:[{ride_date:'2026-11-11',vip_member_id:'a'},{ride_date:'2026-11-12',vip_member_id:'f'},{ride_date:'2026-11-13',vip_member_id:null}]};
const dice=[{ride_date:'2026-11-11',winner_id:'a'},{ride_date:'2026-11-12',winner_id:'f'}];

test('Reward fairness separates VIP and dice and excludes former IDs',()=>{
 const model=buildRewardFairness(trains,dice,members);
 assert.equal(model.summary.vipRecords,1);assert.equal(model.summary.diceRecords,1);assert.equal(model.summary.active,2);assert.equal(model.summary.completeRound,false);
 assert.equal(model.rows.find(row=>row.id==='a').vipLast,'2026-11-11');assert.equal(model.rows.find(row=>row.id==='b').vipCount,0);
 assert.equal(buildRewardFairness({vip_passengers:[{ride_date:'2026-11-11',vip_member_id:'a'},{ride_date:'2026-11-12',vip_member_id:'b'}]},[{ride_date:'2026-11-11',winner_id:'a'},{ride_date:'2026-11-12',winner_id:'b'}],members.slice(0,2)).summary.completeRound,true);
});

test('Reward fairness renders thin history honestly with member evidence links',()=>{
 const html=renderRewardFairness(trains,dice,members,{numberText:String}),dom=new JSDOM(html),doc=dom.window.document;
 assert.match(doc.body.textContent,/keine belastbare Fairnesswertung/);assert.equal(doc.querySelectorAll('[data-native-member]').length,2);
 assert.doesNotMatch(html,/Former|undefined|NaN/);dom.window.close();
});
