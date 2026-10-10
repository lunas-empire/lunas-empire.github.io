import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES,translate,loadLanguage } from '../assets/i18n.js';
import { REVIEW_COPY } from '../assets/guide-factcheck-copy.js';
import { SEASON_LIBRARY_COPY } from '../assets/season-library.js';
import { SEASON_COPY } from '../assets/season.js';
import { GUIDE_COPY } from '../assets/guide-text.js';

const dictionary={...SEASON_COPY,...GUIDE_COPY,...SEASON_LIBRARY_COPY};
const keys=['libWishHeroSummary','libSerumSummary','guideVsWednesdayActions','pass','libRewardsSummary','guideWeaponsSources','libTroopBoostSummary','guideTipsStrongholds'];
test('all factchecked guides are complete and localized in 15 languages',async()=>{
 await Promise.all(Object.keys(LANGUAGES).map(loadLanguage));
 assert.equal(Object.keys(LANGUAGES).length,15);
 for(const key of keys){
   assert.equal(Object.keys(REVIEW_COPY[key]||{}).length,15,key);
   for(const lang of Object.keys(LANGUAGES)){
     const copy=translate(dictionary,key,lang);
     assert.ok(copy.length>60,key+' '+lang);
     assert.ok(!copy.includes('undefined'),key+' '+lang);
   }
 }
});
test('Wish Hero rewards 10 shards, not a new unlocked UR hero',()=>{
 const english=translate(dictionary,'libWishHeroSummary','en');
 assert.match(english,/200 recruits grants 10 shards/);
 assert.match(english,/NOT a newly unlocked hero/);
});
test('Week 8 is settlement, Serum Fragments do not feature in the conversion claim',()=>{
 const en=translate(dictionary,'libRewardsSummary','en');
 assert.match(en,/seven active weeks plus Week 8 settlement/);
 assert.match(en,/Genetic Fragments convert to Profession EXP/);
 assert.doesNotMatch(en,/Serum convert/);
});
test('Weekly shop reset, F2P option and Military Center prerequisite are explicit',()=>{
 assert.match(translate(dictionary,'libSerumSummary','en'),/BEFORE reset/);
 assert.match(translate(dictionary,'pass','en'),/F2P players can progress/);
 assert.match(translate(dictionary,'libTroopBoostSummary','en'),/requires VRI level 30/);
 assert.match(translate(dictionary,'guideWeaponsSources','en'),/Do not confuse choice chests with universal shards/);
 assert.match(translate(dictionary,'guideVsWednesdayActions','en'),/Intercity Truck only as a cheap filler/);
});
