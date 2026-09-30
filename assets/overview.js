import { TASKS } from './content.js';
import { EVENTS, seasonTasks, isSeasonDailyTask } from './season.js';
import { checklistKey, DAY_MS, resetInstant } from './engine.js';
import { checkedMap } from './storage.js';

// Canonical references also read pre-redesign checkmarks. Updates write every
// equivalent legacy reference, so unchecking never resurrects an old checkmark.
export function taskReferences(kind, id, state) {
  let canonical=kind;
  if (TASKS.some(task=>task.id===id)) canonical='daily';
  else if (kind==='season' || kind==='seasonDaily' || seasonTasks(state).includes(id)) {
    canonical=isSeasonDailyTask(id,state)?'seasonDaily':'season';
  }
  const kinds=[canonical];
  if (canonical==='daily' || kind==='vs' || canonical.startsWith('season')) kinds.push('vs');
  return [...new Set(kinds)].map(item=>({kind:item,key:checklistKey(item,state),id}));
}
export function taskDone(storage, refs) {
  return refs.some(ref=>checkedMap(storage.get(ref.key))[ref.id]);
}
export function writeTask(storage, refs, checked) {
  refs.forEach(ref=>{
    const checks=checkedMap(storage.get(ref.key));
    if (checked) checks[ref.id]=true; else delete checks[ref.id];
    storage.set(ref.key,checks);
  });
}
export function availabilityKey(state) { return `rzsn-unavailable-${state.date}`; }
export function taskToken(ref) { return `${ref.kind}:${ref.id}`; }
export function taskProgress(items) {
  const unique=[...new Map(items.map(item=>[taskToken(item.refs[0]),item])).values()];
  const available=unique.filter(item=>!item.unavailable);
  return {done:available.filter(item=>item.done).length,total:available.length,unavailable:unique.length-available.length};
}
export function taskVisible(item, filter) {
  return filter==='unavailable' ? item.unavailable : !item.unavailable && (filter==='all' || !item.done);
}
export function seasonTaskUnlocked(id, state) {
  const first=EVENTS.find(event=>event.id===id);
  return !first || state.seasonDay>=first.day;
}
export function nextReset(state) {
  const date=new Date(Date.parse(`${state.date}T12:00:00Z`)+DAY_MS).toISOString().slice(0,10);
  return resetInstant(date);
}
export function conciseTask(text) {
  const first=String(text).split(/;|；|。|\.\s+/u)[0].trim();
  return first.length>=24 ? first.replace(/[.!]$/,'') : text;
}
export const TASK_GUIDES=Object.freeze({
  profession:'profession',serumPuzzle:'serum',geneticRecombination:'virus',
  farms:'farmsVri',vri:'farmsVri',firstBlood:'farmsVri',pass:'farmsVri',
  mason:'mason',levelSwap:'mason',wishHero:'wishHero',legion:'legion',
  cityCall:'cityClash',apocalypseCity:'cityClash',centers:'troopBoost',
  warzoneExpedition:'outposts',expansion:'outposts',declarationDay:'warDeclaration',
  infiniteOctagon:'octagon',seasonWarmup:'octagon',finalBattle:'octagon',
  seasonSettlement:'rewards',kim:'weapons',dva:'weapons',tesla:'weapons',
  minister:'tech',research:'tech',tech1:'tech',tech2:'tech',
  star:'vs-secret-missions',secret:'vs-secret-missions',
});
