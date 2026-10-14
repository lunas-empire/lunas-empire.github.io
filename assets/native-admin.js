/** Native Luna officer workspace. Private data is held only in a live memory token. */
import {ALLIANCE_CONFIG} from './config.js';
import {icon} from './icons.js';
import {localizeOfficerTree,officerLanguage,officerLocale} from './native-admin-i18n.js';
import {buildOfficerActions} from './officer-cockpit.js';
import {createStatEvidenceViewer} from './native-stat-evidence.js';
import {renderEvidenceRow} from './native-evidence-row.js';
import {dailyOfficerBrief,vsWeeklyMail,donationsWeeklyMail,safeMailText,ALLIANCE_MAIL_LIMIT} from './officer-reports.js';
const apiBase=ALLIANCE_CONFIG.commandCenterEmbedUrl.replace('/?embed=1','');
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let sessionToken='',officer=null,panel='overview',cache={},pageLimit=20,historyLimit=20,activityLimit=30,registryFilter='all',activityCategory='all',activityGroupBy='type';
export function clearOfficer(){statViewer.close();clearReviewImages();sessionToken='';officer=null;cache={};panel='overview';pageLimit=20;historyLimit=20;activityLimit=30;registryFilter='all';activityCategory='all';activityGroupBy='type';}
export const hasOfficer=()=>Boolean(sessionToken);
const canManageSite=()=>officer?.role==='R5'||officer?.siteOwner===true;
async function request(path,options={}){
 const headers={'Accept':'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...(sessionToken?{'Authorization':'Bearer '+sessionToken}:{})};
 const response=await fetch(apiBase+path,{method:options.method||'GET',headers,body:options.body?JSON.stringify(options.body):undefined,mode:'cors',credentials:'omit',cache:'no-store'});
 let result;try{result=await response.json()}catch{throw Error('Die Cloudflare-API antwortet nicht korrekt.')}
 if(!response.ok){if(response.status===401&&path!=='/api/native-login')clearOfficer();throw Object.assign(Error(result.error||'HTTP '+response.status),{status:response.status})}
 return result;
}
const statViewer=createStatEvidenceViewer({request,getToken:()=>sessionToken,apiBase});
const statEvidenceKey=(snapshot,member,metric)=>snapshot&&member&&['power','kills','donations_weekly'].includes(metric)?String(snapshot)+'|'+member+'|'+metric:'';
const statValueButton=(value,snapshot,member,metric)=>{
 const key=statEvidenceKey(snapshot,member,metric);
 return key?'<button type="button" class="native-stat-value-link" data-native-stat-evidence="'+e(key)+'" title="Originalbild zum Spielerwert ansehen">'+numberText(value)+' <small aria-hidden="true">↗</small></button>':numberText(value);
};
const options=(members,value='')=>'<option value="">Nicht besetzt</option>'+members.map(m=>'<option value="'+e(m.id)+'" '+(m.id===value?'selected':'')+'>'+e(m.name)+' · '+e(m.rank)+'</option>').join('');
// Keep existing feature panel IDs and API workflows; the fifth main tab is a dedicated tile-based More page.
const primaryPanels=[
 ['overview','Kommando','today'],['vs','VS & Daten','vs'],
 ['members','Allianz','alliance'],['train','Einsätze','hero']
];
const secondaryPanels=[
 ['registry','Ränge & Archiv'],['watch','Mitglieder-Abgleich'],['diplomacy','Diplomatie'],
 ['reviews','OCR-Prüffälle'],['tasks','Admin-Aufgaben'],['absences','Abwesenheiten'],['events','Allianz-Events'],
 ['activity','Änderungsprotokoll'],['access','Zugangscodes'],['requirements','Einstellungen']
];
const parentPanel=key=>({
 overview:'overview',vs:'vs',donations:'vs',members:'members',train:'train',more:'more',
 registry:'more',watch:'more',diplomacy:'more',reviews:'more',tasks:'more',
 absences:'more',events:'more',activity:'more',access:'more',requirements:'more'
}[key]||'overview');
const moreSections=[
 {title:'Allianz & Planung',items:[
  ['tasks','Aufgaben','tasks','Verantwortung & Fristen'],
  ['absences','Abwesenheiten','today','Vertretung & Urlaub'],
  ['events','Allianz-Events','hero','Einsätze organisieren'],
  ['diplomacy','Diplomatie','alliance','Verbündete & Kontakte']]},
 {title:'Mitglieder & Kontrolle',items:[
  ['registry','Ränge & Archiv','alliance','Ränge und ehemalige Mitglieder'],
  ['watch','Mitglieder-Abgleich','power','Zuordnungen prüfen'],
  ['reviews','OCR-Prüffälle','vs','Screenshots kontrollieren']]},
 {title:'System & Sicherheit',items:[
  ['activity','Admin-Protokoll','standard','Wer hat was geändert?'],
  ['access','Zugangscodes','guides','Offizierszugänge'],
  ['requirements','Einstellungen','research','Mindestwerte & Regeln']]}
];
const sectionPanels={
 vs:[['vs','VS-Duell'],['donations','Allianzspenden']],
 members:[['members','Mitglieder'],['diplomacy','Diplomatie']],
 train:[['train','Züge'],['events','Allianz-Events']]
};
const contextTools={
 vs:{label:'Werte prüfen',items:[['reviews','Prüffälle öffnen']]},
 members:{label:'Weitere Mitglieder-Werkzeuge',items:[['watch','Mitglieder-Abgleich'],['registry','Ränge & Archiv']]},
 train:{label:'Aufgaben & Abwesenheiten',items:[['tasks','Aufgaben'],['absences','Abwesenheiten']]}
};

const navButton=([key,label],cls='')=>'<button type="button" class="'+cls+'" data-officer-tab="'+key+'" '+(panel===key?'aria-current="page"':'')+'>'+e(label)+'</button>';
function nav(){
 const parent=parentPanel(panel);
 return '<nav class="native-admin-nav" aria-label="Command Center Hauptbereiche">'+
  primaryPanels.map(([key,label,art])=>'<button type="button" class="native-primary-tab" data-officer-tab="'+key+'" '+(parent===key?'aria-current="page"':'')+'>'+icon(art,'native-tab-icon')+'<span>'+e(label)+'</span></button>').join('')+
  '<button type="button" class="native-primary-tab native-more-tab" data-officer-tab="more" '+(parent==='more'?'aria-current="page"':'')+'>'+icon('guides','native-tab-icon')+'<span>Mehr</span></button></nav>'+
  (sectionPanels[parent]?'<nav class="native-admin-subnav" aria-label="Unterbereiche">'+
   sectionPanels[parent].map(pair=>navButton(pair)).join('')+
   (contextTools[parent]?'<details class="native-context-tools" '+(contextTools[parent].items.some(([k])=>k===panel)?'open':'')+
    '><summary>'+e(contextTools[parent].label)+'</summary><div>'+
     contextTools[parent].items.map(pair=>navButton(pair)).join('')+'</div></details>':'')+
   '</nav>':'');
}
function moreHub(){
 return '<div class="native-more-hub" aria-label="Weitere Verwaltung">'+
  moreSections.map((section,index)=>'<section class="native-hub-section" aria-labelledby="native-hub-title-'+index+'">'+
   '<h3 tabindex="-1" id="native-hub-title-'+index+'">'+e(section.title)+'</h3>'+
   '<div class="native-hub-grid">'+section.items.map(([key,title,art,description])=>
    '<button type="button" class="native-hub-tile" data-officer-tab="'+e(key)+'" aria-label="'+e(title)+': '+e(description)+'">'+
    '<span class="native-hub-tile-icon" aria-hidden="true">'+icon(art,'native-hub-svg')+'</span>'+
    '<span class="native-hub-tile-copy"><strong>'+e(title)+'</strong><small>'+e(description)+'</small></span>'+
    '<span class="native-hub-tile-chevron" aria-hidden="true">›</span></button>').join('')+
   '</div></section>').join('')+'</div>';
}
function cards(items){return '<div class="native-cards">'+items.map(([name,value,sub])=>'<article><small>'+e(name)+'</small><strong>'+e(value)+'</strong><span>'+e(sub||'')+'</span></article>').join('')+'</div>'}
function reportPanel(message){
 const mail=safeMailText(message);
 if(!mail)return '<p class="native-evidence-note">Report is unavailable or exceeds the 500-character limit.</p>';
 return '<details class="native-fold native-report-panel"><summary>English report / alliance mail</summary>'+
  '<div class="native-fold-body"><textarea rows="5" maxlength="500" aria-label="Edit English alliance mail">'+e(mail)+'</textarea>'+
  '<div class="native-row"><small class="native-report-counter">'+mail.length+'/'+ALLIANCE_MAIL_LIMIT+' characters</small>'+
  '<button type="button" data-native-copy-report>Copy report</button></div>'+
  '<p role="status" class="native-report-copy-status"></p></div></details>';
}
function marker(status){return '<span class="native-status">'+e(status||'Unbekannt')+'</span>'}
async function view(mount){
 clearReviewImages();
 const header='<div class="native-officer-strip" role="group" aria-label="Offiziersbereich">'+
  '<a class="native-return-link" href="#today">← Zur Website</a>'+
  '<div class="native-officer-controls"><span class="native-officer-badge">'+e(officer?.role||'Offizier')+' · '+e(officer?.name||'')+(officer?.siteOwner?' · Website-Eigentümerin':'')+
  '</span><button type="button" data-officer-tab="access">Mein Zugang</button><button type="button" data-officer-logout>Abmelden</button></div></div>';
 mount.innerHTML='<section class="native-admin"><h1 class="sr-only">RZSN Command Center</h1>'+header+nav()+
  (parentPanel(panel)==='more'&&panel!=='more'?'<div class="native-hub-return"><button type="button" data-officer-tab="more">← Weitere Verwaltung</button><span>'+e(secondaryPanels.find(([key])=>key===panel)?.[1]||'Verwaltung')+'</span></div>':'')+
  '<div class="native-admin-content" id="native-admin-content"><p>Daten werden geladen …</p></div></section>';
 const target=mount.querySelector('#native-admin-content');
 try{
  if(panel==='more'){
   target.innerHTML=moreHub();
  }else if(panel==='overview'){
   const [summary,ops,trains,alerts]=await Promise.all([request('/api/overview'),request('/api/operations'),request('/api/train-manager'),request('/api/officer-alerts').catch(()=>null)]);
   cache.ops=ops;cache.trains=trains;cache.alerts=alerts;
   const day=trains.today||new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   const pending=(ops.tasks||[]).filter(x=>x.status!=='done').sort((a,b)=>
    (a.due_date||'9999').localeCompare(b.due_date||'9999'));
   const days=(trains.calendar||[]).filter(x=>x.date>=day);
   const todayTrain=days.find(x=>x.date===day);
   const tomorrowTrain=days.find(x=>x.date>day);
   const nextEvent=(ops.events||[]).filter(x=>x.event_date>=day&&!['completed','cancelled'].includes(x.outcome))
    .sort((a,b)=>a.event_date.localeCompare(b.event_date))[0];
   const eventNames={marshall_guard:'Marshall Guard',zombie_siege:'Zombie Siege',desert_storm:'Desert Storm'};
   const trainLine=slot=>slot?(slot.entry?.driver
    ? e(slot.entry.driver)+' · '+e(slot.entry.status||'Unbestätigt')
    : 'Fahrer noch nicht eingetragen'):'Kein Eintrag im Wochenplan';
   const actions=buildOfficerActions({today:day,summary,operations:ops,trains,alerts,vs:cache.vs,donations:cache.donations});
   const mission=(key,art,eyebrow,title,detail)=>'<button type="button" class="native-mission" data-native-action="'+key+'">'+
    '<span class="native-mission-icon">'+icon(art,'native-mission-svg')+'</span><span class="native-mission-copy"><small>'+e(eyebrow)+'</small><strong>'+e(title)+'</strong><span>'+detail+'</span></span><span class="native-mission-chevron" aria-hidden="true">›</span></button>';
   target.innerHTML='<div class="native-dashboard">'+
    '<div class="native-dashboard-heading"><div><span class="native-kicker">OFFIZIERSÜBERSICHT</span><h2>Heute im Kommando</h2><p class="native-muted">Spieltag '+e(day)+' · Daten aus deinem privaten Allianzregister</p></div><span class="native-daily-sigil" aria-hidden="true">'+icon('today','native-emblem-icon')+'</span></div>'+
    '<div class="native-mission-stack" aria-label="Wichtige Aktionen">'+
    (actions.length?actions.map(item=>mission(item.action,item.art,item.eyebrow,item.title,e(item.detail))).join(''):
      '')+
    '</div>'+
    '<details class="native-fold native-dashboard-stat-fold"><summary>Weitere Kennzahlen</summary><div class="native-fold-body native-dashboard-summary">'+cards([['Allianz aktiv',summary.active??'—','Zuletzt importierter Stand'],['Offene Aufgaben',pending.length,'Officer Desk'],['Zugtage zur Klärung',trains.counts?.missing_recent??'—','Historische Lücken, nicht automatisch versäumt']])+'</div></details>'+
    '<div class="native-dashboard-bottom"><section class="native-dashboard-panel"><h3>Deine nächsten Schritte</h3>'+
    (pending.length?'<div class="native-action-brief">'+pending.slice(0,3).map(t=>'<div><b>'+e(t.title)+'</b><small>'+e(t.due_date||'Keine Frist')+' · '+e(t.priority||'normal')+'</small></div>').join('')+'</div>':'<p class="native-muted">Keine offenen Aufgaben eingetragen.</p>')+
    '<button type="button" data-native-action="tasks-open">Aufgaben öffnen</button></section>'+
    '<section class="native-dashboard-panel"><h3>Als Nächstes</h3><p><strong>'+e(tomorrowTrain?.date||'Nächster Zug')+'</strong> · '+e(tomorrowTrain?.type||'Kein weiterer Zugtag gefunden')+'</p><p class="native-muted">'+trainLine(tomorrowTrain)+'</p>'+
    '<button type="button" data-native-action="member-find">Spieler suchen</button></section></div>'+
    reportPanel(dailyOfficerBrief({date:day,overview:summary,operations:ops,trains}))+

    '</div>';
  }else if(panel==='requirements'){
   cache.requirements=await request('/api/alliance-requirements');
   renderRequirements(target);
  }else if(panel==='access'){
   cache.access=await request('/api/officer-access');
   cache.registry=canManageSite()?await request('/api/member-registry'):null;
   target.innerHTML='<div class="native-row"><h2>Offizierszugänge</h2></div>'+
    '<p class="native-muted">Nur R4 und R5 können sich anmelden. Codes werden nur einmal gezeigt und nie dauerhaft angezeigt. Bei Änderungen werden bisherige Sitzungen ungültig.</p>'+
    '<div class="native-row"><button type="button" data-native-access-mode="self">Eigenen Code ändern</button>'+
    (canManageSite()?'<button type="button" data-native-access-mode="issue">Neuen Admin hinzufügen</button><button type="button" data-native-access-mode="reset">Code eines Admins zurücksetzen</button>':'')+'</div>'+
    '<div id="native-access-form"></div><div id="native-access-result" role="status"></div>'+
    (canManageSite()&&cache.access.accounts.some(x=>x.enabled&&!x.member_id)?'<p class="native-evidence-note" role="status">'+cache.access.accounts.filter(x=>x.enabled&&!x.member_id).length+' bestehende Offizierszugänge sind noch nicht zugeordnet. R5 oder Luna als Website-Eigentümerin prüft jede Zuordnung ausdrücklich.</p>':'')+
    '<details class="native-fold" open><summary>Offizierszugänge ('+e(cache.access.accounts.filter(x=>x.enabled).length)+' aktiv)</summary>'+
     '<div class="native-fold-body native-list">'+cache.access.accounts.map(x=>'<div class="native-access-account"><strong>'+e(x.ingame_name)+' · '+e(x.role)+'</strong>'+
      '<small>'+(x.enabled?(x.member_id?'Mit Mitglied verknüpft':'Nicht zugeordnet – R5-Prüfung nötig'):'Deaktiviert')+'</small>'+
      (canManageSite()&&x.enabled?'<div class="native-row">'+(!x.member_id?'<button type="button" data-native-access-link="'+e(x.id)+'">Spieler zuordnen</button>':'')+
       (x.ingame_name!==officer.name&&!x.is_site_owner?'<button type="button" data-native-access-disable="'+e(x.id)+'">Zugang deaktivieren</button>':'')+'</div>':'')+'</div>').join('')+'</div></details>';
  }else if(panel==='registry'){
   cache.registry=await request('/api/member-registry');
   target.innerHTML='<div class="native-row"><h2>Mitgliederverwaltung</h2><button type="button" data-native-member-create>+ Mitglied anlegen</button><input id="registry-search" type="search" placeholder="Spieler suchen"></div>'+
    '<nav class="native-status-filter" aria-label="Mitgliederstatus">'+[['all','Alle'],['active','Aktiv'],['former','Archiv'],['blacklist','Blacklist']].map(([key,label])=>
    '<button type="button" data-native-registry-filter="'+key+'" aria-pressed="'+(registryFilter===key?'true':'false')+'">'+label+'</button>').join('')+'</nav>'+
    cards([['Aktiv',cache.registry.counts.active],['Archiv',cache.registry.counts.former],['Blacklist',cache.registry.counts.blacklisted]])+
    '<div id="registry-list"></div><div id="registry-form"></div>';renderRegistry(target,'');
  }else if(panel==='watch'){
   target.innerHTML='<div class="native-row"><div><h2>Mitglieder-Abgleich</h2><p class="native-muted">VS- und Stärke-Aufnahmen vergleichen. Kein automatischer Austritt und keine automatische Blacklist.</p></div></div><div id="native-watch-list" role="region" aria-label="Mitglieder zum Prüfen"></div>';
   try{[cache.watch,cache.archiveEligibility]=await Promise.all([request('/api/membership-watch'),request('/api/archive-eligibility').catch(()=>null)]);renderMembershipWatch(target)}
   catch(error){
    target.querySelector('#native-watch-list').innerHTML=
     '<p class="native-evidence-note" role="status">Die automatische Erkennung wird erst nach dem geschützten Cloudflare-Update freigeschaltet. Die bestehende manuelle Mitgliederverwaltung funktioniert weiterhin.</p>';
   }
  }else if(panel==='diplomacy'){
   target.innerHTML='<div class="native-row"><div><h2>Allianz-Diplomatie</h2><p class="native-muted">Private Offiziersnotizen, keine automatischen Ingame-Verträge oder Aktionen.</p></div><button type="button" data-native-diplomacy-new>+ Allianz</button></div>'+
    '<label class="native-ios-search">Allianz suchen<input type="search" id="native-diplomacy-search" placeholder="Tag, Name oder Server" autocomplete="off"></label>'+
    '<div id="native-diplomacy-form"></div><div id="native-diplomacy-list"></div>';
   try{cache.diplomacy=await request('/api/diplomacy');renderDiplomacy(target)}
   catch(error){
    const newButton=target.querySelector('[data-native-diplomacy-new]');if(newButton)newButton.disabled=true;
    target.querySelector('#native-diplomacy-list').innerHTML='<p class="native-evidence-note" role="status">Das private Diplomatiebuch ist vorbereitet, aber auf Cloudflare-Staging noch nicht aktiviert. Es wurden keine Bündnisse oder Zusagen gespeichert.</p>';
   }
  }else if(panel==='activity'){
   cache.activity=await request('/api/activity?limit=500');
   target.innerHTML='<div class="native-audit-head"><div><span class="native-kicker">ALLIANZ · VERWALTUNG</span><h2>Admin-Protokoll</h2><p>Nachvollziehbare Änderungen durch Offiziere</p></div>'+icon('tasks','native-audit-title-icon')+'</div>'+
    '<div id="activity-filters"></div><div id="activity-list"></div>';renderActivity(target,'');
  }else if(panel==='reviews'){
   const [cases,members,session]=await Promise.all([
    request('/api/reviews?status=open'),
    request('/api/identity-options').catch(()=>[]),
    request('/api/session').catch(()=>({reviewWritesEnabled:false}))
   ]);
   cache.reviewWritesEnabled=session?.reviewWritesEnabled===true;
   cache.reviews=cases;cache.reviewMembers=Array.isArray(members)?members:members.members||[];
   const profileMetrics=['power','kills','donations_weekly'];
   cache.profileCaptures=Object.fromEntries(await Promise.all(profileMetrics.map(async metric=>{
    try {const rows=await request('/api/profile-captures?metric='+metric);return [metric,Array.isArray(rows)?rows:[]]}
    catch{return [metric,[]]}
   })));
   const batches=[...new Set(cache.reviews.map(x=>x.source_batch).filter(Boolean))].sort();
   const withEvidence=cache.reviews.filter(x=>Boolean(x.evidence_sha)).length;
   const withoutEvidence=cache.reviews.length-withEvidence;
   target.innerHTML='<div class="native-row"><h2>OCR-Prüfung</h2><input id="review-search-native" type="search" placeholder="Spieler oder Fall suchen"></div>'+
    '<p class="native-muted"><strong>'+withEvidence+' mit Screenshot</strong> · '+withoutEvidence+' ohne Screenshot. Die Belegfälle stehen zuerst. Bilder werden erst beim Öffnen privat geladen; keine automatische Freigabe.</p>'+
    (!cache.reviewWritesEnabled?'<p class="native-evidence-note" role="status">Private Bild- und Korrekturfunktionen werden erst nach dem Cloudflare-Backend-Update freigeschaltet. Die bestehenden Prüffälle bleiben offen.</p>':'')+
    '<div class="native-row"><label>Bildstatus <select id="review-image-native"><option value="all">Alle Fälle ('+cache.reviews.length+')</option><option value="with">Mit Bild ('+withEvidence+')</option><option value="without">Ohne Bild ('+withoutEvidence+')</option></select></label>'+
     '<label>Quelle <select id="review-batch-native"><option value="">Alle Wochen und Profile</option>'+batches.map(b=>'<option value="'+e(b)+'">'+e(b)+'</option>').join('')+'</select></label>'+
    '<label>Prüftyp <select id="review-kind-native"><option value="">Alle</option><option value="vs_day">VS-Tageswert</option><option value="identity">Identität</option><option value="profile">Profilwert</option></select></label></div>'+
    '<p id="native-review-finished" role="status" aria-live="polite"></p><div id="review-list-native"></div>';renderReviews(target,'');
  }else if(panel==='members'){
   const list=await request('/api/members');
   cache.members=list;
   target.innerHTML='<div class="native-row"><h2>Allianzmitglieder</h2><input id="native-member-search" type="search" placeholder="Spieler suchen" autocomplete="off"></div>'+
    '<p class="native-muted">Nach Rang sortiert. Spieler antippen: Profil, Messwerte, Wochenverlauf, Erfolge und Zug-Historie.</p><div id="native-member-list"></div>';
   renderMembers(target,'');
  }else if(panel==='vs'){
   const [data,summary]=await Promise.all([request('/api/vs-intelligence'),request('/api/overview')]);
   cache.vs=data;cache.overview=summary;
   target.innerHTML='<div class="native-row"><h2>VS-Duell</h2><select id="native-vs-week">'+data.weeks.map(w=>'<option value="'+e(w.week)+'">'+e(w.week)+'</option>').join('')+'</select></div>'+
    '<div id="native-vs-body"></div>';renderVs(target);
  }else if(panel==='donations'){
   cache.donations=await request('/api/donations-intelligence');
   target.innerHTML='<div class="native-row native-data-heading"><div><h2>Allianzspenden</h2><p class="native-muted">Wöchentliches Forschungsziel · mindestens 20.000 pro Mitglied</p></div>'+
    '<label>Aufnahmewoche<select id="native-donation-week">'+(cache.donations.weeks||[]).map(w=>'<option value="'+e(w.week)+'">'+e(w.week)+'</option>').join('')+'</select></label></div>'+
    '<div id="native-donations-body"></div>';
   renderDonations(target);
  }else if(panel==='train'){
   [cache.trains,cache.dice,cache.diceMembers]=await Promise.all([
    request('/api/train-manager'),request('/api/train-dice').catch(()=>[]),request('/api/members').catch(()=>[])]);
   cache.rotation=await request('/api/train-rotation').catch(()=>null);
   target.innerHTML='<div class="native-row"><h2>Zugplanung</h2><div class="native-row-actions"><button type="button" data-native-dice-date="'+e(cache.trains.today)+'">🎲 Dice Game</button><button data-native-new="train">+ Fahrer / Datum</button></div></div><div id="native-train-body"></div>';renderTrain(target);
  }else if(['tasks','absences','events'].includes(panel)){
   cache.ops=await request('/api/operations');
   target.innerHTML='<div class="native-row"><h2>'+({tasks:'Admin-Aufgaben',absences:'Abwesenheiten & Vertretung',events:'Allianz-Events'}[panel])+'</h2><button data-native-new="'+panel+'">+ Eintragen</button></div><div id="native-form"></div><div id="native-records"></div>';
   renderRecords(target);
  }
 }catch(err){target.innerHTML='<p class="native-error" role="alert">'+e(err.message)+'</p><button data-native-refresh>Erneut laden</button>'}
}
const rankOrder=['R5','R4','R3','R2','R1','Ungeklärt'];
const metricNames={power:'Stärke',kills:'Kills',donations_weekly:'Wöchentliche Spenden',tech_donations:'Forschungsspenden'};
const metricQuality={observed:'Abgelesen',corrected:'Manuell bestätigt',inferred:'Geschätzt',
 unknown:'Nicht geprüft',missing:'Fehlt'};
const numberText=value=>typeof value==='number'&&Number.isSafeInteger(value)?
 value.toLocaleString('de-DE'):'—';
export function profileMetricChanges(stats){
 const groups=new Map();
 for(const row of Array.isArray(stats)?stats:[]){
  if(!row||!['observed','corrected'].includes(row.quality)||!Number.isSafeInteger(row.value)||!row.captured_at)continue;
  if(!groups.has(row.metric))groups.set(row.metric,[]);
  const group=groups.get(row.metric);
  if(!group.some(x=>x.captured_at===row.captured_at))group.push(row);
 }
 return [...groups.entries()].map(([metric,records])=>{
  records.sort((a,b)=>String(b.captured_at).localeCompare(String(a.captured_at)));
  const latest=records[0],previous=records[1]||null;
  return {metric,label:metricNames[metric]||metric.replaceAll('_',' '),value:latest.value,
   date:String(latest.captured_at).slice(0,10),quality:latest.quality,
   previous:previous?.value??null,previousDate:previous?String(previous.captured_at).slice(0,10):null,
   first:records.at(-1)?.value??null,firstDate:String(records.at(-1)?.captured_at||'').slice(0,10),
   count:records.length,deltaSinceFirst:records.length>1?latest.value-records.at(-1).value:null,
   delta:previous?latest.value-previous.value:null};
 });
}
function renderMembers(target,query=''){
 const host=target.querySelector('#native-member-list');if(!host)return;
 const records=Array.isArray(cache.members)?cache.members:[];
 const text=String(query).trim().toLocaleLowerCase('de-DE');
 const list=records.filter(m=>String(m.name||'').toLocaleLowerCase('de-DE').includes(text));
 const opened=new Set([...host.querySelectorAll('details.native-rank-group[open]')].map(x=>x.dataset.rank));
 const initial=!host.querySelector('.native-rank-group');
 const firstRank=rankOrder.find(rank=>list.some(m=>(rankOrder.includes(m.rank)?m.rank:'Ungeklärt')===rank));
 const rankGroups=rankOrder.map(rank=>{
  const group=list.filter(m=>(rankOrder.includes(m.rank)?m.rank:'Ungeklärt')===rank)
   .sort((a,b)=>String(a.name).localeCompare(String(b.name),'de',{sensitivity:'base'}));
  if(!group.length)return '';
  const open=text.length>0||opened.has(rank)||(initial&&rank===firstRank);
  const rows=group.map(m=>'<button type="button" data-native-member="'+e(m.id)+'">'+
   '<span class="native-rank-tag">'+e(m.rank||'?')+'</span><span><strong>'+e(m.name)+'</strong>'+
   '<small>Stärke '+numberText(m.power)+' · Kills '+numberText(m.kills)+
   ' · Spenden '+numberText(m.donations_weekly)+'</small></span><span class="native-member-open" aria-hidden="true">Profil ›</span></button>').join('');
  return '<details class="native-rank-group" data-rank="'+e(rank)+'" '+(open?'open':'')+'>'+
   '<summary><span class="native-rank-tag">'+e(rank)+'</span><strong>'+e(rank==='Ungeklärt'?'Rang ungeklärt':'Rang '+rank)+'</strong>'+
   '<span class="native-rank-count">'+group.length+' Spieler</span></summary>'+
   '<div class="native-list native-rank-members">'+rows+'</div></details>';
 }).join('');
 host.innerHTML='<p class="native-muted">'+list.length+' Spieler'+(text?' für „'+e(query)+'“ gefunden':' · nach Allianzrang gruppiert')+'</p>'+
  '<div class="native-member-folds">'+(rankGroups||'<p class="native-muted">Keine Spieler gefunden.</p>')+'</div>'+
  '<div id="native-person"></div>';
}
function deltaLabel(n){
 if(n===null)return 'Kein bestätigter Vergleich';
 return (n>0?'+':'')+numberText(n)+' seit der vorherigen Aufnahme';
}
async function showPerson(target,id){
 const node=target.querySelector('#native-person');if(!node)return;
 node.innerHTML='<p role="status" class="native-muted">Spielerakte wird geladen …</p>';
 let p;
 try{p=await request('/api/member/'+encodeURIComponent(id))}
 catch(error){
  node.innerHTML='<p class="native-error" role="alert">Spielerakte konnte nicht geladen werden: '+e(error.message)+'</p>'+
   '<button type="button" data-native-member="'+e(id)+'">Erneut versuchen</button>';
  return;
 }
 const member=p.member||{},metrics=profileMetricChanges(p.stats||[]);
 const weeks=(p.weeks||[]).slice().sort((a,b)=>String(b.week).localeCompare(String(a.week)));
 // The roster is still in the DOM so search state and expanded ranks survive Back.
 const roster=target.querySelector('.native-member-folds');if(roster)roster.hidden=true;
 const searchRow=target.querySelector('.native-row');if(searchRow)searchRow.hidden=true;
 let absences=[];
 try{
  if(!cache.ops?.absences)cache.ops=await request('/api/operations');
  absences=(cache.ops.absences||[]).filter(a=>a.member_id===id);
 }catch{ /* Profile remains usable if operation permissions / endpoint are unavailable. */ }
 const now=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());
 const active=absences.filter(a=>a.start_date<=now&&a.end_date>=now);
 const attendance=absences.slice().sort((a,b)=>b.start_date.localeCompare(a.start_date)).slice(0,8);
 const safeStats=(p.stats||[]).filter(s=>['observed','corrected'].includes(s.quality)&&Number.isSafeInteger(s.value));
 const metricHtml=metrics.length?'<div class="native-profile-metrics">'+metrics.map(m=>{
  const timeline=safeStats.filter(s=>s.metric===m.metric).sort((a,b)=>String(b.captured_at).localeCompare(String(a.captured_at)));
  return '<details class="native-profile-metric-card"><summary><small>'+e(m.label)+'</small><strong>'+numberText(m.value)+'</strong>'+
   '<span class="'+(m.delta===null?'':'native-metric-change')+'">'+e(deltaLabel(m.delta))+'</span>'+
   '<small>'+e(m.deltaSinceFirst===null?'Erst eine bestätigte Aufnahme – noch kein Langzeitvergleich':
    'Seit '+m.firstDate+': '+(m.deltaSinceFirst>0?'+':'')+numberText(m.deltaSinceFirst))+'</small>'+
   '<small>'+e(metricQuality[m.quality]||'Bestätigt')+' · '+e(m.date)+'</small><em>Alle '+timeline.length+' Messungen anzeigen ›</em></summary>'+
   '<div class="native-profile-timeline">'+timeline.map((s,i)=>'<div><time>'+e(String(s.captured_at).slice(0,10))+'</time><b>'+statValueButton(s.value,s.snapshot_id,id,s.metric)+'</b>'+
     '<small>'+e(i+1<timeline.length?deltaLabel(s.value-timeline[i+1].value):'Erste Messung')+'</small></div>').join('')+'</div></details>';
 }).join('')+'</div>':
  '<p class="native-muted">Noch keine bestätigten Messungen. Fehlende Werte werden nicht als Null bewertet.</p>';
 const weekdays=['Mo','Di','Mi','Do','Fr','Sa'];
 const weekSummary=weeks.length?'<div class="native-profile-weeks">'+weeks.map((w,i)=>{
  const days=(p.days||[]).filter(d=>d.week===w.week);
  const older=weeks[i+1]||null;
  const comparable=w.state==='final'&&older?.state==='final'&&
   Number.isSafeInteger(w.weekly_points)&&Number.isSafeInteger(older.weekly_points);
  const weeklyDelta=comparable?w.weekly_points-older.weekly_points:null;
  return '<details class="native-profile-week"><summary><b>'+e(w.week)+'</b><span>'+numberText(w.weekly_points)+' Wochenpunkte</span>'+
   '<small>'+e(w.state==='final'?'Finalisiert':'Vorläufig / unvollständig')+' · '+e(w.verified_goal_days??0)+'/'+e(w.verified_days??0)+' bestätigte Zieltage'+
   (w.uncertain_days?' · '+e(w.uncertain_days)+' unklar':'')+'</small>'+
   (weeklyDelta!==null?'<small class="native-week-change">'+(weeklyDelta>0?'+':'')+numberText(weeklyDelta)+' zum '+e(older.week)+'</small>':'')+'</summary>'+
   '<div class="native-profile-timeline">'+(Number.isSafeInteger(w.weekly_points)?
    '<div class="native-vs-weekly-proof"><span>Wochenpunkte</span><button type="button" class="native-vs-day-link" data-native-vs-image="'+e(w.week+'|'+id+'|6')+'">'+numberText(w.weekly_points)+' · Originalbild ↗</button></div>':'')+days.map(day=>'<div><span>'+e(weekdays[day.weekday]||'?')+'</span><button type="button" class="native-vs-day-link" data-native-vs-image="'+e(w.week+'|'+id+'|'+day.weekday)+'" title="Privaten Screenshot öffnen"><b>'+
    (['observed','corrected'].includes(day.quality)&&day.points!==null?numberText(day.points):'Unbekannt')+
    '</b><small>'+e(day.quality||'nicht gelesen')+' · Bild ansehen</small></button></div>').join('')+'</div></details>';
 }).join('')+'</div>':
  '<p class="native-muted">Noch kein VS-Wochenverlauf vorhanden.</p>';
 const rides=(p.rides||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));
 const dice=(p.dice_wins||[]).slice().sort((a,b)=>b.ride_date.localeCompare(a.ride_date));
 const achievements=p.achievements||[];
 const line=(date,detail,sub)=>'<div><time>'+e(date)+'</time><b>'+e(detail)+'</b><small>'+e(sub||'')+'</small></div>';
 const historyCards='<div class="native-profile-metrics native-player-history-cards">'+
  '<details class="native-profile-metric-card"><summary><small>Zugfahrten</small><strong>'+rides.filter(x=>x.status==='completed').length+'</strong><span>Bestätigte Fahrten</span><em>Alle '+rides.length+' Einträge ansehen ›</em></summary>'+
   '<div class="native-profile-timeline">'+(rides.length?rides.map(x=>line(x.date,x.type||'Zug',x.status||'')).join(''):'<p>Keine zugeordneten Fahrten</p>')+'</div></details>'+
  '<details class="native-profile-metric-card"><summary><small>Dice Game</small><strong>'+dice.length+'</strong><span>Gewonnene Ziehungen</span><em>Gewinne anzeigen ›</em></summary>'+
   '<div class="native-profile-timeline">'+(dice.length?dice.map(x=>line(x.ride_date,'Dice Game gewonnen',x.roll_value===null?'Wurf unbekannt':'Wurf: '+x.roll_value)).join(''):'<p>Noch kein bestätigter Gewinn</p>')+'</div></details></div>';
 const achievementHtml=achievements.length?'<details class="native-fold"><summary>Erfolge & Meilensteine · '+achievements.length+'</summary>'+
  '<div class="native-profile-timeline native-fold-body">'+achievements.map(a=>line(String(a.date).slice(0,10),a.title,
   a.delta!==null&&a.delta!==undefined?deltaLabel(a.delta):'Bestätigte VS-Leistung')).join('')+'</div></details>':
  '<p class="native-muted">Noch keine nachweisbaren Meilensteine (+100.000 Kills, +1 Mio. Stärke oder 6/6 VS).</p>';
 node.innerHTML='<section class="native-profile"><div class="native-profile-header">'+
  '<button type="button" class="native-back" data-native-member-close>← Alle Spieler</button>'+
  '<span class="native-profile-rank" aria-label="Allianzrang">'+e(member.rank||'?')+'</span>'+
  '<div class="native-profile-identity"><span class="native-kicker">SPIELERAKTE · '+e(member.status==='active'?'AKTIV':member.status==='former'?'ARCHIV':'STATUS UNGEKLÄRT')+'</span>'+
  '<h3>'+e(member.name||'Unbekannt')+'</h3><p>'+e(member.state_source==='registry'?'Verwalteter Rang':'Letzter importierter Rang')+
  (member.blacklisted?' · Manuell gesperrt':'')+'</p></div></div>'+
  (active.length?'<p class="native-absence-warning">Aktuell als abwesend eingetragen. Zugvorschläge berücksichtigen diesen Zeitraum.</p>':'')+
  (member.source_difference?'<p class="native-evidence-note">Abweichender Import: '+e(member.imported_rank||'Rang unbekannt')+' · '+e(member.source_status||'Status ungeklärt')+'. Der bestätigte Verwaltungsstand hat Vorrang.</p>':'')+
  (member.registry_updated_by?'<p class="native-muted">Letzte Rang-/Statusänderung: '+e(member.registry_updated_by)+' · '+e(formatOfficerTime(member.registry_updated_at))+'</p>':'')+
  '<h4 class="native-section-heading">Werte & Entwicklung</h4>'+metricHtml+
  '<details class="native-fold"><summary>VS-Erfolge & Wochen · '+weeks.length+'</summary>'+
   '<div class="native-fold-body">'+weekSummary+'</div></details>'+
  '<h4 class="native-section-heading">Züge & Dice Game</h4>'+historyCards+
  '<h4 class="native-section-heading">Persönliche Erfolge</h4>'+achievementHtml+
  '<section class="native-person-absence"><div class="native-inline-heading"><h4>Abwesenheit</h4>'+
   '<button type="button" data-native-add-absence="'+e(id)+'">+ Eintragen</button></div>'+
   (attendance.length?'<div class="native-person-absence-list">'+attendance.map(a=>
     '<p><b>'+e(a.start_date)+' – '+e(a.end_date)+'</b>'+
     (a.note?' · '+e(a.note):'')+'</p>').join('')+'</div>':
     '<p class="native-muted">Keine Abwesenheit eingetragen.</p>')+
   '<div id="native-person-absence-form"></div></section>'+
  '<details class="native-fold"><summary>Verwaltung & Protokoll</summary>'+
   '<div class="native-fold-body"><div class="native-profile-actions">'+
    '<button type="button" data-native-manage="'+e(id)+'">Rang & Status bearbeiten</button>'+
    '<button type="button" data-native-member-log="'+e(id)+'">Änderungen anzeigen</button></div>'+
    '<div id="native-person-log"></div><div id="registry-form"></div></div></details></section>';
 node.scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function openVsScreenshot(target,key){
 const matched=/^(20\d{2}-W\d{2})\|([a-zA-Z0-9-]{1,80})\|([0-6])$/.exec(String(key));
 if(!matched)return;
 const [,week,memberId,weekday]=matched;
 target.querySelector('#native-vs-evidence-viewer')?.remove();
 const host=target.ownerDocument.createElement('section');
 host.id='native-vs-evidence-viewer';
 host.className='native-vs-evidence-backdrop';
 host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');
 host.setAttribute('aria-label','Privater Originalbeleg zum VS-Wert');
 host.innerHTML='<div class="native-vs-evidence-panel native-stat-evidence-panel">'+
  '<div class="native-row"><h3>Original-Screenshot · '+e(week)+'</h3>'+
  '<button type="button" data-native-vs-image-close aria-label="Bild schließen">Schließen ✕</button></div>'+
  '<p class="native-muted">Geschützter Originalbeleg; nur für angemeldete Offiziere.</p>'+
  '<div id="native-vs-evidence-image" class="native-stat-image" role="status">Quellzeile wird ermittelt …</div></div>';
 target.append(host);
 const area=host.querySelector('#native-vs-evidence-image');
 host.querySelector('[data-native-vs-image-close]')?.focus();
 const sourcePath='/api/vs-source/'+encodeURIComponent(week)+'/'+encodeURIComponent(memberId)+'/'+weekday;
 let source=null;
 try{
  if(weekday!=='6'){
   const info=await request(sourcePath);
   if(!host.isConnected)return;
   source=info.source?{...info.source,member_name:info.member_name}:null;
   if(source&&!source.image_available){
    area.textContent='Die richtige Spielerzeile wurde gefunden, aber das Originalbild ist noch nicht im privaten Archiv verfügbar. Es wird kein anderer Screenshot angezeigt.';
    return;
   }
  }
  let fetchPath=weekday==='6'
   ?'/api/vs-week/'+encodeURIComponent(week)+'/'+encodeURIComponent(memberId)+'/evidence'
   :source?sourcePath+'/image':
    '/api/vs-days/'+encodeURIComponent(week)+'/'+encodeURIComponent(memberId)+'/'+weekday+'/evidence';
  const response=await fetch(apiBase+fetchPath,{
   headers:{Authorization:'Bearer '+sessionToken,Accept:'image/png,image/jpeg,image/webp'},
   mode:'cors',credentials:'omit',cache:'no-store'
  });
  if(!host.isConnected)return;
  if(response.ok){
   const mime=(response.headers.get('Content-Type')||'').split(';')[0];
   if(!['image/png','image/jpeg','image/webp'].includes(mime))throw Error('Ungültiger Bildinhalt');
   const blob=await response.blob();
   if(blob.size<50||blob.size>950000)throw Error('Originalbildgröße ungültig');
   if(source){
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))]
     .map(v=>v.toString(16).padStart(2,'0')).join('');
    if(hash!==source.sha256)throw Error('Das Originalbild stimmt nicht mit der gespeicherten Quelle überein');
   }
   if(!host.isConnected)return;
   const urlKey='vs:'+key,previous=reviewBlobUrls.get(urlKey);
   if(previous)URL.revokeObjectURL(previous);
   const objectUrl=URL.createObjectURL(blob);
   reviewBlobUrls.set(urlKey,objectUrl);
   renderEvidenceRow(area,objectUrl,source?{
    row_y:source.row_y,source_name:source.source_name,
    member_name:source.member_name,
    source_value:source.source_value
   }:null,'Private Originalaufnahme zum ausgewählten VS-Wert',()=>host.isConnected);
   if(source)area.insertAdjacentHTML('beforeend',
    '<p class="native-evidence-note">Exakte Spielerzeile aus dem ursprünglichen VS-OCR-Import. '+
    'Bild und gespeicherte Punktzahl per Prüfsumme abgeglichen. '+
    (source.visually_checked?'Zusätzlich visuell bestätigt.':'OCR-Herkunft, keine gesonderte Officer-Abnahme.')+'</p>');
   return;
  }
  const problem=await response.json().catch(()=>({}));
  if(response.status!==404)throw Error(problem.error||'Privates Bild nicht abrufbar');
  area.innerHTML='<p>Kein eindeutig zugeordneter Original-Screenshot für diesen Spielerwert. '+
   'Es wird bewusst kein beliebiges Bild dieser Rangliste gezeigt.</p>'+
   '<form id="native-vs-evidence-upload" data-key="'+e(key)+'">'+
   '<label>Originalaufnahme (PNG/JPG/WebP)<input type="file" name="image" accept="image/png,image/jpeg,image/webp" required></label>'+
   '<label>Begründung / sichtbare Spielerzeile<input type="text" name="reason" required minlength="8" maxlength="300" value="Originale VS-Rangliste, sichtbaren Spielernamen und Wert geprüft"></label>'+
   '<button type="submit">Originalbild privat zuordnen</button>'+
   '<p role="status" class="native-vs-evidence-upload-result"></p></form>';
 }catch(error){if(host.isConnected)area.textContent='Originalbeleg konnte nicht geöffnet werden: '+error.message}
}

async function submitVsScreenshot(form,target){
 const key=form.dataset.key,matched=/^(20\d{2}-W\d{2})\|([a-zA-Z0-9-]{1,80})\|([0-6])$/.exec(String(key));
 if(!matched)return;
 const file=form.elements.namedItem('image')?.files?.[0],reason=form.elements.namedItem('reason')?.value||'';
 const message=form.querySelector('.native-vs-evidence-upload-result'),button=form.querySelector('[type=submit]');
 if(!file||file.size<50||file.size>950000||!['image/png','image/jpeg','image/webp'].includes(file.type)){
  message.textContent='Bildformat ungültig oder über 950 KB';return;
 }
 button.disabled=true;
 try{
  const path=matched[3]==='6'?'/api/vs-week/'+matched[1]+'/'+matched[2]+'/evidence':
   '/api/vs-days/'+matched[1]+'/'+matched[2]+'/'+matched[3]+'/evidence';
  const response=await fetch(apiBase+path,{
   method:'PUT',mode:'cors',credentials:'omit',cache:'no-store',
   headers:{Authorization:'Bearer '+sessionToken,'Content-Type':file.type,'X-Evidence-Reason':encodeURIComponent(reason)},
   body:file});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(result.error||'Screenshot konnte nicht gespeichert werden');
  await openVsScreenshot(target,key);
 }catch(error){message.textContent='Nicht gespeichert: '+error.message;button.disabled=false}
}
function editProfileAbsence(target,id){
 const host=target.querySelector('#native-person-absence-form');if(!host)return;
 const roster=cache.ops?.members||[];
 const leaderPool=roster.filter(x=>['R3','R4','R5'].includes(x.rank)&&x.id!==id);
 host.innerHTML='<form id="native-record-save" class="native-form native-absence-form" data-kind="absences" data-profile-id="'+e(id)+'">'+
  '<h4>Abwesenheit erfassen</h4><input type="hidden" name="member_id" value="'+e(id)+'">'+
  '<label>Von<input type="date" name="start_date" required></label>'+
  '<label>Bis<input type="date" name="end_date" required></label>'+
  '<label>Vertretung (optional)<select name="substitute_id">'+options(leaderPool)+'</select></label>'+
  '<label>Notiz (optional)<input name="note" maxlength="300" placeholder="Nur was für die Planung notwendig ist"></label>'+
  '<button type="submit" class="native-game-primary">Abwesenheit speichern</button>'+
  '<button type="button" data-native-form-reload hidden>Aktuellen Stand laden</button>'+
  '<p id="native-form-message" role="status"></p></form>';
 host.querySelector('[name=start_date]')?.focus();
}

const donationStatus={met:'Ziel erreicht',below:'Unter 20.000',unknown:'Wert unbekannt'};

function renderRequirements(target){
 const cfg=cache.requirements;if(!cfg)return;
 const numeric=(name,value,min,max,step,help)=>'<label class="native-requirement-field"><span>'+e(name)+'</span>'+
  '<input type="number" required inputmode="numeric" name="'+e(step)+'" min="'+min+'" max="'+max+'" step="1" value="'+e(value)+'">'+
  '<small>'+e(help)+'</small></label>';
 target.innerHTML='<div class="native-requirements-intro"><span class="native-kicker">ALLIANZ · VERWALTUNG</span>'+
  '<h2>Allianzregeln & Mindestwerte</h2><p>Werte für das private Command Center. Keine automatische Bestrafung oder Änderung historischer Rohdaten.</p></div>'+
  '<form id="native-requirements-save" class="native-requirements-form" data-revision="'+e(cfg.revision)+'">'+
  '<section class="native-requirement-section"><h3>Verpflichtende Mindestpunkte</h3><div class="native-requirement-grid">'+
   numeric('VS-Duell · pro Tag',cfg.vs_daily_minimum,0,100000000,'vs_daily_minimum','Montag–Samstag · derzeit 3,6 Millionen Punkte')+
   numeric('Allianzspenden · pro Woche',cfg.donation_weekly_minimum,0,1000000,'donation_weekly_minimum','Nur bestätigte wöchentliche Spenden; nicht täglich')+
  '</div></section>'+
  '<section class="native-requirement-section"><h3>Aktivitäts-Hinweise</h3><div class="native-requirement-grid">'+
   numeric('Mindestens aktive VS-Tage',cfg.min_active_vs_days,0,6,'min_active_vs_days','Empfehlung: 5 von 6 · 0 deaktiviert; nur bestätigte Tageswerte')+
   numeric('Hinweis nach X Tagen unter VS-Ziel',cfg.low_vs_day_warning_count,0,6,'low_vs_day_warning_count','Empfehlung: 2 Tage · 0 deaktiviert; keine automatische Strafe')+
  '</div><label class="native-requirement-check"><input type="checkbox" name="shield_reminder_saturday" '+(cfg.shield_reminder_saturday?'checked':'')+'>'+
   '<span><strong>Samstag an den Schild erinnern</strong><small>Hinweis für Enemy Buster, kein behaupteter Nachweis eines tatsächlich aktiven Schilds.</small></span></label></section>'+
  '<section class="native-requirement-section"><h3>Änderung dokumentieren</h3><label>Grund der Änderung'+
   '<textarea name="reason" rows="2" minlength="8" maxlength="300" required placeholder="Weshalb gelten die neuen Mindestwerte?"></textarea></label>'+
   '<div class="native-row"><button type="submit" class="native-game-primary">Allianzregeln speichern</button>'+
   '<button type="button" data-native-requirements-reload>Neu laden</button></div>'+
   '<p id="native-requirements-message" role="status" aria-live="polite"></p>'+
   '<p class="native-muted">Stand: '+e(cfg.updated_at||'unbekannt')+' · Version '+e(cfg.revision)+
   '. Neue Grenzwerte bewerten vorhandene bestätigte Messpunkte neu, ohne Spielerwerte zu überschreiben. Abwesenheiten und unbekannte OCR-Werte benötigen weiterhin eine faire manuelle Einzelfallprüfung.</p>'+
  '</section></form>'+
  '<details class="native-fold"><summary>Weitere sinnvolle Regeln – noch ohne automatische Bewertung</summary><div class="native-fold-body">'+
   '<p><b>Schildpflicht am Samstag:</b> sinnvoll, aber ohne echten Schild-Nachweis keine automatische Verletzung ausweisen.</p>'+
   '<p><b>Event-Teilnahme:</b> Siege, Guard und Desert Storm erst ab zuverlässig erfassten Teilnehmerlisten bewerten.</p>'+
   '<p><b>Abwesenheit:</b> vorher angekündigte Ausnahmen individuell berücksichtigen und niemals fehlendes OCR als 0 zählen.</p>'+
  '</div></details>';
}
function renderDonations(target,query=''){
 const host=target.querySelector('#native-donations-body');if(!host)return;
 const weeks=cache.donations?.weeks||[];
 const week=weeks.find(w=>w.week===target.querySelector('#native-donation-week')?.value)||weeks[0];
 if(!week){host.innerHTML='<p class="native-muted">Noch keine wöchentlichen Allianzspenden importiert. Werte werden nicht geschätzt.</p>';return}
 const minimum=cache.donations?.minimum||20000;
 const search=String(query).trim().toLocaleLowerCase('de-DE');
 const members=(week.members||[]).filter(m=>String(m.name||'').toLocaleLowerCase('de-DE').includes(search));
 const groups=[['below','Unter Wochenziel'],['unknown','Wert nicht bestätigt'],['met','Wochenziel erreicht']];
 const previousAvailable=weeks.some(w=>w.week!==week.week&&w.week<week.week);
 const matched=members.filter(m=>m.status==='met').length;
 const rate=week.verified>0?Math.round(100*week.met/week.verified):null;
 const tile=(label,value,extra)=>'<article class="native-donation-tile"><small>'+e(label)+'</small><strong>'+e(value)+'</strong><span>'+e(extra)+'</span></article>';
 const section=([state,label])=>{
  const players=members.filter(m=>m.status===state),n=players.length;
  return '<details class="native-fold native-donation-group native-donation-'+state+'" '+(search&&n?'open':'')+'><summary><strong>'+e(label)+'</strong><span>'+n+' Spieler</span></summary>'+
   '<div class="native-fold-body">'+(n?players.map((m,i)=>
    '<article class="native-donation-person"><div class="native-donation-person-head">'+
    '<strong>'+e(m.name)+'</strong><small>'+e(m.rank||'?')+'</small><b>'+
    (m.points===null?'Unbekannt':statValueButton(m.points,m.snapshot_id||week.snapshot_id,m.id,'donations_weekly'))+'</b></div>'+
    (m.points===null?'<p class="native-muted">Unbekannte Spenden sind keine 0.</p>':
    '<div class="native-donation-progress" role="progressbar" aria-label="Anteil zum Wochenziel" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.min(100,Math.round(m.points/minimum*100))+'">'+
    '<span style="width:'+Math.min(100,Math.round(m.points/minimum*100))+'%"></span></div>'+
    '<p class="native-donation-delta">'+(m.difference>=0?'+':'')+numberText(m.difference)+' zum Wochenminimum'+
    (m.delta!==null?' · '+(m.delta>0?'+':'')+numberText(m.delta)+' zu '+e(m.previous_week):
    ' · Kein verifizierter Vorwochenvergleich')+'</p>')+
    '<button type="button" data-native-member="'+e(m.id)+'">Spielerakte & Spendenverlauf ansehen ›</button></article>'
   ).join(''):'<p class="native-muted">Keine Spieler in dieser Gruppe.</p>')+'</div></details>';
 };
 const existingSearch=target.querySelector('#native-donation-search');
 const focused=existingSearch===target.ownerDocument?.activeElement;
 const position=focused?existingSearch.selectionStart:null;
 host.innerHTML='<section class="native-vs-brief native-donation-summary" aria-label="Allianzspenden Wochenauswertung">'+
  '<div class="native-vs-heading"><div><h3>Wochenauswertung '+e(week.week)+'</h3>'+
   '<p class="native-muted">Aufnahme: '+e(formatOfficerTime(week.captured_at))+' · '+e(week.is_complete?'Vollständige Mitgliederaufnahme':'Teilaufnahme')+'</p></div>'+
   '<span class="native-donation-goal">Ziel '+numberText(minimum)+'</span></div>'+
  '<div class="native-donation-tiles">'+tile('Ziel erreicht',week.met,'Bestätigte Spieler')+
   tile('Unter Ziel',week.below,'Bestätigte Spieler')+
   tile('Unbekannt',week.unknown,'Nicht als 0 gewertet')+
   tile('Zielquote',rate===null?'—':rate+' %','Von '+week.verified+' bestätigten Werten')+'</div>'+
  '<p class="native-evidence-note">Werte gelten zum Zeitpunkt des Screenshots. '+week.verified+'/'+week.active+
   ' aktive Spieler mit bestätigten Wochenspenden. '+(previousAvailable?
   'Vergleiche erscheinen nur bei zwei bestätigten Messpunkten.':
   'Bisher liegt nur eine verlässliche Wochenaufnahme vor – kein erfundener Vorwochenvergleich.')+'</p>'+
  '<label class="native-ios-search">Spieler suchen<input id="native-donation-search" type="search" value="'+e(query)+'" placeholder="Mitglied oder Name" autocomplete="off"></label>'+
  '<div class="native-donation-groups">'+groups.map(section).join('')+'</div>'+
  reportPanel(donationsWeeklyMail(week,minimum))+
  '<details class="native-fold"><summary>So werden die Spenden bewertet</summary><div class="native-fold-body">'+
   '<p>Mindestens 20.000 Spenden pro Spieler und Woche. Nur nachweislich erfasste Werte aus „Wöchentliche Spenden“ zählen. Fehlende Werte bleiben unbekannt, ein späterer Messzeitpunkt wird nicht erfunden.</p>'+
   '<p>Die Aufnahme stellt einen Zeitpunkt innerhalb der angegebenen Woche dar; eine noch nicht abgeschlossene Woche ist keine endgültige Leistungsbewertung.</p></div></details></section>';
 if(focused){const input=target.querySelector('#native-donation-search');input.focus();if(position!==null)input.setSelectionRange(position,position)}
}
function renderVs(target){
  const week=cache.vs.weeks.find(w=>w.week===target.querySelector('#native-vs-week').value)||cache.vs.weeks[0];
  const host=target.querySelector('#native-vs-body');
  if(!week){host.innerHTML='<p class="native-muted">Noch keine VS-Woche importiert.</p>';return}
  const labels=['Mo','Di','Mi','Do','Fr','Sa'];
  const members=week.members||[];
  const policy=cache.vs.policy||{};
  const lowWarnings=members.filter(x=>x.repeatedLowDays).length;
  const participationWarnings=members.filter(x=>x.participationStatus==='below').length;
  const groups=[
   ['Unter Tagesziel',members.filter(m=>m.failed>0)],
   ['Werte noch unklar',members.filter(m=>m.unknown>0)],
   ['Weitere Spieler',members.filter(m=>!m.failed&&!m.unknown)]
  ];
  // All player groups start collapsed, including "Unter Tagesziel".
  const groupMarkup=([name,players])=>'<details class="native-fold native-vs-group">'+
   '<summary><span>'+e(name)+'</span><b>'+players.length+' Spieler</b></summary><div class="native-fold-body">'+
   (players.length?'<div class="native-list">'+players.map(p=>'<details class="native-vs-player"><summary>'+e(p.name)+' · '+e(p.failed||0)+' unter Ziel / '+e(p.unknown||0)+' unklar'+(policy.min_active_vs_days?' · '+e(p.activeDays??'?')+' aktive Tage':'')+'</summary>'+
    '<button type="button" class="native-vs-open-person" data-native-member="'+e(p.id)+'">Spielerakte & Entwicklung öffnen ›</button>'+
    (Number.isSafeInteger(p.weekly_points)?'<p class="native-vs-week-total"><button type="button" class="native-vs-day-link" data-native-vs-image="'+e(week.week+'|'+p.id+'|6')+'">'+numberText(p.weekly_points)+' Wochenpunkte · Originalbild ↗</button></p>':'')+
    '<div class="native-vs-player-days">'+(p.days||[]).map((d,i)=>'<span><b>'+labels[i%6]+'</b> <button type="button" class="native-vs-day-link" data-native-vs-image="'+e(week.week+'|'+p.id+'|'+i)+'" aria-label="'+e(labels[i%6])+' Screenshot zu '+e(p.name)+' ansehen">'+
    (d.verified&&d.points!=null?e(Number(d.points).toLocaleString('de-DE')):'Unbekannt')+' <small>↗</small></button></span>').join('')+'</div></details>').join('')+'</div>':
    '<p class="native-muted">Keine Spieler in dieser Gruppe.</p>')+'</div></details>';
  const dayTiles='<div class="native-weekdays" role="list" aria-label="Sechs Tage im Allianzduell">'+(week.dayTotals||[]).map(d=>{
    const label=labels[d.weekday]||'-';
    return '<div role="listitem" class="native-vs-day"><b>'+e(label)+'</b><span>'+e(d.passed??0)+' erreicht</span>'+
     '<span>'+e(d.failed??0)+' unter Ziel</span><small>'+e(d.unknown??0)+' unklar</small></div>';
   }).join('')+'</div>';
  host.innerHTML='<section class="native-vs-brief" aria-label="VS-Wochenübersicht">'+
   '<div class="native-vs-heading"><div><h3>Wochenüberblick</h3><p class="native-muted">Tagesziel: '+e(numberText(week.threshold))+' Punkte · Nur bestätigte Werte</p></div>'+
   '<button type="button" class="native-vs-action" data-native-action="review-open">OCR-Prüffälle ('+e(cache.overview?.reviews??'—')+')</button></div>'+
   (Number.isFinite(week.priority)&&week.priority>0?'<p class="native-vs-priority-note">'+e(week.priority)+' Spieler mit mindestens '+e(policy.low_vs_day_warning_count??3)+' bestätigten Tagen unter dem VS-Ziel. Das sind keine offenen OCR-Prüffälle.</p>':'')+
   '<p class="native-vs-policy-status">'+(policy.low_vs_day_warning_count?e(lowWarnings)+' Spieler mit mindestens '+e(policy.low_vs_day_warning_count)+' Tagen unter Ziel. ':'')+(policy.min_active_vs_days?e(participationWarnings)+' mit weniger als '+e(policy.min_active_vs_days)+' aktiven Tagen bei vollständiger Erfassung. ':'')+(policy.shield_reminder_saturday?'Samstag: Schildpflicht erinnern (nicht automatisch überprüfbar).':'')+'</p>'+
   '<div class="native-vs-compact">'+cards([['Unter Ziel',week.failedDays??0,'bestätigte Tage'],
    ['Noch unklar',week.unknownDays??0,'nicht als 0 gewertet'],['6 von 6',week.perfect??0,'Spieler mit erreichtem Ziel']])+'</div>'+
   '<details class="native-fold native-vs-days"><summary>Tagesvergleich <small>Mo bis Sa</small></summary>'+
   '<div class="native-fold-body">'+dayTiles+'</div></details>'+
   '<h3 class="native-vs-list-title">Spieler nach Ergebnis</h3>'+
   '<div class="native-vs-groups">'+groups.map(groupMarkup).join('')+'</div>'+
   reportPanel(vsWeeklyMail(week,policy))+
   '<details class="native-fold native-vs-explainer"><summary>Wie werden die Werte bewertet?</summary>'+
   '<p class="native-fold-body native-muted">Nur bestätigte Ergebnisse zählen als über oder unter dem Tagesziel. Nicht lesbare Screenshots bleiben unklar und werden nie als 0 Punkte erfasst. Öffne „Prüffälle“, um solche Werte nachzusehen.</p></details>'+
   '</section>';
}
const trainWeekdays=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
const trainRideTypes=['R5','R4','Members Day','Donation King','VS Hero'];
export const memberAbsentOn=(memberId,date,absences=[])=>Boolean(memberId&&date&&absences.some(x=>x.member_id===memberId&&x.start_date<=date&&x.end_date>=date));
function renderTrainRotation(target){
 const host=target.querySelector('#native-train-rotation-body');if(!host)return;
 const data=cache.rotation;
 if(!data){host.innerHTML='<p class="native-muted">Rotationsbearbeitung erst nach Aktivierung des privaten Cloudflare-Dienstes verfügbar. Der bestehende Zugplan bleibt unverändert.</p>';return}
 const opts=(list,current,empty=false)=>(empty?'<option value="">Keine feste Koordination</option>':'')+
  list.map(([value,label])=>'<option value="'+e(value)+'" '+(current===value?'selected':'')+'>'+e(label)+'</option>').join('');
 const leaders=(cache.trains?.members||[]).filter(m=>['R4','R5'].includes(m.rank)).map(m=>[m.id,m.name+' · '+m.rank]);
 host.innerHTML='<form id="native-train-rotation-save" class="native-form native-rotation-form" data-revision="'+e(data.revision)+'">'+
  '<p class="native-form-help">Hier legst du fest, welcher Zugtyp an welchem Wochentag gilt und welcher Officer koordiniert. Die Fahrer bleiben manuell bestätigt.</p>'+
  '<div class="native-rotation-grid">'+trainWeekdays.map((day,i)=>
   '<div class="native-rotation-day"><strong>'+day+'</strong><label>Zugtyp<select name="type'+i+'">'+opts(trainRideTypes.map(x=>[x,x]),data.types[i])+'</select></label>'+
   '<label>Koordination<select name="coord'+i+'">'+opts(leaders,data.coordinators[i]||'',true)+'</select></label></div>').join('')+'</div>'+
  '<label class="native-check"><input type="checkbox" name="auto_suggest" '+(data.auto_suggest?'checked':'')+'>Fahrerempfehlungen anzeigen</label>'+
  '<label>Warum ändern wir die Rotation?<input name="reason" minlength="8" maxlength="500" required placeholder="z.B. neue R4-Dienstverteilung"></label>'+
  '<button type="submit" class="native-game-primary">Wochenrotation speichern</button>'+
  '<button type="button" data-native-rotation-reload hidden>Aktuellen Stand laden</button>'+
  '<p id="native-rotation-message" role="status"></p></form>';
}
export function trainSuggestionFacts(person,type){
 const rides=Number.isInteger(person?.rides)&&person.rides>=0?person.rides:null;
 const facts=[rides===null?'Fahrtenzahl unbekannt':rides===0?'Keine bestätigte Fahrt zugeordnet':
  rides+' bestätigte '+(rides===1?'Fahrt':'Fahrten')];
 facts.push(person?.last_ride?'Letzte Fahrt: '+person.last_ride:'Keine letzte Fahrt belegt');
 // Older Worker releases sent 0 for BOTH unknown and observed-zero metrics.
 // A zero without the explicit evidence flag must remain unconfirmed in Luna.
 const metric=(value,label,known)=>value===null||value===undefined||!Number.isFinite(Number(value))||
  (Number(value)===0&&known!==true)?label+': nicht belegt':
  label+': '+new Intl.NumberFormat('de-DE').format(Number(value));
 if(type==='Donation King')facts.push(metric(person?.donations_weekly,'Wochenspenden',person?.donations_weekly_known));
 if(type==='VS Hero')facts.push(metric(person?.vs_weekly,'VS-Wochenpunkte',person?.vs_weekly_known));
 return facts;
}
function renderTrain(target){
 const d=cache.trains,upcoming=(d.calendar||[]).filter(x=>x.date>=d.today).slice(0,7);
 const absent=(id,date)=>memberAbsentOn(id,date,d.absences||[]);
 const slot=x=>'<article class="native-train-item '+(x.date===d.today?'native-train-today':'')+'">'+
  '<div><span class="native-kicker">'+(x.date===d.today?'HEUTE':e(x.date))+' · '+e(x.type||'Zug')+'</span>'+
  '<strong>'+e(x.entry?.driver||'Noch kein Fahrer eingetragen')+'</strong>'+
  '<small>'+e(x.entry?.status||'Offen')+(x.entry?.linked===false?' · Zuordnung nicht verifiziert':'')+(x.unavailable_driver?' · Achtung: Abwesenheit eingetragen':'')+'</small>'+ (x.suggestions?.length?'<small class="native-train-recommendation">Vorschlag: '+e(x.suggestions[0].name)+' · '+e(x.suggestions[0].rank)+'</small>':'')+'</div>'+
  '<div class="native-train-actions"><button type="button" data-native-train="'+e(x.date)+'">'+(x.entry?'Bearbeiten':'Fahrer wählen')+'</button>'+
  '<button type="button" data-native-dice-date="'+e(x.date)+'">🎲 '+e((cache.dice||[]).find(d=>d.ride_date===x.date)?.winner_name||'Dice Game')+'</button>'+
  (x.entry?.status==='planned'&&x.entry?.member_id&&(d.members||[]).some(m=>m.id===x.entry.member_id)?
   '<button type="button" data-native-copy-train="'+e(x.date)+'">Zugtext kopieren</button>':'')+'</div>'+
  (x.suggestions?.length?'<details class="native-train-shortlist"><summary>Kandidaten vergleichen · '+x.suggestions.length+'</summary>'+
   '<p class="native-muted">Unverbindliche Reihenfolge nach zugeordneten Fahrten, Abstand und passenden Leistungswerten. Unbekannte Werte zählen nicht als null.</p>'+
   '<ol class="native-train-candidates">'+x.suggestions.map(person=>'<li><div><b>'+e(person.name)+'</b><small>'+e(person.rank)+'</small>'+
    '<span>'+trainSuggestionFacts(person,x.type).map(e).join(' · ')+'</span></div>'+
    '<button type="button" data-native-train-choice="'+e(person.id)+'" data-date="'+e(x.date)+'" aria-label="'+e(person.name)+' als Fahrer für '+e(x.date)+' vormerken">Auswählen</button></li>').join('')+'</ol></details>':'')+'</article>';
 const toShow=upcoming.length?upcoming.map(slot).join(''):'<p class="native-muted">Für diese Woche liegen keine Zugdaten vor.</p>';
 target.querySelector('#native-train-body').innerHTML='<p class="native-muted">Fahrer ab R2 · historische Importe bleiben unverändert. Geplant, gefahren und noch nicht bestätigt sind unterschiedliche Zustände.</p>'+
  '<div class="native-train-highlights">'+cards([['Gefahren (Historie)',d.counts?.completed??'—'],['Geplant',d.counts?.planned??'—'],['Historische Lücken',d.counts?.missing_recent??'—']])+'</div>'+
  '<h3 class="native-section-heading">Heute & diese Woche</h3><div class="native-list native-train-week">'+toShow+'</div>'+
  '<div id="native-train-form"></div><details class="native-fold"><summary>Dice Game Gewinner · '+(cache.dice?.length||0)+'</summary>'+
  '<div class="native-fold-body native-list">'+((cache.dice||[]).length?(cache.dice||[]).map(x=>
   '<button type="button" data-native-dice-date="'+e(x.ride_date)+'">🎲 '+e(x.ride_date)+' · '+e(x.winner_name)+(x.roll_value?' · '+e(x.roll_value):'')+'</button>').join(''):
   '<p class="native-muted">Noch keine Dice-Game-Gewinner eingetragen.</p>')+'</div></details>'+
  '<details class="native-fold"><summary>Vergangene Züge · '+(d.history?.length||0)+'</summary>'+
  '<div class="native-fold-body native-list">'+(d.history||[]).slice(0,historyLimit).map(x=>
   '<button type="button" data-native-train="'+e(x.date)+'">'+e(x.date)+' · '+e(x.driver)+' '+marker(x.status)+'</button>').join('')+
  ((d.history||[]).length>historyLimit?'<button type="button" data-native-more="train">Weitere 20 Fahrten</button>':'')+
  '</div></details><details class="native-fold native-train-rotation"><summary>Wochenrotation & Zuständigkeiten bearbeiten</summary><div class="native-fold-body" id="native-train-rotation-body"></div></details>';
 renderTrainRotation(target);
}
function editTrain(target,date,allowDateChange=false,preferredMemberId=null){
 const d=cache.trains,entry=(d.history||[]).find(x=>x.date===date);
 const optionsList=options((d.members||[]).filter(m=>!memberAbsentOn(m.id,date,d.absences||[])||m.id===entry?.member_id),preferredMemberId||entry?.member_id);
 const editor=target.querySelector('#native-train-form');
 if(!editor)return;
 editor.innerHTML='<form id="native-train-save" class="native-form native-fast-form"><h3>Zugfahrer · '+e(date)+'</h3>'+
  '<p class="native-form-help">Fahrer ab R2. Wer an diesem Tag als abwesend eingetragen ist, wird nicht vorgeschlagen und kann nicht neu geplant werden.</p>'+
  '<label>Fahrer aus Allianz<select name="member_id">'+optionsList+'</select></label>'+
  '<label>Status<select name="status">'+[['planned','Geplant'],['completed','Gefahren'],['cancelled','Abgesagt']].map(([v,l])=>
   '<option value="'+v+'" '+(v===(entry?.status||'planned')?'selected':'')+'>'+l+'</option>').join('')+'</select></label>'+
  '<details class="native-form-more" '+(allowDateChange?'open':'')+'><summary>Datum, freie Namen & Notizen</summary><div class="native-form-more-fields">'+
  '<label>Datum<input name="date" type="date" value="'+e(date)+'" required '+(allowDateChange?'':'readonly')+'></label>'+
  '<label>Nur wenn keine sichere Zuordnung möglich ist: freier Name<input name="driver_name" maxlength="80" value="'+e(entry?.member_id?'':entry?.driver||'')+'"></label>'+
  '<label>Notiz<input name="note" maxlength="300" value="'+e(entry?.note||'')+'"></label></div></details>'+
  '<button type="submit" class="native-game-primary">Zugzuordnung speichern</button>'+
  '<button type="button" data-native-form-reload hidden>Aktuellen Zugstand laden</button>'+
  '<p id="native-form-message" role="status"></p></form>';
 editor.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function editDice(target,date){
 const current=(cache.dice||[]).find(x=>x.ride_date===date);
 const roster=(cache.diceMembers||[]).filter(m=>m.status==='active');
 const editor=target.querySelector('#native-train-form');if(!editor)return;
 editor.innerHTML='<form class="native-form native-fast-form" id="native-dice-save" data-revision="'+e(current?.revision||0)+'">'+
  '<h3>🎲 Dice Game · '+e(date)+'</h3>'+
  '<p class="native-form-help">Den tatsächlichen Gewinner eintragen. Fahrerauswahl und Zugrotation bleiben unabhängig.</p>'+
  '<label>Datum<input type="date" name="date" value="'+e(date)+'" required></label>'+
  '<label>Gewinner aus der Allianz<select name="winner_id" required>'+options(roster,current?.winner_id||'')+'</select></label>'+
  '<label>Würfelwert (optional)<input type="number" name="roll_value" min="1" max="999" value="'+e(current?.roll_value??'')+'"></label>'+
  '<label>Notiz (optional)<input name="note" maxlength="300" value="'+e(current?.note||'')+'"></label>'+
  '<button type="submit" class="native-game-primary">Dice-Game-Gewinner speichern</button>'+
  (current?'<button type="button" class="native-danger-action" data-native-dice-delete="'+e(date)+'" data-revision="'+e(current.revision)+'">Ziehung löschen</button>':'')+
  '<p role="status" id="native-dice-message"></p></form>';
 editor.scrollIntoView({behavior:'smooth',block:'nearest'});
}
const allianceEventLabels={
 marshall_guard:'Marshall Guard · Allianzübung',
 zombie_siege:'Zombie Siege · Zombiebelagerung',
 desert_storm:'Desert Storm'
};
const allianceEventOutcomeLabels={
 scheduled:'Geplant',completed:'Abgeschlossen',failed:'Nicht geschafft',cancelled:'Abgesagt'
};
// Preserve observations exactly. Unknown levels and wave values must not become zero,
// and an upcoming run must never be mistaken for a successful historical attempt.
export function summarizeAllianceEventRuns(source,type){
 const entries=(Array.isArray(source)?source:[]).filter(x=>x&&x.event_type===type&&
  typeof x.event_date==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(x.event_date))
  .sort((a,b)=>b.event_date.localeCompare(a.event_date)||
    String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
 const historical=entries.filter(x=>x.outcome==='completed'||x.outcome==='failed');
 const completed=entries.filter(x=>x.outcome==='completed');
 const planned=entries.filter(x=>x.outcome==='scheduled');
 const latest=historical[0]||null,previous=historical[1]||null;
 const number=x=>Number.isInteger(x)&&x>=1&&x<=999?x:null;
 const level=number(latest?.level),previousLevel=number(previous?.level);
 const validLevels=completed.map(x=>number(x.level)).filter(x=>x!==null);
 const bestLevel=validLevels.length?Math.max(...validLevels):null;
 const waveValue=x=>Number.isInteger(x)&&x>=0&&x<=999?x:null;
 const waves=type==='zombie_siege'?waveValue(latest?.waves):null;
 return {type,entries,historical,completed,planned,latest,previous,
  level,bestLevel,waves,deltaLevel:level!==null&&previousLevel!==null?level-previousLevel:null,
  confirmedCount:historical.length};
}
function renderEventRuns(target){
 const data=cache.ops,entries=data?.events||[];
 const names=new Map((data?.members||[]).map(m=>[m.id,m.name]));
 const eventRow=x=>'<button type="button" class="native-event-history-row" data-native-edit="'+e(x.id)+'">'+
  '<span><b>'+e(x.event_date)+'</b><small>'+e(allianceEventOutcomeLabels[x.outcome]||'Nicht bestätigt')+'</small></span>'+
  '<span><strong>'+e(x.level??'—')+'</strong><small>Level</small></span>'+
  (x.event_type==='zombie_siege'?'<span><strong>'+e(x.waves??'—')+'</strong><small>Wellen</small></span>':'')+
  '<span class="native-event-history-actor">'+e(names.get(x.lead_id)||'Leitung offen')+'</span></button>';
 const groups=['zombie_siege','marshall_guard'].map(type=>{
  const data=summarizeAllianceEventRuns(entries,type);
  const last=data.latest,latestLevel=data.level??'—';
  const diff=data.deltaLevel===null?'Noch kein direkter Vergleich':
   data.deltaLevel===0?'Level unverändert':(data.deltaLevel>0?'+':'')+data.deltaLevel+' Level zum vorherigen Durchgang';
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());
  const upcoming=data.planned.filter(x=>x.event_date>=today).sort((a,b)=>a.event_date.localeCompare(b.event_date))[0];
  const bars=data.historical.slice(0,7).reverse().filter(x=>Number.isInteger(x.level)&&x.level>0);
  const ceiling=Math.max(1,...bars.map(x=>x.level));
  return '<section class="native-event-panel" aria-label="'+e(allianceEventLabels[type])+'">'+
   '<div class="native-event-panel-head"><div><span class="native-kicker">ALLIANZ-EINSATZ</span>'+
   '<h3>'+e(allianceEventLabels[type])+'</h3></div>'+
   '<button type="button" class="native-game-primary" data-native-event-quick="'+type+'">+ Durchgang</button></div>'+
   '<div class="native-event-summary">'+
   '<div><small>Letztes Ergebnis</small><strong>'+e(last?.event_date||'—')+'</strong>'+
    '<span>'+e(last?allianceEventOutcomeLabels[last.outcome]:'Noch nicht dokumentiert')+'</span></div>'+
   '<div><small>Letztes Level</small><strong>'+e(latestLevel)+'</strong><span>'+e(diff)+'</span></div>'+
   '<div><small>'+(type==='zombie_siege'?'Letzte Wellen':'Höchstes abgeschlossenes Level')+'</small>'+
   '<strong>'+e(type==='zombie_siege'?data.waves??'—':data.bestLevel??'—')+'</strong>'+
   '<span>'+data.confirmedCount+' dokumentierte Ergebnisse</span></div></div>'+
   (upcoming?'<p class="native-event-next">Nächster eingetragener Termin: <b>'+e(upcoming.event_date)+'</b> · Level '+e(upcoming.level??'offen')+'</p>':
   '<p class="native-muted">Kein zukünftiger Termin eingetragen. Keine automatische Terminprognose.</p>')+
   (bars.length?'<p class="native-muted native-event-trend-label">Dokumentierte Levelversuche · Grau = nicht geschafft</p><div class="native-event-trend" role="img" aria-label="'+e(type==='zombie_siege'?'Zombie Siege':'Marshall Guard')+
     ': aufgezeichnete Level '+bars.map(x=>e(x.event_date)+': '+e(x.level)).join(', ')+'">'+
     bars.map(x=>'<div><span class="native-event-bar '+(x.outcome==='failed'?'native-event-bar--failed':'')+'" style="height:'+Math.round(x.level/ceiling*100)+'%"></span>'+
      '<b>'+e(x.level)+'</b><small>'+e(x.event_date.slice(5))+'</small></div>').join('')+'</div>':
    '<p class="native-muted">Noch keine bestätigten Level für einen Verlauf vorhanden.</p>')+
   '<details class="native-fold"><summary>Alle Durchgänge · '+data.entries.length+'</summary>'+
    '<div class="native-fold-body native-event-history">'+(data.entries.length?data.entries.map(eventRow).join(''):
    '<p class="native-muted">Noch keine erfassten Durchgänge.</p>')+'</div></details></section>';
 }).join('');
 const other=entries.filter(x=>x.event_type==='desert_storm');
 target.querySelector('#native-records').innerHTML='<div class="native-event-intro"><p>Alle paar Tage erfassen: <strong>Level, Wellen, Ergebnis und Teilnahme</strong>. Jeder Durchgang bleibt mit Datum und verantwortlichem Officer erhalten.</p></div>'+
  '<div class="native-event-panels">'+groups+'</div>'+
  '<details class="native-fold"><summary>Weitere Events · Desert Storm ('+other.length+')</summary>'+
  '<div class="native-fold-body native-event-history">'+(other.length?other.map(eventRow).join(''):
   '<p class="native-muted">Noch keine Desert-Storm-Durchgänge dokumentiert.</p>')+'</div></details>';
}
function updateEventForm(form){
 if(!form||form.dataset.kind!=='events')return;
 const type=form.elements.namedItem('event_type')?.value;
 const waveRow=form.querySelector('[data-event-waves]');
 if(waveRow)waveRow.hidden=type!=='zombie_siege';
 const wave=form.elements.namedItem('waves');if(wave)wave.disabled=type!=='zombie_siege';
 const hint=form.querySelector('[data-event-guidance]');
 if(hint)hint.textContent=type==='zombie_siege'?
  'Schwierigkeit und tatsächlich erreichte Wellen eintragen (im üblichen Modus bis 20). Unbekannt bleibt leer.':
  type==='marshall_guard'?
   'Gewählte Stufe, Teilnahme und Abschluss festhalten. Gesamtschaden und Belohnungsphasen folgen in einer späteren Erweiterung.':
   'Termin, Verantwortliche, Teamstärke und Ergebnis dokumentieren.';
}
function renderRecords(target){
 if(panel==='events'){renderEventRuns(target);return}
 const d=cache.ops,entries=d[panel]||[],names=new Map(d.members.map(m=>[m.id,m.name]));
 const title=x=>panel==='tasks'?x.title:(names.get(x.member_id)||'Unbekannt')+' · '+x.start_date+'–'+x.end_date;
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());
 const recordRow=x=>'<article class="native-operational-item"><button type="button" data-native-edit="'+e(x.id)+'">'+
  '<strong>'+e(title(x))+'</strong><small>'+e(panel==='tasks'?
    (x.priority||'normal')+' · '+(names.get(x.assignee_id)||'Noch ohne zuständigen R4/R5')+
    (x.due_date?' · Frist '+x.due_date:''):
    'Vertretung: '+(names.get(x.substitute_id)||'offen'))+'</small></button>'+
  (panel==='tasks'?'<button type="button" class="native-task-check" data-native-task-toggle="'+e(x.id)+'" '+
    'aria-label="'+(x.status==='done'?'Aufgabe wieder öffnen':'Aufgabe als erledigt abhaken')+'">'+
    (x.status==='done'?'↻ Wieder öffnen':'✓ Erledigt')+'</button>':'')+'</article>';
 let markup='';
 if(panel==='tasks'){
  const open=entries.filter(x=>x.status!=='done').sort((a,b)=>(a.due_date||'9999').localeCompare(b.due_date||'9999'));
  const done=entries.filter(x=>x.status==='done');
  markup=cards([['Offen',open.length],['Abgeschlossen',done.length]])+
   '<section class="native-operation-group"><h3>Offene Aufgaben · '+open.length+'</h3>'+
    (open.length?'<div class="native-list">'+open.map(recordRow).join('')+'</div>':'<p class="native-muted">Alle Aufgaben erledigt.</p>')+'</section>'+
   '<details class="native-fold native-operation-group"><summary>Abgeschlossene Aufgaben · '+done.length+'</summary>'+
    '<div class="native-fold-body native-list">'+(done.length?done.map(recordRow).join(''):'<p class="native-muted">Noch keine erledigten Aufgaben.</p>')+'</div></details>';
 }else{
  const current=entries.filter(x=>x.end_date>=today),past=entries.filter(x=>x.end_date<today);
  markup=cards([['Geplant / aktiv',current.length],['Vergangen',past.length]])+
   '<div class="native-operation-group"><h3>Aktuelle Abwesenheiten</h3>'+
    (current.length?'<div class="native-list">'+current.map(recordRow).join('')+'</div>':'<p class="native-muted">Keine laufenden Abwesenheiten.</p>')+'</div>'+
   '<details class="native-fold"><summary>Vergangene Abwesenheiten · '+past.length+'</summary>'+
    '<div class="native-fold-body native-list">'+past.map(recordRow).join('')+'</div></details>';
 }
 target.querySelector('#native-records').innerHTML=markup;
}
function editRecord(target,kind,id){
 const d=cache.ops,record=d[kind].find(x=>x.id===id)||{},select=(name)=>{
  const ranks=kind==='tasks'?['R4','R5']:(name==='substitute_id'||name==='lead_id')?['R3','R4','R5']:null;
  return options(ranks?d.members.filter(m=>ranks.includes(m.rank)):d.members,record[name]||'');
 };
 const fields={
  tasks:'<label>Aufgabe<input name="title" minlength="3" maxlength="160" required></label><label>Zuständig<select name="assignee_id">'+select('assignee_id')+'</select></label><label>Ersatz<select name="substitute_id">'+select('substitute_id')+'</select></label><label>Frist<input type="date" name="due_date"></label><label>Priorität<select name="priority"><option>normal</option><option>high</option><option>urgent</option><option>low</option></select></label><label>Status<select name="status"><option value="open">Offen</option><option value="in_progress">In Arbeit</option><option value="blocked">Blockiert</option><option value="done">Erledigt</option></select></label><label>Notiz<textarea name="description" maxlength="1000"></textarea></label>',
  absences:'<label>Abwesend<select name="member_id" required>'+select('member_id')+'</select></label><label>Ersatz<select name="substitute_id">'+select('substitute_id')+'</select></label><label>Beginn<input name="start_date" type="date" required></label><label>Ende<input name="end_date" type="date" required></label><label>Notiz<input name="note" maxlength="300"></label>',
  events:'<label>Event<select name="event_type"><option value="marshall_guard">Marshall Guard / Allianzübung</option><option value="zombie_siege">Zombie Siege</option><option value="desert_storm">Desert Storm</option></select></label><label>Datum<input name="event_date" type="date" required></label><label>Schwierigkeit / Level<input name="level" type="number" min="1" max="999" placeholder="Nur bestätigen, wenn bekannt"></label><label data-event-waves>Erreichte Wellen<input name="waves" type="number" min="0" max="999" placeholder="Tatsächlich erreichte Welle"></label><label>Verantwortlich<select name="lead_id">'+select('lead_id')+'</select></label><label>Ersatz<select name="substitute_id">'+select('substitute_id')+'</select></label><label>Teilnehmer (Anzahl)<input name="attendance" type="number" min="0" max="100" placeholder="Falls belegt"></label><label>Ergebnis<select name="outcome"><option value="scheduled">Geplant</option><option value="completed">Abgeschlossen</option><option value="failed">Nicht geschafft</option><option value="cancelled">Abgesagt</option></select></label><label>Notizen<input name="notes" maxlength="500" placeholder="Optional: Kampfbericht / Schwierigkeiten"></label><p class="native-form-help" data-event-guidance></p>'
 };
 const host=target.querySelector('#native-form');host.innerHTML='<form class="native-form" id="native-record-save" data-kind="'+kind+'" data-id="'+e(record.id||'')+'">'+fields[kind]+'<button type="submit">Speichern</button>'+
  (record.id?'<button type="button" class="native-danger-action" data-native-record-delete="'+e(record.id)+'" data-kind="'+kind+'">Eintrag löschen</button>':'')+
  '<button type="button" data-native-form-reload hidden>Aktuellen Stand laden</button><p id="native-form-message" role="status"></p></form>';
 const form=host.firstElementChild;
 for(const [key,value] of Object.entries(record)){if(form.elements.namedItem(key))form.elements.namedItem(key).value=value??''}
 if(kind==='events'&&!record.event_date)form.elements.namedItem('event_date').value=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());
 if(kind==='events')updateEventForm(form);
 form.scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function saveForm(mount,form){
 const kind=form.dataset.kind;const body={};for(const [k,v] of new FormData(form))body[k]=v===''?(kind==='train'&&['note','driver_name'].includes(k)?'':null):['level','waves','attendance'].includes(k)?Number(v):v;
 if(form.dataset.id)body.id=form.dataset.id;
 const action=kind==='train'?'train-assignments':'operations/'+kind;
 if(kind==='train'){
  const item=cache.trains.history.find(x=>x.date===body.date);
  body.expected_revision=item?.revision||0;
 }
 const submit=form.querySelector('[type=submit]');submit.disabled=true;
 try{
  await request('/api/'+action,{method:'POST',body});
  // Keep the officer on the same person's record after saving their absence.
  const profileId=kind==='absences'?form.dataset.profileId:null;
  if(profileId){
   cache.ops=await request('/api/operations');
   await view(mount);
   await showPerson(mount.querySelector('#native-admin-content'),profileId);
  }else await view(mount);
 }catch(err){
  const conflict=err.status===409;
  form.querySelector('#native-form-message').textContent=conflict?
   'Dieser Eintrag wurde inzwischen geändert. Deine Eingaben bleiben erhalten. Bitte vor erneutem Speichern neu laden.':
   'Nicht gespeichert: '+err.message;
  if(conflict){form.dataset.conflict='1';form.querySelector('[data-native-form-reload]').hidden=false}
  else submit.disabled=false;
 }
}
// Read-only comparison: a person missing from a list is NOT a departure.
export function membershipWatchSummary(data){
 const list=Array.isArray(data?.candidates)?data.candidates:[];
 return {count:list.length,both:list.filter(x=>x.priority==='cross_source').length,
  profile:list.filter(x=>x.missing_profile).length,vs:list.filter(x=>x.missing_vs).length};
}
function renderMembershipWatch(target){
 const data=cache.watch||{},host=target.querySelector('#native-watch-list');if(!host)return;
 const count=membershipWatchSummary(data),list=data.candidates||[];
 const policy=cache.archiveEligibility;
 const autoArchiveHint=policy?'<p class="native-evidence-note"><strong>Automatisches Archiv nach zwei Wochen:</strong> '+
  (policy.ready?'W39/W40/W41-Regel aktiv: '+(policy.candidates?.length||0)+' bestätigte Kandidaten; Wochensnapshots final und Profilaufnahme vollständig.':
    'Sicherheitsprüfung wartet: '+e(policy.reason||'Weitere finalisierte Vergleiche notwendig')+'.')+
  ' Der nächtliche Staging-Abgleich archiviert nur nach zwei aufeinanderfolgenden fehlenden VS-Wochen und zusätzlichem Fehlen im vollständigen neuesten Mitglieder-Screenshot. R4/R5 werden niemals automatisch archiviert.</p>':'';
 const snapshotInfo=(data.profile?.current?.captured_at?'Stärke '+data.profile.current.captured_at.slice(0,10):'Stärke ohne Vergleich')+
  ' · '+(data.vs?.current?.week?'VS '+data.vs.current.week:'VS ohne Vergleich');
 host.innerHTML='<p class="native-muted">'+e(snapshotInfo)+' · Quellen sind unterschiedlich vollständig</p>'+autoArchiveHint+
  cards([['Prüfkandidaten',count.count],['In beiden Listen fehlend',count.both],
   ['Im Stärke-Snapshot fehlend',count.profile],['In VS-Liste fehlend',count.vs]])+
  '<p class="native-evidence-note"><strong>Kein automatischer Austritt:</strong> Fehlt ein Spieler auf einem Screenshot, bleibt er aktiv. Bei fehlenden Daten ist keine Blacklist zulässig. Status und Blacklist werden ausschließlich manuell in der Spielerakte geändert.</p>'+
  (data.state==='insufficient_history'?
   '<p class="native-muted">Für einen verlässlichen Vergleich benötigen wir mindestens zwei vollständige Profil-Aufnahmen oder zwei abgeschlossene VS-Wochen.</p>':
   list.length?'<div class="native-list native-watch-candidates">'+list.map(m=>
    '<article class="native-watch-item"><div><span class="native-status">'+e(m.priority==='cross_source'?'Zwei Quellen':'Prüfen')+'</span>'+
    '<h3>'+e(m.name)+' <small>'+e(m.rank)+'</small></h3>'+
    '<p>'+e(m.missing_profile?'Neue Stärke-Aufnahme: nicht enthalten':'Stärke-Aufnahme: keine neue Abweichung')+'</p>'+
    '<p>'+e(m.missing_vs?'Neue VS-Aufnahme: nicht enthalten':'VS-Aufnahme: keine neue Abweichung')+'</p>'+
    '<small>Zuletzt gesehen: '+e(m.last_seen||'Unbekannt')+(m.blacklisted?' · Bereits manuell gesperrt':'')+'</small></div>'+
    '<button type="button" data-native-watch-person="'+e(m.id)+'">Spielerakte prüfen</button></article>'
   ).join('')+'</div>':
   '<p class="native-muted">In den aktuell vergleichbaren Aufnahmen sind keine fehlenden Spieler aufgefallen. Das ist kein vollständiger Anwesenheitsnachweis.</p>');
}
const diplomacyLabels={
 stance:{ally:'Verbündet',nap:'Nichtangriff',neutral:'Neutral',hostile:'Konflikt',unknown:'Ungeklärt'},
 war_support:{assist:'Wir helfen',none:'Keine Kriegshilfe',oppose:'Gegenseite',unknown:'Ungeklärt'},
 attack_policy:{no_attack:'Nicht angreifen',defend_only:'Nur verteidigen',open:'Keine Absprache',unknown:'Ungeklärt'},
 verification:{confirmed:'Bestätigt',unconfirmed:'Unbestätigt',outdated:'Veraltet'}
};
const choices=(values,selected)=>Object.entries(values).map(([key,label])=>
 '<option value="'+e(key)+'" '+(key===selected?'selected':'')+'>'+e(label)+'</option>').join('');
function renderDiplomacy(target,term=''){
 const host=target.querySelector('#native-diplomacy-list');if(!host)return;
 const all=cache.diplomacy?.relations||[];
 const list=all.filter(x=>(x.tag+' '+x.name+' '+x.server).toLowerCase().includes(term.toLowerCase()));
 host.innerHTML='<p class="native-muted">'+list.length+' von '+all.length+' Allianzen. Alle Vereinbarungen beruhen auf manuellen Offiziersnotizen.</p>'+
  (list.length?'<div class="native-diplomacy-cards">'+list.map(x=>
    '<button type="button" class="native-diplomacy-card" data-native-diplomacy-edit="'+e(x.id)+'">'+
    '<span class="native-diplomacy-tag">'+e(x.tag)+'</span><span class="native-diplomacy-details"><strong>'+e(x.name)+'</strong>'+
    '<small>Server '+e(x.server)+' · '+e(diplomacyLabels.stance[x.stance]||'Ungeklärt')+
     (x.active?'':' · Historisch')+'</small>'+
    '<span>'+e(diplomacyLabels.war_support[x.war_support]||'Ungeklärt')+
     ' · '+e(diplomacyLabels.attack_policy[x.attack_policy]||'Ungeklärt')+'</span>'+
    '<small>'+e(diplomacyLabels.verification[x.verification]||'Unbestätigt')+
     ' · zuletzt '+e(formatOfficerTime(x.updated_at))+'</small></span>'+
    '<span class="native-diplomacy-chevron" aria-hidden="true">›</span></button>'
   ).join('')+'</div>':
   '<p class="native-muted">Noch keine Allianz eingetragen oder keine Suchtreffer.</p>');
}
function editDiplomacy(target,id=''){
 const record=(cache.diplomacy?.relations||[]).find(x=>x.id===id)||{};
 const host=target.querySelector('#native-diplomacy-form');if(!host)return;
 host.innerHTML='<form id="native-diplomacy-save" class="native-form native-diplomacy-form" data-id="'+e(record.id||'')+
  '" data-revision="'+e(record.revision||'')+'">'+
  '<div class="native-form-heading"><h3>'+(id?'Allianzvereinbarung bearbeiten':'Allianz notieren')+'</h3>'+
  '<button type="button" data-native-diplomacy-cancel aria-label="Editor schließen">Schließen</button></div>'+
  '<p class="native-form-help">Internes Offiziersbuch. Eine Notiz begründet keine automatische Ingame-Unterstützung oder Angriffssperre.</p>'+
  '<label>Server<input type="number" name="server" inputmode="numeric" min="1" max="99999" required value="'+e(record.server??2261)+'" '+(id?'readonly':'')+'></label>'+
  '<label>Allianz-Tag<input name="tag" maxlength="12" minlength="2" pattern="[A-Za-z0-9]{2,12}" autocapitalize="characters" required value="'+e(record.tag||'')+'" '+(id?'readonly':'')+'></label>'+
  '<label>Allianzname<input name="name" maxlength="120" minlength="2" required value="'+e(record.name||'')+'"></label>'+
  '<label>Verhältnis<select name="stance">'+choices(diplomacyLabels.stance,record.stance||'unknown')+'</select></label>'+
  '<label>Unterstützung im Krieg<select name="war_support">'+choices(diplomacyLabels.war_support,record.war_support||'unknown')+'</select></label>'+
  '<label>Angriffsregel<select name="attack_policy">'+choices(diplomacyLabels.attack_policy,record.attack_policy||'unknown')+'</select></label>'+
  '<label>Informationsstand<select name="verification">'+choices(diplomacyLabels.verification,record.verification||'unconfirmed')+'</select></label>'+
  '<label class="native-check"><input type="checkbox" name="active" '+(record.active===0?'':'checked')+'>Aktuelle Beziehung (sonst historisch)</label>'+
  '<label class="native-diplomacy-wide">Interne Notiz<textarea name="notes" maxlength="1200" rows="3" placeholder="Wer hat was zugesagt? Was gilt bei Krieg / Schild / Stadtbesetzung?">'+e(record.notes||'')+'</textarea></label>'+
  '<label class="native-diplomacy-wide">Warum ändern wir die Vereinbarung?<textarea name="reason" rows="2" required minlength="8" maxlength="500" placeholder="Pflichtangabe für das Änderungsprotokoll"></textarea></label>'+
  '<button type="submit" class="native-game-primary">Vereinbarung protokolliert speichern</button>'+
  '<button type="button" data-native-diplomacy-reload hidden>Aktuellen Stand laden</button>'+
  '<p id="native-diplomacy-message" role="status"></p></form>';
 host.scrollIntoView({behavior:'smooth',block:'nearest'});
 const focus=host.querySelector(id?'[name=stance]':'[name=tag]');focus?.focus({preventScroll:true});
}

function renderRegistry(target,query){
 const list=cache.registry.members.filter(x=>(registryFilter==='blacklist'?Boolean(x.blacklisted):
  registryFilter==='all'||x.lifecycle===registryFilter)&&
  (x.name+' '+x.rank+' '+x.lifecycle+' '+(x.blacklisted?'blacklist':'')).toLowerCase().includes(query.toLowerCase()));
 target.querySelector('#registry-list').innerHTML='<p class="native-muted">'+list.length+' Ergebnisse. Archiv und Blacklist werden nur manuell geändert.</p><div class="native-list">'+list.slice(0,pageLimit).map(x=>'<button data-registry-edit="'+e(x.id)+'"><strong>'+e(x.name)+' · '+e(x.rank)+'</strong><small>'+e(x.lifecycle)+(x.blacklisted?' · BLACKLIST':'')+' · zuletzt '+e(x.last_seen||'?')+'</small></button>').join('')+'</div>'+(list.length>pageLimit?'<button data-native-more="registry">Weitere Spieler</button>':'');
}
function createMemberForm(target){
 const host=target.querySelector('#registry-form');if(!host)return;
 const ranks=canManageSite()?['R1','R2','R3','R4','R5']:['R1','R2','R3'];
 host.innerHTML='<form id="native-member-create-save" class="native-form"><h3>Mitglied manuell anlegen</h3>'+
  '<p class="native-muted">Nur die bestätigte Identität wird angelegt. Keine Power-, Kills-, Spenden- oder VS-Werte werden erfunden.</p>'+
  '<label>Ingame-Spielername<input name="name" maxlength="80" minlength="2" required autocomplete="off"></label>'+
  '<label>Rang<select name="rank">'+ranks.map(r=>'<option>'+r+'</option>').join('')+'</select></label>'+
  '<label>Warum manuell anlegen?<input name="reason" required minlength="8" maxlength="500" placeholder="Begründung für das Admin-Protokoll"></label>'+
  '<button type="submit" class="native-game-primary">Mitglied protokolliert anlegen</button><p role="status" id="native-member-create-message"></p></form>';
 host.querySelector('[name=name]').focus();
}
function accessForm(target,mode,accountId=''){
 const host=target.querySelector('#native-access-form');if(!host)return;
 if(['link','disable'].includes(mode)){
  if(!canManageSite())return;
  const account=(cache.access?.accounts||[]).find(a=>a.id===accountId&&a.enabled);
  if(!account)return;
  const linkedIds=new Set((cache.access?.accounts||[]).map(a=>a.member_id).filter(Boolean));
  const eligible=(cache.registry?.members||[]).filter(m=>m.lifecycle==='active'&&!m.blacklisted&&m.rank===account.role&&!linkedIds.has(m.id));
  host.innerHTML='<form id="native-access-save" class="native-form" data-mode="'+e(mode)+'" data-officer-id="'+e(account.id)+'"><h3>'+e(account.ingame_name)+' · '+e(account.role)+'</h3>'+
   '<p class="native-muted">'+(mode==='link'?'R5 bestätigt persönlich, welcher aktive Spieler wirklich hinter diesem bestehenden Offizierskonto steht. Keine automatische Zuordnung nach Namen.':
   'Zugang deaktivieren und alle laufenden Sitzungen beenden. Das Spielerprofil und seine historischen Werte bleiben erhalten.')+'</p>'+
   (mode==='link'?'<label>Bestätigtes Mitglied auswählen<select name="member_id" required><option value="">Bitte wählen</option>'+eligible.map(m=>'<option value="'+e(m.id)+'">'+e(m.name)+' · '+e(m.rank)+'</option>').join('')+'</select></label>':'')+
   '<label>Begründung für Audit-Protokoll<input name="reason" required minlength="8" maxlength="500" placeholder="Identität bestätigt / Zugang nicht mehr berechtigt"></label>'+
   '<button type="submit" class="native-game-primary">'+(mode==='link'?'Zuordnung verbindlich speichern':'Zugang sicher deaktivieren')+'</button>'+
   '<p id="native-access-message" role="status"></p></form>';
  host.querySelector('[name=reason]')?.focus();return;
 }
 const reason='<label>Grund (Audit-Log)<input name="reason" required minlength="8" maxlength="500" placeholder="Warum wird der Zugang verändert?"></label>';
 const accountChoices=(cache.access?.accounts||[]).filter(a=>a.enabled&&!a.is_site_owner&&a.ingame_name!==officer?.name);
 const eligible=(cache.registry?.members||[]).filter(m=>m.lifecycle==='active'&&!m.blacklisted&&['R4','R5'].includes(m.rank)&&
  !(cache.access?.accounts||[]).some(a=>a.member_id===m.id||a.ingame_name.toLocaleLowerCase()===m.name.toLocaleLowerCase()));
 const self=mode==='self',issue=mode==='issue';
 host.innerHTML='<form id="native-access-save" class="native-form" data-mode="'+e(mode)+'"><h3>'+
  (self?'Eigenen Code ändern':issue?'Neuen Admin-Zugang erstellen':'Vergessenen Code zurücksetzen')+'</h3>'+
  '<p class="native-muted">'+(self?'Der aktuelle Code muss bestätigt werden.':'Nur R5 darf Codes anderer Offiziere verwalten.')+
  ' Der neue zufällige Zugangscode erscheint genau einmal; alle bisherigen Sitzungen des betroffenen Offiziers werden beendet.</p>'+
  (self?'<label>Aktueller Zugangscode<input type="password" name="current_code" required autocomplete="off"></label>':
  '<label>'+(issue?'R4/R5-Mitglied':'Offizier')+' auswählen<select name="'+(issue?'member_id':'officer_id')+'" required><option value="">Bitte auswählen</option>'+
  (issue?eligible.map(m=>'<option value="'+e(m.id)+'">'+e(m.name)+' · '+e(m.rank)+'</option>'):
   accountChoices.map(a=>'<option value="'+e(a.id)+'">'+e(a.ingame_name)+' · '+e(a.role)+'</option>')).join('')+'</select></label>')+
  reason+'<button type="submit" class="native-game-primary">'+(self?'Neuen persönlichen Code erzeugen':issue?'Zugang erstellen':'Code zurücksetzen')+
  '</button><p role="status" id="native-access-message"></p></form>';
}
function editRegistry(target,id){
 const m=cache.registry.members.find(x=>x.id===id);if(!m)return;
 const host=target.querySelector('#registry-form');
 if(!canManageSite()&&['R4','R5'].includes(m.rank)){
  host.innerHTML='<p class="native-evidence-note">Offiziersrang, Archiv und Blacklist dieses Mitglieds dürfen nur durch R5 geändert werden.</p>';
  return;
 }
 const ranks=canManageSite()?['R1','R2','R3','R4','R5']:['R1','R2','R3'];
 host.innerHTML='<form id="registry-save" class="native-form" data-id="'+e(id)+'" data-revision="'+e(m.revision)+'"><h3>'+e(m.name)+' verwalten</h3>'+
  '<label>Verwalteter Rang<select name="rank" required>'+(!m.rank?'<option value="" selected disabled>Rang verifizieren</option>':'')+ranks.map(x=>'<option '+(m.rank===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
  '<label>Status<select name="lifecycle" required>'+(m.lifecycle==='unverified'?'<option value="" selected disabled>Identität / Status verifizieren</option>':'')+'<option value="active" '+(m.lifecycle==='active'?'selected':'')+'>Aktiv</option><option value="former" '+(m.lifecycle==='former'?'selected':'')+'>Ehemalig / Archiv</option></select></label>'+
  '<div class="native-row"><button type="button" data-native-registry-quick="archive">Ins Archiv vormerken</button><button type="button" data-native-registry-quick="blacklist">Blacklist vormerken</button><button type="button" data-native-registry-quick="active">Aktiv vormerken</button></div>'+
  '<label class="native-check"><input type="checkbox" name="blacklisted" '+(m.blacklisted?'checked':'')+'>Manuelle Blacklist</label>'+
  '<label>Begründung<input name="reason" required minlength="8" maxlength="500" value="'+e(m.reason)+'" placeholder="Für jede Änderung erforderlich (mindestens 8 Zeichen)"></label>'+
  '<button type="submit">Änderung protokolliert speichern</button><button type="button" data-registry-reload hidden>Aktuellen Stand laden (Eingaben verwerfen)</button><p id="native-form-message" role="status"></p></form>';
 host.scrollIntoView({behavior:'smooth',block:'nearest'});
}
export function formatOfficerTime(raw){
 const value=String(raw||'').trim().replace(' ','T');
 if(!value)return 'Zeit unbekannt';
 const utc=/(Z|[+-]\d{2}:?\d{2})$/i.test(value)?value:value+'Z';
 const date=new Date(utc);
 if(!Number.isFinite(date.getTime()))return 'Zeit unbekannt';
 return new Intl.DateTimeFormat(officerLocale(),{timeZone:'Europe/Berlin',dateStyle:'medium',timeStyle:'short'}).format(date);
}
const auditLabels={
 rank_override:'Rang',rank:'Rang',lifecycle:'Status',blacklisted:'Blacklist',
 title:'Titel',description:'Beschreibung',status:'Status',priority:'Priorität',due_date:'Frist',
 assignee_id:'Zuständig',substitute_id:'Vertretung',member_id:'Spieler-ID',
 date:'Datum',ride_date:'Zugdatum',driver_name:'Zugfahrer',note:'Notiz',
 event_type:'Event',event_date:'Eventdatum',level:'Level',waves:'Wellen',
 lead_id:'Leitung',attendance:'Teilnehmer',outcome:'Ergebnis',reason:'Begründung',
 revision:'Revision',updated_by:'Bearbeitet von',
 vs_daily_minimum:'VS-Punkte pro Tag',donation_weekly_minimum:'Spenden pro Woche',
 min_active_vs_days:'Aktive VS-Tage',low_vs_day_warning_count:'Warnung nach Tagen',
 shield_reminder_saturday:'Samstag Schild-Erinnerung'
};
const safeAuditObject=value=>{
 try{const item=typeof value==='string'?JSON.parse(value):value;return item&&typeof item==='object'&&!Array.isArray(item)?item:null}
 catch{return null}
};
const auditValue=value=>value===null||value===undefined||value===''?'—':
 typeof value==='boolean'?(value?'Ja':'Nein'):typeof value==='object'?'(Details)':String(value);
export function auditChanges(entry){
 const before=safeAuditObject(entry?.before_json),after=safeAuditObject(entry?.after_json);
 if(!after)return [];
 return Object.keys(auditLabels).filter(key=>Object.hasOwn(after,key)&&
  (!before||JSON.stringify(before[key])!==JSON.stringify(after[key]))).map(key=>({
  field:auditLabels[key],before:auditValue(before?.[key]),after:auditValue(after[key])
 }));
}
const activityTypes=[
 ['all','Alle','standard'],['members','Mitglieder','alliance'],['tasks','Aufgaben','tasks'],['policy','Allianzregeln','tasks'],
 ['train','Zug','season'],['ocr','OCR & Daten','vs'],['access','Zugänge','hero'],
 ['archive','Archiv','economy'],['events','Events','today'],['diplomacy','Diplomatie','alliance'],
 ['other','Weitere','standard']
];
export function auditCategory(entry){
 const kind=String(entry?.object_kind||'').toLowerCase(),action=String(entry?.action||'').toLowerCase();
 if(/officer|site_owner|credential|code|session/.test(kind+' '+action))return 'access';
 if(/alliance_requirements/.test(kind))return 'policy';
 if(/lifecycle|blacklist|archiv|auto_archive|former/.test(action)||kind==='auto_archive')return 'archive';
 if(kind==='member_registry'&&auditChanges(entry).some(d=>d.field==='Status'||d.field==='Blacklist'))return 'archive';
 if(/ocr|profile_capture|review|correction|identity_resolution|vs_day/.test(kind))return 'ocr';
 if(/train|dice|rotation/.test(kind+' '+action))return 'train';
 if(/task/.test(kind))return 'tasks';
 if(/absenc|event|siege|marshall|storm/.test(kind))return 'events';
 if(/diplom/.test(kind))return 'diplomacy';
 if(/member|alias|roster/.test(kind))return 'members';
 return 'other';
}
const auditCategoryName=key=>activityTypes.find(([id])=>id===key)?.[1]||'Weitere';
function activityDate(raw){
 const source=String(raw||'').trim().replace(' ','T');
 const iso=/(Z|[+-]\d{2}:?\d{2})$/i.test(source)?source:source+'Z';
 const date=new Date(iso);
 return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',year:'numeric'}).format(date):'Datum unbekannt';
}
function auditEntryCard(x){
 const changes=auditChanges(x),type=auditCategory(x);
 return '<details class="native-audit-entry native-audit-'+e(type)+'"><summary>'+
  '<span class="native-audit-entry-icon">'+icon(activityTypes.find(([id])=>id===type)?.[2]||'standard','native-audit-svg')+'</span>'+
  '<span class="native-audit-entry-summary"><strong>'+e(x.actor||'Unbekannter Officer')+'</strong>'+
  '<span class="native-audit-action">'+e(x.action||'Änderung')+'</span>'+
  '<small>'+e(x.object_kind||'Objekt')+' · '+e(x.object_id||'—')+'</small></span>'+
  '<time>'+e(formatOfficerTime(x.at))+'</time><span class="native-audit-chevron" aria-hidden="true">⌄</span></summary>'+
  '<div class="native-audit-body">'+
  (changes.length?'<div class="native-audit-diff">'+changes.map(d=>'<div><b>'+e(d.field)+'</b><span>'+e(d.before)+' → '+e(d.after)+'</span></div>').join('')+'</div>':
   '<p class="native-muted">Für diese Änderung sind keine vergleichbaren Felder verfügbar.</p>')+
  '<small class="native-audit-object">Objekt-ID: '+e(x.object_id||'—')+'</small></div></details>';
}
function renderActivity(target,term=''){
 if(!target?.querySelector('#activity-list'))return;
 const all=Array.isArray(cache.activity)?cache.activity:[],query=String(term||'').trim().toLocaleLowerCase('de-DE');
 const counts=Object.fromEntries(activityTypes.map(([key])=>[key,key==='all'?all.length:all.filter(x=>auditCategory(x)===key).length]));
 const active=(activityTypes.some(([key])=>key===activityCategory)?activityCategory:'all');
 const eligible=all.filter(x=>(active==='all'||auditCategory(x)===active)&&
  (!query||[x.actor,x.action,x.object_kind,x.object_id,...auditChanges(x).flatMap(c=>[c.field,c.before,c.after])]
   .some(y=>String(y||'').toLocaleLowerCase('de-DE').includes(query))));
 const host=target.querySelector('#activity-filters');
 if(host){
  // Reuse the input while typing so iOS keyboard, caret and search focus survive.
  const previousInput=host.querySelector('#activity-search'),focused=previousInput===target.ownerDocument?.activeElement;
  const selection=focused?previousInput.selectionStart:null;
  host.innerHTML='<div class="native-audit-types" role="group" aria-label="Protokoll nach Art filtern">'+
   activityTypes.filter(([key])=>key==='all'||counts[key]>0).map(([key,label,art])=>
    '<button type="button" data-audit-category="'+e(key)+'" aria-pressed="'+(active===key)+'">'+
    icon(art,'native-audit-svg')+'<span>'+e(label)+'</span><small>'+counts[key]+'</small></button>').join('')+'</div>'+
   '<div class="native-audit-tools"><label>Gruppieren nach <select id="activity-group-by">'+
    [['type','Art'],['date','Datum'],['actor','Officer']].map(([key,label])=>
     '<option value="'+key+'" '+(activityGroupBy===key?'selected':'')+'>'+label+'</option>').join('')+
    '</select></label><label class="native-audit-search">Durchsuchen<input id="activity-search" type="search" autocomplete="off" value="'+e(term)+'" placeholder="Officer, Aktion oder Spieler"></label></div>';
  if(focused){const input=host.querySelector('#activity-search');input.focus();if(selection!==null)input.setSelectionRange(selection,selection)}
 }
 const groups=new Map();
 for(const entry of eligible){
  const group=activityGroupBy==='date'?activityDate(entry.at):activityGroupBy==='actor'?
   String(entry.actor||'Unbekannter Officer'):auditCategory(entry);
  if(!groups.has(group))groups.set(group,[]);
  groups.get(group).push(entry);
 }
 const preview=activityGroupBy==='type'&&active==='all'&&!query;
 let shown=0;
 const sections=[...groups].map(([key,items],i)=>{
  const slice=items.slice(0,preview?5:Math.max(0,activityLimit-shown));shown+=slice.length;
  if(!slice.length)return '';
  const type=activityGroupBy==='type'?key:'other';
  const heading=activityGroupBy==='type'?auditCategoryName(key):key;
  return '<details class="native-audit-group native-audit-group-'+e(type)+'" '+(i<3?'open':'')+'>'+
   '<summary>'+icon(activityTypes.find(([id])=>id===type)?.[2]||'standard','native-audit-svg')+
   '<strong>'+e(heading)+'</strong><small>'+items.length+' Einträge</small><span class="native-audit-chevron" aria-hidden="true">⌄</span></summary>'+
   '<div class="native-audit-items">'+slice.map(auditEntryCard).join('')+
   (preview&&items.length>slice.length?'<button type="button" class="native-audit-open-type" data-audit-category="'+e(key)+'">Alle '+items.length+' Einträge dieser Art ansehen ›</button>':'')+
   '</div></details>';
 }).join('');
 target.querySelector('#activity-list').innerHTML='<p class="native-audit-count" role="status">'+
  eligible.length+' passende Einträge'+(all.length>=500?' · Neueste 500 geladen':'')+
  ' · Uhrzeiten Berlin · keine Zugangscodes</p>'+
  (sections||'<p class="native-evidence-note">Keine passenden Änderungen gefunden. Anderen Filter oder Suchbegriff wählen.</p>')+
  (!preview&&eligible.length>shown?'<button type="button" class="native-audit-load" data-native-more="activity">Weitere 30 Einträge laden</button>':'');
}
// Evidence never receives a public URL. A protected Blob URL exists only for the
// current officer's in-memory session and is revoked on navigation/logout.
const reviewBlobUrls=new Map();
const selectedProfileCaptures=new Map();
function clearReviewImages(){
 for(const url of reviewBlobUrls.values())try{URL.revokeObjectURL(url)}catch{}
 reviewBlobUrls.clear();
 selectedProfileCaptures.clear();
}
export function reviewMatchesMember(member,term){
 const query=String(term||'').trim().toLocaleLowerCase('de-DE');
 return !query||(String(member.name||'')+' '+String(member.rank||'')).toLocaleLowerCase('de-DE').includes(query);
}
export function reviewNumericValue(raw){
 const text=String(raw??'').trim().replace(/[\s.,]/g,'');
 if(!/^\d{1,15}$/.test(text))return null;
 const value=Number(text);
 return Number.isSafeInteger(value)&&value<=1e14?value:null;
}
function reviewMemberOptions(card,term){
 const root=card.querySelector('.native-review-people');
 if(!root)return;
 const members=(cache.reviewMembers||[]).filter(m=>reviewMatchesMember(m,term)).slice(0,12);
 root.innerHTML=members.length?members.map(m=>
  '<button type="button" data-native-review-pick="'+e(m.id)+'" aria-label="'+e(m.name)+' auswählen">'+
  '<strong>'+e(m.name)+'</strong><span>'+e(m.rank||'Rang unbekannt')+'</span></button>').join(''):
  '<p class="native-muted">Keine passenden Spieler. Versuche einen anderen Namen.</p>';
}
async function loadReviewImage(card){
 const id=card.dataset.reviewId,preview=card.querySelector('.native-review-image');
 if(!id||!preview||!card.isConnected)return;
 const found=(cache.reviews||[]).find(x=>x.id===id);
 if(!found?.evidence_sha){preview.textContent='Noch kein privat zugeordneter Beleg. Bitte Screenshot auswählen.';return}
 if(reviewBlobUrls.has(id)){preview.querySelector('img').src=reviewBlobUrls.get(id);return}
 preview.textContent='Geschütztes Belegbild wird geladen …';
 try{
  const response=await fetch(apiBase+'/api/reviews/'+encodeURIComponent(id)+'/evidence',{
   headers:{Authorization:'Bearer '+sessionToken},mode:'cors',credentials:'omit',cache:'no-store'});
  if(!response.ok)throw Error('Bild nicht verfügbar ('+response.status+')');
  const blob=await response.blob();
  if(!card.isConnected)return;
  const imageURL=URL.createObjectURL(blob);
  reviewBlobUrls.set(id,imageURL);
  preview.innerHTML='<img alt="Privater Screenshot für diesen Prüfauftrag" loading="lazy" draggable="false">';
  preview.querySelector('img').src=imageURL;
 }catch(err){
  if(card.isConnected)preview.textContent='Beleg konnte nicht geladen werden: '+err.message;
 }
}
async function normalizeReviewImage(file){
 if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('PNG, JPG oder WebP auswählen');
 if(file.size<=950000)return file;
 if(typeof createImageBitmap!=='function')throw Error('Bild ist zu groß. Bitte zuerst einen Ausschnitt erstellen.');
 const bitmap=await createImageBitmap(file);
 try{
  const scale=Math.min(1,1600/bitmap.width,2000/bitmap.height);
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
  for(const quality of [.82,.67,.50,.35]){
   const result=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
   if(result&&result.size<=950000)return result;
  }
  throw Error('Screenshot ist auch nach Verkleinerung zu groß. Bitte einen kleineren Ausschnitt wählen.');
 }finally{bitmap.close()}
}
function renderReviews(target,term=''){
 clearReviewImages();
 const writesEnabled=cache.reviewWritesEnabled===true;
 const batch=target.querySelector('#review-batch-native')?.value||'';
 const kind=target.querySelector('#review-kind-native')?.value||'';
 const imageStatus=target.querySelector('#review-image-native')?.value||'all';
 const list=(cache.reviews||[]).filter(x=>(!batch||x.source_batch===batch)&&(!kind||x.kind===kind)&&
  (imageStatus==='all'||(imageStatus==='with')===Boolean(x.evidence_sha))&&
  [x.source_name,x.category,x.metric,x.note,x.source_batch].some(y=>String(y||'').toLowerCase().includes(String(term).toLowerCase())))
  .sort((a,b)=>Number(Boolean(b.evidence_sha))-Number(Boolean(a.evidence_sha)));
 const names={vs_uncertain:'VS-Tageswert',inferred:'Wert nicht sicher',unmatched_name:'Spieler zuordnen',
  historical_identity:'Namenszuordnung',missing:'Fehlender Wert',ocr_alert:'Bild erkennen'};
 const card=x=>{
  const identity=x.kind==='identity',numeric=x.kind==='profile'||x.kind==='vs_day';
  const linked=Boolean(x.evidence_sha);
  return '<details class="native-review-card" data-review-id="'+e(x.id)+'" data-review-kind="'+e(x.kind||'')+'">'+
   '<summary><span class="native-review-summary"><strong>'+e(x.source_name||'Unbekannt')+'</strong>'+
    '<small>'+e(names[x.category]||x.category)+' · '+e(x.metric||'')+
    (x.context?.date?' · '+e(x.context.date):'')+'</small></span>'+
    '<span class="native-review-evidence-status">'+(linked?'Bild hinterlegt':'Bild fehlt')+'</span></summary>'+
   '<div class="native-review-body"><p class="native-muted">'+e(x.note||'')+'</p>'+
    (x.context?.warning?'<p class="native-evidence-note">'+e(x.context.warning)+'</p>':'')+
    '<div class="native-review-columns"><div class="native-review-picture">'+
     '<div class="native-review-image" role="img" aria-label="Geschütztes Belegbild">Bild öffnen, um Beleg zu laden.</div>'+
     (linked?'<small>Privat hinterlegt · überprüfe die Anzeige vor dem Speichern.</small>'+
      '<details class="native-evidence-replace"><summary>Falschen oder abgeschnittenen Screenshot ersetzen</summary>'+
      '<label>Neuen Original-Screenshot auswählen<input type="file" data-native-review-replace-file accept="image/png,image/jpeg,image/webp"></label>'+
      '<button type="button" data-native-review-replace '+(writesEnabled?'':'disabled')+'>Bild nach Prüfung ersetzen</button></details>':
      '<label>Screenshot diesem Auftrag zuordnen<input type="file" data-native-review-file accept="image/png,image/jpeg,image/webp"></label>'+
      '<button type="button" data-native-review-upload '+(writesEnabled?'':'disabled')+'>Beleg sicher hochladen</button>')+
     (x.kind==='profile'&&(cache.profileCaptures?.[x.metric]||[]).length?
      '<div class="native-private-capture-gallery"><p class="native-muted">Originalaufnahmen '+e(x.metric)+': '+cache.profileCaptures[x.metric].length+' private Bilder. Bild manuell prüfen, bevor du es zuordnest.</p>'+
      '<label>Aufnahme wählen<select data-native-capture-choice>'+cache.profileCaptures[x.metric].map(cap=>
        '<option value="'+e(cap.id)+'">'+e(cap.capture_day)+' · Aufnahme '+e(cap.capture_index)+'</option>').join('')+'</select></label>'+
      '<button type="button" data-native-capture-preview>Originalbild ansehen</button>'+
      '<button type="button" data-native-capture-attach disabled>'+(linked?'Geprüftes Bild als neuen Beleg verwenden':'Geprüftes Bild diesem Fall zuordnen')+'</button></div>':'' )+
    '</div><div class="native-review-entry">'+
     '<small>OCR erkannt: '+e(x.source_value??'unbekannt')+'</small>'+
     (identity?'<label>Spieler suchen<input type="search" data-native-review-search autocomplete="off" placeholder="Name eingeben"></label>'+
      '<input type="hidden" data-native-review-member><div class="native-review-people"></div>'+
      '<p class="native-review-selection" role="status">Noch kein Spieler ausgewählt.</p>':
      numeric?'<label>Richtigen Wert eingeben<input inputmode="numeric" type="text" autocomplete="off" data-native-review-value maxlength="18" placeholder="Zahl vom Screenshot ablesen"></label>'+
      (x.kind==='vs_day'?'<button type="button" data-native-mark-zero>Sichtbare 0 im Screenshot übernehmen</button>':''):
      '<p class="native-evidence-note">Dieser Falltyp benötigt eine gesonderte fachliche Prüfung.</p>')+
     '<label>Prüfnotiz<input type="text" data-native-review-reason maxlength="500" placeholder="Was wurde am Bild bestätigt?" value="Screenshot manuell geprüft"></label>'+
     '<div class="native-review-controls">'+
      '<button type="button" class="native-game-primary" data-native-review-resolve="approve" '+(!writesEnabled||!linked||(!identity&&!numeric)||Boolean(x.context?.warning)?'disabled':'')+'>Korrektur speichern</button>'+
      '<button type="button" data-native-review-resolve="dismiss" '+(writesEnabled?'':'disabled')+'>Ohne Korrektur schließen</button></div>'+
     '<p class="native-review-message" role="status" aria-live="polite"></p></div></div></div></details>';
 };
 const host=target.querySelector('#review-list-native');if(!host)return;
 host.innerHTML='<p class="native-muted">'+list.length+' von '+(cache.reviews||[]).length+
  ' offenen Prüffällen · '+list.filter(x=>x.evidence_sha).length+' bereits mit Beleg</p>'+
  '<div class="native-review-cards">'+list.slice(0,historyLimit).map(card).join('')+'</div>'+
  (list.length>historyLimit?'<button data-native-more="reviews">Weitere Fälle</button>':'');
 host.querySelectorAll('.native-review-card').forEach(card=>{
  card.addEventListener('toggle',()=>{
   if(card.open){
    loadReviewImage(card);
    if(card.dataset.reviewKind==='identity')reviewMemberOptions(card,'');
   }
  });
 });
}
const profileCaptureUrl=(metric,id)=>'/api/profile-captures/'+encodeURIComponent(metric)+'/'+encodeURIComponent(id.slice(metric.length+1))+'/image';
async function previewProfileCapture(card){
 const id=card.dataset.reviewId,record=(cache.reviews||[]).find(r=>r.id===id);
 const selection=card.querySelector('[data-native-capture-choice]')?.value;
 const candidate=(cache.profileCaptures?.[record?.metric]||[]).find(row=>row.id===selection);
 const message=card.querySelector('.native-review-message');
 const button=card.querySelector('[data-native-capture-preview]'),attach=card.querySelector('[data-native-capture-attach]');
 if(!candidate||record.kind!=='profile'){message.textContent='Aufnahme fehlt. Bitte neu auswählen.';return}
 button.disabled=true;attach.disabled=true;
 selectedProfileCaptures.delete(id);
 message.textContent='Geschützte Originalaufnahme wird geladen .';
 try{
  const response=await fetch(apiBase+profileCaptureUrl(record.metric,candidate.id),{
   headers:{Authorization:'Bearer '+sessionToken},mode:'cors',credentials:'omit',cache:'no-store'});
  if(!response.ok)throw Error('Privates Bild nicht abrufbar (HTTP '+response.status+')');
  const blob=await response.blob();
  if(blob.type!=='image/png'||blob.size<50||blob.size>950000)throw Error('Ungültige Bilddaten');
  const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());
  const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
  if(hash!==candidate.sha256)throw Error('Bild-Prüfsumme stimmt nicht überein');
  if(card.querySelector('[data-native-capture-choice]')?.value!==candidate.id)return;
  const old=reviewBlobUrls.get('candidate-'+id);if(old)URL.revokeObjectURL(old);
  const url=URL.createObjectURL(blob);reviewBlobUrls.set('candidate-'+id,url);
  const frame=card.querySelector('.native-review-image');
  frame.innerHTML='<img alt="Geschützter vollständiger Original-Screenshot zur manuellen Prüfung">';
  frame.querySelector('img').src=url;
  selectedProfileCaptures.set(id,{id:candidate.id,sha256:hash,blob});
  attach.disabled=false;
  message.textContent='Bitte Spielerzeile und Wert im vollständigen Originalbild vergleichen. Erst danach zuordnen.';
 }catch(error){message.textContent='Originalbild nicht verfügbar: '+error.message}
 finally{button.disabled=false}
}
async function attachProfileCapture(card){
 const id=card.dataset.reviewId,record=(cache.reviews||[]).find(r=>r.id===id);
 const selection=selectedProfileCaptures.get(id);
 const message=card.querySelector('.native-review-message'),btn=card.querySelector('[data-native-capture-attach]');
 if(cache.reviewWritesEnabled!==true||!selection||!record||record.kind!=='profile')return;
 const replacing=Boolean(record.evidence_sha);
 if(card.querySelector('[data-native-capture-choice]')?.value!==selection.id){
  message.textContent='Andere Aufnahme gewählt. Bitte diese zuerst öffnen und kontrollieren.';return;
 }
 if(!window.confirm('Ist die Spielerzeile mit dem richtigen Wert vollständig sichtbar und gehört dieses Originalbild wirklich zu diesem Prüffall?'))return;
 btn.disabled=true;message.textContent='Bestätigte Originalaufnahme wird privat zugeordnet .';
 try{
  const reason=card.querySelector('[data-native-review-reason]')?.value.trim()||'';
  if(replacing&&reason.length<8)throw Error('Begründung für Bildtausch erforderlich');
  const response=await fetch(apiBase+'/api/reviews/'+encodeURIComponent(id)+'/evidence',{
   method:replacing?'PATCH':'PUT',headers:{Authorization:'Bearer '+sessionToken,'Content-Type':'image/png',
    ...(replacing?{'If-Match':record.evidence_sha,'X-Evidence-Reason':encodeURIComponent(reason)}:{})},
   body:selection.blob,mode:'cors',credentials:'omit',cache:'no-store'});
  const result=await response.json();
  if(!response.ok||result.sha256!==selection.sha256)throw Error(result.error||'Abweichender Hash beim Verknüpfen');
  record.evidence_sha=result.sha256;
  card.querySelector('.native-review-evidence-status').textContent='Bild hinterlegt';
  const panel=card.querySelector('.native-review-picture');
  panel.querySelector('[data-native-review-file]')?.closest('label')?.remove();
  panel.querySelector('[data-native-review-upload]')?.remove();
  panel.querySelector('.native-private-capture-gallery')?.remove();
  card.querySelector('[data-native-review-resolve="approve"]').disabled=Boolean(record.context?.warning);
  selectedProfileCaptures.delete(id);
  const old=reviewBlobUrls.get('candidate-'+id);if(old){URL.revokeObjectURL(old);reviewBlobUrls.delete('candidate-'+id)}
  const previousUrl=reviewBlobUrls.get(id);if(previousUrl){URL.revokeObjectURL(previousUrl);reviewBlobUrls.delete(id)}
  message.textContent=(replacing?'Bisheriges Bild ersetzt und protokolliert.':'Beleg privat zugeordnet.')+' Wert separat prüfen und speichern; keine automatische Freigabe.';
  await loadReviewImage(card);
 }catch(error){message.textContent='Nicht zugeordnet: '+error.message;btn.disabled=false}
}
async function replaceReviewScreenshot(card){
 if(cache.reviewWritesEnabled!==true)return;
 const id=card.dataset.reviewId,record=(cache.reviews||[]).find(x=>x.id===id);
 const file=card.querySelector('[data-native-review-replace-file]')?.files?.[0];
 const reason=card.querySelector('[data-native-review-reason]')?.value.trim()||'';
 const message=card.querySelector('.native-review-message'),button=card.querySelector('[data-native-review-replace]');
 if(!file||!record?.evidence_sha){message.textContent='Bitte Ersatzbild auswählen.';return}
 if(reason.length<8){message.textContent='Bitte den Grund für den Bildtausch eintragen.';return}
 if(!window.confirm('Dieses Bild ersetzt den bisherigen Beleg. Hast du Name, vollständig sichtbare Zeile und Wert geprüft?'))return;
 button.disabled=true;message.textContent='Geprüften Ersatzbeleg sicher hinterlegen .';
 try{
  const payload=await normalizeReviewImage(file);
  const response=await fetch(apiBase+'/api/reviews/'+encodeURIComponent(id)+'/evidence',{
   method:'PATCH',
   headers:{Authorization:'Bearer '+sessionToken,'Content-Type':payload.type,
    'If-Match':record.evidence_sha,'X-Evidence-Reason':encodeURIComponent(reason)},
   body:payload,mode:'cors',credentials:'omit',cache:'no-store'});
  const result=await response.json();
  if(!response.ok||!result.ok)throw Error(result.error||'Ersetzen fehlgeschlagen');
  record.evidence_sha=result.sha256;
  const url=reviewBlobUrls.get(id);if(url){URL.revokeObjectURL(url);reviewBlobUrls.delete(id)}
  const candidate=reviewBlobUrls.get('candidate-'+id);if(candidate){URL.revokeObjectURL(candidate);reviewBlobUrls.delete('candidate-'+id)}
  selectedProfileCaptures.delete(id);
  card.querySelector('.native-review-evidence-status').textContent='Bild ersetzt';
  card.querySelector('[data-native-review-replace-file]').value='';
  message.textContent='Ersatzbild privat gespeichert und im Admin-Log protokolliert. Der Prüffall bleibt offen.';
  await loadReviewImage(card);
 }catch(error){message.textContent='Bild nicht ersetzt: '+error.message}
 finally{button.disabled=false}
}
async function attachReviewScreenshot(card){
 if(cache.reviewWritesEnabled!==true)return;
 const id=card.dataset.reviewId,file=card.querySelector('[data-native-review-file]')?.files?.[0];
 const message=card.querySelector('.native-review-message');
 if(!file){message.textContent='Bitte zuerst den passenden Screenshot auswählen.';return}
 const upload=card.querySelector('[data-native-review-upload]');upload.disabled=true;
 message.textContent='Bild wird privat gesichert …';
 try{
  const payload=await normalizeReviewImage(file);
  const res=await fetch(apiBase+'/api/reviews/'+encodeURIComponent(id)+'/evidence',{
   method:'PUT',headers:{Authorization:'Bearer '+sessionToken,'Content-Type':payload.type},
   body:payload,mode:'cors',credentials:'omit',cache:'no-store'});
  const body=await res.json();
  if(!res.ok)throw Error(body.error||'Upload fehlgeschlagen');
  const record=(cache.reviews||[]).find(x=>x.id===id);
  if(record)record.evidence_sha=body.sha256;
  card.querySelector('.native-review-evidence-status').textContent='Bild hinterlegt';
  const panel=card.querySelector('.native-review-picture');
  panel.querySelector('label')?.remove();upload.remove();
  card.querySelector('[data-native-review-resolve="approve"]').disabled=
   !['profile','vs_day','identity'].includes(record?.kind)||Boolean(record?.context?.warning);
  message.textContent='Bild geschützt hinterlegt. Bitte ansehen, korrigieren und speichern.';
  await loadReviewImage(card);
 }catch(error){message.textContent='Nicht hochgeladen: '+error.message;upload.disabled=false}
}
async function completeReview(card,action){
 if(cache.reviewWritesEnabled!==true)return;
 const item=(cache.reviews||[]).find(x=>x.id===card.dataset.reviewId);
 if(!item)return;
 const message=card.querySelector('.native-review-message'),reason=card.querySelector('[data-native-review-reason]')?.value.trim();
 if(!reason||reason.length<8){message.textContent='Bitte kurz begründen, was geprüft wurde.';return}
 const body={action,reason};
 if(action==='approve'){
  if(!item.evidence_sha){message.textContent='Ohne Bildbeleg keine Freigabe.';return}
  body.evidence_sha=item.evidence_sha;
  if(item.kind==='identity'){
   const chosen=card.querySelector('[data-native-review-member]')?.value;
   if(!chosen){message.textContent='Bitte einen Spieler aus der Suche auswählen.';return}
   body.member_id=chosen;
  }else if(['profile','vs_day'].includes(item.kind)){
   const value=reviewNumericValue(card.querySelector('[data-native-review-value]')?.value);
   if(value===null){message.textContent='Bitte einen gültigen, bestätigten Wert eintragen.';return}
   body.corrected_value=value;
  }else{message.textContent='Dieser Falltyp kann nicht direkt freigegeben werden.';return}
 }
 if(!window.confirm(action==='approve'?'Wert nach Bildprüfung verbindlich speichern?':'Prüfauftrag mit Begründung schließen?'))return;
 card.querySelectorAll('button').forEach(button=>button.disabled=true);
 message.textContent='Wird gespeichert und protokolliert …';
 try{
  await request('/api/reviews/'+encodeURIComponent(item.id)+'/resolve',{method:'POST',body});
  cache.reviews=cache.reviews.filter(x=>x.id!==item.id);
  const target=card.closest('#native-admin-content');
  renderReviews(target,target.querySelector('#review-search-native')?.value||'');
  const status=target.querySelector('#native-review-finished');
  if(status)status.textContent='Prüfauftrag erledigt und aus der offenen Liste entfernt.';
 }catch(error){
  message.textContent='Nicht gespeichert: '+error.message;
  card.querySelectorAll('button').forEach(button=>button.disabled=false);
  if(action==='approve'&&(!item.evidence_sha||item.context?.warning))
   card.querySelector('[data-native-review-resolve="approve"]').disabled=true;
 }
}

export async function renderNativeAdmin(mount){
 if(!sessionToken){
  mount.innerHTML='<section class="native-admin native-login"><div><span class="admin-eyebrow">RZSN / R4–R5</span><h1>Command Center</h1><p>Melde dich mit deinem Offizierscode an. Alle privaten Daten bleiben bei Cloudflare.</p><form id="native-officer-login"><label>Offizierscode<input type="password" name="code" autocomplete="off" required placeholder="RZSN-…"></label><button type="submit">Anmelden</button><p id="native-login-status" role="status"></p></form></div></section>';
  localizeOfficerTree(mount);
  return;
 }
 await view(mount);
 localizeOfficerTree(mount);
}
export function initNativeAdmin(mount){
 if(mount.dataset.nativeReady)return;
 mount.dataset.nativeReady='1';
 // One observer translates late API renderers, forms and validation messages.
 // We observe child additions only: translating text nodes cannot recursively trigger itself.
 const Observer=mount.ownerDocument.defaultView?.MutationObserver;
 if(Observer){
  const localizer=new Observer(()=>localizeOfficerTree(mount));
  localizer.observe(mount,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
 }
 mount.lang=officerLanguage(mount.ownerDocument);
 mount.dir=mount.lang==='ar'?'rtl':'ltr';
 mount.addEventListener('click',async event=>{
  const proof=event.target.closest?.('[data-native-stat-evidence],[data-native-stat-close],[data-native-stat-prev],[data-native-stat-next],[data-native-stat-link],[data-native-stat-browse]');
  if(proof){
   const area=mount.querySelector('#native-admin-content');
   if(proof.dataset.nativeStatEvidence)await statViewer.open(area,proof.dataset.nativeStatEvidence);
   else if(proof.hasAttribute('data-native-stat-close'))statViewer.close(area);
   else if(proof.hasAttribute('data-native-stat-browse'))await statViewer.step(0);
   else if(proof.hasAttribute('data-native-stat-prev'))await statViewer.step(-1);
   else if(proof.hasAttribute('data-native-stat-next'))await statViewer.step(1);
   else if(proof.hasAttribute('data-native-stat-link'))await statViewer.link();
   return;
  }
  const screenshot=event.target.closest?.('.native-review-image img');
  if(screenshot){
   const url=screenshot.getAttribute('src')||'';
   if(url.startsWith('blob:'))window.open(url,'_blank','noopener,noreferrer');
   return;
  }
  const button=event.target.closest('[data-officer-tab],[data-officer-logout],[data-native-member],[data-native-more],[data-native-train],[data-native-new],[data-native-edit],[data-native-refresh],[data-registry-edit],[data-registry-reload],[data-native-action],[data-native-manage],[data-native-member-log],[data-native-member-close],[data-native-add-absence],[data-native-form-reload],[data-native-copy-train],[data-native-event-quick],[data-native-watch-person],[data-native-diplomacy-new],[data-native-diplomacy-edit],[data-native-diplomacy-cancel],[data-native-diplomacy-reload],[data-native-registry-filter],[data-native-review-pick],[data-native-review-upload],[data-native-review-resolve],[data-native-mark-zero],[data-native-capture-preview],[data-native-capture-attach],[data-native-review-replace],[data-native-rotation-reload],[data-native-task-toggle],[data-native-record-delete],[data-native-dice-date],[data-native-dice-delete],[data-native-train-choice],[data-native-access-mode],[data-native-access-copy],[data-native-access-signout],[data-native-member-create],[data-native-registry-quick],[data-native-access-link],[data-native-access-disable],[data-audit-category],[data-native-vs-image],[data-native-vs-image-close],[data-native-requirements-reload],[data-native-copy-report]');
  if(!button)return;
  if(button.hasAttribute('data-native-copy-report')){
   const area=button.closest('.native-report-panel');
   const field=area?.querySelector('textarea');
   const note=area?.querySelector('.native-report-copy-status');
   if(!field||!note)return;
   if(safeMailText(field.value)===null||!field.value.trim()){
    note.textContent='Please keep your report within 500 characters.';return;
   }
   try {
    if(!window.navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
    await window.navigator.clipboard.writeText(field.value);
    note.textContent='Copied. Review before sending in game.';
   } catch(error) {
    field.focus();field.select();
    note.textContent='Select and copy the text manually.';
   }
   return;
  }
  if(button.hasAttribute('data-officer-logout')){
   try{await request('/api/native-logout',{method:'POST',body:{}})}catch{}clearOfficer();await renderNativeAdmin(mount);return;
  }
  if(button.hasAttribute('data-native-requirements-reload')){
   cache.requirements=await request('/api/alliance-requirements');renderRequirements(mount.querySelector('#native-admin-content'));return
  }
  if(button.dataset.officerTab){panel=button.dataset.officerTab;pageLimit=20;historyLimit=20;activityLimit=30;await view(mount);
   if(panel==='more')mount.querySelector('.native-hub-section h3')?.focus();
   return}
  if(button.dataset.nativeAction){
   const action=button.dataset.nativeAction;
   panel=({ 'train-today':'train','event-planning':'events','member-find':'members','review-open':'reviews','tasks-open':'tasks','absences-open':'absences','vs-open':'vs','donations-open':'donations'})[action]||'overview';
   pageLimit=20;historyLimit=20;await view(mount);
   const destination=mount.querySelector('#native-admin-content');
   if(action==='train-today'&&cache.trains?.today&&Array.isArray(cache.trains.history))editTrain(destination,cache.trains.today);
   if(action==='event-planning'&&cache.ops?.events)editRecord(destination,'events','');
   if(action==='member-find')destination.querySelector('#native-member-search')?.focus();
   return;
  }
  if(button.hasAttribute('data-native-refresh')){await view(mount);return}
  if(button.dataset.nativeTaskToggle){
   const row=(cache.ops?.tasks||[]).find(x=>x.id===button.dataset.nativeTaskToggle);
   if(!row)return;
   button.disabled=true;
   try{await request('/api/operations/tasks',{method:'POST',body:{id:row.id,title:row.title,status:row.status==='done'?'open':'done'}});
    cache.ops=await request('/api/operations');renderRecords(mount.querySelector('#native-admin-content'))}
   catch(err){button.disabled=false;window.alert('Aufgabe nicht aktualisiert: '+err.message)}
   return;
  }
  if(button.dataset.nativeRecordDelete){
   const kind=button.dataset.kind,id=button.dataset.nativeRecordDelete;
   const row=(cache.ops?.[kind]||[]).find(x=>x.id===id);
   if(!row)return;
   const reason=window.prompt('Diesen Eintrag wirklich löschen? Bitte Grund für das Admin-Protokoll eintragen (mindestens 8 Zeichen).');
   if(reason===null)return;
   if(reason.trim().length<8){window.alert('Bitte einen aussagekräftigen Löschgrund eingeben.');return}
   button.disabled=true;
   try{await request('/api/operations/'+kind+'/delete',{method:'POST',body:{id,reason}});
    cache.ops=await request('/api/operations');await view(mount)}
   catch(err){button.disabled=false;window.alert('Nicht gelöscht: '+err.message)}
   return;
  }
  if(button.hasAttribute('data-native-rotation-reload')){
   if(!window.confirm('Aktuelle Rotation laden und ungespeicherte Einstellungen verwerfen?'))return;
   try{cache.rotation=await request('/api/train-rotation');renderTrainRotation(mount.querySelector('#native-admin-content'))}
   catch(err){const text=mount.querySelector('#native-rotation-message');if(text)text.textContent=err.message}
   return;
  }
  if(button.hasAttribute('data-native-form-reload')){
   if(window.confirm('Aktuellen Stand laden und ungespeicherte Eingaben verwerfen?'))await view(mount);
   return;
  }
  const target=mount.querySelector('#native-admin-content');if(!target)return;
  if(button.hasAttribute('data-native-vs-image-close')){
   const modal=target.querySelector('#native-vs-evidence-viewer');modal?.remove();
   for(const [key,url] of reviewBlobUrls)if(key.startsWith('vs:')){URL.revokeObjectURL(url);reviewBlobUrls.delete(key)}
   return;
  }
  if(button.dataset.nativeVsImage){await openVsScreenshot(target,button.dataset.nativeVsImage);return}
  if(button.dataset.nativeRegistryFilter){
   registryFilter=button.dataset.nativeRegistryFilter;
   target.querySelectorAll('[data-native-registry-filter]').forEach(item=>
    item.setAttribute('aria-pressed',String(item.dataset.nativeRegistryFilter===registryFilter)));
   pageLimit=20;renderRegistry(target,target.querySelector('#registry-search')?.value||'');
   return;
  }
  if(button.hasAttribute('data-registry-reload')){
   if(!window.confirm('Aktuellen Stand laden und eigene Eingaben verwerfen?'))return;
   const form=button.closest('form');button.disabled=true;
   try{
    const latest=await request('/api/member-registry');
    if(!latest.members.some(m=>m.id===form.dataset.id))throw Error('Mitglied nicht mehr vorhanden. Eingaben bleiben erhalten.');
    cache.registry=latest;renderRegistry(target,target.querySelector('#registry-search')?.value||'');
    editRegistry(target,form.dataset.id);
   }catch(err){form.querySelector('#native-form-message').textContent=err.message;button.disabled=false}
   return;
  }
  if(button.dataset.nativeWatchPerson){
   const id=button.dataset.nativeWatchPerson;
   panel='members';await view(mount);
   const memberTarget=mount.querySelector('#native-admin-content');
   if(memberTarget?.querySelector('#native-person'))await showPerson(memberTarget,id);
   return;
  }
  if(button.hasAttribute('data-native-diplomacy-new')){editDiplomacy(target);return}
  if(button.dataset.nativeDiplomacyEdit){editDiplomacy(target,button.dataset.nativeDiplomacyEdit);return}
  if(button.hasAttribute('data-native-diplomacy-cancel')){
   const editor=target.querySelector('#native-diplomacy-form');if(editor)editor.innerHTML='';
   return;
  }
  if(button.hasAttribute('data-native-diplomacy-reload')){
   if(!window.confirm('Aktuellen Stand laden und ungespeicherte Diplomatie-Notizen verwerfen?'))return;
   try{cache.diplomacy=await request('/api/diplomacy');renderDiplomacy(target);
    const editor=target.querySelector('#native-diplomacy-form');if(editor)editor.innerHTML='';
   }catch(err){
    const message=target.querySelector('#native-diplomacy-message');
    if(message)message.textContent='Aktualisierung fehlgeschlagen: '+err.message;
   }
   return;
  }
  if(button.hasAttribute('data-native-member-create')){createMemberForm(target);return}
  if(button.dataset.nativeRegistryQuick){
   const form=button.closest('#registry-save');if(!form)return;
   const status=form.elements.namedItem('lifecycle'),blacklist=form.elements.namedItem('blacklisted');
   if(button.dataset.nativeRegistryQuick==='archive')status.value='former';
   if(button.dataset.nativeRegistryQuick==='blacklist')blacklist.checked=true;
   if(button.dataset.nativeRegistryQuick==='active'){status.value='active';blacklist.checked=false}
   form.elements.namedItem('reason').focus();return;
  }
  if(button.dataset.nativeAccessMode){accessForm(target,button.dataset.nativeAccessMode);return}
  if(button.dataset.nativeAccessLink){accessForm(target,'link',button.dataset.nativeAccessLink);return}
  if(button.dataset.nativeAccessDisable){accessForm(target,'disable',button.dataset.nativeAccessDisable);return}
  if(button.hasAttribute('data-native-access-signout')){clearOfficer();await renderNativeAdmin(mount);return}
  if(button.hasAttribute('data-native-access-copy')){
   const output=target.querySelector('#native-credential-output');if(!output)return;
   output.select();
   try{if(window.navigator.clipboard?.writeText)await window.navigator.clipboard.writeText(output.value)}catch{}
   return;
  }
  if(button.dataset.registryEdit){editRegistry(target,button.dataset.registryEdit);return}
  if(button.dataset.nativeMember){
   if(panel!=='members'){
    const id=button.dataset.nativeMember;panel='members';await view(mount);
    await showPerson(mount.querySelector('#native-admin-content'),id);
   }else await showPerson(target,button.dataset.nativeMember);
   return;
  }
  if(button.hasAttribute('data-native-member-close')){
   const node=target.querySelector('#native-person');if(node)node.innerHTML='';
   const roster=target.querySelector('.native-member-folds');if(roster)roster.hidden=false;
   const header=target.querySelector('.native-row');if(header)header.hidden=false;
   target.querySelector('#native-member-search')?.focus();return;
  }
  if(button.dataset.nativeAddAbsence){editProfileAbsence(target,button.dataset.nativeAddAbsence);return}
  if(button.dataset.nativeManage){
   const holder=target.querySelector('#registry-form');
   if(!holder)return;
   try{
    cache.registry=await request('/api/member-registry');
    editRegistry(target,button.dataset.nativeManage);
   }catch(err){holder.textContent='Mitgliederverwaltung nicht verfügbar: '+err.message}
   return;
  }
  if(button.dataset.nativeMemberLog){
   const holder=target.querySelector('#native-person-log');
   if(!holder)return;
   holder.textContent='Änderungen werden geladen …';
   try{
    const history=await request('/api/activity?limit=100&member_id='+encodeURIComponent(button.dataset.nativeMemberLog));
    holder.innerHTML='<h4 class="native-section-heading">Änderungsprotokoll</h4>'+
     (history.length?'<div class="native-activity-brief">'+history.map(item=>
      '<p><b>'+e(item.actor)+'</b> · '+e(item.action)+' · '+e(formatOfficerTime(item.at))+'</p>').join('')+'</div>':'<p class="native-muted">Noch keine protokollierten Änderungen zu dieser Spieler-ID.</p>');
   }catch(err){holder.textContent='Protokoll nicht verfügbar: '+err.message}
   return;
  }
  if(button.dataset.nativeMore==='members'){pageLimit+=20;renderMembers(target,target.querySelector('#native-member-search')?.value||'');return}
  if(button.dataset.nativeMore==='train'){historyLimit+=20;renderTrain(target);return}
  if(button.dataset.nativeMore==='registry'){pageLimit+=20;renderRegistry(target,target.querySelector('#registry-search')?.value||'');return}
  if(button.dataset.nativeMore==='reviews'){historyLimit+=20;renderReviews(target,target.querySelector('#review-search-native')?.value||'');return}
  if(button.dataset.nativeReviewPick){
   const card=button.closest('.native-review-card');
   if(!card)return;
   const member=(cache.reviewMembers||[]).find(x=>x.id===button.dataset.nativeReviewPick);
   if(!member)return;
   card.querySelector('[data-native-review-member]').value=member.id;
   card.querySelector('.native-review-selection').textContent='Ausgewählt: '+member.name+' · '+(member.rank||'?');
   card.querySelectorAll('[data-native-review-pick]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));
   return;
  }
  if(button.hasAttribute('data-native-mark-zero')){
   const card=button.closest('.native-review-card');
   const field=card?.querySelector('[data-native-review-value]');
   if(field){field.value='0';field.focus();card.querySelector('[data-native-review-reason]').value='Sichtbare 0 im Original-Screenshot von Officer geprüft';
    card.querySelector('.native-review-message').textContent='0 vorgemerkt. Bitte Originalbild prüfen und Korrektur ausdrücklich speichern.'}
   return;
  }
  if(button.hasAttribute('data-native-capture-preview')){
   const card=button.closest('.native-review-card');if(card)await previewProfileCapture(card);return;
  }
  if(button.hasAttribute('data-native-capture-attach')){
   const card=button.closest('.native-review-card');if(card)await attachProfileCapture(card);return;
  }
  if(button.hasAttribute('data-native-review-replace')){
   const card=button.closest('.native-review-card');if(card)await replaceReviewScreenshot(card);return;
  }
  if(button.hasAttribute('data-native-review-upload')){
   const card=button.closest('.native-review-card');
   if(card)await attachReviewScreenshot(card);
   return;
  }
  if(button.dataset.nativeReviewResolve){
   const card=button.closest('.native-review-card');
   if(card)await completeReview(card,button.dataset.nativeReviewResolve);
   return;
  }
  if(button.dataset.auditCategory){activityCategory=button.dataset.auditCategory;activityLimit=30;renderActivity(target,target.querySelector('#activity-search')?.value||'');return}
  if(button.dataset.nativeMore==='activity'){activityLimit+=30;renderActivity(target,target.querySelector('#activity-search')?.value||'');return}
  if(button.dataset.nativeCopyTrain){
   const date=button.dataset.nativeCopyTrain;
   const slot=(cache.trains?.calendar||[]).find(row=>row.date===date);
   const member=(cache.trains?.members||[]).find(m=>m.id===slot?.entry?.member_id);
   if(!member||slot?.entry?.status!=='planned')return;
   // Use only an explicitly linked eligible driver, not an inferred name.
   const message='RZSN train '+date+' ('+(slot.type||'Train')+'): '+member.name+
    ' is our conductor today. Please join with 3 tickets. All aboard!';
   try{
    if(!window.navigator?.clipboard?.writeText)throw Error('Clipboard unavailable');
    await window.navigator.clipboard.writeText(message);
    button.textContent='Zugtext kopiert';
   }catch{
    const holder=target.querySelector('#native-train-form');
    if(holder){holder.innerHTML='<label class="native-copy-fallback">Text für den Allianzchat<textarea rows="3" readonly>'+e(message)+'</textarea></label>';holder.querySelector('textarea')?.focus()}
   }
   return;
  }
  if(button.dataset.nativeEventQuick){
   editRecord(target,'events','');
   const form=target.querySelector('#native-record-save');
   if(form){form.elements.namedItem('event_type').value=button.dataset.nativeEventQuick;updateEventForm(form)}
   return;
  }
  if(button.dataset.nativeDiceDelete){
   const reason=window.prompt('Dice-Game-Eintrag löschen? Bitte Grund für das Admin-Protokoll nennen.');
   if(reason===null)return;
   if(reason.trim().length<8){window.alert('Bitte mindestens 8 Zeichen Begründung.');return}
   button.disabled=true;
   try{await request('/api/train-dice/delete',{method:'POST',body:{date:button.dataset.nativeDiceDelete,
     expected_revision:Number(button.dataset.revision),reason}});
    cache.dice=await request('/api/train-dice');renderTrain(target)}
   catch(err){window.alert('Dice Game nicht gelöscht: '+err.message);button.disabled=false}
   return;
  }
  if(button.dataset.nativeDiceDate){editDice(target,button.dataset.nativeDiceDate);return}
  if(button.dataset.nativeTrainChoice){
   const date=button.dataset.date,id=button.dataset.nativeTrainChoice;
   const row=(cache.trains?.calendar||[]).find(x=>x.date===date);
   if(row?.suggestions?.some(m=>m.id===id))editTrain(target,date,false,id);
   return;
  }
  if(button.dataset.nativeTrain){editTrain(target,button.dataset.nativeTrain);return}
  if(button.dataset.nativeNew==='train'){editTrain(target,cache.trains?.today||new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date()),true);return}
  if(button.dataset.nativeNew||button.dataset.nativeEdit){editRecord(target,panel,button.dataset.nativeEdit||'');return}
 });
 mount.addEventListener('input',event=>{
  if(event.target.matches('.native-report-panel textarea')){
   const panel=event.target.closest('.native-report-panel');
   const counter=panel?.querySelector('.native-report-counter');
   if(counter)counter.textContent=event.target.value.length+'/500 characters';
   const status=panel?.querySelector('.native-report-copy-status');
   if(status)status.textContent='';
  }
  if(event.target.id==='native-member-search'){pageLimit=20;renderMembers(mount.querySelector('#native-admin-content'),event.target.value)}
  if(event.target.id==='registry-search'){pageLimit=20;renderRegistry(mount.querySelector('#native-admin-content'),event.target.value)}
  if(event.target.id==='native-diplomacy-search')renderDiplomacy(mount.querySelector('#native-admin-content'),event.target.value);
  if(event.target.id==='activity-search'){activityLimit=30;renderActivity(mount.querySelector('#native-admin-content'),event.target.value)}
  if(event.target.id==='native-donation-search')renderDonations(mount.querySelector('#native-admin-content'),event.target.value);
  if(event.target.id==='review-search-native'){historyLimit=20;renderReviews(mount.querySelector('#native-admin-content'),event.target.value)}
  if(event.target.matches('[data-native-review-search]')){
   const card=event.target.closest('.native-review-card');
   if(card)reviewMemberOptions(card,event.target.value);
  }
 });
 mount.addEventListener('change',event=>{
  if(event.target.matches('[data-native-capture-choice]')){
   const card=event.target.closest('.native-review-card');
   if(card){selectedProfileCaptures.delete(card.dataset.reviewId);const attach=card.querySelector('[data-native-capture-attach]');if(attach)attach.disabled=true;
    const message=card.querySelector('.native-review-message');if(message)message.textContent='Andere Aufnahme gewählt; bitte zuerst öffnen und kontrollieren.'}
  }
 if(event.target.id==='activity-group-by'){activityGroupBy=event.target.value;activityLimit=30;renderActivity(mount.querySelector('#native-admin-content'),mount.querySelector('#activity-search')?.value||'')}
 if(event.target.name==='event_type'&&event.target.closest('#native-record-save'))updateEventForm(event.target.form);if(event.target.id==='native-vs-week')renderVs(mount.querySelector('#native-admin-content'));if(event.target.id==='native-donation-week')renderDonations(mount.querySelector('#native-admin-content'));if(['review-image-native','review-batch-native','review-kind-native'].includes(event.target.id)){historyLimit=20;const target=mount.querySelector('#native-admin-content');renderReviews(target,target.querySelector('#review-search-native')?.value||'')}});
 mount.addEventListener('submit',async event=>{
  const form=event.target;event.preventDefault();
  if(form.id==='native-officer-login'){
   const button=form.querySelector('[type=submit]');button.disabled=true;
   form.querySelector('#native-login-status').textContent='Anmeldung wird geprüft …';
   try{
    const login=await request('/api/native-login',{method:'POST',body:{code:form.elements.namedItem('code').value}});
    sessionToken=login.token;officer=login;form.elements.namedItem('code').value='';await view(mount);
   }catch(err){form.querySelector('#native-login-status').textContent=err.message;button.disabled=false}
   return;
  }
  if(form.id==='native-dice-save'){
   const payload={date:form.elements.namedItem('date').value,
    winner_id:form.elements.namedItem('winner_id').value,
    roll_value:form.elements.namedItem('roll_value').value?Number(form.elements.namedItem('roll_value').value):null,
    note:form.elements.namedItem('note').value,expected_revision:Number(form.dataset.revision)};
   const submit=form.querySelector('[type=submit]'),status=form.querySelector('#native-dice-message');
   submit.disabled=true;status.textContent='Dice Game wird gespeichert …';
   try{await request('/api/train-dice',{method:'POST',body:payload});
    cache.dice=await request('/api/train-dice');renderTrain(mount.querySelector('#native-admin-content'));
    const info=mount.querySelector('#native-train-form');if(info)info.textContent='Gewinner gespeichert und im Admin-Log protokolliert.';
   }catch(err){submit.disabled=false;status.textContent='Nicht gespeichert: '+err.message}
   return;
  }
  if(form.id==='native-train-rotation-save'){
   const types=trainWeekdays.map((_,i)=>form.elements.namedItem('type'+i).value);
   const coordinators=trainWeekdays.map((_,i)=>form.elements.namedItem('coord'+i).value||null);
   const body={types,coordinators,auto_suggest:form.elements.namedItem('auto_suggest').checked,
    reason:form.elements.namedItem('reason').value,revision:Number(form.dataset.revision)};
   const button=form.querySelector('[type=submit]'),message=form.querySelector('#native-rotation-message');
   button.disabled=true;message.textContent='Rotation wird gespeichert …';
   try{
    await request('/api/train-rotation',{method:'POST',body});
    const [rotation,trains]=await Promise.all([request('/api/train-rotation'),request('/api/train-manager')]);
    cache.rotation=rotation;cache.trains=trains;renderTrain(mount.querySelector('#native-admin-content'));
    const details=mount.querySelector('.native-train-rotation');if(details)details.open=true;
    const result=mount.querySelector('#native-rotation-message');if(result)result.textContent='Neue Rotation und Zuständigkeiten gespeichert.';
   }catch(err){
    message.textContent=err.status===409?'Eine andere Person hat die Rotation geändert. Deine Eingaben bleiben erhalten.':'Nicht gespeichert: '+err.message;
    if(err.status===409){form.dataset.conflict='1';form.querySelector('[data-native-rotation-reload]').hidden=false}
    else button.disabled=false;
   }
   return;
  }
  if(form.id==='native-diplomacy-save'){
   if(form.dataset.conflict==='1'||form.querySelector('[type=submit]').disabled)return;
   const value=key=>form.elements.namedItem(key)?.value;
   const payload={
    server:Number(value('server')),tag:value('tag'),name:value('name'),
    stance:value('stance'),war_support:value('war_support'),
    attack_policy:value('attack_policy'),verification:value('verification'),
    notes:value('notes'),active:form.elements.namedItem('active').checked,
    reason:value('reason')
   };
   if(form.dataset.id){payload.id=form.dataset.id;payload.revision=Number(form.dataset.revision)}
   const button=form.querySelector('[type=submit]');button.disabled=true;
   const message=form.querySelector('#native-diplomacy-message');message.textContent='Wird gespeichert …';
   try{
    await request('/api/diplomacy',{method:'POST',body:payload});
    cache.diplomacy=await request('/api/diplomacy');
    const target=mount.querySelector('#native-admin-content');
    renderDiplomacy(target,target.querySelector('#native-diplomacy-search')?.value||'');
    target.querySelector('#native-diplomacy-form').innerHTML='<p role="status" class="native-confirmed">Vereinbarung protokolliert gespeichert.</p>';
   }catch(err){
    if(err.status===409){
     form.dataset.conflict='1';
     form.querySelector('[data-native-diplomacy-reload]').hidden=false;
     message.textContent='Ein anderer Officer hat diesen Eintrag verändert. Deine Eingaben bleiben erhalten. Lade den aktuellen Stand ausdrücklich neu.';
    }else{
     button.disabled=false;message.textContent='Nicht gespeichert: '+err.message;
    }
   }
   return;
  }
  if(form.id==='native-requirements-save'){
   const values={revision:Number(form.dataset.revision),
    vs_daily_minimum:Number(form.elements.namedItem('vs_daily_minimum').value),
    donation_weekly_minimum:Number(form.elements.namedItem('donation_weekly_minimum').value),
    min_active_vs_days:Number(form.elements.namedItem('min_active_vs_days').value),
    low_vs_day_warning_count:Number(form.elements.namedItem('low_vs_day_warning_count').value),
    shield_reminder_saturday:form.elements.namedItem('shield_reminder_saturday').checked,
    reason:form.elements.namedItem('reason').value};
   const message=form.querySelector('#native-requirements-message'),button=form.querySelector('[type=submit]');
   if(!form.reportValidity())return;
   button.disabled=true;message.textContent='Speichere Regeln mit Admin-Protokoll …';
   try{
    cache.requirements=await request('/api/alliance-requirements',{method:'POST',body:values});
    renderRequirements(mount.querySelector('#native-admin-content'));
    mount.querySelector('#native-requirements-message').textContent='Allianzregeln gespeichert und protokolliert. VS und Spenden verwenden die neuen Grenzwerte.';
   }catch(error){
    message.textContent=error.status===409?'Einstellungen wurden zwischenzeitlich geändert. Bitte neu laden, damit du niemandes Änderungen überschreibst.':'Nicht gespeichert: '+error.message;
    button.disabled=error.status===409;
   }
   return;
  }
  if(form.id==='native-vs-evidence-upload'){
   await submitVsScreenshot(form,mount.querySelector('#native-admin-content'));return;
  }
  if(form.id==='native-member-create-save'){
   const button=form.querySelector('[type=submit]'),message=form.querySelector('#native-member-create-message');
   button.disabled=true;
   try{
    await request('/api/member-registry/create',{method:'POST',body:{name:form.elements.namedItem('name').value,rank:form.elements.namedItem('rank').value,reason:form.elements.namedItem('reason').value}});
    registryFilter='active';await view(mount);
   }catch(error){message.textContent='Nicht angelegt: '+error.message;button.disabled=false}
   return;
  }
  if(form.id==='native-access-save'){
   const mode=form.dataset.mode;
   const body={reason:form.elements.namedItem('reason').value};
   if(mode==='self'){
    body.action='change_self';body.current_code=form.elements.namedItem('current_code').value;
   }else if(mode==='issue')body.member_id=form.elements.namedItem('member_id').value;
   else if(mode==='link'||mode==='disable'){
    body.officer_id=form.dataset.officerId;
    if(mode==='link')body.member_id=form.elements.namedItem('member_id').value;
   }else{body.action='reset_other';body.officer_id=form.elements.namedItem('officer_id').value}
   if(mode==='disable'&&!window.confirm('Offizierszugang wirklich deaktivieren und alle bisherigen Sitzungen beenden?'))return;
   const button=form.querySelector('[type=submit]'),message=form.querySelector('#native-access-message');
   button.disabled=true;
   try{
    const endpoint=mode==='issue'?'/api/officer-access/issue':
     mode==='link'?'/api/officer-access/link':mode==='disable'?'/api/officer-access/disable':'/api/officer-access/rotate';
    const result=await request(endpoint,{method:'POST',body});
    if(mode==='link'||mode==='disable'){
     await view(mount);
     const message=mount.querySelector('#native-access-result');
     if(message)message.textContent=mode==='link'?'Offizierskonto mit dem bestätigten Mitglied verknüpft.':'Offizierszugang deaktiviert und Sitzungen beendet.';
     return;
    }
    form.remove();
    const host=mount.querySelector('#native-access-result');
    host.innerHTML='<section class="native-access-secret" role="status"><h3>Neuer Code für '+e(result.ingame_name)+'</h3>'+
      '<p>Nur jetzt sichtbar. Sicher an den betroffenen Offizier übermitteln. Alter Code und alte Sitzungen sind'+(mode==='issue'?' nicht vorhanden.':' gesperrt.')+'</p>'+
      '<label>Einmaliger Zugangscode<input id="native-credential-output" type="text" readonly autocomplete="off" spellcheck="false" value="'+e(result.code)+'"></label>'+
      '<button type="button" data-native-access-copy>Code markieren / kopieren</button>'+
      (mode==='self'?'<button type="button" data-native-access-signout>Mit neuem Code anmelden</button>':'')+'</section>';
   }catch(error){message.textContent='Nicht gespeichert: '+error.message;button.disabled=false}
   return;
  }
  if(form.id==='registry-save'){
   if(form.dataset.conflict==='1'||form.querySelector('[type=submit]').disabled)return;
   const payload={member_id:form.dataset.id,revision:form.dataset.revision,rank:form.elements.namedItem('rank').value,lifecycle:form.elements.namedItem('lifecycle').value,blacklisted:form.elements.namedItem('blacklisted').checked,reason:form.elements.namedItem('reason').value};
   if(!window.confirm('Mitgliedsänderung mit Audit-Log speichern?'))return;
   const button=form.querySelector('[type=submit]');button.disabled=true;
   try{await request('/api/member-registry',{method:'POST',body:payload});await view(mount)}
   catch(err){
    form.querySelector('#native-form-message').textContent=err.status===409?'Der Mitgliedsstand wurde geändert. Deine Eingaben bleiben erhalten. Lade den aktuellen Stand vor einer neuen Änderung.':err.message;
    if(err.status===409){form.dataset.conflict='1';form.querySelector('[data-registry-reload]').hidden=false}
    else button.disabled=false;
   }return;
  }
  if(form.id==='native-train-save'){form.dataset.kind='train';await saveForm(mount,form)}
  if(form.id==='native-record-save')await saveForm(mount,form);
 });
}
