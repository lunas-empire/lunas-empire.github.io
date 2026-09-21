import test from 'node:test';
import assert from 'node:assert/strict';
import { professionGuideHtml, PROFESSION_GUIDE_SEARCH } from '../assets/profession-guide.js';
import { LANGUAGES, translate } from '../assets/i18n.js';
import { GUIDE_COPY } from '../assets/guide-text.js';
import { SEASON_LIBRARY_COPY } from '../assets/season-library.js';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

test('Engineer profession guide contains the RZSN Season 1 skill path',()=>{
  const html=professionGuideHtml('en',escape);
  for (const text of [
    'Combat Experience 3/3','Building Inspiration I 3/3',
    'Build for Free 5/5','Research for Free 5/5',
    'Build Now 5/5','Research Now 5/5',
    'Cooperative Construction 2/2','Cooperative Research 2/2',
    'Resource-Saving 5/5','Recycling 5/5','Drone Supply'
  ]) assert.ok(html.includes(text),text);
  assert.match(html,/Season 1 note: current guides list Lv40 as the S1 cap/);
  assert.match(html,/Lv45\+ · later seasons/);
  assert.equal((html.match(/profession-path__section/g)||[]).length,3);
  assert.ok(PROFESSION_GUIDE_SEARCH.includes('Drone Supply'));
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
