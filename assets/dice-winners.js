export const HISTORY=[
 ['2026-06-16','Flatbottom6892'],['2026-06-30','SoLdieR9322'],
 ['2026-07-14','CroCaine'],['2026-07-22','Prompt Critical'],
 ['2026-08-05','SoLdieR9322'],['2026-08-19','Juan Sin Miedo'],
 ['2026-09-03','Prompt Critical'],['2026-09-16','Bramser Jung'],
 ['2026-09-30','Dennis0106']
].map(([ride_date,winner_name])=>({ride_date,winner_name,origin:'train_sheet'}));
export function diceHistory(live=[]){
 const map=new Map(HISTORY.map(x=>[x.ride_date,x]));
 for(const x of (live||[]))if(x.ride_date&&x.winner_name?.trim())map.set(x.ride_date,x);
 return [...map.values()].sort((a,b)=>b.ride_date.localeCompare(a.ride_date));
}
export function diceDisclosure(lang,esc){
 const label=lang==='de'?'Dice Gewinner':'Dice Game Winners';
 return '<details class="guide-disclosure guide-disclosure--dice" data-search data-filter-item data-guide-id="dice" data-guide-category="alliance" data-search-extra="dice game winners train history"><summary>'+
 esc(label)+' · '+HISTORY.length+'</summary><article class="guide-card guide-card--inside"><p>'+
 esc(lang==='de'?'Bestätigte Gewinner aus dem Zugplan; ohne Namen kein bestätigter Gewinn.':
 'Confirmed train-roster winners. Unnamed entries are not counted.')+
 '</p><ul class="dice-winners-list">'+[...HISTORY].reverse().map(w=>
 '<li><time datetime="'+esc(w.ride_date)+'">'+esc(w.ride_date)+'</time> — <strong>'+
 esc(w.winner_name)+'</strong></li>').join('')+'</ul></article></details>';
}
