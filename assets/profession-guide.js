const COPY={
de:{
title:'🛠 RZSN Engineer Skill Path',
intro:'Engineer ist für den Season-Start die Standardempfehlung für Wachstum. Skillpunkte früh gezielt einsetzen und aktive Skills nicht ungenutzt lassen.',
cap:'Season-1-Hinweis: Aktuelle Guides führen Lv40 als S1-Cap. Die Reihen 45–70 in erweiterten Skilltree-Bildern sind Long-Term / spätere Seasons. Wenn dein Live-Client abweicht, gilt immer die Anzeige im Spiel.',
now:'Day 1 → frühe Season',
later:'Ab Lv30–40 / Extra Points',
future:'Lv45+ · spätere Seasons',
rule:'Grundregel',
ruleText:'Zuerst Profession EXP beschleunigen, dann Bau/Forschung. Die XP-Skills wirken früh am stärksten, weil jeder weitere Tag davon profitiert.',
active:'Aktive Skills richtig nutzen',
activeText:'Rapid Production möglichst regelmäßig nutzen. Build Now nur mit laufenden Bauqueues; Research Now idealerweise mit zwei langen Forschungen gleichzeitig. Cooperative Skills mit einem Allianzmitglied koordinieren — gleiche Buffs nicht verschwenden.',
reset:'Nicht blind den Screenshot kopieren',
resetText:'Der Screenshot ist ein guter Long-Term-Pfad, aber kein Day-1-Build. Temporäre Season-Skills können am Anfang besser sein, weil ihre Punkte am Season-Ende zurückgegeben werden.',
verify:'Skillnamen und genaue Werte können je nach Übersetzung/Version leicht abweichen. Vor dem Punktesetzen kurz den Live-Client prüfen.'
},
en:{
title:'🛠 RZSN Engineer Skill Path',
intro:'Engineer is the default growth pick for the start of the season. Spend skill points deliberately and do not leave useful active skills idle.',
cap:'Season 1 note: current guides list Lv40 as the S1 cap. Rows 45–70 in extended skill-tree images are long-term / later-season tiers. If your live client differs, trust the in-game cap.',
now:'Day 1 → early season',
later:'Lv30–40 / extra points',
future:'Lv45+ · later seasons',
rule:'Core rule',
ruleText:'Accelerate Profession EXP first, then construction and research. XP skills have the strongest compounding value when unlocked early.',
active:'Use active skills properly',
activeText:'Use Rapid Production regularly. Use Build Now only with active build queues; use Research Now ideally while two long researches are running. Coordinate Cooperative skills with an alliance member — do not waste overlapping buffs.',
reset:'Do not blindly copy the screenshot',
resetText:'The screenshot is a useful long-term path, not a Day-1 build. Temporary seasonal skills can be better early because their points are refunded at season end.',
verify:'Skill names and exact values can vary slightly by translation/version. Check your live client before spending points.'
}};const S1=[
['Lv1','Combat Experience 3/3','Seasonal: more Profession EXP from World Map monsters. Take this as early as possible.'],
['Lv1','Outstanding Contribution 1/1','Cheap permanent value from Alliance Tech donations.'],
['Lv5','Extra Meal 1/1','Strong one-point stamina value.'],
['Lv5','Building Inspiration I 3/3','Seasonal: more Profession EXP from seasonal-building upgrades. Early priority.'],
['Lv10','Build for Free 5/5','Cuts free time from every new construction. Core Engineer skill.'],
['Lv10','Research for Free 5/5','Cuts free time from every new research. Core Engineer skill.'],
['Lv15','Build Now 5/5','Active: removes up to 10 hours from active construction queues at max.'],
['Lv15','Research Now 5/5','Active: removes up to 20 hours from active research at max. Best with both Tech Centers running long research.'],
['Lv1+','Rapid Production 5/5','Max after the core XP/build/research priorities; use it regularly.']
];
const MID=[
['Lv20','Rally Rush / Siege Banner','Situational. Spend here only if your alliance role actually uses them.'],
['Lv25','Siege Inspiration / Friendly Aid','Situational city/reinforcement value. Not ahead of the core growth path.'],
['Lv30','Cooperative Construction 2/2','Very strong once points allow it: +building speed for you and one ally.'],
['Lv30','Cooperative Research 2/2','Very strong once points allow it: +research speed for you and one ally.'],
['Lv35','Resource-Saving 5/5','Excellent long-term construction resource reduction.'],
['Lv35','Recycling 5/5','Excellent long-term research resource reduction.'],
['Lv40','Medical Aid / Buddy Shield','PvP/support tools. Useful, but growth skills come first for most members.']
];
const LATER=[
['Lv45','Drone Supply','Strong later-season pick; daily drone resources have lasting value.'],
['Lv45+','Fearless Defense / battlefield utility','Role-dependent; PvP value, not early-growth priority.'],
['Lv50+','Random Visitors / mines / later nodes','Do not assume every node shown in a long-term screenshot deserves points. Re-check current-season value before investing.'],
['Lv60–70','Later-season growth nodes','Only plan these when your current season actually unlocks them; the exact best path changes with season mechanics.']
];function rows(items,e){
return `<div class="profession-path__rows">${items.map(([level,skill,note])=>`<div class="profession-path__row"><span class="profession-path__level">${e(level)}</span><div><strong>${e(skill)}</strong><p>${e(note)}</p></div></div>`).join('')}</div>`;
}
export function professionGuideHtml(lang,escape){
const c=lang==='de'?COPY.de:COPY.en;
const e=value=>escape(value);
return `<section class="profession-path" data-profession-path>
<div class="profession-path__hero"><span class="badge">ENGINEER</span><h3>${e(c.title)}</h3><p>${e(c.intro)}</p></div>
<aside class="profession-path__cap"><strong>S1</strong><p>${e(c.cap)}</p></aside>
<details class="profession-path__section" open><summary>${e(c.now)}</summary>
<div class="profession-path__body"><h4>${e(c.rule)}</h4><p>${e(c.ruleText)}</p>${rows(S1,e)}</div></details>
<details class="profession-path__section"><summary>${e(c.later)}</summary><div class="profession-path__body">${rows(MID,e)}</div></details>
<details class="profession-path__section"><summary>${e(c.future)}</summary><div class="profession-path__body">${rows(LATER,e)}</div></details>
<div class="profession-path__tips"><article><h4>${e(c.active)}</h4><p>${e(c.activeText)}</p></article><article><h4>${e(c.reset)}</h4><p>${e(c.resetText)}</p></article></div>
<p class="profession-path__verify">${e(c.verify)}</p>
</section>`;
}
export const PROFESSION_GUIDE_SEARCH='Engineer Profession Hall Combat Experience Building Inspiration Build for Free Research for Free Build Now Research Now Rapid Production Cooperative Construction Cooperative Research Resource-Saving Recycling Buddy Shield Drone Supply Lv40 Lv45';