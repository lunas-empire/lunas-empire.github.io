import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { memberRoute, guideHash, guideUrl } from '../assets/guide-links.js';
import { LANGUAGES } from '../assets/i18n.js';
import { specialGuideCopy } from '../assets/special-guide-i18n.js';

const app=await readFile(new URL('../assets/app.js',import.meta.url),'utf8');

test('guide search and filters keep matching guides collapsed',()=>{
  assert.match(app,/function applyGuideFilters\(\)/);
  assert.match(app,/guideFilter==='current'/);
  assert.match(app,/if \(query\) item\.open=false;/);
  assert.match(app,/guide-disclosure--search-match/);
  assert.match(app,/highlightGuideLabel/);
  assert.doesNotMatch(app,/el\.open=Boolean\(query\)/);
});

test('nested guide sections are filtered but remain collapsed',()=>{
  assert.match(app,/section\.open=false;/);
  assert.match(app,/section\.hidden=Boolean\(query\)/);
  assert.match(app,/profession-path__tips-disclosure/);
  assert.match(app,/tech-guide__phase/);
});

test('guide discovery exposes current, season, VS, tech and account filters',()=>{
  for (const id of ['current','season','vs','tech','account']) assert.ok(app.includes(`['${id}'`),id);
  assert.match(app,/guide-results-count/);
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
