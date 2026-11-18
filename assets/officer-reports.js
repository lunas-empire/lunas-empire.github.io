/** Evidence-aware, copy-only English officer briefs. No background sends or invented measurements. */
const valid=value=>Number.isSafeInteger(value)&&value>=0?value:null;
const number=value=>valid(value)===null?'unknown':valid(value).toLocaleString('en-US');
const weekLabel=week=>String(week?.week||'unknown week').slice(0,24);
export const ALLIANCE_MAIL_LIMIT=500;
export function dailyOfficerBrief({date,overview,operations,trains}={}){
 const tasks=(operations?.tasks||[]).filter(t=>!['done','completed','cancelled'].includes(t.status));
 const due=tasks.filter(t=>t.due_date&&t.due_date<=date).length;
 const absences=(operations?.absences||[]).filter(a=>a.start_date<=date&&a.end_date>=date&&!a.substitute_id).length;
 const ride=(trains?.calendar||[]).find(s=>s.date===date);
 const status=!ride?'train calendar unavailable':!ride.entry?'no driver registered':
  ride.unavailable_driver?'assigned driver absent':ride.entry.status==='completed'?'ride marked completed':
  ride.entry.status==='planned'?'ride planned, not yet confirmed':'ride status '+String(ride.entry.status).slice(0,20);
 const reviews=valid(overview?.reviews);
 return [
  'RZSN officer brief — '+String(date||'date unknown')+'.',
  'Open tasks: '+tasks.length+' ('+due+' due).',
  'Absences without substitute today: '+absences+'.',
  'OCR reviews: '+(reviews===null?'unknown':reviews)+'.',
  'Train: '+status+'.',
  'Check records before action; no automatic sanctions.'
 ].join(' ');
}
export function vsWeeklyMail(week,policy={}){
 if(!week)return 'No verified Alliance Duel week is available for a report.';
 const final=week.state==='final';
 const lines=[
  'RZSN Alliance Duel '+weekLabel(week)+' — '+(final?'final':'provisional, not final')+'.',
  'Verified under-target days: '+number(week.failedDays)+'.',
  'Unknown day entries: '+number(week.unknownDays)+'.',
  'Players meeting all six daily goals: '+number(week.perfect)+'.',
  'Repeated low-day alerts: '+number(week.priority)+'.',
  'Daily goal: '+number(valid(week.threshold)??valid(policy.minimum))+'.',
  'Only observed/approved-corrected values count; unknown is not zero.'
 ];
 return lines.join(' ');
}
export function donationsWeeklyMail(week,minimum){
 if(!week)return 'No verified weekly research donation snapshot is available for a report.';
 const known=valid(week.verified);
 const active=valid(week.active);
 const label=week.is_complete===true?'complete roster capture':'partial capture';
 const date=week.captured_at?String(week.captured_at).slice(0,10):'date unknown';
 return [
  'RZSN research donations '+weekLabel(week)+' ('+label+', '+date+').',
  'Verified: '+number(known)+'/'+number(active)+'.',
  'At or above '+number(valid(minimum))+' weekly: '+number(week.met)+'.',
  'Verified below: '+number(week.below)+'.',
  'Unknown: '+number(week.unknown)+'.',
  'This is the captured point in time, not proof of final weekly totals.'
 ].join(' ');
}
export function donationHistory(weeks){
 const ordered=[...new Map((Array.isArray(weeks)?weeks:[]).filter(week=>week?.week).map(week=>[String(week.week),week])).values()]
  .sort((a,b)=>String(b.week).localeCompare(String(a.week)));
 return ordered.map(week=>{
  const confirmed=Number.isSafeInteger(week.verified)?week.verified:null,met=Number.isSafeInteger(week.met)?week.met:null;
  return {week:String(week.week),confirmed,met,unknown:Number.isSafeInteger(week.unknown)?week.unknown:null,
   percent:confirmed>0&&met!==null?Math.round(100*met/confirmed):null,complete:week.is_complete===true};
 });
}
export function donationReportText(week,{minimum=20000,language='de'}={}){
 const en=language==='en',text=(de,english)=>en?english:de,number=value=>Number(value).toLocaleString(en?'en-US':'de-DE');
 const members=Array.isArray(week?.members)?week.members:[],lines=['RZSN '+text('Allianzspenden','Alliance donations')+' | '+weekLabel(week),
  text('Momentaufnahme; kein finales Wochenergebnis. Unbekannt ist nicht 0.','Point-in-time snapshot; not a final weekly result. Unknown is not zero.'),
  text('Wochenziel','Weekly goal')+': '+number(minimum)+' | '+text('Ziel erreicht','Goal met')+': '+number(week?.met??0)+'/'+number(week?.verified??0)+
  ' | '+text('Unter Ziel','Below goal')+': '+number(week?.below??0)+' | '+text('Unbekannt','Unknown')+': '+number(week?.unknown??0)];
 const append=(title,items,detail)=>{lines.push('',title+' ('+items.length+')');if(items.length)for(const item of items)lines.push(item.name+' — '+detail(item));else lines.push(text('Keine Spieler in dieser Gruppe.','No players in this group.'))};
 append(text('Unter Wochenziel','Below weekly goal'),members.filter(item=>item.status==='below'),item=>number(item.points)+' / '+number(minimum)+' ('+number(item.difference)+')');
 append(text('Nicht bestätigt','Not confirmed'),members.filter(item=>item.status==='unknown'),()=>text('Wert unbekannt','Value unknown'));
 append(text('Positive Entwicklung','Positive progress'),members.filter(item=>Number.isSafeInteger(item.delta)&&item.delta>0),item=>'+'+number(item.delta)+' '+(item.previous_week||''));
 lines.push('',text('Nur bestätigte Werte derselben member_id; keine automatische Sanktion.','Only confirmed values for the same member_id; no automatic sanctions.'));
 return lines.join('\n');
}
export function renderDonationHistory(weeks,currentWeek,{language='de',esc=String,numberText=String}={}){
 const history=donationHistory(weeks),en=language==='en',e=esc,n=numberText,text=(de,english)=>en?english:de;
 if(!history.length)return '';
 return '<details class="native-fold native-vs-history native-donation-history"><summary><span>'+text('Wochenverlauf','Weekly history')+'</span><small>'+history.length+' '+text('Wochen · zum Wechseln antippen','weeks · tap to open')+'</small></summary>'+
  '<div class="native-fold-body"><div class="native-vs-history-chart" aria-label="'+text('Spendenzielquote je Woche','Donation goal attainment by week')+'">'+
  history.map(item=>'<button type="button" class="native-vs-history-row" data-native-donation-history-week="'+e(item.week)+'" aria-pressed="'+(item.week===currentWeek)+'">'+
   '<strong>'+e(item.week)+'</strong><span class="native-vs-history-track" aria-hidden="true"><i style="width:'+(item.percent??0)+'%"></i></span>'+
   '<b>'+(item.percent===null?'—':n(item.percent)+'%')+'</b><small>'+(item.met===null||item.confirmed===null?'—':n(item.met)+'/'+n(item.confirmed)+' '+text('bestätigt','confirmed'))+
   (item.unknown?' · '+n(item.unknown)+' '+text('unklar','unknown'):'')+' · '+text(item.complete?'vollständige Aufnahme':'Teilaufnahme',item.complete?'complete capture':'partial capture')+'</small></button>').join('')+
  '</div><p class="native-muted">'+text('Zielerreichung unter bestätigten Wochenspenden. Unbekannte Werte fehlen im Nenner; die Aufnahme ist kein finales Wochenergebnis.','Goal attainment among confirmed weekly donations. Unknown values are excluded from the denominator; a capture is not a final weekly result.')+'</p></div></details>';
}
export function safeMailText(text){
 const value=String(text||'').trim();
 // Never cut a report in half or imply that a truncated number is reliable.
 return value.length<=ALLIANCE_MAIL_LIMIT?value:null;
}
