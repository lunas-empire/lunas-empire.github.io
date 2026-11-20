export const readinessMetrics=['power','army_power','total_troops','hq','vip','t1_power','t2_power','t3_power','t4_power','drone','kills'];
const labels={power:['Stärke','Power'],army_power:['Armeestärke','Army power'],total_troops:['Gesamttruppen','Total troops'],hq:'HQ',vip:'VIP',t1_power:['T1-Stärke','T1 power'],t2_power:['T2-Stärke','T2 power'],t3_power:['T3-Stärke','T3 power'],t4_power:['T4-Stärke','T4 power'],drone:'Drone',kills:'Kills'};
const label=(key,en)=>Array.isArray(labels[key])?(en?labels[key][1]:labels[key][0]):labels[key]||key;

export function buildReadinessComparison(data={},metric='power'){
 const latest=data.batches?.[0]||null,previous=data.batches?.[1]||null;
 if(!latest||!readinessMetrics.includes(metric))return {latest,previous,metric:null,totalDelta:null,medianDelta:null};
 const current=latest.metrics?.[metric],prior=previous?.metrics?.[metric];
 return {latest,previous,metric,totalDelta:Number.isSafeInteger(current?.total)&&Number.isSafeInteger(prior?.total)?current.total-prior.total:null,
  medianDelta:Number.isSafeInteger(current?.median)&&Number.isSafeInteger(prior?.median)?current.median-prior.median:null};
}

export function renderReadiness(data={},options={}){
 const {metric='power',language='de',esc=String,numberText=String}=options,en=language==='en',text=(de,english)=>en?english:de,e=esc,n=numberText;
 const comparison=buildReadinessComparison(data,metric),latest=comparison.latest;
 if(!latest)return '<section class="native-readiness"><p class="native-muted">'+text('Noch keine angewandten LW-Beobachtungen für die Bereitschaft.','No applied LW observations for readiness yet.')+'</p></section>';
 const value=latest.metrics[metric],previous=comparison.previous?.metrics?.[metric];
 const change=(current,prior)=>current===null||prior===null||prior===undefined?text('Kein Vergleich','No comparison'):(current-prior>0?'+':'')+n(current-prior);
 const sources=[latest,...(comparison.previous?[comparison.previous]:[])].map((batch,index)=>'<article class="native-readiness-source"><small>'+text(index?'Vergleichsstand':'Aktueller Stand',index?'Comparison':'Latest')+'</small><strong>'+e(batch.report_date)+'</strong><span>'+n(batch.verified)+' '+text('bestätigte IDs','confirmed IDs')+' · '+n(batch.coverage)+'%</span></article>').join('');
 const field=(title,current)=> '<div><dt>'+e(title)+'</dt><dd>'+(current===null||current===undefined?'—':n(current))+'</dd></div>';
 const professions=latest.profession?.values||[],maximum=Math.max(...professions.map(item=>item.count),1);
 return '<section class="native-readiness"><div class="native-readiness-sources">'+sources+'</div>'+
  '<div class="native-readiness-toolbar"><label>'+text('Kennzahl','Metric')+'<select id="native-readiness-metric">'+readinessMetrics.map(key=>'<option value="'+key+'" '+(key===metric?'selected':'')+'>'+e(label(key,en))+'</option>').join('')+'</select></label></div>'+
  '<div class="native-readiness-kpis"><article><small>'+text('Gesamtwert','Total')+'</small><strong>'+(value.total===null?'—':n(value.total))+'</strong><b>'+change(value.total,previous?.total)+'</b></article>'+
  '<article><small>Median</small><strong>'+(value.median===null?'—':n(value.median))+'</strong><b>'+change(value.median,previous?.median)+'</b></article>'+
  '<article><small>'+text('Abdeckung','Coverage')+'</small><strong>'+n(value.verified)+'/'+n(data.active)+'</strong><b>'+n(value.coverage)+'%</b></article></div>'+
  '<dl class="native-readiness-distribution">'+field('P25',value.p25)+field('P75',value.p75)+field(text('Minimum','Minimum'),value.min)+field(text('Maximum','Maximum'),value.max)+'</dl>'+
  '<section class="native-readiness-professions"><h3>'+text('Professionen','Professions')+'</h3>'+(professions.length?professions.map(item=>'<div class="native-readiness-profession"><span>'+e(item.value)+'</span><div class="native-trend-track" aria-hidden="true"><i style="width:'+Math.round(item.count/maximum*100)+'%"></i></div><strong>'+n(item.count)+'</strong></div>').join(''):'<p class="native-muted">'+text('Keine bestätigten Professionswerte.','No confirmed profession values.')+'</p>')+'</section>'+
  '<p class="native-muted">'+text('Nur angewandte LW-Werte aktiver IDs. Keine Koordinaten, keine Mindestanforderung und keine automatische Aufstellung. Unbekannte Werte bleiben unbekannt.','Applied LW values for active IDs only. No coordinates, minimum requirement or automatic lineup. Unknown values remain unknown.')+'</p></section>';
}
