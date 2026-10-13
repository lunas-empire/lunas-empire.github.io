/** Native Luna officer workspace. Private data is held only in a live memory token. */
import {ALLIANCE_CONFIG} from './config.js';
const apiBase=ALLIANCE_CONFIG.commandCenterEmbedUrl.replace('/?embed=1','');
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let sessionToken='',officer=null,panel='overview',cache={},pageLimit=20,historyLimit=20;
export function clearOfficer(){sessionToken='';officer=null;cache={};}
export const hasOfficer=()=>Boolean(sessionToken);
async function request(path,options={}){
 const headers={'Accept':'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...(sessionToken?{'Authorization':'Bearer '+sessionToken}:{})};
 const response=await fetch(apiBase+path,{method:options.method||'GET',headers,body:options.body?JSON.stringify(options.body):undefined,mode:'cors',credentials:'omit',cache:'no-store'});
 let result;try{result=await response.json()}catch{throw Error('Die Cloudflare-API antwortet nicht korrekt.')}
 if(!response.ok){if(response.status===401&&path!=='/api/native-login')clearOfficer();throw Error(result.error||'HTTP '+response.status)}
 return result;
}
const options=(members,value='')=>'<option value="">Nicht besetzt</option>'+members.map(m=>'<option value="'+e(m.id)+'" '+(m.id===value?'selected':'')+'>'+e(m.name)+' · '+e(m.rank)+'</option>').join('');
function nav(){
 return '<nav class="native-admin-nav" aria-label="Offiziersbereiche">'+[['overview','Cockpit'],['members','Spieler'],['vs','VS'],['train','Züge'],['tasks','Aufgaben'],['absences','Abwesenheit'],['events','Events'],['reviews','OCR-Prüfung'],['registry','Archiv & Ränge'],['activity','Admin-Log']].map(([key,text])=>'<button type="button" data-officer-tab="'+key+'" '+(panel===key?'aria-current="page"':'')+'>'+text+'</button>').join('')+'</nav>';
}
function cards(items){return '<div class="native-cards">'+items.map(([name,value,sub])=>'<article><small>'+e(name)+'</small><strong>'+e(value)+'</strong><span>'+e(sub||'')+'</span></article>').join('')+'</div>'}
function marker(status){return '<span class="native-status">'+e(status||'Unbekannt')+'</span>'}
async function view(mount){
 const header='<div class="native-admin-top"><div><span class="admin-eyebrow">RZSN · SECURE OFFICER DESK</span><h1>Command Center</h1><p>Hallo '+e(officer?.name)+'. Deine Änderungen werden in Cloudflare protokolliert.</p></div><button type="button" data-officer-logout>Abmelden</button></div>';
 mount.innerHTML='<section class="native-admin">'+header+nav()+'<div class="native-admin-content" id="native-admin-content"><p>Daten werden geladen …</p></div></section>';
 const target=mount.querySelector('#native-admin-content');
 try{
  if(panel==='overview'){
   const [summary,ops,trains]=await Promise.all([request('/api/overview'),request('/api/operations'),request('/api/train-manager')]);
   cache.ops=ops;cache.trains=trains;
   const pending=ops.tasks.filter(x=>x.status!=='done'),missing=trains.counts.missing_recent;
   target.innerHTML=cards([['Aktive Spieler',summary.active],['OCR zur Prüfung',summary.reviews],['Offene Aufgaben',pending.length],['Unbesetzte Zugtage',missing]])+
    '<details class="native-fold" open><summary>Dringend & als Nächstes</summary><div class="native-fold-body">'+
    (pending.length?pending.slice(0,6).map(t=>'<p>'+e(t.title)+' '+marker(t.priority)+'</p>').join(''):'<p>Keine offenen Aufgaben erfasst.</p>')+
    '<p>'+missing+' fehlende Zugtage der letzten 14 Tage.</p></div></details>'+
    '<div class="native-shortcuts"><button data-officer-tab="tasks">Aufgaben verwalten</button><button data-officer-tab="train">Zugplanung</button><button data-officer-tab="events">Eventlevel erfassen</button></div>';
  }else if(panel==='registry'){
   cache.registry=await request('/api/member-registry');
   target.innerHTML='<div class="native-row"><h2>Mitgliederverwaltung</h2><input id="registry-search" type="search" placeholder="Spieler suchen"></div>'+cards([['Aktiv',cache.registry.counts.active],['Archiv',cache.registry.counts.former],['Blacklist',cache.registry.counts.blacklisted]])+'<div id="registry-list"></div><div id="registry-form"></div>';renderRegistry(target,'');
  }else if(panel==='activity'){
   cache.activity=await request('/api/activity?limit=200');
   target.innerHTML='<div class="native-row"><h2>Admin-Aktivitäten</h2><input id="activity-search" type="search" placeholder="Admin, Aktion, Spieler"></div><div id="activity-list"></div>';renderActivity(target,'');
  }else if(panel==='reviews'){
   cache.reviews=await request('/api/reviews?status=open');
   target.innerHTML='<div class="native-row"><h2>OCR-Prüfung</h2><input id="review-search-native" type="search" placeholder="Fall suchen"></div><p class="native-muted">Original-Screenshots sind derzeit nicht zugeordnet. Prüfwerte bleiben unbearbeitet, bis Bildbelege verknüpft wurden.</p><div id="review-list-native"></div>';renderReviews(target,'');
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
 node.innerHTML='<details class="native-fold" open><summary>'+e(p.member.name)+' · Spielerakte</summary><div class="native-fold-body">'+cards(s.slice(0,8).map(x=>[x.metric.replaceAll('_',' '),['observed','corrected'].includes(x.quality)?Number(x.value).toLocaleString('de-DE'):'?',x.quality]))+
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
 host.innerHTML='<form id="registry-save" class="native-form" data-id="'+e(id)+'"><h3>'+e(m.name)+' verwalten</h3>'+
  '<label>Verwalteter Rang<select name="rank">'+ranks.map(x=>'<option '+(m.rank===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
  '<label>Status<select name="lifecycle"><option value="active" '+(m.lifecycle==='active'?'selected':'')+'>Aktiv</option><option value="former" '+(m.lifecycle==='former'?'selected':'')+'>Ehemalig / Archiv</option></select></label>'+
  '<label class="native-check"><input type="checkbox" name="blacklisted" '+(m.blacklisted?'checked':'')+'>Manuelle Blacklist</label>'+
  '<label>Begründung<input name="reason" maxlength="500" value="'+e(m.reason)+'" placeholder="Bei Archivierung oder Blacklist erforderlich"></label>'+
  '<button type="submit">Änderung protokolliert speichern</button><p id="native-form-message"></p></form>';
 host.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function renderActivity(target,term){
 const matching=cache.activity.filter(x=>[x.actor,x.action,x.object_kind,x.object_id,x.before_json,x.after_json].some(y=>String(y||'').toLowerCase().includes(term.toLowerCase())));
 target.querySelector('#activity-list').innerHTML='<p class="native-muted">'+matching.length+' Einträge · Zeiten Europe/Berlin</p><div class="native-list">'+matching.map(x=>'<details><summary><strong>'+e(x.actor)+' · '+e(x.action)+'</strong><small>'+e(new Intl.DateTimeFormat('de-DE',{dateStyle:'medium',timeStyle:'medium',timeZone:'Europe/Berlin'}).format(new Date(x.at.replace(' ','T')+'Z')))+'</small></summary><p>Objekt: '+e(x.object_kind)+' · '+e(x.object_id)+'</p><p>Vorher: '+e(x.before_json||'—')+'</p><p>Nachher: '+e(x.after_json||'—')+'</p></details>').join('')+'</div>';
}
function renderReviews(target,term){
 const list=cache.reviews.filter(x=>(x.source_name+' '+x.category+' '+x.metric+' '+x.note).toLowerCase().includes(term.toLowerCase()));
 const categories={};cache.reviews.forEach(x=>{categories[x.category]=(categories[x.category]||0)+1});
 target.querySelector('#review-list-native').innerHTML=cards([['Offene Prüfungen',cache.reviews.length],...Object.entries(categories).slice(0,3)])+
  '<div class="native-list">'+list.slice(0,historyLimit).map(x=>'<details><summary><strong>'+e(x.source_name||'Unbekannt')+' · '+e(x.metric||'')+'</strong><small>'+e(x.category)+' · '+e(x.source_batch||'')+'</small></summary><p>'+e(x.note||'')+'</p><p>Erkannt: '+e(x.source_value??'unbekannt')+'</p><p class="native-muted">Originalbild noch nicht verknüpft. Keine Freigabe ohne Beleg.</p></details>').join('')+'</div>'+(list.length>historyLimit?'<button data-native-more="reviews">Weitere Fälle</button>':'');
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
  const button=event.target.closest('[data-officer-tab],[data-officer-logout],[data-native-member],[data-native-more],[data-native-train],[data-native-new],[data-native-edit],[data-native-refresh],[data-registry-edit]');
  if(!button)return;
  if(button.hasAttribute('data-officer-logout')){
   try{await request('/api/native-logout',{method:'POST',body:{}})}catch{}clearOfficer();await renderNativeAdmin(mount);return;
  }
  if(button.dataset.officerTab){panel=button.dataset.officerTab;pageLimit=20;historyLimit=20;await view(mount);return}
  if(button.hasAttribute('data-native-refresh')){await view(mount);return}
  const target=mount.querySelector('#native-admin-content');if(!target)return;
  if(button.dataset.registryEdit){editRegistry(target,button.dataset.registryEdit);return}
  if(button.dataset.nativeMember){await showPerson(target,button.dataset.nativeMember);return}
  if(button.dataset.nativeMore==='members'){pageLimit+=20;renderMembers(target,target.querySelector('#native-member-search')?.value||'');return}
  if(button.dataset.nativeMore==='train'){historyLimit+=20;renderTrain(target);return}
  if(button.dataset.nativeMore==='registry'){pageLimit+=20;renderRegistry(target,target.querySelector('#registry-search')?.value||'');return}
  if(button.dataset.nativeMore==='reviews'){historyLimit+=20;renderReviews(target,target.querySelector('#review-search-native')?.value||'');return}
  if(button.dataset.nativeTrain){editTrain(target,button.dataset.nativeTrain);return}
  if(button.dataset.nativeNew==='train'){editTrain(target,new Date().toISOString().slice(0,10));return}
  if(button.dataset.nativeNew||button.dataset.nativeEdit){editRecord(target,panel,button.dataset.nativeEdit||'');return}
 });
 mount.addEventListener('input',event=>{
  if(event.target.id==='native-member-search'){pageLimit=20;renderMembers(mount.querySelector('#native-admin-content'),event.target.value)}
  if(event.target.id==='registry-search'){pageLimit=20;renderRegistry(mount.querySelector('#native-admin-content'),event.target.value)}
  if(event.target.id==='activity-search')renderActivity(mount.querySelector('#native-admin-content'),event.target.value);
  if(event.target.id==='review-search-native'){historyLimit=20;renderReviews(mount.querySelector('#native-admin-content'),event.target.value)}
 });
 mount.addEventListener('change',event=>{if(event.target.id==='native-vs-week')renderVs(mount.querySelector('#native-admin-content'))});
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
   const payload={member_id:form.dataset.id,rank:form.elements.namedItem('rank').value,lifecycle:form.elements.namedItem('lifecycle').value,blacklisted:form.elements.namedItem('blacklisted').checked,reason:form.elements.namedItem('reason').value};
   if(!window.confirm('Mitgliedsänderung mit Audit-Log speichern?'))return;
   const button=form.querySelector('[type=submit]');button.disabled=true;
   try{await request('/api/member-registry',{method:'POST',body:payload});await view(mount)}
   catch(err){form.querySelector('#native-form-message').textContent=err.message;button.disabled=false}return;
  }
  if(form.id==='native-train-save'){form.dataset.kind='train';await saveForm(mount,form)}
  if(form.id==='native-record-save')await saveForm(mount,form);
 });
}
