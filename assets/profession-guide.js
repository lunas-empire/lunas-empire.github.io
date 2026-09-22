const COPY={
de:{
title:'Engineer Skill Path',
intro:'Engineer ist für Season 1 die Wachstums-Empfehlung. Der neue Referenz-Screenshot bestätigt den permanenten Kern: Bau/Forschung maximieren, Recycling und Resource-Saving ab Lv35 sehr hoch priorisieren.',
cap:'Season 1 endet bei Profession Lv40. Die rechte grüne Spalte ist saisonabhängig und darf nicht blind aus einem anderen Season-Screenshot übernommen werden. Für S1 gelten die aktuellen grünen S1-Skills im Live-Client.',
now:'Level 1–15 · Kernaufbau',
later:'Level 20–35 · Wachstum',
future:'Level 40 · Finaler Build',
rule:'Prioritäts-Legende',
ruleText:'MAX = möglichst voll ausbauen. 1+ = mindestens 1 Punkt, später gern maximieren. OPTIONAL = nur wenn Punkte/Spielstil passen.',
tips:'Nutzung & Respec',
active:'Aktive Skills richtig nutzen',
activeText:'Build Now nur mit laufenden Bauqueues; Research Now idealerweise mit zwei langen Forschungen. Cooperative Construction/Research vor dem Start neuer Builds/Research nutzen; die Buffs stapeln nicht.',
reset:'Am Lv40-Cap neu bewerten',
resetText:'Profession-EXP-Skills sind beim Hochleveln extrem wertvoll. Sobald Lv40 erreicht ist, kann ein Skill Reset sinnvoll sein, um Punkte stärker in dauerhafte Bau-/Research-/Ressourcen-Skills zu verschieben.',
verify:'Skillnamen und Season-Skills können je nach Client/Season leicht abweichen. Bei der rechten grünen Spalte immer den aktuellen S1-Live-Client prüfen.'
},
en:{
title:'Engineer Skill Path',
intro:'Engineer is the Season 1 growth recommendation. The new reference image confirms the permanent core: max construction/research skills and strongly prioritize Recycling and Resource-Saving from Lv35.',
cap:'Season 1 caps at Profession Lv40. The green right-hand column is season-specific and must not be copied blindly from another season screenshot. Use the current S1 green skills shown in your live client.',
now:'Levels 1–15 · Core setup',
later:'Levels 20–35 · Growth',
future:'Level 40 · Final build',
rule:'Priority legend',
ruleText:'MAX = fill as far as possible. 1+ = take at least one point, then max later if points allow. OPTIONAL = only when points and playstyle justify it.',
tips:'Usage & respec',
active:'Use active skills properly',
activeText:'Use Build Now only with active build queues; use Research Now ideally with two long researches running. Use Cooperative Construction/Research before starting new builds/research; the buffs do not stack.',
reset:'Review again at the Lv40 cap',
resetText:'Profession EXP skills are extremely valuable while leveling. Once Lv40 is reached, a Skill Reset can make sense to move more points into permanent construction, research and resource-saving skills.',
verify:'Skill names and seasonal skills can vary slightly by client/season. Always verify the green right-hand S1 column in the live client.'
}};

const S1=[
['Lv1','Combat Experience 3/3','MAX','Seasonal: +Profession EXP from World Map monsters. Max very early while leveling.'],
['Lv1','Outstanding Contribution 1/1','MAX','Cheap permanent value from Alliance Tech donations.'],
['Lv1','Rapid Production','OPTIONAL','Good resource skill, but the reference path does not put it ahead of the core build/research package.'],
['Lv5','Extra Meal 1/1','MAX','One point gives a strong permanent stamina improvement.'],
['Lv5','Siege Mastery 1/5+','1+','The reference image recommends at least one point. Add more only if city durability damage matters to you.'],
['Lv5','Building Inspiration I 3/3','MAX','Seasonal Profession EXP from seasonal-building upgrades. High early priority.'],
['Lv10','Build for Free 5/5','MAX','Permanent free construction time. Core Engineer skill.'],
['Lv10','Research for Free 5/5','MAX','Permanent free research time. Core Engineer skill.'],
['Lv15','Build Now 5/5','MAX','Active: removes up to 10 hours from active construction queues.'],
['Lv15','Research Now 5/5','MAX','Active: removes up to 20 hours from active research. Best with both Tech Centers running long research.']
];

const MID=[
['Lv20','Rally Rush / Siege Banner','OPTIONAL','Useful for rally/city play, but not ahead of growth skills for most RZSN members.'],
['Lv20','Double Exchange','OPTIONAL','S1 seasonal resource utility; take when the exchange is useful, not ahead of core growth.'],
['Lv25','Siege Inspiration 3/3','MAX*','Up to +60% Profession EXP from City Durability damage. Very strong if you actively participate in city captures; otherwise delay.'],
['Lv25','Friendly Aid','OPTIONAL','Reinforcement casualty reduction; low priority for a growth-focused Engineer.'],
['Lv30','Cooperative Construction 1/2 → 2/2','1+','Take at least one point when unlocked; 2/2 gives +20% building speed to you and one ally for 60 minutes.'],
['Lv30','Cooperative Research 1/2 → 2/2','1+','Take at least one point when unlocked; 2/2 gives +20% research speed to you and one ally for 60 minutes.'],
['Lv35','Resource-Saving 5/5','MAX','Permanent -5% Food, Iron and Coin cost for construction.'],
['Lv35','Recycling 5/5','MAX','Permanent -5% Food, Iron and Coin cost for research. Max as soon as your point budget allows.'],
['Lv35','Professional Insights 5/5','MAX while leveling','Seasonal active Profession EXP. One of the best ways to accelerate the final levels toward the S1 cap.']
];

const CAP=[
['Lv40','Medical Aid','OPTIONAL','Useful alliance/PvP support, but not ahead of core economy if points are tight.'],
['Lv40','Friendly Shield','OPTIONAL','Useful free shield utility; role-dependent rather than a growth priority.'],
['Lv40','Profession EXP skills','REVIEW','At the cap their immediate leveling value drops. Consider a Skill Reset if permanent growth skills are still missing.'],
['Lv40','Permanent core target','PRIORITY','Build/Research for Free + Build/Research Now + Cooperative Construction/Research + Resource-Saving + Recycling are the core long-term Engineer package.'],
['Lv40','Extra points','FILL','After the core, use spare points for Rapid Production, Siege Inspiration or role-specific utility depending on your account.']
];

function rows(items,e){
return `<div class="profession-path__rows">${items.map(([level,skill,priority,note])=>`<div class="profession-path__row"><span class="profession-path__level">${e(level)}</span><div><div class="profession-path__skill"><strong>${e(skill)}</strong><span class="profession-path__priority">${e(priority)}</span></div><p>${e(note)}</p></div></div>`).join('')}</div>`;
}
export function professionGuideHtml(lang,escape){
const c=lang==='de'?COPY.de:COPY.en;
const e=value=>escape(value);
return `<section class="profession-path" data-profession-path>
<div class="profession-path__hero"><span class="badge">SEASON 1 · ENGINEER</span><h3>${e(c.title)}</h3><p>${e(c.intro)}</p></div>
<aside class="profession-path__cap"><strong>S1 · LV40</strong><p>${e(c.cap)}</p></aside>
<details class="profession-path__section"><summary>${e(c.now)}</summary>
<div class="profession-path__body"><h4>${e(c.rule)}</h4><p>${e(c.ruleText)}</p>${rows(S1,e)}</div></details>
<details class="profession-path__section"><summary>${e(c.later)}</summary><div class="profession-path__body">${rows(MID,e)}</div></details>
<details class="profession-path__section"><summary>${e(c.future)}</summary><div class="profession-path__body">${rows(CAP,e)}</div></details>
<details class="profession-path__tips-disclosure"><summary>${e(c.tips)}</summary><div class="profession-path__tips"><article><h4>${e(c.active)}</h4><p>${e(c.activeText)}</p></article><article><h4>${e(c.reset)}</h4><p>${e(c.resetText)}</p></article><p class="profession-path__verify">${e(c.verify)}</p></div></details>
</section>`;
}
export const PROFESSION_GUIDE_SEARCH='Engineer Profession Hall Combat Experience Outstanding Contribution Rapid Production Extra Meal Siege Mastery Building Inspiration Build for Free Research for Free Build Now Research Now Double Exchange Siege Inspiration Friendly Aid Cooperative Construction Cooperative Research Resource-Saving Recycling Professional Insights Medical Aid Friendly Shield Lv40';
