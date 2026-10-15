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
  ['Unter Tagesziel','Below daily target'],
  ['Tagesziel erreicht','Daily goal reached'],
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
 const loc=html=>language==='de'?html:translated.reduce((s,[a,b])=>s.replaceAll(a,b),html);

 const meta=vsDataFreshness(week,formatTime);
 const verified=members.reduce((v,p)=>v+Number(p.verified||0),0);
 const groups=[
  ['Unter Tagesziel',members.filter(p=>p.failed>0),'low'],
  ['Messwerte unvollständig',members.filter(p=>!p.failed&&p.unknown>0),'unknown'],
  ['Tagesziel erreicht',members.filter(p=>!p.failed&&!p.unknown),'met']
 ];
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
   const pass=d?.passed??0,failed=d?.failed??0,unknown=d?.unknown??members.length;
   return '<article class="native-day-mini'+(failed?' has-failures':'')+'">'+
    '<header><strong>'+label+'</strong><span>'+ (members.length?Math.round(100*(pass+failed)/members.length):0)+'% erfasst</span></header>'+
    '<strong class="native-day-mini-count">'+pass+'<small> Ziel erreicht</small></strong>'+
    '<div class="native-day-mini-meta"><span class="bad">'+failed+' unter</span><span>'+unknown+' unklar</span></div>'+
    '</article>';
  }).join('')+'</div></section>';
 const person=p=>{
  const failures=Number(p.failed||0),unknown=Number(p.unknown||0),active=p.activeDays;
  const status=failures>=3?'is-critical':failures>0?'is-warning':unknown>0?'is-unknown':'is-okay';
  const marker=failures?failures+'/6 unter Ziel':unknown?unknown+' unklar':'6/6 Ziel erreicht';
  const weekly=Number.isSafeInteger(p.weekly_points)?
   '<div class="native-player-weekline"><div><small>WOCHENPUNKTE</small><strong>'+n(p.weekly_points)+'</strong></div>'+
    '<button type="button" class="native-vs-day-link" data-native-vs-image="'+e(week.week+'|'+p.id+'|6')+'">'+
    (p.weekly_proof_available?'Originalbeleg ansehen ↗':'Wochenbeleg fehlt · ergänzen')+'</button></div>':
   '<p class="native-muted">Keine bestätigten Wochenpunkte hinterlegt.</p>';
  return '<details class="native-vs-player native-vs-person-compact '+status+'"><summary>'+
   '<span class="native-vs-person-main"><strong>'+e(p.name)+'</strong>'+
   '<small>'+e(p.rank||'—')+' · '+(Number.isSafeInteger(active)?active:'?')+' aktive Tage</small></span>'+
   '<span class="native-vs-person-metrics"><b>'+e(marker)+'</b>'+
   (unknown?'<small>'+unknown+' unbekannt</small>':'<small>'+n(p.weekly_points)+' Wochenpunkte</small>')+
   '</span></summary><div class="native-vs-person-expanded">'+
   weekly+
   '<div class="native-vs-person-daygrid">'+days.map((day,i)=>{
    const item=(p.days||[]).find(x=>x.weekday===i);
    const valid=item?.verified&&Number.isSafeInteger(item.points);
    const label=valid?n(item.points):'Unbekannt';
    return '<div class="native-vs-person-day '+(!valid?'is-unknown':item.passed?'is-good':'is-bad')+'">'+
     '<span>'+day+'</span><button type="button" class="native-vs-day-link" data-native-vs-image="'+
     e(week.week+'|'+p.id+'|'+i)+'" aria-label="VS-Beleg '+day+' für '+e(p.name)+'">'+
     label+' ↗</button></div>';
   }).join('')+'</div>'+
   '<button type="button" class="native-vs-open-person" data-native-member="'+e(p.id)+'">Spielerakte & Entwicklung öffnen ›</button>'+
   '</div></details>';
 };
 const groupsHtml='<section class="native-vs-results">'+
  '<div class="native-intel-section-head"><h3>Spieler nach Ergebnis</h3>'+
   '<span>'+members.length+' erfasste Spieler · '+verified+' bestätigte Tageswerte</span></div>'+
  '<div class="native-vs-groups">'+groups.map(([label,people,kind])=>
   '<details class="native-fold native-vs-group native-vs-group-'+kind+'"><summary>'+
   '<span>'+e(label)+'</span><b>'+people.length+' Spieler</b></summary>'+
   '<div class="native-fold-body native-vs-compact-list">'+
   (people.length?people.map(person).join(''):'<p class="native-muted">Keine Spieler in dieser Gruppe.</p>')+
   '</div></details>').join('')+'</div></section>';
 return {freshness:loc(h),dayTiles:loc(dayTiles),groupsHtml:loc(groupsHtml)};
}
