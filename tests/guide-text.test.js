import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGES } from '../assets/i18n.js';
import { GUIDE_COPY, GUIDE_TEXT, MEMBER_MEDIA } from '../assets/guide-text.js';

test('every displayed guide image has complete localized text',()=>{
  assert.deepEqual(Object.keys(GUIDE_TEXT).sort(),Object.keys(MEMBER_MEDIA).sort());
  for (const [id,blocks] of Object.entries(GUIDE_TEXT)) {
    assert.ok(blocks.length>=2,`${id} needs meaningful text blocks`);
    for (const block of blocks) {
      for (const key of [block.heading,block.text]) {
        assert.equal(GUIDE_COPY[key]?.length,Object.keys(LANGUAGES).length,`${id}: ${key}`);
        GUIDE_COPY[key].forEach((value,index)=>assert.ok(value.trim(),`${id}: ${key} language ${index}`));
      }
    }
  }
});

test('guide image metadata stays supplementary and dimensioned',()=>{
  for (const [id,media] of Object.entries(MEMBER_MEDIA)) {
    assert.match(media.src,/^\/assets\/member\/.+\.webp$/,`${id}: public image path`);
    assert.ok(media.width>0 && media.height>0,`${id}: intrinsic dimensions`);
    assert.ok(media.alt || media.day,`${id}: accessible label source`);
  }
});
