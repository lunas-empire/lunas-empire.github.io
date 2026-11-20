const cutoff=(latest,days)=>{
 if(!latest||days==='all')return null;
 const date=new Date(latest+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-Number(days));return date.toISOString().slice(0,10);
};

export function filterEventInsights(data={},type='all',range='all'){
 const runs=(data.runs||[]).filter(event=>(type==='all'||event.event_type===type)&&(!cutoff(data.runs?.[0]?.event_date,range)||event.event_date>=cutoff(data.runs?.[0]?.event_date,range)));
 const ids=new Set(runs.map(event=>event.id));
 return {runs,series:(data.series||[]).filter(event=>ids.has(event.id)),summary:{total:runs.length,
  completed:runs.filter(event=>event.outcome==='completed').length,failed:runs.filter(event=>event.outcome==='failed').length,
  cancelled:runs.filter(event=>event.outcome==='cancelled').length,scheduled:runs.filter(event=>event.outcome==='scheduled').length}};
}

export function renderEventInsights(data={},options={}){
 const {type='all',range='all',language='de',esc=String,numberText=String}=options,en=language==='en',text=(de,english)=>en?english:de,e=esc,n=numberText;
 const filtered=filterEventInsights(data,type,range),types=[...new Set((data.runs||[]).map(event=>event.event_type))];
 const counts=[['completed',text('Abgeschlossen','Completed')],['failed',text('Fehlgeschlagen','Failed')],['cancelled',text('Abgesagt','Cancelled')],['scheduled',text('Geplant','Scheduled')]];
 const series=filtered.series.slice().reverse(),maxLevel=Math.max(...series.map(event=>event.level??0),1),maxAttendance=Math.max(...series.map(event=>event.attendance??0),1);
 return '<section class="native-event-insights"><div class="native-event-insight-toolbar"><label>'+text('Eventtyp','Event type')+'<select id="native-event-insight-type"><option value="all">'+text('Alle','All')+'</option>'+types.map(value=>'<option value="'+e(value)+'" '+(type===value?'selected':'')+'>'+e(value)+'</option>').join('')+'</select></label>'+
  '<label>'+text('Zeitraum','Period')+'<select id="native-event-insight-range">'+[['30','30 '+text('Tage','days')],['90','90 '+text('Tage','days')],['all',text('Alle','All')]].map(([value,label])=>'<option value="'+value+'" '+(range===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label></div>'+
  '<div class="native-event-insight-counts">'+counts.map(([key,label])=>'<article><small>'+e(label)+'</small><strong>'+n(filtered.summary[key])+'</strong></article>').join('')+'</div>'+
  '<details class="native-fold native-event-outcome-chart"><summary>'+text('Abgeschlossene Runs im Verlauf','Completed runs over time')+'</summary><div class="native-fold-body">'+(series.length?series.map(event=>'<div class="native-event-series-row"><span><strong>'+e(event.event_date)+'</strong><small>'+e(event.event_type)+'</small></span>'+
   '<span>Level '+(event.level===null?'—':n(event.level))+'<i class="native-event-level-track" aria-hidden="true"><b style="width:'+(event.level===null?0:Math.round(event.level/maxLevel*100))+'%"></b></i></span>'+
   '<span>'+text('Teilnahme','Attendance')+' '+(event.attendance===null?'—':n(event.attendance))+'<i class="native-event-level-track" aria-hidden="true"><b style="width:'+(event.attendance===null?0:Math.round(event.attendance/maxAttendance*100))+'%"></b></i></span></div>').join(''):'<p class="native-muted">'+text('Keine abgeschlossenen Runs im Filter.','No completed runs in this filter.')+'</p>')+'</div></details>'+
  '<div class="native-event-insight-runs">'+(filtered.runs.length?filtered.runs.slice(0,8).map(event=>'<article><span><strong>'+e(event.event_type)+'</strong><small>'+e(event.event_date)+' · '+e(event.outcome)+'</small></span><span>'+(event.level===null?'':'Level '+n(event.level))+'</span><button type="button" data-native-edit="'+e(event.id)+'">'+text('Eintrag öffnen','Open record')+'</button></article>').join(''):'<p class="native-muted">'+text('Keine Eventdatensätze im Filter.','No event records in this filter.')+'</p>')+'</div>'+
  '<p class="native-muted">'+text('Nur manuell bestätigte Event-Runs. Protokollbeobachtungen sind keine Abschlüsse; Einzelteilnahme ist nicht erfasst.','Explicitly recorded event runs only. Protocol observations are not completions; individual participation is unavailable.')+'</p></section>';
}
