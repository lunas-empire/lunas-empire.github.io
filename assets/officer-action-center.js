import {buildVsLongTermReport} from './native-vs-overview.js';

const activeWeek=weeks=>weeks.find(week=>week.state==='final'&&Array.isArray(week.members))||weeks[0]||null;
const activeAbsences=(operations,id)=>((operations?.absences||[]).filter(item=>item.member_id===id&&item.start_date&&item.end_date));

export function buildActionCenter(weeks,operations={},range='4'){
 const analysisRange=range==='8'?'all':range;
 const report=buildVsLongTermReport(weeks,{range:analysisRange});
 const never=new Map(report.neverPerfect.map(item=>[item.id,item]));
 const coaching=report.repeated.map(item=>({id:item.id,name:item.name,lowWeeks:item.lowWeeks,lowDays:item.lowDays,bestMet:never.get(item.id)?.bestMet??null,absences:activeAbsences(operations,item.id)}));
 for(const item of report.neverPerfect)if(!coaching.some(entry=>entry.id===item.id))coaching.push({id:item.id,name:item.name,lowWeeks:0,lowDays:0,bestMet:item.bestMet,absences:activeAbsences(operations,item.id)});
 coaching.sort((a,b)=>b.lowDays-a.lowDays||b.lowWeeks-a.lowWeeks||a.name.localeCompare(b.name));
 const latest=activeWeek(weeks);
 const clarify=(latest?.members||[]).filter(person=>person?.former!==true&&
  (Number(person.unknownDays)>0||person.weekly_points_complete===false)).map(person=>({id:person.id,name:person.name,unknownDays:Number(person.unknownDays)||0,absences:activeAbsences(operations,person.id)}));
 return {coaching,clarify,improved:report.improved.map(item=>({...item,absences:activeAbsences(operations,item.id)}))};
}

export function renderActionCenter(weeks,operations,{range='4',language='de',esc=String,numberText=String}={}){
 const en=language==='en',text=(de,english)=>en?english:de,e=esc,n=numberText;
 const groups=buildActionCenter(weeks,operations,range);
 const reason=item=>{
  const parts=[];
  if(item.lowWeeks)parts.push(n(item.lowWeeks)+text(' Problemwochen',' problem weeks'));
  if(item.lowDays)parts.push(n(item.lowDays)+text(' Tage unter Ziel',' days below goal'));
  if(item.bestMet!==null&&item.bestMet!==undefined)parts.push(text('bester Wert ','best result ')+n(item.bestMet)+'/5');
  if(item.absences.length)parts.push(n(item.absences.length)+text(' Abwesenheit(en)',' absence(s)'));
  return parts.join(text(' · ',' · '));
 };
 const person=item=>'<article class="native-action-person"><div><strong>'+e(item.name)+'</strong><small>'+e(reason(item))+'</small></div><div class="native-action-person-links"><button type="button" data-native-member="'+e(item.id)+'">'+text('Belege','Evidence')+'</button><button type="button" data-native-action-task="'+e(item.id)+'">'+text('Aufgabe','Create task')+'</button></div></article>';
 const section=(key,title,items,empty)=>items.length?'<section class="native-action-group"><h4>'+e(title)+'</h4>'+items.slice(0,12).map(person).join('')+(items.length>12?'<p class="native-muted">'+n(items.length-12)+text(' weitere über Filter/Spielerliste',' more via filters/player list')+'</p>':'')+'</section>':'<section class="native-action-group"><h4>'+e(title)+'</h4><p class="native-muted">'+e(empty)+'</p></section>';
 const uncertainty=item=>({id:item.id,name:item.name,lowWeeks:0,lowDays:0,bestMet:null,unknownDays:item.unknownDays,absences:item.absences});
 const clarifyPerson=item=>'<article class="native-action-person"><div><strong>'+e(item.name)+'</strong><small>'+n(item.unknownDays)+text(' unbestätigte Tage',' unconfirmed days')+(item.absences.length?text(' · ',' · ')+n(item.absences.length)+text(' Abwesenheit(en)',' absence(s)'):'')+'</small></div><div class="native-action-person-links"><button type="button" data-native-member="'+e(item.id)+'">'+text('Belege','Evidence')+'</button><button type="button" data-native-action-task="'+e(item.id)+'">'+text('Aufgabe','Create task')+'</button></div></article>';
 return '<details class="native-fold native-action-center"><summary><span>'+text('Handlungsbedarf','Action required')+'</span><small>'+n(groups.coaching.length+groups.clarify.length)+text(' zu prüfen · Entscheidungshilfe, keine Sanktion',' to review · decision support, no sanction')+'</small></summary><div class="native-fold-body">'+
  section('coaching',text('Coaching & Nachbesprechung','Coaching & follow-up'),groups.coaching,text('Keine akuten Coaching-Gründe im gewählten Zeitraum.','No acute coaching reasons in the selected period.'))+
  '<section class="native-action-group"><h4>'+text('Daten klären','Clarify data')+'</h4>'+(groups.clarify.length?groups.clarify.slice(0,12).map(clarifyPerson).join(''):'<p class="native-muted">'+text('Keine unbestätigten Tageswerte in der neuesten finalen Woche.','No unconfirmed daily values in the latest final week.')+'</p>')+'</section>'+
  section('improved',text('Positive Entwicklung','Positive progress'),groups.improved,text('Noch keine positive Entwicklung belegt.','No positive progress evidenced yet.'))+
  '<p class="native-muted">'+text('Zeitraum: '+(range==='8'?'8 Wochen bzw. alle verfügbaren Aufnahmen':range+' Wochen')+'. Unbekannte Werte sind weder 0 noch Zielverfehlungen.','Period: '+(range==='8'?'8 weeks or all available recordings':range+' weeks')+'. Unknown values are neither zero nor goal failures.')+'</p></div></details>';
}
