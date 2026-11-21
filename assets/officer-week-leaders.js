const confirmed=day=>day?.verified===true&&Number.isSafeInteger(day.points)&&day.points>=0;
const weekTotal=person=>{
 if(person.former===true||person.weekly_points_complete===false)return null;
 const days=person.days||[],weekdays=new Set(days.map(day=>day.weekday));
 if(days.length!==6||weekdays.size!==6||!days.every(confirmed))return null;
 return {total:days.reduce((sum,day)=>sum+day.points,0),goalDays:days.filter(day=>day.passed===true).length};
};

export function buildWeekLeaders(vsWeek,donationWeek){
 const excluded={vs:0,donations:0},vs=[];
 for(const person of vsWeek?.members||[]){
  const score=weekTotal(person);
  if(!score){if(person.former!==true)excluded.vs++;continue}
  vs.push({...person,...score});
 }
 const donations=[];
 for(const person of donationWeek?.members||[]){
  if(person.former===true)continue;
  if(!Number.isSafeInteger(person.points)){excluded.donations++;continue}
  donations.push(person);
 }
 const sort=(a,b)=>b.total-a.total||a.name.localeCompare(b.name);
 return {vs:vs.sort(sort).slice(0,10),donations:donations.map(person=>({...person,total:person.points})).sort(sort).slice(0,10),excluded};
}

export function renderWeekLeaders(vsWeek,donationWeek,options={}){
 const {metric='vs',language='de',esc=String,numberText=String}=options,en=language==='en',text=(de,english)=>en?english:de,e=esc,n=numberText;
 if(!vsWeek&&!donationWeek)return '';
 const model=buildWeekLeaders(vsWeek,donationWeek),preReset=vsWeek?.administratively_closed===true||vsWeek?.in_game_final===false;
 const person=(item,index,type)=>{
  const days=type==='vs'?'<div class="native-week-leader-days">'+(item.days||[]).map(day=>'<div><small>'+text('Tag','Day')+' '+n(day.weekday+1)+'</small><strong>'+(confirmed(day)?n(day.points):'—')+'</strong><span>'+(confirmed(day)?(day.passed===true?text('Ziel erreicht','Goal met'):text('Unter Ziel','Below goal')):text('Unbekannt','Unknown'))+'</span></div>').join('')+'</div>':
   '<p class="native-week-leader-delta">'+(Number.isSafeInteger(item.delta)?text('Veränderung zur Vorwoche: ','Change from previous week: ')+(item.delta>0?'+':'')+n(item.delta):text('Kein vergleichbarer Vorwochenwert.','No comparable previous week value.'))+'</p>';
  return '<details class="native-week-leader"><summary><span><b>'+n(index+1)+'. '+e(item.name)+'</b><small>'+e(item.rank)+'</small></span><strong>'+n(item.total)+'</strong><small>'+(type==='vs'?n(item.goalDays)+'/6 '+text('Zieltage','goal days'):text('bestätigt','confirmed'))+'</small></summary><div class="native-week-leader-body">'+days+'<button type="button" data-native-member="'+e(item.id)+'">'+text('Spielerakte & Belege','Member profile & evidence')+'</button></div></details>';
 };
 const leaders=metric==='donations'?model.donations:model.vs,excluded=metric==='donations'?model.excluded.donations:model.excluded.vs;
 const checks=[
  metric==='donations'?n(leaders.length)+' '+text('bestätigte Spendenwerte im Ranking; ','confirmed donation values ranked; ')+n(excluded)+' '+text('ohne bestätigten Wert','without confirmed value'):n(leaders.length)+' '+text('vollständig belegte VS-Wochen im Ranking; ','fully confirmed VS weeks ranked; ')+n(excluded)+' '+text('nicht gewertet','not ranked'),
  metric==='donations'&&donationWeek?.is_complete!==true?text('Spenden sind eine Momentaufnahme, kein finales Wochenergebnis.','Donations are a point-in-time capture, not a final weekly result.'):'',
  preReset?text('Samstag ist ein Pre-Reset-Snapshot, kein offizieller Endstand.','Saturday is a pre-reset snapshot, not an official final result.'):'',
  text('Unbekannte Werte werden nie als 0 oder als besseres Ergebnis gewertet.','Unknown values are never treated as zero or as a better result.')
 ].filter(Boolean);
 return '<section class="native-week-leaders"><div class="native-week-leader-heading"><div><h3>'+text('Top 10 & Fakten-Check','Top 10 & fact check')+'</h3><p class="native-muted">'+e(vsWeek?.week||donationWeek?.week||'')+'</p></div><div class="native-week-leader-tabs" role="group" aria-label="'+text('Kennzahl wählen','Choose metric')+'"><button type="button" data-week-leader-metric="vs" aria-pressed="'+(metric==='vs')+'">VS</button><button type="button" data-week-leader-metric="donations" aria-pressed="'+(metric==='donations')+'">'+text('Spenden','Donations')+'</button></div></div>'+
  '<aside class="native-week-factcheck"><strong>'+text('Fakten-Check','Fact check')+'</strong><ul>'+checks.map(check=>'<li>'+e(check)+'</li>').join('')+'</ul></aside>'+
  '<div class="native-week-leader-list">'+(leaders.length?leaders.map((item,index)=>person(item,index,metric)).join(''):'<p class="native-muted">'+text('Keine vollständig belegten Werte für ein Ranking.','No fully confirmed values for a ranking.')+'</p>')+'</div></section>';
}
