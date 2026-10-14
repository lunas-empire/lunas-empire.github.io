/** Officer-reviewed English VS support report. Unknown is never zero. */
export function vsSupportChatReport(week,weeks=[]){
 if(!week)return 'No verified VS week selected.';
 const goal=Number.isSafeInteger(week.threshold)?week.threshold:null;
 const entries=(week.members||[]).map(m=>{
  const actual=(m.days||[]).filter(d=>d?.verified===true&&Number.isSafeInteger(d.points));
  const passed=goal===null?null:actual.filter(d=>d.points>=goal).length;
  const excused=m.excused===true||m.isExcused===true||m.isNew===true||m.newMember===true;
  const status=excused?'white':actual.length!==6||passed===null?'unknown':
    passed===6?'green':passed>=4?'yellow':passed>=2?'orange':'red';
  return {...m,status,passed,known:actual.length};
 });
 const groups=Object.fromEntries(['green','yellow','orange','red','white','unknown'].map(k=>[k,entries.filter(m=>m.status===k)]));
 const lines=[
  'RZSN VS SUPPORT REPORT — '+String(week.week||'week unknown')+' ('+(week.state==='final'?'final':'PROVISIONAL')+')',
  'Daily target: '+(goal===null?'unknown':goal.toLocaleString('en-US'))+' points.',
  'Weekly categories (six confirmed days required):',
  '🟢 6/6 goals: '+groups.green.length,
  '🟡 4–5/6 goals: '+groups.yellow.length,
  '🟠 2–3/6 goals: '+groups.orange.length,
  '🔴 0–1/6 goals: '+groups.red.length,
  '⚪ New / excused (explicit): '+groups.white.length,
  '❔ Incomplete / unknown: '+groups.unknown.length,
  '', 'Members needing a supportive check-in:'
 ];
 const priorities=[...groups.red,...groups.orange,...groups.yellow.filter(m=>m.failed>=2)]
  .sort((a,b)=>(b.failed||0)-(a.failed||0)||String(a.name).localeCompare(String(b.name)));
 const older=(weeks||[]).filter(w=>w.week!==week.week&&w.state==='final').slice(0,2);
 if(!priorities.length)lines.push('- None confirmed for this week; check missing values separately.');
 for(const m of priorities.slice(0,30)){
  const history=older.map(w=>(w.members||[]).find(x=>x.id===m.id))
   .filter(Boolean).map(x=>(Number.isSafeInteger(x.failed)?x.failed+'/6 days below':'unknown'));
  lines.push('- '+String(m.name||'Player').slice(0,65)+': '+(Number.isSafeInteger(m.failed)?m.failed+' confirmed day(s) below minimum':'confirmed count unknown')+
    (history.length?' | earlier: '+history.join(', '):'')+'; ask privately, offer help.');
 }
 if(priorities.length>30)lines.push('- '+(priorities.length-30)+' more; check the VS tracker.');
 lines.push('','Workflow: Track → notice patterns → contact players → understand why → help → monitor improvement.');
 lines.push('Do not judge anyone for one low-scoring day; compare 2–3 weeks of verified results.');
 lines.push('Ask about VS understanding, preparation, research/resources and time constraints. Help first; discuss consequences only if support does not work.');
 lines.push('Research polls and VS participation are separate. Not voting does NOT imply poor VS participation.');
 lines.push('No shield violations or research shortfalls are alleged without separate evidence.');
 lines.push('Editable officer draft, not sent automatically.');
 return lines.join('\n');
}
