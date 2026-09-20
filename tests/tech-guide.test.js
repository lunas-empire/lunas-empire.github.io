import test from 'node:test';
import assert from 'node:assert/strict';
import { TECH_GUIDE_TITLE, TECH_GUIDE_HTML } from '../assets/tech-guide.js';

test('RZSN Tech Guide ships the requested research strategy',()=>{
  assert.equal(TECH_GUIDE_TITLE,'🔬 RZSN TECH GUIDE');
  for (const text of [
    '9 VS reward boxes / 7.2M points',
    'Secretary of Science',
    'reduces research time by 50%',
    'Cooperative Research',
    'another 20% research time',
    '1,200 minutes / 20 hours',
    'Alliance Duel → Development/Economy basics → Hero → Squad 1 → Units → Special Forces → Main Squad Mastery → Defense → Siege',
    'Do not blindly rush T10.',
    '+30% core stats',
    '+100 troops per march',
    'Never leave a Tech Center idle.'
  ]) assert.ok(TECH_GUIDE_HTML.includes(text),text);
  for (const title of [
    'GENERAL TECH TIPS','HOW TO SPEED UP RESEARCH','PHASE 1 – FOUNDATION',
    'PHASE 2 – HEROES, TROOPS &amp; T10','PHASE 3 – MASTERY','SIMPLE RZSN TECH ORDER'
  ]) assert.ok(TECH_GUIDE_HTML.includes(title),title);
});
