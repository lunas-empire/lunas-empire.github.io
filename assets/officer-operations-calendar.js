const datePlus=(day,count)=>{const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+count);return date.toISOString().slice(0,10)};
const protocolDate=item=>String(item.scheduled_server_time||item.game_timestamp||'').slice(0,10);
const finalOutcome=outcome=>['completed','failed','cancelled'].includes(outcome);

export function buildOperationsCalendar(operations={},trains={},days=14){
 const today=trains.today||operations.today||new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());
 const byDate=new Map();
 const add=(date,kind,item)=>{
  if(!/^20\d{2}-\d{2}-\d{2}$/.test(date))return;
  if(!byDate.has(date))byDate.set(date,[]);
  byDate.get(date).push({kind,...item});
 };
 for(const slot of trains.calendar||[]){
  if(slot.date>datePlus(today,days))continue;
  add(slot.date,'train',{date:slot.date,type:slot.type,driver:slot.entry?.driver||null,status:slot.entry?.status||'open',
   vip:slot.entry?.vip_name||null,absent:slot.unavailable_driver===true,id:slot.entry?slot.date:null});
 }
  for(const event of operations.events||[]){
  if(event.event_date>datePlus(today,days))continue;
  add(event.event_date,'event',{date:event.event_date,type:event.event_type,outcome:event.outcome,level:event.level,id:event.id});
 }
  for(const item of operations.protocolEvents||[]){
  const date=protocolDate(item);if(date>datePlus(today,days))continue;
  add(date,'protocol',{date,event:item.event,level:item.level,status:'observation'});
 }
  const dates=[...byDate.keys()].sort();
 const absences=(operations.absences||[]).filter(item=>!item.substitute_id&&item.start_date<=datePlus(today,days)&&item.end_date>=today);
 return dates.map(date=>({date,items:byDate.get(date),absences:absences.filter(item=>item.start_date<=date&&item.end_date>=date),
  overdue:date<today&&byDate.get(date).some(item=>(item.kind==='train'&&['open','planned','assigned'].includes(item.status))||
   (item.kind==='event'&&!finalOutcome(item.outcome)))}));
}

export function renderOperationsCalendar(operations,trains,{language='de',esc=String,days=14}={}){
 const en=language==='en',text=(de,english)=>en?english:de,e=esc;
 const rows=buildOperationsCalendar(operations,trains,days);
 const status=item=>{
  if(item.kind==='protocol')return text('Beobachtung · kein Abschluss','Observation · not completed');
  if(item.kind==='train')return item.absent?text('Fahrer abwesend','Driver absent'):item.status==='open'?text('Offen','Open'):item.status;
  return item.outcome||text('Nicht bestätigt','Unconfirmed');
 };
 const itemHtml=item=>'<div class="native-operations-item"><span><strong>'+e(item.type||item.event)+'</strong><small>'+e(status(item))+'</small></span><span>'+e(item.driver||'')+(item.vip?'<small>VIP: '+e(item.vip)+'</small>':'')+(item.level!==null&&item.level!==undefined?'<small>Level '+e(item.level)+'</small>':'')+'</span>'+(item.kind==='train'&&item.id?'<button type="button" data-native-train="'+e(item.id)+'">'+text('Zug öffnen','Open train')+'</button>':item.kind==='event'?'<button type="button" data-native-edit="'+e(item.id)+'">'+text('Eintrag öffnen','Open record')+'</button>':'')+'</div>';
 return '<details class="native-fold native-operations-calendar"><summary><span>'+text('Einsatzkalender','Operations calendar')+'</span><small>'+text('Nächste '+days+' Tage und fällige Nachweise','Next '+days+' days and overdue proofs')+'</small></summary><div class="native-fold-body">'+
  (rows.length?rows.map(day=>'<section class="native-operations-day'+(day.overdue?' is-overdue':'')+'"><h4>'+e(day.date)+(day.overdue?'<small> · '+text('Nachweis fällig','Proof overdue')+'</small>':'')+'</h4>'+day.items.map(itemHtml).join('')+(day.absences.length?'<p class="native-operations-absence">'+day.absences.length+text(' Abwesenheit(en) ohne Ersatz',' absence(s) without substitute')+'</p>':'')+'</section>').join(''):'<p class="native-muted">'+text('Keine geplanten Einsätze im gewählten Zeitraum.','No planned operations in the selected period.')+'</p>')+
  '<p class="native-muted">'+text('Ernennungen und Reservierungen bleiben Beobachtungen; Abschlüsse nur mit echtem Beleg.','Appointments and reservations remain observations; completion only with actual evidence.')+'</p></div></details>';
}
