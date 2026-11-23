import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {filterEventInsights,renderEventInsights} from '../assets/officer-event-insights.js';

const data={runs:[
 {id:'open',event_type:'marshall_guard',event_date:'2026-11-20',outcome:'scheduled',level:99},
 {id:'done',event_type:'zombie_siege',event_date:'2026-11-19',outcome:'completed',level:7,attendance:0},
 {id:'failed',event_type:'zombie_siege',event_date:'2026-11-18',outcome:'failed',level:6,attendance:10}
],series:[{id:'done',event_type:'zombie_siege',event_date:'2026-11-19',outcome:'completed',level:7,attendance:0}]};

test('Event insight filters retain only selected runs and completed series',()=>{
 const filtered=filterEventInsights(data,'zombie_siege','all');
 assert.equal(filtered.summary.total,2);assert.equal(filtered.summary.completed,1);assert.equal(filtered.series.length,1);
 assert.equal(filterEventInsights(data,'all','30').summary.total,3);
});

test('Event insight rendering preserves zero attendance and links real records without player rankings',()=>{
 const html=renderEventInsights(data,{numberText:String}),dom=new JSDOM(html),text=dom.window.document.body.textContent;
 assert.match(text,/Teilnahme 0/);assert.match(text,/Einzelteilnahme ist nicht erfasst/);
 assert.equal(dom.window.document.querySelector('[data-native-edit="done"]').textContent,'Eintrag öffnen');
 assert.doesNotMatch(html,/undefined|NaN/);dom.window.close();
});
