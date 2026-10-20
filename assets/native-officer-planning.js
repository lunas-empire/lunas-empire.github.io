/** Protected R4/R5 planning modules. Data stays in the authenticated live view. */
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));

const coreCopy={
 de:['Offiziersplanung','Nur tatsächlich beobachtete Stufen eintragen. Abwesend ist ein eigener Status; unbekannt wird nie zu x1.','Positionen und Bestätigungen werden manuell erfasst. Leere Plätze bleiben leer.','Keine automatische Aufstellung','Auswirkungen prüfen','Nur Hinweise. Aufgaben, Werte und Planungen werden nicht automatisch geändert.','Keine bekannten Terminkonflikte.','Team A','Team B','Reserve','Offen','Bestätigt','Abgelehnt'],
 en:['Officer planning','Record only levels actually observed. Absent is a separate status; unknown never becomes x1.','Positions and confirmations are entered manually. Empty slots stay empty.','No automatic lineup','Review impacts','Advisory only. Tasks, values and plans are never changed automatically.','No known scheduling conflicts.','Team A','Team B','Reserve','Pending','Confirmed','Declined'],
 uk:['Планування офіцерів','Записуйте лише фактично побачені рівні. Відсутність — окремий статус; невідоме ніколи не стає x1.','Позиції та підтвердження вводяться вручну. Порожні місця залишаються порожніми.','Без автоматичного складу','Перевірити вплив','Лише попередження. Завдання, значення й плани автоматично не змінюються.','Відомих конфліктів розкладу немає.','Команда A','Команда B','Резерв','Очікується','Підтверджено','Відхилено'],
 ja:['オフィサー計画','実際に確認したレベルだけを記録します。欠席は別の状態で、不明をx1にはしません。','配置と確認は手動で入力します。空き枠は空のままです。','自動編成なし','影響を確認','注意情報のみです。タスク、値、計画は自動変更されません。','既知の予定競合はありません。','チームA','チームB','予備','保留','確認済み','辞退'],
 fr:['Planification officiers','Saisissez uniquement les niveaux réellement observés. Absent est un statut distinct ; inconnu ne devient jamais x1.','Les positions et confirmations sont saisies manuellement. Les places vides restent vides.','Aucune composition automatique','Vérifier les impacts','Informations uniquement. Les tâches, valeurs et plans ne sont jamais modifiés automatiquement.','Aucun conflit de calendrier connu.','Équipe A','Équipe B','Réserve','En attente','Confirmé','Refusé'],
 it:['Pianificazione ufficiali','Registra solo i livelli realmente osservati. Assente è uno stato distinto; sconosciuto non diventa mai x1.','Posizioni e conferme vengono inserite manualmente. I posti vuoti restano vuoti.','Nessuna formazione automatica','Verifica impatti','Solo avvisi. Attività, valori e piani non vengono modificati automaticamente.','Nessun conflitto di calendario noto.','Squadra A','Squadra B','Riserva','In attesa','Confermato','Rifiutato'],
 id:['Perencanaan perwira','Catat hanya level yang benar-benar diamati. Absen adalah status tersendiri; tidak diketahui tidak pernah menjadi x1.','Posisi dan konfirmasi dimasukkan manual. Slot kosong tetap kosong.','Tanpa susunan otomatis','Periksa dampak','Hanya peringatan. Tugas, nilai, dan rencana tidak diubah otomatis.','Tidak ada konflik jadwal yang diketahui.','Tim A','Tim B','Cadangan','Menunggu','Dikonfirmasi','Ditolak'],
 ar:['تخطيط الضباط','سجّل المستويات التي تمت ملاحظتها فعلياً فقط. الغياب حالة مستقلة، والمجهول لا يتحول أبداً إلى x1.','تُدخل المواقع والتأكيدات يدوياً. تبقى الخانات الفارغة فارغة.','لا تشكيل تلقائي','مراجعة التأثيرات','تنبيهات فقط. لا تتغير المهام أو القيم أو الخطط تلقائياً.','لا توجد تعارضات معروفة في المواعيد.','الفريق A','الفريق B','الاحتياط','قيد الانتظار','مؤكد','مرفوض'],
 ko:['장교 계획','실제로 확인한 레벨만 기록하세요. 불참은 별도 상태이며, 알 수 없음은 x1로 처리하지 않습니다.','위치와 확인은 수동으로 입력합니다. 빈 자리는 비워 둡니다.','자동 편성 없음','영향 검토','안내 전용입니다. 작업, 값, 계획은 자동으로 변경되지 않습니다.','알려진 일정 충돌이 없습니다.','A팀','B팀','예비','대기','확인됨','거절'],
 sv:['Officerarplanering','Registrera bara nivåer som faktiskt observerats. Frånvarande är en egen status; okänt blir aldrig x1.','Positioner och bekräftelser anges manuellt. Tomma platser förblir tomma.','Ingen automatisk uppställning','Granska påverkan','Endast information. Uppgifter, värden och planer ändras aldrig automatiskt.','Inga kända schemakonflikter.','Lag A','Lag B','Reserv','Väntar','Bekräftad','Avböjd'],
 pt:['Planeamento de oficiais','Regista apenas níveis realmente observados. Ausente é um estado próprio; desconhecido nunca se torna x1.','Posições e confirmações são introduzidas manualmente. Lugares vazios continuam vazios.','Sem escalação automática','Rever impactos','Apenas avisos. Tarefas, valores e planos nunca são alterados automaticamente.','Sem conflitos de agenda conhecidos.','Equipa A','Equipa B','Reserva','Pendente','Confirmado','Recusado'],
 nl:['Officiersplanning','Noteer alleen werkelijk waargenomen niveaus. Afwezig is een aparte status; onbekend wordt nooit x1.','Posities en bevestigingen worden handmatig ingevoerd. Lege plaatsen blijven leeg.','Geen automatische opstelling','Gevolgen controleren','Alleen waarschuwingen. Taken, waarden en plannen worden nooit automatisch gewijzigd.','Geen bekende planningsconflicten.','Team A','Team B','Reserve','Open','Bevestigd','Afgewezen'],
 th:['การวางแผนของเจ้าหน้าที่','บันทึกเฉพาะระดับที่สังเกตเห็นจริง การขาดเป็นสถานะแยก และไม่เปลี่ยนค่าที่ไม่ทราบเป็น x1','ตำแหน่งและการยืนยันต้องกรอกด้วยตนเอง ช่องว่างจะยังคงว่าง','ไม่มีการจัดทีมอัตโนมัติ','ตรวจสอบผลกระทบ','เป็นคำเตือนเท่านั้น งาน ค่า และแผนจะไม่ถูกเปลี่ยนอัตโนมัติ','ไม่พบตารางเวลาที่ขัดแย้งกัน','ทีม A','ทีม B','สำรอง','รอดำเนินการ','ยืนยันแล้ว','ปฏิเสธ'],
 km:['ផែនការមន្ត្រី','កត់ត្រាតែកម្រិតដែលបានឃើញពិតប្រាកដ។ អវត្តមានជាស្ថានភាពដាច់ដោយឡែក ហើយមិនស្គាល់មិនក្លាយជា x1 ទេ។','ទីតាំង និងការបញ្ជាក់ត្រូវបញ្ចូលដោយដៃ។ កន្លែងទំនេរនៅតែទំនេរ។','គ្មានការរៀបក្រុមស្វ័យប្រវត្តិ','ពិនិត្យផលប៉ះពាល់','សម្រាប់ជូនដំណឹងប៉ុណ្ណោះ។ កិច្ចការ តម្លៃ និងផែនការមិនត្រូវបានប្ដូរដោយស្វ័យប្រវត្តិទេ។','មិនមានការប៉ះទង្គិចកាលវិភាគដែលគេស្គាល់ទេ។','ក្រុម A','ក្រុម B','បម្រុង','កំពុងរង់ចាំ','បានបញ្ជាក់','បដិសេធ'],
 fil:['Pagpaplano ng opisyal','Itala lamang ang aktuwal na naobserbahang level. Hiwalay na status ang absent; hindi kailanman nagiging x1 ang unknown.','Manu-manong inilalagay ang posisyon at kumpirmasyon. Mananatiling bakante ang bakanteng slot.','Walang awtomatikong lineup','Suriin ang epekto','Babala lamang. Hindi awtomatikong binabago ang mga gawain, halaga, o plano.','Walang alam na salungatan sa iskedyul.','Team A','Team B','Reserve','Nakabinbin','Kumpirmado','Tumanggi']
};
const copyKeys=['planning','trialHelp','warHelp','noAuto','impact','impactHelp','noConflicts','teamA','teamB','reserve','pending','confirmed','declined'];
export function planningCopy(language='de'){
 const values=coreCopy[language]||coreCopy.de;
 return Object.fromEntries(copyKeys.map((key,index)=>[key,values[index]]));
}
export {escapeHtml as escapePlanningHtml};

const trialStatuses={planned:'Geplant',in_progress:'Läuft',completed:'Abgeschlossen',cancelled:'Abgesagt',not_started:'Nicht begonnen',started:'Begonnen',absent:'Abwesend'};
const roomStatuses={draft:'Entwurf',confirming:'Bestätigung läuft',locked:'Gesperrt',completed:'Abgeschlossen',cancelled:'Abgesagt'};
const warningKinds={task:'Aufgabe',event:'Event',train:'Zugfahrt',vs:'VS-Wert',absence:'Vertretung'};
const warningRoles={assignee:'zuständig',task_substitute:'Aufgabenvertretung',lead:'Leitung',event_substitute:'Eventvertretung',driver:'Zugfahrer',missing_value:'Wert unklar',absence_substitute:'Vertretung ebenfalls abwesend'};

export function renderImpactWarnings(warnings=[],language='de'){
 const text=planningCopy(language),rows=Array.isArray(warnings)?warnings:[];
 return '<section class="native-impact-warnings" aria-labelledby="native-impact-title"><div class="native-planning-heading"><div><span class="native-kicker">READ ONLY</span><h3 id="native-impact-title">'+escapeHtml(text.impact)+'</h3></div><span class="native-planning-count">'+rows.length+'</span></div><p class="native-muted">'+escapeHtml(text.impactHelp)+'</p>'+
  (rows.length?'<ul>'+rows.map(item=>'<li><span><strong>'+escapeHtml(item.member_name||'Unbekannt')+'</strong><small>'+escapeHtml(item.date||'')+' · '+escapeHtml(warningKinds[item.kind]||item.kind||'')+(item.related_title?' · '+escapeHtml(item.related_title):'')+'</small></span><b>'+escapeHtml(warningRoles[item.role]||item.role||'')+'</b></li>').join('')+'</ul>':'<p class="native-planning-empty">'+escapeHtml(text.noConflicts)+'</p>')+'</section>';
}

export function renderGeneralTrial(data,language='de'){
 const text=planningCopy(language),runs=Array.isArray(data?.runs)?data.runs:[],entries=Array.isArray(data?.entries)?data.entries:[];
 const cards=runs.map(run=>{
  const rows=entries.filter(entry=>entry.run_id===run.id);
  return '<article class="native-planning-card"><header><div><h3>'+escapeHtml(run.label)+'</h3><p>'+escapeHtml(run.trial_date)+' · '+escapeHtml(trialStatuses[run.status]||run.status)+'</p></div><div class="native-planning-row-actions"><button type="button" data-planning-edit-run="'+escapeHtml(run.id)+'">Bearbeiten</button><button type="button" data-planning-archive-run="'+escapeHtml(run.id)+'">Archivieren</button></div></header>'+
   '<div class="native-planning-table" role="region" aria-label="General Trial '+escapeHtml(run.label)+'" tabindex="0"><table><thead><tr><th>Spieler</th><th>Stufe</th><th>Status</th><th>Verbesserung</th><th><span class="sr-only">Aktion</span></th></tr></thead><tbody>'+
   (rows.length?rows.map(entry=>'<tr><td>'+escapeHtml(entry.member_name)+'</td><td>x'+escapeHtml(entry.trial_level)+'</td><td>'+escapeHtml(trialStatuses[entry.status]||entry.status)+'</td><td>'+(entry.improvement==null?'—':entry.improvement>0?'+'+escapeHtml(entry.improvement):escapeHtml(entry.improvement))+'</td><td><div class="native-planning-row-actions"><button type="button" data-planning-edit-entry="'+escapeHtml(entry.id)+'" aria-label="'+escapeHtml(entry.member_name)+' bearbeiten">Bearbeiten</button><button type="button" data-planning-archive-entry="'+escapeHtml(entry.id)+'" aria-label="'+escapeHtml(entry.member_name)+' archivieren">Archivieren</button></div></td></tr>').join(''):'<tr><td colspan="5">Noch keine Spielerwerte.</td></tr>')+
   '</tbody></table></div></article>';
 }).join('');
 return '<header class="native-planning-title"><div><span class="native-kicker">R4/R5 · NICHT VS</span><h2>General Trial x1–x9</h2><p>'+escapeHtml(text.trialHelp)+'</p></div><span class="native-planning-count">'+runs.length+'</span></header><div class="native-planning-actions"><button type="button" class="native-game-primary" data-planning-new-run>+ Durchgang</button><button type="button" data-planning-new-entry '+(runs.length?'':'disabled')+'>+ Spielerwert</button></div><div data-planning-form></div><div class="native-planning-list">'+(cards||'<p class="native-planning-empty">Noch kein General Trial erfasst.</p>')+'</div>';
}

export function renderDesertWarRoom(data,language='de'){
 const text=planningCopy(language),rooms=Array.isArray(data?.rooms)?data.rooms:[],slots=Array.isArray(data?.slots)?data.slots:[];
 const squadLabels={team_a:text.teamA,team_b:text.teamB,reserve:text.reserve};
 const confirmationLabels={pending:text.pending,confirmed:text.confirmed,declined:text.declined};
 const cards=rooms.map(room=>{
  const assigned=slots.filter(slot=>slot.room_id===room.id),confirmed=assigned.filter(slot=>slot.confirmation==='confirmed').length;
  return '<article class="native-planning-card"><header><div><h3>'+escapeHtml(room.title)+'</h3><p>'+escapeHtml(room.event_date)+' · '+escapeHtml(roomStatuses[room.status]||room.status)+' · '+confirmed+'/'+assigned.length+' '+escapeHtml(text.confirmed).toLocaleLowerCase()+'</p></div><div class="native-planning-row-actions"><button type="button" data-planning-edit-room="'+escapeHtml(room.id)+'">Bearbeiten</button><button type="button" data-planning-archive-room="'+escapeHtml(room.id)+'">Archivieren</button></div></header><div class="native-squad-grid">'+
   Object.entries(squadLabels).map(([squad,label])=>'<section aria-label="'+escapeHtml(label)+'"><h4>'+escapeHtml(label)+'</h4><ol>'+(assigned.filter(slot=>slot.squad===squad).sort((a,b)=>a.position-b.position).map(slot=>'<li><div class="native-planning-slot"><button type="button" data-planning-edit-slot="'+escapeHtml(slot.id)+'"><b>'+escapeHtml(slot.position)+'. '+escapeHtml(slot.member_name)+'</b><small>'+escapeHtml(slot.member_rank)+' · '+escapeHtml(slot.assignment_role==='captain'?'Captain':'Spieler')+' · '+escapeHtml(confirmationLabels[slot.confirmation]||slot.confirmation)+'</small></button><button type="button" data-planning-archive-slot="'+escapeHtml(slot.id)+'" aria-label="'+escapeHtml(slot.member_name)+' archivieren">×</button></div></li>').join('')||'<li class="native-planning-empty">Keine explizite Zuweisung.</li>')+'</ol></section>').join('')+'</div></article>';
 }).join('');
 return '<header class="native-planning-title"><div><span class="native-kicker">PRIVAT · R4/R5</span><h2>Desert Storm War Room</h2><p>'+escapeHtml(text.warHelp)+'</p><strong class="native-no-auto">'+escapeHtml(text.noAuto)+'</strong></div><span class="native-planning-count">'+rooms.length+'</span></header><div class="native-planning-actions"><button type="button" class="native-game-primary" data-planning-new-room>+ War Room</button><button type="button" data-planning-new-slot '+(rooms.length?'':'disabled')+'>+ Position</button></div><div data-planning-form></div><div class="native-planning-list">'+(cards||'<p class="native-planning-empty">Noch keine Aufstellung angelegt.</p>')+'</div>';
}

const optionList=(rows,current,label)=>rows.map(row=>'<option value="'+escapeHtml(row.id)+'" '+(row.id===current?'selected':'')+'>'+escapeHtml(label(row))+'</option>').join('');
function trialForm(data,kind,row={}){
 if(kind==='run')return '<form class="native-form native-planning-form" data-planning-save="trial-run" data-id="'+escapeHtml(row.id||'')+'"><h3>General Trial · Durchlauf</h3><label>Datum<input name="trial_date" type="date" required value="'+escapeHtml(row.trial_date||'')+'"></label><label>Bezeichnung<input name="label" required minlength="3" maxlength="120" value="'+escapeHtml(row.label||'General Trial')+'"></label><label>Status<select name="status">'+['planned','in_progress','completed','cancelled'].map(value=>'<option value="'+value+'" '+(row.status===value?'selected':'')+'>'+trialStatuses[value]+'</option>').join('')+'</select></label><label>Notiz<textarea name="notes" maxlength="1200">'+escapeHtml(row.notes||'')+'</textarea></label><label>Prüfgrund<input name="reason" minlength="8" maxlength="500" required></label><button type="submit" class="native-game-primary">Durchlauf speichern</button><button type="button" data-planning-cancel>Abbrechen</button><p role="status" aria-live="polite"></p></form>';
 return '<form class="native-form native-planning-form" data-planning-save="trial-entry" data-id="'+escapeHtml(row.id||'')+'"><h3>General Trial · Spielerwert</h3><label>Durchlauf<select name="run_id" required>'+optionList(data.runs,row.run_id,item=>item.trial_date+' · '+item.label)+'</select></label><label>Spieler<select name="member_id" required>'+optionList(data.members,row.member_id,item=>item.name+' · '+item.rank)+'</select></label><label>Stufe<select name="trial_level">'+Array.from({length:9},(_,index)=>index+1).map(value=>'<option value="'+value+'" '+(row.trial_level===value?'selected':'')+'>x'+value+'</option>').join('')+'</select></label><label>Status<select name="status">'+['not_started','started','completed','absent'].map(value=>'<option value="'+value+'" '+(row.status===value?'selected':'')+'>'+trialStatuses[value]+'</option>').join('')+'</select></label><label>Notiz<input name="notes" maxlength="500" value="'+escapeHtml(row.notes||'')+'"></label><label>Prüfgrund<input name="reason" minlength="8" maxlength="500" required></label><button type="submit" class="native-game-primary">Spielerwert speichern</button><button type="button" data-planning-cancel>Abbrechen</button><p role="status" aria-live="polite"></p></form>';
}
function warForm(data,kind,row={}){
 if(kind==='room')return '<form class="native-form native-planning-form" data-planning-save="war-room" data-id="'+escapeHtml(row.id||'')+'"><h3>Desert Storm · War Room</h3><label>Datum<input name="event_date" type="date" required value="'+escapeHtml(row.event_date||'')+'"></label><label>Titel<input name="title" required minlength="3" maxlength="120" value="'+escapeHtml(row.title||'Desert Storm')+'"></label><label>Status<select name="status">'+['draft','confirming','locked','completed','cancelled'].map(value=>'<option value="'+value+'" '+(row.status===value?'selected':'')+'>'+roomStatuses[value]+'</option>').join('')+'</select></label><label>Private Notiz<textarea name="private_notes" maxlength="2000">'+escapeHtml(row.private_notes||'')+'</textarea></label><label>Prüfgrund<input name="reason" required minlength="8" maxlength="500"></label><button type="submit" class="native-game-primary">War Room speichern</button><button type="button" data-planning-cancel>Abbrechen</button><p role="status" aria-live="polite"></p></form>';
 const text=planningCopy(data.language),squads={team_a:text.teamA,team_b:text.teamB,reserve:text.reserve},confirmations={pending:text.pending,confirmed:text.confirmed,declined:text.declined};
 return '<form class="native-form native-planning-form" data-planning-save="war-slot" data-id="'+escapeHtml(row.id||'')+'"><h3>Desert Storm · Position</h3><label>War Room<select name="room_id" required>'+optionList(data.rooms,row.room_id,item=>item.event_date+' · '+item.title)+'</select></label><label>Spieler<select name="member_id" required>'+optionList(data.members,row.member_id,item=>item.name+' · '+item.rank)+'</select></label><label>Gruppe<select name="squad">'+Object.entries(squads).map(([value,label])=>'<option value="'+value+'" '+(row.squad===value?'selected':'')+'>'+escapeHtml(label)+'</option>').join('')+'</select></label><label>Position<input name="position" type="number" min="1" max="50" required value="'+escapeHtml(row.position||1)+'"></label><label>Rolle<select name="assignment_role"><option value="player">Spieler</option><option value="captain" '+(row.assignment_role==='captain'?'selected':'')+'>Captain</option></select></label><label>Bestätigung<select name="confirmation">'+Object.entries(confirmations).map(([value,label])=>'<option value="'+value+'" '+(row.confirmation===value?'selected':'')+'>'+escapeHtml(label)+'</option>').join('')+'</select></label><label>Private Notiz<input name="private_note" maxlength="500" value="'+escapeHtml(row.private_note||'')+'"></label><label>Prüfgrund<input name="reason" required minlength="8" maxlength="500"></label><button type="submit" class="native-game-primary">Position speichern</button><button type="button" data-planning-cancel>Abbrechen</button><p role="status" aria-live="polite"></p></form>';
}

export function createOfficerPlanning({root,mode,request,language='de',role}){
 let data=null;
 const allowed=['R4','R5'].includes(role);
 const draw=()=>{root.innerHTML=mode==='trial'?renderGeneralTrial(data,language):renderDesertWarRoom(data,language)};
 const load=async()=>{
  if(!allowed){root.innerHTML='<p class="native-error" role="alert">R4/R5 authorization required.</p>';return}
  data=await request(mode==='trial'?'/api/general-trial':'/api/desert-war-room');
  data.language=language;draw();
 };
 const showForm=(kind,row={})=>{
  const host=root.querySelector('[data-planning-form]');
  host.innerHTML=mode==='trial'?trialForm(data,kind,row):warForm(data,kind,row);
  host.querySelector('input,select,textarea')?.focus();
  host.scrollIntoView({behavior:'smooth',block:'nearest'});
 };
 root.addEventListener('click',event=>{
  const target=event.target.closest('[data-planning-new-run],[data-planning-new-entry],[data-planning-edit-run],[data-planning-edit-entry],[data-planning-new-room],[data-planning-new-slot],[data-planning-edit-room],[data-planning-edit-slot],[data-planning-archive-run],[data-planning-archive-entry],[data-planning-archive-room],[data-planning-archive-slot],[data-planning-cancel]');
  if(!target)return;
  if(target.hasAttribute('data-planning-cancel')){target.closest('[data-planning-form]').innerHTML='';return}
  const archiveKind=['run','entry','room','slot'].find(kind=>target.hasAttribute('data-planning-archive-'+kind));
  if(archiveKind){
   const id=target.getAttribute('data-planning-archive-'+archiveKind),collection={run:'runs',entry:'entries',room:'rooms',slot:'slots'}[archiveKind];
   const current=data[collection].find(item=>item.id===id),dialog=root.ownerDocument.defaultView;
   const reason=dialog?.prompt('Archivierungsgrund (mindestens 8 Zeichen)');
   if(reason==null)return;
   if(reason.trim().length<8){dialog?.alert('Bitte einen aussagekräftigen Archivierungsgrund eingeben.');return}
   const endpoint=archiveKind==='run'?'/api/general-trial/runs/archive':archiveKind==='entry'?'/api/general-trial/entries/archive':archiveKind==='room'?'/api/desert-war-room/rooms/archive':'/api/desert-war-room/slots/archive';
   target.disabled=true;
   request(endpoint,{method:'POST',body:{id,expected_revision:current?.revision||0,reason}}).then(load).catch(error=>{target.disabled=false;dialog?.alert('Nicht archiviert: '+error.message)});
   return;
  }
  if(target.hasAttribute('data-planning-new-run'))showForm('run');
  else if(target.hasAttribute('data-planning-new-entry'))showForm('entry');
  else if(target.dataset.planningEditRun)showForm('run',data.runs.find(item=>item.id===target.dataset.planningEditRun));
  else if(target.dataset.planningEditEntry)showForm('entry',data.entries.find(item=>item.id===target.dataset.planningEditEntry));
  else if(target.hasAttribute('data-planning-new-room'))showForm('room');
  else if(target.hasAttribute('data-planning-new-slot'))showForm('slot');
  else if(target.dataset.planningEditRoom)showForm('room',data.rooms.find(item=>item.id===target.dataset.planningEditRoom));
  else if(target.dataset.planningEditSlot)showForm('slot',data.slots.find(item=>item.id===target.dataset.planningEditSlot));
 });
 root.addEventListener('submit',async event=>{
  const form=event.target;if(!form.matches('[data-planning-save]'))return;
  event.preventDefault();
  const values=Object.fromEntries(new FormData(form)),kind=form.dataset.planningSave;
  if(kind==='trial-entry')values.trial_level=Number(values.trial_level);
  if(kind==='war-slot')values.position=Number(values.position);
  const collection=kind==='trial-run'?'runs':kind==='trial-entry'?'entries':kind==='war-room'?'rooms':'slots';
  const current=form.dataset.id?data[collection].find(item=>item.id===form.dataset.id):null;
  if(current)values.id=current.id;
  values.expected_revision=current?.revision||0;
  if(kind==='war-room')values.event_id=current?.event_id||null;
  const endpoint={
   'trial-run':'/api/general-trial/runs','trial-entry':'/api/general-trial/entries',
   'war-room':'/api/desert-war-room/rooms','war-slot':'/api/desert-war-room/slots'
  }[kind];
  const button=form.querySelector('[type=submit]'),status=form.querySelector('[role=status]');button.disabled=true;
  try{await request(endpoint,{method:'POST',body:values});await load()}
  catch(error){status.textContent=(error.status===409?'Eintrag wurde geändert. Bitte neu laden. ':'Nicht gespeichert: ')+error.message;button.disabled=false}
 });
 return {load};
}
