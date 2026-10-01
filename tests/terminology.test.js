import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, UI, translate, loadLanguage } from '../assets/i18n.js';
import { COPY } from '../assets/content.js';
import { GUIDE_COPY } from '../assets/guide-text.js';
import { TERMS, TERM_LANGUAGES, localizeTerms, armsPhase } from '../assets/terminology.js';
import { TERMINOLOGY_COPY } from '../assets/terminology-copy.js';
import { professionGuideHtml } from '../assets/profession-guide.js';
import { trainGuideHtml } from '../assets/train-guide.js';
await Promise.all(Object.keys(LANGUAGES).map(loadLanguage));

test('terminology and rewritten instructions cover every public language',()=>{
  assert.deepEqual(TERM_LANGUAGES,Object.keys(LANGUAGES));
  for(const [id,term] of Object.entries(TERMS)) for(const lang of TERM_LANGUAGES) {
    assert.ok(term.labels[lang]?.trim(),`${id}: ${lang}`);
    assert.doesNotMatch(term.labels[lang],/[\uFFFD\u0080-\u009F]/u,`${id}: ${lang}`);
  }
  for(const [key,row] of Object.entries(TERMINOLOGY_COPY)) for(const lang of TERM_LANGUAGES) {
    assert.ok(row[lang]?.trim(),`${key}: ${lang}`);
    assert.doesNotMatch(row[lang],/undefined|\|/);
  }
});

test('event and phase stay distinct; terms are replaced without corrupting names',()=>{
  assert.equal(armsPhase('Hero Advancement','de'),'Wettrüsten · Helden verbessern');
  assert.equal(armsPhase('Hero Advancement','ja'),'軍拡競争 · 英雄強化');
  assert.equal(armsPhase('Hero Advancement','ko'),'군비경쟁 · 영웅 강화');
  assert.equal(localizeTerms('Legendary Hero Badge','de'),'Legendäres Heldenabzeichen (Legendary Hero Badge)');
  assert.equal(localizeTerms('Secret Mobile Squad Tasks','de'),'Secret Mobile Squad Tasks');
  assert.equal(localizeTerms('Cooperative Research 2/2','de'),'Kooperative Forschung (Cooperative Research) 2/2');
  assert.equal(localizeTerms('Heroic Researcher','de'),'Heroic Researcher');
  assert.equal(translate(COPY,'dayGuideAlt','de',{day:localizeTerms('Engineer','de')}),'Tagesguide für Ingenieur (Engineer).');
});

test('hero guidance distinguishes VS spending from Arms Race scoring',()=>{
  assert.match(translate(COPY,'hero','de'),/Heldenphase im Wettrüsten/);
  assert.match(translate(GUIDE_COPY,'guideVsThursdayActions','en'),/Shards and Skill Medals score for VS, not Arms Race/);
  assert.match(translate(GUIDE_COPY,'guideVsThursdayActions','de'),/keine Wettrüsten-Punkte/);
  assert.match(translate(GUIDE_COPY,'guideVsThursdayAvoid','de'),/kein Wettrüsten-Fenster nötig/);
  for(const lang of TERM_LANGUAGES) {
    assert.match(translate(GUIDE_COPY,'guideVsThursdayActions',lang),/08:00.*12:00/);
    assert.ok(armsPhase('Hero Advancement',lang).includes(' · '));
  }
});

test('profession skill rows and train instructions use the same glossary',()=>{
  const profession=professionGuideHtml('de',String);
  assert.match(profession,/Sofort bauen \(Build Now\) 5\/5/);
  assert.match(profession,/Kooperative Forschung \(Cooperative Research\) 1\/2/);
  const train=trainGuideHtml('de',String);
  assert.match(train,/Allianzzug \(Alliance Train\)/);
  assert.match(train,/Zugbewertung/);
  for(const lang of TERM_LANGUAGES) {
    assert.doesNotMatch(professionGuideHtml(lang,String),/undefined/);
    assert.doesNotMatch(trainGuideHtml(lang,String),/undefined/);
  }
});
