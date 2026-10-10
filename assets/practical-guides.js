import { PRACTICAL_GUIDE_IDS, practicalGuideCopy, practicalLabels } from './practical-guide-i18n.js';
import { PRACTICAL_GUIDE_IMAGES } from './practical-guide-images.js';
import { practicalImageCaption } from './practical-guide-captions.js';
import { desertStormRzsnHtml } from './desert-storm-rzsn.js';

const SOURCE_URLS={
  'hero-squad-formations':[
    ['LW Spy','https://lw-spy.com/blog/last-war-best-hero-formation-2026/'],
    ['Heaven Guardian','https://heaven-guardian.com/last-war-squad-lineups-guide/']
  ],
  'drone-chips-components':[
    ['Last War Wiki','https://lastwar.wiki/guides/drone-chip-priorities/'],
    ['Heaven Guardian','https://heaven-guardian.com/last-war-survival-best-drone-chip-priority-guide/']
  ],
  'ur-gear-blueprints':[['Last War Survival','https://lastwarsurvival.com/guides/gear-equipment-progression-guide']],
  'store-buy-priorities':[['Last War Tutorial','https://www.lastwartutorial.com/stores/']],
  'waterfall-troop-training':[
    ['Last War Vault','https://lastwarvault.com/guides/general/waterfall-training-guide/'],
    ['Last War Survival','https://lastwarsurvival.com/guides/troops']
  ],
  'generals-trial':[['Last War Tutorial','https://www.lastwartutorial.com/generals-trial/']],
  'zombie-siege':[['Last War Tutorial','https://www.lastwartutorial.com/zombie-siege/']],
  'marshals-guard':[['Last War Vault','https://www.lastwarvault.com/guides/general/marshals-guard-guide/']],
  'rally-combat-fundamentals':[['Heaven Guardian','https://heaven-guardian.com/last-war-squad-lineups-guide/']],
  'desert-storm':[['LastWars.net','https://www.lastwars.net/desert-storm']],
  'alliance-tech-donations':[['Last War Vault','https://www.lastwarvault.com/guides/general/alliance-tech-guide/']],
  'minister-capitol-buffs':[['Last War Tutorial','https://www.lastwartutorial.com/the-capitol/']]
};

const META=Object.freeze({
  'hero-squad-formations':{group:'squads',category:'account'},
  'drone-chips-components':{group:'squads',category:'account'},
  'ur-gear-blueprints':{group:'squads',category:'account',related:'t10'},
  'store-buy-priorities':{group:'economy',category:'account',related:'black-market'},
  'waterfall-troop-training':{group:'squads',category:'account',related:'vs-friday'},
  'generals-trial':{group:'alliance',category:'account'},
  'zombie-siege':{group:'alliance',category:'account'},
  'marshals-guard':{group:'alliance',category:'account'},
  'rally-combat-fundamentals':{group:'alliance',category:'account',related:'virus'},
  'desert-storm':{group:'alliance',category:'account'},
  'alliance-tech-donations':{group:'alliance',category:'tech',related:'tech'},
  'minister-capitol-buffs':{group:'economy',category:'tech',related:'tech'}
});

const SHOP_PRIORITY={
  de:['Stamina wöchentlich; ausgewählte Speedups/UR Shards','Legendary Gear Blueprints','8h/24h Shields; dann Bedarf','Ressourcenboxen, Chests, Parts/EW Shards'],
  en:['Weekly stamina; selected speedups/UR shards','Legendary Gear Blueprints','8h/24h shields; then needs','Resource boxes, chests, Parts/EW shards'],
  uk:['Щотижнева Stamina; вибрані speedups/UR shards','Legendary Gear Blueprints','8h/24h shields; потім потреби','Ресурси, chests, Parts/EW shards'],
  ja:['週次Stamina、必要なspeedups/UR shards','Legendary Gear Blueprints','8h/24h shields、その後必要品','資源箱、chests、Parts/EW shards'],
  fr:['Stamina hebdo ; speedups/UR shards choisis','Legendary Gear Blueprints','Shields 8h/24h, puis besoins','Ressources, chests, Parts/EW shards'],
  it:['Stamina settimanale; speedups/UR shards scelti','Legendary Gear Blueprints','Shields 8h/24h, poi necessità','Risorse, chests, Parts/EW shards'],
  id:['Stamina mingguan; speedups/UR shards pilihan','Legendary Gear Blueprints','Shields 8h/24h, lalu kebutuhan','Kotak resource, chests, Parts/EW shards'],
  ar:['Stamina أسبوعية وspeedups/UR shards مختارة','Legendary Gear Blueprints','‏Shields 8h/24h ثم الاحتياجات','موارد وchests وParts/EW shards'],
  ko:['주간 Stamina, 필요한 speedups/UR shards','Legendary Gear Blueprints','8h/24h shields 후 필요품','자원 상자, chests, Parts/EW shards'],
  sv:['Veckovis Stamina; valda speedups/UR shards','Legendary Gear Blueprints','8h/24h shields, sedan behov','Resurser, chests, Parts/EW shards'],
  pt:['Stamina semanal; speedups/UR shards escolhidos','Legendary Gear Blueprints','Shields 8h/24h, depois necessidades','Recursos, chests, Parts/EW shards'],
  nl:['Wekelijkse Stamina; gekozen speedups/UR shards','Legendary Gear Blueprints','8h/24h shields, daarna behoefte','Grondstoffen, chests, Parts/EW shards'],
  th:['Stamina รายสัปดาห์ และ speedups/UR shards ที่เลือก','Legendary Gear Blueprints','Shields 8h/24h แล้วจึงของจำเป็น','ทรัพยากร chests และ Parts/EW shards'],
  km:['Stamina ប្រចាំសប្តាហ៍ និង speedups/UR shards','Legendary Gear Blueprints','Shields 8h/24h រួចតាមតម្រូវការ','ធនធាន chests និង Parts/EW shards'],
  fil:['Weekly Stamina; piling speedups/UR shards','Legendary Gear Blueprints','8h/24h shields, saka pangangailangan','Resources, chests, Parts/EW shards']
};

export const PRACTICAL_GUIDES=Object.freeze(Object.fromEntries(PRACTICAL_GUIDE_IDS.map(id=>[
  id,Object.freeze({...META[id],sources:Object.freeze(SOURCE_URLS[id].map(row=>Object.freeze(row)))})
])));

export const PRACTICAL_GUIDE_GROUPS=Object.freeze(['squads','alliance','economy']);
export function practicalGuideTitle(lang,id){
  return practicalGuideCopy(lang,id).title;
}

function formationTable(labels,e){
  const rows=[
    ['Tank','Murphy · Williams','Kimberly · Stetmann · Marshall'],
    ['Aircraft','Carlie · Lucius','DVA · Morrison · Schuyler'],
    ['Missile','Adam · McGregor','Tesla · Fiona · Swift']
  ];
  return `<div class="practical-table-scroll"><table class="practical-table"><thead><tr><th>${e(labels.type)}</th><th>${e(labels.front)}</th><th>${e(labels.back)}</th></tr></thead><tbody>${rows.map(row=>`<tr>${row.map(value=>`<td>${e(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function chipTable(labels,e){
  const rows=[
    ['Interference','Memory Ultra Fission'],
    ['Defense','Gravitational Resonance Armor'],
    ['Initial Move','Absolute Quantum Field'],
    ['Attack','Lethal Firestorm']
  ];
  return `<div class="practical-table-scroll"><table class="practical-table"><thead><tr><th>${e(labels.job)}</th><th>UR Drone Chips</th></tr></thead><tbody>${rows.map(([role,chips])=>`<tr><td>${e(role)}</td><td>${e(chips)}</td></tr>`).join('')}</tbody></table></div>`;
}

function shopTable(lang,labels,e){
  const rows=[['VIP','VIP Points'],['Honor','Honor Points'],['Alliance','Alliance Contribution'],['Campaign','Campaign currency']];
  return `<div class="practical-table-scroll"><table class="practical-table"><thead><tr><th>${e(labels.shop)}</th><th>${e(labels.currency)}</th><th>${e(labels.priority)}</th></tr></thead><tbody>${rows.map((row,index)=>`<tr><td>${e(row[0])}</td><td>${e(row[1])}</td><td>${e(SHOP_PRIORITY[lang][index])}</td></tr>`).join('')}</tbody></table></div>`;
}

function comparison(id,lang,labels,e){
  if(id==='hero-squad-formations') return formationTable(labels,e);
  if(id==='drone-chips-components') return chipTable(labels,e);
  if(id==='store-buy-priorities') return shopTable(lang,labels,e);
  return '';
}

export function practicalGuideHtml(id,lang,escape,{guideHref,relatedTitle}={}){
  const copy=practicalGuideCopy(lang,id);
  const labels=practicalLabels(lang);
  const guide=PRACTICAL_GUIDES[id];
  const photo=PRACTICAL_GUIDE_IMAGES[id];
  const e=escape;
  const caption=practicalImageCaption(lang,id);
  const picture=`<figure class="practical-photo"><a href="${e(photo.src)}" target="_blank" rel="noopener noreferrer" aria-label="${e(caption)}"><img src="${e(photo.src)}" width="${photo.width}" height="${photo.height}" alt="${e(caption)}" loading="lazy" decoding="async"></a><figcaption>${e(caption)} · <a href="${e(photo.sourceUrl)}" target="_blank" rel="noopener noreferrer">${e(photo.sourceName)}</a></figcaption></figure>`;
  const allianceStrategy=id==='desert-storm'?desertStormRzsnHtml(lang,e):'';
  const related=guide.related && guideHref && relatedTitle
    ? `<p class="practical-related"><a href="${e(guideHref(guide.related))}">${e(relatedTitle(guide.related))} →</a></p>`:'';
  const sources=`<footer class="practical-sources">${guide.sources.map(([title,url])=>`<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(title)}</a>`).join(' · ')}</footer>`;
  if(id==='desert-storm') return `<div class="practical-guide">${allianceStrategy}${related}${sources}</div>`;
  return `<div class="practical-guide">${picture}<p class="practical-lead">${e(copy.overview)}</p>${comparison(id,lang,labels,e)}<p class="practical-advice">${e(copy.decision)}</p><p class="practical-note">${e(copy.caution)}</p>${allianceStrategy}${related}${sources}</div>`;
}
