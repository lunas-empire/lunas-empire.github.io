import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {renderDataQuality} from '../assets/officer-data-quality.js';

const result={
 sources:{profile:{week:'2026-W46',captured_at:'2026-11-15T10:00:00Z',is_complete:0},vs:{week:'2026-W46',state:'final'},lw:{report_date:'2026-11-15',created_at:'2026-11-15T11:00:00Z'}},
 coverage:{open_reviews:2,unverified_aliases:1,unmatched_lw:3,pending_protocol:4,generic_protocol:5,incomplete_days:[{weekday:0,n:2}]},
 registry_conflicts:[{id:'member-1',status:'active',lifecycle:'former'}],
 anomalies:[{member_id:'member-1',metric:'power',previous_value:100000,current_value:250000,absolute_change:150000,percent_change:150}]
};
const operations={members:[{id:'member-1',name:'Synthetic Member'}]};

test('Data quality view links every issue to its actual workflow and preserves uncertainty',()=>{
 const html=renderDataQuality(result,operations,{numberText:String});
 const dom=new JSDOM(html),doc=dom.window.document;
 assert.equal(doc.querySelector('[data-native-action="review-open"]').textContent.includes('2'),true);
 assert.equal(doc.querySelector('[data-officer-tab="lwImport"]').textContent.includes('3'),true);
 assert.equal(doc.querySelector('[data-officer-tab="watch"]').textContent.includes('1'),true);
 assert.equal(doc.querySelector('[data-officer-tab="reviews"]').textContent.includes('4'),true);
 assert.equal(doc.querySelector('[data-officer-tab="events"]').textContent.includes('5'),true);
 assert.match(doc.body.textContent,/kein vollständiger Roster/);
 assert.match(doc.body.textContent,/100000 → 250000/);
 assert.match(doc.body.textContent,/active ↔ former/);
 assert.equal(doc.querySelectorAll('[data-native-member="member-1"]').length,2);
 assert.doesNotMatch(html,/undefined/);
 dom.window.close();
});

test('Data quality person buttons wrap their evidence instead of clipping on mobile',async()=>{
 const css=await readFile(new URL('../assets/hub.css',import.meta.url),'utf8');
 assert.match(css,/\.native-quality-person\{[^}]*white-space:normal/);
 assert.match(css,/\.native-quality-person>button\{[^}]*display:grid;[^}]*white-space:normal/);
});
