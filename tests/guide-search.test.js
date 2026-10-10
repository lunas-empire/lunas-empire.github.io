import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { memberRoute, guideHash, guideUrl } from '../assets/guide-links.js';
import { LANGUAGES } from '../assets/i18n.js';
import { specialGuideCopy } from '../assets/special-guide-i18n.js';

const app=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');

test('guide discovery uses search and five topic areas, not legacy filter chips',()=>{
  assert.match(app,/function applyGuideFilters\(\)/);
  assert.match(app,/updateGuideLibrary\(main/);
  assert.match(app,/guideLanding\(/);
  assert.match(app,/guideTopicSection\(/);
  assert.doesNotMatch(app,/data-guide-filter=/);
});

test('guide search matches titles and relevant synonyms',()=>{
  assert.match(app,/guideSearchQuery=event\.target\.value/);
  assert.match(app,/guideTopicSelected=category\.dataset\.guideTopicSelect/);
  assert.match(app,/guideTopicSelected=guideTopicOf\(route\.guideId\)/);
});

test('topic navigation shows five non-duplicated categories',async()=>{
  const {GUIDE_TOPIC_ORDER,guideTopicOf,guideTopicCount,guideSearchExtra}=await import('../assets/guide-library-nav.js');
  const {SEASON_GUIDE_ROADMAP}=await import('../assets/season.js');
  const {WEEKDAYS}=await import('../assets/engine.js');
  assert.deepEqual(GUIDE_TOPIC_ORDER,['alliance','power','vs','season','economy']);
  assert.equal(guideTopicOf('t10'),'power');
  assert.equal(guideTopicOf('generals-trial'),'alliance');
  assert.equal(guideTopicOf('black-market'),'economy');
  assert.equal(guideTopicOf('mason'),'season');
  assert.equal(guideTopicOf('vs-friday'),'vs');
  assert.ok(guideSearchExtra('t10').includes('unit x'));
  assert.equal(guideTopicCount('season',SEASON_GUIDE_ROADMAP,WEEKDAYS),18);
});

test('new category navigation has human translations across all 15 languages',async()=>{
  const {GUIDE_NAV_TEXT}=await import('../assets/guide-library-nav-i18n.js');
  assert.deepEqual(Object.keys(GUIDE_NAV_TEXT).sort(),Object.keys(LANGUAGES).sort());
  for(const [lang,copy] of Object.entries(GUIDE_NAV_TEXT))for(const key of ['featured','browse','back','alliance','power','vs','season','economy','count'])
    assert.ok(copy[key]?.trim().length>2,lang+' '+key);
});
test('guide subsection routes are backwards compatible and shareable',()=>{
  assert.deepEqual(memberRoute('#guides/tech'),{view:'guides',guideId:'tech',sectionId:''});
  assert.deepEqual(memberRoute('#guides/tech/research-speed'),{view:'guides',guideId:'tech',sectionId:'research-speed'});
  assert.equal(guideHash('profession','level-20-35'),'#guides/profession/level-20-35');
  assert.equal(guideUrl('tech','https://rzsn-home.github.io/#today','mastery'),'https://rzsn-home.github.io/#guides/tech/mastery');
});

test('Tech and Profession explanatory copy exists for all 15 public languages',()=>{
  assert.equal(Object.keys(LANGUAGES).length,15);
  for (const lang of Object.keys(LANGUAGES)) {
    const copy=specialGuideCopy(lang);
    for (const key of ['generalTitle']) {
      assert.equal(typeof copy[key],'string',`${lang} ${key}`);
      assert.ok(copy[key].trim().length>1,`${lang} ${key}`);
    }
    for (const key of ['techIntro','speedText','masteryText','orderText','profIntro','profCap','profEarlyText','profMidText','profFinalText','profUsageText']) {
      assert.equal(typeof copy[key],'string',`${lang} ${key}`);
      assert.ok(copy[key].trim().length>12,`${lang} ${key}`);
    }
  }
});
