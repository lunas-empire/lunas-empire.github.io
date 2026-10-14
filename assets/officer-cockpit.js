/** Read-only officer action priorities, using already localized interface phrases. */
const count=value=>Number.isSafeInteger(value)&&value>=0?value:0;
const openTask=item=>item&&!['done','completed','cancelled'].includes(item.status);
const weekFinal=week=>['final','confirmed'].includes(week?.state);
export function buildOfficerActions({today,summary={},operations={},trains={},vs=null,donations=null}={}){
 const items=[];
 let order=0;
 const add=(priority,action,art,eyebrow,title,detail)=>{
  items.push({priority,order:order++,action,art,eyebrow,title,detail});
 };
 const reviews=count(summary.reviews);
 if(reviews)add(0,'review-open','vs','DATEN · PRÜFAUFTRÄGE',
  reviews+' offene Prüffälle','Unbestätigte Werte prüfen · nicht automatisch als Fehler gewertet');
 const tasks=(operations.tasks||[]).filter(openTask);
 const due=tasks.filter(t=>t.due_date&&t.due_date<=today);
 if(due.length)add(1,'tasks-open','tasks','Admin-Aufgaben',
  due.length+' · '+due[0].due_date,'Aufgaben öffnen');
 const unstaffed=(operations.absences||[]).filter(a=>a.start_date<=today&&a.end_date>=today&&!a.substitute_id);
 if(unstaffed.length)add(2,'absences-open','today','Abwesenheiten',
  String(unstaffed.length),'Abwesenheiten & Vertretung');
 const slot=(trains.calendar||[]).find(x=>x.date===today);
 if(slot&&(!slot.entry||slot.entry.status==='planned'||slot.unavailable_driver||slot.entry.linked===false)){
  const detail=slot.unavailable_driver?'Abwesend':!slot.entry?'Fahrer noch nicht eingetragen':
   slot.entry.linked===false?'Zuordnung nicht verifiziert':'Geplant';
  add(3,'train-today','season','ZUG · HEUTE',slot.type||'Tageszug',detail);
 }
 // Use already loaded VS/donation data only; do not add repeated D1 scans.
 const week=vs?.weeks?.[0];
 if(weekFinal(week)){
  const flagged=(week.members||[]).filter(x=>x.repeatedLowDays===true&&count(x.failed)>0).length;
  if(flagged)add(4,'vs-open','vs','VS-Duell',flagged+' · '+week.week,'Tagesziel');
 }
 const donationWeek=donations?.weeks?.[0];
 if(donationWeek?.is_complete===true){
  const below=(donationWeek.members||[]).filter(x=>x.status==='below'&&Number.isSafeInteger(x.points)).length;
  if(below)add(5,'donations-open','vs','Allianzspenden',below+' · '+donationWeek.week,'Wochenauswertung');
 }
 const soon=(operations.events||[]).filter(x=>x.event_date>=today&&x.event_date<=addDays(today,7)&&
  !['completed','cancelled','failed'].includes(x.outcome)).sort((a,b)=>a.event_date.localeCompare(b.event_date));
 const noLead=soon.find(x=>!x.lead_id);
 if(noLead)add(6,'event-planning','hero','Allianz-Events',
  ({marshall_guard:'Marshall Guard',zombie_siege:'Zombie Siege'}[noLead.event_type]||'Allianz-Event'),
  noLead.event_date+' · Noch ohne zuständigen R4/R5');
 if(!due.length&&tasks.length)add(7,'tasks-open','tasks','Offene Aufgaben',
  String(tasks.length),'Aufgaben öffnen');
 return items.sort((a,b)=>a.priority-b.priority||a.order-b.order).slice(0,5);
}
function addDays(day,days){
 const d=new Date(day+'T12:00:00Z');
 if(Number.isNaN(d.getTime()))return day;
 d.setUTCDate(d.getUTCDate()+days);
 return d.toISOString().slice(0,10);
}
