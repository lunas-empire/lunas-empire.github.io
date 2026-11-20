import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {buildDuelInsights,renderDuelInsights} from '../assets/officer-duel-insights.js';

const match=(status='final',verification='evidence_confirmed')=>({id:'m1',opponent_id:'o1',opponent_name_snapshot:'Opponent',opponent_tag_snapshot:'OPP',opponent_server_snapshot:1,iso_week:'W1',status,official_result:status==='final'?'win':null,verification_status:verification,days:[{day_index:1,result:'win',verification_status:'evidence_confirmed',our_score:0,opponent_score:0,evidence_id:'e1'},{day_index:2,result:'loss',verification_status:'unknown',our_score:10,opponent_score:20}]});
const data={matches:[match(),match('live','unconfirmed')]};

test('Duel insights include only confirmed final matches and verified daily results',()=>{
 const result=buildDuelInsights(data);assert.equal(result.summary.matches,1);assert.equal(result.summary.wins,1);
 assert.equal(result.days[0].our_score,0);assert.equal(result.days[0].known,1);assert.equal(result.days[1].known,0);assert.equal(result.opponents.length,1);
});

test('Duel insights render an honest empty state and confirmed evidence',()=>{
 const empty=renderDuelInsights({matches:[]},{numberText:String}),dom=new JSDOM(empty);assert.match(dom.window.document.body.textContent,/Noch keine bestätigten finalen Matches/);assert.ok(dom.window.document.querySelector('[data-native-dl-scroll-entry]'));dom.window.close();
 const html=renderDuelInsights(data,{numberText:String}),doc=new JSDOM(html).window.document;assert.equal(doc.querySelector('[data-native-dl-evidence="e1"]').textContent,'Beleg');assert.doesNotMatch(html,/undefined|NaN/);
});
