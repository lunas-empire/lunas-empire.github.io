import test from 'node:test';
import assert from 'node:assert/strict';
import { TECH_GUIDE_TITLE, techGuideHtml } from '../assets/tech-guide.js';
import { specialGuideCopy } from '../assets/special-guide-i18n.js';

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

test('RZSN Tech Guide ships the requested research strategy',()=>{
  assert.equal(TECH_GUIDE_TITLE,'RZSN Tech Guide');
  const copy=specialGuideCopy('en');
  const combined=Object.values(copy).join(' ');
  for (const text of [
    'Secretary of Science','50%','Cooperative Research','20%','1,200 minutes / 20 hours',
    'Alliance Duel → Development/Economy basics → Hero → Squad 1 → Units → Special Forces → Main Squad Mastery → Defense → Siege',
    '+30% core stats','+100 troops per march','Tech Center'
  ]) assert.ok(combined.includes(text),text);
  const html=techGuideHtml('en',escape);
  for (const section of ['general','research-speed','foundation','heroes-troops','special-forces','mastery','research-order']) {
    assert.ok(html.includes(`data-section-id="${section}"`),section);
  }
});
