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
export function safeMailText(text){
 const value=String(text||'').trim();
 // Never cut a report in half or imply that a truncated number is reliable.
 return value.length<=ALLIANCE_MAIL_LIMIT?value:null;
}
