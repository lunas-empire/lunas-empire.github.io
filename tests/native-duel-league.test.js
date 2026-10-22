import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {DUEL_DAY_WEIGHTS,createDuelLeagueController,matchPayload,normalizeDuelLeague,renderDuelLeague,snapshotPayload} from '../assets/native-duel-league.js';
import {DUEL_COPY,DUEL_ENUM_KEYS,DUEL_LANGUAGES} from '../assets/native-duel-league-i18n.js';
import {clearOfficer,initNativeAdmin,renderNativeAdmin} from '../assets/native-admin.js';

const uuid='12345678-1234-4234-8234-123456789abc';
const sample={
 day_weights:DUEL_DAY_WEIGHTS,total_weight:13,
 matches:[{id:'match-1',iso_week:'2026-W43',revision:2,cycle_label:'S38',league_round:1,
  opponent_tag_snapshot:'BAD',opponent_name_snapshot:'<img src=x onerror=alert(1)>',opponent_server_snapshot:2261,
  interim_our_wins:1,interim_opponent_wins:0,status:'live',official_result:null,confirmed_vp:1,opponent_confirmed_vp:0,
  days:DUEL_DAY_WEIGHTS.map((vp_weight,index)=>({day_index:index+1,vp_weight,our_score:index?null:123,opponent_score:null,result:index?'unknown':'win'}))}],
 leagues:[{id:'league-1',cycle_label:'S38',starts_week:'2026-W43',ends_week:'2026-W46',tier:'silver',raw_tier_label:'Silber'}],
 snapshots:[{id:'snapshot-1',league_id:'league-1',league_round:1,captured_at:'2026-10-20T12:00:00.000Z',coverage_status:'partial',rows:[
  {rank_number:1,alliance_tag:'RZSN',alliance_name:'RisingSun',server_number:2261,week1_result:'unknown',week2_result:'upcoming',week3_result:'upcoming',week4_result:'upcoming'}]}],
 evidence:[{id:uuid,evidence_kind:'match_week',scope_key:'2026-W43',image_order:1}],
 proposals:[{id:uuid,proposal_kind:'match_week',scope_key:'2026-W44',evidence_ids:[uuid],status:'pending',proposal:{
  opponent:{tag:'ZKL',name:'RESORT AND SPA',server_number:2261},interim_our_wins:1,interim_opponent_wins:0,status:'live',official_result:null,
  days:DUEL_DAY_WEIGHTS.map((vp_weight,index)=>({day_index:index+1,vp_weight,our_score:null,opponent_score:null,result:'unknown'}))}}]
};

const makeMatchForm=()=>{
 const dom=new JSDOM(renderDuelLeague(sample,'en'));
 const form=dom.window.document.querySelector('.native-dl-match-form');
 form.elements.iso_week.value='2026-W43';form.elements.revision.value='0';form.elements.reason.value='Manual correction';
 form.elements.cycle_label.value='S38';form.elements.starts_week.value='2026-W43';form.elements.ends_week.value='2026-W46';
 form.elements.tier.value='silver';form.elements.raw_tier_label.value='Silber';form.elements.league_round.value='1';
 form.elements.opponent_tag.value='ZKL';form.elements.opponent_name.value='RESORT AND SPA';form.elements.server_number.value='2261';
 form.elements.status.value='live';form.elements.interim_our_wins.value='1';form.elements.interim_opponent_wins.value='0';
 return {dom,form};
};

test('renders exact overview safely in DE and EN without a backend-pending warning',()=>{
 const data=normalizeDuelLeague(sample);
 assert.deepEqual(data.matches[0].days.map(day=>day.vp_weight),DUEL_DAY_WEIGHTS);assert.equal(data.matches[0].days[1].our_score,null);
 const de=renderDuelLeague(sample,'de');
 assert.doesNotMatch(de,/<img src=x/);assert.match(de,/&lt;img src=x onerror=alert\(1\)&gt;/);
 assert.match(de,/1:0 ist nur ein Zwischenstand/);assert.doesNotMatch(de,/Backend-Freigabe/);
 const en=renderDuelLeague(sample,'en');assert.match(en,/Historic 4-week leagues/);assert.match(en,/Duel &amp; League/);assert.doesNotMatch(en,/Duellverlauf|Unbekannt/);
});

test('all 15 languages have complete native copy and localized enum displays without changing values or player data',()=>{
 const expectedTextKeys=Object.keys(DUEL_COPY.en).filter(key=>!['dayNames','enums'].includes(key));
 assert.deepEqual(Object.keys(DUEL_COPY),DUEL_LANGUAGES);
 for(const language of DUEL_LANGUAGES){
  const copy=DUEL_COPY[language];
  assert.deepEqual(Object.keys(copy).filter(key=>!['dayNames','enums'].includes(key)),expectedTextKeys,language+' text coverage');
  assert.deepEqual(Object.keys(copy.enums),DUEL_ENUM_KEYS,language+' enum coverage');
  assert.equal(copy.dayNames.length,6,language+' day coverage');
  assert.ok([...expectedTextKeys.map(key=>copy[key]),...copy.dayNames,...Object.values(copy.enums)].every(value=>typeof value==='string'&&value.trim()),language+' blank copy');
  if(!['de','en'].includes(language)){
   for(const key of ['title','intro','current','manual','saveMatch','readError','noPrediction'])assert.notEqual(copy[key],DUEL_COPY.en[key],language+'/'+key+' English fallback');
   for(const key of ['unknown','win','loss','tie','upcoming','scheduled','unverified','final','silver','diamond','partial','promoted','relegated','match_week','league_scroll'])assert.notEqual(copy.enums[key],key,language+'/'+key+' raw enum');
  }
  const dom=new JSDOM(renderDuelLeague(sample,language));
  const root=dom.window.document.querySelector('.native-dl');
  assert.equal(root.lang,language);assert.equal(root.dir,language==='ar'?'rtl':'ltr');
  assert.match(root.textContent,/<img src=x onerror=alert\(1\)>/,'escaped alliance/player data must remain verbatim text');
  assert.equal(root.querySelector('[name=tier] option[value=silver]').textContent,copy.enums.silver);
  assert.equal(root.querySelector('[name=status] option[value=live]').textContent,copy.enums.live);
  assert.equal(root.querySelector('[name=result_1] option[value=win]').textContent,copy.enums.win);
  assert.equal(root.querySelector('[name=official_outcome] option[value=promoted]').textContent,copy.enums.promoted);
  assert.match(root.querySelector('.native-dl-match summary').textContent,new RegExp(copy.enums.live));
  assert.match(root.querySelector('.native-dl-league summary').textContent,new RegExp(copy.enums.partial));
  assert.match(root.querySelector('.native-dl-proposal strong').textContent,new RegExp(copy.enums.match_week));
  assert.equal(root.querySelector('[name=tier] option:checked').value,'silver');
  assert.equal(root.querySelector('[name=status] option:checked').value,'live');
  dom.window.close();
 }
});

test('match payload uses backend keys, six exact days, null blanks, and never finalizes 1:0 live',()=>{
 const {dom,form}=makeMatchForm();form.elements.our_score_1.value='0';
 const payload=matchPayload(form,()=> 'duel-1234567890abcdef');
 assert.deepEqual(Object.keys(payload),['idempotency_key','iso_week','revision','reason','league','league_round','opponent','status','official_result','interim_our_wins','interim_opponent_wins','days']);
 assert.deepEqual(payload.league,{cycle_label:'S38',starts_week:'2026-W43',ends_week:'2026-W46',tier:'silver',raw_tier_label:'Silber'});
 assert.deepEqual(payload.opponent,{tag:'ZKL',name:'RESORT AND SPA',server_number:2261});
 assert.equal(payload.status,'live');assert.equal(payload.official_result,null);assert.equal(payload.days.length,6);
 assert.deepEqual(payload.days[0],{day_index:1,vp_weight:1,our_score:0,opponent_score:null,result:'unknown'});
 assert.equal(payload.days[5].vp_weight,4);assert.equal('own_score' in payload.days[0],false);assert.equal('server' in payload,false);
 dom.window.close();
});

test('snapshot payload matches backend contract and preserves editable four-week results',()=>{
 const dom=new JSDOM(renderDuelLeague(sample,'en'));const form=dom.window.document.querySelector('.native-dl-snapshot-form');
 form.elements.cycle_label.value='S38';form.elements.league_round.value='1';form.elements.captured_at.value='2026-10-20T12:00';
 form.elements.reason.value='Manual scroll review';form.elements.expected_rank_count.value='16';
 form.elements.rank_number.value='1';form.elements.alliance_tag.value='RZSN';form.elements.alliance_name.value='RisingSun';form.elements.server_number.value='2261';
 form.elements.week_1.value='unknown';form.elements.week_2.value='upcoming';form.elements.week_3.value='upcoming';form.elements.week_4.value='upcoming';
 const payload=snapshotPayload(form,()=> 'duel-1234567890abcdef');
 assert.deepEqual(Object.keys(payload),['idempotency_key','cycle_label','league_round','captured_at','reason','expected_rank_count','official_snapshot','official_outcome','evidence_ids','rows']);
 assert.deepEqual(payload.rows,[{rank_number:1,alliance_tag:'RZSN',alliance_name:'RisingSun',server_number:2261,week_results:['unknown','upcoming','upcoming','upcoming']}]);
 assert.match(payload.captured_at,/[zZ]|[+-]\d\d:\d\d$/);assert.equal(payload.official_snapshot,false);assert.equal(payload.official_outcome,null);dom.window.close();
});

test('proposal review fills an editable form and confirms only through saveMatch',async t=>{
 const dom=new JSDOM('<main id="root"></main>',{url:'https://example.test'});t.after(()=>dom.window.close());
 const calls=[],root=dom.window.document.querySelector('#root');
 const api={read:async()=>sample,saveMatch:async payload=>calls.push(['match',payload]),saveLeagueSnapshot:async()=>{},uploadEvidence:async()=>{},createOcrProposal:async()=>{},loadEvidence:async()=>new Blob()};
 const controller=createDuelLeagueController({root,api,language:'en',cryptoRef:webcrypto});await controller.load();
 root.querySelector('[data-native-dl-review-proposal]').click();const form=root.querySelector('.native-dl-match-form');
 assert.equal(form.elements.proposal_id.value,uuid);assert.equal(form.elements.opponent_tag.value,'ZKL');assert.equal(calls.length,0);
 form.elements.reason.value='Reviewed OCR values';form.elements.cycle_label.value='S38';form.elements.starts_week.value='2026-W43';form.elements.ends_week.value='2026-W46';form.elements.tier.value='silver';form.elements.league_round.value='1';
 form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(calls[0][0],'match');assert.equal(calls[0][1].proposal_id,uuid);assert.deepEqual(calls[0][1].days.map(day=>day.evidence_id),Array(6).fill(uuid));controller.destroy();
});


test('Zentrale captures appear without any screenshot or text upload UI',()=>{
 const incoming={
  ...sample,capture_sessions:[{kind:'duel',scope_key:'2026-W43',
    captured_at:'2026-10-22T10:00:00Z',source_count:1,agreement:'agreed',
    parsed:{opponent:{tag:'BAD',name:'<img src=x onerror=alert(1)>'},
     interim_our_wins:1,interim_opponent_wins:0,official_result:null}}]
 };
 const dom=new JSDOM(renderDuelLeague(incoming,'de'));
 assert.equal(dom.window.document.querySelector('input[type=file]'),null);
 assert.equal(dom.window.document.querySelector('.native-dl-upload-form'),null);
 assert.equal(dom.window.document.querySelector('.native-dl-capture')!==null,true);
 assert.match(dom.window.document.body.textContent,/Zentrale/);
 assert.match(dom.window.document.body.textContent,/Nicht offiziell bestätigt/);
 assert.doesNotMatch(dom.window.document.body.innerHTML,/<img src=x onerror/);
 assert.match(dom.window.document.body.innerHTML,/&lt;img src=x onerror/);
 dom.window.close();
});

test('Zentrale OCR is editable but never marks a match official without officer confirmation',async t=>{
 const key='c'.repeat(64),dom=new JSDOM('<main id="root"></main>',{url:'https://example.test'});
 t.after(()=>dom.window.close());
 const root=dom.window.document.querySelector('#root'),calls=[];
 const incoming={...sample,capture_sessions:[{idempotency_key:key,kind:'duel',
  scope_key:'2026-W43',source_count:1,agreement:'agreed',
  captured_at:'2026-10-22T10:00:00Z',parsed:{opponent:{tag:'ABC',name:'Other Alliance',server_number:999},
   interim_our_wins:1,interim_opponent_wins:0,official_result:null}}]};
 const controller=createDuelLeagueController({root,api:{read:async()=>incoming,saveMatch:async payload=>calls.push(payload)},language:'en'});
 await controller.load();
 root.querySelector('[data-native-dl-review-capture]').click();
 const form=root.querySelector('.native-dl-match-form');
 assert.equal(form.elements.opponent_tag.value,'ABC');
 assert.equal(form.elements.opponent_name.value,'Other Alliance');
 assert.equal(form.elements.iso_week.value,'2026-W43');
 assert.equal(form.elements.status.value,'unverified');
 assert.equal(form.elements.official_result.value,'');
 assert.equal(calls.length,0);
 controller.destroy();
});
