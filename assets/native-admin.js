/** Native Luna officer workspace. Private data is held only in a live memory token. */
import {ALLIANCE_CONFIG} from './config.js';
import {icon} from './icons.js';
const apiBase=ALLIANCE_CONFIG.commandCenterEmbedUrl.replace('/?embed=1','');
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let sessionToken='',officer=null,panel='overview',cache={},pageLimit=20,historyLimit=20,activityLimit=30,registryFilter='all';
export function clearOfficer(){clearReviewImages();sessionToken='';officer=null;cache={};panel='overview';pageLimit=20;historyLimit=20;activityLimit=30;registryFilter='all';}
export const hasOfficer=()=>Boolean(sessionToken);
async function request(path,options={}){
 const headers={'Accept':'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...(sessionToken?{'Authorization':'Bearer '+sessionToken}:{})};
 const response=await fetch(apiBase+path,{method:options.method||'GET',headers,body:options.body?JSON.stringify(options.body):undefined,mode:'cors',credentials:'omit',cache:'no-store'});
 let result;try{result=await response.json()}catch{throw Error('Die Cloudflare-API antwortet nicht korrekt.')}
 if(!response.ok){if(response.status===401&&path!=='/api/native-login')clearOfficer();throw Object.assign(Error(result.error||'HTTP '+response.status),{status:response.status})}
 return result;
}
const options=(members,value='')=>'<option value="">Nicht besetzt</option>'+members.map(m=>'<option value="'+e(m.id)+'" '+(m.id===value?'selected':'')+'>'+e(m.name)+' · '+e(m.rank)+'</option>').join('');
// Keep the ten stable panel IDs for deep links and existing officer workflows,
// but only expose four high-level destinations in the primary navigation.
const primaryPanels=[
 ['overview','Kommando','today'],['vs','VS & Daten','vs'],
 ['members','Allianz','alliance'],['train','Einsätze','hero']
];
const secondaryPanels=[
 ['reviews','Werte prüfen'],['registry','Ränge & Archiv'],['diplomacy','Diplomatie'],
 ['tasks','Aufgaben'],['absences','Abwesenheiten'],['events','Events'],
 ['activity','Admin-Log']
];
const parentPanel=key=>({
 overview:'overview',vs:'vs',reviews:'vs',members:'members',registry:'members',watch:'members',diplomacy:'members',
 train:'train',tasks:'train',absences:'train',events:'train',activity:'activity'
}[key]||'overview');
const sectionPanels={
 vs:[['vs','VS-Duell']],
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
  '<details class="native-admin-more" '+(parent==='activity'?'open':'')+'><summary aria-label="Weitere Offizierswerkzeuge">Mehr</summary><div class="native-more-menu">'+
  secondaryPanels.map(pair=>navButton(pair)).join('')+'</div></details></nav>'+
  (sectionPanels[parent]?'<nav class="native-admin-subnav" aria-label="Unterbereiche">'+
   sectionPanels[parent].map(pair=>navButton(pair)).join('')+
   (contextTools[parent]?'<details class="native-context-tools" '+(contextTools[parent].items.some(([k])=>k===panel)?'open':'')+
    '><summary>'+e(contextTools[parent].label)+'</summary><div>'+
     contextTools[parent].items.map(pair=>navButton(pair)).join('')+'</div></details>':'')+
   '</nav>':'');
}
function cards(items){return '<div class="native-cards">'+items.map(([name,value,sub])=>'<article><small>'+e(name)+'</small><strong>'+e(value)+'</strong><span>'+e(sub||'')+'</span></article>').join('')+'</div>'}
function marker(status){return '<span class="native-status">'+e(status||'Unbekannt')+'</span>'}
async function view(mount){
 clearReviewImages();
 const header='<div class="native-officer-strip" role="group" aria-label="Offiziersbereich">'+
  '<a class="native-return-link" href="#today">← Zur Website</a>'+
  '<div class="native-officer-controls"><span class="native-officer-badge">'+e(officer?.role||'Offizier')+' · '+e(officer?.name||'')+
  '</span><button type="button" data-officer-logout>Abmelden</button></div></div>';
 mount.innerHTML='<section class="native-admin"><h1 class="sr-only">RZSN Command Center</h1>'+header+nav()+'<div class="native-admin-content" id="native-admin-content"><p>Daten werden geladen …</p></div></section>';
 const target=mount.querySelector('#native-admin-content');
 try{
  if(panel==='overview'){
   const [summary,ops,trains]=await Promise.all([request('/api/overview'),request('/api/operations'),request('/api/train-manager')]);
   cache.ops=ops;cache.trains=trains;
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
   const mission=(key,art,eyebrow,title,detail)=>'<button type="button" class="native-mission" data-native-action="'+key+'">'+
    '<span class="native-mission-icon">'+icon(art,'native-mission-svg')+'</span><span class="native-mission-copy"><small>'+e(eyebrow)+'</small><strong>'+e(title)+'</strong><span>'+detail+'</span></span><span class="native-mission-chevron" aria-hidden="true">›</span></button>';
   target.innerHTML='<div class="native-dashboard">'+
    '<div class="native-dashboard-heading"><div><span class="native-kicker">OFFIZIERSÜBERSICHT</span><h2>Heute im Kommando</h2><p class="native-muted">Spieltag '+e(day)+' · Daten aus deinem privaten Allianzregister</p></div><span class="native-daily-sigil" aria-hidden="true">'+icon('today','native-emblem-icon')+'</span></div>'+
    '<div class="native-mission-stack" aria-label="Wichtige Aktionen">'+
    mission('train-today','season','ZUG · HEUTE',todayTrain?e(todayTrain.type||'Zugverwaltung'):'Tageszug',trainLine(todayTrain))+
    mission('event-planning','hero','EINSATZ · NÄCHSTER TERMIN',nextEvent?e(eventNames[nextEvent.event_type]||nextEvent.event_type):'Eventplanung',
     nextEvent?e(nextEvent.event_date)+' · '+(nextEvent.lead_id?'Leitung zugeordnet':'Leitung prüfen'):'Noch kein kommender Termin eingetragen')+
    mission('review-open','vs','DATEN · PRÜFAUFTRÄGE',e(summary.reviews??0)+' offene Prüffälle',
      'Unbestätigte Werte prüfen · nicht automatisch als Fehler gewertet')+
    '</div>'+
    '<div class="native-dashboard-summary">'+cards([['Allianz aktiv',summary.active??'—','Zuletzt importierter Stand'],['Offene Aufgaben',pending.length,'Officer Desk'],['Zugtage zur Klärung',trains.counts?.missing_recent??'—','Historische Lücken, nicht automatisch versäumt']])+'</div>'+
    '<div class="native-dashboard-bottom"><section class="native-dashboard-panel"><h3>Deine nächsten Schritte</h3>'+
    (pending.length?'<div class="native-action-brief">'+pending.slice(0,3).map(t=>'<div><b>'+e(t.title)+'</b><small>'+e(t.due_date||'Keine Frist')+' · '+e(t.priority||'normal')+'</small></div>').join('')+'</div>':'<p class="native-muted">Keine offenen Aufgaben eingetragen.</p>')+
    '<button type="button" data-native-action="tasks-open">Aufgaben öffnen</button></section>'+
    '<section class="native-dashboard-panel"><h3>Als Nächstes</h3><p><strong>'+e(tomorrowTrain?.date||'Nächster Zug')+'</strong> · '+e(tomorrowTrain?.type||'Kein weiterer Zugtag gefunden')+'</p><p class="native-muted">'+trainLine(tomorrowTrain)+'</p>'+
    '<button type="button" data-native-action="member-find">Spieler suchen</button></section></div>'+
    '<div class="native-shortcuts"><button type="button" data-native-action="train-today">+ Zug</button><button type="button" data-native-action="event-planning">+ Event</button><button type="button" data-native-action="member-find">Spieler suchen</button><button type="button" data-native-action="review-open">Werte prüfen</button></div>'+
    '</div>';
  }else if(panel==='registry'){
   cache.registry=await request('/api/member-registry');
   target.innerHTML='<div class="native-row"><h2>Mitgliederverwaltung</h2><input id="registry-search" type="search" placeholder="Spieler suchen"></div>'+
    '<nav class="native-status-filter" aria-label="Mitgliederstatus">'+[['all','Alle'],['active','Aktiv'],['former','Archiv'],['blacklist','Blacklist']].map(([key,label])=>
    '<button type="button" data-native-registry-filter="'+key+'" aria-pressed="'+(registryFilter===key?'true':'false')+'">'+label+'</button>').join('')+'</nav>'+
    cards([['Aktiv',cache.registry.counts.active],['Archiv',cache.registry.counts.former],['Blacklist',cache.registry.counts.blacklisted]])+
    '<div id="registry-list"></div><div id="registry-form"></div>';renderRegistry(target,'');
  }else if(panel==='watch'){
   target.innerHTML='<div class="native-row"><div><h2>Mitglieder-Abgleich</h2><p class="native-muted">VS- und Stärke-Aufnahmen vergleichen. Kein automatischer Austritt und keine automatische Blacklist.</p></div></div><div id="native-watch-list" role="region" aria-label="Mitglieder zum Prüfen"></div>';
   try{cache.watch=await request('/api/membership-watch');renderMembershipWatch(target)}
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
   cache.activity=await request('/api/activity?limit=200');
   target.innerHTML='<div class="native-row"><h2>Admin-Aktivitäten</h2><input id="activity-search" type="search" placeholder="Admin, Aktion, Spieler"></div><div id="activity-list"></div>';renderActivity(target,'');
  }else if(panel==='reviews'){
   const [cases,members]=await Promise.all([
    request('/api/reviews?status=open'),
    request('/api/identity-options').catch(()=>[])
   ]);
   cache.reviews=cases;cache.reviewMembers=Array.isArray(members)?members:members.members||[];
   const batches=[...new Set(cache.reviews.map(x=>x.source_batch).filter(Boolean))].sort();
   target.innerHTML='<div class="native-row"><h2>OCR-Prüfung</h2><input id="review-search-native" type="search" placeholder="Spieler oder Fall suchen"></div>'+
    '<p class="native-muted">Öffne einen Prüfauftrag, kontrolliere das private Belegbild und korrigiere nur die nicht eindeutig erkannten Angaben. Kein Bild = keine Freigabe.</p>'+
    '<div class="native-row"><label>Quelle <select id="review-batch-native"><option value="">Alle Wochen und Profile</option>'+batches.map(b=>'<option value="'+e(b)+'">'+e(b)+'</option>').join('')+'</select></label>'+
    '<label>Prüftyp <select id="review-kind-native"><option value="">Alle</option><option value="vs_day">VS-Tageswert</option><option value="identity">Identität</option><option value="profile">Profilwert</option></select></label></div>'+
    '<p id="native-review-finished" role="status" aria-live="polite"></p><div id="review-list-native"></div>';renderReviews(target,'');
  }else if(panel==='members'){
   const list=await request('/api/members');
   cache.members=list;
   target.innerHTML='<div class="native-row"><h2>Allianzmitglieder</h2><input id="native-member-search" type="search" placeholder="Spieler suchen" autocomplete="off"></div>'+
    '<p class="native-muted">Nach Rang geordnet. Tippe auf einen Rang und danach auf einen Spieler für die Akte.</p><div id="native-member-list"></div>';
   renderMembers(target,'');
  }else if(panel==='vs'){
   const data=await request('/api/vs-intelligence');cache.vs=data;
   target.innerHTML='<div class="native-row"><h2>VS-Duell</h2><select id="native-vs-week">'+data.weeks.map(w=>'<option value="'+e(w.week)+'">'+e(w.week)+'</option>').join('')+'</select></div>'+
    '<div id="native-vs-body"></div>';renderVs(target);
  }else if(panel==='train'){
   cache.trains=await request('/api/train-manager');
   target.innerHTML='<div class="native-row"><h2>Zugplanung</h2><button data-native-new="train">+ Fahrer / Datum</button></div><div id="native-train-body"></div>';renderTrain(target);
  }else if(['tasks','absences','events'].includes(panel)){
   cache.ops=await request('/api/operations');
   target.innerHTML='<div class="native-row"><h2>'+({tasks:'Admin-Aufgaben',absences:'Abwesenheiten & Vertretung',events:'Allianz-Events'}[panel])+'</h2><button data-native-new="'+panel+'">+ Eintragen</button></div><div id="native-form"></div><div id="native-records"></div>';
   renderRecords(target);
  }
 }catch(err){target.innerHTML='<p class="native-error" role="alert">'+e(err.message)+'</p><button data-native-refresh>Erneut laden</button>'}
}
const rankOrder=['R5','R4','R3','R2','R1','Ungeklärt'];
const metricNames={power:'Stärke',kills:'Kills',donations_weekly:'Wöchentliche Spenden',
 donations_daily:'Tägliche Spenden',tech_donations:'Forschungsspenden'};
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
   delta:previous?latest.value-previous.value:null};
 });
}
function renderMembers(target,query=''){
 const host=target.querySelector('#native-member-list');if(!host)return;
 const records=Array.isArray(cache.members)?cache.members:[];
 const text=String(query).trim().toLocaleLowerCase('de-DE');
 const list=records.filter(m=>String(m.name||'').toLocaleLowerCase('de-DE').includes(text));
 const opened=new Set([...host.querySelectorAll('details.native-rank-group[open]')].map(x=>x.dataset.rank));
 const rankGroups=rankOrder.map(rank=>{
  const group=list.filter(m=>(rankOrder.includes(m.rank)?m.rank:'Ungeklärt')===rank)
   .sort((a,b)=>String(a.name).localeCompare(String(b.name),'de',{sensitivity:'base'}));
  if(!group.length)return '';
  const open=text.length>0||opened.has(rank);
  const rows=group.map(m=>'<button type="button" data-native-member="'+e(m.id)+'">'+
   '<span class="native-rank-tag">'+e(m.rank||'?')+'</span><span><strong>'+e(m.name)+'</strong>'+
   '<small>Stärke '+numberText(m.power)+' · Kills '+numberText(m.kills)+
   ' · Spenden '+numberText(m.donations_weekly)+'</small></span><span aria-hidden="true">›</span></button>').join('');
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
 const p=await request('/api/member/'+encodeURIComponent(id));
 const member=p.member||{},metrics=profileMetricChanges(p.stats||[]);
 const weeks=(p.weeks||[]).slice().sort((a,b)=>String(b.week).localeCompare(String(a.week)));
 const node=target.querySelector('#native-person');if(!node)return;
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
 const metricHtml=metrics.length?'<div class="native-profile-metrics">'+metrics.map(m=>
  '<article><small>'+e(m.label)+'</small><strong>'+numberText(m.value)+'</strong>'+
  '<span class="'+(m.delta===null?'':'native-metric-change')+'">'+e(deltaLabel(m.delta))+'</span>'+
  '<small>'+e(metricQuality[m.quality]||'Bestätigt')+' · '+e(m.date)+
  (m.previousDate?' / '+e(m.previousDate):'')+'</small></article>').join('')+'</div>':
  '<p class="native-muted">Noch keine bestätigten Messungen. Fehlende Werte werden nicht als Null bewertet.</p>';
 const weekSummary=weeks.length?'<div class="native-profile-weeks">'+weeks.map(w=>
  '<article><b>'+e(w.week)+'</b><span>'+numberText(w.weekly_points)+' Wochenpunkte</span>'+
  '<small>'+e(w.verified_goal_days??0)+' von '+e(w.verified_days??0)+' bestätigten Zieltagen'+
  (w.uncertain_days?' · '+e(w.uncertain_days)+' unklar':'')+'</small></article>').join('')+'</div>':
  '<p class="native-muted">Noch kein VS-Wochenverlauf vorhanden.</p>';
 node.innerHTML='<section class="native-profile"><div class="native-profile-header">'+
  '<button type="button" class="native-back" data-native-member-close>← Alle Spieler</button>'+
  '<span class="native-profile-rank" aria-label="Allianzrang">'+e(member.rank||'?')+'</span>'+
  '<div class="native-profile-identity"><span class="native-kicker">SPIELERAKTE · '+e(member.status==='active'?'AKTIV':member.status==='former'?'ARCHIV':'STATUS UNGEKLÄRT')+'</span>'+
  '<h3>'+e(member.name||'Unbekannt')+'</h3><p>'+e(member.state_source==='registry'?'Verwalteter Rang':'Letzter importierter Rang')+
  (member.blacklisted?' · Manuell gesperrt':'')+'</p></div></div>'+
  (active.length?'<p class="native-absence-warning">Aktuell als abwesend eingetragen. Zugvorschläge berücksichtigen diesen Zeitraum.</p>':'')+
  (member.source_difference?'<p class="native-evidence-note">Abweichender Import: '+e(member.imported_rank||'Rang unbekannt')+' · '+e(member.source_status||'Status ungeklärt')+'. Der bestätigte Verwaltungsstand hat Vorrang.</p>':'')+
  '<h4 class="native-section-heading">Werte & Entwicklung</h4>'+metricHtml+
  '<details class="native-fold"><summary>VS-Erfolge & Wochen · '+weeks.length+'</summary>'+
   '<div class="native-fold-body">'+weekSummary+'</div></details>'+
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

function renderVs(target){
 const week=cache.vs.weeks.find(w=>w.week===target.querySelector('#native-vs-week').value)||cache.vs.weeks[0];
 const host=target.querySelector('#native-vs-body');
 if(!week){host.innerHTML='<p class="native-muted">Noch keine VS-Woche importiert.</p>';return}
 const labels=['Mo','Di','Mi','Do','Fr','Sa'];
 const members=week.members||[];
 const groups=[
  ['Unter Tagesziel · bestätigt',members.filter(m=>m.failed>0),'failed'],
  ['Nicht sicher erkennbar',members.filter(m=>m.unknown>0),'unknown'],
  ['Weitere Spieler',members.filter(m=>!m.failed&&!m.unknown),'verified']
 ];
 const groupMarkup=([name,players,kind])=>'<details class="native-fold native-vs-group" '+(kind==='failed'?'open':'')+'>'+
  '<summary><span>'+e(name)+'</span><b>'+players.length+'</b></summary><div class="native-fold-body">'+
  (players.length?'<div class="native-list">'+players.map(p=>'<details class="native-vs-player"><summary>'+e(p.name)+' · '+e(p.failed||0)+' unter Ziel / '+e(p.unknown||0)+' unklar</summary>'+
   '<div class="native-vs-player-days">'+(p.days||[]).map((d,i)=>'<span><b>'+labels[i%6]+'</b> '+
   (d.verified&&d.points!=null?e(Number(d.points).toLocaleString('de-DE')):'Unbekannt')+'</span>').join('')+'</div></details>').join('')+'</div>':
   '<p class="native-muted">In dieser Gruppe keine Spieler.</p>')+'</div></details>';
 host.innerHTML='<div class="native-vs-brief"><p class="native-muted">Nur bestätigte Werte zählen als über oder unter dem Tagesziel von 3,6 Mio. Unklare Ergebnisse werden nicht als Null gewertet.</p>'+
  cards([['Bestätigt unter Ziel',week.failedDays??0],['Unklar / OCR',week.unknownDays??0],['Alle 6 Tage erreicht',week.perfect??0],['Wichtige Prüffälle',week.priority??0]])+
  '<div class="native-weekdays" role="list" aria-label="Sechs Tage im Allianzduell">'+(week.dayTotals||[]).map(d=>{
   const label=labels[d.weekday]||'—';
   return '<div role="listitem" class="native-vs-day"><b>'+e(label)+'</b><span>'+e(d.passed??0)+' erreicht</span>'+
    '<span>'+e(d.failed??0)+' unter Ziel</span><small>'+e(d.unknown??0)+' unklar</small></div>';
  }).join('')+'</div>'+
  '<div class="native-vs-groups">'+groups.map(groupMarkup).join('')+'</div>'+
  '<div class="native-shortcuts"><button type="button" data-native-action="review-open">Unklare Werte prüfen</button>'+
  '<button type="button" data-native-action="member-find">Spielerakte öffnen</button></div></div>';
}
function renderTrain(target){
 const d=cache.trains,upcoming=(d.calendar||[]).filter(x=>x.date>=d.today).slice(0,7);
 const slot=x=>'<article class="native-train-item '+(x.date===d.today?'native-train-today':'')+'">'+
  '<div><span class="native-kicker">'+(x.date===d.today?'HEUTE':e(x.date))+' · '+e(x.type||'Zug')+'</span>'+
  '<strong>'+e(x.entry?.driver||'Noch kein Fahrer eingetragen')+'</strong>'+
  '<small>'+e(x.entry?.status||'Offen')+(x.entry?.linked===false?' · Zuordnung nicht verifiziert':'')+'</small></div>'+
  '<div class="native-train-actions"><button type="button" data-native-train="'+e(x.date)+'">'+(x.entry?'Bearbeiten':'Fahrer wählen')+'</button>'+
  (x.entry?.status==='planned'&&x.entry?.member_id&&(d.members||[]).some(m=>m.id===x.entry.member_id)?
   '<button type="button" data-native-copy-train="'+e(x.date)+'">Zugtext kopieren</button>':'')+'</div></article>';
 const toShow=upcoming.length?upcoming.map(slot).join(''):'<p class="native-muted">Für diese Woche liegen keine Zugdaten vor.</p>';
 target.querySelector('#native-train-body').innerHTML='<p class="native-muted">Fahrer ab R2 · historische Importe bleiben unverändert. Geplant, gefahren und noch nicht bestätigt sind unterschiedliche Zustände.</p>'+
  '<div class="native-train-highlights">'+cards([['Gefahren (Historie)',d.counts?.completed??'—'],['Geplant',d.counts?.planned??'—'],['Historische Lücken',d.counts?.missing_recent??'—']])+'</div>'+
  '<h3 class="native-section-heading">Heute & diese Woche</h3><div class="native-list native-train-week">'+toShow+'</div>'+
  '<div id="native-train-form"></div><details class="native-fold"><summary>Vergangene Züge · '+(d.history?.length||0)+'</summary>'+
  '<div class="native-fold-body native-list">'+(d.history||[]).slice(0,historyLimit).map(x=>
   '<button type="button" data-native-train="'+e(x.date)+'">'+e(x.date)+' · '+e(x.driver)+' '+marker(x.status)+'</button>').join('')+
  ((d.history||[]).length>historyLimit?'<button type="button" data-native-more="train">Weitere 20 Fahrten</button>':'')+
  '</div></details>';
}
function editTrain(target,date,allowDateChange=false){
 const d=cache.trains,entry=(d.history||[]).find(x=>x.date===date);
 const optionsList=options(d.members||[],entry?.member_id);
 const editor=target.querySelector('#native-train-form');
 if(!editor)return;
 editor.innerHTML='<form id="native-train-save" class="native-form native-fast-form"><h3>Zugfahrer · '+e(date)+'</h3>'+
  '<p class="native-form-help">Nur bestätigte Zuordnungen speichern. R1-Spieler sind keine Zugfahrer.</p>'+
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
 const d=cache.ops,entries=d[panel],names=new Map(d.members.map(m=>[m.id,m.name]));
 const title=x=>panel==='tasks'?x.title:panel==='absences'?(names.get(x.member_id)||'Unbekannt')+' · '+x.start_date+'–'+x.end_date:(x.event_type||'Event')+' · '+x.event_date;
 target.querySelector('#native-records').innerHTML=cards([[{tasks:'Aufgaben',absences:'Abwesenheiten',events:'Events'}[panel],entries.length]])+
  '<div class="native-list">'+entries.map(x=>'<button data-native-edit="'+e(x.id)+'"><strong>'+e(title(x))+'</strong><small>'+e(panel==='tasks'?x.status:panel==='events'?'Level '+(x.level??'?')+' · '+x.outcome:'Ersatz: '+(names.get(x.substitute_id)||'offen'))+'</small></button>').join('')+'</div>';
}
function editRecord(target,kind,id){
 const d=cache.ops,record=d[kind].find(x=>x.id===id)||{},select=(name)=>{
  // Tasks and covering/leading duties are limited to responsible R3–R5 players.
  const high=kind==='tasks'||name==='substitute_id'||name==='lead_id';
  return options(high?d.members.filter(m=>['R3','R4','R5'].includes(m.rank)):d.members,record[name]||'');
 };
 const fields={
  tasks:'<label>Aufgabe<input name="title" minlength="3" maxlength="160" required></label><label>Zuständig<select name="assignee_id">'+select('assignee_id')+'</select></label><label>Ersatz<select name="substitute_id">'+select('substitute_id')+'</select></label><label>Frist<input type="date" name="due_date"></label><label>Priorität<select name="priority"><option>normal</option><option>high</option><option>urgent</option><option>low</option></select></label><label>Status<select name="status"><option value="open">Offen</option><option value="in_progress">In Arbeit</option><option value="blocked">Blockiert</option><option value="done">Erledigt</option></select></label><label>Notiz<textarea name="description" maxlength="1000"></textarea></label>',
  absences:'<label>Abwesend<select name="member_id" required>'+select('member_id')+'</select></label><label>Ersatz<select name="substitute_id">'+select('substitute_id')+'</select></label><label>Beginn<input name="start_date" type="date" required></label><label>Ende<input name="end_date" type="date" required></label><label>Notiz<input name="note" maxlength="300"></label>',
  events:'<label>Event<select name="event_type"><option value="marshall_guard">Marshall Guard / Allianzübung</option><option value="zombie_siege">Zombie Siege</option><option value="desert_storm">Desert Storm</option></select></label><label>Datum<input name="event_date" type="date" required></label><label>Schwierigkeit / Level<input name="level" type="number" min="1" max="999" placeholder="Nur bestätigen, wenn bekannt"></label><label data-event-waves>Erreichte Wellen<input name="waves" type="number" min="0" max="999" placeholder="Tatsächlich erreichte Welle"></label><label>Verantwortlich<select name="lead_id">'+select('lead_id')+'</select></label><label>Ersatz<select name="substitute_id">'+select('substitute_id')+'</select></label><label>Teilnehmer (Anzahl)<input name="attendance" type="number" min="0" max="100" placeholder="Falls belegt"></label><label>Ergebnis<select name="outcome"><option value="scheduled">Geplant</option><option value="completed">Abgeschlossen</option><option value="failed">Nicht geschafft</option><option value="cancelled">Abgesagt</option></select></label><label>Notizen<input name="notes" maxlength="500" placeholder="Optional: Kampfbericht / Schwierigkeiten"></label><p class="native-form-help" data-event-guidance></p>'
 };
 const host=target.querySelector('#native-form');host.innerHTML='<form class="native-form" id="native-record-save" data-kind="'+kind+'" data-id="'+e(record.id||'')+'">'+fields[kind]+'<button type="submit">Speichern</button><button type="button" data-native-form-reload hidden>Aktuellen Stand laden</button><p id="native-form-message" role="status"></p></form>';
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
 const snapshotInfo=(data.profile?.current?.captured_at?'Stärke '+data.profile.current.captured_at.slice(0,10):'Stärke ohne Vergleich')+
  ' · '+(data.vs?.current?.week?'VS '+data.vs.current.week:'VS ohne Vergleich');
 host.innerHTML='<p class="native-muted">'+e(snapshotInfo)+' · Quellen sind unterschiedlich vollständig</p>'+
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
function editRegistry(target,id){
 const m=cache.registry.members.find(x=>x.id===id);if(!m)return;
 const ranks=['R1','R2','R3','R4','R5'];
 const host=target.querySelector('#registry-form');
 host.innerHTML='<form id="registry-save" class="native-form" data-id="'+e(id)+'" data-revision="'+e(m.revision)+'"><h3>'+e(m.name)+' verwalten</h3>'+
  '<label>Verwalteter Rang<select name="rank" required>'+(!m.rank?'<option value="" selected disabled>Rang verifizieren</option>':'')+ranks.map(x=>'<option '+(m.rank===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
  '<label>Status<select name="lifecycle" required>'+(m.lifecycle==='unverified'?'<option value="" selected disabled>Identität / Status verifizieren</option>':'')+'<option value="active" '+(m.lifecycle==='active'?'selected':'')+'>Aktiv</option><option value="former" '+(m.lifecycle==='former'?'selected':'')+'>Ehemalig / Archiv</option></select></label>'+
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
 return new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',dateStyle:'medium',timeStyle:'short'}).format(date);
}
const auditLabels={
 rank_override:'Rang',rank:'Rang',lifecycle:'Status',blacklisted:'Blacklist',
 title:'Titel',description:'Beschreibung',status:'Status',priority:'Priorität',due_date:'Frist',
 assignee_id:'Zuständig',substitute_id:'Vertretung',member_id:'Spieler-ID',
 date:'Datum',ride_date:'Zugdatum',driver_name:'Zugfahrer',note:'Notiz',
 event_type:'Event',event_date:'Eventdatum',level:'Level',waves:'Wellen',
 lead_id:'Leitung',attendance:'Teilnehmer',outcome:'Ergebnis',reason:'Begründung',
 revision:'Revision',updated_by:'Bearbeitet von'
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
function renderActivity(target,term){
 const matching=(cache.activity||[]).filter(x=>[x.actor,x.action,x.object_kind,x.object_id,x.before_json,x.after_json]
  .some(y=>String(y||'').toLowerCase().includes(term.toLowerCase())));
 const details=x=>{
  const changes=auditChanges(x);
  return '<details class="native-audit-entry"><summary><strong>'+e(x.actor||'Unbekannter Officer')+' · '+e(x.action||'Änderung')+
   '</strong><small>'+e(formatOfficerTime(x.at))+' · '+e(x.object_kind||'Objekt')+'</small></summary>'+
   '<div class="native-audit-body"><p class="native-muted">Objekt: '+e(x.object_id||'—')+'</p>'+
   (changes.length?'<div class="native-audit-diff">'+changes.map(d=>'<div><b>'+e(d.field)+'</b><span>'+e(d.before)+' → '+e(d.after)+'</span></div>').join('')+'</div>':
    '<p class="native-muted">Keine sicher lesbare Feldänderung in diesem Eintrag vorhanden.</p>')+
   '</div></details>';
 };
 target.querySelector('#activity-list').innerHTML='<p class="native-muted">'+matching.length+' verfügbare Einträge · Anzeige Europe/Berlin · keine geheimen Sitzungsdaten</p>'+
  '<div class="native-list">'+matching.slice(0,activityLimit).map(details).join('')+'</div>'+
  (matching.length>activityLimit?'<button type="button" data-native-more="activity">Weitere 30 Änderungen</button>':'');
}
// Evidence never receives a public URL. A protected Blob URL exists only for the
// current officer's in-memory session and is revoked on navigation/logout.
const reviewBlobUrls=new Map();
function clearReviewImages(){
 for(const url of reviewBlobUrls.values())try{URL.revokeObjectURL(url)}catch{}
 reviewBlobUrls.clear();
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
 const batch=target.querySelector('#review-batch-native')?.value||'';
 const kind=target.querySelector('#review-kind-native')?.value||'';
 const list=(cache.reviews||[]).filter(x=>(!batch||x.source_batch===batch)&&(!kind||x.kind===kind)&&
  [x.source_name,x.category,x.metric,x.note,x.source_batch].some(y=>String(y||'').toLowerCase().includes(String(term).toLowerCase())));
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
     (linked?'<small>Privat hinterlegt · überprüfe die Anzeige vor dem Speichern.</small>':
      '<label>Screenshot diesem Auftrag zuordnen<input type="file" data-native-review-file accept="image/png,image/jpeg,image/webp"></label>'+
      '<button type="button" data-native-review-upload>Beleg sicher hochladen</button>')+
    '</div><div class="native-review-entry">'+
     '<small>OCR erkannt: '+e(x.source_value??'unbekannt')+'</small>'+
     (identity?'<label>Spieler suchen<input type="search" data-native-review-search autocomplete="off" placeholder="Name eingeben"></label>'+
      '<input type="hidden" data-native-review-member><div class="native-review-people"></div>'+
      '<p class="native-review-selection" role="status">Noch kein Spieler ausgewählt.</p>':
      numeric?'<label>Richtigen Wert eingeben<input inputmode="numeric" type="text" autocomplete="off" data-native-review-value maxlength="18" placeholder="Zahl vom Screenshot ablesen"></label>':
      '<p class="native-evidence-note">Dieser Falltyp benötigt eine gesonderte fachliche Prüfung.</p>')+
     '<label>Prüfnotiz<input type="text" data-native-review-reason maxlength="500" placeholder="Was wurde am Bild bestätigt?" value="Screenshot manuell geprüft"></label>'+
     '<div class="native-review-controls">'+
      '<button type="button" class="native-game-primary" data-native-review-resolve="approve" '+(!linked||(!identity&&!numeric)||Boolean(x.context?.warning)?'disabled':'')+'>Korrektur speichern</button>'+
      '<button type="button" data-native-review-resolve="dismiss">Ohne Korrektur schließen</button></div>'+
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
async function attachReviewScreenshot(card){
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
  return;
 }
 await view(mount);
}
export function initNativeAdmin(mount){
 if(mount.dataset.nativeReady)return;
 mount.dataset.nativeReady='1';
 mount.addEventListener('click',async event=>{
  const button=event.target.closest('[data-officer-tab],[data-officer-logout],[data-native-member],[data-native-more],[data-native-train],[data-native-new],[data-native-edit],[data-native-refresh],[data-registry-edit],[data-registry-reload],[data-native-action],[data-native-manage],[data-native-member-log],[data-native-member-close],[data-native-add-absence],[data-native-form-reload],[data-native-copy-train],[data-native-event-quick],[data-native-watch-person],[data-native-diplomacy-new],[data-native-diplomacy-edit],[data-native-diplomacy-cancel],[data-native-diplomacy-reload],[data-native-registry-filter],[data-native-review-pick],[data-native-review-upload],[data-native-review-resolve]');
  if(!button)return;
  if(button.hasAttribute('data-officer-logout')){
   try{await request('/api/native-logout',{method:'POST',body:{}})}catch{}clearOfficer();await renderNativeAdmin(mount);return;
  }
  if(button.dataset.officerTab){panel=button.dataset.officerTab;pageLimit=20;historyLimit=20;activityLimit=30;await view(mount);return}
  if(button.dataset.nativeAction){
   const action=button.dataset.nativeAction;
   panel=({ 'train-today':'train','event-planning':'events','member-find':'members','review-open':'reviews','tasks-open':'tasks'})[action]||'overview';
   pageLimit=20;historyLimit=20;await view(mount);
   const destination=mount.querySelector('#native-admin-content');
   if(action==='train-today'&&cache.trains?.today&&Array.isArray(cache.trains.history))editTrain(destination,cache.trains.today);
   if(action==='event-planning'&&cache.ops?.events)editRecord(destination,'events','');
   if(action==='member-find')destination.querySelector('#native-member-search')?.focus();
   return;
  }
  if(button.hasAttribute('data-native-refresh')){await view(mount);return}
  if(button.hasAttribute('data-native-form-reload')){
   if(window.confirm('Aktuellen Stand laden und ungespeicherte Eingaben verwerfen?'))await view(mount);
   return;
  }
  const target=mount.querySelector('#native-admin-content');if(!target)return;
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
  if(button.dataset.registryEdit){editRegistry(target,button.dataset.registryEdit);return}
  if(button.dataset.nativeMember){await showPerson(target,button.dataset.nativeMember);return}
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
  if(button.dataset.nativeTrain){editTrain(target,button.dataset.nativeTrain);return}
  if(button.dataset.nativeNew==='train'){editTrain(target,cache.trains?.today||new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date()),true);return}
  if(button.dataset.nativeNew||button.dataset.nativeEdit){editRecord(target,panel,button.dataset.nativeEdit||'');return}
 });
 mount.addEventListener('input',event=>{
  if(event.target.id==='native-member-search'){pageLimit=20;renderMembers(mount.querySelector('#native-admin-content'),event.target.value)}
  if(event.target.id==='registry-search'){pageLimit=20;renderRegistry(mount.querySelector('#native-admin-content'),event.target.value)}
  if(event.target.id==='native-diplomacy-search')renderDiplomacy(mount.querySelector('#native-admin-content'),event.target.value);
  if(event.target.id==='activity-search')renderActivity(mount.querySelector('#native-admin-content'),event.target.value);
  if(event.target.id==='review-search-native'){historyLimit=20;renderReviews(mount.querySelector('#native-admin-content'),event.target.value)}
  if(event.target.matches('[data-native-review-search]')){
   const card=event.target.closest('.native-review-card');
   if(card)reviewMemberOptions(card,event.target.value);
  }
 });
 mount.addEventListener('change',event=>{if(event.target.name==='event_type'&&event.target.closest('#native-record-save'))updateEventForm(event.target.form);if(event.target.id==='native-vs-week')renderVs(mount.querySelector('#native-admin-content'));if(['review-batch-native','review-kind-native'].includes(event.target.id)){historyLimit=20;const target=mount.querySelector('#native-admin-content');renderReviews(target,target.querySelector('#review-search-native')?.value||'')}});
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
