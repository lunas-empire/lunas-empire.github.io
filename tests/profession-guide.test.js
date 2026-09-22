import test from 'node:test';
import assert from 'node:assert/strict';
import { professionGuideHtml, PROFESSION_GUIDE_SEARCH } from '../assets/profession-guide.js';
import { LANGUAGES, translate, loadLanguage } from '../assets/i18n.js';
import { GUIDE_COPY } from '../assets/guide-text.js';
import { SEASON_LIBRARY_COPY } from '../assets/season-library.js';
await Promise.all(Object.keys(LANGUAGES).map(loadLanguage));

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

test('Engineer profession guide contains the reviewed RZSN Season 1 path',()=>{
  const html=professionGuideHtml('en',escape);
  for (const text of [
    'Combat Experience 3/3','Outstanding Contribution 1/1',
    'Extra Meal 1/1','Siege Mastery 1/5+','Building Inspiration I 3/3',
    'Build for Free 5/5','Research for Free 5/5',
    'Build Now 5/5','Research Now 5/5',
    'Siege Inspiration 3/3',
    'Cooperative Construction 1/2 → 2/2','Cooperative Research 1/2 → 2/2',
    'Resource-Saving 5/5','Recycling 5/5','Professional Insights 5/5',
    'Permanent core target'
  ]) assert.ok(html.includes(text),text);
  assert.match(html,/Season 1 caps at Profession Lv40/);
  assert.match(html,/green right-hand branch is season-specific/);
  assert.ok(html.includes('Level 40 · Final build'));
  assert.equal((html.match(/profession-path__section/g)||[]).length,3);
  assert.ok(PROFESSION_GUIDE_SEARCH.includes('Recycling'));
  assert.ok(PROFESSION_GUIDE_SEARCH.includes('Professional Insights'));
  assert.ok(!html.includes('Drone Supply'));
});

test('profession copy no longer points members to Season Pass for profession changes',()=>{
  for (const lang of Object.keys(LANGUAGES)) {
    const profession=translate(GUIDE_COPY,'guideTipsProfession',lang);
    assert.ok(profession.includes('Profession Change Certificate'),lang);
    assert.doesNotMatch(profession,/Season Pass/i,lang);
    const seasonal=translate(SEASON_LIBRARY_COPY,'libProfessionSkills',lang);
    assert.ok(seasonal.includes('Combat Experience'),lang);
    assert.ok(seasonal.includes('Building Inspiration I'),lang);
    assert.doesNotMatch(seasonal,/Lucky Predator|Field Veteran|Elite Hunter/i,lang);
  }
});
