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
 return {groups,counts,matchingCount:groups.reduce((sum,group)=>sum+group.members.length,0),daily};
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
 translated.unshift(['bestätigten IDs','confirmed IDs'],[' IDs im Umfang',' IDs in scope'],['% der ','% of '],['Sortieren nach','Sort by'],['Tage unter Ziel','Days below goal'],['Punkte: höchste zuerst','Points: highest first'],['Punkte: niedrigste zuerst','Points: lowest first']);
 const loc=html=>(language==='de'?html:translated.reduce((s,[a,b])=>s.replaceAll(a,b),html))
  .replace(/__RZSN_PRIVATE_(\d+)__/g,(token,index)=>privateText[Number(index)]??token);

 const meta=vsDataFreshness(week,formatTime);
 const verified=members.reduce((v,p)=>v+(Number.isSafeInteger(p.verified)?p.verified:(p.days||[]).filter(d=>d?.verified===true&&Number.isSafeInteger(d.points)).length),0);
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
   const eligible=Math.max(0,members.length-beforeJoin);
   return '<article class="native-day-mini'+(failed?' has-failures':'')+'">'+
    '<button type="button" class="native-day-mini-open" data-native-vs-day="'+i+'" aria-pressed="'+(view.day===i)+'" aria-controls="native-vs-results">'+
    '<span class="native-day-mini-heading"><strong>'+label+'</strong><span>'+ (eligible?Math.min(100,Math.round(100*(pass+failed)/eligible)):0)+'% erfasst</span></span>'+
    '<strong class="native-day-mini-count">'+pass+'<small> Ziel erreicht</small></strong>'+
    '<small>'+(d?.attainmentPercent==null?'?':n(Math.round(d.attainmentPercent)))+'% der '+(pass+failed)+' bestätigten IDs · '+(week.scopeMembers??members.length)+' IDs im Umfang</small>'+
    '<span class="native-day-mini-meta"><span class="bad">'+failed+' unter</span><span>'+unknown+' unklar</span>'+(beforeJoin?'<span>'+beforeJoin+' vor Beitritt</span>':'')+'</span>'+
    '</button></article>';
  }).join('')+'</div></section>';
 const person=p=>{
  const failures=Number(p.failed||0),unknown=Number(p.unknown||0),active=p.activeDays;
  const selected=result.daily?vsDayState(p,view.day,week.threshold):null;
  const status=selected?{low:'is-warning',unknown:'is-unknown',joined:'is-joined',met:'is-okay'}[selected.kind]:failures>=3?'is-critical':failures>0?'is-warning':unknown>0?'is-unknown':p.beforeJoin>0?'is-joined':'is-okay';
  const eligible=6-Number(p.beforeJoin||0);
  const marker=failures?failures+'/'+eligible+' unter Ziel':unknown?unknown+' unklar':p.beforeJoin?eligible+'/'+eligible+' nach Beitritt':'6/6 Ziel erreicht';
  const computed=derivedVsWeekTotal(p.days);
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
   '</span></summary><div class="native-vs-person-expanded">'+
   weekly+
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
 const groupsHtml='<section class="native-vs-results" id="native-vs-results" data-native-vs-matches="'+result.matchingCount+'">'+
  '<div class="native-intel-section-head"><h3 id="native-vs-results-title" tabindex="-1">'+(result.daily?tr(['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'][view.day])+' · '+e(week.week):'Spieler nach Ergebnis')+'</h3>'+
   '<span>'+members.length+' erfasste Spieler · '+(result.daily?result.counts.low+result.counts.met:verified)+' bestätigte Tageswerte</span></div>'+
  '<div class="native-vs-result-tools"><label><span>'+tr('Sortieren nach')+'</span><select id="native-vs-sort">'+
   [['priority','Tage unter Ziel'],['points_desc','Punkte: höchste zuerst'],['points_asc','Punkte: niedrigste zuerst'],['name','Name'],['rank','Allianzrang']].map(([value,label])=>'<option value="'+value+'" '+((view.sort||'priority')===value?'selected':'')+'>'+tr(label)+'</option>').join('')+'</select></label>'+
   (result.daily?'<button type="button" data-native-vs-weekly>'+tr('Wochenauswertung')+'</button>':'')+'</div>'+
  (result.daily?'<nav class="native-vs-day-filters" aria-label="'+tr('Tagesergebnisse')+'">'+[['all','Alle'],['met','Ziel erreicht'],['low','Unter Ziel'],['unknown','Unbekannt'],['joined','Vor Beitritt']].map(([value,label])=>
   '<button type="button" data-native-vs-category="'+value+'" aria-pressed="'+((view.category||'all')===value)+'">'+tr(label)+' <b>'+e(value==='all'?members.length:result.counts[value])+'</b></button>').join('')+'</nav>':'')+
  '<div class="native-vs-groups">'+result.groups.map(({label,members:people,kind})=>{
   const limit=Math.max(10,Number(view.limits?.[kind])||10),shown=people.slice(0,limit);
   const open=Boolean(view.query)||(view.openGroups?view.openGroups.includes(kind):result.daily&&((view.category||'all')==='all'?kind==='low':true));
   return '<details class="native-fold native-vs-group native-vs-group-'+kind+'" data-native-vs-group="'+kind+'" '+(open?'open':'')+'><summary>'+
   '<span>'+e(label)+'</span><b>'+people.length+' Spieler</b></summary>'+
   '<div class="native-fold-body native-vs-compact-list">'+
   shown.map(person).join('')+'<div class="native-vs-group-footer"><span>'+shown.length+' / '+people.length+' '+tr('Spieler')+'</span>'+
   (shown.length<people.length?'<button type="button" data-native-vs-more-group="'+kind+'">'+tr('Weitere Spieler')+'</button>':'')+'</div></div></details>';
  }).join('')+
   (!members.length?'<p class="native-muted">Noch keine Spieler für diese Woche.</p>':'')+
   '<p class="native-muted" data-native-vs-search-empty role="status" '+(result.matchingCount||!members.length?'hidden':'')+'>'+tr('Keine Spieler gefunden.')+'</p></div></section>';
 return {freshness:loc(h),dayTiles:loc(dayTiles),groupsHtml:loc(groupsHtml)};
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
