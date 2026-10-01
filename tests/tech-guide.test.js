import test from 'node:test';
import assert from 'node:assert/strict';
import { TECH_GUIDE_TITLE, techGuideHtml, t10GuideHtml, t10GuideTitle } from '../assets/tech-guide.js';
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

test('T10 is a standalone localized guide with research visual and calculator',()=>{
  for(const lang of ['de','en','ja','ar','fil']){
    const html=t10GuideHtml(lang,escape);
    assert.match(html,/t10-research-guide\.webp/);
    assert.match(html,/t10-special-forces/);
    assert.match(html,/Unit X/);
    assert.match(html,/Barracks|Kaserne|HQ 30/);
    assert.ok(t10GuideTitle(lang).includes('Unit X'));
  }
  assert.match(t10GuideHtml('de',escape),/Wettrüsten/);
  assert.doesNotMatch(techGuideHtml('en',escape),/t10-research-guide\.webp/);
});
