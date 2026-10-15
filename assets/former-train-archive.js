/**
 * Historic train archive compatibility path for the private officer UI.
 * Source names are read exclusively from the authenticated train-manager API.
 * We store only checksums of the nine former-player spellings confirmed by the
 * alliance leadership. Not a source of account IDs or a membership mutation.
 */
const formerFingerprints=new Set([
 'c2e004b744754704dde9e6815351bc0f068df524825c118feb22939fef3eb085',
 'ea0e0580d9f2c8d6127d72fcc3639b4a178755dd5b890501435a514f78a8325b',
 '891d76e5a16b66335cfd38f8b2223f98c1af7468a780f08c972fbb2f4ef2ffab',
 '68665c3a52c9fa7a041637eef6dc21bb42fd6ac49e601e622156565716b38fcd',
 '084328c53a9de563b83b23b6f500521ff442af7cfe60f104574c2c8cce22cf2a',
 '5e67bad52ce5e34d3d5be98f82a73ac6fd26380d1c48ffbdee40fd53fa8a8bc1',
 '68c46b87f5b0c2795d3d7dce758d4c494cc281e1ebf134d2dc7e2084b34346e4',
 'b095856c5601f52020e23157bdcb24bb4ce2754b2510f426993493355a7d98dd',
 'cfe513f665b1e57b7806cd8c2c15f62cf48bc693635e110d79cca7c6f305b1c3'
]);
export const normalizeTrainIdentity=value=>String(value??'').normalize('NFKC')
 .replace(/[\u200B-\u200D\u2060\uFEFF]/gu,'').trim()
 .replace(/\s+/gu,' ').toLocaleLowerCase('en-US');
const validDate=value=>/^20\d{2}-\d{2}-\d{2}$/.test(String(value||''));
async function digestName(name,subtle){
 const bytes=new TextEncoder().encode(normalizeTrainIdentity(name));
 const buffer=await subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(buffer)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function archiveEntry(group){
 const dates=[...new Set(group.dates)].sort().reverse();
 return {name:group.name,ride_count:dates.length,
  dates,source:'historical_train'};
}
/**
 * Prefer private-worker classifications; while the backend rollout is pending,
 * fall back to confirmed former names present in the authenticated train history.
 * Never use fuzzy matching or assign IDs, ranks or invented statistics.
 */
export async function formerArchiveFromTrain(train,registered=[],subtle=globalThis.crypto?.subtle){
 const members=Array.isArray(registered)?registered:[];
 const registeredNames=new Set(members.map(m=>normalizeTrainIdentity(m.name)));
 const entries=new Map(),confirmed=new Set();
 const workerList=Array.isArray(train?.archivedFormerTrainDrivers)?train.archivedFormerTrainDrivers:[];
 // Worker records are authoritative after rollout, but still require valid evidence.
 for(const item of workerList){
  if(item?.source!=='historical_train'||!item.name||!Array.isArray(item.dates))continue;
  const key=normalizeTrainIdentity(item.name);
  if(!key||registeredNames.has(key))continue;
  const dates=item.dates.filter(validDate);
  if(!dates.length)continue;
  entries.set(key,{name:item.name,dates});
 }
 const history=Array.isArray(train?.history)?train.history:[];
 if(subtle){
  const names=new Map();
  for(const ride of history){
   if(ride.status!=='completed'||ride.linked!==false||ride.member_id)continue;
   const name=String(ride.original_name||ride.driver||'').trim(),key=normalizeTrainIdentity(name);
   if(!key||registeredNames.has(key)||!validDate(ride.date))continue;
   if(!names.has(key))names.set(key,name);
  }
  for(const [key,name] of names)
   if(formerFingerprints.has(await digestName(key,subtle)))confirmed.add(key);
  for(const ride of history){
   const key=normalizeTrainIdentity(ride.original_name||ride.driver);
   if(!confirmed.has(key)||!validDate(ride.date))continue;
   const entry=entries.get(key)||{name:ride.original_name||ride.driver,dates:[]};
   entry.dates.push(ride.date);
   entries.set(key,entry);
   ride.former_archive=true;
  }
 }
 const result=[...entries.values()].map(archiveEntry)
  .sort((a,b)=>a.name.localeCompare(b.name,'de'));
 if(train&&typeof train==='object'){
  train.archivedFormerTrainDrivers=result;
  // read-only view model, not persisted to the D1 backend
  train.counts={...(train.counts||{}),historical_former:result.reduce((n,v)=>n+v.ride_count,0)};
 }
 return result;
}
