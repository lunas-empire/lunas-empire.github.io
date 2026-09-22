import { specialGuideCopy } from './special-guide-i18n.js';

const S1=[
['Lv1','Combat Experience 3/3','MAX'],
['Lv1','Outstanding Contribution 1/1','MAX'],
['Lv1','Rapid Production','OPTIONAL'],
['Lv5','Extra Meal 1/1','MAX'],
['Lv5','Siege Mastery 1/5+','1+'],
['Lv5','Building Inspiration I 3/3','MAX'],
['Lv10','Build for Free 5/5','MAX'],
['Lv10','Research for Free 5/5','MAX'],
['Lv15','Build Now 5/5','MAX'],
['Lv15','Research Now 5/5','MAX']
];

const MID=[
['Lv20','Rally Rush / Siege Banner','OPTIONAL'],
['Lv20','Double Exchange','OPTIONAL'],
['Lv25','Siege Inspiration 3/3','MAX*'],
['Lv25','Friendly Aid','OPTIONAL'],
['Lv30','Cooperative Construction 1/2 → 2/2','1+'],
['Lv30','Cooperative Research 1/2 → 2/2','1+'],
['Lv35','Resource-Saving 5/5','MAX'],
['Lv35','Recycling 5/5','MAX'],
['Lv35','Professional Insights 5/5','MAX while leveling']
];

const CAP=[
['Lv40','Medical Aid','OPTIONAL'],
['Lv40','Friendly Shield','OPTIONAL'],
['Lv40','Profession EXP skills','REVIEW'],
['Lv40','Permanent core target','PRIORITY'],
['Lv40','Extra points','FILL']
];

const priorityCode=value=>({
  OPTIONAL:'OPT','MAX while leveling':'MAX ↑',REVIEW:'CAP',PRIORITY:'CORE',FILL:'FILL'
}[value]||value);

function rows(items,e){
  return `<div class="profession-path__rows">${items.map(([level,skill,priority])=>`<div class="profession-path__row"><span class="profession-path__level">${e(level)}</span><div><div class="profession-path__skill"><strong>${e(skill)}</strong><span class="profession-path__priority">${e(priorityCode(priority))}</span></div></div></div>`).join('')}</div>`;
}

export function professionGuideHtml(lang,escape){
  const c=specialGuideCopy(lang);
  const e=value=>escape(value);
  return `<section class="profession-path" data-profession-path>
<div class="profession-path__hero"><span class="badge">SEASON 1 · ENGINEER</span><h3>${e(c.profTitle)}</h3><p>${e(c.profIntro)}</p></div>
<aside class="profession-path__cap"><strong>S1 · LV40</strong><p>${e(c.profCap)}</p></aside>
<details class="profession-path__section" data-section-id="level-1-15"><summary>${e(c.profEarlyTitle)}</summary><div class="profession-path__body"><p class="profession-path__summary">${e(c.profEarlyText)}</p>${rows(S1,e)}</div></details>
<details class="profession-path__section" data-section-id="level-20-35"><summary>${e(c.profMidTitle)}</summary><div class="profession-path__body"><p class="profession-path__summary">${e(c.profMidText)}</p>${rows(MID,e)}</div></details>
<details class="profession-path__section" data-section-id="level-40"><summary>${e(c.profFinalTitle)}</summary><div class="profession-path__body"><p class="profession-path__summary">${e(c.profFinalText)}</p>${rows(CAP,e)}</div></details>
<details class="profession-path__tips-disclosure" data-section-id="usage-respec"><summary>${e(c.profUsageTitle)}</summary><div class="profession-path__tips"><article><p>${e(c.profUsageText)}</p></article><p class="profession-path__verify">${e(c.profVerify)}</p></div></details>
</section>`;
}

export const PROFESSION_GUIDE_SEARCH='Engineer Profession Hall Combat Experience Outstanding Contribution Rapid Production Extra Meal Siege Mastery Building Inspiration Build for Free Research for Free Build Now Research Now Double Exchange Siege Inspiration Friendly Aid Cooperative Construction Cooperative Research Resource-Saving Recycling Professional Insights Medical Aid Friendly Shield Lv40';
