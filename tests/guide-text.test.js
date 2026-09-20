import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES, translate } from '../assets/i18n.js';
import { GUIDE_COPY, GUIDE_TEXT, MEMBER_MEDIA } from '../assets/guide-text.js';

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
