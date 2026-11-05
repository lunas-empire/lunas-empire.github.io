import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildUnifiedMetricTimeline,renderLwProfile,renderMembershipEvents,loadMemberActivity} from '../assets/native-admin.js';
const id='synthetic-member';
const days=Array.from({length:6},(_,weekday)=>({week:'2026-W44',weekday,points:0,quality:'observed'}));
const weeks=[{week:'2026-W44',state:'final'}];
const stat=(value,extra={})=>({week:'2026-W44',metric:'donations_weekly',quality:'observed',value,snapshot_id:'synthetic-sunday',captured_at:'2026-11-01T12:00:00Z',...extra});

test('six uniform selectors remain available without LW; weekly evidence uses existing routes',()=>{
 const stats=[stat(0)];
 for(const metric of ['power','drone','kills','hq','vs_results','donations_weekly']){
  const d=new JSDOM(renderLwProfile(null,id,metric,'all',stats,weeks,days)).window.document;
  assert.equal(d.querySelectorAll('[data-lw-kpi]').length,6);
  assert.equal(d.querySelector('[data-lw-kpi=total_troops]'),null);
  assert.equal(d.querySelector('[aria-pressed=true]').dataset.lwKpi,metric);
  if(metric==='vs_results'){
   assert.equal(d.querySelectorAll('[data-native-vs-image]').length,6);
   assert.equal(d.querySelectorAll('circle').length,1);
  }
  if(metric==='donations_weekly')assert.ok(d.querySelector('[data-native-stat-evidence="synthetic-sunday|'+id+'|donations_weekly"]'));
 }
});

test('VS requires final and six unambiguous observed/corrected days, preserves real zero',()=>{
 const timeline=(w=weeks,d=days)=>buildUnifiedMetricTimeline(null,id,'vs_results',[],w,d);
 assert.equal(timeline()[0].value,0);
 assert.equal(timeline([{...weeks[0],state:'provisional'}])[0].value,null);
 for(const d of [days.slice(1),[...days,days[0]],days.map((x,i)=>i?x:{...x,quality:'inferred',verified:true}),days.map((x,i)=>i?x:{...x,points:null})])assert.equal(timeline(weeks,d)[0].value,null);
});

test('donations choose one authoritative weekly value and retain originals; daily and foreign data excluded',()=>{
 const stats=[stat(10),stat(0,{quality:'corrected'}),stat(999,{member_id:'foreign'}),stat(999,{metric:'donations_daily'}),stat(null,{week:'2026-W45'})];
 const before=structuredClone(stats);
 const points=buildUnifiedMetricTimeline(null,id,'donations_weekly',stats);
 assert.deepEqual(points.map(p=>p.value),[0,null]);
 assert.equal(points[0].sources.length,2);
 assert.deepEqual(stats,before);
 const d=new JSDOM(renderLwProfile(null,id,'donations_weekly','all',stats)).window.document;
 assert.match(d.querySelector('[data-lw-kpi=donations_weekly]').textContent,/Vergleich nicht erfasst/);
});

test('membership history escapes original source fields without assigning an officer',()=>{
 const d=new JSDOM(renderMembershipEvents([{recorded_at:'2026-11-01',event:'<join>',previous:'<old>',current:'<new>'}])).window.document;
 assert.equal(d.querySelectorAll('join,old,new').length,0);
 assert.match(d.body.textContent,/<join>.*<old>.*<new>/s);
 assert.doesNotMatch(d.body.textContent,/Officer|Akteur/);
 assert.match(renderMembershipEvents([]),/Keine Mitgliedschaftsereignisse/);
});

test('member activity exposes loading, scoped success, empty and API error honestly',async()=>{
 const holder=new JSDOM('<div id="history"></div>').window.document.querySelector('div');
 let resolve;
 const pending=loadMemberActivity(holder,id,url=>{assert.equal(url,'/api/activity?limit=100&member_id='+id);return new Promise(r=>{resolve=r})});
 assert.match(holder.textContent,/geladen/);
 resolve([{actor:'<Officer>',action:'rank',at:'2026-11-01T12:00:00Z',member_id:id},{actor:'Foreign',member_id:'other'}]);
 await pending;
 assert.match(holder.textContent,/<Officer>/);assert.doesNotMatch(holder.textContent,/Foreign/);assert.equal(holder.querySelector('Officer'),null);
 await loadMemberActivity(holder,id,async()=>[]);assert.match(holder.textContent,/Keine Verwaltungsänderungen/);
 await loadMemberActivity(holder,id,async()=>{throw Error('private server detail')});
 assert.match(holder.textContent,/konnte nicht geladen/);assert.doesNotMatch(holder.textContent,/private server detail/);
});
