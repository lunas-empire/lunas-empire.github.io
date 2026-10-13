/** Native Luna officer workspace. Private data is held only in a live memory token. */
import {ALLIANCE_CONFIG} from './config.js';
import {icon} from './icons.js';
const apiBase=ALLIANCE_CONFIG.commandCenterEmbedUrl.replace('/?embed=1','');
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let sessionToken='',officer=null,panel='overview',cache={},pageLimit=20,historyLimit=20;
export function clearOfficer(){sessionToken='';officer=null;cache={};}
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
 ['reviews','Werte prüfen'],['registry','Ränge & Archiv'],
 ['tasks','Aufgaben'],['absences','Abwesenheiten'],['events','Events'],
 ['activity','Admin-Log']
];
const parentPanel=key=>({
 overview:'overview',vs:'vs',reviews:'vs',members:'members',registry:'members',
 train:'train',tasks:'train',absences:'train',events:'train',activity:'activity'
}[key]||'overview');
const sectionPanels={
 vs:[['vs','VS-Duell'],['reviews','Werte prüfen']],
 members:[['members','Spielerakten'],['registry','Ränge & Archiv']],
 train:[['train','Züge'],['events','Events'],['tasks','Aufgaben'],['absences','Abwesenheiten']]
};
const navButton=([key,label],cls='')=>'<button type="button" class="'+cls+'" data-officer-tab="'+key+'" '+(panel===key?'aria-current="page"':'')+'>'+e(label)+'</button>';
function nav(){
 const parent=parentPanel(panel);
 return '<nav class="native-admin-nav" aria-label="Command Center Hauptbereiche">'+
  primaryPanels.map(([key,label,art])=>'<button type="button" class="native-primary-tab" data-officer-tab="'+key+'" '+(parent===key?'aria-current="page"':'')+'>'+icon(art,'native-tab-icon')+'<span>'+e(label)+'</span></button>').join('')+
  '<details class="native-admin-more" '+(parent==='activity'?'open':'')+'><summary aria-label="Weitere Offizierswerkzeuge">Mehr</summary><div class="native-more-menu">'+
  secondaryPanels.map(pair=>navButton(pair)).join('')+'</div></details></nav>'+
  (sectionPanels[parent]?'<nav class="native-admin-subnav" aria-label="Unterbereiche">'+sectionPanels[parent].map(pair=>navButton(pair)).join('')+'</nav>':'');
}
function cards(items){return '<div class="native-cards">'+items.map(([name,value,sub])=>'<article><small>'+e(name)+'</small><strong>'+e(value)+'</strong><span>'+e(sub||'')+'</span></article>').join('')+'</div>'}
function marker(status){return '<span class="native-status">'+e(status||'Unbekannt')+'</span>'}
async function view(mount){
 const header='<header class="native-admin-top"><div class="native-command-identity"><span class="native-command-emblem" aria-hidden="true">'+icon('hero','native-emblem-icon')+'</span><div><span class="admin-eyebrow">RZSN · SERVER 2261 · OFFIZIERSZUGANG</span><h1>Allianz-Kommando</h1><p>Planen · Prüfen · Koordinieren</p></div></div><div class="native-officer-controls"><span class="native-officer-badge">'+e(officer?.role||'Offizier')+' · '+e(officer?.name||'')+'</span><button type="button" data-officer-logout>Abmelden</button></div></header>';
 mount.innerHTML='<section class="native-admin">'+header+nav()+'<div class="native-admin-content" id="native-admin-content"><p>Daten werden geladen …</p></div></section>';
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
   target.innerHTML='<div class="native-row"><h2>Mitgliederverwaltung</h2><input id="registry-search" type="search" placeholder="Spieler suchen"></div>'+cards([['Aktiv',cache.registry.counts.active],['Archiv',cache.registry.counts.former],['Blacklist',cache.registry.counts.blacklisted]])+'<div id="registry-list"></div><div id="registry-form"></div>';renderRegistry(target,'');
  }else if(panel==='activity'){
   cache.activity=await request('/api/activity?limit=200');
   target.innerHTML='<div class="native-row"><h2>Admin-Aktivitäten</h2><input id="activity-search" type="search" placeholder="Admin, Aktion, Spieler"></div><div id="activity-list"></div>';renderActivity(target,'');
  }else if(panel==='reviews'){
   cache.reviews=await request('/api/reviews?status=open');
   const batches=[...new Set(cache.reviews.map(x=>x.source_batch).filter(Boolean))].sort();
   target.innerHTML='<div class="native-row"><h2>OCR-Prüfung</h2><input id="review-search-native" type="search" placeholder="Spieler oder Fall suchen"></div>'+
    '<p class="native-muted">Original-Screenshots werden noch privat zugeordnet. Kein Prüfwert wird ohne Bildbeleg freigegeben.</p>'+
    '<div class="native-row"><label>Quelle <select id="review-batch-native"><option value="">Alle Wochen und Profile</option>'+batches.map(b=>'<option value="'+e(b)+'">'+e(b)+'</option>').join('')+'</select></label>'+
    '<label>Prüftyp <select id="review-kind-native"><option value="">Alle</option><option value="vs_day">VS-Tageswert</option><option value="identity">Identität</option><option value="profile">Profilwert</option></select></label></div>'+
    '<div id="review-list-native"></div>';renderReviews(target,'');
  }else if(panel==='members'){
   const list=await request('/api/members');
   cache.members=list;
   target.innerHTML='<div class="native-row"><h2>Spielerübersicht</h2><input id="native-member-search" type="search" placeholder="Spieler suchen" autocomplete="off"></div>'+
    '<p class="native-muted">Wähle einen Spieler für die vollständige Akte. Es werden anfangs nur 20 gezeigt.</p><div id="native-member-list"></div>';
   renderMembers(target,'');
  }else if(panel==='vs'){
   const data=await request('/api/vs-intelligence');cache.vs=data;
   target.innerHTML='<div class="native-row"><h2>VS Intelligence</h2><select id="native-vs-week">'+data.weeks.map(w=>'<option value="'+e(w.week)+'">'+e(w.week)+'</option>').join('')+'</select></div>'+
    '<div id="native-vs-body"></div>';renderVs(target);
  }else if(panel==='train'){
   cache.trains=await request('/api/train-manager');
   target.innerHTML='<div class="native-row"><h2>Zugmanager</h2><button data-native-new="train">+ Fahrer / Datum</button></div><div id="native-train-body"></div>';renderTrain(target);
  }else if(['tasks','absences','events'].includes(panel)){
   cache.ops=await request('/api/operations');
   target.innerHTML='<div class="native-row"><h2>'+({tasks:'Admin-Aufgaben',absences:'Abwesenheiten & Vertretung',events:'Allianz-Events'}[panel])+'</h2><button data-native-new="'+panel+'">+ Eintragen</button></div><div id="native-form"></div><div id="native-records"></div>';
   renderRecords(target);
  }
 }catch(err){target.innerHTML='<p class="native-error" role="alert">'+e(err.message)+'</p><button data-native-refresh>Erneut laden</button>'}
}
function renderMembers(target,query){
 const list=cache.members.filter(m=>m.name.toLowerCase().includes(query.toLowerCase()));
 target.querySelector('#native-member-list').innerHTML='<p class="native-muted">'+list.length+' Spieler gefunden</p><div class="native-list">'+list.slice(0,pageLimit).map(m=>
  '<button data-native-member="'+e(m.id)+'"><strong>'+e(m.name)+'</strong><small>'+e(m.rank||'?')+' · Power '+e(m.power?.toLocaleString('de-DE')??'unbekannt')+'</small></button>').join('')+'</div>'+
  (list.length>pageLimit?'<button data-native-more="members">Weitere 20 Spieler</button>':'')+'<div id="native-person"></div>';
}
async function showPerson(target,id){
 const p=await request('/api/member/'+encodeURIComponent(id));
 const s=p.stats.filter((x,i,a)=>a.findIndex(y=>x.metric===y.metric)===i);
 const node=target.querySelector('#native-person');
 node.innerHTML='<details class="native-fold" open><summary>'+e(p.member.name)+' · Spielerakte</summary><div class="native-fold-body">'+
  '<p>Verwalteter Rang: '+e(p.member.rank||'Unbekannt')+' · Status: '+e(p.member.status)+(p.member.blacklisted?' · BLACKLIST':'')+'</p>'+
  '<p>Datenquelle: '+(p.member.state_source==='registry'?'Mitgliederverwaltung · '+e(p.member.registry_updated_at)+' · '+e(p.member.registry_updated_by):'Import')+'</p>'+
  (p.member.source_difference?'<p role="status">Abweichender Import: '+e(p.member.imported_rank||'Unbekannt')+' · '+e(p.member.source_status)+'. Die manuelle Verwaltung bleibt wirksam.</p>':'')+
  cards(s.slice(0,8).map(x=>[x.metric.replaceAll('_',' '),['observed','corrected'].includes(x.quality)?Number(x.value).toLocaleString('de-DE'):'?',x.quality]))+
  '<details class="native-fold"><summary>VS Verlauf</summary><div class="native-fold-body">'+p.weeks.map(w=>'<p>'+e(w.week)+': '+e(w.verified_goal_days)+' / '+e(w.verified_days)+' bestätigte Zieltage</p>').join('')+'</div></details></div></details>';
 node.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function renderVs(target){
 const week=cache.vs.weeks.find(w=>w.week===target.querySelector('#native-vs-week').value)||cache.vs.weeks[0];
 target.querySelector('#native-vs-body').innerHTML=week?cards([['Verifiziert unter Ziel',week.failedDays],['Unklar / OCR',week.unknownDays],['6/6 geschafft',week.perfect],['Priorität 3+',week.priority]])+
  '<div class="native-weekdays">'+week.dayTotals.map(d=>'<div><b>'+['Mo','Di','Mi','Do','Fr','Sa'][d.weekday]+'</b><span>'+d.passed+' erreicht</span><span>'+d.failed+' unter Ziel</span><small>'+d.unknown+' unklar</small></div>').join('')+'</div>'+
  '<details class="native-fold"><summary>'+week.members.length+' Spieler-Tageswerte anzeigen</summary><div class="native-fold-body"><div class="native-list">'+week.members.map(p=>'<details><summary>'+e(p.name)+' · '+p.failed+' unter Ziel / '+p.unknown+' unklar</summary><p>'+p.days.map((d,i)=>['Mo','Di','Mi','Do','Fr','Sa'][i]+': '+(d.verified?Number(d.points).toLocaleString('de-DE'):'Unklar')).join(' · ')+'</p></details>').join('')+'</div></div></details>':
  '<p>Keine VS-Wochen vorhanden.</p>';
}
function renderTrain(target){
 const d=cache.trains,upcoming=d.calendar.filter(x=>x.date>=d.today).slice(0,7);
 target.querySelector('#native-train-body').innerHTML=cards([['Gefahren',d.counts.completed],['Geplant',d.counts.planned],['Offene Tage',d.counts.missing_recent]])+
  '<div class="native-list">'+upcoming.map(x=>'<article class="native-train-item"><div><strong>'+e(x.date)+' · '+e(x.type)+'</strong><small>'+e(x.entry?.driver||'Noch offen')+'</small></div><button data-native-train="'+e(x.date)+'">Bearbeiten</button></article>').join('')+'</div>'+
  '<div id="native-train-form"></div><details class="native-fold"><summary>Vergangene Züge ('+d.history.length+')</summary><div class="native-fold-body native-list">'+d.history.slice(0,historyLimit).map(x=>'<button data-native-train="'+e(x.date)+'">'+e(x.date)+' · '+e(x.driver)+' '+marker(x.status)+'</button>').join('')+(d.history.length>historyLimit?'<button data-native-more="train">Weitere 20 Fahrten</button>':'')+'</div></details>';
}
function editTrain(target,date){
 const d=cache.trains,entry=d.history.find(x=>x.date===date);
 const optionsList=options(d.members,entry?.member_id);
 const editor=target.querySelector('#native-train-form');
 editor.innerHTML='<form id="native-train-save" class="native-form"><h3>Fahrer · '+e(date)+'</h3><label>Datum<input name="date" type="date" value="'+e(date)+'" required></label>'+
  '<label>Fahrer aus Allianz<select name="member_id">'+optionsList+'</select></label><label>Oder manueller Name<input name="driver_name" maxlength="80" value="'+e(entry?.member_id?'':entry?.driver||'')+'"></label>'+
  '<label>Status<select name="status">'+[['planned','Geplant'],['completed','Gefahren'],['cancelled','Abgesagt']].map(([v,l])=>'<option value="'+v+'" '+(v===(entry?.status||'planned')?'selected':'')+'>'+l+'</option>').join('')+'</select></label>'+
  '<label>Notiz<input name="note" maxlength="300" value="'+e(entry?.note||'')+'"></label><button type="submit">Speichern</button><p id="native-form-message"></p></form>';
 editor.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function renderRecords(target){
 const d=cache.ops,entries=d[panel],names=new Map(d.members.map(m=>[m.id,m.name]));
 const title=x=>panel==='tasks'?x.title:panel==='absences'?(names.get(x.member_id)||'Unbekannt')+' · '+x.start_date+'–'+x.end_date:(x.event_type||'Event')+' · '+x.event_date;
 target.querySelector('#native-records').innerHTML=cards([[{tasks:'Aufgaben',absences:'Abwesenheiten',events:'Events'}[panel],entries.length]])+
  '<div class="native-list">'+entries.map(x=>'<button data-native-edit="'+e(x.id)+'"><strong>'+e(title(x))+'</strong><small>'+e(panel==='tasks'?x.status:panel==='events'?'Level '+(x.level??'?')+' · '+x.outcome:'Ersatz: '+(names.get(x.substitute_id)||'offen'))+'</small></button>').join('')+'</div>';
}
function editRecord(target,kind,id){
 const d=cache.ops,record=d[kind].find(x=>x.id===id)||{},select=(name)=>options(d.members,record[name]||'');
 const fields={
  tasks:'<label>Aufgabe<input name="title" minlength="3" maxlength="160" required></label><label>Zuständig<select name="assignee_id">'+select('assignee_id')+'</select></label><label>Ersatz<select name="substitute_id">'+select('substitute_id')+'</select></label><label>Frist<input type="date" name="due_date"></label><label>Priorität<select name="priority"><option>normal</option><option>high</option><option>urgent</option><option>low</option></select></label><label>Status<select name="status"><option value="open">Offen</option><option value="in_progress">In Arbeit</option><option value="blocked">Blockiert</option><option value="done">Erledigt</option></select></label><label>Notiz<textarea name="description" maxlength="1000"></textarea></label>',
  absences:'<label>Abwesend<select name="member_id" required>'+select('member_id')+'</select></label><label>Ersatz<select name="substitute_id">'+select('substitute_id')+'</select></label><label>Beginn<input name="start_date" type="date" required></label><label>Ende<input name="end_date" type="date" required></label><label>Notiz<input name="note" maxlength="300"></label>',
  events:'<label>Event<select name="event_type"><option value="marshall_guard">Marshall Guard</option><option value="zombie_siege">Zombie Siege</option><option value="desert_storm">Desert Storm</option></select></label><label>Datum<input name="event_date" type="date" required></label><label>Level<input name="level" type="number" min="1" max="999"></label><label>Wellen<input name="waves" type="number" min="0" max="999"></label><label>Verantwortlich<select name="lead_id">'+select('lead_id')+'</select></label><label>Ersatz<select name="substitute_id">'+select('substitute_id')+'</select></label><label>Teilnehmer<input name="attendance" type="number" min="0" max="100"></label><label>Ergebnis<select name="outcome"><option value="scheduled">Geplant</option><option value="completed">Erfolgreich</option><option value="failed">Nicht geschafft</option><option value="cancelled">Abgesagt</option></select></label><label>Notizen<input name="notes" maxlength="500"></label>'
 };
 const host=target.querySelector('#native-form');host.innerHTML='<form class="native-form" id="native-record-save" data-kind="'+kind+'" data-id="'+e(record.id||'')+'">'+fields[kind]+'<button type="submit">Speichern</button><p id="native-form-message"></p></form>';
 const form=host.firstElementChild;
 for(const [key,value] of Object.entries(record)){if(form.elements.namedItem(key))form.elements.namedItem(key).value=value??''}
 form.scrollIntoView({behavior:'smooth',block:'nearest'});
}
async function saveForm(mount,form){
 const kind=form.dataset.kind;const body={};for(const [k,v] of new FormData(form))body[k]=v===''?null:['level','waves','attendance'].includes(k)?Number(v):v;
 if(form.dataset.id)body.id=form.dataset.id;
 const action=kind==='train'?'train-assignments':'operations/'+kind;
 if(kind==='train'){
  const item=cache.trains.history.find(x=>x.date===body.date);
  body.expected_revision=item?.revision||0;
 }
 const submit=form.querySelector('[type=submit]');submit.disabled=true;
 try{
  await request('/api/'+action,{method:'POST',body});
  await view(mount);
 }catch(err){
  form.querySelector('#native-form-message').textContent='Nicht gespeichert: '+err.message;
  submit.disabled=false;
 }
}
function renderRegistry(target,query){
 const list=cache.registry.members.filter(x=>(x.name+' '+x.rank+' '+x.lifecycle).toLowerCase().includes(query.toLowerCase()));
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
function renderActivity(target,term){
 const matching=cache.activity.filter(x=>[x.actor,x.action,x.object_kind,x.object_id,x.before_json,x.after_json].some(y=>String(y||'').toLowerCase().includes(term.toLowerCase())));
 target.querySelector('#activity-list').innerHTML='<p class="native-muted">'+matching.length+' Einträge · Zeiten Europe/Berlin</p><div class="native-list">'+matching.map(x=>'<details><summary><strong>'+e(x.actor)+' · '+e(x.action)+'</strong><small>'+e(new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'medium',timeZone:'Europe/Berlin'}).format(new Date(x.at.replace(' ','T')+'Z')))+'</small></summary><p>Objekt: '+e(x.object_kind)+' · '+e(x.object_id)+'</p><p>Vorher: '+e(x.before_json||'—')+'</p><p>Nachher: '+e(x.after_json||'—')+'</p></details>').join('')+'</div>';
}
function renderReviews(target,term){
 const batch=target.querySelector('#review-batch-native')?.value||'';
 const kind=target.querySelector('#review-kind-native')?.value||'';
 const list=cache.reviews.filter(x=>(!batch||x.source_batch===batch)&&(!kind||x.kind===kind)&&
  [x.source_name,x.category,x.metric,x.note,x.source_batch].some(y=>String(y||'').toLowerCase().includes(term.toLowerCase())));
 const categories={};cache.reviews.forEach(x=>{categories[x.category]=(categories[x.category]||0)+1});
 const names={vs_uncertain:'VS-Wert unklar',inferred:'Geschätzter Wert',unmatched_name:'Name nicht zugeordnet',
  historical_identity:'Historische Identität',missing:'Wert fehlt',ocr_alert:'OCR-Auffälligkeit'};
 target.querySelector('#review-list-native').innerHTML=cards([['Offene Prüfungen',cache.reviews.length],
  ['Gefilterte Fälle',list.length],['VS unklar',categories.vs_uncertain||0],['Profilwerte',cache.reviews.filter(x=>x.kind==='profile').length]])+
  '<p class="native-muted">Status: '+Object.entries(categories).map(([key,n])=>e(names[key]||key)+' '+n).join(' · ')+'</p>'+
  '<div class="native-list">'+list.slice(0,historyLimit).map(x=>'<details><summary><strong>'+e(x.source_name||'Unbekannt')+' · '+e(x.metric||'')+'</strong><small>'+e(names[x.category]||x.category)+' · '+e(x.source_batch||'')+'</small></summary>'+
  '<p>'+e(x.note||'')+'</p><p>Erkannt: '+e(x.source_value??'unbekannt')+'</p>'+
  (x.context?.date?'<p>Spieltag: '+e(x.context.date)+'</p>':'')+
  '<p class="native-muted">Originalbild noch nicht online verknüpft. Keine Freigabe ohne Beleg.</p></details>').join('')+'</div>'+
  (list.length>historyLimit?'<button data-native-more="reviews">Weitere Fälle</button>':'');
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
  const button=event.target.closest('[data-officer-tab],[data-officer-logout],[data-native-member],[data-native-more],[data-native-train],[data-native-new],[data-native-edit],[data-native-refresh],[data-registry-edit],[data-registry-reload],[data-native-action],[data-native-manage]');
  if(!button)return;
  if(button.hasAttribute('data-officer-logout')){
   try{await request('/api/native-logout',{method:'POST',body:{}})}catch{}clearOfficer();await renderNativeAdmin(mount);return;
  }
  if(button.dataset.officerTab){panel=button.dataset.officerTab;pageLimit=20;historyLimit=20;await view(mount);return}
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
  const target=mount.querySelector('#native-admin-content');if(!target)return;
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
  if(button.dataset.registryEdit){editRegistry(target,button.dataset.registryEdit);return}
  if(button.dataset.nativeMember){await showPerson(target,button.dataset.nativeMember);return}
  if(button.dataset.nativeMore==='members'){pageLimit+=20;renderMembers(target,target.querySelector('#native-member-search')?.value||'');return}
  if(button.dataset.nativeMore==='train'){historyLimit+=20;renderTrain(target);return}
  if(button.dataset.nativeMore==='registry'){pageLimit+=20;renderRegistry(target,target.querySelector('#registry-search')?.value||'');return}
  if(button.dataset.nativeMore==='reviews'){historyLimit+=20;renderReviews(target,target.querySelector('#review-search-native')?.value||'');return}
  if(button.dataset.nativeTrain){editTrain(target,button.dataset.nativeTrain);return}
  if(button.dataset.nativeNew==='train'){editTrain(target,cache.trains?.today||new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date()));return}
  if(button.dataset.nativeNew||button.dataset.nativeEdit){editRecord(target,panel,button.dataset.nativeEdit||'');return}
 });
 mount.addEventListener('input',event=>{
  if(event.target.id==='native-member-search'){pageLimit=20;renderMembers(mount.querySelector('#native-admin-content'),event.target.value)}
  if(event.target.id==='registry-search'){pageLimit=20;renderRegistry(mount.querySelector('#native-admin-content'),event.target.value)}
  if(event.target.id==='activity-search')renderActivity(mount.querySelector('#native-admin-content'),event.target.value);
  if(event.target.id==='review-search-native'){historyLimit=20;renderReviews(mount.querySelector('#native-admin-content'),event.target.value)}
 });
 mount.addEventListener('change',event=>{if(event.target.id==='native-vs-week')renderVs(mount.querySelector('#native-admin-content'));if(['review-batch-native','review-kind-native'].includes(event.target.id)){historyLimit=20;const target=mount.querySelector('#native-admin-content');renderReviews(target,target.querySelector('#review-search-native')?.value||'')}});
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
