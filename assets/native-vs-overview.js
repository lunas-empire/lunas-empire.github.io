/** VS week totals are calculated from the six independently confirmed daily values.
 * A partial sum is never represented as a completed weekly score.
 * Missing, inferred, duplicate and unsafe values remain unknown.
 */
import {translateOfficerText} from './native-admin-i18n.js';
import {LOCALES} from './i18n.js';
export function vsDayState(person,weekday,threshold){
 const rows=(person.days||[]).filter(day=>Number(day.weekday)===weekday);
 if(rows.length!==1)return {kind:'unknown',points:null};
 const day=rows[0];
 if(day.quality==='before_join')return {kind:'joined',points:null};
 const verified=day.verified===true||(day.verified!==false&&['observed','corrected'].includes(day.quality));
 if(!verified||!Number.isSafeInteger(day.points)||day.points<0)return {kind:'unknown',points:null};
 const passed=Number.isSafeInteger(threshold)&&threshold>=0?day.points>=threshold:day.passed;
 return {kind:passed===true?'met':passed===false?'low':'unknown',points:day.points};
}
function weeklyDelta(person){
 const trend=Array.isArray(person?.weekTrend)?person.weekTrend:[];
 const current=trend[0],previous=trend[1];
 if(!current||!previous||!Number.isSafeInteger(current.points)||!Number.isSafeInteger(previous.points))return null;
 return {week:previous.week,delta:current.points-previous.points};
}
export function vsResultGroups(week,{day=-1,category='all',sort='priority',query='',language='de'}={}){
 const daily=Number.isInteger(day)&&day>=0&&day<6,threshold=week.threshold;
 const people=week.members||[],counts={low:0,unknown:0,joined:0,met:0};
 const kind=person=>daily?vsDayState(person,day,threshold).kind:
  person.failed>0?'low':person.unknown>0?'unknown':person.beforeJoin>0?'joined':'met';
 const names=new Intl.Collator(LOCALES[language]||'de-DE',{numeric:true,sensitivity:'base'});
 const score=person=>daily?vsDayState(person,day,threshold).points:derivedVsWeekTotal(person.days).total;
 const points=(a,b,direction)=>{const av=score(a),bv=score(b);return av===null?(bv===null?0:1):bv===null?-1:direction*(av-bv)};
 const compare=(a,b)=>{
  let order=0;
  if(sort==='points_desc'||sort==='points_asc')order=points(a,b,sort==='points_desc'?-1:1);
  else if(sort==='improvement'){
   const av=weeklyDelta(a)?.delta??null,bv=weeklyDelta(b)?.delta??null;
   order=av===null?(bv===null?0:1):bv===null?-1:bv-av;
  }
  else if(sort==='rank')order=(Number(String(b.rank||'').slice(1))||0)-(Number(String(a.rank||'').slice(1))||0);
  else if(sort!=='name')order=daily?points(a,b,kind(a)==='low'?1:-1):Number(b.failed||0)-Number(a.failed||0)||Number(b.unknown||0)-Number(a.unknown||0);
  return order||names.compare(String(a.name||''),String(b.name||''))||String(a.id||'').localeCompare(String(b.id||''));
 };
 const normalized=String(query).normalize('NFKC').trim().toLocaleLowerCase();
 const buckets={low:[],unknown:[],joined:[],met:[]};
 for(const person of people){const group=kind(person);counts[group]++;
  if(String(person.name||'').normalize('NFKC').toLocaleLowerCase().includes(normalized))buckets[group].push(person);
 }
 const labels={low:'Unter Tagesziel',unknown:daily?'Unbekannt':'Messwerte unvollständig',joined:daily?'Vor Beitritt':'Beitritt während der Woche',met:'Tagesziel erreicht'};
 const groups=Object.keys(buckets).filter(key=>category==='all'||key===category)
  .map(key=>({kind:key,label:labels[key],members:buckets[key].sort(compare)})).filter(group=>group.members.length);
 const matching=(category==='all'?Object.values(buckets).flat():buckets[category]||[]).sort(compare);
 return {groups,matching,counts,matchingCount:groups.reduce((sum,group)=>sum+group.members.length,0),daily};
}
export function derivedVsWeekTotal(days=[]){
 const entries=new Map(), duplicates=new Set();
 for(const day of Array.isArray(days)?days:[]){
  const weekday=Number(day?.weekday);
  if(!Number.isInteger(weekday)||weekday<0||weekday>5)continue;
  if(entries.has(weekday))duplicates.add(weekday);
  else entries.set(weekday,day);
 }
 let sum=0,confirmed=0;
 for(let weekday=0;weekday<6;weekday++){
  const day=entries.get(weekday);
  const valid=day&&!duplicates.has(weekday)&&
   (day.verified===true||(day.verified!==false&&['observed','corrected'].includes(day.quality)))&&
   Number.isSafeInteger(day.points)&&day.points>=0;
  if(valid){
   if(!Number.isSafeInteger(sum+day.points))return {total:null,partial:null,confirmed,complete:false};
   sum+=day.points;
   confirmed++;
  }
 }
 return {total:confirmed===6?sum:null,partial:confirmed?sum:null,confirmed,complete:confirmed===6};
}
export function buildVsLongTermReport(weeks,{range='4',lowThreshold=3600000,highThreshold=7200000,language='de',sort={},from=null,to=null}={}){
 const ordered=[...new Map((Array.isArray(weeks)?weeks:[]).filter(week=>week?.week).map(week=>[String(week.week),week])).values()]
  .sort((a,b)=>String(b.week).localeCompare(String(a.week)));
 let selected;
 if(range==='custom'){
  let start=String(from||ordered.at(-1)?.week||''),end=String(to||ordered[0]?.week||'');if(start>end)[start,end]=[end,start];
  selected=ordered.filter(week=>String(week.week)>=start&&String(week.week)<=end);
 }else if(range==='all')selected=ordered;
 else selected=ordered.slice(0,[2,3,4].includes(Number(range))?Number(range):4);
 const identities=new Map(),days=Array.from({length:5},(_,weekday)=>({weekday,confirmedIds:new Set(),unknownIds:new Set(),lowMetIds:new Set(),highMetIds:new Set()}));
 for(const week of selected){
  const rows=new Map();
  for(const person of [...(week.members||[]),...(week.missingMembers||[])]){
   if(person?.former===true)continue;
   const id=String(person?.id||'').trim();if(!id)continue;
   const list=rows.get(id)||[];list.push(person);rows.set(id,list);
  }
  for(const [id,list] of rows){
   if(list.length!==1)continue;
   const person=list[0],states=days.map((_,weekday)=>vsDayState(person,weekday,lowThreshold));
   const confirmed=states.filter(state=>state.kind==='met'||state.kind==='low').length;
   const metDays=states.filter(state=>state.kind==='met').length,lowDays=states.filter(state=>state.kind==='low').length;
   let points=0;for(const state of states)if(Number.isSafeInteger(state.points))points+=state.points;
   const record={week:String(week.week),complete:confirmed===5,metDays,lowDays,points:confirmed===5&&Number.isSafeInteger(points)?points:null};
   if(!identities.has(id))identities.set(id,{id,name:String(person.name||id),rank:String(person.rank||''),records:[]});
   identities.get(id).records.push(record);
   states.forEach((state,weekday)=>{
    const day=days[weekday];
    if(state.kind==='met'||state.kind==='low'){
     day.confirmedIds.add(id);if(state.points>=lowThreshold)day.lowMetIds.add(id);if(state.points>=highThreshold)day.highMetIds.add(id);
    }else if(state.kind==='unknown')day.unknownIds.add(id);
   });
  }
 }
 const names=new Intl.Collator(language==='en'?'en-US':'de-DE',{numeric:true,sensitivity:'base'});
 const repeated=[],neverPerfect=[],improved=[];
 for(const identity of identities.values()){
  const complete=identity.records.filter(record=>record.complete);
  const lowWeeks=identity.records.filter(record=>record.lowDays>=3);
  if(lowWeeks.length>=2)repeated.push({...identity,lowWeeks:lowWeeks.length,lowDays:lowWeeks.reduce((sum,record)=>sum+record.lowDays,0)});
  if(complete.length>=3&&!complete.some(record=>record.metDays===5))neverPerfect.push({...identity,completeWeeks:complete.length,bestMet:Math.max(...complete.map(record=>record.metDays))});
  if(complete.length>=2){
   const latest=complete[0],earliest=complete.at(-1),metDelta=latest.metDays-earliest.metDays;
   const pointsDelta=latest.points===null||earliest.points===null?null:latest.points-earliest.points;
   if(metDelta>0||(metDelta===0&&pointsDelta>0))improved.push({...identity,earliest,latest,metDelta,pointsDelta});
  }
 }
 const byName=(a,b)=>names.compare(a.name,b.name)||a.id.localeCompare(b.id);
 const byRank=(a,b)=>(Number(String(b.rank).slice(1))||0)-(Number(String(a.rank).slice(1))||0)||byName(a,b);
 const repeatedSort={days:(a,b)=>b.lowDays-a.lowDays||byName(a,b),name:byName,rank:byRank,
  problems:(a,b)=>b.lowWeeks-a.lowWeeks||b.lowDays-a.lowDays||byName(a,b)};
 const neverSort={close:(a,b)=>b.bestMet-a.bestMet||byName(a,b),weeks:(a,b)=>b.completeWeeks-a.completeWeeks||byName(a,b),name:byName,rank:byRank,
  problems:(a,b)=>a.bestMet-b.bestMet||b.completeWeeks-a.completeWeeks||byName(a,b)};
 const improvedSort={points:(a,b)=>(b.pointsDelta??-Infinity)-(a.pointsDelta??-Infinity)||byName(a,b),name:byName,rank:byRank,
  progress:(a,b)=>b.metDelta-a.metDelta||(b.pointsDelta??-Infinity)-(a.pointsDelta??-Infinity)||byName(a,b)};
 repeated.sort(repeatedSort[sort.repeated]||repeatedSort.problems);
 neverPerfect.sort(neverSort[sort.never]||neverSort.problems);
 improved.sort(improvedSort[sort.improved]||improvedSort.progress);
 const dayResults=days.map(day=>({weekday:day.weekday,confirmed:day.confirmedIds.size,unknown:day.unknownIds.size,lowMet:day.lowMetIds.size,highMet:day.highMetIds.size}));
 return {weeks:selected.map(week=>String(week.week)),days:dayResults,repeated,neverPerfect,improved,memberCount:identities.size};
}
export function vsLongTermReportText(report,{language='de'}={}){
 const en=language==='en',text=(de,english)=>en?english:de,labels=en?['Mon','Tue','Wed','Thu','Fri']:['Mo','Di','Mi','Do','Fr'];
 const percent=(value,total)=>total?Math.round(100*value/total)+'%':'—';
 const lines=['RZSN VS '+text('Mo–Fr','Mon–Fri')+' | '+(report.weeks.at(-1)||'—')+'–'+(report.weeks[0]||'—'),
  text('Samstag ausgeschlossen. Nur bestätigte Werte; unbekannt ist nicht 0.','Saturday excluded. Confirmed values only; unknown is not zero.')];
 for(const day of report.days)lines.push(labels[day.weekday]+': '+day.lowMet+'/'+day.confirmed+' ≥ '+(en?'3.6M':'3,6 Mio.')+' ('+percent(day.lowMet,day.confirmed)+') | '+day.highMet+'/'+day.confirmed+' ≥ '+(en?'7.2M':'7,2 Mio.')+' ('+percent(day.highMet,day.confirmed)+')');
 const append=(title,items,detail)=>{
  lines.push('',title+' ('+items.length+')');
  if(items.length)for(const item of items)lines.push(item.name+' — '+detail(item));
  else lines.push(text('Keine Spieler im gewählten Zeitraum.','No players in the selected period.'));
 };
 append(text('Wiederholt unter dem Tagesziel','Repeatedly below the daily goal'),report.repeated,item=>item.lowWeeks+text(' Wochen / ',' weeks / ')+item.lowDays+text(' Tage unter Ziel',' days below goal'));
 append(text('Noch nie 5/5','Never reached 5/5'),report.neverPerfect,item=>item.completeWeeks+text(' vollständige Wochen / bester Wert ',' complete weeks / best ')+item.bestMet+'/5');
 append(text('Positive Entwicklung','Positive progress'),report.improved,item=>item.earliest.week+' '+item.earliest.metDays+'/5 → '+item.latest.week+' '+item.latest.metDays+'/5');
 lines.push('',text('Entscheidungshilfe, keine automatische Sanktion.','Decision support only; no automatic sanctions.'));
 return lines.join('\n');
}
export function buildVsHistory(weeks){
 const ordered=[...new Map((Array.isArray(weeks)?weeks:[]).filter(week=>week?.week).map(week=>[String(week.week),week])).values()]
  .sort((a,b)=>String(b.week).localeCompare(String(a.week)));
 return ordered.map(week=>{
  const totals=(week.dayTotals||[]),confirmed=totals.reduce((sum,day)=>sum+Number(day.passed||0)+Number(day.failed||0),0);
  const met=totals.reduce((sum,day)=>sum+Number(day.passed||0),0),unknown=totals.reduce((sum,day)=>sum+Number(day.unknown||0),0);
  return {week:String(week.week),state:week.state,confirmed,met,unknown,percent:confirmed?Math.round(100*met/confirmed):null,perfect:Number.isSafeInteger(week.perfect)?week.perfect:null};
 });
}
export function renderVsHistory(weeks,currentWeek,{language='de',esc=String,numberText=String}={}){
 const history=buildVsHistory(weeks),en=language==='en',e=esc,n=numberText,text=(de,english)=>en?english:de;
 if(!history.length)return '';
 return '<details class="native-fold native-vs-history"><summary><span>'+text('Wochenverlauf','Weekly history')+'</span><small>'+history.length+' '+text('Wochen · zum Wechseln antippen','weeks · tap to open')+'</small></summary>'+
  '<div class="native-fold-body"><div class="native-vs-history-chart" aria-label="'+text('Zielerreichung je Woche','Goal attainment by week')+'">'+
  history.map(item=>'<button type="button" class="native-vs-history-row" data-native-vs-history-week="'+e(item.week)+'" aria-pressed="'+(item.week===currentWeek)+'">'+
   '<strong>'+e(item.week)+'</strong><span class="native-vs-history-track" aria-hidden="true"><i style="width:'+(item.percent??0)+'%"></i></span>'+
   '<b>'+(item.percent===null?'—':n(item.percent)+'%')+'</b><small>'+n(item.met)+'/'+n(item.confirmed)+' '+text('bestätigt','confirmed')+
   (item.unknown?' · '+n(item.unknown)+' '+text('unklar','unknown'):'')+(item.perfect===null?'':' · '+n(item.perfect)+'× 6/6')+'</small></button>').join('')+
  '</div><p class="native-muted">'+text('Anteil erreichteter Tagesziele an bestätigten Spieler-Tagen. Unbekannte Werte fehlen im Nenner.','Met daily goals as a share of confirmed player-days. Unknown values are excluded from the denominator.')+'</p></div></details>';
}
export function renderVsLongTermReport(weeks,{range='4',language='de',esc=String,numberText=String,currentWeek=null,sort={},from=null,to=null}={}){
 const report=buildVsLongTermReport(weeks,{range,language,sort,from,to}),en=language==='en',e=esc,n=numberText;
 const lowLabel=en?'3.6M':'3,6 Mio.',highLabel=en?'7.2M':'7,2 Mio.';
 const text=(de,english)=>en?english:de,percent=(value,total)=>total?Math.round(100*value/total)+'%':'—';
 const labels=en?['Mon','Tue','Wed','Thu','Fri']:['Mo','Di','Mi','Do','Fr'];
 const dayHtml=report.days.map((day,index)=>'<article><button type="button" class="native-vs-report-day" data-native-vs-day="'+index+'" aria-label="'+text(labels[index]+' in der aktuellen Woche öffnen','Open '+labels[index]+' in the selected week')+'"><strong>'+labels[index]+'</strong>'+
  '<span><small>'+text('Mitglieder belegt','members confirmed')+'</small><b>'+n(day.confirmed)+'</b></span>'+
  '<span><small>≥ '+lowLabel+'</small><b>'+n(day.lowMet)+' <em>'+percent(day.lowMet,day.confirmed)+'</em></b></span>'+
  '<span><small>≥ '+highLabel+'</small><b>'+n(day.highMet)+' <em>'+percent(day.highMet,day.confirmed)+'</em></b></span></button></article>').join('');
 const memberButton=(item,detail,kind)=>{
  const matches=[...(currentWeek?.members||[]),...(currentWeek?.missingMembers||[])].filter(person=>String(person?.id||'')===item.id);
  const person=matches.length===1?matches[0]:null,weekDays=en?['Mon','Tue','Wed','Thu','Fri','Sat']:['Mo','Di','Mi','Do','Fr','Sa'];
  const daysHtml=person?weekDays.map((label,weekday)=>{
   const state=vsDayState(person,weekday,currentWeek.threshold),beforeJoin=state.kind==='joined';
   const value=state.points===null?text(beforeJoin?'Vor Beitritt':'Unbekannt',beforeJoin?'Before joining':'Unknown'):n(state.points);
   const status=beforeJoin?'is-before-join':state.kind==='met'?'is-good':state.kind==='low'?'is-bad':'is-unknown';
   return '<div class="native-vs-person-day '+status+'"><span>'+label+'</span>'+(state.points===null?'<span class="native-muted">'+value+'</span>':
    '<button type="button" class="native-vs-day-link" data-native-vs-image="'+e(currentWeek.week+'|'+item.id+'|'+weekday)+'" aria-label="'+
    text('VS-Beleg '+label+' für ','VS proof '+label+' for ')+e(item.name)+'">'+value+' ↗</button>')+'</div>';
  }).join(''):'<p class="native-muted">'+text('Kein eindeutiger Tageswert in der ausgewählten Woche.','No unambiguous daily result in the selected week.')+'</p>';
  return '<details class="native-vs-report-member native-vs-report-person"><summary><span><strong data-native-no-translate>'+e(item.name)+'</strong><small>'+e(detail)+'</small></span>'+
   (kind==='improved'&&item.latest.metDays===5?'<b>'+text('Jetzt 5/5','Now 5/5')+'</b>':'')+'</summary>'+
   '<div class="native-vs-report-person-body">'+(person?'<p class="native-muted">'+text('Tageswerte & Bildbelege','Daily results & image proofs')+' · '+e(currentWeek.week)+'</p>':'')+
   (person?'<div class="native-vs-person-daygrid">'+daysHtml+'</div>':daysHtml)+
   '<button type="button" class="native-vs-open-person" data-native-member="'+e(item.id)+'">'+text('Spielerakte & Entwicklung','Player profile & progress')+' ›</button></div></details>';
 };
 const sortOptions={
  repeated:[['problems',text('Problemwochen zuerst','Most problem weeks')],['days',text('Meiste Tage unter Ziel','Most days below goal')],['name','Name'],['rank',text('Allianzrang','Alliance rank')]],
  never:[['problems',text('Niedrigster Bestwert','Lowest best result')],['close',text('Bestwert 4/5 zuerst','Best result 4/5 first')],['weeks',text('Meiste vollständige Wochen','Most complete weeks')],['name','Name'],['rank',text('Allianzrang','Alliance rank')]],
  improved:[['progress',text('Größte Verbesserung','Greatest improvement')],['points',text('Größter Punktezuwachs','Greatest points increase')],['name','Name'],['rank',text('Allianzrang','Alliance rank')]]
 };
 const group=(key,title,items,empty,detail)=>{
  const options=sortOptions[key],selected=sort[key]||options[0][0];
  const controls=items.length>1?'<label class="native-vs-report-sort-control"><span>'+text('Sortieren','Sort')+'</span><select data-native-vs-report-sort="'+key+'">'+
   options.map(([value,label])=>'<option value="'+value+'" '+(selected===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label>':'';
  return '<details class="native-fold native-vs-report-group native-vs-report-'+key+'"><summary><span>'+title+'</span><b>'+items.length+'</b></summary>'+
   '<div class="native-fold-body">'+controls+'<p class="native-muted">'+empty+'</p><div class="native-vs-report-member-list">'+
   (items.length?items.map(item=>memberButton(item,detail(item),key)).join(''):'<span class="native-muted">'+text('Keine Spieler erfüllen diese Bedingung im gewählten Zeitraum.','No players meet this condition in the selected period.')+'</span>')+'</div></div></details>';
 };
 const groups=group('repeated',text('Wiederholt unter dem Tagesziel','Repeatedly below the daily goal'),report.repeated,
  text('Mindestens 2 Wochen mit je mindestens 3 bestätigten Mo–Fr-Tagen unter '+lowLabel+'.','At least 2 weeks with at least 3 confirmed Mon–Fri days below '+lowLabel+' each.'),
  item=>text(item.lowWeeks+' Wochen · '+item.lowDays+' bestätigte Tage unter Ziel',item.lowWeeks+' weeks · '+item.lowDays+' confirmed days below goal'))+
  group('never',text('Noch nie 5/5 erreicht','Never reached 5/5'),report.neverPerfect,
   text('Mindestens 3 vollständig erfasste Mo–Fr-Wochen; unvollständige Wochen zählen nicht.','At least 3 fully recorded Mon–Fri weeks; incomplete weeks do not count.'),
   item=>text(item.completeWeeks+' vollständige Wochen · bester Wert '+item.bestMet+'/5',item.completeWeeks+' complete weeks · best result '+item.bestMet+'/5'))+
  group('improved',text('Positive Entwicklung','Positive progress'),report.improved,
   text('Vergleich der ersten und letzten vollständig erfassten Mo–Fr-Woche derselben ID.','Compares the first and last fully recorded Mon–Fri week for the same ID.'),
   item=>item.earliest.week+' '+item.earliest.metDays+'/5 → '+item.latest.week+' '+item.latest.metDays+'/5'+
    (item.pointsDelta===null?'':text(' · Punkte ',' · points ')+(item.pointsDelta>0?'+':'')+n(item.pointsDelta)));
 const weekChoices=[...new Set((Array.isArray(weeks)?weeks:[]).map(week=>String(week?.week||'')).filter(Boolean))].sort().reverse();
 const fromValue=from||weekChoices.at(-1)||'',toValue=to||weekChoices[0]||'';
 const rangeOption=(value,de,english)=>'<option value="'+value+'" '+(range===value?'selected':'')+'>'+text(de,english)+'</option>';
 const weekOptions=weekChoices.map(week=>'<option value="'+e(week)+'">'+e(week)+'</option>').join('');
 const custom='<div class="native-vs-report-custom" '+(range==='custom'?'':'hidden')+'><label>'+text('Von Woche','From week')+'<select id="native-vs-report-from">'+
  weekOptions.replace('value="'+e(fromValue)+'"','value="'+e(fromValue)+'" selected')+'</select></label><label>'+text('Bis Woche','To week')+'<select id="native-vs-report-to">'+
  weekOptions.replace('value="'+e(toValue)+'"','value="'+e(toValue)+'" selected')+'</select></label></div>';
 return '<details class="native-fold native-vs-longterm-fold"><summary><span>'+text('Mo–Fr & Langzeit','Mon–Fri & long-term')+'</span><small>'+report.memberCount+' '+text('aktive Mitglieder · Analyse öffnen','active members · open analysis')+'</small></summary><div class="native-fold-body">'+
  '<section class="native-vs-longterm" aria-labelledby="native-vs-longterm-title"><div class="native-intel-section-head"><h3 id="native-vs-longterm-title">'+
  text('Mo–Fr & Langzeit','Mon–Fri & long-term')+'</h3><label>'+text('Zeitraum','Period')+' <select id="native-vs-report-range">'+
  rangeOption('2',text('Letzte 2 Wochen','Last 2 weeks'),'Last 2 weeks')+rangeOption('3',text('Letzte 3 Wochen','Last 3 weeks'),'Last 3 weeks')+
  rangeOption('4',text('Letzte 4 Wochen','Last 4 weeks'),'Last 4 weeks')+rangeOption('all',text('Alle erfassten Wochen','All recorded weeks'),'All recorded weeks')+
  rangeOption('custom',text('Benutzerdefiniert','Custom'),'Custom')+'</select></label></div>'+custom+
  '<p class="native-vs-report-scope">'+e(report.weeks.at(-1)||'—')+'–'+e(report.weeks[0]||'—')+' · '+report.memberCount+' '+text('aktive Mitglieder','active members')+
  ' · '+text('Samstag ausgeschlossen · pro Mitglied einmal gezählt','Saturday excluded · each member counted once')+'</p><div class="native-vs-report-days">'+dayHtml+'</div><div class="native-vs-report-groups">'+groups+'</div>'+
  '<div class="native-vs-report-actions"><button type="button" data-native-vs-copy-report>'+text('Bericht kopieren','Copy report')+'</button><span role="status" aria-live="polite"></span></div>'+
  '<textarea class="native-vs-report-fallback" readonly hidden aria-label="'+text('Berichtstext zum manuellen Kopieren','Report text for manual copying')+'"></textarea>'+
  '<p class="native-muted">'+text('Nur aktuell aktive Mitglieder und bestätigte Werte derselben member_id. Unbekannt ist weder 0 noch eine Zielverfehlung. Der Bericht ist Entscheidungshilfe, keine automatische Sanktion.',
   'Only currently active members and confirmed values for the same member_id. Unknown is neither zero nor a missed goal. This report supports decisions; it does not apply automatic sanctions.')+'</p></section></div></details>';
}
/** Compact VS cockpit. Never implies an unverified weekly image or screenshot timestamp exists. */
export function vsDataFreshness(week,formatTime){
 const stamp=week?.captured_at ? formatTime(week.captured_at) : null;
 const imported=week?.imported_at ? formatTime(week.imported_at) : null;
 return {capture:stamp||'Nicht erfasst',imported:imported||'Unbekannt',
  captureKnown:Boolean(stamp),isFinal:week?.state==='final'};
}
export function renderVsOverview(week,policy={},api={}){
 const {esc,numberText,formatTime}=api;
 const e=esc, n=numberText;
 const members=week.members||[],days=['Mo','Di','Mi','Do','Fr','Sa'];
 const language=api.language||'de';
 const view=api.view||{},result=vsResultGroups(week,{...view,language}),tr=source=>e(translateOfficerText(source,language));
 const privateText=[],privateName=value=>{const index=privateText.push(e(value))-1;return '__RZSN_PRIVATE_'+index+'__'};
 const translated=[
  ['Screenshot-Uhrzeit nicht erfasst','Screenshot time not recorded'],
  ['Historische Screenshots haben keine hinterlegte Aufnahmeuhrzeit','Historical screenshots have no recorded capture time'],
  ['WOCHENPUNKTE','WEEKLY POINTS'],
  ['Wochenbeleg fehlt · ergänzen','Weekly proof missing · attach'],
  ['Originalbeleg ansehen','View original proof'],
  ['Keine bestätigten Wochenpunkte hinterlegt.','No confirmed weekly total available.'],
  ['Spielerakte & Entwicklung öffnen','Open player profile and progress'],
  ['Messwerte unvollständig','Incomplete measurements'],
  ['Spieler nach Ergebnis','Players by result'],
  ['Keine Spieler in dieser Gruppe.','No players in this group.'],
  ['Noch keine Spieler für diese Woche.','No players recorded for this week.'],
  ['Unter Tagesziel','Below daily target'],
  ['Tagesziel erreicht','Daily goal reached'],
  ['Beitritt während der Woche','Joined during week'],
  ['Vor Beitritt','Before joining'],
  ['vor Beitritt','before joining'],
  ['nach Beitritt','after joining'],
  ['Tagesvergleich','Daily comparison'],
  ['bestätigte Werte','confirmed results'],
  ['bestätigte Tageswerte','confirmed daily results'],
  ['erfasste Spieler','tracked players'],
  ['Ziel erreicht','goal met'],
  ['aktive Tage','active days'],
  ['unter Ziel','below goal'],
  [' unter',' below'],
  ['alle Tagesziele erreicht','all daily targets met'],
  ['Wochenpunkte','weekly points'],
  ['Aus sechs Tageswerten berechnet','Calculated from six daily values'],
  ['Teilstand','Partial total'],
  ['Tage bestätigt','days confirmed'],
  ['Wochensumme erst mit 6 bestätigten Tagen','Weekly total only after 6 confirmed days'],
  ['Noch kein bestätigter Tageswert','No confirmed daily values yet'],
  ['Quellzeit der Aufnahme','Original file capture time'],
  ['Screenshot-Aufnahme','Screenshot captured'],
  ['DATENSTAND','DATA STATUS'],
  ['Vorläufig','Provisional'],
  ['Finalisiert','Finalized'],
  ['keine Nullwerte','unknown is not zero'],
  ['Unbekannt','Unknown'],
  ['unklar','unknown'],
  [' erfasst',' captured'],
  ['Spieler','players'],
  ['Ziel','goal']
 ];
 translated.unshift(['bestätigten IDs','confirmed IDs'],['bestätigte IDs','confirmed IDs'],[' IDs im Umfang',' IDs in scope'],['% der ','% of '],['Sortieren nach','Sort by'],['Tage unter Ziel','Days below goal'],['Punkte: höchste zuerst','Points: highest first'],['Punkte: niedrigste zuerst','Points: lowest first']);
 translated.push(['Entwicklung','Development'],[' verbessert',' improved'],[' gesunken',' declined'],[' unverändert',' unchanged'],
  ['Kein Vergleich: vollständige Wochenpunkte fehlen','No comparison: complete weekly points are missing'],
  ['Verbesserung zuerst','Most improved first'],['Nur vollständig bestätigte Wochenpunkte derselben ID','Only fully confirmed weekly points for the same ID']);
 const loc=html=>(language==='de'?html:translated.reduce((s,[a,b])=>s.replaceAll(a,b),html))
  .replace(/__RZSN_PRIVATE_(\d+)__/g,(token,index)=>privateText[Number(index)]??token);

 const meta=vsDataFreshness(week,formatTime);
 const verified=members.reduce((v,p)=>v+(Number.isSafeInteger(p.verified)?p.verified:(p.days||[]).filter(d=>d?.verified===true&&Number.isSafeInteger(d.points)).length),0);
 const developments=members.map(weeklyDelta).filter(Boolean),previousWeek=week.comparisons?.previous?.week||developments[0]?.week;
 const trendHtml=developments.length?'<section class="native-vs-development" aria-label="Entwicklung zur Vorwoche">'+
  '<strong>Entwicklung'+(previousWeek?' zu '+e(previousWeek):'')+'</strong><span>'+
  developments.filter(item=>item.delta>0).length+' verbessert · '+developments.filter(item=>item.delta<0).length+' gesunken · '+
  developments.filter(item=>item.delta===0).length+' unverändert</span><small>Nur vollständig bestätigte Wochenpunkte derselben ID</small></section>':'';
 const h='<div class="native-capture-banner '+(meta.captureKnown?'is-dated':'is-undated')+'">'+
  '<div class="native-capture-banner-main"><small>DATENSTAND · VS '+e(week.week)+'</small>'+
  '<strong>'+(meta.captureKnown?'Screenshot-Aufnahme: '+e(meta.capture):'Screenshot-Uhrzeit nicht erfasst')+'</strong>'+
  '<span>'+(meta.captureKnown?'Quellzeit der Aufnahme':'Historische Screenshots haben keine hinterlegte Aufnahmeuhrzeit')+
  ' · Import: '+e(meta.imported)+'</span></div>'+
  '<span class="native-capture-state '+(meta.isFinal?'is-final':'is-preliminary')+'">'+
  (meta.isFinal?'Finalisiert':'Vorläufig')+'</span></div>';
 const dayTiles='<section class="native-vs-day-overview" aria-label="Tagesvergleich von Montag bis Samstag">'+
  '<div class="native-intel-section-head"><h3>Tagesvergleich</h3><span>Mo–Sa · bestätigte Werte</span></div>'+
  '<div class="native-day-overview-grid">'+days.map((label,i)=>{
   const d=(week.dayTotals||[]).find(x=>x.weekday===i);
   const pass=d?.passed??0,failed=d?.failed??0,unknown=d?.unknown??members.length,beforeJoin=d?.beforeJoin??0;
   const eligible=Math.max(0,members.length-beforeJoin),known=pass+failed,attainment=known?Math.round(100*pass/known):null;
   return '<article class="native-day-mini'+(failed?' has-failures':'')+'">'+
    '<button type="button" class="native-day-mini-open" data-native-vs-day="'+i+'" aria-pressed="'+(view.day===i)+'" aria-controls="native-vs-results">'+
    '<span class="native-day-mini-heading"><strong>'+label+'</strong><span>'+ (eligible?Math.min(100,Math.round(100*known/eligible)):0)+'% erfasst</span></span>'+
    '<strong class="native-day-mini-count">'+(attainment===null?'—':n(attainment)+'%')+'<small> Ziel erreicht</small></strong>'+
    '<small>'+pass+' / '+known+' bestätigte IDs</small><span class="native-day-meter" aria-hidden="true"><i style="width:'+(attainment??0)+'%"></i></span>'+
    '<span class="native-day-mini-meta"><span class="bad">'+failed+' unter</span><span>'+unknown+' unklar</span>'+(beforeJoin?'<span>'+beforeJoin+' vor Beitritt</span>':'')+'</span>'+
    '</button></article>';
  }).join('')+'</div></section>';
 const person=p=>{
  const failures=Number(p.failed||0),unknown=Number(p.unknown||0),active=p.activeDays;
  const selected=result.daily?vsDayState(p,view.day,week.threshold):null;
  const status=selected?{low:'is-warning',unknown:'is-unknown',joined:'is-joined',met:'is-okay'}[selected.kind]:failures>=3?'is-critical':failures>0?'is-warning':unknown>0?'is-unknown':p.beforeJoin>0?'is-joined':'is-okay';
  const eligible=6-Number(p.beforeJoin||0);
  const marker=failures?failures+'/'+eligible+' unter Ziel':unknown?unknown+' unklar':p.beforeJoin?eligible+'/'+eligible+' nach Beitritt':'6/6 Ziel erreicht';
  const computed=derivedVsWeekTotal(p.days),change=weeklyDelta(p);
  const shownMarker=selected?translateOfficerText({low:'Unter Tagesziel',met:'Ziel erreicht',unknown:'Unbekannt',joined:'Vor Beitritt'}[selected.kind],language):marker;
  const weekly='<div class="native-player-weekline"><div><small>WOCHENPUNKTE</small>'+
   (computed.complete?
    '<strong>'+n(computed.total)+'</strong><small>Aus sechs Tageswerten berechnet</small>':
    '<strong>'+(computed.partial===null?'—':n(computed.partial))+'</strong><small>'+
    (computed.partial===null?'Noch kein bestätigter Tageswert':'Teilstand')+
    ' · '+computed.confirmed+'/6 Tage bestätigt · Wochensumme erst mit 6 bestätigten Tagen</small>')+
   '</div></div>';
  return '<details class="native-vs-player native-vs-person-compact '+status+'"><summary>'+
   '<span class="native-vs-person-main"><strong data-native-no-translate>'+privateName(p.name)+'</strong>'+
   '<small>'+e(p.rank||'—')+' · '+(Number.isSafeInteger(active)?active:'?')+' aktive Tage</small></span>'+
   '<span class="native-vs-person-metrics">'+(selected?'<b class="native-vs-selected-day">'+days[view.day]+' · '+
    (selected.points===null?tr(selected.kind==='joined'?'Vor Beitritt':'Unbekannt'):n(selected.points))+'</b>':'')+'<b>'+e(shownMarker)+'</b>'+
   (unknown?'<small>'+unknown+' unbekannt'+(computed.partial!==null?' · Teilstand '+n(computed.partial):'')+'</small>':
    computed.complete?'<small>'+n(computed.total)+' Wochenpunkte</small>':
    '<small>'+n(computed.partial)+' Teilstand · '+Number(p.beforeJoin||0)+' vor Beitritt</small>')+
   (change?'<small class="native-vs-change '+(change.delta>0?'is-up':change.delta<0?'is-down':'is-same')+'">Entwicklung '+(change.delta>0?'+':'')+n(change.delta)+' zu '+e(change.week)+'</small>':'')+
   '</span></summary><div class="native-vs-person-expanded">'+
   weekly+'<p class="native-vs-week-development">'+(change?'Wochenpunkte '+(change.delta>0?'+':'')+n(change.delta)+' zu '+e(change.week):'Kein Vergleich: vollständige Wochenpunkte fehlen')+'</p>'+
   '<div class="native-vs-person-daygrid">'+days.map((day,i)=>{
    const item=(p.days||[]).find(x=>x.weekday===i);
    const valid=item?.verified&&Number.isSafeInteger(item.points),beforeJoin=item?.quality==='before_join';
    const label=valid?n(item.points):beforeJoin?'Vor Beitritt':'Unbekannt';
    return '<div class="native-vs-person-day '+(beforeJoin?'is-before-join':!valid?'is-unknown':item.passed?'is-good':'is-bad')+'">'+
     '<span>'+day+'</span>'+(beforeJoin?'<span class="native-muted">'+label+'</span>':
     '<button type="button" class="native-vs-day-link" data-native-vs-image="'+
     e(week.week+'|'+p.id+'|'+i)+'" aria-label="VS-Beleg '+day+' für '+privateName(p.name)+'">'+
     label+' ↗</button>')+'</div>';
   }).join('')+'</div>'+
   '<button type="button" class="native-vs-open-person" data-native-member="'+e(p.id)+'">Spielerakte & Entwicklung öffnen ›</button>'+
   '</div></details>';
 };
 const activeCategory=['all','low','met','unknown','joined'].includes(view.category)?view.category:'all';
 const resultLimit=Math.max(10,Number(view.limits?.[activeCategory])||10),shownResults=result.matching.slice(0,resultLimit);
 const groupsHtml='<section class="native-vs-results" id="native-vs-results" data-native-vs-matches="'+result.matchingCount+'">'+
  '<div class="native-intel-section-head"><h3 id="native-vs-results-title" tabindex="-1">'+(result.daily?tr(['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'][view.day])+' · '+e(week.week):'Spieler nach Ergebnis')+'</h3>'+
   '<span>'+result.matchingCount+' '+tr('Spieler')+' · '+(result.daily?result.counts.low+result.counts.met:verified)+' bestätigte Tageswerte</span></div>'+
  '<div class="native-vs-result-tools"><label><span>'+tr('Sortieren nach')+'</span><select id="native-vs-sort">'+
   [['priority','Tage unter Ziel'],['improvement','Verbesserung zuerst'],['points_desc','Punkte: höchste zuerst'],['points_asc','Punkte: niedrigste zuerst'],['name','Name'],['rank','Allianzrang']].map(([value,label])=>'<option value="'+value+'" '+((view.sort||'priority')===value?'selected':'')+'>'+tr(label)+'</option>').join('')+'</select></label>'+
   (result.daily?'<button type="button" data-native-vs-weekly>'+tr('Wochenauswertung')+'</button>':'')+'</div>'+
  '<nav class="native-vs-day-filters" aria-label="'+tr('Tagesergebnisse')+'">'+[['all','Alle'],['low','Unter Ziel'],['met','Ziel erreicht'],['unknown','Unbekannt'],['joined','Vor Beitritt']].map(([value,label])=>
   '<button type="button" data-native-vs-category="'+value+'" aria-pressed="'+(activeCategory===value)+'">'+tr(label)+' <b>'+e(value==='all'?members.length:result.counts[value])+'</b></button>').join('')+'</nav>'+
  '<div class="native-vs-groups native-vs-single-results"><div class="native-vs-group native-vs-single-group native-vs-group-'+activeCategory+'" data-native-vs-group="'+activeCategory+'">'+
   '<div class="native-vs-compact-list">'+shownResults.map(person).join('')+'</div><div class="native-vs-group-footer"><span>'+shownResults.length+' / '+result.matchingCount+' '+tr('Spieler')+'</span>'+
   (shownResults.length<result.matchingCount?'<button type="button" data-native-vs-more-group="'+activeCategory+'">'+tr('Weitere Spieler')+'</button>':'')+'</div></div>'+
   (!members.length?'<p class="native-muted">Noch keine Spieler für diese Woche.</p>':'')+
   '<p class="native-muted" data-native-vs-search-empty role="status" '+(result.matchingCount||!members.length?'hidden':'')+'>'+tr('Keine Spieler gefunden.')+'</p></div></section>';
 return {freshness:loc(h),dayTiles:loc(dayTiles),trendHtml:loc(trendHtml),groupsHtml:loc(groupsHtml)};
}

// Derived locally from the existing authorized API; no new backend fields required.
export function enrichVsWeeks(data){
 data.weeks ||= [];
 for(const w of data.weeks){
  w.members ||= [];w.missingMembers ||= [];
  for(const p of [...w.members,...w.missingMembers]){
   const original=p.days||[];
   p.days=Array.from({length:6},(_,weekday)=>{
    const rows=original.filter(d=>d.weekday===weekday),d=rows.length===1?rows[0]:null;
    const verified=Boolean(d&&d.verified===true&&Number.isSafeInteger(d.points)&&d.points>=0);
    return {...(d||{}),weekday,verified,points:verified?d.points:null,passed:verified?(Number.isSafeInteger(w.threshold)?d.points>=w.threshold:d.passed):null};
   });
   const total=derivedVsWeekTotal(p.days);p.weekly_points=total.total;p.partial_week_points=total.partial;p.verified=total.confirmed;
   p.passed=p.days.filter(d=>d.verified&&d.passed===true).length;
  }
  w.dayTotals=(w.dayTotals?.length?w.dayTotals:Array.from({length:6},(_,weekday)=>({weekday,passed:w.members.filter(p=>p.days[weekday].verified&&p.days[weekday].passed===true).length,failed:w.members.filter(p=>p.days[weekday].verified&&p.days[weekday].passed===false).length})));
  w.verifiedDays=w.members.reduce((n,p)=>n+p.verified,0);
 }
 for(const w of data.weeks){
  const people=[...(w.members||[]),...(w.missingMembers||[])];
  w.scopeMembers=people.length;
  w.metPlayerDays=w.members.reduce((n,p)=>n+p.passed,0);
  w.affectedMembers=w.members.filter(p=>p.failed>0).length;
  w.scopePlayerDays=people.length*6-(w.beforeJoinDays||0);
  for(const d of w.dayTotals){
   d.unknown=people.filter(p=>!p.days?.[d.weekday]?.verified&&p.days?.[d.weekday]?.eligible!==false).length;
   const known=d.passed+d.failed;
   d.attainmentPercent=known?100*d.passed/known:null;
  }
  w.unknownDays=w.dayTotals.reduce((n,d)=>n+d.unknown,0);
 }
 return data;
}
