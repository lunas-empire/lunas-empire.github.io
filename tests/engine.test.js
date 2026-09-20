import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLIANCE_CONFIG } from '../assets/config.js';
import { guideState, checklistKey, armsWindow, availableTask, getGuideDate, resetInstant, seasonEventInstant, enemyBusterPhase } from '../assets/engine.js';
import { COPY, DAILY_GUIDES, TASKS } from '../assets/content.js';
import { todayPriorities } from '../assets/priority.js';
import { DAY_ONE_GROUP, SEASON_GUIDES, seasonTasks, seasonSynergies, upcoming } from '../assets/season.js';
import { createStorage, checkedMap } from '../assets/storage.js';
import { SEASON_COPY } from '../assets/season.js';
import { UI, resolveLanguagePreference } from '../assets/i18n.js';
const state=date=>guideState(new Date(date));
const cases=[
  ['2026-09-12T22:00:00+02:00',144,0,'PRE_SEASON'],
  ['2026-09-13T03:59:00+02:00',144,0,'PRE_SEASON'],
  ['2026-09-13T04:00:00+02:00',145,0,'PRE_SEASON'],
  ['2026-09-21T03:59:00+02:00',152,0,'PRE_SEASON'],
  ['2026-09-21T04:00:00+02:00',153,1,'SEASON_WEEK_1'],
  ['2026-09-24T04:00:00+02:00',156,4,'SEASON_WEEK_1'],
  ['2026-10-01T12:00:00+02:00',163,11,'SEASON_WEEK_2'],
  ['2026-11-16T04:00:00+01:00',209,57,'POST_SEASON'],
];
for (const [date,serverDay,seasonDay,phase] of cases) test(`date: ${date}`,()=>{
  const actual=state(date);assert.equal(actual.serverDay,serverDay);assert.equal(actual.seasonDay,seasonDay);assert.equal(actual.phase,phase);
});
test('all eight weeks and post season are calculated',()=>{
  for (let week=1;week<=8;week++) {
    const date=new Date(Date.parse('2026-09-21T12:00:00Z')+(week-1)*7*86400000);
    assert.equal(guideState(date).phase,`SEASON_WEEK_${week}`);
  }
});
test('DST fall-back and spring-forward use civil reset, not elapsed hours',()=>{
  assert.equal(state('2026-10-25T03:59:00+01:00').date,'2026-10-24');
  assert.equal(state('2026-10-25T04:00:00+01:00').date,'2026-10-25');
  assert.equal(state('2027-03-28T03:59:00+02:00').date,'2027-03-27');
  assert.equal(state('2027-03-28T04:00:00+02:00').date,'2027-03-28');
  assert.equal(resetInstant('2026-10-24').toISOString(),'2026-10-24T02:00:00.000Z');
  assert.equal(resetInstant('2026-10-25').toISOString(),'2026-10-25T03:00:00.000Z');
  assert.equal(seasonEventInstant(39).toISOString(),'2026-10-29T03:00:00.000Z');
});
test('test override and countdown',()=>{
  globalThis.__GUIDE_TEST_DATE__='2026-09-21T03:59:00+02:00';
  assert.equal(guideState(getGuideDate()).countdown,60000);
  delete globalThis.__GUIDE_TEST_DATE__;
  assert.equal(state('2026-09-21T04:00:00+02:00').countdown,0);
});
test('checklists reset at 04:00; VS does not leak into next week',()=>{
  const before=state('2026-09-13T03:59:00+02:00'),after=state('2026-09-13T04:00:00+02:00');
  assert.equal(checklistKey('daily',before),'rzsn-daily-2026-09-12');
  assert.equal(checklistKey('daily',after),'rzsn-daily-2026-09-13');
  assert.notEqual(checklistKey('vs',after),checklistKey('vs',state('2026-09-20T04:00:00+02:00')));
  assert.notEqual(checklistKey('season',state('2026-09-27T12:00:00Z')),checklistKey('season',state('2026-09-28T12:00:00Z')));
});
for (let day=0;day<7;day++) test(`weekday ${day}: arms, radar, stars, priorities`,()=>{
  const s=state(`2026-09-${13+day}T12:00:00+02:00`),guide=DAILY_GUIDES[s.weekday];
  assert.equal(s.weekdayIndex,day);
  const available=TASKS.filter(t=>availableTask(t,s)).map(t=>t.id);
  assert.equal(available.includes('star'),[2,3,6].includes(day));
  assert.equal(available.includes('radarClaim'),[1,3,5].includes(day));
  assert.equal(available.includes('radarSave'),[0,2,4].includes(day));
  assert.equal(available.includes('radarSaturday'),day===6);
  assert.equal(guide.arms?.start ?? null,[null,20,12,12,12,null,null][day]);
  const priorities=todayPriorities(s);
  assert.ok(priorities.length<=5);assert.equal(priorities.length,new Set(priorities.map(t=>t.id)).size);
  if (day===6) assert.ok(!priorities.some(priority=>priority.id==='shield'));
});
test('Enemy Buster banner follows the Friday and Saturday 04:00 resets',()=>{
  assert.equal(enemyBusterPhase(state('2026-09-18T03:59:00+02:00')),null);
  assert.equal(enemyBusterPhase(state('2026-09-18T04:00:00+02:00')),'upcoming');
  assert.equal(enemyBusterPhase(state('2026-09-19T03:59:00+02:00')),'upcoming');
  assert.equal(enemyBusterPhase(state('2026-09-19T04:00:00+02:00')),'active');
  assert.equal(enemyBusterPhase(state('2026-09-20T03:59:00+02:00')),'active');
  assert.equal(enemyBusterPhase(state('2026-09-20T04:00:00+02:00')),null);
});
test('Monday arms window crosses midnight without resetting server weekday',()=>{
  assert.equal(armsWindow(state('2026-09-14T19:59:00+02:00'),DAILY_GUIDES.monday),'later');
  assert.equal(armsWindow(state('2026-09-14T20:00:00+02:00'),DAILY_GUIDES.monday),'active');
  assert.equal(armsWindow(state('2026-09-15T00:00:00+02:00'),DAILY_GUIDES.monday),'ended');
});
test('season events and real synergies only',()=>{
  assert.ok(seasonSynergies(state('2026-09-24T12:00:00+02:00')).includes('kim'));
  assert.ok(seasonSynergies(state('2026-10-01T12:00:00+02:00')).includes('mason'));
  assert.ok(!seasonSynergies(state('2026-09-17T12:00:00+02:00')).includes('mason'));
  assert.equal(upcoming(state('2026-09-13T12:00:00+02:00'))[0].day,1);
  assert.equal(upcoming(state('2026-11-17T12:00:00+01:00')).length,0);
});
test('Day 1 and first 24 hours share one canonical task group',()=>{
  const dayOne=state('2026-09-21T04:00:00+02:00');
  assert.deepEqual(DAY_ONE_GROUP.tasks,['firstBlood','farms','vri']);
  assert.ok(DAY_ONE_GROUP.facts.includes('farmRate'));
  assert.ok(DAY_ONE_GROUP.facts.includes('resistanceCheck'));
  for (const id of DAY_ONE_GROUP.tasks) assert.ok(seasonTasks(dayOne).includes(id));
  assert.equal(upcoming(state('2026-09-13T12:00:00+02:00'),3,[DAY_ONE_GROUP.day]).some(event=>event.day===1),false);
});
test('leadership wins and suppresses conflicting task',()=>{
  const priorities=todayPriorities(state('2026-09-14T12:00:00+02:00'),{active:true,suppressTaskIds:['drone']});
  assert.equal(priorities[0].id,'notice');assert.ok(!priorities.some(t=>t.id==='drone'));
});
test('storage failure has in-memory fallback; corrupt checklists are safe',()=>{
  let failed=0;const storage=createStorage(()=>{throw new Error('blocked');},()=>failed++);
  storage.set('key',{done:true});assert.deepEqual(storage.get('key'),{done:true});assert.equal(failed,2);
  assert.deepEqual(checkedMap(null),{});assert.deepEqual(checkedMap(['oops']),{});
  assert.deepEqual(checkedMap({yes:true,no:false,bad:'true'}),{yes:true});
});
test('member image labels exist in every public language',()=>{
  for (const key of ['imageFarmsAlt','imageResistanceAlt','imageWeaponsAlt','imageSeasonDayOneAlt','imageVirusResearchAlt','imageProteinFarmAlt','imageSeasonTipsAlt','imageHint','imageLanguage']) {
    assert.equal(SEASON_COPY[key].length,7);assert.ok(SEASON_COPY[key].every(value=>value.trim()));
  }
});
test('guidance for unsure players exists in every public language',()=>{
  for (const key of ['starterTitle','starterIntro','starterToday','starterDaily','starterVs','dailyIntro','vsIntro','chooseSetup','setupPrompt','continue']) {
    assert.equal(UI[key].length,7);assert.ok(UI[key].every(value=>value.trim()));
  }
});
test('current alliance targets are encoded',()=>{
  assert.equal(ALLIANCE_CONFIG.vsDailyMinimum,3600000);
  assert.equal(COPY.tech1.length,7);
  assert.ok(COPY.tech1.every(value=>/20(?:[ .]|,)000/.test(value)));
});
test('Season 1 guide images are assigned to the relevant weeks',()=>{
  assert.deepEqual(SEASON_GUIDES.PRE_SEASON,['farms']);
  assert.deepEqual(SEASON_GUIDES.SEASON_WEEK_1,['season-day-one','season-virus-research','season-protein-farm','resistance','weapons']);
  assert.deepEqual(SEASON_GUIDES.SEASON_WEEK_2,['season-additional-tips','resistance']);
  assert.deepEqual(SEASON_GUIDES.SEASON_WEEK_3,['resistance','weapons']);
  assert.deepEqual(SEASON_GUIDES.SEASON_WEEK_6,['weapons']);
  assert.equal(SEASON_GUIDES.SEASON_WEEK_4,undefined);
});
test('first visits default to English and existing language choices persist',()=>{
  assert.deepEqual(resolveLanguagePreference(null,null),{lang:'en',needsSelection:true});
  assert.deepEqual(resolveLanguagePreference('de',null),{lang:'de',needsSelection:false});
  assert.deepEqual(resolveLanguagePreference('invalid','ja'),{lang:'ja',needsSelection:false});
});
