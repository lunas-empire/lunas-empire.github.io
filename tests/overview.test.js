import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../assets/storage.js';
import { guideState, checklistKey } from '../assets/engine.js';
import { taskReferences, taskDone, writeTask, taskProgress, taskVisible, seasonTaskUnlocked, nextReset, availabilityKey } from '../assets/overview.js';
import { OVERVIEW_COPY } from '../assets/overview-i18n.js';
import { LANGUAGES } from '../assets/i18n.js';

const wednesday=guideState(new Date('2026-09-30T19:30:00Z'));
test('legacy VS checks carry into daily tasks; unchecking clears both views',()=>{
  const storage=createStorage(()=>null);
  storage.set(checklistKey('vs',wednesday),{radarClaim:true});
  const refs=taskReferences('daily','radarClaim',wednesday);
  assert.ok(taskDone(storage,refs));
  assert.equal(refs[0].kind,'daily');
  writeTask(storage,refs,false);
  assert.equal(taskDone(storage,taskReferences('vs','radarClaim',wednesday)),false);
  writeTask(storage,refs,true);
  assert.ok(taskDone(storage,taskReferences('vs','radarClaim',wednesday)));
});
test('season daily and weekly checkmarks keep their original reset boundaries',()=>{
  const storage=createStorage(()=>null);
  const thursday=guideState(new Date('2026-10-01T03:00:00Z'));
  const daily=taskReferences('season','pumpkinLikes',wednesday);
  const weekly=taskReferences('season','mason',wednesday);
  assert.equal(daily[0].key,checklistKey('seasonDaily',wednesday));
  assert.equal(weekly[0].key,checklistKey('season',wednesday));
  writeTask(storage,daily,true);writeTask(storage,weekly,true);
  assert.equal(taskDone(storage,taskReferences('season','pumpkinLikes',thursday)),false);
  assert.equal(taskDone(storage,taskReferences('season','mason',thursday)),true);
  assert.notEqual(availabilityKey(wednesday),availabilityKey(thursday));
});
test('unavailable tasks and duplicate references do not inflate progress',()=>{
  const refs=taskReferences('daily','radarClaim',wednesday);
  const rows=[{refs,done:true,unavailable:false},{refs,done:true,unavailable:false},{refs:taskReferences('daily','tower',wednesday),done:false,unavailable:true}];
  assert.deepEqual(taskProgress(rows),{done:1,total:1,unavailable:1});
  assert.equal(taskVisible(rows[0],'open'),false);
  assert.equal(taskVisible(rows[0],'all'),true);
  assert.equal(taskVisible(rows[2],'unavailable'),true);
});
test('Wish Hero appears as a task only after its day-11 unlock',()=>{
  assert.equal(seasonTaskUnlocked('wishHero',wednesday),false);
  assert.equal(seasonTaskUnlocked('wishHero',guideState(new Date('2026-10-01T03:00:00Z'))),true);
});
test('next reset follows Berlin civil time across daylight-saving transition',()=>{
  const state=guideState(new Date('2026-10-24T18:00:00Z'));
  assert.equal(nextReset(state).toISOString(),'2026-10-25T03:00:00.000Z');
});
test('every new interface string exists in all 15 languages with equal placeholders',()=>{
  const keys=Object.keys(OVERVIEW_COPY.en).sort();
  for (const lang of Object.keys(LANGUAGES)) {
    assert.deepEqual(Object.keys(OVERVIEW_COPY[lang]).sort(),keys,lang);
    for (const key of keys) {
      const value=OVERVIEW_COPY[lang][key];
      assert.ok(typeof value==='string'&&value.trim(),`${lang}: ${key}`);
      assert.deepEqual(value.match(/\{\w+\}/g)||[],OVERVIEW_COPY.en[key].match(/\{\w+\}/g)||[],`${lang}: ${key}`);
    }
  }
});
