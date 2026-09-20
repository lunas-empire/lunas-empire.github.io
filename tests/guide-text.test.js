import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, translate } from '../assets/i18n.js';
import { COPY } from '../assets/content.js';
import { SEASON_COPY } from '../assets/season.js';
import { GUIDE_COPY, GUIDE_TEXT, MEMBER_MEDIA } from '../assets/guide-text.js';
import { SEASON_LIBRARY_COPY, SEASON_LIBRARY_GUIDES, SEASON_LIBRARY_MEDIA } from '../assets/season-library.js';

test('every displayed guide image has complete localized text',()=>{
  assert.deepEqual(Object.keys(GUIDE_TEXT).sort(),Object.keys(MEMBER_MEDIA).sort());
  for (const [id,blocks] of Object.entries(GUIDE_TEXT)) {
    assert.ok(blocks.length>=2,`${id} needs meaningful text blocks`);
    for (const block of blocks) {
      for (const key of [block.heading,block.text]) {
        assert.ok(GUIDE_COPY[key],`${id}: ${key}`);
        for (const lang of Object.keys(LANGUAGES)) {
          assert.ok(translate(GUIDE_COPY,key,lang).trim(),`${id}: ${key} [${lang}]`);
        }
      }
    }
  }
});

test('Mason UR guidance keeps Wall 160 as preparation, not a requirement',()=>{
  const [de,en]=GUIDE_COPY.guideTipsMason;
  assert.match(de,/5★.*Legendary Hero Badge/);
  assert.match(de,/kein Pflichtwert/);
  assert.match(en,/5★.*Legendary Hero Badge/);
  assert.match(en,/not a requirement/i);
  assert.match(en,/1,600 shards/);
});

test('guide image metadata stays supplementary and dimensioned',()=>{
  for (const [id,media] of Object.entries(MEMBER_MEDIA)) {
    assert.match(media.src,/^\/assets\/member\/.+\.webp$/,`${id}: public image path`);
    assert.ok(media.width>0 && media.height>0,`${id}: intrinsic dimensions`);
    assert.ok(media.alt || media.day,`${id}: accessible label source`);
  }
});

test('complete Season 1 master library exposes all 29 source images in 18 localized topics',()=>{
  assert.equal(Object.keys(SEASON_LIBRARY_GUIDES).length,18);
  assert.equal(Object.keys(SEASON_LIBRARY_MEDIA).length,29);
  const dictionary={...COPY,...SEASON_COPY,...GUIDE_COPY,...SEASON_LIBRARY_COPY};
  const used=[];
  for (const [id,guide] of Object.entries(SEASON_LIBRARY_GUIDES)) {
    used.push(...guide.media);
    for (const key of [guide.title,...guide.blocks.flatMap(block=>[block.heading,block.text])]) {
      assert.ok(dictionary[key],`${id}: ${key}`);
      for (const lang of Object.keys(LANGUAGES)) assert.ok(translate(dictionary,key,lang).trim(),`${id}: ${key} [${lang}]`);
    }
  }
  assert.deepEqual(used.sort(),Object.keys(SEASON_LIBRARY_MEDIA).sort());
  for (const [code,media] of Object.entries(SEASON_LIBRARY_MEDIA)) {
    assert.match(media.src,/^\/assets\/member\/season-master\/s1-\d{2}\.webp$/,`${code}: public Season image path`);
    assert.ok(media.width>0 && media.height>0,`${code}: intrinsic dimensions`);
  }
});
