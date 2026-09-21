import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLIANCE_CONFIG } from '../assets/config.js';
import { guideState, checklistKey, armsWindow, availableTask, getGuideDate, resetInstant, seasonEventInstant, enemyBusterPhase } from '../assets/engine.js';
import { COPY, DAILY_GUIDES, TASKS } from '../assets/content.js';
import { todayPriorities } from '../assets/priority.js';
import { DAY_ONE_GROUP, SEASON_GUIDES, seasonTasks, seasonSynergies, seasonDailyTasks, seasonTodayTasks, seasonContext, isSeasonDailyTask, upcoming } from '../assets/season.js';
import { createStorage, checkedMap } from '../assets/storage.js';
import { SEASON_COPY } from '../assets/season.js';
import { UI, LANGUAGES, LOCALES, resolveLanguagePreference, translate } from '../assets/i18n.js';
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
  assert.equal(guide.arms?.start ?? null,[null,16,8,8,8,null,null][day]);
  const priorities=todayPriorities(s);
  assert.ok(priorities.length<=5);assert.equal(priorities.length,new Set(priorities.map(t=>t.id)).size);
  if (day===6) assert.ok(!priorities.some(priority=>priority.id==='shield'));
});
test('Enemy Buster banner follows the Friday and Saturday 00:00 ST resets',()=>{
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
test('season milestones and recurring event days follow the verified Season 1 timeline',()=>{
  const day4=seasonSynergies(state('2026-09-24T12:00:00+02:00'));
  assert.ok(day4.includes('kim'));
  assert.ok(day4.includes('cityCall'));
  const day9=seasonSynergies(state('2026-09-29T12:00:00+02:00'));
  assert.ok(day9.includes('legion'));
  const day11=seasonSynergies(state('2026-10-01T12:00:00+02:00'));
  assert.ok(day11.includes('wishHero'));
  assert.ok(day11.includes('cityCall'));
  assert.ok(!day11.includes('mason'));
  const firstCrossWarSaturday=seasonSynergies(state('2026-10-10T12:00:00+02:00'));
  assert.ok(firstCrossWarSaturday.includes('crossWarzoneSaturday'));
  assert.ok(!firstCrossWarSaturday.includes('declarationDay'));
  const firstDeclarationThursday=seasonSynergies(state('2026-10-15T12:00:00+02:00'));
  assert.ok(firstDeclarationThursday.includes('declarationDay'));
  const declarationSaturday=seasonSynergies(state('2026-10-17T12:00:00+02:00'));
  assert.ok(declarationSaturday.includes('declarationDay'));
  assert.ok(declarationSaturday.includes('crossWarzoneSaturday'));
  assert.equal(upcoming(state('2026-09-13T12:00:00+02:00'))[0].day,1);
  assert.equal(upcoming(state('2026-11-17T12:00:00+01:00')).length,0);
});
test('Day 1 and first 24 hours share one canonical task group',()=>{
  const dayOne=state('2026-09-21T04:00:00+02:00');
  assert.deepEqual(DAY_ONE_GROUP.tasks,['pass','firstBlood','farms','vri','profession','pumpkinLikes']);
  assert.ok(DAY_ONE_GROUP.facts.includes('farmRate'));
  assert.ok(DAY_ONE_GROUP.facts.includes('resistanceCheck'));
  assert.ok(DAY_ONE_GROUP.facts.includes('profession'));
  for (const id of DAY_ONE_GROUP.tasks) assert.ok(seasonTasks(dayOne).includes(id));
  assert.ok(seasonTasks(dayOne).includes('profession'),'Profession Hall reminder is present on Season Day 1');
  assert.ok(seasonTasks(dayOne).includes('pumpkinLikes'),'Pumpkin likes task is present on Season Day 1');
  const laterSeason=state('2026-10-10T12:00:00+02:00');
  assert.ok(seasonTasks(laterSeason).includes('profession'),'Profession Hall reminder stays active on later Season days');
  assert.ok(seasonTasks(laterSeason).includes('pumpkinLikes'),'Pumpkin likes task stays active on later Season days');
  for (const lang of Object.keys(LANGUAGES)) {
    const text=translate(SEASON_COPY,'pumpkinLikes',lang);
    assert.ok(text.trim(),`pumpkinLikes [${lang}]`);
    assert.match(text,/10/,`pumpkinLikes count [${lang}]`);
  }
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
    for (const lang of Object.keys(LANGUAGES)) assert.ok(translate(SEASON_COPY,key,lang).trim(),`${key} [${lang}]`);
  }
});
test('guidance for unsure players exists in every public language',()=>{
  for (const key of ['starterTitle','starterIntro','starterToday','starterDaily','starterVs','dailyIntro','vsIntro','chooseSetup','setupPrompt','continue']) {
    for (const lang of Object.keys(LANGUAGES)) assert.ok(translate(UI,key,lang).trim(),`${key} [${lang}]`);
  }
});
test('current alliance targets are encoded',()=>{
  assert.equal(ALLIANCE_CONFIG.vsDailyMinimum,3600000);
  assert.equal(Object.keys(LANGUAGES).length,15);
  assert.match(LOCALES.th,/u-ca-gregory/);
  assert.match(LOCALES.km,/u-ca-gregory/);
  for (const lang of Object.keys(LANGUAGES)) assert.match(translate(COPY,'tech1',lang),/20(?:[ .]|,)000/);
});
test('Season 1 guide images are assigned to the relevant weeks',()=>{
  assert.deepEqual(SEASON_GUIDES.PRE_SEASON,['farms']);
  assert.deepEqual(SEASON_GUIDES.SEASON_WEEK_1,['season-day-one','season-virus-research','season-protein-farm','resistance','weapons']);
  assert.deepEqual(SEASON_GUIDES.SEASON_WEEK_2,['season-additional-tips','resistance']);
  assert.deepEqual(SEASON_GUIDES.SEASON_WEEK_3,['resistance','weapons']);
  assert.deepEqual(SEASON_GUIDES.SEASON_WEEK_6,['weapons']);
  assert.equal(SEASON_GUIDES.SEASON_WEEK_4,undefined);
});
test('first visits default to English and saved language choices persist',()=>{
  assert.deepEqual(resolveLanguagePreference(null,null),{lang:'en',needsSelection:true});
  assert.deepEqual(resolveLanguagePreference(null,null,'de'),{lang:'en',needsSelection:true});
  assert.deepEqual(resolveLanguagePreference('de',null,'ja'),{lang:'de',needsSelection:false});
  assert.deepEqual(resolveLanguagePreference('ar',null),{lang:'ar',needsSelection:false});
  assert.deepEqual(resolveLanguagePreference('ko',null),{lang:'ko',needsSelection:false});
  assert.deepEqual(resolveLanguagePreference('nl',null),{lang:'nl',needsSelection:false});
  assert.deepEqual(resolveLanguagePreference('th',null),{lang:'th',needsSelection:false});
  assert.deepEqual(resolveLanguagePreference('km',null),{lang:'km',needsSelection:false});
  assert.deepEqual(resolveLanguagePreference('fil',null),{lang:'fil',needsSelection:false});
  assert.deepEqual(resolveLanguagePreference('invalid','ja','de'),{lang:'ja',needsSelection:false});
});
test('Day 1 season purchase recommendation uses the current three prices',()=>{
  assert.ok(DAY_ONE_GROUP.tasks.includes('pass'));
  for (const lang of Object.keys(LANGUAGES)) {
    const text=translate(SEASON_COPY,'pass',lang);
    assert.match(text,/1[ .,Â ]?000/,lang);
    assert.match(text,/2[ .,Â ]?000/,lang);
    assert.ok(/Gold Bricks/i.test(text),lang);
  }
  const de=translate(SEASON_COPY,'pass','de');
  assert.ok(de.includes('Season-Wochenpass'));
  assert.ok(de.includes('1.000 Diamanten'));
  assert.ok(de.includes('1.000 Gold Bricks'));
  assert.ok(de.includes('2.000 Gold Bricks'));
  assert.doesNotMatch(de,/Optional fÃ¼r Farm 5/);
});
test('10 Pumpkin Skin likes are a daily Season checklist task',()=>{
  const dayOne=state('2026-09-21T08:00:00+02:00');
  const later=state('2026-10-10T12:00:00+02:00');
  const pre=state('2026-09-20T12:00:00+02:00');
  const post=state('2026-11-16T12:00:00+01:00');
  assert.ok(seasonTasks(dayOne).includes('pumpkinLikes'));
  assert.ok(seasonTasks(later).includes('pumpkinLikes'));
  assert.ok(!seasonTasks(pre).includes('pumpkinLikes'));
  assert.ok(!seasonTasks(post).includes('pumpkinLikes'));
  assert.notEqual(checklistKey('seasonDaily',dayOne),checklistKey('seasonDaily',state('2026-09-22T08:00:00+02:00')));
  for (const lang of Object.keys(LANGUAGES)) {
    const text=translate(SEASON_COPY,'pumpkinLikes',lang);
    assert.ok(text.trim(),lang);
    assert.match(text,/10/,lang);
  }
});


test('adding Pumpkin likes preserves existing user checklist state across an update reload',()=>{
  const s=state('2026-09-21T08:00:00+02:00');
  const data=new Map();
  const provider={
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>data.set(key,value),
  };
  const beforeUpdate=createStorage(()=>provider);
  const dailyKey=checklistKey('daily',s);
  const seasonKey=checklistKey('season',s);
  beforeUpdate.set(dailyKey,{freeStore:true,allianceDonation:true});
  beforeUpdate.set(seasonKey,{pass:true,farms:true});

  // Simulate loading the newer site version against the same browser localStorage.
  const afterUpdate=createStorage(()=>provider);
  const pumpkinKey=checklistKey('seasonDaily',s);
  assert.deepEqual(checkedMap(afterUpdate.get(dailyKey)),{freeStore:true,allianceDonation:true});
  assert.deepEqual(checkedMap(afterUpdate.get(seasonKey)),{pass:true,farms:true});
  assert.deepEqual(checkedMap(afterUpdate.get(pumpkinKey)),{});
  afterUpdate.set(pumpkinKey,{pumpkinLikes:true});
  assert.deepEqual(checkedMap(afterUpdate.get(dailyKey)),{freeStore:true,allianceDonation:true});
  assert.deepEqual(checkedMap(afterUpdate.get(seasonKey)),{pass:true,farms:true});
  assert.deepEqual(checkedMap(afterUpdate.get(pumpkinKey)),{pumpkinLikes:true});
});
test('Season 1 daily checklist grows by unlock day and resets independently',()=>{
  const day1=state('2026-09-21T12:00:00+02:00');
  const day2=state('2026-09-22T12:00:00+02:00');
  const day3=state('2026-09-23T12:00:00+02:00');
  const day49=state('2026-11-08T12:00:00+01:00');
  const day50=state('2026-11-09T12:00:00+01:00');
  assert.deepEqual(seasonDailyTasks(day1),['profession','pumpkinLikes']);
  assert.ok(seasonDailyTasks(day2).includes('serumPuzzle'));
  assert.ok(!seasonDailyTasks(day2).includes('geneticRecombination'));
  assert.ok(seasonDailyTasks(day3).includes('geneticRecombination'));
  assert.ok(seasonDailyTasks(day49).includes('geneticRecombination'));
  assert.ok(!seasonDailyTasks(day50).includes('geneticRecombination'));
  for (const id of ['profession','pumpkinLikes','serumPuzzle','geneticRecombination']) {
    assert.ok(isSeasonDailyTask(id,day3),id);
  }
  assert.notEqual(checklistKey('seasonDaily',day2),checklistKey('seasonDaily',day3));
  assert.ok(!seasonTasks(day3).includes('doom'),'Doom Walker is not forced as a Season daily');
});

test('Season 1 context reminders are non-checklist guidance',()=>{
  const day1=seasonContext(state('2026-09-21T12:00:00+02:00'));
  const day3=seasonContext(state('2026-09-23T12:00:00+02:00'));
  assert.ok(day1.includes('farmVriProgress'));
  assert.ok(day1.includes('resistanceCheck'));
  assert.ok(!day1.includes('weatherCheck'));
  assert.ok(day3.includes('weatherCheck'));
});

test('Season 1 key unlocks remain visible in the correct weeks',()=>{
  const day8=seasonTasks(state('2026-09-28T12:00:00+02:00'));
  assert.ok(day8.includes('mason'));
  assert.ok(day8.includes('levelSwap'));
  const day11=seasonTasks(state('2026-10-01T12:00:00+02:00'));
  assert.ok(day11.includes('wishHero'));
  const day16=seasonTasks(state('2026-10-06T12:00:00+02:00'));
  assert.ok(day16.includes('warzoneExpedition'));
  const day50=seasonTodayTasks(state('2026-11-09T12:00:00+01:00'));
  assert.ok(day50.includes('seasonSettlement'));
});

test('new Season 1 checklist copy exists in every public language',()=>{
  for (const key of ['serumPuzzle','geneticRecombination','weatherCheck','farmVriProgress','wishHero','levelSwap','warzoneExpedition','declarationDay','crossWarzoneSaturday','cityCall','seasonSettlement','purge','apocalypseCity','infiniteOctagon','seasonWarmup','finalBattle']) {
    for (const lang of Object.keys(LANGUAGES)) assert.ok(translate(SEASON_COPY,key,lang).trim(),key+' ['+lang+']');
  }
});
