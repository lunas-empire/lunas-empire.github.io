const confirmed=day=>day?.verified===true&&Number.isSafeInteger(day.points)&&day.points>=0;
const integer=value=>Number.isSafeInteger(value)?value:null;
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

const rankMap=(records,key)=>{
 const sorted=records.filter(item=>integer(item[key])!==null).sort((a,b)=>b[key]-a[key]||a.name.localeCompare(b.name)),ranks=new Map();
 let previous=null,rank=0;
 sorted.forEach((item,index)=>{if(item[key]!==previous){rank=index+1;previous=item[key]}ranks.set(item.id,rank)});
 return {sorted,ranks};
};
const difference=(current,previous)=>integer(current)===null||integer(previous)===null?null:current-previous;
const percent=(delta,base)=>delta===null||!integer(base)||base<=0?null:Math.round(delta/base*1000)/10;
const byId=items=>new Map((items||[]).map(item=>[item.id,item]));

export function buildSmartWeekLeaders(vsWeek,donationWeek,trends={},selectedWeek,previousVsWeek,previousDonationWeek){
 const weeks=[...(trends.weeks||[])].sort((a,b)=>a.week.localeCompare(b.week)),index=weeks.findIndex(week=>week.week===selectedWeek);
 const current=index>=0?weeks[index]:null,previous=index>0?weeks[index-1]:null,previousMembers=byId(previous?.members);
 const donations=byId(donationWeek?.members),previousDonations=byId(previousDonationWeek?.members),vsPeople=byId(vsWeek?.members),previousVs=byId(previousVsWeek?.members);
 const base=current?.members?.length?current.members:[...new Map([...vsPeople.values(),...donations.values()].filter(item=>item.former!==true).map(item=>[item.id,{id:item.id,name:item.name,rank:item.rank}])).values()];
 const records=base.map(member=>{
  const prior=previousMembers.get(member.id),donation=donations.get(member.id),priorDonation=previousDonations.get(member.id),score=weekTotal(vsPeople.get(member.id)||{}),priorScore=weekTotal(previousVs.get(member.id)||{});
  const power=integer(member.power),kills=integer(member.kills),powerDelta=difference(power,prior?.power),killsDelta=difference(kills,prior?.kills);
  const donationValue=integer(donation?.points),donationDelta=difference(donationValue,priorDonation?.points)??integer(donation?.delta),vsValue=score?.total??null,vsDelta=difference(vsValue,priorScore?.total??null);
  const deltas=[powerDelta,killsDelta,donationDelta,vsDelta],improvements=deltas.every(value=>value!==null)?deltas.filter(value=>value>0).length:null;
  return {...member,power,kills,powerDelta,killsDelta,powerPercent:percent(powerDelta,prior?.power),donations:donationValue,donationDelta,
   vs:vsValue,vsDelta,goalDays:score?.goalDays??null,days:vsPeople.get(member.id)?.days||[],improvements};
 });
 const vsRank=rankMap(records,'vs'),powerRank=rankMap(records,'powerDelta'),killsRank=rankMap(records,'killsDelta'),donationRank=rankMap(records,'donations');
 for(const item of records)item.ranks={vs:vsRank.ranks.get(item.id)||null,power:powerRank.ranks.get(item.id)||null,kills:killsRank.ranks.get(item.id)||null,donations:donationRank.ranks.get(item.id)||null};
 const combined=records.filter(item=>Object.values(item.ranks).every(Number.isSafeInteger)).map(item=>({...item,averageRank:Object.values(item.ranks).reduce((sum,value)=>sum+value,0)/4}))
  .sort((a,b)=>a.averageRank-b.averageRank||Math.max(...Object.values(a.ranks))-Math.max(...Object.values(b.ranks))||a.name.localeCompare(b.name));
 const development=records.filter(item=>item.improvements!==null).sort((a,b)=>b.improvements-a.improvements||
  (combined.find(entry=>entry.id===a.id)?.averageRank??999)-(combined.find(entry=>entry.id===b.id)?.averageRank??999)||a.name.localeCompare(b.name));
 return {records,previousWeek:previous?.week||null,lists:{combined,development,growth:powerRank.sorted,kills:killsRank.sorted,donations:donationRank.sorted,vs:vsRank.sorted},
  eligible:{combined:combined.length,development:development.length,growth:powerRank.sorted.length,kills:killsRank.sorted.length,donations:donationRank.sorted.length,vs:vsRank.sorted.length}};
}

const categories=[['combined','Gesamt','Overall'],['development','Entwicklung','Development'],['growth','Wachstum','Growth'],['kills','Kills','Kills'],['donations','Spenden','Donations'],['vs','VS','VS']];

export function renderWeekLeaders(vsWeek,donationWeek,options={}){
 const {metric,language='de',esc=String,numberText=String,trends={},selectedWeek=vsWeek?.week||donationWeek?.week,previousVsWeek=null,previousDonationWeek=null}=options;
 const en=language==='en',text=(de,english)=>en?english:de,e=esc,n=numberText;
 if(!vsWeek&&!donationWeek&&!trends.weeks?.length)return '';
 const fallbackMetric=trends.weeks?.length?'combined':'vs';
 const model=buildSmartWeekLeaders(vsWeek,donationWeek,trends,selectedWeek,previousVsWeek,previousDonationWeek),activeMetric=categories.some(([key])=>key===metric)?metric:fallbackMetric;
 const leaders=(model.lists[activeMetric]||[]).slice(0,10),eligible=model.eligible[activeMetric]||0,excluded=Math.max(0,model.records.length-eligible),preReset=vsWeek?.administratively_closed===true||vsWeek?.in_game_final===false;
 const delta=value=>value===null?'—':(value>0?'+':'')+n(value);
 const decimal=value=>new Intl.NumberFormat(en?'en-US':'de-DE',{maximumFractionDigits:1}).format(value);
 const summary=item=>{
  if(activeMetric==='combined')return 'Ø '+decimal(item.averageRank);
  if(activeMetric==='development')return n(item.improvements)+'/4';
  if(activeMetric==='growth')return delta(item.powerDelta);
  if(activeMetric==='kills')return delta(item.killsDelta);
  if(activeMetric==='donations')return n(item.donations);
  return n(item.vs);
 };
 const breakdown=item=>{
  const row=(label,value,rank)=>'<div><small>'+e(label)+(rank?' · #'+n(rank):'')+'</small><strong>'+e(value)+'</strong></div>';
  return '<div class="native-week-leader-breakdown">'+
   row('VS',item.vs===null?'—':n(item.vs)+(item.goalDays===null?'':' · '+n(item.goalDays)+'/6'),item.ranks.vs)+
   row(text('Power-Wachstum','Power growth'),delta(item.powerDelta)+(item.powerPercent===null?'':' · '+delta(item.powerPercent)+'%'),item.ranks.power)+
   row(text('Kill-Zuwachs','Kill gain'),delta(item.killsDelta),item.ranks.kills)+
   row(text('Spenden','Donations'),item.donations===null?'—':n(item.donations)+' · '+delta(item.donationDelta),item.ranks.donations)+'</div>';
 };
 const person=(item,index)=>'<details class="native-week-leader"><summary><span><b>'+n(index+1)+'. '+e(item.name)+'</b><small>'+e(item.rank)+'</small></span><strong>'+e(summary(item))+'</strong><small>'+e(categories.find(([key])=>key===activeMetric)[en?2:1])+'</small></summary><div class="native-week-leader-body">'+breakdown(item)+
  (activeMetric==='vs'&&item.days.length?'<div class="native-week-leader-days">'+item.days.map(day=>'<div><small>'+text('Tag','Day')+' '+n(day.weekday+1)+'</small><strong>'+(confirmed(day)?n(day.points):'—')+'</strong><span>'+(confirmed(day)?(day.passed===true?text('Ziel erreicht','Goal met'):text('Unter Ziel','Below goal')):text('Unbekannt','Unknown'))+'</span></div>').join('')+'</div>':'')+
  '<button type="button" data-native-member="'+e(item.id)+'">'+text('Spielerakte & Belege','Member profile & evidence')+'</button></div></details>';
 const checks=[
  n(eligible)+' '+text('vollständig belegte Kandidaten; ','fully eligible candidates; ')+n(excluded)+' '+text('nicht in dieser Kategorie gewertet','not ranked in this category'),
  activeMetric==='combined'?text('Gesamt ist der Mittelwert der vier Einzelränge für VS, Power-Wachstum, Kill-Zuwachs und Spenden – kein Ingame-Punkte-Score.','Overall averages the four ranks for VS, power growth, kill gain and donations – not an in-game score.'):'',
  activeMetric==='development'?text('Entwicklung zählt positive Veränderungen nur bei vier belegten Vorwochenvergleichen. Unbekannt ist keine Verschlechterung.','Development counts improvements only with four confirmed previous-week comparisons. Unknown is not a decline.'):'',
  ['growth','kills','development'].includes(activeMetric)&&model.previousWeek?text('Vergleich mit '+model.previousWeek+'; echte 0 und negative Entwicklung bleiben erhalten.','Compared with '+model.previousWeek+'; real zeroes and negative development remain visible.'):'',
  activeMetric==='donations'&&donationWeek?.is_complete!==true?text('Spenden sind eine Momentaufnahme, kein finales Wochenergebnis.','Donations are a point-in-time capture, not a final weekly result.'):'',
  activeMetric==='vs'&&preReset?text('Samstag ist ein Pre-Reset-Snapshot, kein offizieller Endstand.','Saturday is a pre-reset snapshot, not an official final result.'):'',
  text('Unbekannte Werte werden nie als 0 oder als besseres Ergebnis gewertet.','Unknown values are never treated as zero or as a better result.')
 ].filter(Boolean);
 return '<section class="native-week-leaders"><div class="native-week-leader-heading"><div><h3>'+text('Top 10 & Fakten-Check','Top 10 & fact check')+'</h3><p class="native-muted">'+e(selectedWeek||'')+'</p></div><div class="native-week-leader-tabs" role="group" aria-label="'+text('Kennzahl wählen','Choose metric')+'">'+categories.map(([key,de,english])=>'<button type="button" data-week-leader-metric="'+key+'" aria-pressed="'+(activeMetric===key)+'">'+e(en?english:de)+'</button>').join('')+'</div></div>'+
  '<aside class="native-week-factcheck"><strong>'+text('Fakten-Check','Fact check')+'</strong><ul>'+checks.map(check=>'<li>'+e(check)+'</li>').join('')+'</ul></aside>'+
  '<div class="native-week-leader-list">'+(leaders.length?leaders.map(person):'<p class="native-muted">'+text('Keine vollständig belegten Werte für diese Kategorie.','No fully confirmed values for this category.')+'</p>')+'</div></section>';
}
