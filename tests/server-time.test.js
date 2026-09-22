import test from 'node:test';
import assert from 'node:assert/strict';
import { COPY, DAILY_GUIDES } from '../assets/content.js';
import { GUIDE_COPY } from '../assets/guide-text.js';
import { UI, LANGUAGES, translate, loadLanguage } from '../assets/i18n.js';
import { guideState, armsWindow } from '../assets/engine.js';
await Promise.all(Object.keys(LANGUAGES).map(loadLanguage));

const clockKeys=['enemyBusterUpcomingTitle','enemyBusterWindow','shield','gatheringPrep','drone'];
const guideClockKeys=['guideVsSundayActions','guideVsMondayActions','guideVsTuesdayActions','guideVsWednesdayActions','guideVsThursdayActions','guideVsFridayActions','guideVsSaturdayActions'];
const stale=/(Berlin|Berlino|Berlim|Berlijn|Берлін|ベルリン|베를린|เบอร์ลิน|ប៊ែកឡាំង|برلين|CET|CEST)/i;

test('public clock guidance uses Server Time in all 15 languages',()=>{
  for (const lang of Object.keys(LANGUAGES)) {
    assert.match(translate(UI,'reset',lang),/00:00.*(?:ST|Server Time)/,lang);
    assert.match(translate(UI,'armsNote',lang),/(?:ST|Server Time)/,lang);
    assert.doesNotMatch(translate(UI,'reset',lang),stale,lang);
    assert.doesNotMatch(translate(UI,'armsNote',lang),stale,lang);
    for (const key of clockKeys) assert.doesNotMatch(translate(COPY,key,lang),stale,`${lang} ${key}`);
    for (const key of guideClockKeys) assert.doesNotMatch(translate(GUIDE_COPY,key,lang),stale,`${lang} ${key}`);
  }
});

test('Server Time is Berlin civil time minus four hours',()=>{
  assert.equal(guideState(new Date('2026-09-14T04:00:00+02:00')).serverMinute,0);
  assert.equal(guideState(new Date('2026-09-14T12:00:00+02:00')).serverMinute,8*60);
  assert.equal(guideState(new Date('2026-09-14T20:00:00+02:00')).serverMinute,16*60);
  assert.equal(guideState(new Date('2026-09-15T00:00:00+02:00')).serverMinute,20*60);
});

test('Arms Race windows are stored and evaluated in Server Time',()=>{
  assert.deepEqual([DAILY_GUIDES.monday.arms.start,DAILY_GUIDES.monday.arms.end],[16,20]);
  assert.deepEqual([DAILY_GUIDES.tuesday.arms.start,DAILY_GUIDES.tuesday.arms.end],[8,12]);
  assert.deepEqual([DAILY_GUIDES.wednesday.arms.start,DAILY_GUIDES.wednesday.arms.end],[8,12]);
  assert.deepEqual([DAILY_GUIDES.thursday.arms.start,DAILY_GUIDES.thursday.arms.end],[8,12]);
  assert.equal(armsWindow(guideState(new Date('2026-09-14T19:59:00+02:00')),DAILY_GUIDES.monday),'later');
  assert.equal(armsWindow(guideState(new Date('2026-09-14T20:00:00+02:00')),DAILY_GUIDES.monday),'active');
  assert.equal(armsWindow(guideState(new Date('2026-09-15T00:00:00+02:00')),DAILY_GUIDES.monday),'ended');
});
