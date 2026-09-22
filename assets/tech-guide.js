import { specialGuideCopy } from './special-guide-i18n.js';

export const TECH_GUIDE_TITLE='RZSN Tech Guide';

const TECH_GUIDE_SECTIONS=[
  ['general','generalTitle','generalText'],
  ['research-speed','speedTitle','speedText'],
  ['foundation','foundationTitle','foundationText'],
  ['heroes-troops','combatTitle','combatText'],
  ['special-forces','t10Title','t10Text'],
  ['mastery','masteryTitle','masteryText'],
  ['research-order','orderTitle','orderText']
];

export function techGuideHtml(lang,escape){
  const c=specialGuideCopy(lang);
  const e=value=>escape(value);
  return `<article class="tech-guide"><p class="tech-guide__intro">${e(c.techIntro)}</p>${TECH_GUIDE_SECTIONS.map(([id,title,text])=>`<details class="tech-guide__phase${id==='special-forces'?' tech-guide__phase--warning':''}${id==='research-order'?' tech-guide__phase--summary':''}" data-section-id="${id}"><summary>${e(c[title])}</summary><div class="tech-guide__phase-body"><p>${e(c[text])}</p></div></details>`).join('')}</article>`;
}
