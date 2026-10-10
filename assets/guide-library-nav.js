// Guide library navigation. Keep category identity independent of translated guide names.
export const GUIDE_TOPIC_ORDER=Object.freeze(['alliance','power','vs','season','economy']);
const ITEMS=Object.freeze({
  alliance:Object.freeze(['generals-trial','zombie-siege','marshals-guard','rally-combat-fundamentals','desert-storm','alliance-tech-donations','train']),
  power:Object.freeze(['hero-squad-formations','drone-chips-components','ur-gear-blueprints','waterfall-troop-training','minister-capitol-buffs','tech','t10']),
  economy:Object.freeze(['store-buy-priorities','black-market'])
});
export function guideTopicOf(id){
  if(!id)return '';
  for(const [topic,items] of Object.entries(ITEMS))if(items.includes(id))return topic;
  if(String(id).startsWith('vs-'))return 'vs';
  return 'season';
}
export function guideTopicCount(topic,seasonGroups,weekdays){
  if(ITEMS[topic])return ITEMS[topic].length;
  if(topic==='vs')return weekdays.length+1;
  if(topic==='season')return seasonGroups.reduce((sum,group)=>sum+group.guides.length,0);
  return 0;
}
const SEARCH_SYNONYMS={
 't10':'unit x tier 10 truppenforschung spezialkräfte special forces',
 'tech':'research forschung unit x technologie',
 'drone-chips-components':'drohne drohnen drone chip chips material',
 'hero-squad-formations':'helden lineup formation aufstellung tank aircraft missile',
 'waterfall-troop-training':'waterfall kasernen ausbilden befördern promotion vs freitag',
 'generals-trial':'general trial generals trial prüfung herausforderung rally',
 'zombie-siege':'zombie siege zombies belagerung verteidigen',
 'marshals-guard':'marshall marshal guard allianc exercise rally',
 'alliance-tech-donations':'allianzforschung allianz forschung alliance research donate spenden',
 'rally-combat-fundamentals':'rally kampf versammlung resistance resistenz',
 'minister-capitol-buffs':'minister buffs capitol secretary of science builder',
 'store-buy-priorities':'shop einkaufen kaufen honor vip alliance campaign',
 'black-market':'schwarzmarkt black market marktplatz',
 'desert-storm':'desert storm wüste sturm',
 'train':'allianzzug zug train tickets gold',
 'profession':'beruf engineer kriegsherr war leader'
};
export function guideSearchExtra(id){return SEARCH_SYNONYMS[id]||'';}
